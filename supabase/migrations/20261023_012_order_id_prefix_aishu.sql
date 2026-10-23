-- ==============================================================================
-- Migration: 20261023_012_order_id_prefix_aishu.sql
-- Description: Production-grade, schema-compatible place_order_secure RPC.
--              Fully hardened with sequences, advisory locks, strict item validation,
--              coupon integrity, deterministic row locks, and exact schema alignment.
-- ==============================================================================

-- 1. Ensure required cryptographic extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Database Sequences for Collision-Free Identifiers
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 10001;
CREATE SEQUENCE IF NOT EXISTS public.tracking_code_seq START WITH 100001;

-- Synchronize sequences with existing data to prevent any collision
SELECT setval(
    'public.order_number_seq',
    GREATEST(10001, COALESCE((
        SELECT MAX(SUBSTRING(order_number FROM '[0-9]+')::BIGINT) 
        FROM public.orders 
        WHERE order_number ~ '[0-9]+'
    ), 0) + 1),
    false
);

SELECT setval(
    'public.tracking_code_seq',
    GREATEST(100001, COALESCE((
        SELECT MAX(SUBSTRING(tracking_code FROM '[0-9]+')::BIGINT) 
        FROM public.orders 
        WHERE tracking_code ~ '[0-9]+'
    ), 0) + 1),
    false
);

-- 3. Justified Column Extensions (Safe & Idempotent)
ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS payment_session_token TEXT,
    ADD COLUMN IF NOT EXISTS payment_token_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
    ADD COLUMN IF NOT EXISTS idempotency_payload_hash TEXT,
    ADD COLUMN IF NOT EXISTS applied_coupon_code TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_payment_token 
    ON public.orders (payment_session_token) 
    WHERE payment_session_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key 
    ON public.orders (idempotency_key) 
    WHERE idempotency_key IS NOT NULL AND idempotency_key <> '';

-- Ensure coupon scope columns exist with safe defaults
ALTER TABLE public.coupons
    ADD COLUMN IF NOT EXISTS applies_to TEXT DEFAULT 'all',
    ADD COLUMN IF NOT EXISTS target_category TEXT,
    ADD COLUMN IF NOT EXISTS target_product_id TEXT,
    ADD COLUMN IF NOT EXISTS max_discount NUMERIC;

-- 4. Authoritative place_order_secure RPC
CREATE OR REPLACE FUNCTION public.place_order_secure(
    p_order_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_customer JSONB;
    v_address JSONB;
    v_items JSONB;
    v_payment_method TEXT;
    v_coupon_code TEXT;
    v_delivery_notes TEXT;
    v_idempotency_key TEXT;
    v_payload_hash TEXT;
    
    -- Processing variables
    v_item_element JSONB;
    v_agg_rec RECORD;
    v_item_rec RECORD;
    v_item_idx INT := 0;
    
    v_db_product RECORD;
    v_db_price NUMERIC;
    v_weight_count INT;
    v_item_subtotal NUMERIC;
    v_subtotal NUMERIC := 0;
    
    -- Coupon verification variables
    v_coupon_rec RECORD;
    v_coupon_discount NUMERIC := 0;
    v_coupon_eligible_subtotal NUMERIC := 0;
    
    -- Delivery & Totals
    v_delivery_fee NUMERIC := 49.00;
    v_total_discount NUMERIC := 0;
    v_grand_total NUMERIC := 0;
    
    -- Identifiers
    v_order_id TEXT;
    v_order_number TEXT;
    v_tracking_code TEXT;
    v_payment_session_token TEXT;
    v_payment_token_expires_at TIMESTAMPTZ;
    v_payment_status TEXT;
    v_customer_name TEXT;
    v_customer_phone TEXT;
    v_customer_email TEXT;
    v_created_at TIMESTAMPTZ := NOW();
    v_existing_order RECORD;
    
    -- Internal array to store validated line items
    v_validated_items JSONB := '[]'::jsonb;
BEGIN
    -- -------------------------------------------------------------------------
    -- 1. Input Sanitization & Preliminary Payload Verification
    -- -------------------------------------------------------------------------
    IF p_order_payload IS NULL OR jsonb_typeof(p_order_payload) <> 'object' THEN
        RAISE EXCEPTION 'Order payload must be a valid JSON object.';
    END IF;

    v_customer := p_order_payload->'customer';
    v_address := p_order_payload->'delivery_address';
    v_items := p_order_payload->'items';
    v_payment_method := TRIM(COALESCE(p_order_payload->>'payment_method', 'COD'));
    v_coupon_code := TRIM(UPPER(COALESCE(p_order_payload->>'coupon_code', '')));
    v_delivery_notes := TRIM(COALESCE(p_order_payload->>'delivery_notes', ''));

    IF v_customer IS NULL OR v_address IS NULL OR v_items IS NULL THEN
        RAISE EXCEPTION 'Missing required order structure: customer, delivery_address, and items are required.';
    END IF;

    v_customer_name := TRIM(COALESCE(v_customer->>'name', ''));
    v_customer_phone := REGEXP_REPLACE(COALESCE(v_customer->>'phone', ''), '[^0-9]', '', 'g');
    v_customer_email := TRIM(LOWER(COALESCE(v_customer->>'email', '')));

    IF LENGTH(v_customer_name) < 2 THEN
        RAISE EXCEPTION 'Customer name must be at least 2 characters.';
    END IF;

    IF LENGTH(v_customer_phone) < 10 THEN
        RAISE EXCEPTION 'A valid 10-digit mobile number is required.';
    END IF;

    IF v_customer_email = '' THEN
        v_customer_email := 'guest_' || v_customer_phone || '@aishufoods.com';
    END IF;

    IF (v_address->>'address') IS NULL OR LENGTH(TRIM(v_address->>'address')) < 5 THEN
        RAISE EXCEPTION 'Please provide a complete street delivery address.';
    END IF;

    IF (v_address->>'pincode') IS NULL OR LENGTH(TRIM(v_address->>'pincode')) < 5 THEN
        RAISE EXCEPTION 'Please provide a valid 6-digit postal PIN code.';
    END IF;

    -- Validate that items is a non-empty array
    IF jsonb_typeof(v_items) <> 'array' THEN
        RAISE EXCEPTION 'Order items must be provided as a JSON array.';
    END IF;

    IF jsonb_array_length(v_items) = 0 THEN
        RAISE EXCEPTION 'Cannot place order: Cart is empty.';
    END IF;

    IF jsonb_array_length(v_items) > 50 THEN
        RAISE EXCEPTION 'Cart exceeds maximum permissible limit of 50 distinct items.';
    END IF;

    -- -------------------------------------------------------------------------
    -- 2. Strict Line-by-Line Item Validation (Rejects invalid/non-positive quantities)
    -- -------------------------------------------------------------------------
    FOR v_item_element IN SELECT * FROM jsonb_array_elements(v_items) LOOP
        IF jsonb_typeof(v_item_element) <> 'object' THEN
            RAISE EXCEPTION 'Each cart item entry must be a valid JSON object.';
        END IF;

        IF TRIM(COALESCE(v_item_element->>'product_id', '')) = '' THEN
            RAISE EXCEPTION 'Each cart item must specify a valid, non-empty product_id.';
        END IF;

        IF (v_item_element->>'quantity') IS NULL 
           OR NOT (v_item_element->>'quantity' ~ '^[1-9][0-9]*$') THEN
            RAISE EXCEPTION 'Invalid quantity for product %. Quantity must be a positive integer.', 
                v_item_element->>'product_id';
        END IF;

        IF (v_item_element->>'quantity')::INT > 50 THEN
            RAISE EXCEPTION 'Quantity for product % exceeds maximum permissible line limit of 50.', 
                v_item_element->>'product_id';
        END IF;
    END LOOP;

    -- -------------------------------------------------------------------------
    -- 3. Concurrency-Safe Idempotency & Payload Hash Verification
    -- -------------------------------------------------------------------------
    v_idempotency_key := TRIM(COALESCE(p_order_payload->>'idempotency_key', ''));
    v_payload_hash := md5(jsonb_build_object(
        'customer_phone', v_customer_phone,
        'items', v_items,
        'payment_method', v_payment_method,
        'coupon_code', v_coupon_code
    )::text);

    IF v_idempotency_key <> '' THEN
        -- Advisory lock serializes concurrent retries for the exact same key
        PERFORM pg_advisory_xact_lock(hashtext('place_order_' || v_idempotency_key));

        SELECT id, order_number, tracking_code, subtotal, delivery_fee, 
               discount_amount, grand_total, order_status, payment_status, created_at,
               payment_session_token, delivery_address_json, idempotency_payload_hash,
               payment_method, applied_coupon_code
        INTO v_existing_order
        FROM public.orders
        WHERE idempotency_key = v_idempotency_key;

        IF FOUND THEN
            -- Prevent reusing same idempotency key for different payload content
            IF v_existing_order.idempotency_payload_hash IS NOT NULL 
               AND v_existing_order.idempotency_payload_hash <> v_payload_hash THEN
                RAISE EXCEPTION 'Idempotency key "%" was already used for a different order payload.', v_idempotency_key;
            END IF;

            RETURN jsonb_build_object(
                'success', true,
                'is_duplicate', true,
                'message', 'Order already placed previously for this request session.',
                'order_id', v_existing_order.id,
                'order_number', v_existing_order.order_number,
                'tracking_code', v_existing_order.tracking_code,
                'payment_session_token', v_existing_order.payment_session_token,
                'subtotal', v_existing_order.subtotal,
                'delivery_fee', v_existing_order.delivery_fee,
                'discount_amount', v_existing_order.discount_amount,
                'grand_total', v_existing_order.grand_total,
                'payment_method', COALESCE(v_existing_order.payment_method, v_payment_method),
                'payment_status', v_existing_order.payment_status,
                'order_status', v_existing_order.order_status,
                'applied_coupon_code', v_existing_order.applied_coupon_code,
                'delivery_address', v_existing_order.delivery_address_json,
                'items_count', jsonb_array_length(v_items),
                'created_at', v_existing_order.created_at
            );
        END IF;
    END IF;

    -- -------------------------------------------------------------------------
    -- 4. Aggregate Demanded Quantities & Lock Rows in Deterministic Order
    -- -------------------------------------------------------------------------
    FOR v_agg_rec IN 
        SELECT 
            x.product_id,
            SUM((x.quantity)::INT) AS total_demanded_qty
        FROM jsonb_to_recordset(v_items) AS x(
            product_id TEXT,
            quantity TEXT
        )
        GROUP BY x.product_id
        ORDER BY x.product_id ASC
    LOOP
        -- Lock each product row in sorted ascending ID order to avoid deadlocks
        SELECT id, name, inventory_count, out_of_stock, price, category_id
        INTO v_db_product
        FROM public.products
        WHERE id = v_agg_rec.product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % does not exist in store catalog.', v_agg_rec.product_id;
        END IF;

        IF v_db_product.out_of_stock = true OR COALESCE(v_db_product.inventory_count, 0) < v_agg_rec.total_demanded_qty THEN
            RAISE EXCEPTION 'Insufficient stock for "%". Total requested %, but only % available.', 
                v_db_product.name, v_agg_rec.total_demanded_qty, GREATEST(0, COALESCE(v_db_product.inventory_count, 0));
        END IF;
    END LOOP;

    -- -------------------------------------------------------------------------
    -- 5. Strict Weight Option Validation & Price Accumulation
    -- -------------------------------------------------------------------------
    FOR v_item_rec IN 
        SELECT 
            x.product_id,
            TRIM(COALESCE(x.selected_weight, '')) AS selected_weight,
            (x.quantity)::INT AS quantity
        FROM jsonb_to_recordset(v_items) AS x(
            product_id TEXT,
            selected_weight TEXT,
            quantity TEXT
        )
    LOOP
        v_item_idx := v_item_idx + 1;

        SELECT id, name, price, category_id
        INTO v_db_product
        FROM public.products
        WHERE id = v_item_rec.product_id;

        -- Count configured weight options for this product
        SELECT COUNT(*) INTO v_weight_count
        FROM public.product_weight_options
        WHERE product_id = v_item_rec.product_id;

        IF v_weight_count > 0 THEN
            -- Product HAS weight options: must match an exact weight label
            SELECT price INTO v_db_price
            FROM public.product_weight_options
            WHERE product_id = v_item_rec.product_id
              AND LOWER(TRIM(weight_label)) = LOWER(v_item_rec.selected_weight)
            LIMIT 1;

            IF v_db_price IS NULL THEN
                RAISE EXCEPTION 'Selected weight "%" is not valid or available for product "%".', 
                    v_item_rec.selected_weight, v_db_product.name;
            END IF;
        ELSE
            -- Product does NOT have weight options: use base product price
            v_db_price := v_db_product.price;
        END IF;

        IF v_db_price IS NULL OR v_db_price <= 0 THEN
            RAISE EXCEPTION 'Invalid calculated price for item %.', v_db_product.name;
        END IF;

        v_item_subtotal := ROUND(v_db_price * v_item_rec.quantity, 2);
        v_subtotal := v_subtotal + v_item_subtotal;

        -- Buffer validated item for insertion
        v_validated_items := v_validated_items || jsonb_build_object(
            'product_id', v_item_rec.product_id,
            'product_name', v_db_product.name,
            'category_id', v_db_product.category_id,
            'selected_weight', COALESCE(NULLIF(v_item_rec.selected_weight, ''), 'Standard'),
            'unit_price', v_db_price,
            'quantity', v_item_rec.quantity,
            'line_total', v_item_subtotal
        );
    END LOOP;

    -- -------------------------------------------------------------------------
    -- 6. Authoritative Coupon Verification
    -- -------------------------------------------------------------------------
    IF v_coupon_code <> '' THEN
        SELECT * INTO v_coupon_rec
        FROM public.coupons
        WHERE UPPER(TRIM(code)) = v_coupon_code
          AND is_enabled = true
        FOR UPDATE;

        IF FOUND THEN
            -- Expiry check
            IF v_coupon_rec.expiry_date IS NOT NULL AND v_coupon_rec.expiry_date < CURRENT_DATE THEN
                RAISE EXCEPTION 'Coupon "%" has expired.', v_coupon_code;
            END IF;

            -- Minimum order subtotal check
            IF v_subtotal < COALESCE(v_coupon_rec.min_order_amount, 0) THEN
                RAISE EXCEPTION 'Coupon "%" requires a minimum order amount of ₹%.', 
                    v_coupon_code, v_coupon_rec.min_order_amount;
            END IF;

            -- Scope restriction: applies_to ('all', 'category', 'product')
            v_coupon_eligible_subtotal := 0;

            IF v_coupon_rec.applies_to = 'category' AND v_coupon_rec.target_category IS NOT NULL THEN
                FOR v_item_rec IN SELECT * FROM jsonb_to_recordset(v_validated_items) AS y(
                    category_id TEXT,
                    line_total NUMERIC
                ) LOOP
                    IF LOWER(TRIM(COALESCE(v_item_rec.category_id, ''))) = LOWER(TRIM(v_coupon_rec.target_category)) THEN
                        v_coupon_eligible_subtotal := v_coupon_eligible_subtotal + v_item_rec.line_total;
                    END IF;
                END LOOP;

                IF v_coupon_eligible_subtotal <= 0 THEN
                    RAISE EXCEPTION 'Coupon "%" is valid only for products in category "%".', 
                        v_coupon_code, v_coupon_rec.target_category;
                END IF;
            ELSIF v_coupon_rec.applies_to = 'product' AND v_coupon_rec.target_product_id IS NOT NULL THEN
                FOR v_item_rec IN SELECT * FROM jsonb_to_recordset(v_validated_items) AS y(
                    product_id TEXT,
                    line_total NUMERIC
                ) LOOP
                    IF v_item_rec.product_id = v_coupon_rec.target_product_id THEN
                        v_coupon_eligible_subtotal := v_coupon_eligible_subtotal + v_item_rec.line_total;
                    END IF;
                END LOOP;

                IF v_coupon_eligible_subtotal <= 0 THEN
                    RAISE EXCEPTION 'Coupon "%" is valid only for the designated target product.', v_coupon_code;
                END IF;
            ELSE
                -- Default applies_to = 'all'
                v_coupon_eligible_subtotal := v_subtotal;
            END IF;

            -- Compute coupon discount value
            IF v_coupon_rec.discount_type = 'percentage' THEN
                v_coupon_discount := ROUND((v_coupon_eligible_subtotal * v_coupon_rec.discount_value) / 100.0, 2);
                IF v_coupon_rec.max_discount IS NOT NULL AND v_coupon_rec.max_discount > 0 THEN
                    v_coupon_discount := LEAST(v_coupon_discount, v_coupon_rec.max_discount);
                END IF;
            ELSE
                v_coupon_discount := LEAST(v_coupon_eligible_subtotal, v_coupon_rec.discount_value);
            END IF;

            -- Increment usage_count ONLY when valid discount is calculated
            UPDATE public.coupons
            SET usage_count = COALESCE(usage_count, 0) + 1
            WHERE id = v_coupon_rec.id;
        ELSE
            RAISE EXCEPTION 'Invalid or inactive coupon code "%".', v_coupon_code;
        END IF;
    END IF;

    -- -------------------------------------------------------------------------
    -- 7. Authoritative Delivery Fee & Totals
    -- -------------------------------------------------------------------------
    IF v_subtotal >= 499.00 OR v_subtotal = 0 THEN
        v_delivery_fee := 0.00;
    ELSE
        v_delivery_fee := 49.00;
    END IF;

    v_total_discount := LEAST(v_subtotal, v_coupon_discount);
    v_grand_total := GREATEST(0.00, ROUND(v_subtotal + v_delivery_fee - v_total_discount, 2));

    -- -------------------------------------------------------------------------
    -- 8. Identifiers & Payment Session Token Generation
    -- -------------------------------------------------------------------------
    v_order_id := 'ord-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || FLOOR(1000 + RANDOM() * 9000)::TEXT;
    v_order_number := 'Aishu-00' || nextval('public.order_number_seq')::TEXT;
    v_tracking_code := 'TRK-' || nextval('public.tracking_code_seq')::TEXT;
    
    v_payment_session_token := encode(gen_random_bytes(32), 'hex');
    v_payment_token_expires_at := NOW() + INTERVAL '30 minutes';

    -- Payment status must strictly match CHECK (payment_status IN ('pending', 'completed', 'authorized', 'paid', 'failed', 'refunded', 'cod'))
    IF LOWER(v_payment_method) LIKE '%cod%' OR LOWER(v_payment_method) LIKE '%cash%' THEN
        v_payment_status := 'cod';
    ELSE
        v_payment_status := 'pending';
    END IF;

    -- -------------------------------------------------------------------------
    -- 9. Insert Primary Order Row
    -- -------------------------------------------------------------------------
    INSERT INTO public.orders (
        id,
        order_number,
        tracking_code,
        payment_session_token,
        payment_token_expires_at,
        customer_id,
        customer_name,
        customer_phone,
        customer_email,
        delivery_address_json,
        subtotal,
        delivery_fee,
        discount_amount,
        grand_total,
        payment_method,
        payment_status,
        order_status,
        applied_coupon_code,
        idempotency_key,
        idempotency_payload_hash,
        admin_notes,
        created_at
    ) VALUES (
        v_order_id,
        v_order_number,
        v_tracking_code,
        v_payment_session_token,
        v_payment_token_expires_at,
        v_user_id,
        v_customer_name,
        v_customer_phone,
        v_customer_email,
        v_address,
        v_subtotal,
        v_delivery_fee,
        v_total_discount,
        v_grand_total,
        v_payment_method,
        v_payment_status,
        'placed',
        CASE WHEN v_coupon_discount > 0 THEN v_coupon_code ELSE NULL END,
        CASE WHEN v_idempotency_key <> '' THEN v_idempotency_key ELSE NULL END,
        CASE WHEN v_idempotency_key <> '' THEN v_payload_hash ELSE NULL END,
        v_delivery_notes,
        v_created_at
    );

    -- -------------------------------------------------------------------------
    -- 10. Insert Snapshotted Line Items, Decrement Inventory & Record Stock Logs
    -- -------------------------------------------------------------------------
    v_item_idx := 0;
    FOR v_item_rec IN SELECT * FROM jsonb_to_recordset(v_validated_items) AS z(
        product_id TEXT,
        product_name TEXT,
        selected_weight TEXT,
        unit_price NUMERIC,
        quantity INT
    ) LOOP
        v_item_idx := v_item_idx + 1;

        -- Guaranteed compatible with TEXT type for order_items.id
        INSERT INTO public.order_items (
            id,
            order_id,
            product_id,
            product_name_snapshot,
            selected_weight,
            unit_price,
            quantity
        ) VALUES (
            'item-' || v_order_id || '-' || v_item_idx,
            v_order_id,
            v_item_rec.product_id,
            v_item_rec.product_name,
            v_item_rec.selected_weight,
            v_item_rec.unit_price,
            v_item_rec.quantity
        );

        -- Stock History Log Entry (admin_name is NOT NULL, provided as 'Checkout System')
        INSERT INTO public.stock_history_logs (
            id,
            product_id,
            product_name,
            type,
            quantity,
            note,
            admin_name,
            created_at
        ) VALUES (
            'log-destock-' || v_order_id || '-' || v_item_rec.product_id || '-' || v_item_idx,
            v_item_rec.product_id,
            v_item_rec.product_name,
            'destock',
            v_item_rec.quantity,
            'Live Order Sale #' || v_order_number || ' (' || v_item_rec.quantity || ' × ' || v_item_rec.selected_weight || ')',
            'Checkout System',
            NOW()
        );
    END LOOP;

    -- Decrement stock by aggregated demand per product to guarantee exact balance
    FOR v_agg_rec IN 
        SELECT 
            x.product_id,
            SUM((x.quantity)::INT) AS total_demanded_qty
        FROM jsonb_to_recordset(v_items) AS x(
            product_id TEXT,
            quantity TEXT
        )
        GROUP BY x.product_id
    LOOP
        UPDATE public.products
        SET inventory_count = GREATEST(0, inventory_count - v_agg_rec.total_demanded_qty),
            out_of_stock = ((inventory_count - v_agg_rec.total_demanded_qty) <= 0),
            updated_at = NOW()
        WHERE id = v_agg_rec.product_id;
    END LOOP;

    -- -------------------------------------------------------------------------
    -- 11. Authoritative Frontend Response Contract
    -- -------------------------------------------------------------------------
    RETURN jsonb_build_object(
        'success', true,
        'is_duplicate', false,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'tracking_code', v_tracking_code,
        'payment_session_token', v_payment_session_token,
        'subtotal', v_subtotal,
        'delivery_fee', v_delivery_fee,
        'discount_amount', v_total_discount,
        'grand_total', v_grand_total,
        'payment_method', v_payment_method,
        'payment_status', v_payment_status,
        'order_status', 'placed',
        'applied_coupon_code', CASE WHEN v_coupon_discount > 0 THEN v_coupon_code ELSE NULL END,
        'delivery_address', v_address,
        'items_count', jsonb_array_length(v_items),
        'created_at', v_created_at
    );
END;
$$;

-- 5. Set Execution Permissions (Guest checkout via anon, logged in customers via authenticated)
REVOKE EXECUTE ON FUNCTION public.place_order_secure(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order_secure(JSONB) TO anon, authenticated, service_role;

-- 6. Force PostgREST to Immediately Reload Schema Cache
NOTIFY pgrst, 'reload schema';

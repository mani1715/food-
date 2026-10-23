-- ==============================================================================
-- Migration: 20261023_012_order_id_prefix_aishu.sql
-- Description: Production-grade place_order_secure RPC for Aishu Foods.
--              Hardened against shadowing, sequence truncation, and idempotency collision.
--              Verified against frontend and Edge Function contracts.
-- ==============================================================================

-- 1. Ensure required cryptographic extension for digest (SHA-256) and random tokens
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Collision-Resistant Sequences with Non-Regressive Synchronization
CREATE SEQUENCE IF NOT EXISTS public.order_id_seq START WITH 10001;
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 10001;
CREATE SEQUENCE IF NOT EXISTS public.tracking_code_seq START WITH 100001;

DO $$
DECLARE
    v_max_id BIGINT;
    v_curr_id BIGINT;
    v_max_num BIGINT;
    v_curr_num BIGINT;
    v_max_trk BIGINT;
    v_curr_trk BIGINT;
BEGIN
    -- Synchronize order_id_seq (never moves backwards)
    SELECT COALESCE(MAX(SUBSTRING(id FROM '[0-9]+$')::BIGINT), 0) INTO v_max_id 
    FROM public.orders WHERE id ~ '[0-9]+$';
    
    SELECT last_value INTO v_curr_id FROM public.order_id_seq;
    
    IF v_max_id >= v_curr_id THEN
        PERFORM setval('public.order_id_seq', v_max_id + 1, false);
    END IF;

    -- Synchronize order_number_seq (never moves backwards)
    SELECT COALESCE(MAX(SUBSTRING(order_number FROM '[0-9]+$')::BIGINT), 0) INTO v_max_num 
    FROM public.orders WHERE order_number ~ '[0-9]+$';
    
    SELECT last_value INTO v_curr_num FROM public.order_number_seq;
    
    IF v_max_num >= v_curr_num THEN
        PERFORM setval('public.order_number_seq', v_max_num + 1, false);
    END IF;

    -- Synchronize tracking_code_seq (never moves backwards)
    SELECT COALESCE(MAX(SUBSTRING(tracking_code FROM '[0-9]+$')::BIGINT), 0) INTO v_max_trk 
    FROM public.orders WHERE tracking_code ~ '[0-9]+$';
    
    SELECT last_value INTO v_curr_trk FROM public.tracking_code_seq;
    
    IF v_max_trk >= v_curr_trk THEN
        PERFORM setval('public.tracking_code_seq', v_max_trk + 1, false);
    END IF;
END $$;

-- 3. Safe, Justified Column Extensions
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

-- Ensure coupon scope and enablement columns exist with safe defaults
ALTER TABLE public.coupons
    ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS applies_to TEXT DEFAULT 'all',
    ADD COLUMN IF NOT EXISTS target_category TEXT,
    ADD COLUMN IF NOT EXISTS target_product_id TEXT,
    ADD COLUMN IF NOT EXISTS max_discount NUMERIC;

-- Ensure order_items.id has a safe default generator if currently NULL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'order_items' 
          AND column_name = 'id' AND column_default IS NULL
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'order_items' 
              AND column_name = 'id' AND data_type = 'uuid'
        ) THEN
            ALTER TABLE public.order_items ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ELSE
            ALTER TABLE public.order_items ALTER COLUMN id SET DEFAULT ('item-' || gen_random_uuid()::text);
        END IF;
    END IF;
END $$;

-- 4. Authoritative place_order_secure RPC
CREATE OR REPLACE FUNCTION public.place_order_secure(
    p_order_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, pg_temp
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
    
    -- Canonical representation variables
    v_canonical_items JSONB;
    v_canonical_payload JSONB;
    v_canonical_text TEXT;
    
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
    v_seq_val BIGINT;
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
    
    -- Validated items buffer
    v_validated_items JSONB := '[]'::jsonb;
BEGIN
    -- -------------------------------------------------------------------------
    -- 1. Input Sanitization & Preliminary Structure Verification
    -- -------------------------------------------------------------------------
    IF p_order_payload IS NULL OR jsonb_typeof(p_order_payload) <> 'object' THEN
        RAISE EXCEPTION 'Order payload must be a valid JSON object.';
    END IF;

    v_customer := p_order_payload->'customer';
    v_address := p_order_payload->'delivery_address';
    v_items := p_order_payload->'items';
    v_payment_method := TRIM(COALESCE(p_order_payload->>'payment_method', ''));
    v_coupon_code := TRIM(UPPER(COALESCE(p_order_payload->>'coupon_code', '')));
    v_delivery_notes := TRIM(COALESCE(p_order_payload->>'delivery_notes', ''));

    IF v_customer IS NULL OR v_address IS NULL OR v_items IS NULL THEN
        RAISE EXCEPTION 'Missing required order structure: customer, delivery_address, and items are required.';
    END IF;

    -- Validate Payment Method strictly against supported frontend options ('COD', 'UPI', 'Card')
    IF UPPER(v_payment_method) NOT IN ('COD', 'UPI', 'CARD') THEN
        RAISE EXCEPTION 'Invalid payment method "%". Permitted payment methods are COD, UPI, Card.', v_payment_method;
    END IF;

    -- Canonicalize payment method and assign payment status adhering to constraint:
    -- CHECK (payment_status IN ('pending', 'completed', 'authorized', 'paid', 'failed', 'refunded', 'cod'))
    IF UPPER(v_payment_method) = 'COD' THEN
        v_payment_method := 'COD';
        v_payment_status := 'cod';
    ELSIF UPPER(v_payment_method) = 'UPI' THEN
        v_payment_method := 'UPI';
        v_payment_status := 'pending';
    ELSE
        v_payment_method := 'Card';
        v_payment_status := 'pending';
    END IF;

    -- Customer contact validation
    v_customer_name := TRIM(COALESCE(v_customer->>'name', ''));
    v_customer_phone := REGEXP_REPLACE(COALESCE(v_customer->>'phone', ''), '[^0-9]', '', 'g');
    v_customer_email := TRIM(LOWER(COALESCE(v_customer->>'email', '')));

    IF LENGTH(v_customer_name) < 2 THEN
        RAISE EXCEPTION 'Customer name must be at least 2 characters.';
    END IF;

    IF LENGTH(v_customer_phone) < 10 THEN
        RAISE EXCEPTION 'A valid 10-digit mobile number is required.';
    END IF;

    -- Customer email validation
    IF v_customer_email <> '' THEN
        IF NOT (v_customer_email ~* '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$') THEN
            RAISE EXCEPTION 'Please provide a valid customer email address.';
        END IF;
    ELSE
        v_customer_email := 'guest_' || v_customer_phone || '@aishufoods.com';
    END IF;

    -- Delivery address validation
    IF (v_address->>'address') IS NULL OR LENGTH(TRIM(v_address->>'address')) < 5 THEN
        RAISE EXCEPTION 'Please provide a complete street delivery address.';
    END IF;

    -- Postal PIN code validation: Exactly 6 numeric digits starting with 1-9
    IF (v_address->>'pincode') IS NULL 
       OR NOT (TRIM(v_address->>'pincode') ~ '^[1-9][0-9]{5}$') THEN
        RAISE EXCEPTION 'Please provide a valid 6-digit postal PIN code (e.g. 500001).';
    END IF;

    -- Array validation
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
    -- 2. Line-by-Line Item Quantity Validation (Strictly 1 to 50 Before Integer Cast)
    -- -------------------------------------------------------------------------
    FOR v_item_element IN SELECT * FROM jsonb_array_elements(v_items) LOOP
        IF jsonb_typeof(v_item_element) <> 'object' THEN
            RAISE EXCEPTION 'Each cart item entry must be a valid JSON object.';
        END IF;

        IF TRIM(COALESCE(v_item_element->>'product_id', '')) = '' THEN
            RAISE EXCEPTION 'Each cart item must specify a valid, non-empty product_id.';
        END IF;

        -- Strictly allow only positive integers from 1 to 50 via regex BEFORE any integer cast.
        -- Rejects negative numbers, 0, decimals, non-digits, and integer-overflow strings.
        IF (v_item_element->>'quantity') IS NULL 
           OR NOT (v_item_element->>'quantity' ~ '^([1-9]|[1-4][0-9]|50)$') THEN
            RAISE EXCEPTION 'Invalid quantity for product %. Quantity must be an integer between 1 and 50.', 
                v_item_element->>'product_id';
        END IF;
    END LOOP;

    -- -------------------------------------------------------------------------
    -- 3. Canonical Payload Construction & SHA-256 Idempotency Verification
    -- -------------------------------------------------------------------------
    v_idempotency_key := TRIM(COALESCE(p_order_payload->>'idempotency_key', ''));

    -- Construct canonical items JSON array sorted deterministically by product_id ASC, selected_weight ASC
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'product_id', c.product_id,
            'selected_weight', TRIM(COALESCE(c.selected_weight, 'Standard')),
            'quantity', (c.quantity)::INT
        ) ORDER BY c.product_id ASC, TRIM(COALESCE(c.selected_weight, 'Standard')) ASC
    ), '[]'::jsonb)
    INTO v_canonical_items
    FROM jsonb_to_recordset(v_items) AS c(
        product_id TEXT,
        selected_weight TEXT,
        quantity TEXT
    );

    -- Build canonical payload object
    v_canonical_payload := jsonb_build_object(
        'customer_name', v_customer_name,
        'customer_phone', v_customer_phone,
        'customer_email', v_customer_email,
        'delivery_address', jsonb_build_object(
            'address', TRIM(COALESCE(v_address->>'address', '')),
            'city', TRIM(COALESCE(v_address->>'city', '')),
            'pincode', TRIM(COALESCE(v_address->>'pincode', ''))
        ),
        'items', v_canonical_items,
        'payment_method', v_payment_method,
        'coupon_code', v_coupon_code
    );

    v_canonical_text := v_canonical_payload::text;
    v_payload_hash := encode(digest(convert_to(v_canonical_text, 'UTF8'), 'sha256'), 'hex');

    IF v_idempotency_key <> '' THEN
        IF LENGTH(v_idempotency_key) > 120 THEN
            RAISE EXCEPTION 'Idempotency key exceeds maximum allowed length of 120 characters.';
        END IF;

        -- Advisory lock serializes concurrent retries for this exact idempotency key
        PERFORM pg_advisory_xact_lock(hashtext('place_order_' || v_idempotency_key));

        SELECT id, order_number, tracking_code, subtotal, delivery_fee, 
               discount_amount, grand_total, order_status, payment_status, created_at,
               payment_session_token, delivery_address_json, idempotency_payload_hash,
               payment_method, applied_coupon_code, customer_phone
        INTO v_existing_order
        FROM public.orders
        WHERE idempotency_key = v_idempotency_key;

        IF FOUND THEN
            -- Policy: Only allow idempotent replay if payload SHA-256 hash matches exactly.
            -- Reject legacy orders missing a hash rather than loosely matching on phone/payment.
            IF v_existing_order.idempotency_payload_hash IS NOT NULL THEN
                IF v_existing_order.idempotency_payload_hash <> v_payload_hash THEN
                    RAISE EXCEPTION 'Idempotency key "%" was already used for a different order payload.', v_idempotency_key;
                END IF;
            ELSE
                RAISE EXCEPTION 'Idempotency key "%" is already bound to existing order #% without cryptographic payload verification. Please submit with a new idempotency key.', 
                    v_idempotency_key, v_existing_order.order_number;
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
        -- Lock product row in ascending sorted order to eliminate deadlocks
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
            -- Product HAS weight options: must match configured weight option
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
    -- 6. Authoritative Coupon Verification & Discount Calculation
    -- -------------------------------------------------------------------------
    IF v_coupon_code <> '' THEN
        SELECT * INTO v_coupon_rec
        FROM public.coupons
        WHERE UPPER(TRIM(code)) = v_coupon_code
          AND COALESCE(is_enabled, is_active, true) = true
        FOR UPDATE;

        IF FOUND THEN
            -- Calendar date expiry check: valid through entire expiry date, expires next day
            IF v_coupon_rec.expiry_date IS NOT NULL AND (CURRENT_DATE > v_coupon_rec.expiry_date::DATE) THEN
                RAISE EXCEPTION 'Coupon "%" expired on %.', v_coupon_code, v_coupon_rec.expiry_date;
            END IF;

            -- Minimum order subtotal check
            IF v_subtotal < COALESCE(v_coupon_rec.min_order_amount, 0) THEN
                RAISE EXCEPTION 'Coupon "%" requires a minimum order amount of ₹%.', 
                    v_coupon_code, v_coupon_rec.min_order_amount;
            END IF;

            -- Scope restriction: strictly supports 'all', 'category', 'product'
            v_coupon_eligible_subtotal := 0;

            IF LOWER(TRIM(COALESCE(v_coupon_rec.applies_to, 'all'))) = 'all' THEN
                v_coupon_eligible_subtotal := v_subtotal;

            ELSIF LOWER(TRIM(v_coupon_rec.applies_to)) = 'category' THEN
                IF v_coupon_rec.target_category IS NULL OR TRIM(v_coupon_rec.target_category) = '' THEN
                    RAISE EXCEPTION 'Coupon "%" is misconfigured: target category is missing.', v_coupon_code;
                END IF;

                FOR v_item_rec IN SELECT * FROM jsonb_to_recordset(v_validated_items) AS y(
                    category_id TEXT,
                    line_total NUMERIC
                ) LOOP
                    IF LOWER(TRIM(COALESCE(v_item_rec.category_id, ''))) = LOWER(TRIM(v_coupon_rec.target_category)) THEN
                        v_coupon_eligible_subtotal := v_coupon_eligible_subtotal + v_item_rec.line_total;
                    END IF;
                END LOOP;

                IF v_coupon_eligible_subtotal <= 0 THEN
                    RAISE EXCEPTION 'Coupon "%" is valid only for items in category "%". No eligible items in cart.', 
                        v_coupon_code, v_coupon_rec.target_category;
                END IF;

            ELSIF LOWER(TRIM(v_coupon_rec.applies_to)) = 'product' THEN
                IF v_coupon_rec.target_product_id IS NULL OR TRIM(v_coupon_rec.target_product_id) = '' THEN
                    RAISE EXCEPTION 'Coupon "%" is misconfigured: target product is missing.', v_coupon_code;
                END IF;

                FOR v_item_rec IN SELECT * FROM jsonb_to_recordset(v_validated_items) AS y(
                    product_id TEXT,
                    line_total NUMERIC
                ) LOOP
                    IF v_item_rec.product_id = v_coupon_rec.target_product_id THEN
                        v_coupon_eligible_subtotal := v_coupon_eligible_subtotal + v_item_rec.line_total;
                    END IF;
                END LOOP;

                IF v_coupon_eligible_subtotal <= 0 THEN
                    RAISE EXCEPTION 'Coupon "%" is valid only for designated target product. Eligible product not in cart.', 
                        v_coupon_code;
                END IF;

            ELSE
                RAISE EXCEPTION 'Coupon "%" has invalid scope "%". Permitted scopes are all, category, product.', 
                    v_coupon_code, v_coupon_rec.applies_to;
            END IF;

            -- Compute coupon discount value safely
            IF v_coupon_rec.discount_type = 'percentage' THEN
                IF v_coupon_rec.discount_value <= 0 OR v_coupon_rec.discount_value > 100 THEN
                    RAISE EXCEPTION 'Coupon "%" has invalid percentage discount value (%).', 
                        v_coupon_code, v_coupon_rec.discount_value;
                END IF;
                v_coupon_discount := ROUND((v_coupon_eligible_subtotal * v_coupon_rec.discount_value) / 100.0, 2);
                IF v_coupon_rec.max_discount IS NOT NULL AND v_coupon_rec.max_discount > 0 THEN
                    v_coupon_discount := LEAST(v_coupon_discount, v_coupon_rec.max_discount);
                END IF;
            ELSIF v_coupon_rec.discount_type = 'flat' THEN
                IF v_coupon_rec.discount_value <= 0 THEN
                    RAISE EXCEPTION 'Coupon "%" has invalid flat discount value (%).', 
                        v_coupon_code, v_coupon_rec.discount_value;
                END IF;
                v_coupon_discount := LEAST(v_coupon_eligible_subtotal, v_coupon_rec.discount_value);
            ELSE
                RAISE EXCEPTION 'Coupon "%" has unsupported discount type "%".', 
                    v_coupon_code, v_coupon_rec.discount_type;
            END IF;

            -- Bound discount between 0 and subtotal
            v_coupon_discount := GREATEST(0.00, LEAST(v_subtotal, v_coupon_discount));

            -- Increment usage_count ONLY when a positive discount is actually applied
            IF v_coupon_discount > 0 THEN
                UPDATE public.coupons
                SET usage_count = COALESCE(usage_count, 0) + 1
                WHERE id = v_coupon_rec.id;
            END IF;
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
    -- 8. Collision-Resistant Identifiers & Payment Session Token
    -- -------------------------------------------------------------------------
    -- Non-truncating order ID formatting: Pads to 6 digits if < 1,000,000 without truncating larger numbers
    v_seq_val := nextval('public.order_id_seq');
    v_order_id := 'ord-' || to_char(NOW(), 'YYYYMMDD') || '-' || 
                  CASE WHEN v_seq_val < 1000000 THEN LPAD(v_seq_val::TEXT, 6, '0') ELSE v_seq_val::TEXT END;
    v_order_number := 'Aishu-00' || nextval('public.order_number_seq')::TEXT;
    v_tracking_code := 'TRK-' || nextval('public.tracking_code_seq')::TEXT;
    
    v_payment_session_token := encode(gen_random_bytes(32), 'hex');
    v_payment_token_expires_at := NOW() + INTERVAL '30 minutes';

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
    -- 10. Insert Line Items, Decrement Inventory & Record Stock Logs
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

        -- Insert line item (omits 'id' so table default handles UUID or TEXT automatically)
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name_snapshot,
            selected_weight,
            unit_price,
            quantity
        ) VALUES (
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

    -- Decrement stock by aggregated demand per product.
    -- Strict decrement: fails explicitly if stock is unexpectedly insufficient rather than silently clamping with GREATEST.
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
        SET inventory_count = inventory_count - v_agg_rec.total_demanded_qty,
            out_of_stock = ((inventory_count - v_agg_rec.total_demanded_qty) = 0),
            updated_at = NOW()
        WHERE id = v_agg_rec.product_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Failed to decrement stock: product % was removed concurrently.', v_agg_rec.product_id;
        END IF;
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
REVOKE ALL ON FUNCTION public.place_order_secure(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order_secure(JSONB) TO anon, authenticated, service_role;

-- 6. Force PostgREST to Immediately Reload Schema Cache
NOTIFY pgrst, 'reload schema';

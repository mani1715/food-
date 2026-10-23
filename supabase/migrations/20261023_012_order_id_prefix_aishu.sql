-- ==============================================================================
-- Migration: 20261023_012_order_id_prefix_aishu.sql
-- Description: Minimal, schema-compatible place_order_secure RPC for Aishu Foods.
--              Matches confirmed live database schema on project akublyjmyrcoeemuxugr.
-- ==============================================================================

-- 1. Ensure pgcrypto extension for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Smallest Justified Column Extensions on orders table
--    - payment_session_token & payment_token_expires_at: Required by Razorpay Edge Functions
--      (create-razorpay-order & verify-razorpay-payment) for guest checkout payment authorization.
--    - idempotency_key: Required to prevent duplicate orders and double stock deduction on network retries.
--    - applied_coupon_code: Required to persist applied coupon snapshot.
ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS payment_session_token TEXT,
    ADD COLUMN IF NOT EXISTS payment_token_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
    ADD COLUMN IF NOT EXISTS applied_coupon_code TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_payment_token 
    ON public.orders (payment_session_token) 
    WHERE payment_session_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key 
    ON public.orders (idempotency_key) 
    WHERE idempotency_key IS NOT NULL;

-- 3. Server-Authoritative place_order_secure RPC
--    Compatible with:
--    - orders: confirmed columns + minimal payment/idempotency columns
--    - order_items: id, order_id, product_id, product_name_snapshot, selected_weight, unit_price, quantity
--    - products: id, name, inventory_count, out_of_stock, price
--    - product_weight_options: id, product_id, weight_label, price
--    - coupons: is_enabled (NOT is_active), discount_type, discount_value, min_order_amount, usage_count, code
--    - stock_history_logs: id, product_id, product_name, type, quantity, note, admin_name (NOT NULL), created_at
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
    v_item RECORD;
    v_payment_method TEXT;
    v_coupon_code TEXT;
    v_delivery_notes TEXT;
    v_idempotency_key TEXT;
    
    v_db_product RECORD;
    v_db_price NUMERIC;
    v_quantity INT;
    v_item_subtotal NUMERIC;
    v_subtotal NUMERIC := 0;
    
    v_coupon_rec RECORD;
    v_coupon_discount NUMERIC := 0;
    
    v_delivery_fee NUMERIC := 49.00;
    v_total_discount NUMERIC := 0;
    v_grand_total NUMERIC := 0;
    
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
BEGIN
    -- 1. Idempotency Check (Returns existing order on duplicate submission)
    v_idempotency_key := TRIM(COALESCE(p_order_payload->>'idempotency_key', ''));
    IF v_idempotency_key <> '' THEN
        SELECT id, order_number, tracking_code, subtotal, delivery_fee, 
               discount_amount, grand_total, order_status, payment_status, created_at,
               payment_session_token, delivery_address_json
        INTO v_existing_order
        FROM public.orders
        WHERE idempotency_key = v_idempotency_key;

        IF FOUND THEN
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
                'order_status', v_existing_order.order_status,
                'payment_status', v_existing_order.payment_status,
                'delivery_address', v_existing_order.delivery_address_json,
                'created_at', v_existing_order.created_at
            );
        END IF;
    END IF;

    -- 2. Input Sanitization & Payload Validation
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
        RAISE EXCEPTION 'Customer name is too short or missing.';
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

    IF jsonb_array_length(v_items) = 0 THEN
        RAISE EXCEPTION 'Cannot place order: Cart is empty.';
    END IF;

    IF jsonb_array_length(v_items) > 50 THEN
        RAISE EXCEPTION 'Cart exceeds maximum permissible lines of 50 items.';
    END IF;

    -- 3. Row Locking, Stock Verification & Authoritative Price Computation
    FOR v_item IN SELECT * FROM jsonb_to_recordset(v_items) AS x(
        product_id TEXT,
        selected_weight TEXT,
        quantity INT
    ) LOOP
        v_quantity := COALESCE(v_item.quantity, 0);
        IF v_quantity <= 0 OR v_quantity > 50 THEN
            RAISE EXCEPTION 'Invalid line quantity % for item %. Must be between 1 and 50.', v_quantity, v_item.product_id;
        END IF;

        -- Lock the product row FOR UPDATE to prevent race conditions and overselling
        SELECT id, name, inventory_count, out_of_stock, price
        INTO v_db_product
        FROM public.products
        WHERE id = v_item.product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % is no longer available in store catalog.', v_item.product_id;
        END IF;

        IF v_db_product.out_of_stock = true OR COALESCE(v_db_product.inventory_count, 0) < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for "%". Requested %, available: %.', 
                v_db_product.name, v_quantity, GREATEST(0, COALESCE(v_db_product.inventory_count, 0));
        END IF;

        -- Resolve authoritative price from product_weight_options
        SELECT price INTO v_db_price
        FROM public.product_weight_options
        WHERE product_id = v_item.product_id 
          AND LOWER(TRIM(weight_label)) = LOWER(TRIM(COALESCE(v_item.selected_weight, '')))
        LIMIT 1;

        IF v_db_price IS NULL THEN
            SELECT price INTO v_db_price
            FROM public.product_weight_options
            WHERE product_id = v_item.product_id
            ORDER BY price ASC
            LIMIT 1;
        END IF;

        IF v_db_price IS NULL THEN
            v_db_price := v_db_product.price;
        END IF;

        IF v_db_price IS NULL OR v_db_price <= 0 THEN
            RAISE EXCEPTION 'Invalid calculated price for item %.', v_db_product.name;
        END IF;

        v_item_subtotal := ROUND(v_db_price * v_quantity, 2);
        v_subtotal := v_subtotal + v_item_subtotal;
    END LOOP;

    -- 4. Authoritative Coupon Verification (uses is_enabled, min_order_amount, usage_count)
    IF v_coupon_code <> '' THEN
        SELECT * INTO v_coupon_rec
        FROM public.coupons
        WHERE UPPER(TRIM(code)) = v_coupon_code
          AND is_enabled = true
        FOR UPDATE;

        IF FOUND THEN
            IF v_subtotal >= COALESCE(v_coupon_rec.min_order_amount, 0) THEN
                IF v_coupon_rec.discount_type = 'percentage' THEN
                    v_coupon_discount := ROUND((v_subtotal * v_coupon_rec.discount_value) / 100.0, 2);
                ELSIF v_coupon_rec.discount_type = 'flat' THEN
                    v_coupon_discount := LEAST(v_subtotal, v_coupon_rec.discount_value);
                END IF;

                UPDATE public.coupons
                SET usage_count = COALESCE(usage_count, 0) + 1
                WHERE id = v_coupon_rec.id;
            END IF;
        END IF;
    END IF;

    -- 5. Authoritative Delivery Fee (Free shipping threshold >= Rs 499, otherwise Rs 49)
    IF v_subtotal >= 499.00 THEN
        v_delivery_fee := 0.00;
    ELSE
        v_delivery_fee := 49.00;
    END IF;

    -- 6. Authoritative Totals
    v_total_discount := LEAST(v_subtotal, v_coupon_discount);
    v_grand_total := GREATEST(0.00, ROUND(v_subtotal + v_delivery_fee - v_total_discount, 2));

    -- 7. Generate Identifiers: "Aishu-00" prefix, "TRK-" tracking, and 256-bit session token
    v_order_id := 'ord-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || FLOOR(1000 + RANDOM() * 9000)::TEXT;
    v_order_number := 'Aishu-00' || FLOOR(1000 + RANDOM() * 9000)::TEXT;
    v_tracking_code := 'TRK-' || FLOOR(100000 + RANDOM() * 900000)::TEXT;
    
    v_payment_session_token := encode(gen_random_bytes(32), 'hex');
    v_payment_token_expires_at := NOW() + INTERVAL '30 minutes';

    IF LOWER(v_payment_method) LIKE '%cod%' OR LOWER(v_payment_method) LIKE '%cash%' THEN
        v_payment_status := 'cod_pending';
    ELSE
        v_payment_status := 'pending';
    END IF;

    -- 8. Insert Primary Order Row
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
        v_delivery_notes,
        v_created_at
    );

    -- 9. Insert Snapshotted Line Items, Atomically Decrement Inventory & Record Stock History Log
    FOR v_item IN SELECT * FROM jsonb_to_recordset(v_items) AS x(
        product_id TEXT,
        selected_weight TEXT,
        quantity INT
    ) LOOP
        v_quantity := COALESCE(v_item.quantity, 0);

        -- Resolve product price again for line item snapshot
        SELECT id, name, inventory_count, out_of_stock, price
        INTO v_db_product
        FROM public.products
        WHERE id = v_item.product_id;

        SELECT price INTO v_db_price
        FROM public.product_weight_options
        WHERE product_id = v_item.product_id 
          AND LOWER(TRIM(weight_label)) = LOWER(TRIM(COALESCE(v_item.selected_weight, '')))
        LIMIT 1;

        IF v_db_price IS NULL THEN
            SELECT price INTO v_db_price
            FROM public.product_weight_options
            WHERE product_id = v_item.product_id
            ORDER BY price ASC
            LIMIT 1;
        END IF;

        IF v_db_price IS NULL THEN
            v_db_price := v_db_product.price;
        END IF;

        -- Insert Line Item Snapshot (matches exact live order_items schema)
        INSERT INTO public.order_items (
            id,
            order_id,
            product_id,
            product_name_snapshot,
            selected_weight,
            unit_price,
            quantity
        ) VALUES (
            gen_random_uuid(),
            v_order_id,
            v_item.product_id,
            v_db_product.name,
            COALESCE(v_item.selected_weight, 'Standard'),
            v_db_price,
            v_quantity
        );

        -- Atomic Stock Decrement
        UPDATE public.products
        SET inventory_count = GREATEST(0, inventory_count - v_quantity),
            out_of_stock = ((inventory_count - v_quantity) <= 0),
            updated_at = NOW()
        WHERE id = v_item.product_id;

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
            'log-destock-' || v_order_id || '-' || v_item.product_id,
            v_item.product_id,
            v_db_product.name,
            'destock',
            v_quantity,
            'Live Order Sale #' || v_order_number || ' (' || v_quantity || ' × ' || COALESCE(v_item.selected_weight, 'Standard') || ')',
            'Checkout System',
            NOW()
        );
    END LOOP;

    -- 10. Return Authoritative Order Output (matches frontend contract in src/lib/supabase/orders.ts)
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

-- 4. Set Execution Permissions (Guest checkout via anon, logged in customers via authenticated)
REVOKE EXECUTE ON FUNCTION public.place_order_secure(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order_secure(JSONB) TO anon, authenticated, service_role;

-- 5. Force PostgREST to Immediately Reload Schema Cache
NOTIFY pgrst, 'reload schema';

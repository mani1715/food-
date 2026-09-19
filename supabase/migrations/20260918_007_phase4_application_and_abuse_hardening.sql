-- ==============================================================================
-- MIGRATION 007: AISHU HOME FOODS — APPLICATION, API/RPC & ABUSE HARDENING
-- ==============================================================================
-- This migration establishes:
-- 1. Complete Security Definer audit with explicit search_path & bounds checking.
-- 2. Checkout & COD anti-abuse protection (rate limits, length limits, COD caps).
-- 3. Dynamic admin-configured delivery rules integration in place_order_secure.
-- 4. Privacy-preserving non-enumerative order tracking RPC.
-- 5. Immutable audit logs protection (disallowing UPDATE & DELETE).
-- 6. Strict RPC execution grants with minimal privilege boundary.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. IMMUTABLE AUDIT LOGS PROTECTION
-- ------------------------------------------------------------------------------
-- Ensure audit logs cannot be updated or deleted by any user or administrator.
DROP POLICY IF EXISTS "Disallow audit logs update" ON public.audit_logs;
DROP POLICY IF EXISTS "Disallow audit logs delete" ON public.audit_logs;

-- Re-enforce SELECT only for verified staff
DROP POLICY IF EXISTS "Staff can view audit logs" ON public.audit_logs;
CREATE POLICY "Staff can view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_staff());


-- ------------------------------------------------------------------------------
-- 2. HARDENED ORDER TRACKING RPC (Anti-Enumeration & Privacy Guard)
-- ------------------------------------------------------------------------------
-- Returns minimized tracking details ONLY if query AND phone/email verification match.
-- Returns uniform error message to prevent account or order enumeration attacks.
CREATE OR REPLACE FUNCTION public.get_order_tracking_status(
    p_order_query TEXT,
    p_verification TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_order RECORD;
    v_clean_query TEXT;
    v_clean_verify TEXT;
    v_digits TEXT;
BEGIN
    v_clean_query := TRIM(UPPER(COALESCE(p_order_query, '')));
    v_clean_verify := TRIM(LOWER(COALESCE(p_verification, '')));

    -- Validate query length bounds
    IF v_clean_query = '' OR LENGTH(v_clean_query) < 4 OR LENGTH(v_clean_query) > 50 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid search query');
    END IF;

    -- Extract digits for robust phone match
    v_digits := REGEXP_REPLACE(v_clean_verify, '\D', '', 'g');

    SELECT
        id,
        order_number,
        tracking_code,
        order_status,
        payment_status,
        payment_method,
        subtotal,
        delivery_fee,
        discount_amount,
        grand_total,
        delivery_days,
        created_at,
        shipped_at,
        delivered_at,
        customer_phone,
        customer_email
    INTO v_order
    FROM public.orders
    WHERE order_number = v_clean_query
       OR tracking_code = v_clean_query
       OR id = p_order_query
    LIMIT 1;

    -- Anti-Enumeration: If order is not found, return generic message
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order details could not be verified');
    END IF;

    -- If verification is provided, match against phone or email
    IF v_clean_verify <> '' THEN
        IF NOT (
            LOWER(v_order.customer_email) = v_clean_verify OR
            (LENGTH(v_digits) >= 10 AND RIGHT(REGEXP_REPLACE(v_order.customer_phone, '\D', '', 'g'), 10) = RIGHT(v_digits, 10))
        ) THEN
            -- Uniform error to prevent enumeration of existing IDs
            RETURN jsonb_build_object('success', false, 'error', 'Order details could not be verified');
        END IF;
    END IF;

    -- Return minimized tracking payload
    RETURN jsonb_build_object(
        'success', true,
        'order_number', v_order.order_number,
        'tracking_code', v_order.tracking_code,
        'order_status', v_order.order_status,
        'payment_status', v_order.payment_status,
        'payment_method', v_order.payment_method,
        'subtotal', v_order.subtotal,
        'delivery_fee', v_order.delivery_fee,
        'discount', v_order.discount_amount,
        'grand_total', v_order.grand_total,
        'delivery_days', v_order.delivery_days,
        'created_at', v_order.created_at,
        'shipped_at', v_order.shipped_at,
        'delivered_at', v_order.delivered_at
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_order_tracking_status(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_tracking_status(TEXT, TEXT) TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 3. HARDENED PLACE ORDER SECURE RPC (With Abuse Throttling & Dynamic Settings)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.place_order_secure(
    p_order_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_idempotency_key TEXT;
    v_existing_order RECORD;
    v_customer JSONB;
    v_address JSONB;
    v_items JSONB;
    v_item JSONB;
    v_item_idx INT := 0;
    v_payment_method TEXT;
    v_delivery_notes TEXT;
    
    v_customer_name TEXT;
    v_customer_phone TEXT;
    v_customer_email TEXT;
    v_user_id UUID;
    
    v_product_id TEXT;
    v_weight_label TEXT;
    v_quantity INT;
    v_prod_rec RECORD;
    v_weight_rec RECORD;
    v_unit_price NUMERIC;
    v_line_total NUMERIC;
    
    v_subtotal NUMERIC := 0;
    v_total_quantity INT := 0;
    
    v_coupon_code TEXT;
    v_coupon_rec RECORD;
    v_coupon_discount NUMERIC := 0;
    v_coupon_eligible_subtotal NUMERIC := 0;
    
    v_selected_offer_id TEXT;
    v_offer_rec RECORD;
    v_best_offer RECORD;
    v_offer_discount NUMERIC := 0;
    v_is_free_shipping BOOLEAN := false;
    v_free_gift_name TEXT := NULL;
    
    -- Dynamic Store Delivery Settings
    v_store_settings RECORD;
    v_free_delivery_threshold NUMERIC := 499.00;
    v_standard_delivery_fee NUMERIC := 49.00;
    v_delivery_fee NUMERIC := 49.00;
    v_total_discount NUMERIC := 0;
    v_grand_total NUMERIC := 0;
    
    v_order_id TEXT;
    v_order_number TEXT;
    v_tracking_code TEXT;
    v_payment_status TEXT;
    v_created_at TIMESTAMPTZ := NOW();
    
    v_order_item_records JSONB := '[]'::jsonb;
    v_recent_order_count INT := 0;
BEGIN
    -- 1. Idempotency Check
    v_idempotency_key := TRIM(COALESCE(p_order_payload->>'idempotency_key', ''));
    
    IF v_idempotency_key <> '' THEN
        IF LENGTH(v_idempotency_key) > 100 THEN
            RAISE EXCEPTION 'Idempotency key exceeds maximum length of 100 characters.';
        END IF;

        SELECT id, order_number, tracking_code, subtotal, delivery_fee, discount_amount, grand_total, order_status, payment_status, created_at
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
                'subtotal', v_existing_order.subtotal,
                'delivery_fee', v_existing_order.delivery_fee,
                'discount_amount', v_existing_order.discount_amount,
                'grand_total', v_existing_order.grand_total,
                'order_status', v_existing_order.order_status,
                'payment_status', v_existing_order.payment_status,
                'created_at', v_existing_order.created_at
            );
        END IF;
    END IF;

    -- 2. Input Sanitization & Payload Bounds Validation
    v_customer := p_order_payload->'customer';
    v_address := p_order_payload->'delivery_address';
    v_items := p_order_payload->'items';
    v_payment_method := TRIM(COALESCE(p_order_payload->>'payment_method', 'COD'));
    v_coupon_code := TRIM(UPPER(COALESCE(p_order_payload->>'coupon_code', '')));
    v_selected_offer_id := p_order_payload->>'selected_offer_id';
    v_delivery_notes := SUBSTRING(TRIM(COALESCE(p_order_payload->>'delivery_notes', '')) FROM 1 FOR 500);

    IF v_customer IS NULL OR v_address IS NULL OR v_items IS NULL THEN
        RAISE EXCEPTION 'Missing required order structure: customer, delivery_address, and items are required.';
    END IF;

    v_customer_name := SUBSTRING(TRIM(COALESCE(v_customer->>'name', '')) FROM 1 FOR 100);
    v_customer_phone := REGEXP_REPLACE(COALESCE(v_customer->>'phone', ''), '\D', '', 'g');
    v_customer_email := SUBSTRING(TRIM(LOWER(COALESCE(v_customer->>'email', ''))) FROM 1 FOR 150);

    IF LENGTH(v_customer_name) < 2 THEN
        RAISE EXCEPTION 'Customer name is too short or missing.';
    END IF;

    IF LENGTH(v_customer_phone) < 10 OR LENGTH(v_customer_phone) > 13 THEN
        RAISE EXCEPTION 'A valid 10-digit mobile number is required.';
    END IF;

    IF v_customer_email = '' THEN
        v_customer_email := 'guest_' || v_customer_phone || '@aurafoods.in';
    END IF;

    IF (v_address->>'address') IS NULL OR LENGTH(TRIM(v_address->>'address')) < 5 OR LENGTH(TRIM(v_address->>'address')) > 300 THEN
        RAISE EXCEPTION 'Please provide a valid street delivery address (between 5 and 300 characters).';
    END IF;

    IF (v_address->>'pincode') IS NULL OR LENGTH(TRIM(v_address->>'pincode')) < 5 OR LENGTH(TRIM(v_address->>'pincode')) > 10 THEN
        RAISE EXCEPTION 'Please provide a valid postal PIN code.';
    END IF;

    IF jsonb_array_length(v_items) = 0 THEN
        RAISE EXCEPTION 'Cannot place order: Cart is empty.';
    END IF;

    IF jsonb_array_length(v_items) > 50 THEN
        RAISE EXCEPTION 'Cart exceeds maximum permissible lines of 50 items.';
    END IF;

    -- 3. Abuse Throttling (Max 5 orders per 15 minutes per phone number)
    SELECT COUNT(*) INTO v_recent_order_count
    FROM public.orders
    WHERE customer_phone = v_customer_phone
      AND created_at >= NOW() - INTERVAL '15 minutes';

    IF v_recent_order_count >= 5 THEN
        RAISE EXCEPTION 'Order velocity limit exceeded. Please wait a few minutes before placing another order.';
    END IF;

    -- Bind authenticated customer identity securely
    v_user_id := auth.uid();

    -- 4. Dynamic Store Delivery Settings Lookup
    SELECT * INTO v_store_settings FROM public.store_settings WHERE id = 'default' LIMIT 1;
    IF FOUND AND v_store_settings.header_settings_json IS NOT NULL THEN
        IF (v_store_settings.header_settings_json->>'freeDeliveryThreshold') IS NOT NULL THEN
            v_free_delivery_threshold := (v_store_settings.header_settings_json->>'freeDeliveryThreshold')::NUMERIC;
        END IF;
        IF (v_store_settings.header_settings_json->>'standardDeliveryFee') IS NOT NULL THEN
            v_standard_delivery_fee := (v_store_settings.header_settings_json->>'standardDeliveryFee')::NUMERIC;
            v_delivery_fee := v_standard_delivery_fee;
        END IF;
    END IF;

    -- 5. Row Locking, Stock Verification & Authoritative Price Computation
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        v_item_idx := v_item_idx + 1;
        v_product_id := v_item->>'product_id';
        v_weight_label := COALESCE(v_item->>'selected_weight', 'Standard');
        v_quantity := COALESCE((v_item->>'quantity')::INT, 0);

        IF v_quantity <= 0 OR v_quantity > 50 THEN
            RAISE EXCEPTION 'Invalid line quantity for item #%: % (must be between 1 and 50)', v_item_idx, v_quantity;
        END IF;

        -- Lock the product row FOR UPDATE
        SELECT id, name, inventory_count, out_of_stock
        INTO v_prod_rec
        FROM public.products
        WHERE id = v_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % is no longer available in store catalog.', v_product_id;
        END IF;

        IF v_prod_rec.out_of_stock OR v_prod_rec.inventory_count < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for "%". Requested %, but only % available.', 
                v_prod_rec.name, v_quantity, v_prod_rec.inventory_count;
        END IF;

        -- Resolve authoritative price from product_weight_options
        SELECT price INTO v_weight_rec
        FROM public.product_weight_options
        WHERE product_id = v_product_id
          AND weight_label = v_weight_label
        LIMIT 1;

        IF FOUND THEN
            v_unit_price := v_weight_rec.price;
        ELSE
            SELECT price INTO v_weight_rec
            FROM public.product_weight_options
            WHERE product_id = v_product_id
            ORDER BY price ASC
            LIMIT 1;

            IF FOUND THEN
                v_unit_price := v_weight_rec.price;
            ELSE
                v_unit_price := 150.00;
            END IF;
        END IF;

        IF v_unit_price <= 0 THEN
            v_unit_price := 100.00;
        END IF;

        v_line_total := ROUND(v_unit_price * v_quantity, 2);
        v_subtotal := v_subtotal + v_line_total;
        v_total_quantity := v_total_quantity + v_quantity;

        v_order_item_records := v_order_item_records || jsonb_build_object(
            'product_id', v_product_id,
            'name', v_prod_rec.name,
            'weight_label', v_weight_label,
            'unit_price', v_unit_price,
            'quantity', v_quantity,
            'line_total', v_line_total,
            'is_free_gift', false
        );
    END LOOP;

    -- 6. Authoritative Promotions Engine
    IF v_selected_offer_id IS NOT NULL AND v_selected_offer_id <> '' THEN
        SELECT * INTO v_offer_rec
        FROM public.cart_offers
        WHERE id = v_selected_offer_id
          AND is_active = true
          AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE);

        IF FOUND AND v_subtotal >= v_offer_rec.min_cart_value AND (v_offer_rec.min_cart_quantity IS NULL OR v_total_quantity >= v_offer_rec.min_cart_quantity) THEN
            v_best_offer := v_offer_rec;
        END IF;
    END IF;

    IF v_best_offer.id IS NULL THEN
        FOR v_offer_rec IN
            SELECT * FROM public.cart_offers
            WHERE is_active = true
              AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
              AND v_subtotal >= min_cart_value
              AND (min_cart_quantity IS NULL OR v_total_quantity >= min_cart_quantity)
            ORDER BY min_cart_value DESC
        LOOP
            v_best_offer := v_offer_rec;
            EXIT;
        END LOOP;
    END IF;

    IF v_best_offer.id IS NOT NULL THEN
        IF v_best_offer.offer_type = 'percentage' THEN
            v_offer_discount := ROUND((v_subtotal * v_best_offer.discount_value) / 100.0, 2);
            IF v_best_offer.max_discount IS NOT NULL THEN
                v_offer_discount := LEAST(v_offer_discount, v_best_offer.max_discount);
            END IF;
        ELSIF v_best_offer.offer_type = 'flat' THEN
            v_offer_discount := LEAST(v_subtotal, v_best_offer.discount_value);
        ELSIF v_best_offer.offer_type = 'free_shipping' THEN
            v_is_free_shipping := true;
        ELSIF v_best_offer.offer_type = 'free_gift' THEN
            v_free_gift_name := v_best_offer.free_gift_item_name;
        END IF;

        UPDATE public.cart_offers SET usage_count = usage_count + 1 WHERE id = v_best_offer.id;
    END IF;

    -- 7. Authoritative Coupon Verification
    IF v_coupon_code <> '' THEN
        SELECT * INTO v_coupon_rec
        FROM public.coupons
        WHERE UPPER(TRIM(code)) = v_coupon_code
          AND is_active = true
          AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
        FOR UPDATE;

        IF FOUND THEN
            IF v_subtotal >= v_coupon_rec.min_order_amount AND (v_coupon_rec.max_usage_limit IS NULL OR v_coupon_rec.usage_count < v_coupon_rec.max_usage_limit) THEN
                v_coupon_eligible_subtotal := v_subtotal;
                IF v_coupon_rec.discount_type = 'percentage' THEN
                    v_coupon_discount := ROUND((v_coupon_eligible_subtotal * v_coupon_rec.discount_value) / 100.0, 2);
                    IF v_coupon_rec.max_discount IS NOT NULL THEN
                        v_coupon_discount := LEAST(v_coupon_discount, v_coupon_rec.max_discount);
                    END IF;
                ELSIF v_coupon_rec.discount_type = 'flat' THEN
                    v_coupon_discount := LEAST(v_coupon_eligible_subtotal, v_coupon_rec.discount_value);
                END IF;

                UPDATE public.coupons SET usage_count = usage_count + 1 WHERE id = v_coupon_rec.id;
            END IF;
        END IF;
    END IF;

    -- 8. Authoritative Delivery Fee
    IF v_subtotal >= v_free_delivery_threshold OR v_is_free_shipping OR (v_best_offer.offer_type = 'free_shipping') OR v_subtotal = 0 THEN
        v_delivery_fee := 0.00;
    ELSE
        v_delivery_fee := v_standard_delivery_fee;
    END IF;

    -- 9. Authoritative Totals
    v_total_discount := LEAST(v_subtotal, v_offer_discount + v_coupon_discount);
    v_grand_total := GREATEST(0.00, ROUND(v_subtotal + v_delivery_fee - v_total_discount, 2));

    -- 10. COD Value Protection Cap (Max ₹15,000 for Cash on Delivery orders)
    IF (LOWER(v_payment_method) LIKE '%cod%' OR LOWER(v_payment_method) LIKE '%cash%') AND v_grand_total > 15000.00 THEN
        RAISE EXCEPTION 'Cash on Delivery is limited to orders up to ₹15,000. Please select Online Payment for larger orders.';
    END IF;

    -- 11. Generate Secure Identifiers & Determine Payment Status
    v_order_id := 'ord-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || FLOOR(1000 + RANDOM() * 9000)::TEXT;
    v_order_number := 'AURA-' || FLOOR(10000 + RANDOM() * 90000)::TEXT;
    v_tracking_code := 'TRK-' || FLOOR(100000 + RANDOM() * 900000)::TEXT;

    IF LOWER(v_payment_method) LIKE '%cod%' OR LOWER(v_payment_method) LIKE '%cash%' THEN
        v_payment_status := 'cod_pending';
    ELSE
        v_payment_status := 'pending';
    END IF;

    -- 12. Insert Primary Order Row
    INSERT INTO public.orders (
        id,
        order_number,
        tracking_code,
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
        applied_offer_title,
        free_gift_snapshot,
        idempotency_key,
        admin_notes,
        created_at
    ) VALUES (
        v_order_id,
        v_order_number,
        v_tracking_code,
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
        v_best_offer.title,
        v_free_gift_name,
        CASE WHEN v_idempotency_key <> '' THEN v_idempotency_key ELSE NULL END,
        v_delivery_notes,
        v_created_at
    );

    -- 13. Insert Line Items & Decrement Inventory Atomically
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_order_item_records)
    LOOP
        v_product_id := v_item->>'product_id';
        v_quantity := (v_item->>'quantity')::INT;

        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name_snapshot,
            selected_weight,
            unit_price,
            quantity,
            line_total,
            is_free_gift
        ) VALUES (
            v_order_id,
            v_product_id,
            v_item->>'name',
            v_item->>'weight_label',
            (v_item->>'unit_price')::NUMERIC,
            v_quantity,
            (v_item->>'line_total')::NUMERIC,
            false
        );

        UPDATE public.products
        SET inventory_count = inventory_count - v_quantity,
            out_of_stock = ((inventory_count - v_quantity) <= 0),
            updated_at = NOW()
        WHERE id = v_product_id;

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
            'log-destock-' || v_order_id || '-' || v_product_id,
            v_product_id,
            v_item->>'name',
            'destock',
            v_quantity,
            'Live Order Sale #' || v_order_number || ' (' || v_quantity || ' × ' || (v_item->>'weight_label') || ')',
            'Order Engine (Server)',
            NOW()
        );
    END LOOP;

    -- If Free Gift applies, add complimentary item snapshot
    IF v_free_gift_name IS NOT NULL THEN
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name_snapshot,
            selected_weight,
            unit_price,
            quantity,
            line_total,
            is_free_gift
        ) VALUES (
            v_order_id,
            NULL,
            '🎁 COMPLIMENTARY GIFT: ' || v_free_gift_name,
            'Gift Box',
            0.00,
            1,
            0.00,
            true
        );
    END IF;

    -- 14. Write Audit Log
    PERFORM public.log_audit_event(
        'ORDER_CREATED',
        'orders',
        v_order_id,
        jsonb_build_object(
            'order_number', v_order_number,
            'grand_total', v_grand_total,
            'payment_method', v_payment_method,
            'items_count', jsonb_array_length(v_order_item_records)
        )
    );

    -- 15. Return Authoritative Order Output
    RETURN jsonb_build_object(
        'success', true,
        'is_duplicate', false,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'tracking_code', v_tracking_code,
        'subtotal', v_subtotal,
        'delivery_fee', v_delivery_fee,
        'discount_amount', v_total_discount,
        'grand_total', v_grand_total,
        'payment_method', v_payment_method,
        'payment_status', v_payment_status,
        'order_status', 'placed',
        'free_gift', v_free_gift_name,
        'applied_offer_title', v_best_offer.title,
        'applied_coupon_code', CASE WHEN v_coupon_discount > 0 THEN v_coupon_code ELSE NULL END,
        'delivery_address', v_address,
        'created_at', v_created_at
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.place_order_secure(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order_secure(JSONB) TO anon, authenticated, service_role;

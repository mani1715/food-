-- ==============================================================================
-- Migration: 20261023_012_order_id_prefix_aishu.sql
-- Description: Authoritative place_order_secure RPC with 'Aishu-00' prefix,
--              schema prerequisites, and PostgREST schema cache reload.
-- ==============================================================================

-- 1. Enable pgcrypto and uuid-ossp extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Ensure Orders Table Columns & Constraints Exist
ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS payment_session_token TEXT,
    ADD COLUMN IF NOT EXISTS payment_token_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
    ADD COLUMN IF NOT EXISTS applied_coupon_code TEXT,
    ADD COLUMN IF NOT EXISTS applied_offer_title TEXT,
    ADD COLUMN IF NOT EXISTS free_gift_snapshot TEXT,
    ADD COLUMN IF NOT EXISTS admin_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_payment_token 
    ON public.orders (payment_session_token) 
    WHERE payment_session_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key 
    ON public.orders (idempotency_key) 
    WHERE idempotency_key IS NOT NULL;

-- 3. Ensure Order Items Table Columns Exist
ALTER TABLE public.order_items 
    ADD COLUMN IF NOT EXISTS line_total NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_free_gift BOOLEAN DEFAULT false;

-- 4. Ensure Supporting Tables Exist
CREATE TABLE IF NOT EXISTS public.stock_history_logs (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    type TEXT NOT NULL,
    quantity INT NOT NULL,
    previous_stock INT,
    new_stock INT,
    note TEXT,
    admin_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cart_offers (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    offer_type TEXT NOT NULL DEFAULT 'percentage' CHECK (offer_type IN ('percentage', 'flat', 'free_shipping', 'free_gift')),
    discount_value NUMERIC NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
    min_cart_value NUMERIC NOT NULL DEFAULT 0 CHECK (min_cart_value >= 0),
    min_cart_quantity INT DEFAULT 0,
    max_discount NUMERIC,
    free_gift_item_name TEXT,
    badge_text TEXT,
    expiry_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    auto_apply BOOLEAN NOT NULL DEFAULT true,
    usage_count INT NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    actor_email TEXT,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Safe Audit Logging Helper
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action TEXT,
    p_entity TEXT,
    p_entity_id TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, metadata, created_at)
    VALUES (
        auth.uid(),
        COALESCE(auth.jwt()->>'email', 'system'),
        p_action,
        p_entity,
        p_entity_id,
        COALESCE(p_metadata, '{}'::jsonb),
        NOW()
    );
EXCEPTION WHEN OTHERS THEN
    NULL; -- Non-blocking audit logger
END;
$$;

-- 6. Validate Checkout Quote RPC (For Live Price Preview)
CREATE OR REPLACE FUNCTION public.validate_checkout_quote(
    p_quote_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_items JSONB;
    v_item JSONB;
    v_item_idx INT := 0;
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
    
    v_delivery_fee NUMERIC := 49.00;
    v_total_discount NUMERIC := 0;
    v_grand_total NUMERIC := 0;
    v_item_previews JSONB := '[]'::jsonb;
BEGIN
    v_items := p_quote_payload->'items';
    v_coupon_code := TRIM(UPPER(COALESCE(p_quote_payload->>'coupon_code', '')));
    v_selected_offer_id := p_quote_payload->>'selected_offer_id';

    IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Cart is empty');
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        v_item_idx := v_item_idx + 1;
        v_product_id := v_item->>'product_id';
        v_weight_label := COALESCE(v_item->>'selected_weight', 'Standard');
        v_quantity := COALESCE((v_item->>'quantity')::INT, 0);

        IF v_quantity <= 0 OR v_quantity > 50 THEN
            RETURN jsonb_build_object('valid', false, 'error', 'Invalid quantity for item ' || v_item_idx);
        END IF;

        SELECT id, name, category_id, inventory_count, out_of_stock, price
        INTO v_prod_rec
        FROM public.products
        WHERE id = v_product_id;

        IF NOT FOUND THEN
            RETURN jsonb_build_object('valid', false, 'error', 'Product not found: ' || v_product_id);
        END IF;

        SELECT price INTO v_weight_rec
        FROM public.product_weight_options
        WHERE product_id = v_product_id AND LOWER(TRIM(weight_label)) = LOWER(TRIM(v_weight_label))
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
                v_unit_price := COALESCE(v_prod_rec.price, 150.00);
            END IF;
        END IF;

        v_line_total := ROUND(v_unit_price * v_quantity, 2);
        v_subtotal := v_subtotal + v_line_total;
        v_total_quantity := v_total_quantity + v_quantity;

        v_item_previews := v_item_previews || jsonb_build_object(
            'product_id', v_product_id,
            'name', v_prod_rec.name,
            'selected_weight', v_weight_label,
            'unit_price', v_unit_price,
            'quantity', v_quantity,
            'line_total', v_line_total,
            'available_stock', COALESCE(v_prod_rec.inventory_count, 0),
            'in_stock', (NOT COALESCE(v_prod_rec.out_of_stock, false) AND COALESCE(v_prod_rec.inventory_count, 0) >= v_quantity)
        );
    END LOOP;

    -- Calculate cart offers
    IF v_selected_offer_id IS NOT NULL AND v_selected_offer_id <> '' THEN
        SELECT * INTO v_offer_rec
        FROM public.cart_offers
        WHERE id = v_selected_offer_id AND is_active = true AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE);

        IF FOUND AND v_subtotal >= v_offer_rec.min_cart_value THEN
            v_best_offer := v_offer_rec;
        END IF;
    END IF;

    IF v_best_offer.id IS NULL THEN
        FOR v_offer_rec IN
            SELECT * FROM public.cart_offers
            WHERE is_active = true AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE) AND min_cart_value <= v_subtotal
            ORDER BY min_cart_value DESC
            LIMIT 1
        LOOP
            v_best_offer := v_offer_rec;
        END LOOP;
    END IF;

    IF v_best_offer.id IS NOT NULL THEN
        IF v_best_offer.offer_type = 'percentage' THEN
            v_offer_discount := ROUND((v_subtotal * v_best_offer.discount_value) / 100.0, 2);
            IF v_best_offer.max_discount IS NOT NULL AND v_best_offer.max_discount > 0 THEN
                v_offer_discount := LEAST(v_offer_discount, v_best_offer.max_discount);
            END IF;
        ELSIF v_best_offer.offer_type = 'flat' THEN
            v_offer_discount := LEAST(v_subtotal, v_best_offer.discount_value);
        ELSIF v_best_offer.offer_type = 'free_shipping' THEN
            v_is_free_shipping := true;
        ELSIF v_best_offer.offer_type = 'free_gift' THEN
            v_free_gift_name := COALESCE(v_best_offer.free_gift_item_name, 'Complimentary Gourmet Treat');
        END IF;
    END IF;

    -- Calculate coupons
    IF v_coupon_code <> '' THEN
        SELECT * INTO v_coupon_rec
        FROM public.coupons
        WHERE UPPER(code) = v_coupon_code AND is_active = true;

        IF FOUND THEN
            v_coupon_eligible_subtotal := GREATEST(0.00, v_subtotal - v_offer_discount);
            IF v_coupon_eligible_subtotal >= COALESCE(v_coupon_rec.min_order_amount, 0) THEN
                IF v_coupon_rec.discount_type = 'percentage' THEN
                    v_coupon_discount := ROUND((v_coupon_eligible_subtotal * v_coupon_rec.discount_value) / 100.0, 2);
                ELSE
                    v_coupon_discount := LEAST(v_coupon_eligible_subtotal, v_coupon_rec.discount_value);
                END IF;
            END IF;
        END IF;
    END IF;

    IF v_subtotal >= 499.00 OR v_is_free_shipping THEN
        v_delivery_fee := 0.00;
    ELSE
        v_delivery_fee := 49.00;
    END IF;

    v_total_discount := LEAST(v_subtotal, v_offer_discount + v_coupon_discount);
    v_grand_total := GREATEST(0.00, ROUND(v_subtotal + v_delivery_fee - v_total_discount, 2));

    RETURN jsonb_build_object(
        'valid', true,
        'subtotal', v_subtotal,
        'delivery_fee', v_delivery_fee,
        'offer_discount', v_offer_discount,
        'coupon_discount', v_coupon_discount,
        'total_discount', v_total_discount,
        'grand_total', v_grand_total,
        'is_free_shipping', v_is_free_shipping,
        'free_gift', v_free_gift_name,
        'applied_offer_title', v_best_offer.title,
        'applied_coupon_code', CASE WHEN v_coupon_discount > 0 THEN v_coupon_code ELSE NULL END,
        'items', v_item_previews
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_checkout_quote(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_checkout_quote(JSONB) TO anon, authenticated, service_role;

-- 7. Authoritative Place Order Secure RPC
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
    v_item JSONB;
    v_item_idx INT := 0;
    v_product_id TEXT;
    v_weight_label TEXT;
    v_quantity INT;
    v_prod_rec RECORD;
    v_weight_rec RECORD;
    v_unit_price NUMERIC;
    v_line_total NUMERIC;
    v_subtotal NUMERIC := 0;
    v_total_quantity INT := 0;
    
    v_payment_method TEXT;
    v_coupon_code TEXT;
    v_selected_offer_id TEXT;
    v_delivery_notes TEXT;
    v_idempotency_key TEXT;
    
    v_coupon_rec RECORD;
    v_coupon_discount NUMERIC := 0;
    v_coupon_eligible_subtotal NUMERIC := 0;
    
    v_offer_rec RECORD;
    v_best_offer RECORD;
    v_offer_discount NUMERIC := 0;
    v_is_free_shipping BOOLEAN := false;
    v_free_gift_name TEXT := NULL;
    
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
    v_order_item_records JSONB := '[]'::jsonb;
    v_created_at TIMESTAMPTZ := NOW();
    v_existing_order RECORD;
BEGIN
    -- 1. Idempotency Check
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
    v_selected_offer_id := p_order_payload->>'selected_offer_id';
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
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        v_item_idx := v_item_idx + 1;
        v_product_id := v_item->>'product_id';
        v_weight_label := COALESCE(v_item->>'selected_weight', 'Standard');
        v_quantity := COALESCE((v_item->>'quantity')::INT, 0);

        IF v_quantity <= 0 OR v_quantity > 50 THEN
            RAISE EXCEPTION 'Invalid line quantity for item #%: % (must be between 1 and 50)', v_item_idx, v_quantity;
        END IF;

        -- Lock product row FOR UPDATE to prevent race conditions
        SELECT id, name, inventory_count, out_of_stock, price
        INTO v_prod_rec
        FROM public.products
        WHERE id = v_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % is no longer available in store catalog.', v_product_id;
        END IF;

        IF v_prod_rec.out_of_stock OR v_prod_rec.inventory_count < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for "%". Requested %, but only % available.', 
                v_prod_rec.name, v_quantity, GREATEST(0, COALESCE(v_prod_rec.inventory_count, 0));
        END IF;

        -- Resolve authoritative price from product_weight_options
        SELECT price INTO v_weight_rec
        FROM public.product_weight_options
        WHERE product_id = v_product_id
          AND LOWER(TRIM(weight_label)) = LOWER(TRIM(v_weight_label))
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
                v_unit_price := COALESCE(v_prod_rec.price, 150.00);
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

    -- 4. Tiered Promotional Cart Offers
    IF v_selected_offer_id IS NOT NULL AND v_selected_offer_id <> '' THEN
        SELECT * INTO v_offer_rec
        FROM public.cart_offers
        WHERE id = v_selected_offer_id
          AND is_active = true
          AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE);

        IF FOUND AND v_subtotal >= v_offer_rec.min_cart_value THEN
            v_best_offer := v_offer_rec;
        END IF;
    END IF;

    IF v_best_offer.id IS NULL THEN
        FOR v_offer_rec IN
            SELECT * FROM public.cart_offers
            WHERE is_active = true
              AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
              AND min_cart_value <= v_subtotal
            ORDER BY min_cart_value DESC
            LIMIT 1
        LOOP
            v_best_offer := v_offer_rec;
        END LOOP;
    END IF;

    IF v_best_offer.id IS NOT NULL THEN
        IF v_best_offer.offer_type = 'percentage' THEN
            v_offer_discount := ROUND((v_subtotal * v_best_offer.discount_value) / 100.0, 2);
            IF v_best_offer.max_discount IS NOT NULL AND v_best_offer.max_discount > 0 THEN
                v_offer_discount := LEAST(v_offer_discount, v_best_offer.max_discount);
            END IF;
        ELSIF v_best_offer.offer_type = 'flat' THEN
            v_offer_discount := LEAST(v_subtotal, v_best_offer.discount_value);
        ELSIF v_best_offer.offer_type = 'free_shipping' THEN
            v_is_free_shipping := true;
        ELSIF v_best_offer.offer_type = 'free_gift' THEN
            v_free_gift_name := COALESCE(v_best_offer.free_gift_item_name, 'Complimentary Gourmet Treat');
        END IF;
    END IF;

    -- 5. Promotional Coupon Validation
    IF v_coupon_code <> '' THEN
        SELECT * INTO v_coupon_rec
        FROM public.coupons
        WHERE UPPER(code) = v_coupon_code AND is_active = true
        FOR UPDATE;

        IF FOUND THEN
            v_coupon_eligible_subtotal := GREATEST(0.00, v_subtotal - v_offer_discount);
            IF v_coupon_eligible_subtotal >= COALESCE(v_coupon_rec.min_order_amount, 0) THEN
                IF v_coupon_rec.discount_type = 'percentage' THEN
                    v_coupon_discount := ROUND((v_coupon_eligible_subtotal * v_coupon_rec.discount_value) / 100.0, 2);
                ELSE
                    v_coupon_discount := LEAST(v_coupon_eligible_subtotal, v_coupon_rec.discount_value);
                END IF;

                UPDATE public.coupons 
                SET usage_count = usage_count + 1 
                WHERE id = v_coupon_rec.id;
            END IF;
        END IF;
    END IF;

    -- 6. Authoritative Delivery Fee
    IF v_subtotal >= 499.00 OR v_is_free_shipping THEN
        v_delivery_fee := 0.00;
    ELSE
        v_delivery_fee := 49.00;
    END IF;

    -- 7. Authoritative Totals
    v_total_discount := LEAST(v_subtotal, v_offer_discount + v_coupon_discount);
    v_grand_total := GREATEST(0.00, ROUND(v_subtotal + v_delivery_fee - v_total_discount, 2));

    -- 8. Generate Identifiers with "Aishu-00" prefix & 256-bit Session Token
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

    -- 9. Insert Primary Order Row
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
        applied_offer_title,
        free_gift_snapshot,
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
        v_best_offer.title,
        v_free_gift_name,
        CASE WHEN v_idempotency_key <> '' THEN v_idempotency_key ELSE NULL END,
        v_delivery_notes,
        v_created_at
    );

    -- 10. Insert Line Items & Decrement Inventory Atomically
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
        SET inventory_count = GREATEST(0, inventory_count - v_quantity),
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
            'stk-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || FLOOR(1000 + RANDOM() * 9000)::TEXT,
            v_product_id,
            v_item->>'name',
            'Order Placed',
            -v_quantity,
            'Reserved via Order #' || v_order_number,
            'Automated Checkout System',
            NOW()
        );
    END LOOP;

    -- Optional Free Gift Line Item
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

    -- 11. Write Audit Log
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

    -- 12. Return Authoritative Order Output
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
        'free_gift', v_free_gift_name,
        'applied_offer_title', v_best_offer.title,
        'applied_coupon_code', CASE WHEN v_coupon_discount > 0 THEN v_coupon_code ELSE NULL END,
        'delivery_address', v_address,
        'items_count', jsonb_array_length(v_order_item_records),
        'created_at', v_created_at
    );
END;
$$;

-- 8. Grant Execution Privileges
REVOKE EXECUTE ON FUNCTION public.place_order_secure(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order_secure(JSONB) TO anon, authenticated, service_role;

-- 9. Force PostgREST to Immediately Reload Schema Cache
NOTIFY pgrst, 'reload schema';

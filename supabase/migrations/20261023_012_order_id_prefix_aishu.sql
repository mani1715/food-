-- ==============================================================================
-- Migration: 20261023_012_order_id_prefix_aishu.sql
-- Description: Update order number generator prefix to "Aishu-00" in place_order_secure RPC
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.place_order_secure(p_order_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_idempotency_key TEXT;
    v_customer JSONB;
    v_address JSONB;
    v_items JSONB;
    v_payment_method TEXT;
    v_coupon_code TEXT;
    v_selected_offer_id TEXT;
    v_delivery_notes TEXT;
    
    v_item RECORD;
    v_db_product RECORD;
    v_db_price NUMERIC;
    v_quantity INT;
    v_item_subtotal NUMERIC;
    v_subtotal NUMERIC := 0;
    
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
               payment_session_token
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
    v_customer_phone := REGEXP_REPLACE(COALESCE(v_customer->>'phone', ''), '\D', '', 'g');
    v_customer_email := TRIM(COALESCE(v_customer->>'email', ''));

    IF LENGTH(v_customer_name) < 2 THEN
        RAISE EXCEPTION 'Customer name must be at least 2 characters.';
    END IF;
    IF LENGTH(v_customer_phone) < 10 THEN
        RAISE EXCEPTION 'Customer phone number must contain at least 10 valid digits.';
    END IF;
    IF jsonb_array_length(v_items) = 0 THEN
        RAISE EXCEPTION 'Order cannot be empty. At least one food item must be selected.';
    END IF;

    -- 3. Strict Inventory Locking & Subtotal Accumulation
    FOR v_item IN SELECT * FROM jsonb_to_recordset(v_items) AS x(
        product_id TEXT,
        selected_weight TEXT,
        quantity INT
    ) LOOP
        v_quantity := COALESCE(v_item.quantity, 0);
        IF v_quantity <= 0 OR v_quantity > 50 THEN
            RAISE EXCEPTION 'Invalid item quantity % for item %. Must be between 1 and 50.', v_quantity, v_item.product_id;
        END IF;

        SELECT id, name, price, inventory_count, out_of_stock, is_veg, category_id
        INTO v_db_product
        FROM public.products
        WHERE id = v_item.product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product with ID % does not exist in catalog.', v_item.product_id;
        END IF;

        IF v_db_product.out_of_stock = true OR v_db_product.inventory_count < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for "%". Requested %, available: %.', 
                v_db_product.name, v_quantity, GREATEST(0, v_db_product.inventory_count);
        END IF;

        SELECT price INTO v_db_price
        FROM public.product_weight_options
        WHERE product_id = v_item.product_id 
          AND LOWER(TRIM(weight_label)) = LOWER(TRIM(COALESCE(v_item.selected_weight, '')));

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

        IF v_db_price <= 0 THEN
            RAISE EXCEPTION 'Invalid calculated price for item %.', v_db_product.name;
        END IF;

        v_item_subtotal := ROUND(v_db_price * v_quantity, 2);
        v_subtotal := v_subtotal + v_item_subtotal;

        v_order_item_records := v_order_item_records || jsonb_build_object(
            'product_id', v_db_product.id,
            'product_name', v_db_product.name,
            'selected_weight', COALESCE(v_item.selected_weight, 'Standard'),
            'unit_price', v_db_price,
            'quantity', v_quantity,
            'line_total', v_item_subtotal
        );
    END LOOP;

    -- 4. Tiered Promotional Cart Offers
    IF v_selected_offer_id IS NOT NULL AND v_selected_offer_id <> '' THEN
        SELECT * INTO v_best_offer
        FROM public.cart_offers
        WHERE id = v_selected_offer_id AND is_enabled = true;
    ELSE
        SELECT * INTO v_best_offer
        FROM public.cart_offers
        WHERE is_enabled = true AND min_order_value <= v_subtotal
        ORDER BY min_order_value DESC
        LIMIT 1;
    END IF;

    IF v_best_offer.id IS NOT NULL AND v_subtotal >= v_best_offer.min_order_value THEN
        IF v_best_offer.discount_percentage > 0 THEN
            v_offer_discount := ROUND((v_subtotal * v_best_offer.discount_percentage) / 100.0, 2);
            IF v_best_offer.max_discount_cap IS NOT NULL AND v_best_offer.max_discount_cap > 0 THEN
                v_offer_discount := LEAST(v_offer_discount, v_best_offer.max_discount_cap);
            END IF;
        END IF;
        IF v_best_offer.free_shipping = true THEN
            v_is_free_shipping := true;
        END IF;
        v_free_gift_name := v_best_offer.free_gift;
    ELSE
        v_best_offer := NULL;
    END IF;

    -- 5. Promotional Coupon Validation
    IF v_coupon_code <> '' THEN
        SELECT * INTO v_coupon_rec
        FROM public.coupons
        WHERE UPPER(code) = v_coupon_code AND is_active = true
        FOR UPDATE;

        IF FOUND THEN
            IF (v_coupon_rec.expiry_date IS NULL OR v_coupon_rec.expiry_date > NOW()) AND
               (v_coupon_rec.usage_limit IS NULL OR v_coupon_rec.times_used < v_coupon_rec.usage_limit) AND
               (v_subtotal >= v_coupon_rec.min_order_value) THEN
               
                IF v_coupon_rec.discount_type = 'percentage' THEN
                    v_coupon_discount := ROUND((v_subtotal * v_coupon_rec.discount_value) / 100.0, 2);
                    IF v_coupon_rec.max_discount_cap IS NOT NULL AND v_coupon_rec.max_discount_cap > 0 THEN
                        v_coupon_discount := LEAST(v_coupon_discount, v_coupon_rec.max_discount_cap);
                    END IF;
                ELSE
                    v_coupon_discount := LEAST(v_subtotal, v_coupon_rec.discount_value);
                END IF;

                UPDATE public.coupons
                SET times_used = times_used + 1
                WHERE id = v_coupon_rec.id;
            END IF;
        END IF;
    END IF;

    -- 6. Delivery Fee Calculation
    IF v_is_free_shipping = true OR v_subtotal >= 499.00 THEN
        v_delivery_fee := 0.00;
    ELSE
        v_delivery_fee := 49.00;
    END IF;

    -- 7. Authoritative Totals
    v_total_discount := LEAST(v_subtotal, v_offer_discount + v_coupon_discount);
    v_grand_total := GREATEST(0.00, ROUND(v_subtotal + v_delivery_fee - v_total_discount, 2));

    -- 8. Generate Identifiers with "Aishu-00" prefix
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
        v_coupon_code,
        v_best_offer.title,
        v_free_gift_name,
        v_idempotency_key,
        v_delivery_notes,
        v_created_at
    );

    -- 10. Insert Snapshotted Order Items & Deduct Physical Inventory
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_order_item_records) LOOP
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name_snapshot,
            selected_weight,
            unit_price,
            quantity
        ) VALUES (
            v_order_id,
            v_item.value->>'product_id',
            v_item.value->>'product_name',
            v_item.value->>'selected_weight',
            (v_item.value->>'unit_price')::NUMERIC,
            (v_item.value->>'quantity')::INT
        );

        UPDATE public.products
        SET inventory_count = GREATEST(0, inventory_count - (v_item.value->>'quantity')::INT),
            out_of_stock = CASE WHEN (inventory_count - (v_item.value->>'quantity')::INT) <= 0 THEN true ELSE false END,
            updated_at = NOW()
        WHERE id = v_item.value->>'product_id';

        INSERT INTO public.stock_history_logs (
            id,
            product_id,
            product_name,
            type,
            quantity,
            previous_stock,
            new_stock,
            note,
            admin_name,
            created_at
        )
        SELECT
            'log-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || FLOOR(1000 + RANDOM() * 9000)::TEXT,
            v_item.value->>'product_id',
            v_item.value->>'product_name',
            'destock',
            (v_item.value->>'quantity')::INT,
            p.inventory_count + (v_item.value->>'quantity')::INT,
            p.inventory_count,
            'Reserved via Order #' || v_order_number,
            'E-Commerce Checkout',
            NOW()
        FROM public.products p
        WHERE p.id = v_item.value->>'product_id';
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'tracking_code', v_tracking_code,
        'payment_session_token', v_payment_session_token,
        'subtotal', v_subtotal,
        'delivery_fee', v_delivery_fee,
        'discount_amount', v_total_discount,
        'grand_total', v_grand_total,
        'order_status', 'placed',
        'payment_status', v_payment_status,
        'payment_method', v_payment_method,
        'items_count', jsonb_array_length(v_order_item_records),
        'created_at', v_created_at
    );
END;
$$;

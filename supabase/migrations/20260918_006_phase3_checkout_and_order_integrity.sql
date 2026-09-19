-- ==============================================================================
-- MIGRATION 006: AISHU HOME FOODS — SERVER-AUTHORITATIVE CHECKOUT & ORDER INTEGRITY
-- ==============================================================================
-- This migration establishes:
-- 1. Cart Offers table & enhancements to coupons, orders, and order_items tables.
-- 2. Validate Checkout Quote RPC (trusted real-time pricing preview).
-- 3. Place Order Secure RPC (atomic checkout transaction, server price lookup,
--    coupon/promotion validation, row locking, stock deduction, idempotency).
-- 4. Cancel Order Secure RPC (idempotent restock and transition safety).
-- 5. Update Order Status Secure RPC (RBAC permission & state machine enforcement).
-- 6. Strict RLS updates removing unverified direct client inserts on orders.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SCHEMA ENHANCEMENTS (Orders, Order Items, Coupons, Cart Offers)
-- ------------------------------------------------------------------------------

-- Ensure orders table has all Phase 3 columns & constraints
DO $$
BEGIN
    -- Idempotency key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'idempotency_key'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN idempotency_key TEXT UNIQUE;
    END IF;

    -- Applied coupon code snapshot
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'applied_coupon_code'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN applied_coupon_code TEXT;
    END IF;

    -- Applied offer title snapshot
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'applied_offer_title'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN applied_offer_title TEXT;
    END IF;

    -- Free gift snapshot
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'free_gift_snapshot'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN free_gift_snapshot TEXT;
    END IF;

    -- Cancelled at timestamp
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN cancelled_at TIMESTAMPTZ;
    END IF;
END $$;

-- Enhance order_items with line_total and is_free_gift
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'line_total'
    ) THEN
        ALTER TABLE public.order_items ADD COLUMN line_total NUMERIC NOT NULL DEFAULT 0 CHECK (line_total >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'is_free_gift'
    ) THEN
        ALTER TABLE public.order_items ADD COLUMN is_free_gift BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- Enhance coupons table with granular target & cap columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'coupons' AND column_name = 'description'
    ) THEN
        ALTER TABLE public.coupons ADD COLUMN description TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'coupons' AND column_name = 'applies_to'
    ) THEN
        ALTER TABLE public.coupons ADD COLUMN applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'category', 'product'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'coupons' AND column_name = 'target_category'
    ) THEN
        ALTER TABLE public.coupons ADD COLUMN target_category TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'coupons' AND column_name = 'target_product_id'
    ) THEN
        ALTER TABLE public.coupons ADD COLUMN target_product_id TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'coupons' AND column_name = 'max_discount'
    ) THEN
        ALTER TABLE public.coupons ADD COLUMN max_discount NUMERIC;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'coupons' AND column_name = 'max_usage_limit'
    ) THEN
        ALTER TABLE public.coupons ADD COLUMN max_usage_limit INT;
    END IF;
END $$;

-- Create CART OFFERS table (Tiered cart promotions engine)
CREATE TABLE IF NOT EXISTS public.cart_offers (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    offer_type TEXT NOT NULL CHECK (offer_type IN ('percentage', 'flat', 'free_shipping', 'free_gift')),
    discount_value NUMERIC NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
    min_cart_value NUMERIC NOT NULL DEFAULT 0 CHECK (min_cart_value >= 0),
    min_cart_quantity INT CHECK (min_cart_quantity >= 0),
    max_discount NUMERIC CHECK (max_discount >= 0),
    free_gift_item_name TEXT,
    badge_text TEXT,
    expiry_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    auto_apply BOOLEAN NOT NULL DEFAULT true,
    usage_count INT NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_offers_active ON public.cart_offers(is_active, expiry_date);

-- Enable RLS on cart_offers
ALTER TABLE public.cart_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active cart offers" ON public.cart_offers;
CREATE POLICY "Public can view active cart offers"
    ON public.cart_offers FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Staff can manage cart offers" ON public.cart_offers;
CREATE POLICY "Staff can manage cart offers"
    ON public.cart_offers FOR ALL
    TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());


-- ------------------------------------------------------------------------------
-- 2. VALIDATE CHECKOUT QUOTE RPC (Trusted Read-Only Simulation)
-- ------------------------------------------------------------------------------
-- Computes authoritative prices, subtotal, promotions, coupons, and delivery
-- without mutating the database or claiming stock.
CREATE OR REPLACE FUNCTION public.validate_checkout_quote(
    p_quote_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
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
    v_warnings JSONB := '[]'::jsonb;
BEGIN
    v_items := p_quote_payload->'items';
    v_coupon_code := TRIM(UPPER(COALESCE(p_quote_payload->>'coupon_code', '')));
    v_selected_offer_id := p_quote_payload->>'selected_offer_id';

    IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Cart is empty'
        );
    END IF;

    IF jsonb_array_length(v_items) > 50 THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Cart exceeds maximum limit of 50 distinct items'
        );
    END IF;

    -- 1. Validate each line item and fetch authoritative prices
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        v_item_idx := v_item_idx + 1;
        v_product_id := v_item->>'product_id';
        v_weight_label := COALESCE(v_item->>'selected_weight', 'Standard');
        v_quantity := COALESCE((v_item->>'quantity')::INT, 0);

        IF v_quantity <= 0 OR v_quantity > 50 THEN
            RETURN jsonb_build_object(
                'valid', false,
                'error', 'Invalid quantity for item ' || v_item_idx || '. Must be between 1 and 50.'
            );
        END IF;

        -- Fetch product from database
        SELECT id, name, category_id, inventory_count, out_of_stock
        INTO v_prod_rec
        FROM public.products
        WHERE id = v_product_id;

        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'valid', false,
                'error', 'Product not found: ' || COALESCE(v_product_id, 'unknown')
            );
        END IF;

        IF v_prod_rec.out_of_stock OR v_prod_rec.inventory_count < v_quantity THEN
            v_warnings := v_warnings || jsonb_build_object(
                'product_id', v_product_id,
                'name', v_prod_rec.name,
                'issue', 'insufficient_stock',
                'available', v_prod_rec.inventory_count,
                'requested', v_quantity
            );
        END IF;

        -- Resolve authoritative variant/weight price
        SELECT price INTO v_weight_rec
        FROM public.product_weight_options
        WHERE product_id = v_product_id
          AND weight_label = v_weight_label
        LIMIT 1;

        IF FOUND THEN
            v_unit_price := v_weight_rec.price;
        ELSE
            -- Fallback to first available weight option or base table if options exist
            SELECT price INTO v_weight_rec
            FROM public.product_weight_options
            WHERE product_id = v_product_id
            ORDER BY price ASC
            LIMIT 1;

            IF FOUND THEN
                v_unit_price := v_weight_rec.price;
            ELSE
                v_unit_price := 0;
            END IF;
        END IF;

        IF v_unit_price <= 0 THEN
            v_unit_price := 100.00; -- Baseline fallback
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
            'available_stock', v_prod_rec.inventory_count,
            'in_stock', (v_prod_rec.inventory_count >= v_quantity AND NOT v_prod_rec.out_of_stock)
        );
    END LOOP;

    -- 2. Authoritative Cart Offer / Promotion Evaluation
    -- Check manually selected or best auto-applying offer
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

    -- If no specific valid offer was selected, pick the best qualifying auto-apply offer
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
    END IF;

    -- 3. Authoritative Coupon Evaluation
    IF v_coupon_code <> '' THEN
        SELECT * INTO v_coupon_rec
        FROM public.coupons
        WHERE UPPER(TRIM(code)) = v_coupon_code
          AND is_active = true
          AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE);

        IF NOT FOUND THEN
            v_warnings := v_warnings || jsonb_build_object('coupon', v_coupon_code, 'issue', 'invalid_or_expired');
        ELSIF v_subtotal < v_coupon_rec.min_order_amount THEN
            v_warnings := v_warnings || jsonb_build_object(
                'coupon', v_coupon_code,
                'issue', 'min_order_not_met',
                'min_required', v_coupon_rec.min_order_amount,
                'current_subtotal', v_subtotal
            );
        ELSIF v_coupon_rec.max_usage_limit IS NOT NULL AND v_coupon_rec.usage_count >= v_coupon_rec.max_usage_limit THEN
            v_warnings := v_warnings || jsonb_build_object('coupon', v_coupon_code, 'issue', 'usage_limit_reached');
        ELSE
            IF v_coupon_rec.applies_to = 'all' THEN
                v_coupon_eligible_subtotal := v_subtotal;
            ELSE
                v_coupon_eligible_subtotal := v_subtotal;
            END IF;

            IF v_coupon_rec.discount_type = 'percentage' THEN
                v_coupon_discount := ROUND((v_coupon_eligible_subtotal * v_coupon_rec.discount_value) / 100.0, 2);
                IF v_coupon_rec.max_discount IS NOT NULL THEN
                    v_coupon_discount := LEAST(v_coupon_discount, v_coupon_rec.max_discount);
                END IF;
            ELSIF v_coupon_rec.discount_type = 'flat' THEN
                v_coupon_discount := LEAST(v_coupon_eligible_subtotal, v_coupon_rec.discount_value);
            END IF;
        END IF;
    END IF;

    -- 4. Authoritative Delivery Fee
    IF v_subtotal >= 499.00 OR v_is_free_shipping OR (v_best_offer.offer_type = 'free_shipping') OR v_subtotal = 0 THEN
        v_delivery_fee := 0.00;
        v_is_free_shipping := true;
    ELSE
        v_delivery_fee := 49.00;
    END IF;

    -- 5. Final Authoritative Grand Total
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
        'items', v_item_previews,
        'warnings', v_warnings
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_checkout_quote(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_checkout_quote(JSONB) TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 3. PLACE ORDER SECURE RPC (Atomic Order Placement Transaction)
-- ------------------------------------------------------------------------------
-- Transactional, atomic, row-locking order creation boundary.
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
    
    v_delivery_fee NUMERIC := 49.00;
    v_total_discount NUMERIC := 0;
    v_grand_total NUMERIC := 0;
    
    v_order_id TEXT;
    v_order_number TEXT;
    v_tracking_code TEXT;
    v_payment_status TEXT;
    v_created_at TIMESTAMPTZ := NOW();
    
    v_order_item_records JSONB := '[]'::jsonb;
BEGIN
    -- 1. Idempotency Check
    v_idempotency_key := TRIM(COALESCE(p_order_payload->>'idempotency_key', ''));
    
    IF v_idempotency_key <> '' THEN
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
    v_customer_email := TRIM(LOWER(COALESCE(v_customer->>'email', '')));

    IF LENGTH(v_customer_name) < 2 THEN
        RAISE EXCEPTION 'Customer name is too short or missing.';
    END IF;

    IF LENGTH(v_customer_phone) < 10 THEN
        RAISE EXCEPTION 'A valid 10-digit mobile number is required.';
    END IF;

    IF v_customer_email = '' THEN
        v_customer_email := 'guest_' || v_customer_phone || '@aurafoods.in';
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

    -- Bind authenticated customer identity securely
    v_user_id := auth.uid();

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

        -- Lock the product row FOR UPDATE to ensure concurrency safety
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

    -- 4. Authoritative Promotions Engine
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

        -- Increment offer usage count
        UPDATE public.cart_offers SET usage_count = usage_count + 1 WHERE id = v_best_offer.id;
    END IF;

    -- 5. Authoritative Coupon Verification
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

                -- Increment coupon usage count
                UPDATE public.coupons SET usage_count = usage_count + 1 WHERE id = v_coupon_rec.id;
            END IF;
        END IF;
    END IF;

    -- 6. Authoritative Delivery Fee
    IF v_subtotal >= 499.00 OR v_is_free_shipping OR (v_best_offer.offer_type = 'free_shipping') OR v_subtotal = 0 THEN
        v_delivery_fee := 0.00;
    ELSE
        v_delivery_fee := 49.00;
    END IF;

    -- 7. Authoritative Totals
    v_total_discount := LEAST(v_subtotal, v_offer_discount + v_coupon_discount);
    v_grand_total := GREATEST(0.00, ROUND(v_subtotal + v_delivery_fee - v_total_discount, 2));

    -- 8. Generate Secure Identifiers & Determine Payment Status
    v_order_id := 'ord-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || FLOOR(1000 + RANDOM() * 9000)::TEXT;
    v_order_number := 'AURA-' || FLOOR(10000 + RANDOM() * 90000)::TEXT;
    v_tracking_code := 'TRK-' || FLOOR(100000 + RANDOM() * 900000)::TEXT;

    -- Initial Payment Status: Never trust client for 'paid' or 'completed'!
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

    -- 10. Insert Line Items & Decrement Inventory Atomically
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_order_item_records)
    LOOP
        v_product_id := v_item->>'product_id';
        v_quantity := (v_item->>'quantity')::INT;

        -- Insert Line Item Snapshot
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

        -- Decrement Inventory in Products Table
        UPDATE public.products
        SET inventory_count = inventory_count - v_quantity,
            out_of_stock = ((inventory_count - v_quantity) <= 0),
            updated_at = NOW()
        WHERE id = v_product_id;

        -- Record Stock History Log
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


-- ------------------------------------------------------------------------------
-- 4. CANCEL ORDER SECURE RPC (Idempotent Restock & Transition Guard)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_order_secure(
    p_order_id TEXT,
    p_reason TEXT DEFAULT 'Customer requested cancellation'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_is_authorized BOOLEAN := false;
BEGIN
    -- Lock order row FOR UPDATE
    SELECT id, order_number, customer_id, order_status, payment_status, payment_method
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- Check Authorization: owner customer or staff
    IF public.is_staff() OR (auth.uid() IS NOT NULL AND auth.uid() = v_order.customer_id) THEN
        v_is_authorized := true;
    END IF;

    IF NOT v_is_authorized THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized to cancel this order');
    END IF;

    -- Idempotency: If already cancelled, return success without re-crediting stock!
    IF v_order.order_status = 'cancelled' THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Order was already cancelled. Stock was already restored.',
            'order_id', p_order_id,
            'order_status', 'cancelled'
        );
    END IF;

    -- Only orders in unfulfilled states can be cancelled
    IF v_order.order_status IN ('shipped', 'out for delivery', 'delivered') AND NOT public.is_super_admin() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cannot cancel order in "' || v_order.order_status || '" state. Please contact customer support.'
        );
    END IF;

    -- Restock each non-gift line item
    FOR v_item IN
        SELECT product_id, quantity, product_name_snapshot
        FROM public.order_items
        WHERE order_id = p_order_id
          AND product_id IS NOT NULL
          AND is_free_gift = false
    LOOP
        -- Lock product and restock
        UPDATE public.products
        SET inventory_count = inventory_count + v_item.quantity,
            out_of_stock = false,
            updated_at = NOW()
        WHERE id = v_item.product_id;

        -- Record Restock Log
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
            'log-restock-cancel-' || p_order_id || '-' || v_item.product_id,
            v_item.product_id,
            v_item.product_name_snapshot,
            'restock',
            v_item.quantity,
            'Restock from Cancelled Order #' || v_order.order_number,
            'Cancellation Engine (Server)',
            NOW()
        );
    END LOOP;

    -- Update Order Status
    UPDATE public.orders
    SET order_status = 'cancelled',
        cancel_reason = p_reason,
        cancelled_at = NOW()
    WHERE id = p_order_id;

    -- Audit Log
    PERFORM public.log_audit_event(
        'ORDER_CANCELLED',
        'orders',
        p_order_id,
        jsonb_build_object(
            'order_number', v_order.order_number,
            'reason', p_reason,
            'previous_status', v_order.order_status
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'order_status', 'cancelled',
        'restocked', true
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_order_secure(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_order_secure(TEXT, TEXT) TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 5. STAFF ORDER STATUS MUTATION RPC (State Machine & RBAC Guard)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_order_status_secure(
    p_order_id TEXT,
    p_new_status TEXT,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_order RECORD;
    v_valid_transition BOOLEAN := false;
BEGIN
    -- Require staff privileges
    IF NOT public.is_staff() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Staff privilege required');
    END IF;

    -- Check granular RBAC permission
    IF NOT public.has_admin_permission('orders.update') AND NOT public.is_admin_or_super() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions: orders.update required');
    END IF;

    SELECT id, order_number, order_status, payment_status, payment_method
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- If transitioning to cancelled, delegate to cancel_order_secure for atomic restock
    IF p_new_status = 'cancelled' THEN
        RETURN public.cancel_order_secure(p_order_id, COALESCE(p_admin_notes, 'Admin status change to cancelled'));
    END IF;

    -- State Machine Transitions
    IF v_order.order_status = 'placed' AND p_new_status IN ('confirmed', 'cancelled') THEN
        v_valid_transition := true;
    ELSIF v_order.order_status = 'confirmed' AND p_new_status IN ('processing', 'cancelled') THEN
        v_valid_transition := true;
    ELSIF v_order.order_status = 'processing' AND p_new_status IN ('ready_to_ship', 'cancelled') THEN
        v_valid_transition := true;
    ELSIF v_order.order_status = 'ready_to_ship' AND p_new_status IN ('shipped', 'cancelled') THEN
        v_valid_transition := true;
    ELSIF v_order.order_status = 'shipped' AND p_new_status IN ('out for delivery') THEN
        v_valid_transition := true;
    ELSIF v_order.order_status = 'out for delivery' AND p_new_status IN ('delivered') THEN
        v_valid_transition := true;
    ELSIF public.is_super_admin() THEN
        -- Super Admin emergency override
        v_valid_transition := true;
    END IF;

    IF NOT v_valid_transition THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid status transition from "' || v_order.order_status || '" to "' || p_new_status || '"'
        );
    END IF;

    -- Update order
    UPDATE public.orders
    SET order_status = p_new_status,
        admin_notes = COALESCE(p_admin_notes, admin_notes),
        shipped_at = CASE WHEN p_new_status = 'shipped' THEN NOW() ELSE shipped_at END,
        delivered_at = CASE WHEN p_new_status = 'delivered' THEN NOW() ELSE delivered_at END,
        payment_status = CASE 
            WHEN p_new_status = 'delivered' AND payment_status = 'cod_pending' THEN 'cod_collected'
            ELSE payment_status 
        END
    WHERE id = p_order_id;

    -- Audit Log
    PERFORM public.log_audit_event(
        'ORDER_STATUS_UPDATED',
        'orders',
        p_order_id,
        jsonb_build_object(
            'order_number', v_order.order_number,
            'old_status', v_order.order_status,
            'new_status', p_new_status,
            'admin_notes', p_admin_notes
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'order_status', p_new_status
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_order_status_secure(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_order_status_secure(TEXT, TEXT, TEXT) TO authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 6. STRICT RLS POLICIES (Disallow Direct Client Table INSERT on Orders)
-- ------------------------------------------------------------------------------
-- Remove direct INSERT on orders and order_items for untrusted clients.
-- All client order placements MUST go through place_order_secure RPC.
DROP POLICY IF EXISTS "Checkout can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Checkout can insert order items" ON public.order_items;

-- Admins/Staff can insert or modify orders if needed
DROP POLICY IF EXISTS "Staff can insert orders" ON public.orders;
CREATE POLICY "Staff can insert orders"
    ON public.orders FOR INSERT
    TO authenticated
    WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "Staff can insert order items" ON public.order_items;
CREATE POLICY "Staff can insert order items"
    ON public.order_items FOR INSERT
    TO authenticated
    WITH CHECK (public.is_staff());

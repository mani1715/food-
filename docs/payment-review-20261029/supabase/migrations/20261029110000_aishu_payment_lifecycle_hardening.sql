-- ==============================================================================
-- Candidate migration: 20261029110000_aishu_payment_lifecycle_hardening.sql
-- REVIEW ONLY. Do not execute until target project, schema preflight, and migration history are approved.
-- Consolidates final checkout/payment/refund/webhook/cleanup dependencies from local 012 + 013.
--              Verified against confirmed live schema on akublyjmyrcoeemuxugr.
--              Security & Architecture:
--              1. Privileged payment RPCs (finalize, record_attempt, record_failure,
--                 record_refund, cleanup) restricted strictly to service_role.
--              2. Caller-supplied p_signature_verified is not trusted by anon/authenticated.
--              3. Coupons schema matches confirmed live columns (no max_discount).
--              4. Stock reservation & release engine for cancellation and cleanup.
--              5. Delivery fee rule (subtotal > 499 => FREE, else ₹49) preserved.
--              6. Non-regressive sequence sync for order_number and tracking_code.
--              7. orders.id formatted as 'ord-' || UUID; order_items.id as 'oitem-' || UUID.
--              8. orders.payment_status strictly constrained to 'pending', 'completed', 'failed'.
--              9. Pinned search_path = pg_catalog, public, extensions, pg_temp on all functions.
-- ==============================================================================

-- Verified remote baseline gate (from read-only inspection on 2026-10-29).
-- Stop on unexpected schema drift; do not silently adapt a different project.
DO $$
BEGIN
    IF to_regclass('public.orders') IS NULL OR to_regclass('public.order_items') IS NULL
       OR to_regclass('public.products') IS NULL OR to_regclass('public.coupons') IS NULL
       OR to_regclass('public.stock_history_logs') IS NULL OR to_regclass('public.admin_roles') IS NULL
       OR to_regclass('auth.users') IS NULL OR to_regprocedure('auth.uid()') IS NULL
       OR to_regprocedure('auth.role()') IS NULL THEN
        RAISE EXCEPTION 'Required Supabase base schema/auth helpers missing; aborting candidate migration';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM (VALUES
          ('orders','id'), ('orders','order_number'), ('orders','tracking_code'),
          ('orders','customer_id'), ('orders','customer_name'), ('orders','customer_phone'),
          ('orders','customer_email'), ('orders','subtotal'), ('orders','delivery_fee'),
          ('orders','discount_amount'), ('orders','grand_total'), ('orders','payment_method'),
          ('orders','payment_status'), ('orders','order_status'), ('orders','created_at'),
          ('orders','admin_notes'), ('orders','cancel_reason'),
          ('order_items','id'), ('order_items','order_id'), ('order_items','product_id'),
          ('order_items','selected_weight'), ('order_items','unit_price'), ('order_items','quantity'),
          ('products','id'), ('products','name'), ('products','price'), ('products','category_id'),
          ('products','inventory_count'), ('products','out_of_stock'), ('products','updated_at'),
          ('product_weight_options','product_id'), ('product_weight_options','weight_label'), ('product_weight_options','price'),
          ('coupons','code'), ('coupons','is_enabled'), ('coupons','expiry_date'),
          ('coupons','min_order_amount'), ('coupons','discount_type'), ('coupons','discount_value'), ('coupons','usage_count'),
          ('stock_history_logs','id'), ('stock_history_logs','product_id'),
          ('stock_history_logs','quantity'), ('stock_history_logs','created_at'),
          ('admin_roles','user_id'), ('admin_roles','status')
        ) AS required(table_name, column_name)
        LEFT JOIN information_schema.columns c
          ON c.table_schema='public' AND c.table_name=required.table_name AND c.column_name=required.column_name
        WHERE c.column_name IS NULL
    ) THEN
        RAISE EXCEPTION 'Required checkout/cancellation/cleanup dependency columns differ from reviewed baseline; aborting candidate migration';
    END IF;
END $$;

-- 1. Ensure required cryptographic extension
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Non-Regressive Sequences for Order Numbers and Tracking Codes
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 10001;
CREATE SEQUENCE IF NOT EXISTS public.tracking_code_seq START WITH 100001;

DO $$
DECLARE
    v_max_num BIGINT;
    v_curr_num BIGINT;
    v_max_trk BIGINT;
    v_curr_trk BIGINT;
BEGIN
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

REVOKE ALL ON SEQUENCE public.order_number_seq, public.tracking_code_seq FROM PUBLIC, anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.order_number_seq, public.tracking_code_seq TO service_role;

-- 3. Additive Column Extensions on Orders Table
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS delivery_address_json JSONB,
    ADD COLUMN IF NOT EXISTS payment_session_token TEXT,
    ADD COLUMN IF NOT EXISTS payment_token_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
    ADD COLUMN IF NOT EXISTS idempotency_payload_hash TEXT,
    ADD COLUMN IF NOT EXISTS applied_coupon_code TEXT,
    ADD COLUMN IF NOT EXISTS delivery_days INT DEFAULT 3;

-- The existing remote default is 'completed'; change it to the safe unpaid default.
-- place_order_secure still explicitly writes pending for every supported payment method.
ALTER TABLE public.orders ALTER COLUMN payment_status SET DEFAULT 'pending';
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.orders'::regclass
          AND conname = 'orders_payment_status_check'
          AND contype = 'c'
    ) THEN
        IF EXISTS (SELECT 1 FROM public.orders WHERE payment_status NOT IN ('pending','completed','failed')) THEN
            RAISE EXCEPTION 'Unexpected existing orders.payment_status values; reconcile before adding status constraint';
        END IF;
        ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check
            CHECK (payment_status IN ('pending','completed','failed')) NOT VALID;
        ALTER TABLE public.orders VALIDATE CONSTRAINT orders_payment_status_check;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_payment_token
    ON public.orders (payment_session_token)
    WHERE payment_session_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key
    ON public.orders (idempotency_key)
    WHERE idempotency_key IS NOT NULL AND idempotency_key <> '';

-- Ensure coupon scope columns exist with safe defaults (No max_discount or is_active)
ALTER TABLE public.coupons
    ADD COLUMN IF NOT EXISTS applies_to TEXT DEFAULT 'all',
    ADD COLUMN IF NOT EXISTS target_category TEXT,
    ADD COLUMN IF NOT EXISTS target_product_id TEXT;

-- Ensure order_items and stock_history_logs schema compatibility
ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS product_name_snapshot TEXT,
    ADD COLUMN IF NOT EXISTS line_total NUMERIC DEFAULT 0;

DO $$
BEGIN
    ALTER TABLE public.order_items ALTER COLUMN id SET DEFAULT gen_random_uuid();
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

ALTER TABLE public.stock_history_logs
    ADD COLUMN IF NOT EXISTS product_name TEXT,
    ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'destock',
    ADD COLUMN IF NOT EXISTS note TEXT,
    ADD COLUMN IF NOT EXISTS admin_name TEXT DEFAULT 'Checkout System';

-- 4. Supporting Tables for Razorpay Edge Functions
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    provider TEXT NOT NULL DEFAULT 'razorpay',
    provider_order_id TEXT,
    provider_payment_id TEXT,
    provider_signature TEXT,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'captured', 'paid', 'failed', 'refunded', 'partially_refunded')),
    payment_method TEXT,
    failure_code TEXT,
    failure_description TEXT,
    refund_amount NUMERIC DEFAULT 0 CHECK (refund_amount >= 0),
    refund_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    captured_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Fail closed if historical data would prevent provider ID uniqueness.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.payments
        WHERE provider_order_id IS NOT NULL AND provider_order_id <> ''
        GROUP BY provider_order_id HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Duplicate payments.provider_order_id values exist; reconcile them before migration';
    END IF;
    IF EXISTS (
        SELECT 1 FROM public.payments
        WHERE provider_payment_id IS NOT NULL AND provider_payment_id <> ''
        GROUP BY provider_payment_id HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Duplicate payments.provider_payment_id values exist; reconcile them before migration';
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_order_id_unique
    ON public.payments (provider_order_id)
    WHERE provider_order_id IS NOT NULL AND provider_order_id <> '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_payment_id_unique
    ON public.payments (provider_payment_id)
    WHERE provider_payment_id IS NOT NULL AND provider_payment_id <> '';

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own payments" ON public.payments;
CREATE POLICY "Customers can view own payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = payments.order_id
              AND (o.customer_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Service role manages payments" ON public.payments;
CREATE POLICY "Service role manages payments"
    ON public.payments FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Durable Refund Records Table
CREATE TABLE IF NOT EXISTS public.payment_refunds (
    id TEXT PRIMARY KEY DEFAULT ('rfnd_log_' || replace(gen_random_uuid()::text, '-', '')),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    payment_id UUID REFERENCES public.payments(id) ON DELETE RESTRICT,
    provider_refund_id TEXT NOT NULL UNIQUE,
    provider_payment_id TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processing', 'processed', 'failed')),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_order_id ON public.payment_refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_provider_refund_id ON public.payment_refunds(provider_refund_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_payment_id ON public.payment_refunds(payment_id);

ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own refunds" ON public.payment_refunds;
CREATE POLICY "Customers can view own refunds"
    ON public.payment_refunds FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = payment_refunds.order_id
              AND (o.customer_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Service role manages refunds" ON public.payment_refunds;
CREATE POLICY "Service role manages refunds"
    ON public.payment_refunds FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Ensure payment_webhook_events table and schema extensions exist
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'razorpay',
    payload_hash TEXT,
    status TEXT NOT NULL DEFAULT 'processing',
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns exist if table was created by older migrations
ALTER TABLE public.payment_webhook_events
    ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS error_message TEXT;

DO $$
BEGIN
    ALTER TABLE public.payment_webhook_events
        DROP CONSTRAINT IF EXISTS payment_webhook_events_status_check;

    ALTER TABLE public.payment_webhook_events
        ADD CONSTRAINT payment_webhook_events_status_check
        CHECK (status IN ('processing', 'processed', 'failed', 'ignored'));
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_event_id ON public.payment_webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_status ON public.payment_webhook_events(status);

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages webhook events" ON public.payment_webhook_events;
CREATE POLICY "Service role manages webhook events"
    ON public.payment_webhook_events FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Webhook RPCs are defined once below using the final lease-token signatures.

-- 5. Authoritative place_order_secure RPC
CREATE OR REPLACE FUNCTION public.place_order_secure(
    p_order_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, extensions, public, pg_temp
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
    -- CHECK (payment_status IN ('pending', 'completed', 'failed'))
    -- For COD, payment is collected on delivery, so initial payment status is 'pending'
    IF UPPER(v_payment_method) = 'COD' THEN
        v_payment_method := 'COD';
        v_payment_status := 'pending';
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
          AND is_enabled = true
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

            -- Compute coupon discount value safely (Matching confirmed coupon schema - no max_discount)
            IF v_coupon_rec.discount_type = 'percentage' THEN
                IF v_coupon_rec.discount_value <= 0 OR v_coupon_rec.discount_value > 100 THEN
                    RAISE EXCEPTION 'Coupon "%" has invalid percentage discount value (%).',
                        v_coupon_code, v_coupon_rec.discount_value;
                END IF;
                v_coupon_discount := ROUND((v_coupon_eligible_subtotal * v_coupon_rec.discount_value) / 100.0, 2);
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
    -- Business rule: Subtotal > 499 qualifies for free delivery; otherwise ₹49.
    IF v_subtotal > 499.00 OR v_subtotal = 0 THEN
        v_delivery_fee := 0.00;
    ELSE
        v_delivery_fee := 49.00;
    END IF;

    v_total_discount := LEAST(v_subtotal, v_coupon_discount);
    v_grand_total := GREATEST(0.00, ROUND(v_subtotal + v_delivery_fee - v_total_discount, 2));

    -- -------------------------------------------------------------------------
    -- 8. Unique Identifiers & Guest Payment Session Token
    -- -------------------------------------------------------------------------
    -- Confirmed format: 'ord-' prefix followed by UUID
    v_order_id := 'ord-' || gen_random_uuid()::TEXT;
    v_order_number := 'Aishu-00' || nextval('public.order_number_seq')::TEXT;
    v_tracking_code := 'TRK-' || nextval('public.tracking_code_seq')::TEXT;

    v_payment_session_token := encode(gen_random_bytes(32), 'hex');
    v_payment_token_expires_at := NOW() + INTERVAL '30 minutes';

    -- -------------------------------------------------------------------------
    -- 9. Insert Primary Order Row
    -- -------------------------------------------------------------------------
    -- Explicitly supply v_payment_status (pending for COD, UPI, and Card); never rely on the remote column default.
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
        delivery_days,
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
        3,
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

        -- Confirmed columns: order_id, product_id, product_name_snapshot, selected_weight, unit_price, quantity, line_total
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name_snapshot,
            selected_weight,
            unit_price,
            quantity,
            line_total
        ) VALUES (
            v_order_id,
            v_item_rec.product_id,
            v_item_rec.product_name,
            v_item_rec.selected_weight,
            v_item_rec.unit_price,
            v_item_rec.quantity,
            ROUND(v_item_rec.unit_price * v_item_rec.quantity, 2)
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

-- 6. Record Payment Attempt RPC (Restricted strictly to trusted service_role)
CREATE OR REPLACE FUNCTION public.record_payment_attempt(
    p_order_id TEXT,
    p_provider_order_id TEXT,
    p_amount NUMERIC,
    p_currency TEXT DEFAULT 'INR'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, extensions, public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_payment RECORD;
    v_currency TEXT := COALESCE(NULLIF(upper(btrim(p_currency)), ''), 'INR');
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'Access Denied: record_payment_attempt is service_role only';
    END IF;
    IF p_order_id IS NULL OR btrim(p_order_id) = '' OR p_provider_order_id IS NULL OR btrim(p_provider_order_id) = ''
       OR p_amount IS NULL OR p_amount <= 0 OR p_amount::text IN ('NaN','Infinity','-Infinity')
       OR p_amount <> round(p_amount, 2) OR v_currency <> 'INR' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid payment attempt parameters');
    END IF;

    SELECT id, grand_total, order_status, payment_status
      INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;
    IF v_order.order_status = 'cancelled' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order is cancelled');
    END IF;
    IF v_order.payment_status IN ('completed', 'paid') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order is already paid');
    END IF;
    IF p_amount <> v_order.grand_total THEN
        RETURN jsonb_build_object('success', false, 'error', 'Payment amount does not match authoritative order total');
    END IF;

    -- A transport timeout can occur after COMMIT. Replaying the same provider order ID is safe.
    SELECT id, order_id, amount, currency, status INTO v_payment
      FROM public.payments WHERE provider_order_id = p_provider_order_id FOR UPDATE;
    IF FOUND THEN
        IF v_payment.order_id IS DISTINCT FROM p_order_id OR v_payment.amount IS DISTINCT FROM p_amount
           OR v_payment.currency IS DISTINCT FROM v_currency THEN
            RETURN jsonb_build_object('success', false, 'error', 'Provider order ID is already bound to different payment details');
        END IF;
        RETURN jsonb_build_object('success', true, 'duplicate', true, 'order_id', p_order_id, 'provider_order_id', p_provider_order_id);
    END IF;

    INSERT INTO public.payments (order_id, provider, provider_order_id, amount, currency, status, created_at)
    VALUES (p_order_id, 'razorpay', p_provider_order_id, p_amount, v_currency, 'pending', NOW());
    RETURN jsonb_build_object('success', true, 'duplicate', false, 'order_id', p_order_id, 'provider_order_id', p_provider_order_id);
EXCEPTION WHEN unique_violation THEN
    SELECT id, order_id, amount, currency, status INTO v_payment
      FROM public.payments WHERE provider_order_id = p_provider_order_id FOR UPDATE;
    IF FOUND AND v_payment.order_id = p_order_id AND v_payment.amount = p_amount AND v_payment.currency = v_currency THEN
        RETURN jsonb_build_object('success', true, 'duplicate', true, 'order_id', p_order_id, 'provider_order_id', p_provider_order_id);
    END IF;
    RETURN jsonb_build_object('success', false, 'error', 'Conflicting payment attempt for provider order ID');
END;
$$;

-- 7. Finalize Payment Success RPC (Restricted strictly to trusted service_role)
DROP FUNCTION IF EXISTS public.finalize_payment_success(TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB);
-- Preserve dependencies of the current signature when replacing its body.

CREATE OR REPLACE FUNCTION public.finalize_payment_success(
    p_order_id TEXT,
    p_provider_payment_id TEXT,
    p_provider_order_id TEXT,
    p_amount NUMERIC DEFAULT NULL,
    p_currency TEXT DEFAULT 'INR',
    p_method TEXT DEFAULT 'online',
    p_signature_verified BOOLEAN DEFAULT true,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, extensions, public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_pay_record RECORD;
BEGIN
    -- Strict authorization check: Only service_role (Edge Functions) can invoke this RPC!
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'Access Denied: finalize_payment_success can only be executed by trusted server-side payment functions.';
    END IF;

    -- Never trust a caller that flags p_signature_verified as false
    IF p_signature_verified IS NOT TRUE THEN
        RAISE EXCEPTION 'Cannot finalize payment without verified cryptographic signature.';
    END IF;

    SELECT id, order_number, order_status, payment_status, grand_total, customer_id
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- Idempotency Guard: if already completed, return clean duplicate confirmation for all order statuses
    IF v_order.payment_status = 'completed' THEN
        RETURN jsonb_build_object(
            'success', true,
            'is_duplicate', true,
            'message', 'Order payment already marked completed.',
            'order_id', p_order_id,
            'order_number', v_order.order_number,
            'payment_status', v_order.payment_status,
            'order_status', v_order.order_status
        );
    END IF;

    -- Require a matching recorded provider order attempt in payments table
    SELECT id, amount, currency, status INTO v_pay_record
    FROM public.payments
    WHERE order_id = p_order_id
      AND provider_order_id = p_provider_order_id
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No matching recorded payment attempt found for provider order "%" on order "%".',
            p_provider_order_id, p_order_id;
    END IF;

    -- Validate payment amount matching order grand total
    IF p_amount IS NOT NULL AND p_amount <> v_order.grand_total THEN
        RAISE EXCEPTION 'Payment amount mismatch: passed amount % does not match order grand total %.',
            p_amount, v_order.grand_total;
    END IF;

    IF v_pay_record.amount <> v_order.grand_total THEN
        RAISE EXCEPTION 'Recorded payment attempt amount % does not match order grand total %.',
            v_pay_record.amount, v_order.grand_total;
    END IF;

    -- Validate both stored and provider-confirmed currency
    IF UPPER(v_pay_record.currency) <> 'INR' THEN
        RAISE EXCEPTION 'Stored payment currency (%) is invalid. Expected INR.', v_pay_record.currency;
    END IF;

    IF UPPER(COALESCE(p_currency, 'INR')) <> 'INR' THEN
        RAISE EXCEPTION 'Provider confirmed payment currency (%) is invalid. Expected INR.', p_currency;
    END IF;

    -- Late Payment Recovery Workflow for previously cancelled orders
    IF v_order.order_status = 'cancelled' THEN
        UPDATE public.orders
        SET payment_status = 'completed',
            admin_notes = COALESCE(admin_notes, '') || ' [LATE PAYMENT CAPTURED: ₹' || v_order.grand_total || ' (' || p_provider_payment_id || ') received for cancelled order #' || v_order.order_number || '. Action Required: Restock & fulfill OR initiate gateway refund.]'
        WHERE id = p_order_id;

        UPDATE public.payments
        SET status = 'captured',
            provider_payment_id = p_provider_payment_id,
            provider_signature = 'verified',
            payment_method = COALESCE(p_method, 'online'),
            metadata = p_metadata || jsonb_build_object('is_late_payment', true, 'captured_at', NOW()),
            captured_at = NOW(),
            updated_at = NOW()
        WHERE id = v_pay_record.id;

        RETURN jsonb_build_object(
            'success', true,
            'order_id', p_order_id,
            'order_number', v_order.order_number,
            'payment_status', 'completed',
            'order_status', 'cancelled',
            'is_late_payment', true,
            'late_payment_action_required', 'restock_or_refund'
        );
    END IF;

    -- Update payments tracking table to captured
    UPDATE public.payments
    SET status = 'captured',
        provider_payment_id = p_provider_payment_id,
        provider_signature = 'verified',
        payment_method = COALESCE(p_method, 'online'),
        metadata = p_metadata,
        captured_at = NOW(),
        updated_at = NOW()
    WHERE id = v_pay_record.id;

    -- Update primary order row strictly within allowed constraints ('completed', 'confirmed')
    UPDATE public.orders
    SET payment_status = 'completed',
        order_status = 'confirmed'
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'order_number', v_order.order_number,
        'payment_status', 'completed',
        'order_status', 'confirmed',
        'is_late_payment', false
    );
END;
$$;

-- 8. Record Payment Failure RPC (Restricted strictly to trusted service_role)
CREATE OR REPLACE FUNCTION public.record_payment_failure(
    p_order_id TEXT,
    p_provider_order_id TEXT,
    p_failure_code TEXT DEFAULT 'PAYMENT_FAILED',
    p_failure_desc TEXT DEFAULT 'Payment was cancelled or rejected by customer/bank'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, extensions, public, pg_temp
AS $$
DECLARE
    v_order RECORD;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'Access Denied: record_payment_failure can only be executed by trusted server-side payment functions.';
    END IF;

    SELECT id, payment_status, order_status INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- Prevent delayed failure events from overwriting successful payments!
    IF v_order.payment_status = 'completed' THEN
        -- Never downgrade captured, paid, or refunded payment attempts!
        UPDATE public.payments
        SET status = 'failed',
            failure_code = p_failure_code,
            failure_description = p_failure_desc,
            failed_at = NOW(),
            updated_at = NOW()
        WHERE order_id = p_order_id
          AND (provider_order_id = p_provider_order_id OR provider_order_id IS NULL)
          AND status NOT IN ('captured', 'paid', 'refunded', 'partially_refunded');

        RETURN jsonb_build_object(
            'success', true,
            'ignored_for_order', true,
            'reason', 'Order is already marked completed. Payment status was not overwritten.'
        );
    END IF;

    UPDATE public.orders
    SET payment_status = 'failed'
    WHERE id = p_order_id
      AND payment_status <> 'completed';

    -- Never downgrade captured, paid, or refunded payment attempts!
    UPDATE public.payments
    SET status = 'failed',
        failure_code = p_failure_code,
        failure_description = p_failure_desc,
        failed_at = NOW(),
        updated_at = NOW()
    WHERE order_id = p_order_id
      AND (provider_order_id = p_provider_order_id OR provider_order_id IS NULL)
      AND status NOT IN ('captured', 'paid', 'refunded', 'partially_refunded');

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Refund RPC is defined once below using the final hardened six-argument signature.

-- 10. Order Cancellation and Inventory Auto-Release Engine
DROP FUNCTION IF EXISTS public.cancel_order_secure(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.cancel_order_secure(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.cancel_order_secure(TEXT, TEXT, TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.cancel_order_secure(
    p_order_id TEXT,
    p_reason TEXT DEFAULT 'Cancelled by customer',
    p_refund_id TEXT DEFAULT NULL,
    p_allow_unrefunded BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, extensions, public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_is_authorized BOOLEAN := false;
BEGIN
    SELECT id, order_number, customer_id, order_status, payment_status, payment_method, applied_coupon_code, grand_total
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- Caller check: Owner customer, staff, or service_role
    IF current_user = 'service_role' OR auth.role() = 'service_role'
       OR (auth.uid() IS NOT NULL AND auth.uid() = v_order.customer_id) THEN
        v_is_authorized := true;
    END IF;

    IF NOT v_is_authorized THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized to cancel this order');
    END IF;

    -- Idempotency: If already cancelled, do not re-credit stock
    IF v_order.order_status = 'cancelled' THEN
        RETURN jsonb_build_object(
            'success', true,
            'is_duplicate', true,
            'message', 'Order is already cancelled.',
            'order_id', p_order_id,
            'order_status', 'cancelled'
        );
    END IF;

    -- Prevent cancellation of paid orders unless refund workflow is handled by staff/service_role
    IF v_order.payment_status = 'completed' THEN
        IF auth.role() IS DISTINCT FROM 'service_role' THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Paid orders cannot be self-cancelled. Please contact customer support for cancellations and refunds.'
            );
        END IF;

        -- Staff or service_role cancellation of paid order requires refund ID or explicit unrefunded authorization
        IF p_refund_id IS NOT NULL AND p_refund_id <> '' THEN
            PERFORM public.record_refund_success(p_order_id, p_refund_id, v_order.grand_total, 'Cancellation Refund');
        ELSIF p_allow_unrefunded IS TRUE THEN
            UPDATE public.orders
            SET admin_notes = COALESCE(admin_notes, '') || ' [CANCELLED WITHOUT GATEWAY REFUND: ' || p_reason || ']'
            WHERE id = p_order_id;
        ELSE
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Cannot cancel paid order without an authoritative refund ID or explicit unrefunded authorization.'
            );
        END IF;
    END IF;

    -- Only allow cancellation of unfulfilled orders
    IF v_order.order_status IN ('shipped', 'out for delivery', 'delivered') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cannot cancel order in "' || v_order.order_status || '" status.'
        );
    END IF;

    -- Release inventory back to products table exactly once, aggregated per product in ASC order
    FOR v_item IN
        SELECT product_id, SUM(quantity) AS quantity, MAX(product_name_snapshot) AS product_name_snapshot
        FROM public.order_items
        WHERE order_id = p_order_id
          AND product_id IS NOT NULL
        GROUP BY product_id
        ORDER BY product_id ASC
    LOOP
        UPDATE public.products
        SET inventory_count = inventory_count + v_item.quantity,
            out_of_stock = ((inventory_count + v_item.quantity) <= 0),
            updated_at = NOW()
        WHERE id = v_item.product_id;

        -- Record Restock Log in stock_history_logs (idempotent ON CONFLICT)
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
            'log-restock-' || p_order_id || '-' || v_item.product_id,
            v_item.product_id,
            v_item.product_name_snapshot,
            'restock',
            v_item.quantity,
            'Restock from cancelled order #' || v_order.order_number,
            'Cancellation Engine (Server)',
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- If a coupon was applied, restore 1 usage count exactly once
    IF v_order.applied_coupon_code IS NOT NULL AND v_order.applied_coupon_code <> '' THEN
        UPDATE public.coupons
        SET usage_count = GREATEST(0, usage_count - 1)
        WHERE UPPER(TRIM(code)) = UPPER(TRIM(v_order.applied_coupon_code));

        UPDATE public.orders
        SET applied_coupon_code = NULL
        WHERE id = p_order_id;
    END IF;

    -- Update Order Status
    UPDATE public.orders
    SET order_status = 'cancelled',
        cancel_reason = p_reason
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'is_duplicate', false,
        'message', 'Order cancelled and stock released successfully.',
        'order_id', p_order_id,
        'order_status', 'cancelled'
    );
END;
$$;

-- 11. Cleanup Expired Unpaid Orders (Inventory Auto-Release for Abandoned Checkouts)
CREATE OR REPLACE FUNCTION public.cleanup_expired_unpaid_orders(
    p_timeout_minutes INT DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, extensions, public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_cancel_res JSONB;
    v_cancelled_count INT := 0;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'Access Denied: cleanup_expired_unpaid_orders can only be executed by trusted server-side payment functions.';
    END IF;

    FOR v_order IN
        SELECT id, order_number
        FROM public.orders
        WHERE payment_status IN ('pending', 'failed')
          AND payment_method NOT ILIKE '%cod%'
          AND payment_method NOT ILIKE '%cash%'
          AND order_status = 'placed'
          AND created_at < NOW() - (p_timeout_minutes || ' minutes')::INTERVAL
        FOR UPDATE SKIP LOCKED
    LOOP
        v_cancel_res := public.cancel_order_secure(v_order.id, 'Auto-cancelled due to payment timeout (' || p_timeout_minutes || 'm)');

        -- Increment count ONLY if cancellation succeeded and was not a duplicate
        IF (v_cancel_res->>'success')::BOOLEAN IS TRUE AND (v_cancel_res->>'is_duplicate')::BOOLEAN IS NOT TRUE THEN
            v_cancelled_count := v_cancelled_count + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'cancelled_count', v_cancelled_count
    );
END;
$$;

-- 12. Least-Privilege Execution Grants
-- A. place_order_secure: callable by browser (anon for guests, authenticated for members, service_role)
REVOKE ALL ON FUNCTION public.place_order_secure(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order_secure(JSONB) TO anon, authenticated, service_role;

-- B. cancel_order_secure: callable by authenticated users (own orders) and service_role
REVOKE ALL ON FUNCTION public.cancel_order_secure(TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_order_secure(TEXT, TEXT, TEXT, BOOLEAN) TO authenticated, service_role;

-- C. Privileged Payment Lifecycle RPCs: STRICTLY service_role only!
REVOKE ALL ON FUNCTION public.record_payment_attempt(TEXT, TEXT, NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_payment_attempt(TEXT, TEXT, NUMERIC, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.finalize_payment_success(TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, BOOLEAN, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_payment_success(TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, BOOLEAN, JSONB) TO service_role;

REVOKE ALL ON FUNCTION public.record_payment_failure(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_payment_failure(TEXT, TEXT, TEXT, TEXT) TO service_role;


REVOKE ALL ON FUNCTION public.cleanup_expired_unpaid_orders(INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_unpaid_orders(INT) TO service_role;



-- 13. Force PostgREST to Immediately Reload Schema Cache
NOTIFY pgrst, 'reload schema';


-- ============================================================================
-- FINAL HARDENING LAYER (from local 013; final signatures only)
-- ============================================================================

-- Require real Supabase authentication; never install test stubs in a migration.
DO $$
BEGIN
    IF to_regprocedure('auth.uid()') IS NULL OR to_regprocedure('auth.role()') IS NULL
       OR to_regclass('auth.users') IS NULL THEN
        RAISE EXCEPTION 'Supabase auth schema and helpers are required before migration 013';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 1. Preserve Financial Records: Replace CASCADE with RESTRICT Idempotently
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_drop_payments_fk BOOLEAN := FALSE;
    v_drop_refunds_order_fk BOOLEAN := FALSE;
    v_drop_refunds_pay_fk BOOLEAN := FALSE;
BEGIN
    -- 1.1 payments.order_id foreign key: replace only if not RESTRICT ('r') or not validated
    SELECT (confdeltype <> 'r' OR NOT convalidated) INTO v_drop_payments_fk
    FROM pg_constraint
    WHERE conname = 'payments_order_id_fkey'
      AND conrelid = 'public.payments'::regclass
      AND contype = 'f';

    IF v_drop_payments_fk THEN
        ALTER TABLE public.payments DROP CONSTRAINT payments_order_id_fkey;
        ALTER TABLE public.payments
            ADD CONSTRAINT payments_order_id_fkey
            FOREIGN KEY (order_id) REFERENCES public.orders(id)
            ON DELETE RESTRICT NOT VALID;
        ALTER TABLE public.payments VALIDATE CONSTRAINT payments_order_id_fkey;
    ELSIF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'payments_order_id_fkey' AND conrelid = 'public.payments'::regclass
    ) THEN
        ALTER TABLE public.payments
            ADD CONSTRAINT payments_order_id_fkey
            FOREIGN KEY (order_id) REFERENCES public.orders(id)
            ON DELETE RESTRICT NOT VALID;
        ALTER TABLE public.payments VALIDATE CONSTRAINT payments_order_id_fkey;
    END IF;

    -- 1.2 payment_refunds.order_id foreign key: replace only if not RESTRICT ('r') or not validated
    SELECT (confdeltype <> 'r' OR NOT convalidated) INTO v_drop_refunds_order_fk
    FROM pg_constraint
    WHERE conname = 'payment_refunds_order_id_fkey'
      AND conrelid = 'public.payment_refunds'::regclass
      AND contype = 'f';

    IF v_drop_refunds_order_fk THEN
        ALTER TABLE public.payment_refunds DROP CONSTRAINT payment_refunds_order_id_fkey;
        ALTER TABLE public.payment_refunds
            ADD CONSTRAINT payment_refunds_order_id_fkey
            FOREIGN KEY (order_id) REFERENCES public.orders(id)
            ON DELETE RESTRICT NOT VALID;
        ALTER TABLE public.payment_refunds VALIDATE CONSTRAINT payment_refunds_order_id_fkey;
    ELSIF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'payment_refunds_order_id_fkey' AND conrelid = 'public.payment_refunds'::regclass
    ) THEN
        ALTER TABLE public.payment_refunds
            ADD CONSTRAINT payment_refunds_order_id_fkey
            FOREIGN KEY (order_id) REFERENCES public.orders(id)
            ON DELETE RESTRICT NOT VALID;
        ALTER TABLE public.payment_refunds VALIDATE CONSTRAINT payment_refunds_order_id_fkey;
    END IF;

    -- 1.3 payment_refunds.payment_id foreign key: replace only if not RESTRICT ('r') or not validated
    SELECT (confdeltype <> 'r' OR NOT convalidated) INTO v_drop_refunds_pay_fk
    FROM pg_constraint
    WHERE conname = 'payment_refunds_payment_id_fkey'
      AND conrelid = 'public.payment_refunds'::regclass
      AND contype = 'f';

    IF v_drop_refunds_pay_fk THEN
        ALTER TABLE public.payment_refunds DROP CONSTRAINT payment_refunds_payment_id_fkey;
        ALTER TABLE public.payment_refunds
            ADD CONSTRAINT payment_refunds_payment_id_fkey
            FOREIGN KEY (payment_id) REFERENCES public.payments(id)
            ON DELETE RESTRICT NOT VALID;
        ALTER TABLE public.payment_refunds VALIDATE CONSTRAINT payment_refunds_payment_id_fkey;
    ELSIF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'payment_refunds_payment_id_fkey' AND conrelid = 'public.payment_refunds'::regclass
    ) THEN
        ALTER TABLE public.payment_refunds
            ADD CONSTRAINT payment_refunds_payment_id_fkey
            FOREIGN KEY (payment_id) REFERENCES public.payments(id)
            ON DELETE RESTRICT NOT VALID;
        ALTER TABLE public.payment_refunds VALIDATE CONSTRAINT payment_refunds_payment_id_fkey;
    END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 2. Refund Operation Ledger Table
-- ----------------------------------------------------------------------------
-- Migration 008 granted staff direct financial writes; require audited RPCs instead.
DROP POLICY IF EXISTS "Staff can manage payments" ON public.payments;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.payments, public.payment_refunds, public.payment_webhook_events FROM anon, authenticated;
GRANT ALL ON public.payments, public.payment_refunds, public.payment_webhook_events TO service_role;

CREATE TABLE IF NOT EXISTS public.payment_refund_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    idempotency_key TEXT NOT NULL UNIQUE,
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
    provider_payment_id TEXT NOT NULL,
    provider_refund_id TEXT UNIQUE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'initiated'
        CHECK (status IN ('initiated', 'processing', 'completed', 'reconciled', 'failed', 'uncertain')),
    reason TEXT,
    error_code TEXT,
    error_message TEXT,
    staff_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_refund_ops_order_id ON public.payment_refund_operations(order_id);
CREATE INDEX IF NOT EXISTS idx_refund_ops_payment_id ON public.payment_refund_operations(payment_id);
CREATE INDEX IF NOT EXISTS idx_refund_ops_idempotency_key ON public.payment_refund_operations(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_refund_ops_provider_refund_id ON public.payment_refund_operations(provider_refund_id);
CREATE INDEX IF NOT EXISTS idx_refund_ops_status ON public.payment_refund_operations(status);

ALTER TABLE public.payment_refund_operations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages refund operations" ON public.payment_refund_operations;
CREATE POLICY "Service role manages refund operations"
    ON public.payment_refund_operations FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can view refund operations" ON public.payment_refund_operations;
CREATE POLICY "Staff can view refund operations"
    ON public.payment_refund_operations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles ar
            WHERE ar.user_id = auth.uid()
              AND ar.status = 'active'
        )
    );

GRANT ALL ON TABLE public.payment_refund_operations TO service_role;
GRANT SELECT ON TABLE public.payment_refund_operations TO authenticated;

-- Explicit least-privilege table privileges (do not rely on project default grants).
REVOKE ALL ON TABLE public.payments, public.payment_refunds, public.payment_webhook_events, public.payment_refund_operations FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.payments, public.payment_refunds TO authenticated;
GRANT SELECT ON TABLE public.payment_refund_operations TO authenticated;
GRANT ALL ON TABLE public.payments, public.payment_refunds, public.payment_webhook_events, public.payment_refund_operations TO service_role;

-- Explicitly remove direct financial mutation grants from browser roles.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.payments, public.payment_refunds, public.payment_webhook_events, public.payment_refund_operations FROM anon, authenticated;



-- ----------------------------------------------------------------------------
-- 3. Webhook Lease Tokens & Safe State Transition Fields
-- ----------------------------------------------------------------------------
ALTER TABLE public.payment_webhook_events
    ADD COLUMN IF NOT EXISTS claim_token UUID,
    ADD COLUMN IF NOT EXISTS claim_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_webhook_events_claim
    ON public.payment_webhook_events(status, claim_expires_at);


-- ----------------------------------------------------------------------------
-- 4. Tokenized Webhook Claiming RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_webhook_event(
    p_event_id TEXT,
    p_event_type TEXT,
    p_payload_hash TEXT DEFAULT NULL,
    p_stale_timeout_minutes INT DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, extensions, public, pg_temp
AS $$
DECLARE
    v_event RECORD;
    v_now TIMESTAMPTZ := clock_timestamp();
    v_claim_token UUID := gen_random_uuid();
    v_expires_at TIMESTAMPTZ := v_now + (p_stale_timeout_minutes || ' minutes')::INTERVAL;
    v_inserted_count INT := 0;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'Access Denied: claim_webhook_event can only be executed by trusted server-side payment functions.';
    END IF;

    IF p_event_id IS NULL OR btrim(p_event_id) = '' OR p_event_type IS NULL OR btrim(p_event_type) = ''
       OR p_stale_timeout_minutes IS NULL OR p_stale_timeout_minutes NOT BETWEEN 1 AND 30 THEN
        RAISE EXCEPTION 'Invalid webhook claim parameters';
    END IF;

    -- Atomically insert event with processing status and lease claim_token
    INSERT INTO public.payment_webhook_events (
        event_id,
        event_type,
        provider,
        payload_hash,
        status,
        claim_token,
        claim_expires_at,
        locked_at,
        created_at
    ) VALUES (
        p_event_id,
        p_event_type,
        'razorpay',
        p_payload_hash,
        'processing',
        v_claim_token,
        v_expires_at,
        v_now,
        v_now
    )
    ON CONFLICT (event_id) DO NOTHING;

    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

    -- Case 1: Freshly inserted claim by this transaction
    IF v_inserted_count = 1 THEN
        RETURN jsonb_build_object(
            'action', 'claimed',
            'status', 'processing',
            'claim_token', v_claim_token
        );
    END IF;

    -- Row already exists: Lock the event row for update
    SELECT id, status, locked_at, claim_token, claim_expires_at INTO v_event
    FROM public.payment_webhook_events
    WHERE event_id = p_event_id
    FOR UPDATE;

    -- Case 2: Already successfully completed or ignored
    IF v_event.status IN ('processed', 'ignored') THEN
        RETURN jsonb_build_object('action', 'skip_processed', 'status', v_event.status);
    END IF;

    -- Case 3: Failed previously or active lease expired
    IF v_event.status = 'failed' OR
       (v_event.status = 'processing' AND (
           v_event.claim_expires_at IS NULL OR
           v_event.claim_expires_at <= clock_timestamp()
       )) THEN

        -- Refresh after waiting for the row lock, so a new lease gets its full duration.
        v_now := clock_timestamp();
        v_expires_at := v_now + make_interval(mins => p_stale_timeout_minutes);
        UPDATE public.payment_webhook_events
        SET status = 'processing',
            claim_token = v_claim_token,
            claim_expires_at = v_expires_at,
            locked_at = v_now,
            payload_hash = COALESCE(p_payload_hash, payload_hash)
        WHERE event_id = p_event_id;

        RETURN jsonb_build_object(
            'action', 'claimed_retry',
            'status', 'processing',
            'claim_token', v_claim_token
        );
    END IF;

    -- Case 4: Currently active lease held by another worker
    RETURN jsonb_build_object('action', 'retry_later', 'status', 'processing');
END;
$$;


-- ----------------------------------------------------------------------------
-- 5. Complete Webhook Event RPC (Verifies Lease Token)
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.complete_webhook_event(TEXT, TEXT, TEXT);
-- Preserve the tokenized signature and its dependencies on reruns.

CREATE OR REPLACE FUNCTION public.complete_webhook_event(
    p_event_id TEXT,
    p_status TEXT,
    p_claim_token UUID DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, extensions, public, pg_temp
AS $$
DECLARE
    v_event RECORD;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'Access Denied: complete_webhook_event can only be executed by trusted server-side payment functions.';
    END IF;

    SELECT id, status, claim_token, claim_expires_at INTO v_event
    FROM public.payment_webhook_events
    WHERE event_id = p_event_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Webhook event not found.');
    END IF;

    IF p_status IS NULL OR p_status NOT IN ('processed', 'failed', 'ignored') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid completion status');
    END IF;
    IF p_claim_token IS NULL OR v_event.claim_token IS DISTINCT FROM p_claim_token
       OR v_event.status <> 'processing' OR v_event.claim_expires_at IS NULL
       OR v_event.claim_expires_at <= clock_timestamp() THEN
        RETURN jsonb_build_object('success', false, 'stale', true, 'error', 'Missing, stale or expired webhook lease');
    END IF;

    UPDATE public.payment_webhook_events
    SET status = p_status,
        error_message = p_error_message,
        claim_token = NULL,
        claim_expires_at = NULL,
        locked_at = NOW()
    WHERE event_id = p_event_id;

    RETURN jsonb_build_object('success', true, 'status', p_status);
END;
$$;


-- ----------------------------------------------------------------------------
-- 6. Initiate Refund Operation RPC (Idempotency Key & Balance Reservation)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.initiate_refund_operation(
    p_order_id TEXT,
    p_idempotency_key TEXT,
    p_amount NUMERIC,
    p_reason TEXT DEFAULT 'Customer Refund',
    p_staff_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, extensions, public, pg_temp
AS $$
DECLARE
    v_pay RECORD;
    v_existing_op RECORD;
    v_new_op_id UUID;
    v_current_total_refunded NUMERIC := 0;
    v_in_flight_reserved NUMERIC := 0;
    v_remaining_balance NUMERIC := 0;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'Access Denied: initiate_refund_operation can only be executed by trusted server-side payment functions.';
    END IF;

    IF p_amount IS NULL OR p_amount <= 0 OR p_amount::text IN ('NaN', 'Infinity', '-Infinity') OR p_amount <> round(p_amount, 2) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Refund amount must be strictly positive.');
    END IF;

    IF p_idempotency_key IS NULL OR TRIM(p_idempotency_key) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Idempotency key is required.');
    END IF;

    -- 1. Lock payment record FIRST (enforcing global lock order payments -> operations to prevent deadlocks)
    SELECT id, amount, currency, status, provider_payment_id INTO v_pay
    FROM public.payments
    WHERE order_id = p_order_id
      AND status IN ('captured', 'paid', 'partially_refunded', 'refunded')
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'No captured payment found for this order to refund.');
    END IF;

    -- 2. Lock or inspect existing operation SECOND (enforcing global lock order)
    SELECT * INTO v_existing_op
    FROM public.payment_refund_operations
    WHERE idempotency_key = p_idempotency_key
    FOR UPDATE;

    IF FOUND THEN
        -- Verify payload compatibility
        IF v_existing_op.order_id <> p_order_id OR v_existing_op.amount <> p_amount THEN
            RETURN jsonb_build_object(
                'success', false,
                'conflict', true,
                'error', 'Idempotency key conflict: Operation already exists with different order or amount.'
            );
        END IF;

        RETURN jsonb_build_object(
            'success', true,
            'is_retry', true,
            'operation_id', v_existing_op.operation_id,
            'status', v_existing_op.status,
            'provider_refund_id', v_existing_op.provider_refund_id,
            'amount', v_existing_op.amount,
            'provider_payment_id', v_existing_op.provider_payment_id
        );
    END IF;

    -- 3. Calculate already processed refunds
    SELECT COALESCE(SUM(amount), 0) INTO v_current_total_refunded
    FROM public.payment_refunds
    WHERE payment_id = v_pay.id AND status = 'processed';

    -- 4. Calculate active in-flight reserved refunds (initiated, processing, uncertain)
    SELECT COALESCE(SUM(amount), 0) INTO v_in_flight_reserved
    FROM public.payment_refund_operations
    WHERE payment_id = v_pay.id
      AND status IN ('initiated', 'processing', 'uncertain');

    v_remaining_balance := v_pay.amount - v_current_total_refunded - v_in_flight_reserved;

    IF p_amount > v_remaining_balance THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Requested refund of ₹' || p_amount || ' exceeds available remaining balance of ₹' || v_remaining_balance || ' (already refunded: ₹' || v_current_total_refunded || ', in-flight: ₹' || v_in_flight_reserved || ').'
        );
    END IF;

    -- 5. Insert new refund operation record
    v_new_op_id := gen_random_uuid();
    INSERT INTO public.payment_refund_operations (
        id,
        operation_id,
        idempotency_key,
        order_id,
        payment_id,
        provider_payment_id,
        amount,
        currency,
        status,
        reason,
        staff_user_id,
        created_at,
        updated_at
    ) VALUES (
        v_new_op_id,
        v_new_op_id,
        p_idempotency_key,
        p_order_id,
        v_pay.id,
        v_pay.provider_payment_id,
        p_amount,
        v_pay.currency,
        'initiated',
        p_reason,
        p_staff_user_id,
        NOW(),
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'is_retry', false,
        'operation_id', v_new_op_id,
        'status', 'initiated',
        'provider_payment_id', v_pay.provider_payment_id,
        'amount', p_amount
    );
END;
$$;


-- ----------------------------------------------------------------------------
-- 7. Force Fail Refund Operation RPC (Controlled Failure & Uncertain Mark)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.force_fail_refund_operation(
    p_operation_id UUID,
    p_error_code TEXT,
    p_error_desc TEXT,
    p_is_uncertain BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, extensions, public, pg_temp
AS $$
DECLARE
    v_op RECORD;
    v_target_status TEXT;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'Access Denied: force_fail_refund_operation can only be executed by trusted server-side payment functions.';
    END IF;

    SELECT * INTO v_op
    FROM public.payment_refund_operations
    WHERE operation_id = p_operation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Operation not found.');
    END IF;

    IF v_op.status IN ('completed', 'reconciled') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot fail an already completed or reconciled refund operation.');
    END IF;

    v_target_status := CASE WHEN p_is_uncertain THEN 'uncertain' ELSE 'failed' END;

    UPDATE public.payment_refund_operations
    SET status = v_target_status,
        error_code = p_error_code,
        error_message = p_error_desc,
        updated_at = NOW()
    WHERE operation_id = p_operation_id;

    RETURN jsonb_build_object(
        'success', true,
        'operation_id', p_operation_id,
        'status', v_target_status
    );
END;
$$;


-- ----------------------------------------------------------------------------
-- 8. Record Refund Success RPC (Atomic Accounting, Exact Bounds, Multi-Key Lock)
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.record_refund_success(TEXT, TEXT, NUMERIC, TEXT);
DROP FUNCTION IF EXISTS public.record_refund_success(TEXT, TEXT, NUMERIC, TEXT, TEXT);
-- Preserve the current refund signature and its dependencies on reruns.

CREATE OR REPLACE FUNCTION public.record_refund_success(
    p_order_id TEXT,
    p_refund_id TEXT,
    p_refund_amount NUMERIC,
    p_reason TEXT DEFAULT 'Customer Refund',
    p_provider_payment_id TEXT DEFAULT NULL,
    p_operation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, extensions, public, pg_temp
AS $$
DECLARE
    v_pay RECORD;
    v_op RECORD;
    v_existing_refund RECORD;
    v_current_total_refunded NUMERIC := 0;
    v_new_total_refunded NUMERIC := 0;
    v_new_status TEXT;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'Access Denied: record_refund_success can only be executed by trusted server-side payment functions.';
    END IF;

    IF p_refund_amount IS NULL OR p_refund_amount <= 0 OR p_refund_amount::text IN ('NaN', 'Infinity', '-Infinity') OR p_refund_amount <> round(p_refund_amount, 2) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Refund amount must be strictly positive.');
    END IF;

    IF p_refund_id IS NULL OR TRIM(p_refund_id) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Provider refund ID is required.');
    END IF;

    -- 1. Lock payment record FOR UPDATE
    SELECT id, amount, currency, status, provider_payment_id INTO v_pay
    FROM public.payments
    WHERE order_id = p_order_id
      AND (p_provider_payment_id IS NULL OR provider_payment_id = p_provider_payment_id)
      AND status IN ('captured', 'paid', 'partially_refunded', 'refunded')
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'No captured payment found for this order to refund.');
    END IF;

    -- 2. If operation ID is provided, lock and validate operation record
    IF p_operation_id IS NOT NULL THEN
        SELECT * INTO v_op
        FROM public.payment_refund_operations
        WHERE operation_id = p_operation_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'Refund operation not found');
        END IF;
        IF FOUND THEN
            IF v_op.payment_id IS DISTINCT FROM v_pay.id OR (v_op.provider_refund_id IS NOT NULL AND v_op.provider_refund_id <> p_refund_id) THEN
                RETURN jsonb_build_object('success', false, 'error', 'Refund operation payment or refund mismatch');
            END IF;
            IF v_op.order_id <> p_order_id THEN
                RETURN jsonb_build_object('success', false, 'error', 'Operation order ID mismatch.');
            END IF;
            IF v_op.amount <> p_refund_amount THEN
                RETURN jsonb_build_object('success', false, 'error', 'Operation amount mismatch.');
            END IF;
            -- If operation was already completed with this exact refund ID, return idempotent success
            IF v_op.status IN ('completed', 'reconciled') AND v_op.provider_refund_id = p_refund_id THEN
                RETURN jsonb_build_object(
                    'success', true,
                    'is_duplicate', true,
                    'message', 'Refund operation already completed.',
                    'refund_id', p_refund_id,
                    'payment_status', v_pay.status
                );
            END IF;
        END IF;
    END IF;

    -- 3. Idempotency Check on payment_refunds: Verify if provider_refund_id already recorded
    SELECT id, amount, status, payment_id, order_id INTO v_existing_refund
    FROM public.payment_refunds
    WHERE provider_refund_id = p_refund_id;

    IF FOUND THEN
        IF v_existing_refund.payment_id IS DISTINCT FROM v_pay.id
           OR v_existing_refund.order_id IS DISTINCT FROM p_order_id
           OR v_existing_refund.amount IS DISTINCT FROM p_refund_amount
           OR v_existing_refund.status <> 'processed' THEN
            RETURN jsonb_build_object('success', false, 'error', 'Provider refund ID conflict');
        END IF;
        -- Ensure operation is synced to completed if operation ID was passed
        IF p_operation_id IS NOT NULL THEN
            UPDATE public.payment_refund_operations
            SET status = 'completed',
                provider_refund_id = p_refund_id,
                completed_at = COALESCE(completed_at, NOW()),
                updated_at = NOW()
            WHERE operation_id = p_operation_id;
        END IF;

        RETURN jsonb_build_object(
            'success', true,
            'is_duplicate', true,
            'message', 'Refund with this provider ID was already recorded.',
            'refund_id', p_refund_id,
            'order_id', p_order_id,
            'payment_status', v_pay.status
        );
    END IF;

    -- 4. Calculate current total refunded for this payment
    SELECT COALESCE(SUM(amount), 0) INTO v_current_total_refunded
    FROM public.payment_refunds
    WHERE payment_id = v_pay.id AND status = 'processed';

    v_new_total_refunded := v_current_total_refunded + p_refund_amount;

    -- 5. Exact Over-refund Guard: Never exceed captured amount (no floating-point tolerance slack)
    IF v_new_total_refunded > v_pay.amount THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Requested refund of ₹' || p_refund_amount || ' exceeds remaining balance of ₹' || (v_pay.amount - v_current_total_refunded) || '.'
        );
    END IF;

    -- 6. Insert durable refund record into ledger
    INSERT INTO public.payment_refunds (
        order_id,
        payment_id,
        provider_refund_id,
        provider_payment_id,
        amount,
        currency,
        status,
        reason,
        created_at
    ) VALUES (
        p_order_id,
        v_pay.id,
        p_refund_id,
        COALESCE(p_provider_payment_id, v_pay.provider_payment_id, 'pay_unknown'),
        p_refund_amount,
        v_pay.currency,
        'processed',
        p_reason,
        NOW()
    );

    -- 7. Update payment status atomically
    IF v_new_total_refunded >= v_pay.amount THEN
        v_new_status := 'refunded';
    ELSE
        v_new_status := 'partially_refunded';
    END IF;

    UPDATE public.payments
    SET status = v_new_status,
        refund_id = p_refund_id,
        refund_amount = v_new_total_refunded,
        refunded_at = NOW(),
        updated_at = NOW()
    WHERE id = v_pay.id;

    -- 8. Update operation status if operation ID was supplied
    IF p_operation_id IS NOT NULL THEN
        UPDATE public.payment_refund_operations
        SET status = 'completed',
            provider_refund_id = p_refund_id,
            completed_at = NOW(),
            updated_at = NOW()
        WHERE operation_id = p_operation_id;
    ELSE
        -- If an operation with this provider_refund_id exists, reconcile it
        UPDATE public.payment_refund_operations
        SET status = 'reconciled',
            completed_at = NOW(),
            updated_at = NOW()
        WHERE provider_refund_id = p_refund_id AND status NOT IN ('completed', 'reconciled');
    END IF;

    -- 9. Update order audit notes
    UPDATE public.orders
    SET admin_notes = COALESCE(admin_notes, '') || ' [Refund Recorded: ₹' || p_refund_amount || ' (' || p_refund_id || ') - ' || p_reason || ']'
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'refund_id', p_refund_id,
        'refund_amount', p_refund_amount,
        'cumulative_refund', v_new_total_refunded,
        'payment_status', v_new_status,
        'is_duplicate', false
    );
END;
$$;


-- ----------------------------------------------------------------------------
-- 9. Strict Service-Role EXECUTE Grants & Revocations
-- ----------------------------------------------------------------------------
-- Older migration 008 left a signature accepting a caller-supplied signature string.
-- Keep legacy objects for dependency diagnosis, but disable their public entry points.
DO $$
BEGIN
    IF to_regprocedure('public.finalize_payment_success(text,text,text,text,text,jsonb)') IS NOT NULL THEN
        REVOKE ALL ON FUNCTION public.finalize_payment_success(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated, service_role;
    END IF;
    IF to_regprocedure('public.reconcile_order_payment(text,text,text,bigint)') IS NOT NULL THEN
        REVOKE ALL ON FUNCTION public.reconcile_order_payment(TEXT, TEXT, TEXT, BIGINT) FROM PUBLIC, anon, authenticated, service_role;
    END IF;
END $$;

REVOKE ALL ON FUNCTION public.claim_webhook_event(TEXT, TEXT, TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_webhook_event(TEXT, TEXT, TEXT, INT) TO service_role;

REVOKE ALL ON FUNCTION public.complete_webhook_event(TEXT, TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_webhook_event(TEXT, TEXT, UUID, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.initiate_refund_operation(TEXT, TEXT, NUMERIC, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.initiate_refund_operation(TEXT, TEXT, NUMERIC, TEXT, UUID) TO service_role;

REVOKE ALL ON FUNCTION public.force_fail_refund_operation(UUID, TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.force_fail_refund_operation(UUID, TEXT, TEXT, BOOLEAN) TO service_role;

REVOKE ALL ON FUNCTION public.record_refund_success(TEXT, TEXT, NUMERIC, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_refund_success(TEXT, TEXT, NUMERIC, TEXT, TEXT, UUID) TO service_role;

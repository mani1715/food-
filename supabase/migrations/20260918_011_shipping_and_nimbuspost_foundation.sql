-- ==============================================================================
-- MIGRATION 011: AISHU HOME FOODS — NIMBUSPOST SHIPPING & LOGISTICS FOUNDATION
-- ==============================================================================
-- Provider-neutral logistics schema, shipments, shipment_events, pickup locations,
-- product/variant shipping attributes, package calculation, strict shipment state
-- transitions, manual dispatch mode, food safety disposition, and granular RBAC/RLS.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PRODUCT & VARIANT LEVEL SHIPPING DATA ENHANCEMENTS
-- ------------------------------------------------------------------------------

-- Variant-Level Shipping Fields on product_weight_options
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'product_weight_options' AND column_name = 'shipping_weight_grams'
    ) THEN
        ALTER TABLE public.product_weight_options 
        ADD COLUMN shipping_weight_grams INTEGER CHECK (shipping_weight_grams > 0),
        ADD COLUMN package_length_cm NUMERIC(6,2) CHECK (package_length_cm > 0),
        ADD COLUMN package_width_cm NUMERIC(6,2) CHECK (package_width_cm > 0),
        ADD COLUMN package_height_cm NUMERIC(6,2) CHECK (package_height_cm > 0),
        ADD COLUMN is_fragile BOOLEAN DEFAULT false,
        ADD COLUMN requires_special_handling BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Product-Level Shipping Fallback Fields on products
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'shipping_weight_grams'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN shipping_weight_grams INTEGER CHECK (shipping_weight_grams > 0),
        ADD COLUMN package_length_cm NUMERIC(6,2) CHECK (package_length_cm > 0),
        ADD COLUMN package_width_cm NUMERIC(6,2) CHECK (package_width_cm > 0),
        ADD COLUMN package_height_cm NUMERIC(6,2) CHECK (package_height_cm > 0),
        ADD COLUMN is_fragile BOOLEAN DEFAULT false,
        ADD COLUMN requires_special_handling BOOLEAN DEFAULT false;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. PICKUP LOCATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_pickup_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    landmark TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'India',
    provider TEXT NOT NULL DEFAULT 'nimbuspost',
    provider_location_id TEXT, -- Nullable until NimbusPost official integration
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipping_pickup_locations_default ON public.shipping_pickup_locations(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_shipping_pickup_locations_active ON public.shipping_pickup_locations(is_active);

-- Seed Initial Default Pickup Location Placeholder
INSERT INTO public.shipping_pickup_locations (
    name, contact_name, phone, address_line_1, city, state, postal_code, is_default, is_active
) 
SELECT 
    'Aishu Foods Central Kitchen',
    'Store Manager',
    '9876543210',
    'Road No 12, Jubilee Hills',
    'Hyderabad',
    'Telangana',
    '500033',
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.shipping_pickup_locations);

-- ------------------------------------------------------------------------------
-- 3. SHIPPING SETTINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_settings (
    id TEXT PRIMARY KEY DEFAULT 'default_shipping_config',
    shipping_provider TEXT NOT NULL DEFAULT 'nimbuspost',
    enabled BOOLEAN NOT NULL DEFAULT false,
    test_mode BOOLEAN NOT NULL DEFAULT true,
    manual_shipping_enabled BOOLEAN NOT NULL DEFAULT true,
    automatic_shipment_creation BOOLEAN NOT NULL DEFAULT false,
    default_package_dimensions JSONB DEFAULT '{"length_cm": 15, "width_cm": 12, "height_cm": 10}'::jsonb,
    default_shipping_weight_buffer_grams INTEGER DEFAULT 50,
    volumetric_divisor INTEGER, -- Nullable: NOT hardcoded/guessed without official NimbusPost spec
    serviceability_required BOOLEAN DEFAULT false,
    allow_cod BOOLEAN DEFAULT true,
    allow_returns BOOLEAN DEFAULT false,
    tracking_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Initial Settings Record
INSERT INTO public.shipping_settings (id, shipping_provider, enabled, test_mode, manual_shipping_enabled)
VALUES ('default_shipping_config', 'nimbuspost', false, true, true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. SHIPMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    provider TEXT NOT NULL DEFAULT 'nimbuspost',
    provider_shipment_id TEXT,
    provider_order_id TEXT,
    courier_id TEXT,
    courier_name TEXT,
    awb_number TEXT,
    tracking_url TEXT,
    
    -- Status Separation
    shipping_status TEXT NOT NULL DEFAULT 'not_created' CHECK (
        shipping_status IN (
            'not_created',
            'serviceability_pending',
            'ready_to_ship',
            'shipment_created',
            'pickup_scheduled',
            'pickup_failed',
            'picked_up',
            'in_transit',
            'out_for_delivery',
            'delivered',
            'delivery_failed',
            'ndr',
            'rto_initiated',
            'rto_in_transit',
            'rto_delivered',
            'return_requested',
            'return_in_transit',
            'returned',
            'cancelled'
        )
    ),
    pickup_status TEXT NOT NULL DEFAULT 'not_scheduled' CHECK (
        pickup_status IN ('not_scheduled', 'pickup_scheduled', 'picked_up', 'pickup_failed', 'cancelled')
    ),

    -- Timestamps
    estimated_delivery_at TIMESTAMPTZ,
    actual_delivery_at TIMESTAMPTZ,
    pickup_scheduled_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    out_for_delivery_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    ndr_at TIMESTAMPTZ,
    ndr_reason TEXT,
    rto_at TIMESTAMPTZ,
    rto_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,

    -- Financial Separation: Actual Logistics Cost vs Customer Delivery Charge
    shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (shipping_cost >= 0),
    customer_delivery_charge NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (customer_delivery_charge >= 0),

    -- COD Logistics Tracking
    cod_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (cod_amount >= 0),
    cod_collection_status TEXT NOT NULL DEFAULT 'not_applicable' CHECK (
        cod_collection_status IN ('not_applicable', 'pending', 'collected', 'failed', 'returned')
    ),
    cod_remittance_status TEXT NOT NULL DEFAULT 'pending' CHECK (
        cod_remittance_status IN ('not_applicable', 'pending', 'remitted', 'disputed')
    ),
    cod_remittance_reference TEXT,
    cod_remitted_at TIMESTAMPTZ,

    -- Package & Weight Attributes
    charged_weight_grams INTEGER CHECK (charged_weight_grams IS NULL OR charged_weight_grams > 0),
    dead_weight_grams INTEGER CHECK (dead_weight_grams IS NULL OR dead_weight_grams > 0),
    volumetric_weight_grams INTEGER CHECK (volumetric_weight_grams IS NULL OR volumetric_weight_grams > 0),
    package_length_cm NUMERIC(6,2) CHECK (package_length_cm IS NULL OR package_length_cm > 0),
    package_width_cm NUMERIC(6,2) CHECK (package_width_cm IS NULL OR package_width_cm > 0),
    package_height_cm NUMERIC(6,2) CHECK (package_height_cm IS NULL OR package_height_cm > 0),
    currency TEXT NOT NULL DEFAULT 'INR',

    -- Documentation & Dispatch References
    label_url TEXT,
    manifest_url TEXT,
    is_manual_dispatch BOOLEAN NOT NULL DEFAULT false,

    -- Food Safety Disposition for RTO / Returns (NO AUTOMATIC RESTOCKING)
    food_disposition_status TEXT NOT NULL DEFAULT 'not_applicable' CHECK (
        food_disposition_status IN ('not_applicable', 'inspection_required', 'discard', 'non_sellable', 'approved_for_restock')
    ),
    food_disposition_notes TEXT,
    food_disposition_by TEXT,
    food_disposition_at TIMESTAMPTZ,

    -- Idempotency & Provider Sync
    idempotency_key TEXT UNIQUE,
    provider_created_at TIMESTAMPTZ,
    last_provider_sync_at TIMESTAMPTZ,
    last_tracking_sync_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance & search
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_awb ON public.shipments(awb_number) WHERE awb_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(shipping_status);
CREATE INDEX IF NOT EXISTS idx_shipments_provider_shipment_id ON public.shipments(provider_shipment_id) WHERE provider_shipment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON public.shipments(created_at DESC);

-- Unique index to prevent multiple active outbound shipments per order
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_outbound_shipment_per_order 
ON public.shipments(order_id) 
WHERE shipping_status NOT IN ('cancelled', 'returned', 'rto_delivered');

-- ------------------------------------------------------------------------------
-- 5. SHIPMENT EVENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'nimbuspost',
    provider_event_id TEXT,
    status TEXT NOT NULL,
    status_code TEXT,
    description TEXT NOT NULL,
    location TEXT,
    event_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment_id ON public.shipment_events(shipment_id, event_at DESC);

-- Duplicate event protection
CREATE UNIQUE INDEX IF NOT EXISTS uq_shipment_event_idempotency
ON public.shipment_events(shipment_id, status, event_at);

-- ------------------------------------------------------------------------------
-- 6. SHIPPING WEBHOOK EVENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL DEFAULT 'nimbuspost',
    provider_event_id TEXT,
    event_type TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (
        processing_status IN ('pending', 'processed', 'ignored', 'failed', 'rejected_unauthenticated')
    ),
    error_code TEXT,
    retry_count INTEGER DEFAULT 0,
    payload_hash TEXT NOT NULL,
    sanitized_metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_shipping_webhook_events_hash ON public.shipping_webhook_events(payload_hash);
CREATE INDEX IF NOT EXISTS idx_shipping_webhook_events_status ON public.shipping_webhook_events(processing_status);

-- ------------------------------------------------------------------------------
-- 7. SHIPMENT ATTEMPTS TABLE (Auditing & Retry Safety)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'nimbuspost',
    idempotency_key TEXT,
    status TEXT NOT NULL,
    error_message TEXT,
    attempted_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipment_attempts_order_id ON public.shipment_attempts(order_id);

-- ------------------------------------------------------------------------------
-- 8. EXTEND RBAC PERMISSIONS FOR SHIPPING DOMAIN
-- ------------------------------------------------------------------------------
-- Ensure allowed_tabs on admin_roles includes 'shipping'
UPDATE public.admin_roles
SET allowed_tabs = array_append(allowed_tabs, 'shipping')
WHERE NOT ('shipping' = ANY(allowed_tabs));

-- ------------------------------------------------------------------------------
-- 9. SERVER-AUTHORITATIVE FUNCTIONS & RPCS
-- ------------------------------------------------------------------------------

-- Helper: Check if an order is eligible/ready for shipment creation
CREATE OR REPLACE FUNCTION public.is_order_ready_for_shipment(p_order_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_order RECORD;
    v_active_shipment_count INT;
    v_addr JSONB;
    v_is_prepaid BOOLEAN;
    v_is_cod BOOLEAN;
    v_eligible BOOLEAN := true;
    v_reasons TEXT[] := ARRAY[]::TEXT[];
    v_pkg JSONB;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('eligible', false, 'error', 'Order not found');
    END IF;

    -- Order Status Check
    IF v_order.order_status = 'cancelled' OR v_order.status = 'Cancelled' THEN
        v_eligible := false;
        v_reasons := array_append(v_reasons, 'Order is cancelled');
    END IF;

    -- Check if active outbound shipment already exists
    SELECT COUNT(*) INTO v_active_shipment_count
    FROM public.shipments
    WHERE order_id = p_order_id
      AND shipping_status NOT IN ('cancelled', 'returned', 'rto_delivered');

    IF v_active_shipment_count > 0 THEN
        v_eligible := false;
        v_reasons := array_append(v_reasons, 'Active outbound shipment already exists for this order');
    END IF;

    -- Address Check
    v_addr := v_order.delivery_address_json;
    IF v_addr IS NULL OR 
       COALESCE(v_addr->>'address', '') = '' OR 
       COALESCE(v_addr->>'city', '') = '' OR 
       COALESCE(v_addr->>'pincode', '') = '' THEN
        v_eligible := false;
        v_reasons := array_append(v_reasons, 'Delivery address is incomplete (missing address, city, or pincode)');
    END IF;

    -- Payment Mode & Status Verification
    v_is_cod := (v_order.payment_method ILIKE '%cod%' OR v_order.payment_status IN ('cod_pending', 'cod'));
    v_is_prepaid := NOT v_is_cod;

    IF v_is_prepaid THEN
        IF v_order.payment_status NOT IN ('paid', 'completed') THEN
            v_eligible := false;
            v_reasons := array_append(v_reasons, 'Prepaid order payment is not verified (status: ' || COALESCE(v_order.payment_status, 'unknown') || ')');
        END IF;
    ELSE
        -- COD checks
        IF v_order.order_status NOT IN ('confirmed', 'processing', 'ready_to_ship') THEN
            v_eligible := false;
            v_reasons := array_append(v_reasons, 'COD order must be confirmed before dispatch');
        END IF;
    END IF;

    -- Shipping Logistics Data Completeness Verification (Strict: No guessing)
    v_pkg := public.calculate_order_package_details(p_order_id);
    IF (v_pkg->>'is_complete')::boolean = false THEN
        v_eligible := false;
        v_reasons := array_append(v_reasons, 'SHIPPING_DATA_INCOMPLETE: Packed courier shipping weight not configured for ' || array_to_string(ARRAY(SELECT jsonb_array_elements_text(v_pkg->'incomplete_items')), ', '));
    END IF;

    RETURN jsonb_build_object(
        'eligible', v_eligible,
        'order_id', v_order.id,
        'order_number', v_order.order_number,
        'order_status', v_order.order_status,
        'payment_status', v_order.payment_status,
        'is_cod', v_is_cod,
        'package_details', v_pkg,
        'reasons', v_reasons
    );
END;
$$;

-- Server-Authoritative Package Calculator (Strict: No selling-weight inference)
CREATE OR REPLACE FUNCTION public.calculate_order_package_details(p_order_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_variant RECORD;
    v_product RECORD;
    v_settings RECORD;
    v_total_dead_weight INTEGER := 0;
    v_max_len NUMERIC(6,2) := 0;
    v_max_wid NUMERIC(6,2) := 0;
    v_total_height NUMERIC(6,2) := 0;
    v_has_fragile BOOLEAN := false;
    v_has_special_handling BOOLEAN := false;
    v_incomplete_items TEXT[] := ARRAY[]::TEXT[];
    v_buffer_grams INTEGER := 0;
    v_volumetric_weight INTEGER := NULL;
    v_volumetric_status TEXT := 'NOT_CONFIGURED';
    v_is_complete BOOLEAN := true;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- Load settings
    SELECT * INTO v_settings FROM public.shipping_settings WHERE id = 'default_shipping_config';
    IF FOUND AND v_settings.default_shipping_weight_buffer_grams IS NOT NULL THEN
        v_buffer_grams := v_settings.default_shipping_weight_buffer_grams;
    END IF;

    FOR v_item IN (
        SELECT oi.* 
        FROM public.order_items oi 
        WHERE oi.order_id = p_order_id
    ) LOOP
        -- 1. Explicit purchased variant shipping data (Priority 1)
        SELECT * INTO v_variant 
        FROM public.product_weight_options 
        WHERE product_id = v_item.product_id 
          AND weight_label = v_item.selected_weight
        LIMIT 1;

        -- 2. Explicit product-level fallback (Priority 2)
        SELECT * INTO v_product 
        FROM public.products 
        WHERE id = v_item.product_id
        LIMIT 1;

        DECLARE
            v_item_weight INTEGER := NULL;
            v_item_len NUMERIC(6,2) := NULL;
            v_item_wid NUMERIC(6,2) := NULL;
            v_item_hei NUMERIC(6,2) := NULL;
            v_item_fragile BOOLEAN := false;
            v_item_special BOOLEAN := false;
        BEGIN
            -- Strictly resolve from explicit logistics fields (NO INFERENCE FROM SELLING WEIGHT TEXT)
            IF v_variant.shipping_weight_grams IS NOT NULL AND v_variant.shipping_weight_grams > 0 THEN
                v_item_weight := v_variant.shipping_weight_grams;
                v_item_len := v_variant.package_length_cm;
                v_item_wid := v_variant.package_width_cm;
                v_item_hei := v_variant.package_height_cm;
                v_item_fragile := COALESCE(v_variant.is_fragile, false);
                v_item_special := COALESCE(v_variant.requires_special_handling, false);
            ELSIF v_product.shipping_weight_grams IS NOT NULL AND v_product.shipping_weight_grams > 0 THEN
                v_item_weight := v_product.shipping_weight_grams;
                v_item_len := v_product.package_length_cm;
                v_item_wid := v_product.package_width_cm;
                v_item_hei := v_product.package_height_cm;
                v_item_fragile := COALESCE(v_product.is_fragile, false);
                v_item_special := COALESCE(v_product.requires_special_handling, false);
            END IF;

            -- If logistics weight is missing, fail-closed without guessing
            IF v_item_weight IS NULL THEN
                v_is_complete := false;
                v_incomplete_items := array_append(
                    v_incomplete_items, 
                    'Product: ' || COALESCE(v_item.product_name_snapshot, v_item.product_id) || ' (Variant: ' || COALESCE(v_item.selected_weight, 'Default') || ') — Missing packed shipping weight'
                );
            ELSE
                v_total_dead_weight := v_total_dead_weight + (v_item_weight * v_item.quantity);
                IF v_item_len IS NOT NULL AND v_item_len > v_max_len THEN v_max_len := v_item_len; END IF;
                IF v_item_wid IS NOT NULL AND v_item_wid > v_max_wid THEN v_max_wid := v_item_wid; END IF;
                IF v_item_hei IS NOT NULL THEN v_total_height := v_total_height + (v_item_hei * v_item.quantity); END IF;
                IF v_item_fragile THEN v_has_fragile := true; END IF;
                IF v_item_special THEN v_has_special_handling := true; END IF;
            END IF;
        END;
    END LOOP;

    -- Packaging buffer is added ONLY to an explicitly calculated logistics dead weight
    IF v_is_complete AND v_total_dead_weight > 0 AND v_buffer_grams > 0 THEN
        v_total_dead_weight := v_total_dead_weight + v_buffer_grams;
    END IF;

    -- Dimensions: Apply explicit store box default only if items lacked dimensions but weights were complete
    IF v_is_complete AND v_max_len = 0 AND v_settings.default_package_dimensions IS NOT NULL THEN
        v_max_len := COALESCE((v_settings.default_package_dimensions->>'length_cm')::numeric, 15);
        v_max_wid := COALESCE((v_settings.default_package_dimensions->>'width_cm')::numeric, 12);
        v_total_height := COALESCE((v_settings.default_package_dimensions->>'height_cm')::numeric, 10);
    END IF;

    -- Volumetric Weight Calculation ONLY if officially configured divisor exists
    IF v_settings.volumetric_divisor IS NOT NULL AND v_settings.volumetric_divisor > 0 AND v_max_len > 0 THEN
        v_volumetric_weight := ROUND(((v_max_len * v_max_wid * v_total_height) / v_settings.volumetric_divisor) * 1000);
        v_volumetric_status := 'CONFIGURED';
    ELSE
        v_volumetric_status := 'NOT_CONFIGURED';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'status', CASE WHEN v_is_complete THEN 'COMPLETE' ELSE 'SHIPPING_DATA_INCOMPLETE' END,
        'is_complete', v_is_complete,
        'incomplete_items', v_incomplete_items,
        'dead_weight_grams', CASE WHEN v_is_complete THEN v_total_dead_weight ELSE NULL END,
        'package_length_cm', CASE WHEN v_max_len > 0 THEN v_max_len ELSE NULL END,
        'package_width_cm', CASE WHEN v_max_wid > 0 THEN v_max_wid ELSE NULL END,
        'package_height_cm', CASE WHEN v_total_height > 0 THEN v_total_height ELSE NULL END,
        'is_fragile', v_has_fragile,
        'requires_special_handling', v_has_special_handling,
        'volumetric_weight_grams', v_volumetric_weight,
        'volumetric_status', v_volumetric_status,
        'declared_value', v_order.grand_total,
        'cod_amount', CASE WHEN v_order.payment_method ILIKE '%cod%' THEN v_order.grand_total ELSE 0 END
    );
END;
$$;

-- Create Manual Shipment RPC (Admin operational fallback with strict RBAC)
CREATE OR REPLACE FUNCTION public.create_manual_shipment(
    p_order_id TEXT,
    p_courier_name TEXT,
    p_awb_number TEXT,
    p_tracking_url TEXT DEFAULT NULL,
    p_dead_weight_grams INTEGER DEFAULT NULL,
    p_shipping_cost NUMERIC DEFAULT 0.00,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_admin RECORD;
    v_order RECORD;
    v_eligibility JSONB;
    v_pkg JSONB;
    v_shipment_id UUID;
    v_weight INTEGER;
    v_active_shipment_count INT;
BEGIN
    -- Verify RBAC
    IF NOT public.has_admin_permission('shipping.create') THEN
        RAISE EXCEPTION 'Access Denied: Insufficient administrative privileges to create shipments.';
    END IF;

    SELECT * INTO v_admin FROM public.admin_roles WHERE user_id = auth.uid() AND status = 'active';

    -- Lock and verify Order
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- Concurrency & Idempotency check: Guard against multiple active outbound shipments
    SELECT COUNT(*) INTO v_active_shipment_count
    FROM public.shipments
    WHERE order_id = p_order_id
      AND shipping_status NOT IN ('cancelled', 'returned', 'rto_delivered');

    IF v_active_shipment_count > 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'An active outbound shipment already exists for this order.');
    END IF;

    -- Calculate package details
    v_pkg := public.calculate_order_package_details(p_order_id);

    -- If weight is explicitly entered by Admin during manual dispatch, use it; otherwise require complete package data
    IF p_dead_weight_grams IS NOT NULL AND p_dead_weight_grams > 0 THEN
        v_weight := p_dead_weight_grams;
    ELSIF (v_pkg->>'is_complete')::boolean = true AND (v_pkg->>'dead_weight_grams') IS NOT NULL THEN
        v_weight := (v_pkg->>'dead_weight_grams')::integer;
    ELSE
        RETURN jsonb_build_object(
            'success', false, 
            'status', 'SHIPPING_DATA_INCOMPLETE',
            'error', 'Cannot dispatch: Shipping weight missing for ' || array_to_string(ARRAY(SELECT jsonb_array_elements_text(v_pkg->'incomplete_items')), ', ') || '. Please configure product shipping weight or enter package dead weight.'
        );
    END IF;

    -- Verify Eligibility
    v_eligibility := public.is_order_ready_for_shipment(p_order_id);
    IF (v_eligibility->>'eligible')::boolean = false AND p_dead_weight_grams IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order is not eligible for shipment: ' || array_to_string(ARRAY(SELECT jsonb_array_elements_text(v_eligibility->'reasons')), ', '));
    END IF;

    -- Insert Shipment Record
    INSERT INTO public.shipments (
        order_id,
        provider,
        courier_name,
        awb_number,
        tracking_url,
        shipping_status,
        pickup_status,
        shipped_at,
        shipping_cost,
        customer_delivery_charge,
        cod_amount,
        cod_collection_status,
        dead_weight_grams,
        package_length_cm,
        package_width_cm,
        package_height_cm,
        is_manual_dispatch,
        idempotency_key
    ) VALUES (
        p_order_id,
        'manual',
        TRIM(p_courier_name),
        TRIM(p_awb_number),
        NULLIF(TRIM(p_tracking_url), ''),
        'shipment_created',
        'pickup_scheduled',
        now(),
        COALESCE(p_shipping_cost, 0.00),
        COALESCE(v_order.delivery_fee, 0.00),
        CASE WHEN v_order.payment_method ILIKE '%cod%' THEN v_order.grand_total ELSE 0.00 END,
        CASE WHEN v_order.payment_method ILIKE '%cod%' THEN 'pending' ELSE 'not_applicable' END,
        v_weight,
        (v_pkg->>'package_length_cm')::numeric,
        (v_pkg->>'package_width_cm')::numeric,
        (v_pkg->>'package_height_cm')::numeric,
        true,
        'manual-' || p_order_id || '-' || gen_random_uuid()::text
    ) RETURNING id INTO v_shipment_id;

    -- Record initial shipment event
    INSERT INTO public.shipment_events (
        shipment_id,
        provider,
        status,
        description,
        location,
        event_at,
        metadata
    ) VALUES (
        v_shipment_id,
        'manual',
        'shipment_created',
        'Manual shipment created with courier ' || TRIM(p_courier_name) || ' (AWB: ' || TRIM(p_awb_number) || ')',
        COALESCE(v_order.delivery_address_json->>'city', 'Central Kitchen'),
        now(),
        jsonb_build_object('admin_id', auth.uid(), 'notes', p_notes)
    );

    -- Synchronize order state to 'shipped' (leaving payment state untouched)
    UPDATE public.orders
    SET 
        order_status = 'shipped',
        updated_at = now()
    WHERE id = p_order_id;

    -- Audit log entry
    INSERT INTO public.admin_audit_logs (
        admin_id, admin_email, action, target_type, target_id, details
    ) VALUES (
        auth.uid(),
        COALESCE(v_admin.email, 'admin@aishufoods.com'),
        'CREATE_MANUAL_SHIPMENT',
        'shipments',
        v_shipment_id::text,
        jsonb_build_object(
            'order_id', p_order_id,
            'courier', p_courier_name,
            'awb', p_awb_number,
            'dead_weight_grams', v_weight,
            'shipping_cost', p_shipping_cost
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'shipment_id', v_shipment_id,
        'order_id', p_order_id,
        'awb_number', p_awb_number,
        'courier_name', p_courier_name,
        'status', 'shipment_created'
    );
END;
$$;

-- Strict Server-Enforced Shipment State Machine
CREATE OR REPLACE FUNCTION public.update_shipment_status_secure(
    p_shipment_id UUID,
    p_new_status TEXT,
    p_location TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_admin RECORD;
    v_shipment RECORD;
    v_order RECORD;
    v_is_valid_transition BOOLEAN := false;
BEGIN
    -- Verify RBAC
    IF NOT public.has_admin_permission('shipping.update') THEN
        RAISE EXCEPTION 'Access Denied: Insufficient administrative privileges to update shipment status.';
    END IF;

    SELECT * INTO v_admin FROM public.admin_roles WHERE user_id = auth.uid() AND status = 'active';

    SELECT * INTO v_shipment FROM public.shipments WHERE id = p_shipment_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Shipment not found');
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = v_shipment.order_id;

    -- Strict Server-Side State Transition Matrix
    CASE v_shipment.shipping_status
        WHEN 'not_created' THEN
            v_is_valid_transition := (p_new_status IN ('ready_to_ship', 'cancelled'));
        WHEN 'ready_to_ship' THEN
            v_is_valid_transition := (p_new_status IN ('shipment_created', 'cancelled'));
        WHEN 'shipment_created' THEN
            v_is_valid_transition := (p_new_status IN ('pickup_scheduled', 'picked_up', 'cancelled'));
        WHEN 'pickup_scheduled' THEN
            v_is_valid_transition := (p_new_status IN ('picked_up', 'pickup_failed', 'cancelled'));
        WHEN 'pickup_failed' THEN
            v_is_valid_transition := (p_new_status IN ('pickup_scheduled', 'cancelled'));
        WHEN 'picked_up' THEN
            v_is_valid_transition := (p_new_status IN ('in_transit', 'ndr'));
        WHEN 'in_transit' THEN
            v_is_valid_transition := (p_new_status IN ('out_for_delivery', 'ndr', 'rto_initiated', 'delivered'));
        WHEN 'out_for_delivery' THEN
            v_is_valid_transition := (p_new_status IN ('delivered', 'delivery_failed', 'ndr'));
        WHEN 'delivery_failed' THEN
            v_is_valid_transition := (p_new_status IN ('out_for_delivery', 'ndr', 'rto_initiated'));
        WHEN 'ndr' THEN
            v_is_valid_transition := (p_new_status IN ('in_transit', 'out_for_delivery', 'rto_initiated', 'delivered'));
        WHEN 'rto_initiated' THEN
            v_is_valid_transition := (p_new_status IN ('rto_in_transit', 'cancelled'));
        WHEN 'rto_in_transit' THEN
            v_is_valid_transition := (p_new_status IN ('rto_delivered'));
        WHEN 'rto_delivered' THEN
            v_is_valid_transition := false; -- Terminal shipping state
        WHEN 'return_requested' THEN
            v_is_valid_transition := (p_new_status IN ('return_in_transit', 'cancelled'));
        WHEN 'return_in_transit' THEN
            v_is_valid_transition := (p_new_status IN ('returned'));
        WHEN 'returned' THEN
            v_is_valid_transition := false; -- Terminal shipping state
        WHEN 'delivered' THEN
            v_is_valid_transition := (p_new_status IN ('return_requested'));
        WHEN 'cancelled' THEN
            v_is_valid_transition := false; -- Terminal
        ELSE
            v_is_valid_transition := false;
    END CASE;

    IF NOT v_is_valid_transition THEN
        RAISE EXCEPTION 'Invalid shipment state transition: cannot transition from "%" to "%"', v_shipment.shipping_status, p_new_status;
    END IF;

    -- Perform State Update
    UPDATE public.shipments
    SET 
        shipping_status = p_new_status,
        picked_up_at = CASE WHEN p_new_status = 'picked_up' AND picked_up_at IS NULL THEN now() ELSE picked_up_at END,
        out_for_delivery_at = CASE WHEN p_new_status = 'out_for_delivery' AND out_for_delivery_at IS NULL THEN now() ELSE out_for_delivery_at END,
        delivered_at = CASE WHEN p_new_status = 'delivered' AND delivered_at IS NULL THEN now() ELSE delivered_at END,
        actual_delivery_at = CASE WHEN p_new_status = 'delivered' AND actual_delivery_at IS NULL THEN now() ELSE actual_delivery_at END,
        ndr_at = CASE WHEN p_new_status = 'ndr' THEN now() ELSE ndr_at END,
        ndr_reason = CASE WHEN p_new_status = 'ndr' THEN COALESCE(p_reason, ndr_reason) ELSE ndr_reason END,
        rto_at = CASE WHEN p_new_status = 'rto_initiated' THEN now() ELSE rto_at END,
        rto_reason = CASE WHEN p_new_status = 'rto_initiated' THEN COALESCE(p_reason, rto_reason) ELSE rto_reason END,
        cancelled_at = CASE WHEN p_new_status = 'cancelled' THEN now() ELSE cancelled_at END,
        cancellation_reason = CASE WHEN p_new_status = 'cancelled' THEN COALESCE(p_reason, cancellation_reason) ELSE cancellation_reason END,
        -- Food safety disposition required flag when parcel returns to kitchen
        food_disposition_status = CASE 
            WHEN p_new_status IN ('rto_delivered', 'returned') THEN 'inspection_required' 
            ELSE food_disposition_status 
        END,
        updated_at = now()
    WHERE id = p_shipment_id;

    -- Append chronological tracking event
    INSERT INTO public.shipment_events (
        shipment_id,
        provider,
        status,
        description,
        location,
        event_at,
        metadata
    ) VALUES (
        p_shipment_id,
        v_shipment.provider,
        p_new_status,
        COALESCE(p_description, 'Shipment status updated to ' || p_new_status),
        p_location,
        now(),
        jsonb_build_object('updated_by', auth.uid(), 'reason', p_reason)
    );

    -- Synchronize order state appropriately without overwriting payment authority
    IF p_new_status = 'delivered' THEN
        UPDATE public.orders SET order_status = 'delivered', updated_at = now() WHERE id = v_shipment.order_id;
    ELSIF p_new_status = 'out_for_delivery' THEN
        UPDATE public.orders SET order_status = 'out for delivery', updated_at = now() WHERE id = v_shipment.order_id;
    END IF;

    -- Audit log
    INSERT INTO public.admin_audit_logs (
        admin_id, admin_email, action, target_type, target_id, details
    ) VALUES (
        auth.uid(),
        COALESCE(v_admin.email, 'admin@aishufoods.com'),
        'UPDATE_SHIPMENT_STATUS',
        'shipments',
        p_shipment_id::text,
        jsonb_build_object('old_status', v_shipment.shipping_status, 'new_status', p_new_status, 'reason', p_reason)
    );

    RETURN jsonb_build_object(
        'success', true,
        'shipment_id', p_shipment_id,
        'old_status', v_shipment.shipping_status,
        'new_status', p_new_status
    );
END;
$$;

-- Food Safety Restock & Disposition RPC (Explicit Admin Review for RTO / Returns)
CREATE OR REPLACE FUNCTION public.disposition_returned_food_stock(
    p_shipment_id UUID,
    p_action TEXT, -- 'discard' | 'non_sellable' | 'approved_for_restock'
    p_notes TEXT,
    p_restock_items JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_admin RECORD;
    v_shipment RECORD;
    v_item JSONB;
    v_restocked_count INT := 0;
BEGIN
    IF NOT public.has_admin_permission('shipping.return') THEN
        RAISE EXCEPTION 'Access Denied: Insufficient privileges for food return disposition.';
    END IF;

    IF p_action NOT IN ('discard', 'non_sellable', 'approved_for_restock') THEN
        RAISE EXCEPTION 'Invalid disposition action. Must be discard, non_sellable, or approved_for_restock.';
    END IF;

    SELECT * INTO v_admin FROM public.admin_roles WHERE user_id = auth.uid() AND status = 'active';

    SELECT * INTO v_shipment FROM public.shipments WHERE id = p_shipment_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Shipment not found');
    END IF;

    IF v_shipment.food_disposition_status != 'inspection_required' AND v_shipment.food_disposition_status != 'not_applicable' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Shipment food disposition has already been processed: ' || v_shipment.food_disposition_status);
    END IF;

    -- Only increment inventory if explicitly approved after kitchen inspection
    IF p_action = 'approved_for_restock' AND jsonb_array_length(p_restock_items) > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_restock_items) LOOP
            -- Call safe restock primitive
            PERFORM public.restock_product_stock(
                (v_item->>'product_id')::text,
                (v_item->>'quantity')::integer,
                v_item->>'selected_weight',
                'Returned Food Inspected & Approved Restock (Shipment: ' || p_shipment_id::text || ')'
            );
            v_restocked_count := v_restocked_count + 1;
        END LOOP;
    END IF;

    -- Update shipment record
    UPDATE public.shipments
    SET 
        food_disposition_status = p_action,
        food_disposition_notes = p_notes,
        food_disposition_by = COALESCE(v_admin.email, auth.uid()::text),
        food_disposition_at = now(),
        updated_at = now()
    WHERE id = p_shipment_id;

    -- Audit log
    INSERT INTO public.admin_audit_logs (
        admin_id, admin_email, action, target_type, target_id, details
    ) VALUES (
        auth.uid(),
        COALESCE(v_admin.email, 'admin@aishufoods.com'),
        'DISPOSITION_RETURNED_FOOD',
        'shipments',
        p_shipment_id::text,
        jsonb_build_object('action', p_action, 'notes', p_notes, 'restocked_item_count', v_restocked_count)
    );

    RETURN jsonb_build_object(
        'success', true,
        'shipment_id', p_shipment_id,
        'disposition', p_action,
        'restocked_item_count', v_restocked_count
    );
END;
$$;

-- Serviceability Check Scaffolding (Fail-Closed: Returns PROVIDER_NOT_CONFIGURED)
CREATE OR REPLACE FUNCTION public.check_shipping_serviceability(
    p_pickup_pincode TEXT,
    p_delivery_pincode TEXT,
    p_weight_grams INTEGER DEFAULT 500,
    p_is_cod BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_settings RECORD;
BEGIN
    SELECT * INTO v_settings FROM public.shipping_settings WHERE id = 'default_shipping_config';

    -- Provider is not connected yet with official API credentials
    RETURN jsonb_build_object(
        'status', 'PROVIDER_NOT_CONFIGURED',
        'provider', 'nimbuspost',
        'serviceable', false,
        'message', 'NimbusPost logistics partner integration is pending official API credentials and configuration.',
        'available_couriers', '[]'::jsonb
    );
END;
$$;

-- Secure Order Shipping Details Retrieval (Customer-Safe & Privacy-Preserving)
CREATE OR REPLACE FUNCTION public.get_order_shipping_details(p_order_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_is_staff BOOLEAN;
    v_order RECORD;
    v_shipment RECORD;
    v_events JSONB;
BEGIN
    v_is_staff := public.is_staff();

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('found', false);
    END IF;

    -- If not staff, enforce customer ownership
    IF NOT v_is_staff THEN
        IF v_order.customer_id IS NOT NULL AND v_order.customer_id != auth.uid() THEN
            RETURN jsonb_build_object('found', false, 'error', 'Access denied');
        END IF;
    END IF;

    SELECT * INTO v_shipment 
    FROM public.shipments 
    WHERE order_id = p_order_id 
    ORDER BY created_at DESC 
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'found', true,
            'has_shipment', false,
            'order_id', p_order_id,
            'order_status', v_order.order_status
        );
    END IF;

    -- Fetch customer-safe chronological events
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'status', se.status,
            'description', se.description,
            'location', se.location,
            'event_at', se.event_at
        ) ORDER BY se.event_at ASC
    ), '[]'::jsonb) INTO v_events
    FROM public.shipment_events se
    WHERE se.shipment_id = v_shipment.id;

    -- If staff, return full logistics & cost details; if customer, return sanitized data
    IF v_is_staff THEN
        RETURN jsonb_build_object(
            'found', true,
            'has_shipment', true,
            'shipment_id', v_shipment.id,
            'order_id', v_shipment.order_id,
            'provider', v_shipment.provider,
            'courier_name', v_shipment.courier_name,
            'awb_number', v_shipment.awb_number,
            'tracking_url', v_shipment.tracking_url,
            'shipping_status', v_shipment.shipping_status,
            'pickup_status', v_shipment.pickup_status,
            'estimated_delivery_at', v_shipment.estimated_delivery_at,
            'actual_delivery_at', v_shipment.actual_delivery_at,
            'shipped_at', v_shipment.shipped_at,
            'delivered_at', v_shipment.delivered_at,
            'ndr_at', v_shipment.ndr_at,
            'ndr_reason', v_shipment.ndr_reason,
            'rto_at', v_shipment.rto_at,
            'rto_reason', v_shipment.rto_reason,
            'shipping_cost', v_shipment.shipping_cost,
            'customer_delivery_charge', v_shipment.customer_delivery_charge,
            'cod_amount', v_shipment.cod_amount,
            'cod_collection_status', v_shipment.cod_collection_status,
            'cod_remittance_status', v_shipment.cod_remittance_status,
            'dead_weight_grams', v_shipment.dead_weight_grams,
            'volumetric_weight_grams', v_shipment.volumetric_weight_grams,
            'package_length_cm', v_shipment.package_length_cm,
            'package_width_cm', v_shipment.package_width_cm,
            'package_height_cm', v_shipment.package_height_cm,
            'label_url', v_shipment.label_url,
            'is_manual_dispatch', v_shipment.is_manual_dispatch,
            'food_disposition_status', v_shipment.food_disposition_status,
            'events', v_events
        );
    ELSE
        -- Customer Safe View
        RETURN jsonb_build_object(
            'found', true,
            'has_shipment', true,
            'courier_name', v_shipment.courier_name,
            'awb_number', v_shipment.awb_number,
            'tracking_url', v_shipment.tracking_url,
            'shipping_status', v_shipment.shipping_status,
            'shipped_at', v_shipment.shipped_at,
            'delivered_at', v_shipment.delivered_at,
            'events', v_events
        );
    END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE public.shipping_pickup_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_attempts ENABLE ROW LEVEL SECURITY;

-- 1. shipping_pickup_locations
DROP POLICY IF EXISTS "Staff can manage pickup locations" ON public.shipping_pickup_locations;
CREATE POLICY "Staff can manage pickup locations"
    ON public.shipping_pickup_locations FOR ALL
    TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());

-- 2. shipping_settings
DROP POLICY IF EXISTS "Staff can manage shipping settings" ON public.shipping_settings;
CREATE POLICY "Staff can manage shipping settings"
    ON public.shipping_settings FOR ALL
    TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());

-- 3. shipments
DROP POLICY IF EXISTS "Staff can manage all shipments" ON public.shipments;
CREATE POLICY "Staff can manage all shipments"
    ON public.shipments FOR ALL
    TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "Customers can view their own shipments" ON public.shipments;
CREATE POLICY "Customers can view their own shipments"
    ON public.shipments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = shipments.order_id
              AND o.customer_id = auth.uid()
        )
    );

-- 4. shipment_events
DROP POLICY IF EXISTS "Staff can manage shipment events" ON public.shipment_events;
CREATE POLICY "Staff can manage shipment events"
    ON public.shipment_events FOR ALL
    TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "Customers can view their shipment events" ON public.shipment_events;
CREATE POLICY "Customers can view their shipment events"
    ON public.shipment_events FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments s
            JOIN public.orders o ON o.id = s.order_id
            WHERE s.id = shipment_events.shipment_id
              AND o.customer_id = auth.uid()
        )
    );

-- 5. shipping_webhook_events & shipment_attempts (Strict Admin Only)
DROP POLICY IF EXISTS "Admins can view webhook logs" ON public.shipping_webhook_events;
CREATE POLICY "Admins can view webhook logs"
    ON public.shipping_webhook_events FOR SELECT
    TO authenticated
    USING (public.is_staff());

DROP POLICY IF EXISTS "Admins can view shipment attempts" ON public.shipment_attempts;
CREATE POLICY "Admins can view shipment attempts"
    ON public.shipment_attempts FOR SELECT
    TO authenticated
    USING (public.is_staff());

-- Grant execute on shipping RPCs
GRANT EXECUTE ON FUNCTION public.is_order_ready_for_shipment(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.calculate_order_package_details(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_manual_shipment(TEXT, TEXT, TEXT, TEXT, INTEGER, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_shipment_status_secure(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.disposition_returned_food_stock(UUID, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_shipping_serviceability(TEXT, TEXT, INTEGER, BOOLEAN) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_order_shipping_details(TEXT) TO authenticated, anon;

-- End of Migration 011

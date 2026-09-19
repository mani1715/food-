-- ==============================================================================
-- MIGRATION 002: AISHU HOME FOODS — FUNCTIONS, RPCs & ATOMIC CONCURRENCY
-- ==============================================================================
-- This migration provides secure database functions with explicit SECURITY DEFINER
-- semantics, fixed search_path, and input validation for atomic inventory,
-- RBAC helper checks, audit logging, and restricted order tracking.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. RBAC HELPER FUNCTIONS (Used in RLS Policies)
-- ------------------------------------------------------------------------------

-- Check if current authenticated user has active 'admin' or 'super_admin' role
CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_roles
        WHERE user_id = auth.uid()
          AND status = 'active'
          AND role IN ('admin', 'super_admin')
    );
$$;

-- Check if current authenticated user has active 'super_admin' role
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_roles
        WHERE user_id = auth.uid()
          AND status = 'active'
          AND role = 'super_admin'
    );
$$;

-- Check if current authenticated user has any active staff role (sub_admin, admin, super_admin)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_roles
        WHERE user_id = auth.uid()
          AND status = 'active'
    );
$$;

-- Revoke default public execution where appropriate; grant to authenticated
REVOKE EXECUTE ON FUNCTION public.is_admin_or_super() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_or_super() TO authenticated, anon;

REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, anon;

REVOKE EXECUTE ON FUNCTION public.is_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated, anon;


-- ------------------------------------------------------------------------------
-- 2. ATOMIC INVENTORY DECREMENT & RESTOCK FUNCTIONS
-- ------------------------------------------------------------------------------

-- Atomic decrement function preventing negative stock and race conditions
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
    p_product_id TEXT,
    p_quantity INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_stock INT;
    v_new_stock INT;
    v_is_out BOOLEAN;
BEGIN
    -- Input validation
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid decrement quantity');
    END IF;

    -- Lock the specific row for update
    SELECT inventory_count INTO v_current_stock
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Product not found');
    END IF;

    IF v_current_stock < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient stock',
            'available_stock', v_current_stock,
            'requested_qty', p_quantity
        );
    END IF;

    v_new_stock := v_current_stock - p_quantity;
    v_is_out := (v_new_stock <= 0);

    UPDATE public.products
    SET inventory_count = v_new_stock,
        out_of_stock = v_is_out,
        updated_at = NOW()
    WHERE id = p_product_id;

    RETURN jsonb_build_object(
        'success', true,
        'product_id', p_product_id,
        'previous_stock', v_current_stock,
        'new_stock', v_new_stock,
        'out_of_stock', v_is_out
    );
END;
$$;

-- Atomic restock function
CREATE OR REPLACE FUNCTION public.restock_product_stock(
    p_product_id TEXT,
    p_quantity INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_stock INT;
    v_new_stock INT;
BEGIN
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid restock quantity');
    END IF;

    -- Require staff privileges for manual restock
    IF NOT public.is_staff() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Staff privilege required');
    END IF;

    SELECT inventory_count INTO v_current_stock
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Product not found');
    END IF;

    v_new_stock := v_current_stock + p_quantity;

    UPDATE public.products
    SET inventory_count = v_new_stock,
        out_of_stock = false,
        updated_at = NOW()
    WHERE id = p_product_id;

    RETURN jsonb_build_object(
        'success', true,
        'product_id', p_product_id,
        'previous_stock', v_current_stock,
        'new_stock', v_new_stock,
        'out_of_stock', false
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decrement_product_stock(TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(TEXT, INT) TO anon, authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.restock_product_stock(TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.restock_product_stock(TEXT, INT) TO authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 3. AUDIT LOGGING FUNCTION
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action TEXT,
    p_entity TEXT,
    p_entity_id TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_log_id UUID;
    v_actor_email TEXT;
BEGIN
    -- Resolve actor email if authenticated
    SELECT email INTO v_actor_email FROM auth.users WHERE id = auth.uid();

    INSERT INTO public.audit_logs (
        actor_id,
        actor_email,
        action,
        entity,
        entity_id,
        metadata,
        created_at
    ) VALUES (
        auth.uid(),
        v_actor_email,
        p_action,
        p_entity,
        p_entity_id,
        p_metadata,
        NOW()
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_audit_event(TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_audit_event(TEXT, TEXT, TEXT, JSONB) TO authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 4. RESTRICTED ORDER TRACKING RPC (Data Minimization)
-- ------------------------------------------------------------------------------
-- Provides public customers the ability to track order progress using Order ID/Code
-- without exposing addresses, payment credentials, or other customer data.
CREATE OR REPLACE FUNCTION public.get_order_tracking_status(
    p_order_query TEXT,
    p_verification TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_clean_query TEXT;
    v_clean_verify TEXT;
BEGIN
    v_clean_query := TRIM(UPPER(p_order_query));
    v_clean_verify := TRIM(LOWER(COALESCE(p_verification, '')));

    IF v_clean_query IS NULL OR LENGTH(v_clean_query) < 4 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid search query');
    END IF;

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

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- If verification is provided (phone or email), match it
    IF v_clean_verify <> '' THEN
        IF NOT (
            LOWER(v_order.customer_email) = v_clean_verify OR
            RIGHT(REGEXP_REPLACE(v_order.customer_phone, '\D', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(v_clean_verify, '\D', '', 'g'), 10)
        ) THEN
            RETURN jsonb_build_object('success', false, 'error', 'Order details could not be verified');
        END IF;
    END IF;

    -- Return minimized non-sensitive tracking object
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

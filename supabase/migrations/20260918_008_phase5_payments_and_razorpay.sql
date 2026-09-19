-- ==============================================================================
-- MIGRATION 008: AISHU HOME FOODS — PHASE 5 PAYMENTS & RAZORPAY INTEGRATION
-- ==============================================================================
-- This migration establishes:
-- 1. Payments table for multi-attempt payment lifecycles and gateway metadata.
-- 2. Payment Webhook Events table for strict webhook idempotency.
-- 3. Payment lifecycle RPCs: record_payment_attempt, finalize_payment_success,
--    record_payment_failure, and cleanup_expired_unpaid_orders.
-- 4. RLS policies protecting payment records against unauthorized client mutations.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PAYMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_payments_provider_order_id ON public.payments(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON public.payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own payments" ON public.payments;
CREATE POLICY "Customers can view own payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = payments.order_id
              AND (o.customer_id = auth.uid() OR public.is_staff())
        )
    );

DROP POLICY IF EXISTS "Staff can manage payments" ON public.payments;
CREATE POLICY "Staff can manage payments"
    ON public.payments FOR ALL
    TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());


-- ------------------------------------------------------------------------------
-- 2. PAYMENT WEBHOOK EVENTS (Webhook Idempotency Storage)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'razorpay',
    payload_hash TEXT,
    status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'failed', 'ignored')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_event_id ON public.payment_webhook_events(event_id);

-- Enable RLS on payment_webhook_events
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view webhook events" ON public.payment_webhook_events;
CREATE POLICY "Staff can view webhook events"
    ON public.payment_webhook_events FOR SELECT
    TO authenticated
    USING (public.is_staff());


-- ------------------------------------------------------------------------------
-- 3. RECORD PAYMENT ATTEMPT RPC
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_payment_attempt(
    p_order_id TEXT,
    p_provider_order_id TEXT,
    p_amount NUMERIC,
    p_currency TEXT DEFAULT 'INR'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_order RECORD;
    v_payment_id UUID;
BEGIN
    SELECT id, grand_total, order_status, payment_status, customer_id
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- Check if order is already paid
    IF v_order.payment_status IN ('paid', 'completed') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order is already paid');
    END IF;

    -- Insert payment attempt record
    INSERT INTO public.payments (
        order_id,
        provider,
        provider_order_id,
        amount,
        currency,
        status,
        created_at
    ) VALUES (
        p_order_id,
        'razorpay',
        p_provider_order_id,
        p_amount,
        COALESCE(p_currency, 'INR'),
        'pending',
        NOW()
    )
    RETURNING id INTO v_payment_id;

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', v_payment_id,
        'order_id', p_order_id,
        'provider_order_id', p_provider_order_id,
        'amount', p_amount
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_payment_attempt(TEXT, TEXT, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_payment_attempt(TEXT, TEXT, NUMERIC, TEXT) TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 4. FINALIZE PAYMENT SUCCESS RPC (Idempotent Payment Capture & Order Confirmation)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.finalize_payment_success(
    p_order_id TEXT,
    p_provider_payment_id TEXT,
    p_provider_order_id TEXT,
    p_method TEXT DEFAULT 'online',
    p_signature TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_order RECORD;
    v_payment RECORD;
BEGIN
    SELECT id, order_number, order_status, payment_status, grand_total
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- Idempotency check: If already paid, return success cleanly without re-executing
    IF v_order.payment_status IN ('paid', 'completed') THEN
        RETURN jsonb_build_object(
            'success', true,
            'is_duplicate', true,
            'message', 'Order was already confirmed and marked paid.',
            'order_id', p_order_id,
            'order_number', v_order.order_number,
            'payment_status', 'paid'
        );
    END IF;

    -- Update or insert payment row
    UPDATE public.payments
    SET status = 'paid',
        provider_payment_id = p_provider_payment_id,
        provider_signature = COALESCE(p_signature, provider_signature),
        payment_method = COALESCE(p_method, payment_method),
        metadata = COALESCE(metadata, '{}'::jsonb) || COALESCE(p_metadata, '{}'::jsonb),
        captured_at = NOW(),
        updated_at = NOW()
    WHERE order_id = p_order_id
      AND (provider_order_id = p_provider_order_id OR provider_order_id IS NULL);

    IF NOT FOUND THEN
        INSERT INTO public.payments (
            order_id,
            provider,
            provider_order_id,
            provider_payment_id,
            provider_signature,
            amount,
            currency,
            status,
            payment_method,
            metadata,
            captured_at,
            created_at,
            updated_at
        ) VALUES (
            p_order_id,
            'razorpay',
            p_provider_order_id,
            p_provider_payment_id,
            p_signature,
            v_order.grand_total,
            'INR',
            'paid',
            p_method,
            p_metadata,
            NOW(),
            NOW(),
            NOW()
        );
    END IF;

    -- Transition order status to confirmed and payment to paid
    UPDATE public.orders
    SET payment_status = 'paid',
        order_status = CASE WHEN order_status = 'placed' THEN 'confirmed' ELSE order_status END
    WHERE id = p_order_id;

    -- Write Audit Log
    PERFORM public.log_audit_event(
        'PAYMENT_CAPTURED',
        'orders',
        p_order_id,
        jsonb_build_object(
            'order_number', v_order.order_number,
            'provider_payment_id', p_provider_payment_id,
            'provider_order_id', p_provider_order_id,
            'amount', v_order.grand_total,
            'method', p_method
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'is_duplicate', false,
        'order_id', p_order_id,
        'order_number', v_order.order_number,
        'payment_status', 'paid',
        'order_status', 'confirmed'
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.finalize_payment_success(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_payment_success(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 5. RECORD PAYMENT FAILURE RPC
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_payment_failure(
    p_order_id TEXT,
    p_provider_order_id TEXT,
    p_failure_code TEXT DEFAULT 'PAYMENT_FAILED',
    p_failure_desc TEXT DEFAULT 'Payment was cancelled or rejected by customer/bank'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_order RECORD;
BEGIN
    SELECT id, order_number, order_status, payment_status
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- If already paid, do not mark failed
    IF v_order.payment_status IN ('paid', 'completed') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot mark paid order as failed');
    END IF;

    -- Update payment row
    UPDATE public.payments
    SET status = 'failed',
        failure_code = p_failure_code,
        failure_description = p_failure_desc,
        failed_at = NOW(),
        updated_at = NOW()
    WHERE order_id = p_order_id
      AND (provider_order_id = p_provider_order_id OR provider_order_id IS NULL);

    -- Update order payment status
    UPDATE public.orders
    SET payment_status = 'failed'
    WHERE id = p_order_id;

    -- Write Audit Log
    PERFORM public.log_audit_event(
        'PAYMENT_FAILED',
        'orders',
        p_order_id,
        jsonb_build_object(
            'order_number', v_order.order_number,
            'failure_code', p_failure_code,
            'failure_description', p_failure_desc
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'payment_status', 'failed'
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_payment_failure(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_payment_failure(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 6. CLEANUP EXPIRED UNPAID ONLINE ORDERS (Inventory Auto-Release)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_expired_unpaid_orders(
    p_timeout_minutes INT DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_order RECORD;
    v_cancelled_count INT := 0;
BEGIN
    FOR v_order IN
        SELECT id, order_number
        FROM public.orders
        WHERE payment_status IN ('pending', 'failed')
          AND payment_method NOT ILIKE '%cod%'
          AND payment_method NOT ILIKE '%cash%'
          AND order_status = 'placed'
          AND created_at < NOW() - (p_timeout_minutes || ' minutes')::INTERVAL
    LOOP
        PERFORM public.cancel_order_secure(v_order.id, 'Auto-cancelled due to payment timeout (' || p_timeout_minutes || 'm)');
        v_cancelled_count := v_cancelled_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'cancelled_count', v_cancelled_count
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_expired_unpaid_orders(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_unpaid_orders(INT) TO authenticated, service_role;

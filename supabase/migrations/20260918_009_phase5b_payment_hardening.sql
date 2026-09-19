-- ==============================================================================
-- MIGRATION 009: AISHU HOME FOODS — PHASE 5B PAYMENT HARDENING & RECONCILIATION
-- ==============================================================================
-- This migration hardens the payment subsystem:
-- 1. Adds robust state transitions for Late Payments (prevents selling restocked inventory).
-- 2. Enforces partial vs full refund tracking on public.payments.
-- 3. Adds reconciliation RPC for resolving pending/missed payment states.
-- 4. Optimizes indexes for abandoned order cleanup and payment lookups.
-- 5. Hardens RLS and prevents sensitive payload exposure.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. HARDEN PAYMENTS TABLE CONSTRAINTS & COLUMNS
-- ------------------------------------------------------------------------------
ALTER TABLE public.payments 
    ADD COLUMN IF NOT EXISTS is_signature_verified BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS reconciliation_status TEXT DEFAULT 'synced' CHECK (reconciliation_status IN ('synced', 'discrepancy_detected', 'resolved_manually', 'late_payment_flagged')),
    ADD COLUMN IF NOT EXISTS last_reconciled_at TIMESTAMPTZ;

-- Ensure constraint for status includes late payment flags
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_status_check 
    CHECK (status IN ('pending', 'authorized', 'captured', 'paid', 'failed', 'refunded', 'partially_refunded', 'paid_late_flagged'));

-- Fast lookup indexes for cleanup and lookups
CREATE INDEX IF NOT EXISTS idx_orders_cleanup_scan 
    ON public.orders (payment_status, order_status, created_at)
    WHERE payment_status IN ('pending', 'failed') AND order_status = 'placed';

CREATE INDEX IF NOT EXISTS idx_payments_lookup_pair
    ON public.payments (order_id, provider_order_id);

-- ------------------------------------------------------------------------------
-- 2. HARDENED FINALIZE PAYMENT SUCCESS (With Race Condition & Late Payment Guards)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.finalize_payment_success(
    p_order_id TEXT,
    p_provider_payment_id TEXT,
    p_provider_order_id TEXT,
    p_method TEXT DEFAULT 'online',
    p_signature_verified BOOLEAN DEFAULT true,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_order RECORD;
    v_sanitized_meta JSONB;
BEGIN
    -- 1. Row Lock on orders
    SELECT id, order_number, order_status, payment_status, grand_total, customer_id
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- Sanitize metadata to avoid PII retention
    v_sanitized_meta := jsonb_build_object(
        'payment_method', p_method,
        'captured_at', NOW(),
        'source', COALESCE(p_metadata->>'source', 'gateway_callback')
    );

    -- 2. Idempotency Guard: If already confirmed and paid, return clean duplicate acknowledgment
    IF v_order.payment_status IN ('paid', 'completed') AND v_order.order_status IN ('confirmed', 'processing', 'shipped', 'delivered') THEN
        RETURN jsonb_build_object(
            'success', true,
            'is_duplicate', true,
            'message', 'Order already marked paid and confirmed.',
            'order_id', p_order_id,
            'order_number', v_order.order_number,
            'payment_status', v_order.payment_status,
            'order_status', v_order.order_status
        );
    END IF;

    -- 3. LATE PAYMENT GUARD:
    -- If the order was already cancelled (e.g., timed out by cleanup job and inventory was restocked),
    -- we MUST NOT silently resurrect the order without admin review, because inventory might be sold!
    IF v_order.order_status = 'cancelled' THEN
        -- Mark payment as captured with 'paid_late_flagged'
        UPDATE public.payments
        SET status = 'paid_late_flagged',
            provider_payment_id = p_provider_payment_id,
            is_signature_verified = p_signature_verified,
            payment_method = COALESCE(p_method, payment_method),
            metadata = v_sanitized_meta,
            reconciliation_status = 'late_payment_flagged',
            captured_at = NOW(),
            updated_at = NOW()
        WHERE order_id = p_order_id
          AND (provider_order_id = p_provider_order_id OR provider_order_id IS NULL);

        -- Update order to indicate payment arrived after cancellation/expiry
        UPDATE public.orders
        SET payment_status = 'paid_late_requires_review',
            admin_notes = COALESCE(admin_notes, '') || ' [WARNING: Payment of ₹' || v_order.grand_total || ' received AFTER order was cancelled/expired. Requires inventory recheck or refund.]'
        WHERE id = p_order_id;

        -- High-priority audit event
        PERFORM public.log_audit_event(
            'LATE_PAYMENT_RECEIVED',
            'orders',
            p_order_id,
            jsonb_build_object(
                'order_number', v_order.order_number,
                'provider_payment_id', p_provider_payment_id,
                'provider_order_id', p_provider_order_id,
                'amount', v_order.grand_total,
                'warning', 'Payment received after order timeout/cancellation'
            )
        );

        RETURN jsonb_build_object(
            'success', true,
            'is_late_payment', true,
            'message', 'Payment captured but order was already cancelled. Marked for store administrator review.',
            'order_id', p_order_id,
            'order_number', v_order.order_number,
            'payment_status', 'paid_late_requires_review',
            'order_status', 'cancelled'
        );
    END IF;

    -- 4. Normal Happy Path: Transition Order from 'placed' to 'confirmed' & 'paid'
    UPDATE public.payments
    SET status = 'paid',
        provider_payment_id = p_provider_payment_id,
        is_signature_verified = p_signature_verified,
        payment_method = COALESCE(p_method, payment_method),
        metadata = v_sanitized_meta,
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
            is_signature_verified,
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
            p_signature_verified,
            v_order.grand_total,
            'INR',
            'paid',
            p_method,
            v_sanitized_meta,
            NOW(),
            NOW(),
            NOW()
        );
    END IF;

    UPDATE public.orders
    SET payment_status = 'paid',
        order_status = CASE WHEN order_status = 'placed' THEN 'confirmed' ELSE order_status END
    WHERE id = p_order_id;

    -- Audit Log
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

REVOKE EXECUTE ON FUNCTION public.finalize_payment_success(TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_payment_success(TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB) TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 3. HARDENED RECORD PAYMENT FAILURE (Prevents overwriting paid orders)
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

    -- If already paid, DO NOT overwrite with failed!
    IF v_order.payment_status IN ('paid', 'completed') THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Order is already paid; failed attempt ignored.',
            'order_id', p_order_id,
            'payment_status', v_order.payment_status
        );
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

    -- Only update order status if still pending
    IF v_order.payment_status = 'pending' THEN
        UPDATE public.orders
        SET payment_status = 'failed'
        WHERE id = p_order_id;
    END IF;

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
-- 4. RECORD REFUND RPC (Full vs Partial Refund Handler)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_refund_success(
    p_order_id TEXT,
    p_refund_id TEXT,
    p_refund_amount NUMERIC,
    p_reason TEXT DEFAULT 'Admin initiated refund'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_payment RECORD;
    v_order RECORD;
    v_new_cumulative_refund NUMERIC;
    v_new_payment_status TEXT;
BEGIN
    -- Check permissions: Only staff can execute refund recordings
    IF NOT public.is_staff() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Staff privilege required');
    END IF;

    SELECT * INTO v_payment
    FROM public.payments
    WHERE order_id = p_order_id AND status IN ('paid', 'partially_refunded')
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'No paid payment found for this order');
    END IF;

    SELECT id, grand_total INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    v_new_cumulative_refund := COALESCE(v_payment.refund_amount, 0) + p_refund_amount;

    IF v_new_cumulative_refund >= v_payment.amount THEN
        v_new_payment_status := 'refunded';
    ELSE
        v_new_payment_status := 'partially_refunded';
    END IF;

    UPDATE public.payments
    SET status = v_new_payment_status,
        refund_amount = v_new_cumulative_refund,
        refund_id = p_refund_id,
        refunded_at = NOW(),
        updated_at = NOW()
    WHERE id = v_payment.id;

    UPDATE public.orders
    SET payment_status = v_new_payment_status,
        order_status = CASE WHEN v_new_payment_status = 'refunded' THEN 'cancelled' ELSE order_status END
    WHERE id = p_order_id;

    PERFORM public.log_audit_event(
        'PAYMENT_REFUNDED',
        'payments',
        v_payment.id::TEXT,
        jsonb_build_object(
            'order_id', p_order_id,
            'refund_id', p_refund_id,
            'refund_amount', p_refund_amount,
            'cumulative_refund', v_new_cumulative_refund,
            'status', v_new_payment_status,
            'reason', p_reason
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'refund_id', p_refund_id,
        'refund_amount', p_refund_amount,
        'cumulative_refund', v_new_cumulative_refund,
        'payment_status', v_new_payment_status
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_refund_success(TEXT, TEXT, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_refund_success(TEXT, TEXT, NUMERIC, TEXT) TO authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 5. RECONCILE PAYMENT STATUS RPC
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reconcile_order_payment(
    p_order_id TEXT,
    p_gateway_status TEXT,
    p_gateway_payment_id TEXT DEFAULT NULL,
    p_gateway_amount_paise BIGINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_order RECORD;
    v_expected_paise BIGINT;
BEGIN
    IF NOT public.is_staff() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Staff privilege required');
    END IF;

    SELECT id, order_number, order_status, payment_status, grand_total
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    v_expected_paise := ROUND(v_order.grand_total * 100);

    IF p_gateway_status = 'captured' OR p_gateway_status = 'paid' THEN
        -- Check amount parity
        IF p_gateway_amount_paise IS NOT NULL AND p_gateway_amount_paise <> v_expected_paise THEN
            UPDATE public.payments
            SET reconciliation_status = 'discrepancy_detected',
                last_reconciled_at = NOW()
            WHERE order_id = p_order_id;

            RETURN jsonb_build_object(
                'success', false,
                'error', 'Amount mismatch during reconciliation: expected ' || v_expected_paise || ' paise, got ' || p_gateway_amount_paise
            );
        END IF;

        -- Finalize payment
        RETURN public.finalize_payment_success(
            p_order_id,
            p_gateway_payment_id,
            NULL,
            'online_reconciled',
            true,
            jsonb_build_object('source', 'reconciliation_sync')
        );
    ELSIF p_gateway_status = 'failed' THEN
        RETURN public.record_payment_failure(
            p_order_id,
            NULL,
            'RECONCILED_FAILED',
            'Reconciliation confirmed gateway transaction failed'
        );
    END IF;

    RETURN jsonb_build_object('success', true, 'status', 'no_change_needed');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reconcile_order_payment(TEXT, TEXT, TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reconcile_order_payment(TEXT, TEXT, TEXT, BIGINT) TO authenticated, service_role;

-- ============================================================================
-- Migration: 20261023_013_payment_hardening_final.sql
-- Description: Production-grade Payment Hardening for Aishu Foods
--   1. Preserve Financial Audit Records: Replace ON DELETE CASCADE with ON DELETE RESTRICT
--      on public.payments and public.payment_refunds via staged NOT VALID + VALIDATE.
--   2. Refund Operations Ledger: Create public.payment_refund_operations with stable
--      idempotency keys and explicit state machine ('initiated', 'processing', 'completed',
--      'reconciled', 'failed', 'uncertain').
--   3. Webhook Lease Tokens: Add claim_token UUID and claim_expires_at to
--      public.payment_webhook_events with stale-worker protection.
--   4. Hardened Payment RPCs (service_role only, pinned search_path):
--      - initiate_refund_operation
--      - force_fail_refund_operation
--      - record_refund_success (exact numeric bounds, no slack, locks operation + payment)
--      - claim_webhook_event (tokenized leasing)
--      - complete_webhook_event (lease verification)
-- Safe, forward-only, rerunnable where appropriate, zero data loss.
-- ============================================================================

-- Ensure required extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

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

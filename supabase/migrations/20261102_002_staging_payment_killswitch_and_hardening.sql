-- ==============================================================================
-- MIGRATION: 20261102_002_staging_payment_killswitch_and_hardening.sql
-- TARGET ENVIRONMENT: Staging (aura-foods-staging, mjnktiyufvzkibrsdxug)
-- ==============================================================================
-- PURPOSE:
-- 1. Installs the authoritative Online Payment Kill-Switch in public.store_settings.
--    Guarantees online payments default to DENIED (false) until explicitly turned on
--    by the store administrator in the Admin Panel.
-- 2. Expands the orders.payment_status check constraint to support the full payment
--    lifecycle, including 'refunded' and 'partially_refunded'.
-- 3. Hardens RLS policies on store_settings so storefront visitors can read policies
--    while only verified administrators can update the kill-switch state.
--
-- SECURITY IMPACT:
-- - Server-Side Enforcement: Even if a client bypasses the frontend UI toggle,
--   the create-razorpay-order Edge Function reads store_settings.payment_enabled
--   directly from PostgreSQL using the service_role and rejects requests with HTTP 403.
-- - Cash on Delivery (COD) Isolation: During DENIED mode, only COD orders can be
--   placed, protecting the store from unwanted gateway charges or unverified transactions.
-- - Constraint Integrity: Prevents SQL errors when recording partial or full refunds
--   in the orders table.
--
-- DATA PRESERVATION:
-- - Preserves existing store_settings, orders, products, and admin profiles without
--   deleting or resetting data. Uses ON CONFLICT upsert for 'default' settings.
--
-- ROLLBACK INSTRUCTIONS (if ever needed):
-- -- To restore previous payment_status check constraint:
-- -- ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
-- -- ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('pending', 'completed', 'failed'));
-- -- To remove payment_enabled column:
-- -- ALTER TABLE public.store_settings DROP COLUMN IF EXISTS payment_enabled;
-- ==============================================================================

BEGIN;

-- 1. Ensure payment_enabled column exists on store_settings
ALTER TABLE public.store_settings
    ADD COLUMN IF NOT EXISTS payment_enabled BOOLEAN NOT NULL DEFAULT false;

-- 2. Upsert default store_settings with payment_enabled = false (DENIED mode)
INSERT INTO public.store_settings (id, payment_enabled, site_logo_url, updated_at)
VALUES ('default', false, '/aishu-logo.jpg', NOW())
ON CONFLICT (id) DO UPDATE
SET payment_enabled = COALESCE(public.store_settings.payment_enabled, false),
    updated_at = NOW();

-- 3. Safely expand orders.payment_status constraint
DO $$
BEGIN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
    ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check
        CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded', 'partially_refunded'));
END $$;

-- 4. Ensure RLS is active on store_settings
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- 5. Public read policy for store settings
DROP POLICY IF EXISTS "Public can view store settings" ON public.store_settings;
CREATE POLICY "Public can view store settings"
    ON public.store_settings FOR SELECT
    TO anon, authenticated
    USING (true);

-- 6. Admin management policy for store settings
DROP POLICY IF EXISTS "Admins can manage store settings" ON public.store_settings;
CREATE POLICY "Admins can manage store settings"
    ON public.store_settings FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles ar
            WHERE ar.user_id = auth.uid()
              AND ar.status = 'active'
              AND (ar.role IN ('admin', 'super_admin') OR 'settings.write' = ANY(COALESCE(ar.permissions, ARRAY[]::TEXT[])))
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_roles ar
            WHERE ar.user_id = auth.uid()
              AND ar.status = 'active'
              AND (ar.role IN ('admin', 'super_admin') OR 'settings.write' = ANY(COALESCE(ar.permissions, ARRAY[]::TEXT[])))
        )
    );

-- 7. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';

COMMIT;

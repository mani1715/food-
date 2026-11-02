-- LOCAL TEST FIXTURE ONLY. Not a production export or deployable migration.
-- Run only in a new, empty disposable database via run_local_postgres.mjs.
CREATE SCHEMA auth;
CREATE SCHEMA extensions;
CREATE TABLE auth.users(id uuid PRIMARY KEY, email text);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.role', true), '')
$$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated, service_role;
-- Repository base tables approximate unreported details. No payment migrations.
\ir ../../../supabase/migrations/20260918_001_schema_constraints_and_tables.sql
\ir ../../../supabase/migrations/20260918_002_functions_and_rpcs.sql
-- Match the specific external catalog findings instead of adding products.price.
ALTER TABLE public.order_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.order_items ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.order_items ALTER COLUMN id SET DEFAULT ('oitem-' || gen_random_uuid()::text);
ALTER TABLE public.orders ALTER COLUMN payment_status SET DEFAULT 'completed';
ALTER TABLE public.orders DROP CONSTRAINT orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending','completed','failed'));
ALTER TABLE public.coupons RENAME COLUMN is_active TO is_enabled;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
CREATE POLICY "Customers can create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (customer_id=auth.uid());
CREATE POLICY "Customers can create order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL TO authenticated USING (public.is_admin_or_super()) WITH CHECK (public.is_admin_or_super());
CREATE POLICY "Admins can manage order items" ON public.order_items FOR ALL TO authenticated USING (public.is_admin_or_super()) WITH CHECK (public.is_admin_or_super());
-- Synthetic catalog with reported cardinalities; NOT production customer/product data.
INSERT INTO public.products(id,name,slug,inventory_count)
SELECT 'fixture-'||n, 'Synthetic Product '||n, 'fixture-'||n, 100 FROM generate_series(1,21) n;
INSERT INTO public.product_weight_options(product_id,weight_label,price)
SELECT 'fixture-'||n, w||'g', 499 FROM generate_series(1,21) n CROSS JOIN (VALUES (250),(500)) t(w);
INSERT INTO public.product_weight_options(product_id,weight_label,price)
SELECT 'fixture-'||n, '1000g', 999 FROM generate_series(1,7) n;

-- READ-ONLY PREFLIGHT ONLY. Run against the explicitly approved staging project.
-- This script does not create/alter/drop objects and does not update migration history.

-- 1. Target identity, required base relations, and payment objects.
SELECT current_database() AS database_name, current_user AS sql_role,
       current_setting('server_version') AS postgres_version;
SELECT n.nspname AS schema_name, c.relname AS relation_name, c.relkind
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('public','auth')
  AND c.relname IN ('orders','order_items','products','product_weight_options','coupons','stock_history_logs','admin_roles','payments','payment_refunds','payment_webhook_events','payment_refund_operations','users')
ORDER BY 1,2;

-- 2. Columns, nullability, defaults, and data types for all checkout dependencies.
SELECT table_name, ordinal_position, column_name, data_type, udt_name,
       is_nullable, column_default
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name IN ('orders','order_items','products','product_weight_options','coupons','stock_history_logs','admin_roles','payments','payment_refunds','payment_webhook_events','payment_refund_operations')
ORDER BY table_name, ordinal_position;

-- 3. Constraints and FK delete behavior, including validation state.
SELECT conrelid::regclass AS table_name, conname, contype,
       pg_get_constraintdef(oid, true) AS definition, convalidated
FROM pg_constraint
WHERE connamespace='public'::regnamespace
  AND conrelid::regclass::text IN ('orders','order_items','products','product_weight_options','coupons','stock_history_logs','admin_roles','payments','payment_refunds','payment_webhook_events','payment_refund_operations')
ORDER BY 1,2;

-- 4. Indexes and sequence state (confirm duplicate guards and non-regressive order numbering).
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname='public'
  AND tablename IN ('orders','order_items','payments','payment_refunds','payment_webhook_events','payment_refund_operations')
ORDER BY tablename,indexname;
SELECT schemaname, sequencename, start_value, min_value, max_value, increment_by, cycle, cache_size, last_value
FROM pg_sequences WHERE schemaname='public' AND sequencename IN ('order_number_seq','tracking_code_seq');

-- 5. Current function signatures, owners, security-definer flag, search_path, and grants.
SELECT p.oid::regprocedure AS signature, pg_get_userbyid(p.proowner) AS owner,
       p.prosecdef AS security_definer, p.proconfig AS function_settings,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
  AND p.proname IN ('place_order_secure','record_payment_attempt','finalize_payment_success',
    'record_payment_failure','record_refund_success','cancel_order_secure',
    'cleanup_expired_unpaid_orders','claim_webhook_event','complete_webhook_event',
    'initiate_refund_operation','force_fail_refund_operation')
ORDER BY p.proname, p.oid::regprocedure::text;

SELECT routine_schema, routine_name, specific_name, grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema='public'
  AND routine_name IN ('place_order_secure','record_payment_attempt','finalize_payment_success',
    'record_payment_failure','record_refund_success','cancel_order_secure',
    'cleanup_expired_unpaid_orders','claim_webhook_event','complete_webhook_event',
    'initiate_refund_operation','force_fail_refund_operation')
ORDER BY routine_name, specific_name, grantee, privilege_type;

-- 6. RLS and policies. Compare each policy against the expected policy list in CHANGE_MAP.md.
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('orders','order_items','payments','payment_refunds','payment_webhook_events','payment_refund_operations');
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname='public'
  AND tablename IN ('orders','order_items','payments','payment_refunds','payment_webhook_events','payment_refund_operations')
ORDER BY tablename,policyname;

-- 7. Grants on payment tables and order-number sequences.
SELECT table_schema, table_name, grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema='public'
  AND table_name IN ('payments','payment_refunds','payment_webhook_events','payment_refund_operations')
ORDER BY table_name,grantee,privilege_type;
SELECT object_schema, object_name, grantee, privilege_type
FROM information_schema.usage_privileges
WHERE object_type='SEQUENCE' AND object_schema='public'
  AND object_name IN ('order_number_seq','tracking_code_seq')
ORDER BY object_name,grantee,privilege_type;

-- 8. Duplicate/orphan preflight for existing payment rows. These SELECTs must return zero rows.
-- Run only after confirming the payments table exists; absent table means no previous payment schema.
-- SELECT provider_order_id, count(*) FROM public.payments WHERE provider_order_id IS NOT NULL AND provider_order_id <> '' GROUP BY 1 HAVING count(*) > 1;
-- SELECT provider_payment_id, count(*) FROM public.payments WHERE provider_payment_id IS NOT NULL AND provider_payment_id <> '' GROUP BY 1 HAVING count(*) > 1;
-- SELECT p.order_id FROM public.payments p LEFT JOIN public.orders o ON o.id=p.order_id WHERE o.id IS NULL;

-- 9. Migration history must be established separately; do not insert into migration history manually.
SELECT to_regclass('supabase_migrations.schema_migrations') AS cli_migration_history_table,
       to_regnamespace('supabase_migrations') AS migration_schema;

BEGIN;
INSERT INTO auth.users(id,email) VALUES
 ('cccccccc-1111-4111-8111-111111111111','staff-one@example.invalid'),
 ('cccccccc-2222-4222-8222-222222222222','staff-two@example.invalid');
CREATE FUNCTION pg_temp.check_true(ok boolean) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF ok IS NOT TRUE THEN RAISE EXCEPTION 'Staff authorization assertion failed'; END IF; END $$;
SELECT set_config('request.jwt.claim.role','service_role',true);
SELECT pg_temp.check_true((public.manage_staff_account('cccccccc-1111-4111-8111-111111111111','create','super_admin')->>'success')::boolean);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','cccccccc-2222-4222-8222-222222222222',true);
DO $$ BEGIN
 BEGIN PERFORM public.manage_staff_account(auth.uid(),'create','super_admin'); RAISE EXCEPTION 'Customer self enrollment succeeded'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','cccccccc-1111-4111-8111-111111111111',true);
DO $$ BEGIN
 BEGIN PERFORM public.manage_staff_account(auth.uid(),'revoke'); RAISE EXCEPTION 'Last super admin removal succeeded';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Cannot remove the last active super admin' THEN RAISE; END IF; END;
END $$;
SELECT pg_temp.check_true((public.manage_staff_account('cccccccc-2222-4222-8222-222222222222','create','sub_admin',ARRAY['products'],ARRAY['products.write'])->>'success')::boolean);
SELECT set_config('request.jwt.claim.sub','cccccccc-2222-4222-8222-222222222222',true);
SELECT pg_temp.check_true(NOT public.is_admin() AND public.has_admin_permission('products.write'));
DO $$ BEGIN
 BEGIN PERFORM public.manage_staff_account(auth.uid(),'update_role','super_admin'); RAISE EXCEPTION 'Sub-admin escalation succeeded'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','cccccccc-1111-4111-8111-111111111111',true);
SELECT public.manage_staff_account('cccccccc-2222-4222-8222-222222222222','suspend');
SELECT set_config('request.jwt.claim.sub','cccccccc-2222-4222-8222-222222222222',true);
SELECT pg_temp.check_true(NOT public.has_admin_permission('products.write'));
RESET ROLE;
SELECT pg_temp.check_true((SELECT count(*)=3 FROM public.staff_authorization_audit));
ROLLBACK;
SELECT 'PASS: trusted provisioning, customer/sub-admin rejection, last-super-admin protection, suspension and audit records; rows rolled back' AS result;

BEGIN;
CREATE TABLE public.staff_authorization_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 actor_user_id uuid,
 target_user_id uuid NOT NULL,
 action text NOT NULL,
 previous_authorization jsonb,
 resulting_authorization jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_authorization_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.staff_authorization_audit FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.staff_authorization_audit TO service_role;
CREATE POLICY service_audit ON public.staff_authorization_audit FOR ALL TO service_role USING(true) WITH CHECK(true);

CREATE FUNCTION public.manage_staff_account(
 p_target_user_id uuid, p_action text, p_role text DEFAULT 'sub_admin',
 p_allowed_tabs text[] DEFAULT '{}'::text[], p_permissions text[] DEFAULT '{}'::text[]
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE old_row public.admin_roles; new_row public.admin_roles; caller uuid:=auth.uid();
BEGIN
 -- Serialize authority checks and last-super-admin protection across all RPC calls.
 LOCK TABLE public.admin_roles IN SHARE ROW EXCLUSIVE MODE;
 IF auth.role() IS DISTINCT FROM 'service_role' AND NOT EXISTS(
   SELECT FROM public.admin_roles WHERE user_id=caller AND role='super_admin' AND status='active'
 ) THEN RAISE EXCEPTION 'Access denied: active super admin required' USING ERRCODE='42501'; END IF;
 IF p_action IS NULL OR p_action NOT IN ('create','update_role','suspend','activate','revoke') THEN RAISE EXCEPTION 'Invalid staff action'; END IF;
 IF p_role IS NULL OR p_role NOT IN ('admin','super_admin','sub_admin') THEN RAISE EXCEPTION 'Invalid staff role'; END IF;
 IF p_allowed_tabs IS NULL OR p_permissions IS NULL OR array_position(p_permissions,NULL) IS NOT NULL
 OR array_position(p_allowed_tabs,NULL) IS NOT NULL OR '*'=ANY(p_permissions) THEN RAISE EXCEPTION 'Explicit permission names required'; END IF;
 IF NOT EXISTS(SELECT FROM auth.users WHERE id=p_target_user_id) THEN RAISE EXCEPTION 'Target Auth user must exist'; END IF;
 SELECT * INTO old_row FROM public.admin_roles WHERE user_id=p_target_user_id;
 IF p_action='create' THEN
   IF old_row.id IS NOT NULL THEN RAISE EXCEPTION 'Staff authorization already exists'; END IF;
   INSERT INTO public.admin_roles(user_id,role,status,allowed_tabs,permissions,created_by)
   VALUES(p_target_user_id,p_role,'active',p_allowed_tabs,p_permissions,caller) RETURNING * INTO new_row;
 ELSE
   IF old_row.id IS NULL THEN RAISE EXCEPTION 'Staff authorization not found'; END IF;
   IF old_row.role='super_admin' AND old_row.status='active'
   AND (p_action IN ('suspend','revoke') OR (p_action='update_role' AND p_role<>'super_admin'))
   AND (SELECT count(*) FROM public.admin_roles WHERE role='super_admin' AND status='active')<=1
   THEN RAISE EXCEPTION 'Cannot remove the last active super admin'; END IF;
   UPDATE public.admin_roles SET
    role=CASE WHEN p_action='update_role' THEN p_role ELSE role END,
    allowed_tabs=CASE WHEN p_action='update_role' THEN p_allowed_tabs ELSE allowed_tabs END,
    permissions=CASE WHEN p_action='update_role' THEN p_permissions ELSE permissions END,
    status=CASE p_action WHEN 'suspend' THEN 'suspended' WHEN 'revoke' THEN 'revoked' WHEN 'activate' THEN 'active' ELSE status END,
    updated_at=now()
   WHERE user_id=p_target_user_id RETURNING * INTO new_row;
 END IF;
 INSERT INTO public.staff_authorization_audit(actor_user_id,target_user_id,action,previous_authorization,resulting_authorization)
 VALUES(caller,p_target_user_id,p_action,CASE WHEN old_row.id IS NULL THEN NULL ELSE to_jsonb(old_row) END,to_jsonb(new_row));
 RETURN jsonb_build_object('success',true,'user_id',new_row.user_id,'role',new_row.role,'status',new_row.status);
END $$;
REVOKE ALL ON FUNCTION public.manage_staff_account(uuid,text,text,text[],text[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.manage_staff_account(uuid,text,text,text[],text[]) TO authenticated,service_role;
COMMIT;

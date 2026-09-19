-- ==============================================================================
-- MIGRATION 005: AISHU HOME FOODS — PRODUCTION RBAC & AUTH HARDENING
-- ==============================================================================
-- This migration normalizes the admin_roles model, adds granular permission
-- verification helpers, secures staff management via RPC, and implements
-- super admin bootstrap safety and audit logging.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ADMIN ROLES ENHANCEMENTS (Granular Permissions & Allowed Tabs)
-- ------------------------------------------------------------------------------

-- Ensure permissions column exists on admin_roles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'admin_roles' 
          AND column_name = 'permissions'
    ) THEN
        ALTER TABLE public.admin_roles 
        ADD COLUMN permissions TEXT[] NOT NULL DEFAULT ARRAY[
            'products.read',
            'orders.read',
            'inventory.read'
        ];
    END IF;
END $$;

-- Ensure allowed_tabs exists and has valid defaults
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'admin_roles' 
          AND column_name = 'allowed_tabs'
    ) THEN
        ALTER TABLE public.admin_roles 
        ADD COLUMN allowed_tabs TEXT[] NOT NULL DEFAULT ARRAY[
            'analytics',
            'products',
            'orders',
            'inventory'
        ];
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. GRANULAR PERMISSION VERIFIER FUNCTION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_admin_permission(p_permission TEXT)
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
          AND (
              role IN ('super_admin', 'admin')
              OR p_permission = ANY(permissions)
              OR split_part(p_permission, '.', 1) = ANY(allowed_tabs)
          )
    );
$$;

REVOKE EXECUTE ON FUNCTION public.has_admin_permission(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_admin_permission(TEXT) TO authenticated, anon;


-- ------------------------------------------------------------------------------
-- 3. CURRENT ADMIN IDENTITY RPC (Trusted Server Resolution)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_admin_identity()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_role_row RECORD;
    v_email TEXT;
    v_full_name TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    -- Fetch user email from auth.users
    SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

    -- Fetch profile full_name if available
    SELECT full_name INTO v_full_name FROM public.profiles WHERE id = auth.uid();

    -- Fetch admin role record
    SELECT role, status, allowed_tabs, permissions, created_at
    INTO v_role_row
    FROM public.admin_roles
    WHERE user_id = auth.uid();

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    IF v_role_row.status <> 'active' THEN
        RETURN jsonb_build_object(
            'user_id', auth.uid(),
            'email', v_email,
            'role', v_role_row.role,
            'status', v_role_row.status,
            'is_active', false,
            'error', 'Account is suspended or revoked'
        );
    END IF;

    RETURN jsonb_build_object(
        'user_id', auth.uid(),
        'email', v_email,
        'name', COALESCE(v_full_name, split_part(v_email, '@', 1)),
        'role', v_role_row.role,
        'status', v_role_row.status,
        'is_active', true,
        'allowed_tabs', v_role_row.allowed_tabs,
        'permissions', v_role_row.permissions,
        'created_at', v_role_row.created_at
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_current_admin_identity() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_admin_identity() TO authenticated;


-- ------------------------------------------------------------------------------
-- 4. SECURE STAFF MANAGEMENT RPC (Super Admin Controlled)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.manage_staff_account(
    p_target_user_id UUID,
    p_action TEXT, -- 'create', 'update_role', 'suspend', 'activate', 'revoke'
    p_role TEXT DEFAULT 'sub_admin',
    p_allowed_tabs TEXT[] DEFAULT ARRAY['products', 'orders', 'inventory'],
    p_permissions TEXT[] DEFAULT ARRAY['products.read', 'orders.read', 'inventory.read']
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_caller_is_super BOOLEAN;
    v_target_existing RECORD;
    v_active_super_count INT;
    v_new_status TEXT;
BEGIN
    -- 1. Verify caller has active super_admin privileges
    v_caller_is_super := public.is_super_admin();
    IF NOT v_caller_is_super THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Super Admin privileges required');
    END IF;

    IF p_target_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Target User ID is required');
    END IF;

    -- Validate target user exists in auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_target_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'User does not exist in authentication directory');
    END IF;

    SELECT * INTO v_target_existing FROM public.admin_roles WHERE user_id = p_target_user_id;

    -- 2. Prevent deleting/suspending the last active Super Admin
    IF p_action IN ('suspend', 'revoke') AND v_target_existing.role = 'super_admin' THEN
        SELECT COUNT(*) INTO v_active_super_count
        FROM public.admin_roles
        WHERE role = 'super_admin' AND status = 'active';

        IF v_active_super_count <= 1 THEN
            RETURN jsonb_build_object('success', false, 'error', 'Operation blocked: Cannot suspend or revoke the only active Super Admin');
        END IF;
    END IF;

    -- 3. Execute requested lifecycle action
    IF p_action = 'create' OR (p_action = 'update_role' AND v_target_existing.id IS NULL) THEN
        IF p_role NOT IN ('super_admin', 'admin', 'sub_admin') THEN
            RETURN jsonb_build_object('success', false, 'error', 'Invalid role');
        END IF;

        INSERT INTO public.admin_roles (
            user_id,
            role,
            status,
            allowed_tabs,
            permissions,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            p_target_user_id,
            p_role,
            'active',
            p_allowed_tabs,
            p_permissions,
            auth.uid(),
            NOW(),
            NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
            role = EXCLUDED.role,
            status = 'active',
            allowed_tabs = EXCLUDED.allowed_tabs,
            permissions = EXCLUDED.permissions,
            updated_at = NOW();

        PERFORM public.log_audit_event(
            'STAFF_CREATED',
            'admin_roles',
            p_target_user_id::text,
            jsonb_build_object('role', p_role, 'allowed_tabs', p_allowed_tabs)
        );

        RETURN jsonb_build_object('success', true, 'message', 'Staff account provisioned successfully');

    ELSIF p_action = 'update_role' THEN
        IF p_role NOT IN ('super_admin', 'admin', 'sub_admin') THEN
            RETURN jsonb_build_object('success', false, 'error', 'Invalid role');
        END IF;

        UPDATE public.admin_roles
        SET role = p_role,
            allowed_tabs = p_allowed_tabs,
            permissions = p_permissions,
            updated_at = NOW()
        WHERE user_id = p_target_user_id;

        PERFORM public.log_audit_event(
            'STAFF_ROLE_UPDATED',
            'admin_roles',
            p_target_user_id::text,
            jsonb_build_object('role', p_role, 'allowed_tabs', p_allowed_tabs)
        );

        RETURN jsonb_build_object('success', true, 'message', 'Staff role updated');

    ELSIF p_action = 'suspend' THEN
        UPDATE public.admin_roles
        SET status = 'suspended',
            updated_at = NOW()
        WHERE user_id = p_target_user_id;

        PERFORM public.log_audit_event(
            'STAFF_SUSPENDED',
            'admin_roles',
            p_target_user_id::text,
            jsonb_build_object('previous_status', v_target_existing.status)
        );

        RETURN jsonb_build_object('success', true, 'message', 'Staff account suspended');

    ELSIF p_action = 'activate' THEN
        UPDATE public.admin_roles
        SET status = 'active',
            updated_at = NOW()
        WHERE user_id = p_target_user_id;

        PERFORM public.log_audit_event(
            'STAFF_ACTIVATED',
            'admin_roles',
            p_target_user_id::text,
            '{}'::jsonb
        );

        RETURN jsonb_build_object('success', true, 'message', 'Staff account activated');

    ELSIF p_action = 'revoke' THEN
        UPDATE public.admin_roles
        SET status = 'revoked',
            updated_at = NOW()
        WHERE user_id = p_target_user_id;

        PERFORM public.log_audit_event(
            'STAFF_REVOKED',
            'admin_roles',
            p_target_user_id::text,
            '{}'::jsonb
        );

        RETURN jsonb_build_object('success', true, 'message', 'Staff account revoked');

    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Unrecognized action');
    END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.manage_staff_account(UUID, TEXT, TEXT, TEXT[], TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manage_staff_account(UUID, TEXT, TEXT, TEXT[], TEXT[]) TO authenticated;


-- ------------------------------------------------------------------------------
-- 5. SECURE SUPER ADMIN BOOTSTRAP PROCEDURE
-- ------------------------------------------------------------------------------
-- Allows the project owner to safely promote an existing Supabase Auth user
-- to super_admin by email within the database console.
CREATE OR REPLACE FUNCTION public.bootstrap_super_admin(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE LOWER(email) = LOWER(TRIM(p_email))
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No Supabase Auth user found with that email. Please sign up or create the user in Supabase Auth first.'
        );
    END IF;

    -- Insert or update admin_roles
    INSERT INTO public.admin_roles (
        user_id,
        role,
        status,
        allowed_tabs,
        permissions,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        'super_admin',
        'active',
        ARRAY['analytics', 'notifications', 'products', 'orders', 'banners', 'bestsellers', 'discounts', 'settings', 'newsletter', 'profile'],
        ARRAY['*'],
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'super_admin',
        status = 'active',
        allowed_tabs = ARRAY['analytics', 'notifications', 'products', 'orders', 'banners', 'bestsellers', 'discounts', 'settings', 'newsletter', 'profile'],
        permissions = ARRAY['*'],
        updated_at = NOW();

    -- Also update profile role if profile exists
    UPDATE public.profiles
    SET role = 'super_admin',
        updated_at = NOW()
    WHERE id = v_user_id;

    PERFORM public.log_audit_event(
        'SUPER_ADMIN_BOOTSTRAPPED',
        'admin_roles',
        v_user_id::text,
        jsonb_build_object('email', p_email)
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'User promoted to Super Admin successfully',
        'user_id', v_user_id,
        'email', p_email
    );
END;
$$;

-- Only service_role and postgres superuser can run bootstrap
REVOKE EXECUTE ON FUNCTION public.bootstrap_super_admin(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_super_admin(TEXT) TO service_role;

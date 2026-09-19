import { supabase } from './client';
import { DbProfile, DbAdminProfile, DbAdminRole, DbCustomerAddress } from './types';

export const signUpCustomer = async (
  email: string,
  password: string,
  fullName: string,
  phoneNumber: string
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone_number: phoneNumber,
      },
    },
  });

  if (error) throw error;

  if (data.user) {
    // Upsert profile record
    const { error: profileErr } = await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      phone_number: phoneNumber,
      role: 'customer',
      updated_at: new Date().toISOString(),
    });
    if (profileErr) console.warn('Could not auto-create profile:', profileErr.message);
  }

  return data;
};

export const signInCustomer = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
};

export const getCustomerProfile = async (userId: string): Promise<DbProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.warn('Error fetching customer profile:', error.message);
    return null;
  }
  return data;
};

export const updateCustomerProfile = async (
  userId: string,
  updates: Partial<Omit<DbProfile, 'id' | 'created_at'>>
) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getCustomerAddresses = async (userId: string): Promise<DbCustomerAddress[]> => {
  const { data, error } = await supabase
    .from('customer_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Error fetching customer addresses:', error.message);
    return [];
  }
  return data || [];
};

export const addCustomerAddress = async (
  userId: string,
  address: Omit<DbCustomerAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<DbCustomerAddress> => {
  const { data, error } = await supabase
    .from('customer_addresses')
    .insert([{ ...address, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteCustomerAddress = async (addressId: string, userId: string) => {
  const { error } = await supabase
    .from('customer_addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', userId);

  if (error) throw error;
};

/**
 * Fetches the verified admin role and permissions for an authenticated user
 * directly from PostgreSQL admin_roles.
 */
export const getAdminRoleFromDb = async (userId: string): Promise<DbAdminRole | null> => {
  try {
    const { data, error } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.warn('Could not query admin_roles:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Error checking admin role in DB:', err);
    return null;
  }
};

/**
 * Resolves current verified administrative identity using server RPC.
 */
export const getCurrentAdminIdentityFromDb = async (): Promise<{
  userId: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'sub_admin';
  status: 'active' | 'suspended' | 'revoked';
  isActive: boolean;
  allowedTabs: string[];
  permissions: string[];
} | null> => {
  try {
    const { data, error } = await supabase.rpc('get_current_admin_identity');
    if (error || !data || data.is_active === false) {
      return null;
    }
    return {
      userId: data.user_id,
      email: data.email,
      name: data.name,
      role: data.role,
      status: (data.status as 'active' | 'suspended' | 'revoked') || 'active',
      isActive: data.is_active,
      allowedTabs: data.allowed_tabs || [],
      permissions: data.permissions || [],
    };
  } catch {
    return null;
  }
};

/**
 * Super Admin RPC to create or manage staff roles in PostgreSQL
 */
export const manageStaffAccountInDb = async (
  targetUserId: string,
  action: 'create' | 'update_role' | 'suspend' | 'activate' | 'revoke',
  role: 'super_admin' | 'admin' | 'sub_admin' = 'sub_admin',
  allowedTabs: string[] = ['products', 'orders', 'inventory'],
  permissions: string[] = ['products.read', 'orders.read', 'inventory.read']
) => {
  const { data, error } = await supabase.rpc('manage_staff_account', {
    p_target_user_id: targetUserId,
    p_action: action,
    p_role: role,
    p_allowed_tabs: allowedTabs,
    p_permissions: permissions,
  });

  if (error) throw error;
  return data;
};

export const getAdminProfile = async (userId: string): Promise<DbAdminProfile | null> => {
  const { data, error } = await supabase
    .from('admin_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.warn('Error fetching admin profile:', error.message);
    return null;
  }
  return data;
};

export const sendPasswordResetEmail = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/profile`,
  });
  if (error) throw error;
  return data;
};

export const fetchUserProfile = getCustomerProfile;
export const logoutSupabaseUser = signOutUser;

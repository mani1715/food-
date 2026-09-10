import { supabase } from './client';
import { DbProfile, DbAdminProfile, DbCustomerAddress } from './types';

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

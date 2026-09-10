/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://akublyjmyrcoeemuxugr.supabase.co';
const supabaseAnonKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'your-anon-key-here';

export const isSupabaseConfigured = () => {
  const env = (import.meta as any).env;
  const key = env?.VITE_SUPABASE_ANON_KEY || env?.VITE_SUPABASE_PUBLISHABLE_KEY;
  return (
    Boolean(env?.VITE_SUPABASE_URL) &&
    Boolean(key) &&
    key !== 'your-anon-key-here' &&
    key !== 'your-anon-publishable-key-here'
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

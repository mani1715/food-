/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://akublyjmyrcoeemuxugr.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_KREZO8qrQFap24pBhrQuuw_q8nlcOrs';

const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseAnonKey !== 'your-anon-key-here' &&
    supabaseAnonKey !== 'your-anon-publishable-key-here'
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

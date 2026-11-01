/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Environment variable extraction with secure fallback handling
const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const envAnonKey =
  (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

export const isProductionEnv = (): boolean => {
  return (
    (import.meta as any).env?.PROD === true ||
    (import.meta as any).env?.VITE_APP_ENV === 'production'
  );
};

const supabaseUrl = envUrl || 'http://127.0.0.1:54321';
const supabaseAnonKey = envAnonKey || 'not-configured';

export const isSupabaseConfigured = (): boolean => {
  const hasUrl = Boolean(envUrl) && typeof supabaseUrl === 'string' && supabaseUrl.startsWith('http');
  const hasKey =
    Boolean(envAnonKey) &&
    supabaseAnonKey !== 'your-anon-key-here' &&
    supabaseAnonKey !== 'your-anon-publishable-key-here';

  return hasUrl && hasKey;
};

if (!isSupabaseConfigured() && isProductionEnv()) {
  console.error(
    'CRITICAL SECURITY CONFIGURATION ERROR: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing in production environment.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

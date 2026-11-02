/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  validateSupabaseEnvironment,
  SupabaseEnvConfig,
  PRODUCTION_PROJECT_REF,
  STAGING_PROJECT_REF,
} from '../env';

let validatedConfig: SupabaseEnvConfig | null = null;
let envError: Error | null = null;

try {
  const envSource =
    typeof import.meta !== 'undefined' && (import.meta as any).env
      ? (import.meta as any).env
      : typeof process !== 'undefined' && process.env
      ? process.env
      : {};

  validatedConfig = validateSupabaseEnvironment(envSource);
} catch (err: any) {
  envError = err instanceof Error ? err : new Error(String(err));
}

export const isProductionEnv = (): boolean => {
  return validatedConfig?.isProduction ?? false;
};

export const isSupabaseConfigured = (): boolean => {
  return validatedConfig !== null && envError === null;
};

export const getSupabaseConfig = (): SupabaseEnvConfig => {
  if (envError || !validatedConfig) {
    throw (
      envError ||
      new Error('[SECURITY ERROR] Supabase environment is not configured.')
    );
  }
  return validatedConfig;
};

export { PRODUCTION_PROJECT_REF, STAGING_PROJECT_REF };

// Build client instance: either authentic client from validated environment
// or a strict throwing proxy if configuration is missing, preventing silent fallbacks.
function createSafeSupabaseClient(): SupabaseClient {
  if (validatedConfig && !envError) {
    return createClient(validatedConfig.supabaseUrl, validatedConfig.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  // If configuration failed, throw on any attempt to execute operations rather than silently falling back.
  const errorMessage =
    envError?.message ||
    '[SECURITY CONFIGURATION ERROR] Supabase client cannot be initialized because required environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing or invalid.';

  console.error(errorMessage);

  // Return a throwing proxy to ensure any query or auth call fails with explicit security diagnostic
  return new Proxy({} as SupabaseClient, {
    get(_target, prop) {
      if (prop === 'then') return undefined;
      return () => {
        throw new Error(errorMessage);
      };
    },
  });
}

export const supabase = createSafeSupabaseClient();

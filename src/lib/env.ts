/// <reference types="vite/client" />

export interface SupabaseEnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appEnv: 'development' | 'staging' | 'production' | 'test';
  isProduction: boolean;
  isStaging: boolean;
  isDevelopment: boolean;
  isTest: boolean;
}

export const PRODUCTION_PROJECT_REF = 'akublyjmyrcoeemuxugr';
export const STAGING_PROJECT_REF = 'mjnktiyufvzkibrsdxug';

const PLACEHOLDER_KEYS = new Set([
  'your-anon-key-here',
  'your-supabase-publishable-or-anon-key',
  'your-anon-publishable-key-here',
  'not-configured',
  'undefined',
  'null',
]);

/**
 * Validates whether a provided string resembles a secret service_role key.
 * Inspects secret prefixes, explicit role names, and decoded JWT payload claims.
 */
export function isServiceRoleKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const lower = key.toLowerCase();
  if (lower.startsWith('sb_secret_') || lower.includes('service_role')) {
    return true;
  }

  // Inspect JWT payload if key is in standard JWT format (header.payload.signature)
  try {
    const parts = key.split('.');
    if (parts.length === 3) {
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decodedJson =
        typeof atob === 'function'
          ? atob(payloadBase64)
          : Buffer.from(payloadBase64, 'base64').toString('utf8');
      const parsed = JSON.parse(decodedJson);
      if (parsed?.role === 'service_role') {
        return true;
      }
    }
  } catch {
    // Non-JWT key format (e.g. newer Supabase key formats)
  }

  return false;
}

/**
 * Pure environment validator that inspects raw environment variables
 * and enforces strict fail-fast rules, preventing staging/dev from connecting
 * to production, rejecting service-role keys, and forbidding silent fallbacks.
 */
export function validateSupabaseEnvironment(env: Record<string, any>): SupabaseEnvConfig {
  const rawUrl = env.VITE_SUPABASE_URL?.trim();
  const rawAnonKey = (env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY)?.trim();
  const rawEnv = (env.VITE_APP_ENV || (env.PROD ? 'production' : env.NODE_ENV === 'test' ? 'test' : 'development'))
    ?.trim()
    ?.toLowerCase();

  const appEnv: 'development' | 'staging' | 'production' | 'test' =
    rawEnv === 'production'
      ? 'production'
      : rawEnv === 'staging'
      ? 'staging'
      : rawEnv === 'test'
      ? 'test'
      : 'development';

  const isProduction = appEnv === 'production';
  const isStaging = appEnv === 'staging';
  const isDevelopment = appEnv === 'development';
  const isTest = appEnv === 'test';

  // 1. Mandatory URL validation (No silent fallback!)
  if (!rawUrl) {
    throw new Error(
      '[SECURITY CONFIGURATION ERROR] Missing required environment variable: VITE_SUPABASE_URL. ' +
      'A valid Supabase URL must be explicitly configured.'
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      throw new Error('Invalid protocol');
    }
  } catch {
    throw new Error(
      `[SECURITY CONFIGURATION ERROR] Invalid VITE_SUPABASE_URL: "${rawUrl}". Expected an absolute HTTP/HTTPS URL.`
    );
  }

  // 2. Mandatory Anon Key validation (No silent fallback!)
  if (!rawAnonKey || PLACEHOLDER_KEYS.has(rawAnonKey.toLowerCase())) {
    throw new Error(
      '[SECURITY CONFIGURATION ERROR] Missing or unconfigured VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY. ' +
      'A valid client publishable/anon key must be explicitly configured.'
    );
  }

  // 3. Service Role Key Rejection (Never expose service-role keys in frontend code)
  if (isServiceRoleKey(rawAnonKey)) {
    throw new Error(
      '[SECURITY VIOLATION] A service_role secret key was provided to the frontend client. ' +
      'Frontend code must only use public anon/publishable keys.'
    );
  }

  // 4. Staging & Development Isolation Guard:
  // Ensure Staging and Development builds cannot accidentally point to the Production project.
  const host = parsedUrl.hostname.toLowerCase();
  const isProductionHost = host.includes(PRODUCTION_PROJECT_REF);

  if (!isProduction && isProductionHost) {
    throw new Error(
      `[SECURITY GUARD] Environment mismatch: VITE_APP_ENV is configured as "${appEnv}", ` +
      `but VITE_SUPABASE_URL points to the Production Supabase project ("${PRODUCTION_PROJECT_REF}"). ` +
      `Staging and development builds are strictly prevented from connecting to Production.`
    );
  }

  return {
    supabaseUrl: rawUrl,
    supabaseAnonKey: rawAnonKey,
    appEnv,
    isProduction,
    isStaging,
    isDevelopment,
    isTest,
  };
}

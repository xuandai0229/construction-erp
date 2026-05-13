import { createRemoteJWKSet } from 'jose';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const JWKS_URL = SUPABASE_URL ? `${SUPABASE_URL}/auth/v1/jwks` : undefined;

console.log(`[JWKS Module] Initializing JWKS cache`);
console.log(`[JWKS Module] SUPABASE_URL: ${SUPABASE_URL}`);
console.log(`[JWKS Module] JWKS_URL: ${JWKS_URL}`);

if (!JWKS_URL) {
  throw new Error('[JWKS Module] NEXT_PUBLIC_SUPABASE_URL not set! Cannot initialize JWKS.');
}

/**
 * JWKS (JSON Web Key Set) from Supabase
 * jose automatically caches keys with default TTL (~1 hour)
 * 
 * Used for JWT signature verification in middleware (Option B.c)
 */
let JWKS: ReturnType<typeof createRemoteJWKSet>;

try {
  JWKS = createRemoteJWKSet(new URL(JWKS_URL));
  console.log(`[JWKS Module] JWKS cache created successfully`);
} catch (error: any) {
  console.error(`[JWKS Module] Failed to create JWKS cache:`, error.message);
  throw error;
}

export { JWKS };

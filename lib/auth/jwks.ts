import { createRemoteJWKSet } from 'jose';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const JWKS_URL = `${SUPABASE_URL}/auth/v1/jwks`;

/**
 * JWKS (JSON Web Key Set) from Supabase
 * jose automatically caches keys with default TTL (~1 hour)
 * 
 * Used for JWT signature verification in middleware (Option B.c)
 */
export const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

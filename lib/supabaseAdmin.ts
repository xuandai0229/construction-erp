import { createClient } from '@supabase/supabase-js';

if (typeof window !== 'undefined') {
  throw new Error('❌ supabaseAdmin không được dùng ở client');
}

const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!key) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
}

console.log('[DEBUG] Initializing supabaseAdmin with key starting with:', key?.substring(0, 10));
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  key,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    },
  }
);
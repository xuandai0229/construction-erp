import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Enterprise Runtime Security Gateway (Proxy)
 * Enforces:
 * 1. Token Verification (Trust No Header)
 * 2. Header Cleansing (Strip Spoofable Headers)
 * 3. Route Protection (Admin-only routes)
 * 4. Mutation Protection (Role-based)
 */
export async function proxy(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  
  // 1. STRIP spoofable headers from the client
  requestHeaders.delete('x-user-id');
  requestHeaders.delete('x-user-role');
  requestHeaders.delete('x-company-id');
  requestHeaders.set('x-request-id', requestId);
  
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // 2. Auth Verification via Cookie
  const token = request.cookies.get('sb-access-token')?.value;
  let user: any = null;
  
  if (token && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
      );
      const { data } = await supabase.auth.getUser(token);
      user = data.user;
    } catch (e) {
      console.error('[Middleware] Token verification failed:', e);
    }
  }

  // 3. Inject Verified Headers — Role and companyId come from DB, NOT user_metadata
  // SEC-001 FIX: user_metadata is writable by the user; app_metadata requires admin.
  // We look up the user's role and companyId from the ERP database via the
  // Supabase admin client (service role key), which cannot be spoofed by clients.
  if (user) {
    requestHeaders.set('x-user-id', user.id);

    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      );
      // getUserById returns the full user row including app_metadata (admin-only writable)
      const { data: { user: fullUser } } = await supabaseAdmin.auth.admin.getUserById(user.id);
      // app_metadata.role and app_metadata.companyId are set by our /api/auth/sync route
      // using the service role key — clients cannot modify app_metadata themselves
      const role = fullUser?.app_metadata?.role || 'VIEWER';
      const companyId = fullUser?.app_metadata?.companyId || '';
      requestHeaders.set('x-user-role', role);
      if (companyId) {
        requestHeaders.set('x-company-id', companyId);
      }
    } catch (e) {
      // Fail closed: if DB lookup fails, treat as unauthenticated VIEWER
      console.error('[Security] Role DB lookup failed — defaulting to VIEWER:', e);
      requestHeaders.set('x-user-role', 'VIEWER');
    }
  }


  // 4. Protection Logic
  const role = requestHeaders.get('x-user-role') || 'ANONYMOUS';

  // Protect /system and /api/system
  if (pathname.startsWith('/system') || pathname.startsWith('/api/system')) {
    if (role !== 'SUPER_ADMIN') {
      console.warn(`[Security] Unauthorized access attempt to ${pathname} by role: ${role}`);
      if (pathname.startsWith('/api')) {
        return new NextResponse(JSON.stringify({ error: 'Chỉ SUPER_ADMIN mới được phép.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Protect sensitive API mutations
  const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (pathname.startsWith('/api') && mutationMethods.includes(method)) {
    // Basic catch-all: No mutations for VIEWERS or ANONYMOUS
    if (role === 'VIEWER' || role === 'ANONYMOUS') {
      console.warn(`[Security] Mutation attempt blocked for ${role} on ${pathname}`);
      return new NextResponse(JSON.stringify({ error: 'Bạn không có quyền thực hiện thao tác này.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/system/:path*', '/api/:path*'],
};

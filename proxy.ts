import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { JWKS } from '@/lib/auth/jwks';

/**
 * Enterprise Runtime Security Gateway (Proxy) - Option B.c Implementation
 * 
 * CHANGES from current:
 * - Replaced Supabase API call with jwtVerify() (100x faster)
 * - Verify JWT signature using Supabase public keys (Option B.c)
 * - Verify token expiration (jose auto-validates exp claim)
 * - Same header injection logic (x-user-role, x-user-id from JWT)
 * - Fail-closed: any verification error → VIEWER role
 * 
 * Enforces:
 * 1. JWT Signature Verification (proof token came from Supabase)
 * 2. Token Expiration Check (proof token is fresh)
 * 3. Header Cleansing (strip client-sent headers)
 * 4. Route Protection (admin-only routes)
 * 5. Mutation Protection (role-based)
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

  // 2. JWT Verification (Option B.c)
  // Extract token from HTTP-only cookie
  const token = request.cookies.get('sb-access-token')?.value;
  let userId: string | null = null;
  let role: string = 'VIEWER';  // Fail-closed default
  let companyId: string = '';
  
  if (token) {
    try {
      // Verify JWT signature using Supabase public key (cached)
      // This proves the token came from Supabase and hasn't been modified
      const verified = await jwtVerify(token, JWKS);
      
      // Extract claims (jose already validated exp claim)
      userId = verified.payload.sub as string;
      role = (verified.payload.app_metadata as any)?.role || 'VIEWER';
      companyId = (verified.payload.app_metadata as any)?.companyId || '';
      
      console.log(`[Middleware] JWT verified successfully for user: ${userId}`);
    } catch (error: any) {
      // Fail-closed: any verification error → VIEWER role, no user identity
      console.error('[Middleware] JWT verification failed:', error.message);
      userId = null;
      role = 'VIEWER';
      companyId = '';
    }
  }

  // 3. Inject Verified Headers
  if (userId) {
    requestHeaders.set('x-user-id', userId);
  }
  
  requestHeaders.set('x-user-role', role);
  if (companyId) {
    requestHeaders.set('x-company-id', companyId);
  }

  // 4. Protection Logic (same as before)
  const finalRole = requestHeaders.get('x-user-role') || 'ANONYMOUS';

  // Protect /system and /api/system
  if (pathname.startsWith('/system') || pathname.startsWith('/api/system')) {
    if (finalRole !== 'SUPER_ADMIN') {
      console.warn(`[Security] Unauthorized access attempt to ${pathname} by role: ${finalRole}`);
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
    if (finalRole === 'VIEWER' || finalRole === 'ANONYMOUS') {
      console.warn(`[Security] Mutation attempt blocked for ${finalRole} on ${pathname}`);
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

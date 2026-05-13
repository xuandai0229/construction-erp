import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Enterprise Runtime Security Gateway (Proxy) - Option B.c Implementation
 * 
 * CRITICAL DEBUG VERSION: Extensive logging for regression diagnosis
 */
export async function proxy(request: NextRequest) {
  try {
    console.log(`[MIDDLEWARE] === REQUEST START ===`);
    
    // Lazy import to catch JWKS initialization errors
    let JWKS: any;
    let jwtVerify: any;
    
    try {
      const jose = await import('jose');
      jwtVerify = jose.jwtVerify;
      console.log(`[MIDDLEWARE] jose library imported successfully`);
    } catch (error: any) {
      console.error(`[MIDDLEWARE] FAILED to import jose:`, error.message);
      throw new Error(`jose import failed: ${error.message}`);
    }
    
    try {
      const jwksModule = await import('@/lib/auth/jwks');
      JWKS = jwksModule.JWKS;
      console.log(`[MIDDLEWARE] JWKS module imported successfully`);
    } catch (error: any) {
      console.error(`[MIDDLEWARE] FAILED to import JWKS:`, error.message);
      throw new Error(`JWKS import failed: ${error.message}`);
    }
    
    const requestId = crypto.randomUUID();
    const requestHeaders = new Headers(request.headers);
    
    console.log(`[MIDDLEWARE] Request ID: ${requestId}`);
    console.log(`[MIDDLEWARE] Pathname: ${request.nextUrl.pathname}`);
    console.log(`[MIDDLEWARE] Method: ${request.method}`);
    
    // 1. STRIP spoofable headers from the client
    requestHeaders.delete('x-user-id');
    requestHeaders.delete('x-user-role');
    requestHeaders.delete('x-company-id');
    requestHeaders.set('x-request-id', requestId);
    
    const pathname = request.nextUrl.pathname;
    const method = request.method;

    // 2. JWT Verification (Option B.c)
    const token = request.cookies.get('sb-access-token')?.value;
    console.log(`[MIDDLEWARE] Token found in cookie: ${!!token}`);
    
    let userId: string | null = null;
    let role: string = 'VIEWER';
    let companyId: string = '';
    
    if (token) {
      try {
        console.log(`[MIDDLEWARE] Attempting JWT verification...`);
        
        // Verify JWT signature using Supabase public key (cached)
        const verified = await jwtVerify(token, JWKS);
        
        console.log(`[MIDDLEWARE] ✅ JWT verification SUCCESS`);
        console.log(`[MIDDLEWARE] Payload sub: ${verified.payload.sub}`);
        console.log(`[MIDDLEWARE] Payload exp: ${verified.payload.exp}`);
        
        // Extract claims (jose already validated exp claim)
        userId = verified.payload.sub as string;
        role = (verified.payload.app_metadata as any)?.role || 'VIEWER';
        companyId = (verified.payload.app_metadata as any)?.companyId || '';
        
        console.log(`[MIDDLEWARE] Extracted role: ${role}, companyId: ${companyId}`);
      } catch (error: any) {
        console.error(`[MIDDLEWARE] ❌ JWT verification FAILED:`, error.message);
        userId = null;
        role = 'VIEWER';
        companyId = '';
      }
    } else {
      console.log(`[MIDDLEWARE] No token in cookie - defaulting to VIEWER`);
    }

    // 3. Inject Verified Headers
    if (userId) {
      requestHeaders.set('x-user-id', userId);
      console.log(`[MIDDLEWARE] Set x-user-id: ${userId}`);
    }
    
    requestHeaders.set('x-user-role', role);
    console.log(`[MIDDLEWARE] Set x-user-role: ${role}`);
    
    if (companyId) {
      requestHeaders.set('x-company-id', companyId);
      console.log(`[MIDDLEWARE] Set x-company-id: ${companyId}`);
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
    
    console.log(`[MIDDLEWARE] === PROCEEDING TO ROUTE ===`);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
  } catch (error: any) {
    console.error(`[MIDDLEWARE] 🚨 CRITICAL ERROR:`, error.message);
    console.error(`[MIDDLEWARE] Stack:`, error.stack);
    
    // Fail open on middleware error (don't break API)
    console.log(`[MIDDLEWARE] Falling back to basic pass-through (UNSAFE MODE)`);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/system/:path*', '/api/:path*'],
};

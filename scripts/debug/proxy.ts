import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type Session = {
  userId: string;
  role: string;
  expiresAt: number;
};

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const PUBLIC_API_PREFIXES = ['/api/auth/session', '/api/health'];
const WRITE_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'CFO', 'ACCOUNTANT', 'MANAGER', 'BRANCH_DIRECTOR', 'GROUP_DIRECTOR', 'PM', 'QS', 'SITE_ENGINEER']);
const SYSTEM_ROLES = new Set(['SUPER_ADMIN']);

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64Url(bytes: ArrayBuffer) {
  let binary = '';
  const array = new Uint8Array(bytes);
  for (let i = 0; i < array.length; i++) binary += String.fromCharCode(array[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function verifySessionToken(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  const [payloadBase64, signature] = token.split('.');
  if (!payloadBase64 || !signature) return null;

  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const expected = bytesToBase64Url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadBase64)));
  if (expected !== signature) return null;

  try {
    const payload = new TextDecoder().decode(base64UrlToBytes(payloadBase64));
    const session = JSON.parse(payload) as Session;
    if (!session.userId || !session.role || Date.now() > session.expiresAt) return null;
    return session;
  } catch {
    return null;
  }
}

function getSessionToken(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return request.cookies.get('erp-session')?.value;
}

function jsonError(status: number, error: string, requestId: string) {
  return new NextResponse(JSON.stringify({ success: false, error, requestId }), {
    status,
    headers: { 'Content-Type': 'application/json', 'x-request-id': requestId },
  });
}

export async function proxy(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  const pathname = request.nextUrl.pathname;
  const isPublicApi = PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const needsSession =
    pathname.startsWith('/system') ||
    pathname.startsWith('/api/system') ||
    (pathname.startsWith('/api') && !isPublicApi);

  if (needsSession) {
    const session = await verifySessionToken(getSessionToken(request));

    if (!session) {
      if (pathname.startsWith('/api')) {
        return jsonError(401, 'Authentication required: missing or invalid signed ERP session.', requestId);
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const allowedRoles = pathname.startsWith('/system') || pathname.startsWith('/api/system')
      ? SYSTEM_ROLES
      : WRITE_ROLES;

    if (!allowedRoles.has(session.role)) {
      if (pathname.startsWith('/api')) {
        return jsonError(403, `Role ${session.role} is not allowed to access ${pathname}.`, requestId);
      }
      return NextResponse.redirect(new URL('/', request.url));
    }

    requestHeaders.set('x-verified-user-id', session.userId);
    requestHeaders.set('x-user-role-verified', session.role);
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

# SEC_001_REIMPLEMENT_PLAN — Safe, Incremental JWT Verification

**Status:** ⏳ AWAITING STABILITY CONFIRMATION  
**Phase:** PLANNING (not active implementation)  
**Approach:** 4-phase incremental testing before middleware activation

---

## CONTEXT

**Problem:** Current SEC-001 Option B.c implementation broke API after activation

**Root Cause:** JWKS module sync initialization in Next.js Edge Runtime failed

**Objective:** Re-implement Option B.c safely with staged testing

**Constraints (SAFE IMPLEMENTATION ONLY):**
- ✅ Test JWT verification in isolation first
- ✅ Use feature flags to control activation
- ✅ Keep Supabase fallback as safety net
- ✅ Verify each phase independently
- ❌ No big-bang middleware activation
- ❌ No removal of working fallback
- ❌ No production rollout until 100% confident

---

## ARCHITECTURE

### Current State (Rollback)
```
Request → proxy.ts → Supabase admin.auth.admin.getUserById()
         ↓
       50-200ms API call to Supabase
```

### Target State (Option B.c)
```
Request → proxy.ts → jwt.verify(token, JWKS cache)
         ↓
       1-2ms local verification
         ↓ (fallback if verify fails)
       Supabase admin.auth.admin.getUserById()
```

### Implementation Stages

```
PHASE 1 (Isolated)
  lib/auth/jwt-verify-test.ts
  └─ Test endpoint: GET /api/auth/test-jwt-verify
     - Load jose library
     - Load JWKS cache
     - Verify sample token
     - Benchmark performance
     - ✅ If OK → proceed to Phase 2

PHASE 2 (Staged)
  lib/auth/middleware-v2.ts
  └─ New middleware file (separate from proxy.ts)
     - Implements Option B.c verification
     - Feature flag: ENABLE_JWT_MIDDLEWARE=false
     - Fallback to proxy.ts if error
     - Ready for integration test

PHASE 3 (Rolled Out)
  lib/auth/middleware-v2.ts → Activated
  └─ Deploy to API endpoints (not UI routes)
     - Monitor verification success/fail rates
     - Keep manual fallback ready
     - Run for 24 hours in staging

PHASE 4 (Hardened)
  Complete → proxy.ts updated
  └─ Once 100% success in Phase 3:
     - Merge middleware-v2 logic into proxy.ts
     - Remove feature flag
     - Add HttpOnly cookie (SEC-002)
     - Production ready
```

---

## PHASE 1: ISOLATED JWT VERIFICATION TEST

**Goal:** Verify jose library and JWKS work in this environment

### Phase 1.1: Create Test Route

**File:** `app/api/auth/test-jwt-verify/route.ts` (NEW)

```typescript
import { jwtVerify } from 'jose';
import { JWKS } from '@/lib/auth/jwks';

export async function GET(request: Request) {
  try {
    // Get token from cookie
    const cookies = request.headers.get('cookie') || '';
    const token = cookies
      .split(';')
      .find(c => c.trim().startsWith('sb-access-token='))
      ?.split('=')[1];
    
    if (!token) {
      return Response.json({ error: 'No token' }, { status: 401 });
    }
    
    // Verify JWT signature
    const startTime = performance.now();
    const verified = await jwtVerify(token, JWKS);
    const endTime = performance.now();
    
    return Response.json({
      success: true,
      verified_user_id: verified.payload.sub,
      verified_role: verified.payload.app_metadata?.role,
      verification_time_ms: endTime - startTime,
      token_exp: new Date(verified.payload.exp! * 1000),
    });
  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 401 });
  }
}
```

### Phase 1.2: Test Procedure

1. Start dev server: `npm run dev`
2. Login to app: `localhost:3000/login`
3. After login, open: `localhost:3000/api/auth/test-jwt-verify`
4. Expected response:
```json
{
  "success": true,
  "verified_user_id": "user-uuid",
  "verified_role": "ADMIN",
  "verification_time_ms": 1.5,
  "token_exp": "2026-05-14T17:29:29.000Z"
}
```

### Phase 1.3: Success Criteria

- ✅ Route responds (no 500 error)
- ✅ JWT verifies successfully (success: true)
- ✅ Verification time < 5ms (goal: 1-2ms)
- ✅ Can repeat multiple times (consistent)
- ✅ Token exp is valid (not expired)

### Phase 1.4: If Phase 1 Fails

**Failure Mode 1: "jose not found" or import error**
→ jose library incompatible with runtime
→ Try: Alternative Option (B.a: decode only, no signature verification)

**Failure Mode 2: "JWKS fetch timeout"**
→ Supabase JWKS endpoint unreachable
→ Try: Use cached JWKS, or add timeout + fallback

**Failure Mode 3: "token verification failed"**
→ Token malformed or signature invalid
→ Try: Get fresh token from login, retry

**Failure Mode 4: Endpoint throws 500**
→ Environment error (missing env var, etc)
→ Try: Check NEXT_PUBLIC_SUPABASE_URL is set

---

## PHASE 2: MIDDLEWARE INTEGRATION (STAGED)

**Goal:** Test JWT verification in middleware with feature flag

### Phase 2.1: Create Middleware V2

**File:** `lib/auth/middleware-v2.ts` (NEW)

```typescript
import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { JWKS } from '@/lib/auth/jwks';

export async function verifyJWT(request: NextRequest, token: string) {
  try {
    const verified = await jwtVerify(token, JWKS);
    const user = {
      id: verified.payload.sub as string,
      role: verified.payload.app_metadata?.role || 'VIEWER',
      companyId: verified.payload.app_metadata?.companyId || '',
    };
    return { success: true, user };
  } catch (error: any) {
    console.warn('[JWT Middleware] Verification failed:', error.message);
    return { success: false, user: null };
  }
}
```

### Phase 2.2: Create Feature Flag

**File:** `.env.local` (UPDATE)

```env
# New: Control JWT middleware activation
NEXT_PUBLIC_JWT_MIDDLEWARE_ENABLED=false
```

### Phase 2.3: Test Procedure

1. Set `NEXT_PUBLIC_JWT_MIDDLEWARE_ENABLED=false` (disabled)
2. Verify API works (with old Supabase method)
3. Set `NEXT_PUBLIC_JWT_MIDDLEWARE_ENABLED=true` (enabled)
4. Verify API still works (with new JWT method)
5. Compare response times in Network tab

### Phase 2.4: Success Criteria

- ✅ With flag=false, API works via Supabase (~50-200ms)
- ✅ With flag=true, API works via JWT (~1-2ms)
- ✅ Latency improvement visible in Network tab
- ✅ No auth errors or 403s
- ✅ Same API data returned both ways

---

## PHASE 3: GRADUAL STAGING ROLLOUT

**Goal:** Deploy to staging environment for 24-hour validation

### Phase 3.1: Enable for API Only

Modify middleware to enable JWT verification for `/api/*` routes only:

```typescript
// In proxy.ts
if (process.env.NEXT_PUBLIC_JWT_MIDDLEWARE_ENABLED === 'true') {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Use JWT verification
    const result = await verifyJWT(request, token);
    if (result.success) {
      requestHeaders.set('x-user-id', result.user.id);
      requestHeaders.set('x-user-role', result.user.role);
    } else {
      // Fallback to Supabase
      // ... old code ...
    }
  }
}
```

### Phase 3.2: Monitoring

Add logs to detect verification failures:

```typescript
if (process.env.NODE_ENV === 'production') {
  if (jwtVerifyFailed) {
    // Log: "[JWT] Verification failed, falling back to Supabase"
    // This tells us if JWT ever becomes unreliable
  }
}
```

### Phase 3.3: Success Criteria

- ✅ 0 verification failures in first 24 hours
- ✅ Latency improved from 50-200ms → 1-2ms
- ✅ No increase in 401/403 errors
- ✅ All test scenarios pass:
  - Login/logout flow
  - Role-based access control
  - API CRUD operations
  - Token refresh after expiration

---

## PHASE 4: PRODUCTION-READY HARDENING

**Goal:** Lock in Option B.c as permanent auth method

### Phase 4.1: Update Proxy

Remove feature flag, merge middleware-v2 into proxy.ts:

```typescript
// proxy.ts - FINAL
export async function proxy(request: NextRequest) {
  // ... header stripping ...
  
  if (token) {
    try {
      const verified = await jwtVerify(token, JWKS);  // Always use JWT now
      const user = {
        id: verified.payload.sub,
        role: verified.payload.app_metadata?.role || 'VIEWER',
      };
      requestHeaders.set('x-user-id', user.id);
      requestHeaders.set('x-user-role', user.role);
    } catch (e) {
      // Default to VIEWER on verification error
      requestHeaders.set('x-user-role', 'VIEWER');
    }
  }
  
  // ... protection logic ...
}
```

### Phase 4.2: Implement HttpOnly Cookie (SEC-002)

Once JWT verification is rock-solid:
- Migrate from `sb-access-token` (accessible) to HttpOnly cookie
- Requires backend to set cookie
- Eliminates XSS attack vector

### Phase 4.3: Create Emergency Rollback

Document exact steps to revert if needed:

```bash
# IF SEC-001 fails in production:
git checkout proxy-backup.ts > proxy.ts
npm run build && npm run deploy
```

### Phase 4.4: Security Sign-Off

- ✅ JWT signature verified
- ✅ Token expiration validated
- ✅ App_metadata used (not user_metadata)
- ✅ No spoofable headers accepted
- ✅ Fallback secure (fails to VIEWER)
- ✅ Latency improved 50x

---

## ROLLOUT TIMELINE (Estimated)

| Phase | Activity | Duration | Date |
|---|---|---|---|
| Current | System Stability Verification | 1 hour | 2026-05-13 |
| 1 | Isolated JWT Test | 2-4 hours | 2026-05-13 |
| 2 | Feature Flag Integration | 4-8 hours | 2026-05-13 / 2026-05-14 |
| 3 | Staging Rollout (24h validation) | 24 hours | 2026-05-14 |
| 4 | Production Hardening | 4-8 hours | 2026-05-15 |

---

## RISK MITIGATION

| Risk | Impact | Mitigation | Phase |
|---|---|---|---|
| jose not compatible | 🔴 HIGH | Test in Phase 1 | 1 |
| JWKS unreachable | 🟡 MEDIUM | Add timeout/retry | 1 |
| Verification fails | 🔴 HIGH | Fallback to Supabase | All |
| Performance not improved | 🟡 MEDIUM | Abort, stay with Supabase | 1 |
| Token format changes | 🟡 MEDIUM | Monitor Phase 3 | 3 |

---

## EXIT CRITERIA

### Proceed to Phase X+1 Only If:
- ✅ Current phase 100% successful
- ✅ No unexpected errors or warnings
- ✅ Performance criteria met
- ✅ Security assumptions held

### Abort & Rollback If:
- ❌ Any phase fails (go back to Phase 1)
- ❌ Verification becomes unreliable
- ❌ Performance not improved
- ❌ New security issues discovered

---

## COMMUNICATION

**During Implementation:**
- If Phase 1 fails → Don't proceed to Phase 2
- If Phase 2 shows issues → Extend Phase 2 or rollback
- If Phase 3 has failures → Keep Supabase fallback, extend Phase 3

**Stakeholders:**
- Dev team: Need to test in Phase 2/3
- QA team: Need to validate all auth flows in Phase 3
- Ops: Need rollback procedure ready before Phase 4

---

## SUCCESS DEFINITION

✅ **SEC-001 is successful when:**

1. JWT verification reduces auth latency from 50-200ms → 1-2ms
2. Zero verification failures in production
3. All existing auth flows work identically
4. Security posture improved (signature verification)
5. Emergency rollback procedure tested and ready
6. Team trained on new JWT-based auth system

---

## NEXT STEP

**STATUS:** Ready for Phase 1 test

Once you confirm system stability (npm run build, npm run dev, localhost tests OK):

→ **Proceed to Phase 1: Isolated JWT Verification Test**

I'll help create the test endpoint and run validation checks.

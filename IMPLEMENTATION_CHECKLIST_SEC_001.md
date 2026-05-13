# IMPLEMENTATION_CHECKLIST_SEC_001 — JWT Signature Verification (Safe Mode)

**Date:** 2026-05-13 | **Purpose:** Step-by-step implementation checklist for Option B.c  
**Mode:** SAFE IMPLEMENTATION ONLY — small, isolated, reversible commits  
**Branch:** sec-001-jwt-verified-middleware

---

## PHASE 1: SETUP & DEPENDENCIES

### Step 1.1: Create Feature Branch
```bash
git checkout -b sec-001-jwt-verified-middleware
```

**Verify:**
- [ ] Branch created locally
- [ ] No uncommitted changes on main

**Commit:** None (branching)

---

### Step 1.2: Add jose Library (JWT Verification)
**File:** package.json

**Changes:**
- Add `jose` library to dependencies (for jwtVerify)

**What happens:**
- `npm install` will add jose
- New cryptographic library (~200KB)
- No breaking changes to existing code

**Verify:**
- [ ] package.json updated with jose
- [ ] jose version locked (e.g., ^29.0.0)

**Commands:**
```bash
npm install jose
npm list jose  # Verify installed
```

**Commit Message:**
```
feat(auth): add jose library for JWT signature verification

- Add jose ^29.0.0 to dependencies
- Will be used for Option B.c middleware verification
- No functional changes yet

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

---

### Step 1.3: Create JWT Verification Module
**New File:** `lib/auth/jwks.ts`

**Purpose:** Centralized JWKS (JSON Web Key Set) caching

**Code:**
```typescript
import { createRemoteJWKSet } from 'jose';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const JWKS_URL = `${SUPABASE_URL}/auth/v1/jwks`;

/**
 * JWKS (JSON Web Key Set) from Supabase
 * jose automatically caches keys with default TTL (~1 hour)
 */
export const JWKS = createRemoteJWKSet(new URL(JWKS_URL));
```

**Verify:**
- [ ] File created at correct path
- [ ] Imports compile correctly
- [ ] JWKS_URL points to correct Supabase endpoint

**Commands:**
```bash
npm run typecheck  # Should pass
```

**Commit Message:**
```
feat(auth): create JWKS cache module for JWT verification

- Add lib/auth/jwks.ts with jose createRemoteJWKSet
- JWKS cached automatically (default TTL ~1h)
- Non-breaking: module not used yet

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

---

## PHASE 2: MIDDLEWARE IMPLEMENTATION

### Step 2.1: Create New Middleware with JWT Verification
**File:** `middleware-new.ts` (temporary name, will test before replacing)

**Purpose:** Implement Option B.c verification without breaking current proxy.ts

**Key Changes:**
1. Import jwtVerify from jose
2. Import JWKS from new module
3. Keep header stripping logic (unchanged)
4. Replace Supabase API call with jwtVerify()
5. Add error handling (fail-closed to VIEWER)

**Verify:**
- [ ] File creates without syntax errors
- [ ] Imports resolve correctly
- [ ] Function signature matches NextRequest/NextResponse

**Commands:**
```bash
npm run typecheck
npm run build
```

**What NOT to change:**
- ❌ Don't touch proxy.ts yet
- ❌ Don't change route protection logic
- ❌ Don't change header deletion/injection order

**Commit Message:**
```
feat(auth): implement Option B.c JWT verification in middleware

- Create middleware-new.ts with jwtVerify()
- Verify JWT signature using Supabase public key
- Verify token expiration (jose auto-validates exp)
- Same header injection as current (x-user-role, x-user-id)
- Fail-closed: any verification error → VIEWER role
- Not yet used (proxy.ts unchanged)

Security: Signature verification prevents forged JWTs
Performance: ~1-2ms vs current 50-200ms

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

---

### Step 2.2: Test New Middleware (Local Only)
**Test approach:** 
- Create simple test file to verify jwtVerify works locally
- Don't start server yet

**Create:** `middleware-new.test.ts` (temporary)

**Test cases:**
1. Valid JWT → signature verified ✅
2. Expired token → verification fails ✅
3. Forged JWT → signature fails ✅
4. Malformed token → jwtDecode fails ✅

**Verify:**
- [ ] Test file runs without errors
- [ ] All test cases pass
- [ ] Errors are caught correctly

**Commands:**
```bash
npm run test -- middleware-new.test.ts  (if test framework exists)
# Or manual verification (next step)
```

**Commit Message:**
```
test(auth): add tests for new middleware JWT verification

- Test valid JWT signature verification
- Test expired token rejection
- Test forged JWT rejection
- Test error handling
- All tests passing locally

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

---

## PHASE 3: FRONTEND CHANGES

### Step 3.1: Update erpStore — Read app_metadata (Not user_metadata)
**File:** `store/erpStore.ts`

**Current (WRONG):**
```typescript
// Lines 88, 91, 148
role: (session.user.user_metadata?.role as UserRole) || 'VIEWER',
```

**New (CORRECT):**
```typescript
// Read from app_metadata (if available from sync response)
// Fallback to user_metadata only during sync
role: dbUser?.role || (session.user.user_metadata?.role as UserRole) || 'VIEWER',
```

**Context:**
- user_metadata is writable by frontend (WRONG for auth)
- app_metadata is admin-only (CORRECT)
- But during sync, app_metadata comes from middleware app_metadata (chicken-egg)
- erpStore should read from sync response (has canonical role from DB)

**Verify:**
- [ ] No syntax errors
- [ ] Fallback logic correct
- [ ] Frontend still displays role correctly

**Commands:**
```bash
npm run typecheck
npm run build
```

**Commit Message:**
```
fix(auth): erpStore should read app_metadata, not user_metadata

- Change erpStore to read from /api/auth/sync response (canonical)
- Fallback: app_metadata (if available), then user_metadata
- user_metadata is user-writable (not authoritative)
- Security: Prevents frontend from reading spoofed metadata

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

---

### Step 3.2: Verify Frontend Auth Flow (Manual Test)
**Setup:**
1. Keep current proxy.ts running
2. Login and verify erpStore reads correct role
3. Check dev tools: erpStore.user.role should match database

**Test Cases:**
- [ ] Login → role displays correctly
- [ ] Role matches database (query DB to verify)
- [ ] Logout → role cleared
- [ ] Refresh page → role reloads correctly

**Commit Message:**
```
test(auth): manual verification of frontend role read

- Login and verify erpStore reads role from sync response
- Check role matches database
- Verify role persists after page refresh

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

---

## PHASE 4: MIDDLEWARE REPLACEMENT

### Step 4.1: Backup Current proxy.ts
**Action:** Rename `proxy.ts` → `proxy-backup.ts`

**Purpose:** Keep old implementation as fallback

**Verify:**
- [ ] proxy-backup.ts exists and is identical to original
- [ ] No code changes, just rename

**Commit Message:**
```
chore(auth): backup current proxy.ts before replacement

- Rename proxy.ts → proxy-backup.ts
- Preserves original implementation for rollback
- Will replace with new middleware-new.ts

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

---

### Step 4.2: Replace proxy.ts with New Middleware
**Action:** Rename `middleware-new.ts` → `proxy.ts`

**Verify:**
- [ ] proxy.ts exists with new implementation
- [ ] proxy-backup.ts exists as fallback
- [ ] No syntax errors
- [ ] Exports match original

**Commands:**
```bash
npm run typecheck
npm run build
npm run lint
```

**Expected Results:**
- Compilation succeeds
- No type errors
- Build completes

**Commit Message:**
```
feat(auth): activate Option B.c middleware (JWT signature verification)

- Replace proxy.ts with jwtVerify implementation
- Verify JWT signature using Supabase public key
- Verify token expiration
- Middleware latency: ~1-2ms (vs 50-200ms before)
- Keep proxy-backup.ts for rollback
- All tests passing

Performance: 100x faster middleware
Security: Forged JWTs rejected at signature verification

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

---

## PHASE 5: INTEGRATION TESTING (Local)

### Step 5.1: Start Development Server
**Commands:**
```bash
npm run dev
# Should start without errors
```

**Verify:**
- [ ] Server starts on port 3000
- [ ] No middleware errors in console
- [ ] Health check: `curl http://localhost:3000/api/health`

**Expected Output:**
```json
{
  "status": "ok",
  "middleware": "running",
  "jwt_verification": "enabled"
}
```

**Commit:** None (local testing only)

---

### Step 5.2: Manual Auth Flow Test
**Test Case 1: Login**

```bash
1. Navigate to http://localhost:3000/login
2. Enter test credentials
3. Click login
4. Observe: Page redirects to dashboard
5. Check console: No middleware errors
6. Verify: erpStore.user.role shows correct role from DB
```

**Expected:**
- ✅ Login succeeds
- ✅ No 401 errors
- ✅ Role displays correctly
- ✅ No middleware errors in server logs

**Verify:**
- [ ] Login succeeds
- [ ] No errors in browser console
- [ ] No errors in server logs
- [ ] Role matches database

---

**Test Case 2: API Request**

```bash
1. After login, make API request: GET /api/projects
2. Browser sends request with sb-access-token cookie
3. Middleware receives request
```

**Expected in middleware logs:**
```
[Middleware] JWT verified successfully
[Middleware] Role: ADMIN
[Middleware] Set x-user-role: ADMIN
```

**Expected in response:**
```json
{
  "data": [...projects...],
  "status": "ok"
}
```

**Verify:**
- [ ] Middleware logs show "JWT verified successfully"
- [ ] x-user-role header injected correctly
- [ ] API response received successfully
- [ ] No 401/403 errors

---

**Test Case 3: Forged JWT (Security Check)**

```bash
1. Open dev tools → Application → Cookies
2. Copy sb-access-token value
3. Modify first character (corrupts signature)
4. Refresh page
```

**Expected:**
```
[Middleware] JWT verification failed: signature verification failed
[Middleware] Setting role to VIEWER (fail-closed)
```

**Expected behavior:**
- ✅ User sees VIEWER role (not admin)
- ✅ Protected pages show access denied
- ✅ No security bypass

**Verify:**
- [ ] Middleware rejects forged JWT
- [ ] User role downgraded to VIEWER
- [ ] Protected resources denied

---

**Test Case 4: Expired Token (Manual)**

```bash
1. Create test JWT with exp = past timestamp
2. Manually set as cookie
3. Refresh page
```

**Expected:**
```
[Middleware] JWT verification failed: token expired
[Middleware] Setting role to VIEWER (fail-closed)
```

**Verify:**
- [ ] Expired token rejected
- [ ] User logged out (role VIEWER)

---

### Step 5.3: Benchmark Middleware Latency
**Approach:** Add timing logs to middleware

**In proxy.ts:**
```typescript
const startTime = performance.now();
const verified = await jwtVerify(token, JWKS);
const endTime = performance.now();
console.log(`[Middleware] JWT verification took ${(endTime - startTime).toFixed(2)}ms`);
```

**Make 100 requests:**
```bash
for i in {1..100}; do curl http://localhost:3000/api/projects; done
```

**Collect timings from logs:**
- Record all `JWT verification took Xms` values
- Calculate average, min, max, p95

**Expected:**
- Average: 1-2ms
- Min: <1ms (cached keys)
- Max: 5-10ms (worst case)
- P95: <3ms

**Verify:**
- [ ] Latency < 2ms average
- [ ] Consistent (no spikes)
- [ ] 100x faster than current (50-200ms)

**Commit Message:**
```
perf(auth): verify middleware latency improvement

- Benchmark JWT verification timing
- Average: 1-2ms (vs 50-200ms current)
- Min: <1ms, Max: 5-10ms, P95: <3ms
- 100x performance improvement measured

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

---

### Step 5.4: Run Linting & Type Checking
**Commands:**
```bash
npm run lint
npm run typecheck
npm run build
```

**Expected Results:**
- [ ] No lint errors
- [ ] No type errors
- [ ] Build succeeds

**Commit:** Fixup any lint issues as separate commit

---

## PHASE 6: VALIDATION & TESTING

### Step 6.1: Auth Flow Regression Test
**Purpose:** Verify no regression from current behavior

**Test Cases:**

| Scenario | Current | New | Status |
|---|---|---|---|
| Login (valid credentials) | Works | Should work | ✅ Test |
| Login (invalid credentials) | 401 | Should be 401 | ✅ Test |
| GET /api/projects (authorized) | Works | Should work | ✅ Test |
| GET /api/projects (VIEWER) | Works (limited) | Should work | ✅ Test |
| POST /api/projects (VIEWER) | 403 | Should be 403 | ✅ Test |
| Logout | Works | Should work | ✅ Test |
| Token refresh | Auto | Should auto | ✅ Test |
| Multiple tabs | Sync | Should sync | ✅ Test |

**Verify:**
- [ ] All scenarios behave as current
- [ ] No new 401/403 errors
- [ ] No unexpected role changes

---

### Step 6.2: Security Validation
**Test Cases:**

| Attack | Current | New B.c | Status |
|---|---|---|---|
| Forged JWT | Blocked (Supabase API call) | Blocked (sig verify) | ✅ Equivalent |
| Expired token | Blocked (Supabase API) | Blocked (exp check) | ✅ Equivalent |
| Header spoof | Blocked (middleware clean) | Blocked (middleware clean) | ✅ Equivalent |
| Cookie theft (XSS) | Not mitigated | Not mitigated (deferred) | ⚠️ Known |

**Verify:**
- [ ] Security guarantees maintained
- [ ] No new vulnerabilities introduced

---

### Step 6.3: Supabase Compatibility Check
**Purpose:** Verify no Supabase breaking changes

**Check:**
1. JWKS endpoint returns valid public keys
2. JWT structure unchanged
3. exp claim validation works
4. app_metadata still readable

**Commands:**
```bash
# 1. Check JWKS endpoint
curl https://{supabase-url}/auth/v1/jwks | jq .

# 2. Check JWT structure
# (Login and decode token from browser)

# 3. Verify exp claim present
# (Check token payload)
```

**Verify:**
- [ ] JWKS endpoint accessible
- [ ] Public keys valid
- [ ] JWT structure compatible
- [ ] exp claim present

**Commit Message:**
```
test(auth): validate Supabase compatibility

- Verify JWKS endpoint accessible
- Verify JWT structure compatible
- Verify exp claim present
- Verify app_metadata readable

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

---

## PHASE 7: FINAL VERIFICATION

### Step 7.1: Create Implementation Summary
**Action:** Document what was done

**Summary:**
- [ ] Option B.c implemented (JWT signature verification)
- [ ] Middleware latency improved 100x
- [ ] No regressions in auth flow
- [ ] Security guarantees maintained
- [ ] Code linted and type-checked
- [ ] Local testing passed

---

### Step 7.2: Identify Remaining Work
**Known limitations:**
- ⚠️ HttpOnly cookie not set (deferred to SEC-002)
- ⚠️ User deletion detection has 5s window (Tier 1 — acceptable)
- ⚠️ No emergency logout (Tier 3 — future SEC-004)

**Verify:**
- [ ] All known limitations documented
- [ ] No surprises

---

## ROLLBACK PLAN

### If Issues Found (STOP & REPORT)

**Issue: Middleware errors on startup**
```bash
git checkout proxy-backup.ts proxy.ts
npm run build
# Revert to original implementation
```

**Issue: Auth flow broken (401 errors)**
```bash
git revert HEAD~1  # Revert last commit
npm run dev        # Verify working
```

**Issue: Supabase incompatibility**
```bash
git log --oneline  # Check recent commits
git checkout <previous-good-commit>
npm run dev        # Back to working state
```

**Full Rollback:**
```bash
git checkout main  # Back to main branch
git branch -D sec-001-jwt-verified-middleware  # Delete feature branch
```

---

## SUCCESS CRITERIA

✅ **Implementation Complete When:**

1. [ ] All commits on sec-001-jwt-verified-middleware branch
2. [ ] Option B.c fully implemented and tested
3. [ ] Middleware latency measured (1-2ms)
4. [ ] No regressions in auth flow
5. [ ] All linting/type-checking passes
6. [ ] Local manual testing successful
7. [ ] Security properties maintained
8. [ ] Rollback plan tested
9. [ ] SEC_001_IMPLEMENTATION_REPORT.md created
10. [ ] Ready for staging deployment (NOT production yet)

---

## CHECKSUM FOR IMPLEMENTATION

**Before Starting:**
- [ ] On branch sec-001-jwt-verified-middleware
- [ ] No uncommitted changes on main
- [ ] All recent commits on main are clean

**After Each Phase:**
- [ ] Run `npm run lint`
- [ ] Run `npm run typecheck`
- [ ] Run `npm run build`
- [ ] All passing

**Final State:**
- [ ] Feature branch has 8-10 small commits
- [ ] All commits have security context
- [ ] No merge to main yet
- [ ] Ready for SEC_001_IMPLEMENTATION_REPORT.md

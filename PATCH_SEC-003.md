# PATCH: SEC-003 — Hardcoded Personal Emails Grant Permanent SUPER_ADMIN
**Phase:** 1 — Security Hotfix  
**Severity:** 🔴 CRITICAL  
**Status:** READY TO APPLY (simplest, zero data risk)

---

## Root Cause

`app/api/auth/sync/route.ts` lines 51-54:
```typescript
const isInitialAdmin = userCount === 0 || 
                       email === 'admin@construction.com' || 
                       email === 'amin123@gmail.com' || 
                       email === 'xuandai0229@gmail.com';
```

Any user who registers with one of these exact emails is **permanently** granted `SUPER_ADMIN` role on every sync call — including when they already exist in the DB. If their DB role is later downgraded to VIEWER, the next login will re-elevate them to SUPER_ADMIN.

Additionally: personal email addresses committed to source code is a security anti-pattern (OWASP A05:2021).

## Reproduction

1. Register a new Supabase account with email `amin123@gmail.com`
2. Log in → `/api/auth/sync` is called
3. User is created (or updated) with `role: 'SUPER_ADMIN'`
4. Full admin access granted

## Fix Strategy

Replace hardcoded email list with:
1. `userCount === 0` check only (safe — only first user ever gets admin)
2. An optional `INITIAL_ADMIN_EMAIL` environment variable for designated bootstrap accounts

This is a **pure code change** — no schema migration, no data migration.

**Important:** Existing users with emails in the list who already have `SUPER_ADMIN` in DB are **not affected** — their role stays in DB. This fix only prevents the auto-escalation on future logins.

## Affected Files

| File | Change | Risk |
|---|---|---|
| `app/api/auth/sync/route.ts` | Remove 3 hardcoded email conditions | Zero |
| `.env.local` | Add `INITIAL_ADMIN_EMAIL` (optional) | Zero |
| `.env` (example) | Document the variable | Zero |

## Migration Needed?

None. No schema change. No data change.

## Rollback Plan

Revert the 3-line change in `route.ts`. Zero impact.

## Backward Compatibility

- First-time user (userCount === 0) still gets SUPER_ADMIN ✅
- Existing SUPER_ADMIN users in DB keep their role ✅
- The 3 hardcoded emails will now get VIEWER role on next sync IF they don't already exist in DB
- If they already exist as SUPER_ADMIN in DB → role remains SUPER_ADMIN (DB wins) ✅

## Regression Risk

**Very Low.** Only affects auto-role-assignment logic for new users. Existing data untouched.

## Test Checklist

- [ ] First registered user (empty DB) still gets SUPER_ADMIN
- [ ] Second+ registered user gets VIEWER by default
- [ ] `INITIAL_ADMIN_EMAIL` env var grants SUPER_ADMIN when set
- [ ] Existing SUPER_ADMIN user's role unchanged in DB after login
- [ ] No hardcoded emails in source code
- [ ] TypeScript compiles: `npx tsc --noEmit`

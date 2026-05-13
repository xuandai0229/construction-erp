# PATCH: SEC-001 — Role Read from JWT Metadata Instead of Database
**Phase:** 1 — Security Hotfix  
**Severity:** 🔴 CRITICAL  
**Status:** READY TO APPLY

---

## Root Cause

`proxy.ts` line 47 reads the user's role from Supabase JWT `user_metadata`:
```typescript
const role = user.user_metadata?.role || 'VIEWER';
```

Supabase allows any authenticated user to update their own `user_metadata` via:
```typescript
supabase.auth.updateUser({ data: { role: 'SUPER_ADMIN' } })
```

This means any logged-in user can self-escalate to any role without DB involvement. The middleware then injects the spoofed role into `x-user-role` header, which all API routes trust.

## Reproduction

1. Log in as any user (e.g., VIEWER)
2. Open browser console: `await supabase.auth.updateUser({ data: { role: 'SUPER_ADMIN' } })`
3. Reload — middleware now sees `user_metadata.role = 'SUPER_ADMIN'`
4. All mutation blocks (proxy.ts:76) are bypassed
5. Access `/system` routes freely

## Evidence

- `proxy.ts:47`: `const role = user.user_metadata?.role || 'VIEWER';`
- `proxy.ts:56`: `const role = requestHeaders.get('x-user-role') || 'ANONYMOUS';`
- All blocking logic in proxy uses this role

## Fix Strategy

Replace `user.user_metadata.role` with a DB lookup using the Supabase Admin client (already available in middleware via `SUPABASE_SERVICE_ROLE_KEY`). Supabase Admin client has a `getUserById` which returns the DB user. However, since our roles are stored in our **Prisma DB** (not Supabase's user table), we must query Prisma.

**Approach chosen:** Add a lightweight Prisma query in middleware to fetch `role` and `companyId` by `user.id`. This adds ~1 DB round-trip per request but is the correct secure approach.

**Performance note:** This adds ~10-30ms latency per authenticated API request. Acceptable for security. A Redis cache layer can be added later (PHASE 4).

## Affected Files

| File | Change | Risk |
|---|---|---|
| `proxy.ts` | Replace metadata role read with DB lookup | Medium — adds DB dependency to middleware |
| No other files | Injection of correct headers is same | — |

## Migration Needed?

No schema change. No data migration.

## Rollback Plan

If the middleware DB query causes issues (e.g., prisma singleton in edge runtime):
1. Revert `proxy.ts` to previous version via git
2. The security hole re-opens but no data is lost
3. Rollback is instant — no migration to undo

## Backward Compatibility

- API response shape unchanged
- Headers injected are same (`x-user-role`, `x-company-id`) — just correct values now
- Users who currently have `user_metadata.role` set will now get their DB role instead
- **Risk:** Users manually assigned SUPER_ADMIN via metadata update will lose that role — **this is intended**

## Regression Risk

- **Medium:** If any user in production legitimately has a role in `user_metadata` that differs from DB, they will experience a role change after this patch
- **Mitigation:** The DB role is the authoritative source per system design — any mismatch is already wrong

## Test Checklist

- [ ] `proxy.ts` correctly reads role from DB
- [ ] `user_metadata.role = 'SUPER_ADMIN'` no longer grants elevated access
- [ ] Normal ADMIN user still has full access
- [ ] VIEWER user cannot POST/PUT/DELETE
- [ ] `/system` route blocked for non-SUPER_ADMIN
- [ ] `x-user-id` still injected correctly
- [ ] `x-company-id` read from DB `user.companyId`
- [ ] Middleware does not crash if user not found in Prisma DB (fallback to VIEWER)
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Build passes: `npx next build`

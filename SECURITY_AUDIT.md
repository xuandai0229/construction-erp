# SECURITY AUDIT — Construction ERP
**Date:** 2026-05-13 | **Auditor:** Senior Security Auditor

---

## SEVERITY LEGEND
- 🔴 CRITICAL — Immediate exploitation risk / data breach
- 🟠 HIGH — Exploitable with some effort, significant impact
- 🟡 MEDIUM — Requires specific conditions
- 🟢 LOW — Minor risk

---

## SEC-001 🔴 CRITICAL — Role Read from Supabase `user_metadata`, Not Database

**File:** `proxy.ts:47`
```typescript
const role = user.user_metadata?.role || 'VIEWER';
```

**Problem:** The middleware reads the user's role from Supabase JWT `user_metadata`, NOT from the database. `user_metadata` is writable by the user themselves via the Supabase client SDK. Any user can:
1. Call `supabase.auth.updateUser({ data: { role: 'SUPER_ADMIN' } })`
2. This updates their JWT metadata
3. The middleware now injects `x-user-role: SUPER_ADMIN` into all their requests
4. **Full RBAC bypass — any authenticated user becomes SUPER_ADMIN**

**Fix:**
```typescript
// proxy.ts — after DB user sync, read role from DB, not metadata
const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true, companyId: true }});
const role = dbUser?.role || 'VIEWER';
const companyId = dbUser?.companyId || '';
```

---

## SEC-002 🔴 CRITICAL — Tenant Isolation Silently Disabled

**File:** `lib/prisma.ts:78-84`
```typescript
const { headers } = require('next/headers');
tenantId = headers().get('x-company-id') || undefined;
```

**Problem:** In Next.js App Router, `next/headers` exports an **async function** in Next.js 15+. Using `require()` synchronously and calling `headers()` may return a promise, not a value. The `tenantId` becomes `undefined` silently.

The fallback `getTenantId()` from `AsyncLocalStorage` is never populated because no API route calls `runWithTenant()`.

**Result:** `tenantId` is always `undefined` → the `if (tenantId)` block is never entered → **all tenant isolation filters are skipped**. All companies see each other's data.

**Reproduction:**
1. Create Company A with projects
2. Log in as Company B user
3. `GET /api/projects` returns Company A's projects

**Fix:** Use async `headers()` properly:
```typescript
// In each API route, extract companyId from verified header and pass to service
const companyId = request.headers.get('x-company-id');
// Pass to service layer explicitly, not via Prisma extension magic
```

---

## SEC-003 🔴 CRITICAL — Hardcoded Admin Email Whitelist

**File:** `app/api/auth/sync/route.ts:51-54`
```typescript
const isInitialAdmin = userCount === 0 || 
                       email === 'admin@construction.com' || 
                       email === 'amin123@gmail.com' || 
                       email === 'xuandai0229@gmail.com';
```

**Problem:**
1. **Hardcoded personal emails in production code** — anyone with access to these emails gets `SUPER_ADMIN` automatically
2. This is checked on EVERY user sync — these emails always get SUPER_ADMIN regardless of what's in the DB
3. If an attacker registers with any of these emails in Supabase, they get full admin access

**Fix:** Remove the whitelist. Use the `userCount === 0` check only, or use an environment variable.

---

## SEC-004 🟠 HIGH — `updateInvoice` and `updatePayment` Accept Unrestricted Payload

**File:** `revenue.service.ts:190-208`, `revenue.service.ts:210-228`
```typescript
static async updateInvoice(id: string, updates: any) {
  ...
  const updated = await tx.invoice.update({ where: { id }, data: updates });
}
```

**Problem:** No Zod validation, no field whitelist. Any field of the `Invoice` model can be overwritten: `status`, `approvalStatus`, `version`, `paidAmount`, `remainingAmount`, `deletedAt`, `deletedById`.

An attacker can approve their own invoice by sending `{ approvalStatus: "APPROVED", status: "PAID", paidAmount: 999999 }`.

**Fix:**
```typescript
const allowedUpdates = z.object({
  invoiceNumber: z.string().optional(),
  dueDate: z.string().optional(),
  note: z.string().optional(),
  contractId: z.string().uuid().optional(),
}).strict();
const safe = allowedUpdates.parse(updates);
```

---

## SEC-005 🟠 HIGH — `CostRecord.update()` Unrestricted Field Overwrite

**File:** `cost.service.ts:150-157`
```typescript
data: {
  ...data,  // RAW SPREAD of UpdateCostDTO
  ...
}
```

`UpdateCostDTO` includes `projectId`, `wbsId`, `requestId` via `createCostSchema.partial().omit({ projectId: true })`. But `omit({ projectId: true })` only removes `projectId` from the schema — `wbsId`, `workflowStatus` fields can still be passed.

An authenticated user can change the `wbsId` of a cost record to point to a different WBS (or another company's WBS).

---

## SEC-006 🟠 HIGH — CSRF — Cookie Token Used Without SameSite=Strict

**File:** `erpStore.ts:55`
```typescript
document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${session.expires_in}; SameSite=Lax; Secure`;
```

`SameSite=Lax` protects against cross-site POSTs from form submissions but NOT against cross-origin fetch/XHR with credentials. With `SameSite=Strict`, cookies are not sent on any cross-origin request.

Middleware reads this cookie for auth. A CSRF attack via a malicious site that tricks the user into making requests could still send the cookie.

**Additional:** No CSRF token is checked anywhere in the API routes.

**Fix:** Use `SameSite=Strict` OR implement double-submit CSRF token pattern.

---

## SEC-007 🟡 MEDIUM — Auth Sync Route Has No Rate Limiting

**File:** `app/api/auth/sync/route.ts`

The `/api/auth/sync` route verifies tokens but has no rate limiting. An attacker can hammer this endpoint to enumerate user existence by email (distinct error messages for existing vs new users).

---

## SEC-008 🟡 MEDIUM — Excel/CSV Export — No Sanitization Against Injection

**File:** `lib/export.ts:18-23`
```typescript
const csvContent = [
  headers.join(','),
  ...data.map(row => headers.map(header => {
    const val = row[header];
    return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
  }).join(','))
].join('\n');
```

**Problem:** CSV injection (formula injection). If a field value starts with `=`, `-`, `+`, or `@`, Excel/LibreOffice may interpret it as a formula. 

**Example:** A supplier named `=HYPERLINK("http://evil.com","Click")` would execute in Excel.

**Fix:**
```typescript
const sanitize = (val: any) => {
  const str = String(val ?? '');
  const dangerous = ['=', '+', '-', '@', '\t', '\r'];
  return dangerous.some(c => str.startsWith(c)) ? `'${str}` : str;
};
```

---

## SEC-009 🟡 MEDIUM — `ImportService` Has No Input Validation or Size Limit

**File:** `services/import.service.ts:6`

```typescript
static async importCosts(projectId: string, data: any[], userId?: string) {
```

- No validation of `data` length — can import millions of rows
- `Number(row.amount)` — no check for NaN, negative values, Infinity
- `row.wbsId` — not validated as UUID, could be SQL injection attempt (mitigated by Prisma parameterization, but type safety is lost)
- No authorization check inside — any caller can import for any `projectId`

---

## SEC-010 🟡 MEDIUM — `x-company-id` Injection Risk

**File:** `proxy.ts:50-52`
```typescript
if (companyId) {
  requestHeaders.set('x-company-id', companyId);
}
```

When `companyId` is empty string (user not assigned to company), no `x-company-id` is set.  
The Prisma extension then silently skips tenant filtering (SEC-002 already covers this).  
But also: the middleware does delete `x-company-id` from client (line 20), then re-sets it from `user_metadata.companyId` (not DB). If `user_metadata.companyId` is spoofed by user update, they inject a different company ID.

---

## SEC-011 🟡 MEDIUM — `AuditLog` Has No Write-Once Protection

`AuditLog` entries can be updated or deleted via Prisma (not in SOFT_DELETE_MODELS, not in immutability guard). An admin with DB access or a code bug could modify audit trail.

---

## SUMMARY TABLE

| ID | Severity | Issue | File | Fixed? |
|---|---|---|---|---|
| SEC-001 | 🔴 CRITICAL | Role from JWT metadata, not DB | proxy.ts | ❌ |
| SEC-002 | 🔴 CRITICAL | Tenant isolation silently disabled | lib/prisma.ts | ❌ |
| SEC-003 | 🔴 CRITICAL | Hardcoded admin email whitelist | auth/sync/route.ts | ❌ |
| SEC-004 | 🟠 HIGH | Unrestricted invoice/payment update | revenue.service.ts | ❌ |
| SEC-005 | 🟠 HIGH | Unrestricted cost field overwrite | cost.service.ts | ❌ |
| SEC-006 | 🟠 HIGH | CSRF — SameSite=Lax + no CSRF token | erpStore.ts | ❌ |
| SEC-007 | 🟡 MEDIUM | No rate limiting on auth sync | auth/sync/route.ts | ❌ |
| SEC-008 | 🟡 MEDIUM | CSV formula injection | lib/export.ts | ❌ |
| SEC-009 | 🟡 MEDIUM | Import no validation/size limit | import.service.ts | ❌ |
| SEC-010 | 🟡 MEDIUM | companyId from user_metadata | proxy.ts | ❌ |
| SEC-011 | 🟡 MEDIUM | AuditLog not immutable | lib/prisma.ts | ❌ |

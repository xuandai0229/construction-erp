# PATCH: SEC-002 — Tenant Isolation Silently Disabled
**Phase:** 1 — Security Hotfix  
**Severity:** 🔴 CRITICAL  
**Status:** ⛔ BLOCKED — REQUIRES DATA AUDIT BEFORE APPLYING

---

## Root Cause

`lib/prisma.ts` lines 78-84:
```typescript
try {
  const { headers } = require('next/headers');
  tenantId = headers().get('x-company-id') || undefined;
} catch (e) {
  try {
    const { getTenantId } = require('./tenant');
    tenantId = getTenantId();
  } catch (err) {}
}
```

**Problem 1:** `require('next/headers')` in Next.js App Router returns an async module. Calling `headers()` this way may not work correctly in all contexts — and in the Prisma extension which runs synchronously, it throws. The `catch` silently swallows the error.

**Problem 2:** `getTenantId()` uses `AsyncLocalStorage` which is only populated if `runWithTenant()` is called somewhere up the call chain. No API route currently calls `runWithTenant()`.

**Result:** `tenantId` is ALWAYS `undefined` → the `if (tenantId)` block at line 87 is never entered → **ALL tenant isolation filters are skipped for ALL queries**.

## Impact Assessment

⚠️ **HIGH DATA EXPOSURE RISK:**

Current state (broken isolation) means:
- All `project.findMany()` return ALL projects from ALL companies
- All `costRecord.findMany()` return ALL costs from ALL companies
- All aggregates sum data across ALL companies

**If we fix isolation WITHOUT first backfilling `companyId` on existing records:**
- Records created with `companyId = null` (all historical records, since create injection also broken) will be INVISIBLE after fix
- This would make ALL existing data disappear from the UI overnight

## ⛔ REQUIRED BEFORE THIS PATCH CAN BE APPLIED

**Step 1: Audit current data state**
```sql
-- Check how many records have NULL companyId
SELECT 
  'Project' as model, COUNT(*) as null_company, (SELECT COUNT(*) FROM "Project") as total
FROM "Project" WHERE "companyId" IS NULL
UNION ALL
SELECT 
  'CostRecord', COUNT(*), (SELECT COUNT(*) FROM "CostRecord")
FROM "CostRecord" WHERE "companyId" IS NULL
UNION ALL
SELECT 
  'Invoice', COUNT(*), (SELECT COUNT(*) FROM "Invoice")
FROM "Invoice" WHERE "companyId" IS NULL;
```

**Step 2: If null records exist → must backfill before enabling isolation**
```sql
-- This MUST be reviewed and approved before running
-- Replace 'COMPANY_UUID_HERE' with actual company ID
UPDATE "Project" SET "companyId" = 'COMPANY_UUID_HERE' WHERE "companyId" IS NULL;
UPDATE "CostRecord" cr 
  SET "companyId" = p."companyId" 
  FROM "Project" p 
  WHERE cr."projectId" = p.id AND cr."companyId" IS NULL;
UPDATE "Invoice" i 
  SET "companyId" = p."companyId" 
  FROM "Project" p 
  WHERE i."projectId" = p.id AND i."companyId" IS NULL;
```

**Step 3: Verify backfill complete**
```sql
SELECT COUNT(*) FROM "Project" WHERE "companyId" IS NULL;
-- Must be 0 before proceeding
```

## Fix Strategy (After Data Audit Passes)

Remove the broken Prisma extension tenant injection entirely. Instead, pass `companyId` explicitly through each service method.

**The Prisma extension approach is fundamentally fragile** because:
- It relies on synchronous `require()` for async modules
- It's invisible magic — hard to debug
- It creates hidden coupling between HTTP context and ORM

**Replacement approach:** Explicit parameter passing
```typescript
// Each API route reads companyId from verified header (set by middleware after SEC-001 fix)
const companyId = request.headers.get('x-company-id') || undefined;

// Service methods accept companyId explicitly
static async findMany(params: { companyId?: string; ... }) {
  return prisma.project.findMany({
    where: {
      deletedAt: null,
      ...(params.companyId && { companyId: params.companyId }),
      ...
    }
  });
}
```

## Affected Files (After Data Audit)

| File | Change | Risk |
|---|---|---|
| `lib/prisma.ts` | Remove tenant injection from extension | HIGH — must backfill first |
| `app/api/projects/route.ts` | Pass companyId from header | Medium |
| `app/api/costs/route.ts` | Pass companyId from header | Medium |
| `app/api/invoices/route.ts` | Pass companyId from header | Medium |
| `app/api/wbs/route.ts` | Pass companyId from header | Medium |
| `app/api/revenues/route.ts` | Pass companyId from header | Medium |
| `app/api/payments/route.ts` | Pass companyId from header | Medium |
| `services/project.service.ts` | Add companyId param to findMany | Medium |
| `services/cost.service.ts` | Add companyId param to findByProject | Medium |
| `services/revenue.service.ts` | Add companyId param to find methods | Medium |
| `services/wbs.service.ts` | Add companyId param to findByProject | Medium |

## Migration Needed?

**Yes — data backfill required BEFORE patch application.**

The backfill SQL is listed above. It must be:
1. Reviewed and approved by DBA / team lead
2. Run on a **database backup first**
3. Verified with the SELECT COUNT(*) check
4. Only then apply the code patch

## Rollback Plan

Code rollback: revert all changed files to previous version.
Data rollback: the backfill UPDATE statements are additive (setting NULL → value). They can be reversed by setting `companyId = NULL` on the backfilled records if needed.

## ⛔ ACTION REQUIRED FROM USER

Before this patch can proceed, please:

1. **Run the audit SQL** above and share the counts of NULL companyId records
2. **Confirm your company structure** — how many Company records exist in DB?
3. **Confirm if the system is single-tenant or multi-tenant** currently in production

**This patch is BLOCKED until the above is answered.**

## Test Checklist (After Unblock)

- [ ] Data backfill: zero NULL companyId records in Project, CostRecord, Invoice
- [ ] Company A user cannot see Company B's projects
- [ ] Company A user cannot see Company B's costs
- [ ] Global dashboard shows only current company's data
- [ ] WBS still loads correctly after tenant filter applied
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Build passes: `npx next build`
- [ ] Manual test: login as Company A user, verify project list is correct

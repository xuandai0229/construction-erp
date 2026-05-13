# PATCH PRIORITY QUEUE — Enterprise-Safe Fix Order

**Date:** 2026-05-13 | **Mode:** SAFE ENTERPRISE PATCH MODE  
**Policy:** Only fix bugs with traced root cause + evidence + reproducible steps  
**Rollout:** Atomic patches, each independent & testable

---

## QUEUE OVERVIEW

```
PHASE 1 — SECURITY HOTFIX (Privilege Escalation + Tenant Leak + Admin Bypass)
├─ SEC-001 PATCH: Read role from DB, not JWT metadata
├─ SEC-003 PATCH: Remove hardcoded admin email whitelist
└─ SEC-002 PATCH: Fix tenant isolation context propagation

PHASE 2 — DATA INTEGRITY (Revenue + Invoice + Accounting)
├─ BUG-001 PATCH: Remove auto-Revenue creation from payments
├─ BUG-002 PATCH: Fix JournalEntry unique constraint for reversals
├─ BUG-004 PATCH: Recalculate Invoice.remainingAmount on edit
├─ BUG-003 PATCH: Add field whitelist to CostRecord.update()
└─ BUG-006 PATCH: Pass transaction to AuditService

PHASE 3 — DATA AVAILABILITY (Empty Lists + Cache)
├─ BUG-007 PATCH: Fix ImportService batch error handling
├─ BUG-009 PATCH: Remove duplicate parent fetch in WBS
└─ RCA-TENANT PATCH: Backfill companyId + verify context

PHASE 4 — PERFORMANCE & POLISH
├─ PERF-001 PATCH: Add pagination limits
├─ PERF-002 PATCH: Optimize WBS tree assembly
├─ PERF-003 PATCH: Merge dashboard queries
└─ SEC-CSRF PATCH: Add rate limit + formula injection prevention
```

---

## PHASE 1 — SECURITY HOTFIX

### ⚠️ PATCH #1: SEC-001 — Role Bypass via JWT Metadata

| Field | Value |
|---|---|
| **PATCH_ID** | SEC-001 |
| **Bug ID** | BUG-005 / SEC-001 |
| **Severity** | 🔴 CRITICAL |
| **Risk Level** | 🔴 CRITICAL — Full RBAC bypass |
| **Data Loss Risk** | 🟡 MEDIUM — No direct data loss, but compromises access control |
| **Reproducible?** | ✅ YES — Exact reproduction path |
| **Migration Needed?** | ❌ NO — Code only, no schema change |
| **Safe Hotfix?** | ✅ YES — Atomic middleware change |
| **Estimated Impact** | All authenticated users — scope: HIGH |
| **Estimated Regression Risk** | 🟡 LOW — Explicit DB read, fail-safe behavior |
| **Dependencies** | None |
| **Recommended Order** | **MUST FIX FIRST** — Privilege escalation active now |

**Evidence:**
- Source: `proxy.ts:47` — `const role = user.user_metadata?.role || 'VIEWER'`
- Exploit: `supabase.auth.updateUser({ data: { role: 'SUPER_ADMIN' } })`
- Result: Attacker bypasses all RBAC checks, becomes admin

**Rollback Plan:**
```bash
git revert <commit-hash>  # Restore proxy.ts to read from metadata
# No data corruption — safe rollback
```

**Backward Compatibility:** ✅ COMPATIBLE
- Changes only authentication layer
- All subsequent requests use correct role from DB
- No API changes

---

### ⚠️ PATCH #2: SEC-003 — Hardcoded Admin Email Whitelist

| Field | Value |
|---|---|
| **PATCH_ID** | SEC-003 |
| **Bug ID** | SEC-003 |
| **Severity** | 🔴 CRITICAL |
| **Risk Level** | 🔴 CRITICAL — Unauthorized admin access |
| **Data Loss Risk** | 🟢 NONE |
| **Reproducible?** | ✅ YES — Any user registering with hardcoded emails |
| **Migration Needed?** | ❌ NO — Config only |
| **Safe Hotfix?** | ✅ YES — Simple env variable replacement |
| **Estimated Impact** | Auth sync route — scope: MEDIUM |
| **Estimated Regression Risk** | 🟢 NONE — Only affects initial admin assignment |
| **Dependencies** | None |
| **Recommended Order** | **2ND** — After SEC-001 |

**Evidence:**
- Source: `app/api/auth/sync/route.ts:51-54`
- Hardcoded: `admin@construction.com`, `amin123@gmail.com`, `xuandai0229@gmail.com`
- Scope: Checked on EVERY user sync — these emails always get SUPER_ADMIN

**Rollback Plan:**
```bash
git revert <commit-hash>  # Restore hardcoded whitelist
.env.local: Remove INITIAL_ADMIN_EMAIL
```

**Backward Compatibility:** ✅ COMPATIBLE (with env setup)
- Must set `.env.local`: `INITIAL_ADMIN_EMAIL=<real-admin-email>`
- Existing admins remain — only affects new user syncs

---

### ⚠️ PATCH #3: SEC-002 — Tenant Isolation Context Broken

| Field | Value |
|---|---|
| **PATCH_ID** | SEC-002 |
| **Bug ID** | SEC-002 / RCA-001 / RCA-002 |
| **Severity** | 🔴 CRITICAL |
| **Risk Level** | 🔴 CRITICAL — All companies see each other's data |
| **Data Loss Risk** | 🟠 HIGH — **READ ONLY** but data visibility is critical |
| **Reproducible?** | ✅ YES — Create Company A + Company B projects, log as B, see A's projects |
| **Migration Needed?** | ✅ YES — **BEFORE** deploying this patch |
| **Safe Hotfix?** | ✅ CONDITIONAL — Requires backfill first |
| **Estimated Impact** | ALL API routes — scope: CRITICAL |
| **Estimated Regression Risk** | 🟠 HIGH — Many services depend on tenant context |
| **Dependencies** | **REQUIRES:** Backfill `companyId` on all records first |
| **Recommended Order** | **3RD** (after SEC-001, SEC-003) — **HIGH RISK** |

**Evidence:**
- Source: `lib/prisma.ts:78-84` — `require('next/headers')` broken in Next.js 15+
- Result: `tenantId` always `undefined` → all tenant filters skipped
- Proof: RCA-001 shows projects created without `companyId`

**Root Cause:**
```typescript
// BROKEN:
const { headers } = require('next/headers');
tenantId = headers().get('x-company-id') || undefined;
// In Next.js 15+ async, headers() may return Promise, not value
// tenantId becomes undefined or Promise object
```

**Migration Needed:**
```sql
-- 1. BACKUP database first (Supabase point-in-time recovery)
-- 2. Assign companyId to all records from their project
UPDATE "CostRecord" cr SET "companyId" = p."companyId" 
  FROM "Project" p WHERE cr."projectId" = p.id AND cr."companyId" IS NULL;

UPDATE "Invoice" i SET "companyId" = p."companyId" 
  FROM "Project" p WHERE i."projectId" = p.id AND i."companyId" IS NULL;

UPDATE "WBSItem" w SET "companyId" = p."companyId" 
  FROM "Project" p WHERE w."projectId" = p.id AND w."companyId" IS NULL;

-- 3. Verify coverage
SELECT COUNT(*) FROM "CostRecord" WHERE "companyId" IS NULL;
-- Should return 0
```

**Rollback Plan:**
```bash
# Database rollback (Supabase point-in-time recovery)
git revert <commit-hash>  # If tenant filtering added prematurely
# Services will use explicit companyId params — no code regression
```

**Backward Compatibility:** ⚠️ BREAKING if backfill incomplete
- **MUST backfill first** — any record without `companyId` becomes invisible after fix
- **No API changes** — still read from header
- **Service layer changes** — pass `companyId` explicitly to each service

---

## PHASE 2 — DATA INTEGRITY

### ⚠️ PATCH #4: BUG-001 — Revenue Double-Counted in Payments

| Field | Value |
|---|---|
| **PATCH_ID** | BUG-001 |
| **Bug ID** | BUG-001 / DLR-001 |
| **Severity** | 🔴 CRITICAL |
| **Risk Level** | 🔴 CRITICAL — Financial data corruption |
| **Data Loss Risk** | 🔴 IMMEDIATE — Revenue systematically overstated |
| **Reproducible?** | ✅ YES — Exact steps: Create invoice → payment → check dashboard |
| **Migration Needed?** | ✅ YES — Data cleanup required |
| **Safe Hotfix?** | ✅ YES — Remove code lines only |
| **Estimated Impact** | Dashboard KPI + financial reports — scope: CRITICAL |
| **Estimated Regression Risk** | 🟢 NONE — Only removes auto-creation |
| **Dependencies** | None (independent) |
| **Recommended Order** | **4TH** (after SEC patches) — **DATA CRITICAL** |

**Evidence:**
- Source: `services/revenue.service.ts:123-134` — Auto-creates Revenue on payment
- Reproduction: Invoice 100M → Payment 100M → Dashboard shows 200M (should be 100M)
- Scope: Every payment creates duplicate revenue entry

**Rollback Plan:**
```bash
git revert <commit-hash>  # Restore auto-revenue creation
# Undo data cleanup (restore deleted revenues from backup)
```

**Data Repair (BEFORE removing code):**
```sql
-- Identify duplicate revenues (auto-created from payments)
SELECT r.id, r.amount, r."invoiceId", r."projectId"
FROM "Revenue" r
WHERE r."invoiceId" IS NOT NULL AND r."deletedAt" IS NULL;

-- Soft-delete them (reversible)
UPDATE "Revenue"
SET "deletedAt" = NOW(), "deletedById" = '<system-user>'
WHERE "invoiceId" IS NOT NULL AND "deletedAt" IS NULL;

-- Verify totals match invoice sums
SELECT p."projectId", 
  SUM(i.amount) as total_invoice_amount,
  SUM(CASE WHEN r."invoiceId" IS NULL THEN r.amount ELSE 0 END) as direct_revenue
FROM "Project" p
LEFT JOIN "Invoice" i ON i."projectId" = p.id
LEFT JOIN "Revenue" r ON r."projectId" = p.id AND r."deletedAt" IS NULL
GROUP BY p."projectId";
```

**Backward Compatibility:** ✅ COMPATIBLE
- API endpoints unchanged
- Only internal logic — remove auto-creation
- Payments still create Payment + PostingEngine records (correct)

---

### ⚠️ PATCH #5: BUG-002 — JournalEntry Unique Constraint Breaks Reversals

| Field | Value |
|---|---|
| **PATCH_ID** | BUG-002 |
| **Bug ID** | BUG-002 / DLR-006 |
| **Severity** | 🔴 CRITICAL |
| **Risk Level** | 🔴 CRITICAL — Accounting engine failure |
| **Data Loss Risk** | 🔴 IMMEDIATE — Cost records can't be deleted, ledger locked |
| **Reproducible?** | ✅ YES — Create cost → approve → post → delete → throws P2002 |
| **Migration Needed?** | ✅ YES — Add `isReversal` field + migrate existing reversals |
| **Safe Hotfix?** | ✅ YES — Schema extension (additive) |
| **Estimated Impact** | Cost deletion + accounting reversal — scope: HIGH |
| **Estimated Regression Risk** | 🟡 LOW — New field doesn't affect existing code paths |
| **Dependencies** | PATCH-BUG-001 (independent) |
| **Recommended Order** | **5TH** (after BUG-001) — **BLOCKING DELETIONS** |

**Evidence:**
- Source: `lib/accounting/postingEngine.ts:210-221`
- Error: `P2002: Unique constraint violation (sourceType, sourceId, deletedAt)`
- Reproduction: Attempt soft-delete of POSTED cost → transaction rolls back

**Schema Change:**
```prisma
model JournalEntry {
  ...
  isReversal   Boolean  @default(false)
  @@unique([sourceType, sourceId, isReversal])  // Changed from @@unique([sourceType, sourceId, deletedAt])
}
```

**Migration:**
```bash
npx prisma migrate dev --name add_journal_reversal_flag
```

**Rollback Plan:**
```bash
npx prisma migrate resolve --rolled-back add_journal_reversal_flag
git revert <commit-hash>
# All newly created reversals will fail (unique constraint violated) — acceptable
```

**Backward Compatibility:** ✅ COMPATIBLE (with migration)
- Additive schema change — no breaking API changes
- Existing code paths unaffected
- New reversal logic uses `isReversal: true`

---

### ⚠️ PATCH #6: BUG-004 — Invoice.remainingAmount Drifts on Edit

| Field | Value |
|---|---|
| **PATCH_ID** | BUG-004 |
| **Bug ID** | BUG-004 / DLR-002 |
| **Severity** | 🔴 CRITICAL |
| **Risk Level** | 🔴 CRITICAL — Financial debt tracking broken |
| **Data Loss Risk** | 🔴 IMMEDIATE — Incorrect amounts recorded |
| **Reproducible?** | ✅ YES — Create invoice → payment → edit amount → check remainingAmount |
| **Migration Needed?** | ✅ YES — Data repair required |
| **Safe Hotfix?** | ✅ YES — Logic fix only |
| **Estimated Impact** | Invoice edit + financial reports — scope: HIGH |
| **Estimated Regression Risk** | 🟢 NONE — Only affects update path |
| **Dependencies** | None (independent) |
| **Recommended Order** | **6TH** (after BUG-002) |

**Evidence:**
- Source: `services/revenue.service.ts:190-208`
- Reproduction: Invoice 100M → Payment 50M (remaining=50M) → Edit invoice to 150M (remaining still 50M, should be 100M)
- Root Cause: No recalculation on amount edit

**Rollback Plan:**
```bash
git revert <commit-hash>
# No data corruption — logic only, rollback safe
```

**Data Repair:**
```sql
-- Recalculate all drifted remainingAmounts
UPDATE "Invoice"
SET "remainingAmount" = GREATEST(0, amount - "paidAmount")
WHERE "deletedAt" IS NULL
  AND "remainingAmount" != GREATEST(0, amount - "paidAmount");

-- Verify fix
SELECT id, amount, "paidAmount", "remainingAmount",
       GREATEST(0, amount - "paidAmount") as expected
FROM "Invoice"
WHERE "deletedAt" IS NULL
  AND "remainingAmount" != GREATEST(0, amount - "paidAmount");
```

**Backward Compatibility:** ✅ COMPATIBLE
- API unchanged
- Service method signature unchanged
- Only internal calculation logic changed

---

### ⚠️ PATCH #7: BUG-003 — CostRecord.update() Unrestricted Field Overwrite

| Field | Value |
|---|---|
| **PATCH_ID** | BUG-003 |
| **Bug ID** | BUG-003 / SEC-005 |
| **Severity** | 🔴 CRITICAL |
| **Risk Level** | 🔴 CRITICAL — Security + Data integrity |
| **Data Loss Risk** | 🟡 MEDIUM — Attacker can reassign costs to wrong project/WBS |
| **Reproducible?** | ✅ YES — Send `{ workflowStatus: "POSTED" }` in update payload |
| **Migration Needed?** | ❌ NO — Code only |
| **Safe Hotfix?** | ✅ YES — Add field whitelist |
| **Estimated Impact** | Cost update endpoints — scope: MEDIUM |
| **Estimated Regression Risk** | 🟡 MEDIUM — May break unauthorized field updates (intentional) |
| **Dependencies** | None (independent) |
| **Recommended Order** | **7TH** (after BUG-004) |

**Evidence:**
- Source: `services/cost.service.ts:150-157` — Raw spread without whitelist
- Exploit: `{ workflowStatus: "POSTED", approvalStatus: "APPROVED", wbsId: "other-wbs" }`
- Result: Bypasses workflow, reassigns cost

**Rollback Plan:**
```bash
git revert <commit-hash>
# No data corruption — logic only
# If clients used restricted fields, they will break (intentional)
```

**Backward Compatibility:** ⚠️ POTENTIAL BREAKING
- Any client sending unauthorized fields will be rejected
- Allowed fields: `amount`, `costType`, `supplier`, `note`, `status`, `quantity`, `unitPrice`, `date`
- Prevent fields: `projectId`, `wbsId`, `requestId`, `workflowStatus`, `approvalStatus`

---

### ⚠️ PATCH #8: BUG-006 — AuditService Uses Global Prisma Inside Transactions

| Field | Value |
|---|---|
| **PATCH_ID** | BUG-006 |
| **Bug ID** | BUG-006 / DLR-005 |
| **Severity** | 🔴 CRITICAL |
| **Risk Level** | 🟠 HIGH — Audit trail corruption |
| **Data Loss Risk** | 🔴 IMMEDIATE — Audit records changes that never happened |
| **Reproducible?** | ✅ YES — Transaction rollback during concurrent update |
| **Migration Needed?** | ❌ NO — Code only |
| **Safe Hotfix?** | ✅ YES — Accept transaction parameter |
| **Estimated Impact** | All mutation services (cost, revenue, wbs, project) — scope: HIGH |
| **Estimated Regression Risk** | 🟢 NONE — Backward compatible (optional tx param) |
| **Dependencies** | PATCH-BUG-003 (independent) |
| **Recommended Order** | **8TH** (after BUG-003) |

**Evidence:**
- Source: `services/audit.service.ts` called from within `$transaction` blocks
- Problem: AuditLog uses global `prisma` → commits immediately
- Result: Rollback doesn't affect audit → false audit records
- Reproduction: Concurrent update → version conflict → first user's audit logs a failed change

**Rollback Plan:**
```bash
git revert <commit-hash>
# Audit logs may become inconsistent after rollback (acceptable)
```

**Backward Compatibility:** ✅ COMPATIBLE
- `tx` parameter is optional
- Existing code still works (uses global prisma)
- New code: pass `tx` to ensure atomicity

---

## PHASE 3 — DATA AVAILABILITY

### ⚠️ PATCH #9: BUG-007 — ImportService Batch Error Handling

| Field | Value |
|---|---|
| **PATCH_ID** | BUG-007 |
| **Bug ID** | BUG-007 / DLR-003 |
| **Severity** | 🔴 CRITICAL |
| **Risk Level** | 🟠 HIGH — Silent data loss on import errors |
| **Data Loss Risk** | 🟠 HIGH — Rows appear imported but are rolled back |
| **Reproducible?** | ✅ YES — Import 500 rows, one invalid wbsId mid-batch |
| **Migration Needed?** | ❌ NO — Code only |
| **Safe Hotfix?** | ✅ YES — Validate first, batch insert |
| **Estimated Impact** | Bulk import feature — scope: MEDIUM |
| **Estimated Regression Risk** | 🟡 MEDIUM — Import behavior changes (more strict validation) |
| **Dependencies** | None (independent) |
| **Recommended Order** | **9TH** (after Phase 2 fixes) |

**Evidence:**
- Source: `services/import.service.ts:15-40`
- Problem: `try/catch` inside transaction, PostgreSQL aborts all commands after error
- Scenario: 500 rows → row #247 invalid → `results.success` reports 500 but 0 actually inserted
- Root Cause: Error state in PostgreSQL transaction continues to next queries but all fail silently

**Rollback Plan:**
```bash
git revert <commit-hash>
# Import reverts to old behavior (may lose data, but predictable)
```

**Backward Compatibility:** ✅ COMPATIBLE
- API endpoint unchanged
- Response format same: `{ success, failed, errors }`
- Only internal batching logic changed (validation-first approach)

---

### ⚠️ PATCH #10: BUG-009 — WBSService Double-Fetches Parent

| Field | Value |
|---|---|
| **PATCH_ID** | BUG-009 |
| **Bug ID** | BUG-009 |
| **Severity** | 🟡 MEDIUM |
| **Risk Level** | 🟢 LOW — Performance, not security/data loss |
| **Data Loss Risk** | 🟢 NONE |
| **Reproducible?** | ✅ YES — Read code: lines 283 and 290 are identical queries |
| **Migration Needed?** | ❌ NO — Code only |
| **Safe Hotfix?** | ✅ YES — Reuse first fetch |
| **Estimated Impact** | WBS creation — scope: LOW (performance only) |
| **Estimated Regression Risk** | 🟢 NONE — Same result, fewer queries |
| **Dependencies** | None (independent) |
| **Recommended Order** | **10TH** (after Phase 2 fixes) |

**Evidence:**
- Source: `services/wbs.service.ts:64-74`
- Problem: Line 283 fetches parent for validation, line 290 fetches again for level calculation
- Result: 2x DB calls for 1 parent lookup

**Rollback Plan:**
```bash
git revert <commit-hash>
# No risk — performance only
```

**Backward Compatibility:** ✅ COMPATIBLE
- Same result, just faster

---

## PHASE 4 — PERFORMANCE & POLISH

### ⚠️ PATCH #11: CSV Export — Formula Injection + UTF-8 BOM

| Field | Value |
|---|---|
| **PATCH_ID** | CSV-INJECT |
| **Bug ID** | SEC-008 / BUG-011 |
| **Severity** | 🟡 MEDIUM |
| **Risk Level** | 🟠 HIGH — Formula injection + encoding issues |
| **Data Loss Risk** | 🟢 NONE |
| **Reproducible?** | ✅ YES — Supplier name `=HYPERLINK(...)` exports and opens in Excel |
| **Migration Needed?** | ❌ NO — Code only |
| **Safe Hotfix?** | ✅ YES — Add sanitization + BOM |
| **Estimated Impact** | CSV export feature — scope: MEDIUM |
| **Estimated Regression Risk** | 🟢 NONE — Only adds safety prefixes |
| **Dependencies** | None (independent) |
| **Recommended Order** | **11TH** (polish phase) |

**Evidence:**
- Source: `lib/export.ts:25`
- Problem: No sanitization for `=`, `+`, `-`, `@` prefixes
- Reproduction: Create supplier `=HYPERLINK(...)` → export CSV → open in Excel → formula executes
- Secondary: No UTF-8 BOM → Vietnamese characters display as garbage in Excel

**Rollback Plan:**
```bash
git revert <commit-hash>
# No risk — export format only
```

**Backward Compatibility:** ✅ COMPATIBLE
- CSV format still valid
- Only adds safety prefixes to dangerous fields

---

## SUMMARY TABLE

| Phase | Patch | Severity | Data Risk | Safe? | Migration | Order |
|---|---|---|---|---|---|---|
| 1 | SEC-001 | 🔴 CRITICAL | 🟡 MEDIUM | ✅ YES | ❌ NO | 1 |
| 1 | SEC-003 | 🔴 CRITICAL | 🟢 NONE | ✅ YES | ❌ NO (env) | 2 |
| 1 | SEC-002 | 🔴 CRITICAL | 🟠 HIGH | ✅ CONDITIONAL | ✅ YES | 3 |
| 2 | BUG-001 | 🔴 CRITICAL | 🔴 IMMEDIATE | ✅ YES | ✅ YES | 4 |
| 2 | BUG-002 | 🔴 CRITICAL | 🔴 IMMEDIATE | ✅ YES | ✅ YES | 5 |
| 2 | BUG-004 | 🔴 CRITICAL | 🔴 IMMEDIATE | ✅ YES | ✅ YES | 6 |
| 2 | BUG-003 | 🔴 CRITICAL | 🟡 MEDIUM | ✅ YES | ❌ NO | 7 |
| 2 | BUG-006 | 🔴 CRITICAL | 🔴 IMMEDIATE | ✅ YES | ❌ NO | 8 |
| 3 | BUG-007 | 🔴 CRITICAL | 🟠 HIGH | ✅ YES | ❌ NO | 9 |
| 3 | BUG-009 | 🟡 MEDIUM | 🟢 NONE | ✅ YES | ❌ NO | 10 |
| 4 | CSV-INJECT | 🟡 MEDIUM | 🟢 NONE | ✅ YES | ❌ NO | 11 |

---

## DEPLOYMENT STRATEGY

### Pre-Deployment Checklist (ALL PATCHES)
- [ ] Backup database (Supabase point-in-time recovery enabled)
- [ ] Run `npx tsc --noEmit` — no TypeScript errors
- [ ] Run `npx prisma validate` — schema valid
- [ ] Run `npm run lint` — no lint errors
- [ ] Run unit tests: `npm run test:unit`

### Per-Patch Checklist
1. **Code review** — security + data integrity focus
2. **Migration test** (if applicable) — run on staging DB copy
3. **Local test** — create/edit/delete flows
4. **Integration test** — relevant test suite
5. **Staging deployment** — smoke test
6. **Production deployment** — during low-traffic window
7. **Monitor** — logs for new error patterns (24 hours)
8. **Rollback plan** — keep previous version ready

### Post-Phase Milestones
- **After Phase 1:** Monitor auth logs for privilege escalation attempts
- **After Phase 2:** Run data repair SQL scripts, verify financial totals
- **After Phase 3:** Monitor import success rates, verify list pagination
- **After Phase 4:** Performance metrics baseline

---

## KNOWN DEFERRED ISSUES

| Issue | Reason | Action |
|---|---|---|
| ProjectStatus enum (ACTIVE/IN_PROGRESS) | Requires data migration | Defer to separate refactor |
| useCreateRevenueMutation silent fail | Low priority, straightforward fix | Add after PHASE 2 |
| erpStore.init() race condition | Requires store refactor | Defer to separate optimization |
| FiscalPeriod overlap validation | Low impact | Defer to later phase |
| Contract/PO missing soft-delete | DLR-007 — data orphan risk | **INCLUDE in DLR-007 follow-up** |
| canDo() require() per call | Performance issue | Defer to PHASE 4 |

---

## NEXT STEP

**→ Proceed to: PATCH_SEC_001.md**  
Deep analysis of PATCH #1 including exact reproduction, exact root cause, safe patch plan, and tests required.

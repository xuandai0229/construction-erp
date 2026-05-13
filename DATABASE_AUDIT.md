# DATABASE AUDIT — Construction ERP
**Date:** 2026-05-13 | **Auditor:** Database Reliability Engineer

---

## 1. PRISMA SCHEMA AUDIT

### 1.1 Decimal vs Float — PASS ✅
All monetary fields use `@db.Decimal(18,2)`. No `Float` on money fields. `decimal.js` used in frontend.

### 1.2 Missing Unique Constraints — CRITICAL ❌

| Model | Problem | Risk |
|---|---|---|
| `BudgetRecord` | No unique on `(projectId, wbsId, costType)` | Duplicate budget lines for same WBS+type possible |
| `Revenue` | No unique on `(projectId, wbsId, invoiceId)` when invoiceId is set | Duplicate revenue records from same invoice |
| `WBSItem` | No unique on `(projectId, code)` | Two WBS items with same code in same project |
| `BOQItem` | No unique constraint | Duplicate BOQ items for same WBS |
| `JournalEntry` | `@@unique([sourceType, sourceId, deletedAt])` — **3-way unique includes deletedAt** | Multiple journal entries for same source possible if one is soft-deleted |
| `FiscalPeriod` | `@@unique([companyId, startDate, endDate])` — overlapping periods NOT prevented | Two periods can overlap if dates differ by 1 day |

### 1.3 Dangerous Cascade / Nullable — HIGH ❌

| Issue | Location | Risk |
|---|---|---|
| `Revenue.projectId` has no FK to Project (only via wbs) | Schema line 221 | Orphan revenues if project deleted |
| `CostRecord` has `projectId` AND `wbsId` — both required, but `wbs.projectId` vs `cost.projectId` could diverge | Validated in service but not DB constraint | Data inconsistency possible via direct DB writes |
| `Payment.projectId` is not validated against `invoice.projectId` at DB level | No FK linking them | Payments could be assigned to wrong project |
| `Invoice.remainingAmount` is a **derived field** stored in DB | `revenue.service.ts:35` | Can drift from `amount - paidAmount` over time |
| `PurchaseRequest.wbsId` is nullable | Schema line 360 | PRs without WBS break cost attribution |

### 1.4 Missing Indexes — HIGH ❌

Missing indexes causing full table scans:

```sql
-- CostRecord: no index on (projectId, costType) — used in getAccountingSummary groupBy
-- WBSItem: no index on (projectId, level) — used in WBSService.findByProject orderBy
-- Revenue: no index on (wbsId) alone — only (wbsId, deletedAt) exists, OK
-- BudgetRecord: no composite index on (projectId, costType) — used in groupBy
-- AuditLog: no index on (severity) — could be used in monitoring queries
-- FiscalPeriod: no index on (startDate, endDate, isLocked) — checked on EVERY write
```

Recommended additions:
```prisma
@@index([projectId, costType])        // CostRecord
@@index([startDate, endDate, isLocked]) // FiscalPeriod
@@index([projectId, level, sortOrder]) // WBSItem
@@index([projectId, costType])        // BudgetRecord
```

---

## 2. QUERY AUDIT

### 2.1 Unbounded Queries — CRITICAL ❌

| Location | Query | Issue |
|---|---|---|
| `cost.service.ts:288` | `take: limit ? Number(limit) : 10000` | Default 10k records in memory |
| `revenue.service.ts:163-167` | `take: limit ? Number(limit) : 500` | 500 invoices without pagination |
| `revenue.service.ts:171-177` | `take: limit ? Number(limit) : 500` | 500 revenues without pagination |
| `revenue.service.ts:181-187` | `take: limit ? Number(limit) : 500` | 500 payments without pagination |
| `wbs.service.ts:11-14` | `findMany` with no `take` | ALL WBS items fetched — no limit |
| `app/api/payments/route.ts:12-18` | `findMany` with no `take` | ALL payments fetched |

### 2.2 N+1 Query Risk — MEDIUM ❌

- `ImportService.importCosts()`: executes `tx.costRecord.create()` in a **for loop** inside a transaction — N individual INSERTs instead of batch `createMany`. For 1000 rows: 1000 round trips inside transaction → deadlock risk and extreme slowness.

### 2.3 Query Correctness Issues — HIGH ❌

**In `project.service.ts:271-325` (`getAccountingSummary`):**
- Queries `prisma.costRecord.aggregate` with `where: { projectId }` — **does NOT filter `deletedAt: null`**
- The Prisma soft-delete extension handles `findMany/findFirst/count/aggregate` BUT only if `deletedAt` is not overridden
- However, the explicit `where: { projectId }` may **bypass** the extension's auto-filter injection — **soft-deleted costs are included in totals**

**In `dashboard/stats/route.ts:21-25`:**
- `prisma.costRecord.aggregate`, `prisma.revenue.aggregate`, `prisma.invoice.aggregate` — all global aggregates with **no company filter**
- The Prisma extension would inject `companyId` for `findMany` but NOT for `aggregate` on models not in ROOT_TENANT_MODELS
- **Global dashboard shows data from ALL companies**

### 2.4 The `JournalEntry` Unique Constraint Bug — CRITICAL ❌

Schema line 337:
```prisma
@@unique([sourceType, sourceId, deletedAt])
```
Because `deletedAt` is included in the unique key and defaults to `null`:
- A journal entry is created: `(sourceType="COST", sourceId="abc", deletedAt=null)` ✅
- The cost is deleted, journal reversed: old entry gets `deletedAt` set... **wait** — journal entries CANNOT be deleted per the immutability guard
- However, `reverseJournal()` creates a NEW entry with the **same** `sourceType + sourceId` — this **violates the unique constraint** and will throw P2002 on the second reversal attempt

```typescript
// postingEngine.ts:210-220
const newEntry = await tx.journalEntry.create({
  data: {
    sourceType: oldEntry.sourceType,  // Same as original!
    sourceId: oldEntry.sourceId,       // Same as original!
    ...
  }
});
// P2002: unique constraint violation on (sourceType, sourceId, deletedAt)
```

---

## 3. TRANSACTION AUDIT

### 3.1 Missing Transactions — HIGH ❌

| Operation | Location | Risk |
|---|---|---|
| `updateInvoiceApproval` | `revenue.service.ts:257-276` | Update + AuditLog not in transaction |
| `updatePaymentApproval` | `revenue.service.ts:278-296` | Update + AuditLog not in transaction |
| `bulkUpdateInvoiceApproval` | `revenue.service.ts:299-319` | AuditService.log calls inside tx but use global `prisma`, not `tx` |
| WBS `create` | `wbs.service.ts:59-96` | Project check + parent check + create — 3 queries, no transaction |
| WBS `delete` | `wbs.service.ts:138-167` | Child count check + soft delete + audit — no transaction |

### 3.2 `AuditService.log` inside transactions — HIGH ❌

`AuditService.log()` is called inside `prisma.$transaction()` blocks everywhere **but uses the global `prisma` client, not the `tx` transaction parameter**.

If the transaction rolls back, audit logs are still written — **audit trail becomes inconsistent**.
If `AuditService.log` throws, the entire transaction fails — but this is wrapped in no error handler.

### 3.3 Deadlock Risk — HIGH ❌

`ImportService.importCosts()` at `import.service.ts:15-40`:
- One massive transaction for ALL rows
- Each row does a `costRecord.create()` 
- For large imports (1000+ rows), this holds the transaction open for potentially minutes
- Other writers on `costRecord` will deadlock
- **No chunking/batching strategy**

### 3.4 The `seedChartOfAccounts` Race in Posting — MEDIUM ❌

`postingEngine.ts:131`: `await seedChartOfAccounts(tx)` is called inside every transaction.
If two costs are POSTED simultaneously:
- Both transactions call `seedChartOfAccounts`
- Both try to `upsert` the same account codes
- PostgreSQL serializable isolation would prevent this, but default isolation is READ COMMITTED
- **Risk: duplicate account creation attempts causing P2002**

---

## 4. DATA INTEGRITY AUDIT

### 4.1 Invoice `remainingAmount` Drift — CRITICAL ❌

`Invoice.remainingAmount` is a stored derived field. It is updated in `createPayment()` correctly.  
However, `updateInvoice()` (`revenue.service.ts:190-208`) passes raw `updates: any` directly to Prisma without recalculating `remainingAmount`.

An admin editing an invoice's `amount` will NOT update `remainingAmount` → permanent drift.

### 4.2 Revenue Double-Write on Payment — HIGH ❌

`revenue.service.ts:123-134`: Every `createPayment()` creates a new `Revenue` record.  
But `Revenue` records can ALSO be created directly via `/api/revenues`.  

A project can have:
- Revenue from direct entry
- Revenue from payment (auto-created)
- **Double-counting in all revenue aggregations**

### 4.3 Soft-Delete Extension Gap — HIGH ❌

`lib/prisma.ts:4`: `SOFT_DELETE_MODELS` set:
```typescript
const SOFT_DELETE_MODELS = new Set(['user', 'category', 'project', 'task', 'invoice', 'payment', 'costrecord', 'wbsitem', 'revenue', 'budgetrecord']);
```

**NOT included:** `contract`, `purchaseorder`, `purchaserequest`, `subcontract`, `boqitem`, `variationorder`, `siteLog`, `document`

These models have `deletedAt` fields in the schema but the extension does NOT auto-filter them. Soft-deleted records from these models will appear in all queries.

### 4.4 `CostRecord.update()` — Unwhitelisted Field Overwrite — CRITICAL ❌

`cost.service.ts:150-157`:
```typescript
const updated = await tx.costRecord.update({
  where: { id, version: existing.version },
  data: {
    ...data,  // RAW DATA SPREAD — no field whitelist
    date: data.date ? new Date(data.date) : undefined,
    version: { increment: 1 }
  }
});
```

An attacker (or bug) can send `{ projectId: "other-project-id", workflowStatus: "POSTED", approvalStatus: "APPROVED" }` in the update payload and it will be written directly to the database.

---

## 5. STRESS TEST ANALYSIS (Simulated)

| Scenario | Predicted Failure |
|---|---|
| 10k projects list | OK — paginated correctly |
| 100k WBS items per project | FAIL — `findMany` no limit, O(N²) tree assembly |
| 1M cost records, global dashboard | FAIL — full aggregate scan, no partition |
| 100 concurrent payment creates | HIGH RISK — invoice version conflict → 409 cascade |
| Import 5000 rows | FAIL — single giant transaction, probable deadlock/timeout |
| WBS tree with 500 nodes | ~125,000 iterations in assemble() — slow UI |

---

## 6. RECOMMENDATIONS

```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_cost_project_type ON "CostRecord"("projectId", "costType") WHERE "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY idx_fiscal_dates ON "FiscalPeriod"("startDate", "endDate") WHERE "isLocked" = true;
CREATE INDEX CONCURRENTLY idx_wbs_project_level ON "WBSItem"("projectId", "level", "sortOrder") WHERE "deletedAt" IS NULL;

-- Add missing unique constraints
ALTER TABLE "BudgetRecord" ADD CONSTRAINT uq_budget_wbs_type UNIQUE ("projectId", "wbsId", "costType") WHERE "deletedAt" IS NULL;
ALTER TABLE "WBSItem" ADD CONSTRAINT uq_wbs_code UNIQUE ("projectId", "code") WHERE "deletedAt" IS NULL AND "code" IS NOT NULL;
```

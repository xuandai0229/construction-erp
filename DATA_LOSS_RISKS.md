# DATA LOSS RISKS — Construction ERP
**Date:** 2026-05-13 | **Auditor:** Database Reliability Engineer

---

## RISK LEGEND
- 🔴 IMMEDIATE — Data already being lost in production right now
- 🟠 HIGH — Data loss under specific conditions that occur regularly
- 🟡 MEDIUM — Data loss under rare but plausible conditions

---

## DLR-001 🔴 IMMEDIATE — Revenue Double-Counting Corrupts All Financial Reports

**What is lost:** Financial accuracy — revenue is systematically overstated  
**When it happens:** Every payment creation  
**Data affected:** `Revenue` table, all KPI aggregates  
**Reversible:** Yes, but requires data cleanup script

**Cleanup query:**
```sql
-- Find duplicate revenues (auto-created from payments)
SELECT r.id, r.amount, r.invoiceId, r."projectId"
FROM "Revenue" r
WHERE r."invoiceId" IS NOT NULL
  AND r."deletedAt" IS NULL;
-- These should be soft-deleted as they duplicate Payment records
```

---

## DLR-002 🔴 IMMEDIATE — `Invoice.remainingAmount` is Corrupted

**What is lost:** Accurate debt tracking — incorrect amount shown as owed  
**When it happens:** When an invoice's `amount` is edited after a payment exists  
**Data affected:** `Invoice.remainingAmount` for any edited invoice  
**Reversible:** Yes — recalculate as `amount - paidAmount`

**Repair query:**
```sql
UPDATE "Invoice"
SET "remainingAmount" = GREATEST(0, amount - "paidAmount")
WHERE "deletedAt" IS NULL
  AND "remainingAmount" != GREATEST(0, amount - "paidAmount");
```

---

## DLR-003 🟠 HIGH — Bulk Import Partial Failure Causes Silent Data Loss

**What is lost:** Rows that appear to succeed in ImportService but are actually rolled back  
**When it happens:** Any import with a validation error mid-batch  
**Data affected:** All imported `CostRecord` rows  
**Reversible:** User must re-import

**Scenario:**
1. User imports 500 cost records
2. Record #247 has an invalid wbsId
3. The `try/catch` inside the transaction catches the error
4. Subsequent inserts fail silently (PostgreSQL aborts all commands after an error within a transaction)
5. `results.success` reports 500, `results.failed` reports 1
6. Transaction commits with 0 actual records inserted (PostgreSQL behavior: aborted transaction commits nothing)
7. User believes 499 records were imported — they were not

---

## DLR-004 🟠 HIGH — Cascade Soft Delete Does Not Restore in Order

**What is lost:** Child records that were soft-deleted independently before project delete  
**When it happens:** Restore project after cascade delete  
**Data affected:** Any child record soft-deleted before project delete

**Scenario:**
1. User soft-deletes WBS item "Foundation" manually (deletedAt = 2026-01-01)
2. User later soft-deletes entire project (cascade sets all to deletedAt = 2026-01-15)
3. User restores project → cascade restore sets all `deletedAt = null`
4. "Foundation" WBS item is now restored even though user intentionally deleted it
5. All cost records linked to "Foundation" reappear

---

## DLR-005 🟠 HIGH — `AuditLog` Records Changes That Never Happened

**What is lost:** Audit trail integrity — rollbacks aren't reflected  
**When it happens:** Any transaction rollback (P2002, P2025, version conflict, network error)  
**Data affected:** `AuditLog` table

**Scenario:**
1. User A and User B both update CostRecord "abc" simultaneously
2. User A's transaction: Update + AuditLog.create() (AuditLog uses global prisma — commits immediately)
3. User B's transaction commits first → User A's transaction fails with version conflict (P2025)
4. User A's transaction rolls back — cost NOT updated
5. But `AuditService.log` ALREADY committed the audit entry saying "User A updated CostRecord abc"
6. Audit trail now shows a change that never happened

---

## DLR-006 🟠 HIGH — `reverseJournal` Fails Silently, Unposted Costs Are "Zombies"

**What is lost:** Financial ledger integrity — reversed costs remain in ledger  
**When it happens:** Deleting a POSTED cost record  
**Data affected:** `JournalEntry`, `TransactionLine`, `CostRecord`

Due to BUG-002 (unique constraint on JournalEntry), `reverseJournal()` throws P2002. The CostService.delete() transaction catches this and rolls back. The cost record is NOT deleted. The user sees "success" or a confusing error.

The cost remains in POSTED state with an unreversed journal entry. The financial ledger cannot be corrected without direct DB intervention.

---

## DLR-007 🟡 MEDIUM — Project Delete Cascade Missing `purchaseOrder`, `contract`, `subcontract`

**What is lost:** Procurement and contract data become orphaned after project delete  
**File:** `project.service.ts:210-238`

The cascade delete (`ProjectService.delete()`) soft-deletes:
- ✅ wbsItems, tasks, budgetRecords, costRecords, invoices, revenues, payments, journalEntries

But does NOT soft-delete:
- ❌ `PurchaseOrder` (still references deleted project)
- ❌ `Contract` (still references deleted project)
- ❌ `Subcontract` (still references deleted project)
- ❌ `BOQItem` (still references deleted project)
- ❌ `VariationOrder` (still references deleted project)

These records remain active and visible in procurement/contract views even though their project is deleted. They also don't have soft-delete extension coverage (SEC-011 adjacent).

**Fix:** Add cascade to `delete()` and `restore()`:
```typescript
await tx.purchaseOrder.updateMany({ where: { projectId: id }, data: { deletedAt: now } });
await tx.contract.updateMany({ where: { projectId: id }, data: { deletedAt: now } });
await tx.subcontract.updateMany({ where: { projectId: id }, data: { deletedAt: now } });
```

---

## DLR-008 🟡 MEDIUM — `CostRecord` Without `companyId` Becomes Invisible

**What is lost:** Cost records become inaccessible (not truly deleted, but invisible)  
**When it happens:** Any cost created while tenant context is broken (i.e., always — SEC-002)

Cost records are created without `companyId` (because the Prisma extension's tenant injection is broken). If the extension is ever fixed, all historical records without `companyId` will be filtered out by `companyId = tenantId` and become invisible.

**Estimated scope:** ALL records created before the tenant fix → potentially millions of records disappear from UI overnight.

**Remediation:** Before fixing SEC-002, run a migration to backfill `companyId` on all records from their project's `companyId`.

---

## DLR-009 🟡 MEDIUM — `FiscalPeriod` Overlapping Dates Lock Wrong Transactions

**What is lost:** Legitimate transactions blocked or wrong period locked  
**When it happens:** If overlapping fiscal periods are created

The schema only prevents exact `(companyId, startDate, endDate)` duplicates. Two overlapping periods (e.g., Jan 1-31 and Jan 15 - Feb 15) can coexist. The `assertPeriodNotLocked()` check uses `findFirst` — it will match the first overlapping locked period, potentially blocking transactions in the non-overlapping range.

---

## SUMMARY — DATA INTEGRITY MATRIX

| Risk ID | Severity | Data Lost | Reversible | Immediate Action |
|---|---|---|---|---|
| DLR-001 | 🔴 IMMEDIATE | Revenue totals | Yes — cleanup script | Run repair SQL |
| DLR-002 | 🔴 IMMEDIATE | Invoice debt amounts | Yes — recalculate | Run repair SQL |
| DLR-003 | 🟠 HIGH | Bulk import data | No — re-import | Fix ImportService |
| DLR-004 | 🟠 HIGH | Intentionally deleted items | Partial | Add restore confirmation |
| DLR-005 | 🟠 HIGH | Audit trail accuracy | No | Pass `tx` to AuditService |
| DLR-006 | 🟠 HIGH | Ledger integrity | Requires DB intervention | Fix BUG-002 first |
| DLR-007 | 🟡 MEDIUM | Procurement/contract orphans | Yes — cascade | Add cascade delete |
| DLR-008 | 🟡 MEDIUM | All historical records (after fix) | Yes — backfill | Backfill companyId |
| DLR-009 | 🟡 MEDIUM | Period lock accuracy | Yes | Add overlap validation |

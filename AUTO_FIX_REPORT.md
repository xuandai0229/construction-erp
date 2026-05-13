# AUTO FIX REPORT — Construction ERP
**Date:** 2026-05-13 | **Mode:** Enterprise-Safe Incremental Patching

---

## FIX PRIORITY ORDER

Fixes are grouped into 3 tiers. Apply Tier 1 before Tier 2. Never apply multiple tiers at once without testing.

**Tier 1 — Data integrity blockers (apply immediately)**
**Tier 2 — Security hardening**
**Tier 3 — Performance + quality**

---

## TIER 1 — DATA INTEGRITY FIXES

---

### FIX-001: Revenue Double-Write on Payment — Remove Auto-Revenue Creation

**Bug:** BUG-001 | **File:** `services/revenue.service.ts`

```diff
// services/revenue.service.ts — inside createPayment()
       const payment = await tx.payment.create({ ... });

       const updatedInvoice = await tx.invoice.updateMany({ ... });
       if (updatedInvoice.count === 0) {
         throw new ApiError(409, "Hóa đơn đã bị thay đổi bởi giao dịch khác.");
       }

-      // Create a revenue record for project tracking
-      await tx.revenue.create({
-        data: {
-          projectId: invoice.projectId,
-          wbsId: invoice.wbsId,
-          invoiceId: invoice.id,
-          amount: amount,
-          date: new Date(),
-          status: "paid" as PaymentStatus,
-          description: `Thanh toán cho hóa đơn ${invoice.invoiceNumber || invoice.id}`
-        }
-      });

       // Posting to Ledger
       await PostingEngine.postPayment(tx, { ... });
```

**Post-fix data repair:**
```sql
-- Soft-delete auto-generated Revenue records from payments
UPDATE "Revenue"
SET "deletedAt" = NOW()
WHERE "invoiceId" IS NOT NULL AND "deletedAt" IS NULL;
```

---

### FIX-002: JournalEntry Unique Constraint — Allow Reversal Entries

**Bug:** BUG-002 | **Files:** `prisma/schema.prisma`, `lib/accounting/postingEngine.ts`

**Step 1 — Schema fix:**
```diff
// prisma/schema.prisma
  model JournalEntry {
    ...
+   isReversal   Boolean  @default(false)
    ...
-   @@unique([sourceType, sourceId, deletedAt])
+   @@unique([sourceType, sourceId, isReversal])
  }
```

**Step 2 — Migration (additive only):**
```bash
npx prisma migrate dev --name add_journal_reversal_flag
```

**Step 3 — PostingEngine fix:**
```diff
// lib/accounting/postingEngine.ts — reverseJournal()
    const newEntry = await tx.journalEntry.create({
      data: {
        projectId: oldEntry.projectId,
        description: `Hủy giao dịch: ${oldEntry.description}`,
        reference: `REV-${oldEntry.reference}`,
        sourceType: oldEntry.sourceType,
        sourceId: oldEntry.sourceId,
        reversalRef: oldEntry.id,
        isPosted: true,
+       isReversal: true,
      }
    });
```

---

### FIX-003: CostRecord.update() — Add Field Whitelist

**Bug:** BUG-003 / SEC-005 | **File:** `services/cost.service.ts`

```diff
// services/cost.service.ts — update()
     return prisma.$transaction(async (tx) => {
       const updated = await tx.costRecord.update({
         where: { id, version: existing.version },
         data: {
-          ...data,
-          date: data.date ? new Date(data.date) : undefined,
+          // Explicit whitelist — no field injection possible
+          ...(data.amount    !== undefined && { amount:    round(Number(data.amount)) }),
+          ...(data.costType  !== undefined && { costType:  data.costType }),
+          ...(data.supplier  !== undefined && { supplier:  data.supplier }),
+          ...(data.note      !== undefined && { note:      data.note }),
+          ...(data.status    !== undefined && { status:    data.status }),
+          ...(data.quantity  !== undefined && { quantity:  data.quantity }),
+          ...(data.unitPrice !== undefined && { unitPrice: data.unitPrice }),
+          ...(data.date      !== undefined && { date:      new Date(data.date) }),
           version: { increment: 1 }
         }
       });
```

---

### FIX-004: Invoice remainingAmount Recalculation on Edit

**Bug:** BUG-004 | **File:** `services/revenue.service.ts`

```diff
// services/revenue.service.ts — updateInvoice()
-  static async updateInvoice(id: string, updates: any) {
-    const existing = await prisma.invoice.findUnique({ where: { id } });
-    if (!existing) throw new ApiError(404, "Không tìm thấy hóa đơn");
-    return prisma.$transaction(async (tx) => {
-      const updated = await tx.invoice.update({ where: { id }, data: updates });
+  static async updateInvoice(id: string, updates: any, userId?: string) {
+    const existing = await prisma.invoice.findUnique({ where: { id } });
+    if (!existing) throw new ApiError(404, "Không tìm thấy hóa đơn");
+    
+    // Whitelist only safe fields for update
+    const safeUpdates: any = {};
+    if (updates.invoiceNumber !== undefined) safeUpdates.invoiceNumber = updates.invoiceNumber;
+    if (updates.dueDate       !== undefined) safeUpdates.dueDate       = updates.dueDate ? new Date(updates.dueDate) : null;
+    if (updates.note          !== undefined) safeUpdates.note          = updates.note;
+    if (updates.contractId    !== undefined) safeUpdates.contractId    = updates.contractId;
+    
+    // Recalculate remainingAmount if amount changed
+    if (updates.amount !== undefined) {
+      const newAmount = round(Number(updates.amount));
+      safeUpdates.amount          = newAmount;
+      safeUpdates.remainingAmount = Math.max(0, round(newAmount - Number(existing.paidAmount)));
+    }
+    
+    return prisma.$transaction(async (tx) => {
+      const updated = await tx.invoice.update({
+        where: { id, version: existing.version },
+        data: { ...safeUpdates, version: { increment: 1 } }
+      });
       await AuditService.log({
+        userId,
         action: "UPDATE", entity: "Invoice", entityId: id,
-        oldData: existing, newData: updated
-      });
+        oldData: existing, newData: updated,
+      }, tx);  // Pass tx to ensure atomic audit
       return updated;
     });
   }
```

**Post-fix data repair:**
```sql
-- Recalculate all drifted remainingAmounts
UPDATE "Invoice"
SET "remainingAmount" = GREATEST(0, amount - "paidAmount")
WHERE "deletedAt" IS NULL
  AND "remainingAmount" != GREATEST(0, amount - "paidAmount");
```

---

### FIX-005: AuditService — Accept Transaction Parameter

**Bug:** BUG-006 | **File:** `services/audit.service.ts`

```diff
// services/audit.service.ts
+import { Prisma } from '@prisma/client';
+type PrismaTx = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

  export class AuditService {
-   static async log(params: AuditLogParams) {
-     await prisma.auditLog.create({ data: { ... } });
+   static async log(params: AuditLogParams, tx?: PrismaTx) {
+     const db = tx || prisma;
+     try {
+       await db.auditLog.create({ data: { ... } });
+     } catch (err) {
+       // Never let audit logging crash the main transaction
+       LoggerService.error('AuditLog write failed', { error: err, params });
+     }
    }
  }
```

Then update ALL call sites to pass `tx` when inside a transaction:
```typescript
// cost.service.ts, revenue.service.ts, wbs.service.ts, project.service.ts
await AuditService.log({ ... }, tx);
```

---

### FIX-006: WBS double-fetch parent — Dedup Query

**Bug:** BUG-009 | **File:** `services/wbs.service.ts`

```diff
// wbs.service.ts — create()
+   let parent: WBSItem | null = null;
    if (data.parentId) {
-     const parent = await prisma.wBSItem.findUnique({ where: { id: data.parentId } });
+     parent = await prisma.wBSItem.findUnique({ where: { id: data.parentId } });
      if (!parent) throw new ApiError(404, "Không tìm thấy hạng mục cha");
      if (parent.projectId !== data.projectId) throw new ApiError(400, "Hạng mục cha phải thuộc cùng một dự án");
    }

    let level = 0;
    if (data.parentId) {
-     const parent = await prisma.wBSItem.findUnique({ where: { id: data.parentId } });  // REMOVED
      level = (parent?.level ?? 0) + 1;
    }
```

---

### FIX-007: ImportService — Chunked Batch + Row Validation

**Bug:** BUG-007 / DLR-003 | **File:** `services/import.service.ts`

```typescript
// services/import.service.ts — full replacement
import { prisma } from "@/lib/prisma";
import { LoggerService } from "./logger.service";
import { round } from "@/lib/math";

const CHUNK_SIZE = 100;

export class ImportService {
  static async importCosts(projectId: string, data: any[], userId?: string) {
    LoggerService.info("Starting batch cost import", { projectId, recordCount: data.length });

    // 1. Validate all rows BEFORE any DB writes
    const validated: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row.wbsId || typeof row.wbsId !== 'string') {
        errors.push(`Row ${i + 1}: missing or invalid wbsId`);
        continue;
      }
      const amount = Number(row.amount);
      if (!row.amount || isNaN(amount) || amount <= 0) {
        errors.push(`Row ${i + 1}: invalid amount "${row.amount}"`);
        continue;
      }
      validated.push({
        projectId,
        wbsId: row.wbsId,
        amount: round(amount),
        costType: row.costType || 'material',
        note: row.note || 'Imported',
        date: row.date ? new Date(row.date) : new Date(),
        createdById: userId,
        workflowStatus: 'DRAFT',
        approvalStatus: 'DRAFT',
        version: 1,
      });
    }

    // 2. Batch insert in chunks (avoids single huge transaction)
    let success = 0;
    for (let i = 0; i < validated.length; i += CHUNK_SIZE) {
      const chunk = validated.slice(i, i + CHUNK_SIZE);
      await prisma.costRecord.createMany({ data: chunk, skipDuplicates: true });
      success += chunk.length;
      LoggerService.info(`Import chunk complete: ${success}/${validated.length}`);
    }

    LoggerService.info("Import completed", { success, failed: errors.length });
    return { success, failed: errors.length, errors };
  }
}
```

---

### FIX-008: CSV Export — BOM + Formula Injection Prevention

**File:** `lib/export.ts`

```diff
 export function exportToCSV(data: any[], filename: string) {
   if (data.length === 0) return;

+  const sanitizeCell = (val: any): string => {
+    const str = String(val ?? '');
+    // Prevent CSV formula injection
+    if (['=', '+', '-', '@', '\t', '\r'].some(c => str.startsWith(c))) {
+      return `"'${str.replace(/"/g, '""')}"`;
+    }
+    return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : String(val ?? '');
+  };

   const headers = Object.keys(data[0]);
   const csvContent = [
     headers.join(','),
-    ...data.map(row => headers.map(h => {
-      const val = row[h];
-      return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
-    }).join(','))
+    ...data.map(row => headers.map(h => sanitizeCell(row[h])).join(','))
   ].join('\n');

-  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
+  const BOM = '\uFEFF';
+  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
```

---

## TIER 2 — SECURITY FIXES

---

### FIX-009: Read Role from DB, Not JWT Metadata

**Bug:** SEC-001 | **File:** `proxy.ts`

```diff
   if (user) {
     requestHeaders.set('x-user-id', user.id);
-    const role = user.user_metadata?.role || 'VIEWER';
-    const companyId = user.user_metadata?.companyId || '';
-    requestHeaders.set('x-user-role', role);
-    if (companyId) requestHeaders.set('x-company-id', companyId);
+    // Role must come from DB, not user-controlled metadata
+    try {
+      const { prisma } = await import('@/lib/prisma');
+      const dbUser = await prisma.user.findUnique({
+        where: { id: user.id },
+        select: { role: true, companyId: true }
+      });
+      const role = dbUser?.role || 'VIEWER';
+      const companyId = dbUser?.companyId || '';
+      requestHeaders.set('x-user-role', role);
+      if (companyId) requestHeaders.set('x-company-id', companyId);
+    } catch (e) {
+      // Fail closed: if DB lookup fails, treat as unauthenticated
+      console.error('[Middleware] DB role lookup failed:', e);
+      return new NextResponse(JSON.stringify({ error: 'Auth service unavailable' }), { status: 503 });
+    }
   }
```

---

### FIX-010: Remove Hardcoded Admin Email Whitelist

**Bug:** SEC-003 | **File:** `app/api/auth/sync/route.ts`

```diff
     const isInitialAdmin = userCount === 0 || 
-                          email === 'admin@construction.com' || 
-                          email === 'amin123@gmail.com' || 
-                          email === 'xuandai0229@gmail.com';
+                          email === process.env.INITIAL_ADMIN_EMAIL;
```

Add to `.env.local`:
```
INITIAL_ADMIN_EMAIL=your-admin@company.com
```

---

### FIX-011: Explicit Tenant Filtering in Service Layer

**Bug:** SEC-002 (Prisma extension approach is broken) | **Multiple files**

Replace the broken Prisma extension tenant injection with explicit `companyId` params in each service method:

```typescript
// Pattern for all findMany operations:
static async findMany(params: { companyId?: string; page?: number; limit?: number; ... }) {
  return prisma.project.findMany({
    where: {
      deletedAt: null,
      ...(params.companyId && { companyId: params.companyId }),
      ...
    },
    ...
  });
}

// API routes extract from verified header:
const companyId = request.headers.get('x-company-id') || undefined;
const result = await ProjectService.findMany({ ...params, companyId });
```

**Before deploying this fix:** Run the backfill migration to assign `companyId` to all existing records:
```sql
-- Backfill project companyId from first non-null related record
-- This must be done project by project based on your data
UPDATE "Project" SET "companyId" = 'YOUR_DEFAULT_COMPANY_ID' WHERE "companyId" IS NULL;
UPDATE "CostRecord" cr SET "companyId" = p."companyId" FROM "Project" p WHERE cr."projectId" = p.id AND cr."companyId" IS NULL;
UPDATE "Invoice" i SET "companyId" = p."companyId" FROM "Project" p WHERE i."projectId" = p.id AND i."companyId" IS NULL;
```

---

## TIER 3 — PERFORMANCE FIXES

---

### FIX-012: Add Pagination Defaults to findByProject

**Bug:** PERF-001 | **File:** `services/cost.service.ts`

```diff
- take: limit ? Number(limit) : 10000,
+ take: Math.min(limit ? Number(limit) : 50, 200),
```

Apply same pattern to `revenue.service.ts` (invoices, revenues, payments).

---

### FIX-013: WBS Tree O(N) Algorithm

**Bug:** PERF-002 | **File:** `services/finance/projectFinance.ts`

Replace the recursive `assemble()` function with the O(N) child-map approach documented in `SCALABILITY_PLAN.md § 2.3`.

---

### FIX-014: Merge getAccountingSummary to Single Promise.all

**Bug:** PERF-003 | **File:** `services/project.service.ts`

```diff
-   const [costsAgg, ...] = await Promise.all([...7 queries...]);
-   const [costsByType, ...] = await Promise.all([...4 queries...]);
-   const overdueCount = await prisma.invoice.count(...);
+   const [costsAgg, budgetsAgg, revenuesAgg, invoicesAgg, wbsCount, taskStats, purchaseOrdersAgg,
+          costsByType, budgetsByType, paidCostsAgg, paidRevenuesAgg, overdueCount] =
+     await Promise.all([
+       // all 12 queries merged into one Promise.all
+     ]);
```

---

## DEPLOYMENT CHECKLIST

Before each tier deployment:
- [ ] Run `npx tsc --noEmit` — no TypeScript errors
- [ ] Run `npx prisma validate` — schema valid
- [ ] Run unit tests: `npx jest tests/unit`
- [ ] Run integration tests: `npx jest tests/integration`
- [ ] Backup database (Supabase point-in-time recovery enabled)
- [ ] Deploy to staging environment first
- [ ] Run smoke test: create project → create WBS → create cost → verify dashboard

After Tier 1 deployment:
- [ ] Run revenue repair SQL (FIX-001)
- [ ] Run remainingAmount repair SQL (FIX-004)
- [ ] Run companyId backfill SQL (before FIX-011 goes live)

---

## BUGS REMAINING (Require Further Investigation)

| Bug | File | Status |
|---|---|---|
| `ProjectStatus` enum semantic duplicates (ACTIVE/IN_PROGRESS) | schema.prisma | Requires data migration — defer |
| `useCreateRevenueMutation` silent fail | useRevenues.ts | Add `if (!res.success) throw` |
| `erpStore.init()` initialized flag set early | erpStore.ts | Refactor init flow |
| `FiscalPeriod` overlapping dates | schema.prisma | Add application-level overlap check |
| Missing soft-delete extension for contract/PO/subcontract | lib/prisma.ts | Add to SOFT_DELETE_MODELS |
| `canDo()` uses require() per call | erpStore.ts | Cache the import at module level |

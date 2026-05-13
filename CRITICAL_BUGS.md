# CRITICAL BUGS — Construction ERP
**Date:** 2026-05-13 | **Auditor:** Principal Software Architect + Senior Security Auditor

Each bug entry contains: Severity | Root Cause | File | Code | Impact | Steps to Reproduce | Fix

---

## BUG-001 🔴 CRITICAL — Revenue Double-Counted in All KPI Reports

**Severity:** CRITICAL — Financial data integrity  
**File:** `services/revenue.service.ts:123-134`

**Code causing bug:**
```typescript
// Inside createPayment() transaction:
await tx.revenue.create({
  data: {
    projectId: invoice.projectId,
    wbsId: invoice.wbsId,
    invoiceId: invoice.id,
    amount: amount,   // <-- Payment amount creates Revenue record
    ...
  }
});
```

**Impact:** Every payment auto-creates a Revenue record. Direct Revenue records also exist. All revenue aggregations double-count income. A project with 1 invoice of 100M VND paid in full shows 200M VND revenue.

**Steps to Reproduce:**
1. Create invoice: 100,000,000 VND
2. Create payment: 100,000,000 VND
3. Check `/api/dashboard/stats?projectId=X`
4. `totalRevenue` = 200,000,000 (double the actual)

**Fix:** Remove the auto-Revenue creation from `createPayment()`. Revenue should only be recorded when explicitly entered, OR use the invoice/payment system as the canonical revenue source and remove direct Revenue records from aggregations.
```typescript
// Option A: Remove these lines from createPayment():
// await tx.revenue.create({ ... });

// Option B: Add a flag to prevent double-counting:
// Add `source: 'PAYMENT' | 'DIRECT'` to Revenue model
// Filter aggregates to only sum one source
```

---

## BUG-002 🔴 CRITICAL — `JournalEntry` Unique Constraint Breaks Reversal

**Severity:** CRITICAL — Accounting engine failure  
**File:** `lib/accounting/postingEngine.ts:210-221`  
**Schema:** `prisma/schema.prisma:337`

**Code causing bug:**
```prisma
@@unique([sourceType, sourceId, deletedAt])
```
```typescript
const newEntry = await tx.journalEntry.create({
  data: {
    sourceType: oldEntry.sourceType,  // e.g. "COST"
    sourceId: oldEntry.sourceId,       // e.g. "abc-123"
    // deletedAt defaults to null
  }
});
// P2002: Unique constraint violation (sourceType, sourceId, deletedAt) = ("COST", "abc-123", null)
// Already exists from the original entry!
```

**Impact:** Any attempt to reverse a journal entry throws P2002 error. Entire `CostService.delete()` transaction fails silently. Cost records can never be soft-deleted once posted. Accounting becomes permanently inconsistent.

**Steps to Reproduce:**
1. Create cost record, approve and post it (workflowStatus = POSTED)
2. Attempt to delete the cost: `DELETE /api/costs/:id`
3. `reverseJournal()` throws P2002
4. Transaction rolls back — cost NOT deleted despite success response if error is swallowed

**Fix:** Add a `reversalType` field to `JournalEntry` and use a composite key that excludes `deletedAt`:
```prisma
model JournalEntry {
  ...
  isReversal   Boolean @default(false)
  @@unique([sourceType, sourceId, isReversal])  // Original + reversal both unique
}
```

---

## BUG-003 🔴 CRITICAL — `CostRecord.update()` Accepts Any Field (No Whitelist)

**Severity:** CRITICAL — Security + data integrity  
**File:** `services/cost.service.ts:150-157`

**Code causing bug:**
```typescript
const updated = await tx.costRecord.update({
  where: { id, version: existing.version },
  data: {
    ...data,            // Raw spread — no field whitelist
    date: data.date ? new Date(data.date) : undefined,
    version: { increment: 1 }
  }
});
```

`UpdateCostDTO` = `createCostSchema.partial().omit({ projectId: true })` — includes `wbsId`, `requestId`, `createdById`, `status`, `costType`. But `data` at runtime is typed `any` — Zod only validates at the API boundary, not inside the service.

**Impact:**
- Attacker sends: `{ workflowStatus: "POSTED", approvalStatus: "APPROVED" }` → bypasses workflow
- Attacker sends: `{ wbsId: "other-wbs-uuid" }` → reassigns cost to different WBS
- Attacker sends: `{ projectId: "other-project" }` (omit doesn't prevent this at runtime for `any`)

**Fix:**
```typescript
const safeData = {
  ...(data.amount !== undefined && { amount: round(Number(data.amount)) }),
  ...(data.costType !== undefined && { costType: data.costType }),
  ...(data.supplier !== undefined && { supplier: data.supplier }),
  ...(data.note !== undefined && { note: data.note }),
  ...(data.date !== undefined && { date: new Date(data.date) }),
  ...(data.status !== undefined && { status: data.status }),
  ...(data.quantity !== undefined && { quantity: data.quantity }),
  ...(data.unitPrice !== undefined && { unitPrice: data.unitPrice }),
};
```

---

## BUG-004 🔴 CRITICAL — `Invoice.remainingAmount` Drifts After Amount Edit

**Severity:** CRITICAL — Financial data corruption  
**File:** `services/revenue.service.ts:190-208`

**Code causing bug:**
```typescript
static async updateInvoice(id: string, updates: any) {
  ...
  const updated = await tx.invoice.update({ where: { id }, data: updates });
}
```

**Impact:** Admin edits invoice amount from 100M to 150M. `paidAmount` = 50M (already paid). `remainingAmount` stays at 50M (set originally as 100M - 50M = 50M) instead of updating to 100M (150M - 50M). The new `remainingAmount` should be 100M, but it shows 50M permanently.

**Steps to Reproduce:**
1. Create invoice: amount=100,000,000, remainingAmount=100,000,000
2. Create payment: 50,000,000 → remainingAmount becomes 50,000,000 ✅
3. Edit invoice: amount=150,000,000 via PUT /api/invoices/:id
4. remainingAmount is still 50,000,000 (should be 100,000,000) ❌

**Fix:**
```typescript
static async updateInvoice(id: string, updates: any) {
  const existing = await prisma.invoice.findUnique({ where: { id } });
  const newAmount = updates.amount !== undefined ? round(Number(updates.amount)) : Number(existing!.amount);
  const newRemaining = round(newAmount - Number(existing!.paidAmount));
  
  return prisma.$transaction(async (tx) => {
    return tx.invoice.update({
      where: { id, version: existing!.version },
      data: {
        ...allowedUpdates,  // whitelisted fields only
        ...(updates.amount !== undefined && {
          amount: newAmount,
          remainingAmount: newRemaining,
        }),
        version: { increment: 1 }
      }
    });
  });
}
```

---

## BUG-005 🔴 CRITICAL — Role Bypass via Supabase user_metadata

**Severity:** CRITICAL — Security  
**File:** `proxy.ts:47`  
(Full detail in SECURITY_AUDIT.md SEC-001)

**Fix:** Read role from database, not JWT metadata:
```typescript
// proxy.ts — after token verification
if (user) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  // Use admin client to read from DB (or add a separate DB query here)
  // Better: call a lightweight /api/auth/me endpoint that reads from Prisma
  requestHeaders.set('x-user-id', user.id);
  // Do NOT trust user_metadata for role
}
```

---

## BUG-006 🟠 HIGH — `AuditService.log` Uses Global `prisma` Inside `tx` Transaction

**Severity:** HIGH — Audit trail inconsistency  
**File:** `services/audit.service.ts` (called from within `$transaction` blocks in cost.service, revenue.service, project.service)

**Pattern:**
```typescript
return prisma.$transaction(async (tx) => {
  const item = await tx.costRecord.update(...);  // Uses tx ✅
  await AuditService.log({ ... });               // Uses global prisma ❌
  return item;
});
```

**Impact:** If the transaction rolls back (e.g. version conflict, DB error), the `AuditService.log` call has ALREADY committed to the DB (it's outside the transaction). The audit log records a change that never happened.

**Fix:** Pass `tx` into `AuditService.log`:
```typescript
// audit.service.ts
static async log(params: AuditLogParams, tx?: PrismaTransaction) {
  const db = tx || prisma;
  await db.auditLog.create({ ... });
}
// Call sites:
await AuditService.log({ ... }, tx);
```

---

## BUG-007 🟠 HIGH — `ImportService` Transaction Rolls Back on First Error, Loses All Progress

**Severity:** HIGH — Data loss risk for bulk imports  
**File:** `services/import.service.ts:15-40`

**Code causing bug:**
```typescript
await prisma.$transaction(async (tx) => {
  for (const row of data) {
    try {
      await tx.costRecord.create({ ... });
      results.success++;
    } catch (e: any) {
      results.failed++;          // Records failure...
      results.errors.push(...);  // ...but doesn't break out of transaction
    }
  }
});
```

**Problem 1:** Catching errors inside the transaction but continuing — Prisma transactions in PostgreSQL enter an error state on any error and ALL subsequent queries will fail with "transaction aborted". The `try/catch` masks this — `results.success` keeps incrementing but all those creates actually failed silently.

**Problem 2:** If the transaction itself fails (e.g. connection timeout for large datasets), ALL inserts are rolled back and the user sees 0 success, losing their entire import.

**Fix:** Use `createMany` with `skipDuplicates: true`, validate rows before the transaction, chunk into batches of 100.

---

## BUG-008 🟠 HIGH — `updateInvoice` / `updatePayment` Not In Transaction With Audit Log

**Severity:** HIGH — Audit integrity  
**File:** `revenue.service.ts:190-208`, `revenue.service.ts:210-228`

```typescript
static async updateInvoice(id: string, updates: any) {
  const existing = await prisma.invoice.findUnique({ where: { id } });
  
  return prisma.$transaction(async (tx) => {
    const updated = await tx.invoice.update({ where: { id }, data: updates });
    await AuditService.log({...});  // Uses global prisma, not tx
    return updated;
  });
}
```

No version check → concurrent edits overwrite each other silently.

---

## BUG-009 🟡 MEDIUM — `WBSService.create()` Double-Fetches Parent

**Severity:** MEDIUM — Performance + logic  
**File:** `services/wbs.service.ts:64-74`

```typescript
if (data.parentId) {
  const parent = await prisma.wBSItem.findUnique({ where: { id: data.parentId } }); // Fetch 1
  if (!parent) throw new ApiError(404, "...");
  if (parent.projectId !== data.projectId) throw new ApiError(400, "...");
}

let level = 0;
if (data.parentId) {
  const parent = await prisma.wBSItem.findUnique({ where: { id: data.parentId } }); // Fetch 2 — DUPLICATE
  level = (parent?.level ?? 0) + 1;
}
```

Two identical DB queries for the same parent. Minor performance issue, but indicative of copy-paste bugs.

---

## BUG-010 🟡 MEDIUM — `ProjectStatus` Enum Has Duplicate Semantics

**Severity:** MEDIUM — Logic/reporting  
**File:** `prisma/schema.prisma:967-974`

```prisma
enum ProjectStatus {
  PLANNED
  IN_PROGRESS   // ← duplicate with ACTIVE
  COMPLETED
  CANCELLED
  ACTIVE        // ← duplicate with IN_PROGRESS
  CLOSED        // ← never counted in getGlobalStats
}
```

`getGlobalStats()` (`project.service.ts:37`) counts both `IN_PROGRESS` and `ACTIVE` as "inProgress". `CLOSED` is never counted in any category. This means:
- `result.total` = sum of all status counts = correct
- `result.inProgress` = IN_PROGRESS + ACTIVE (correct in sum, but enum is ambiguous)
- `CLOSED` projects are counted in total but not in any subcategory

---

## BUG-011 🟡 MEDIUM — CSV Export Missing BOM for Vietnamese Characters

**Severity:** MEDIUM — Data quality / Excel encoding  
**File:** `lib/export.ts:25`

```typescript
const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
```

Vietnamese characters (ắ, ộ, ề, etc.) require UTF-8 BOM (`\uFEFF`) to display correctly in Excel on Windows. Without it, Excel opens the file with Windows-1252 encoding and Vietnamese text appears as garbage.

**Fix:**
```typescript
const BOM = '\uFEFF';
const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
```

---

## BUG-012 🟡 MEDIUM — `useCreateRevenueMutation` Doesn't Check API Response

**Severity:** MEDIUM — Silent fail  
**File:** `services/queries/useRevenues.ts:22-27`

```typescript
mutationFn: (data: any) => revenueApi.createRevenue(data),
// No: if (!res.success) throw new Error(...)
```

Unlike other mutations (e.g. `useCreateCostMutation` which checks `res.success`), this one returns the raw API response without checking for errors. If the API returns `{ success: false, error: "..." }`, the mutation resolves successfully — no error toast shown to user.

---

## BUG-013 🟡 MEDIUM — `erpStore.init()` Race Condition — `initialized` Set Twice

**Severity:** MEDIUM — Stale state  
**File:** `store/erpStore.ts:41, 167`

```typescript
init: async () => {
  if (get().initialized) return;
  set({ initialized: true }); // Line 41 — set immediately as guard
  
  try {
    // ... async operations ...
    set({ initialized: true }); // Line 167 — set again after async work
  } catch (e) {
    set({ initialized: true }); // Line 170 — set even on error
  }
}
```

Line 41 sets `initialized: true` before async work completes. Any component checking `initialized` to render loading state will immediately see `true` and render — before the user session is loaded. This causes a flash of unauthenticated UI.

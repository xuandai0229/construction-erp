# ROOT CAUSE ANALYSIS — Construction ERP
**Date:** 2026-05-13 | **Auditor:** Principal Software Architect

---

## RCA-001: "Tạo project nhưng list trống" (Created project but list empty)

### Symptom
User creates a project → success toast shown → navigates to project list → list is empty or missing the new project.

### Trace: Frontend → API → DB → Cache → Render

```
useCreateProjectMutation.onSuccess()
  → queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() })
  
queryKeys.projects.lists() = ['erp-system', 'projects', 'list']

But useProjectsQuery uses:
  queryKey: queryKeys.projects.list(JSON.stringify(params))
           = ['erp-system', 'projects', 'list', { filters: '{"page":1,"limit":10}' }]
```

**Root Cause:** `invalidateQueries({ queryKey: queryKeys.projects.lists() })` invalidates the key `['erp-system', 'projects', 'list']`. TanStack Query uses prefix matching — this SHOULD invalidate all keys that start with this prefix, including the more specific `['erp-system', 'projects', 'list', { filters: ... }]`.

**However:** This only works if the `exact: false` (default). If any component passes `exact: true`, or if the query key structure has an object (`{ filters: ... }`) that doesn't match exactly, React Query may fail to match.

**Secondary Cause:** The `useProjectsQuery` hook uses `JSON.stringify(params)` for the filter segment. If the component calling `useProjectsQuery` passes different params than what was invalidated, the stale cache remains.

**Additional Cause — Tenant Isolation Bug (SEC-002):** If the tenant context is not injected, the Prisma extension doesn't filter by `companyId`. The newly created project might not have a `companyId` set (because `prisma.project.create` in `project.service.ts` doesn't set `companyId` explicitly — it relies on the Prisma extension's `create` hook which is broken). Thus the list query WITH companyId filter returns 0 results, but the project exists without a companyId.

**Proof:**
- `project.service.ts:134-148`: No `companyId` field in the `create` data
- `lib/prisma.ts:92-93`: Extension should inject `companyId` on create: `if (args.data) (args.data as any).companyId = tenantId;` — but `tenantId` is `undefined` due to the broken `require('next/headers')` call
- **Result:** Project is created with `companyId = null`
- The list query's where filter (if it gets the companyId) finds no match → empty list

---

## RCA-002: "Dashboard có số liệu nhưng table trống" (Dashboard has stats but table empty)

### Symptom
Dashboard KPI cards show total costs/revenues. Project detail page's cost/WBS table shows empty.

### Trace

```
Dashboard uses:
  → /api/dashboard/stats (global aggregate — no companyId filter)
  → Shows numbers from ALL companies' data

Project detail table uses:
  → useCostsQuery(projectId) → /api/costs?projectId=X
  → CostService.findByProject(projectId)
  → prisma.costRecord.findMany({ where: { projectId } })
  → Prisma extension tries to inject deletedAt: null (from SOFT_DELETE_MODELS)
  → Also tries to inject companyId from tenantId (broken)
  → Result: works OR fails depending on session state
```

**Root Cause 1 — Global stats bypass tenant:** `dashboard/stats/route.ts` calls `prisma.costRecord.aggregate(...)` with no `companyId` in the where clause. The Prisma extension injects `companyId` for `aggregate` on `costrecord` (in ROOT_TENANT_MODELS). If `tenantId` is undefined, no filter is applied → aggregate shows ALL data from ALL companies.

**Root Cause 2 — Table is empty due to deletedAt filter bug:** The soft-delete extension injects `deletedAt: null` into the `where` clause. But the explicit `where: { projectId }` in `CostService.findByProject` is spread-merged: `{ ...args.where, deletedAt: null }`. This works correctly for the deletedAt filter.

**But for `getAccountingSummary()`:** At `project.service.ts:272`:
```typescript
prisma.costRecord.aggregate({
  where: { projectId },  // No deletedAt: null here
  _sum: { amount: true }
})
```
The extension adds `deletedAt: null` automatically. So costs are correctly excluded. However, the 2nd `Promise.all` at line 302-321 also does:
```typescript
prisma.costRecord.groupBy({
  by: ["costType"],
  where: { projectId },  // Extension also adds deletedAt: null
  _sum: { amount: true }
})
```
This is OK. The bug is the **separate calculation** between `getAccountingSummary` (used by dashboard) and `ProjectFinance.calculateProjectStats` (used by project page). They are NOT the same code path — they can produce different numbers.

---

## RCA-003: "WBS không hiện" (WBS not showing)

### Symptom
WBS page for a project shows empty tree even though WBS items exist in DB.

### Trace

```
useWBSQuery(projectId) → /api/wbs?projectId=X
  → WBSService.findByProject(projectId)
    → prisma.wBSItem.findMany({ where: { projectId } })
    → Soft-delete extension: adds deletedAt: null ✅
    → items returned = []? Or items returned with wrong structure?
  → ProjectFinance.calculateWBSTree(items, mockCosts, mockBudgets)
    → assemble(null) — builds tree starting from parentId === null
    → PROBLEM: all items must have parentId === null or valid parents
```

**Root Cause 1 — WBS items created without companyId:** Same as RCA-001. WBS items are created via `wbs.service.ts:76-85` with no `companyId`. If the Prisma extension tries to filter `wbsItem` by companyId (it's a DERIVED_TENANT_MODEL via `project` path), the filter `{ project: { companyId: tenantId } }` is added. If `tenantId` is undefined, no filter. But if somehow tenantId is valid, items without `companyId` on the project won't match.

**Root Cause 2 — `assemble()` root detection uses `parentId === null`:** If WBS items were created with `parentId: undefined` (not null), JavaScript `undefined === null` is `false`. Items with `parentId: undefined` would be orphaned in the tree and never shown.

**Check in schema:** `WBSItem.parentId String?` — nullable in DB, but JS undefined vs null can differ.

**Root Cause 3 — API returns `{ tree: [], flat: [...] }` but UI only renders `tree`:** If `assemble()` returns empty for any of the above reasons, and the UI renders `data?.tree`, it shows empty even though `data?.flat` has items.

---

## RCA-004: "Số tiền KPI sai" (Wrong KPI amounts)

### Symptom
Total cost on dashboard doesn't match sum of individual cost records.

### Root Cause: Revenue Double-Write

Every `createPayment()` call auto-creates a `Revenue` record (`revenue.service.ts:123-134`). The project also has direct `Revenue` records from `/api/revenues`. Both are summed in `getAccountingSummary`:

```typescript
prisma.revenue.aggregate({ where: { projectId }, _sum: { amount: true } })
```

This counts:
- Direct revenue entries
- Auto-generated revenue from payments (same money, counted twice)

**Example:**
- Invoice: 100,000,000 VND
- Payment received: 100,000,000 VND → auto-creates Revenue of 100,000,000
- Dashboard shows: Revenue = 200,000,000 (wrong, should be 100,000,000)

---

## RCA-005: "Pagination sai" (Pagination wrong)

### Symptom
Page 2 of project list shows same data as page 1, or total count doesn't match displayed items.

### Root Cause: Double Validation + Status Filter Bug

`project.service.ts:37-39`:
```typescript
if (s.status === 'IN_PROGRESS' || s.status === 'ACTIVE') result.inProgress += count;
if (s.status === 'COMPLETED') result.completed += count;
if (s.status === 'CANCELLED') result.onHold += count;
```

The `ProjectStatus` enum has: `PLANNED, IN_PROGRESS, COMPLETED, CANCELLED, ACTIVE, CLOSED`

- `CLOSED` status is never counted → `result.total` = sum of all statuses but the label says "total"
- `result.onHold` = CANCELLED count (wrong semantic — onHold ≠ cancelled)

**Pagination itself** (`findMany` with `skip`/`take`) is correctly implemented. The bug is in the stats endpoint used for the KPI cards, not in list pagination.

---

## RCA-006: "Optimistic update sai" (Wrong optimistic update)

### Symptom
After deleting a cost record, it disappears from the list, then reappears after a second.

### Root Cause: No Optimistic Update, Just Invalidation

The mutation hooks use `onSuccess` cache invalidation, not optimistic updates. The sequence is:
1. User clicks delete
2. `deleteCost(id)` API call starts (async)
3. No UI change yet (no optimistic update)
4. API succeeds after ~300ms
5. `onSuccess` fires → `invalidateQueries`
6. Background refetch starts → another ~200ms
7. UI updates

This creates a 500ms lag where the item is still shown. If the user refreshes during this window, the item appears then disappears.

**No actual re-appearance bug** — the issue is lack of optimistic UI, not a real race condition. If it truly reappears: likely two components both subscribed to the same query, one invalidates and refetches, the other's cache was already stale and updates with old data before the new fetch completes.

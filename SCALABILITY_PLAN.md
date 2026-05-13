# SCALABILITY PLAN — Construction ERP
**Date:** 2026-05-13 | **Auditor:** Database Reliability Engineer + Principal Architect

---

## 1. CURRENT CAPACITY CEILING

Based on audit findings, current hard limits before system degrades:

| Metric | Current Ceiling | Enterprise Target |
|---|---|---|
| WBS items per project | ~500 (O(N²) tree) | 10,000 |
| Cost records per project | ~10,000 (unbounded query) | 1,000,000 |
| Concurrent users | ~20-50 before degradation | 1,000+ |
| Import batch size | ~100 rows (transaction timeout) | 100,000 rows |
| Dashboard load time | <2s for small datasets | <500ms at scale |

---

## 2. PHASE 1 — CRITICAL FIXES (Weeks 1-2)

These must be done before any scale effort — they are correctness bugs, not just perf.

### 2.1 Fix Tenant Isolation (SEC-002)
```typescript
// Replace require() magic with explicit context passing
// Each API route reads verified companyId from header and passes it down
export async function GET(request: Request) {
  const companyId = request.headers.get('x-company-id');
  const items = await ProjectService.findMany({ ...params, companyId });
}

// Service layer filters explicitly
static async findMany(params: { companyId?: string, ... }) {
  return prisma.project.findMany({
    where: {
      ...(params.companyId && { companyId: params.companyId }),
      deletedAt: null,
      ...
    }
  });
}
```

### 2.2 Add Default Pagination Everywhere
```typescript
// Global constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 200,
  MAX_IMPORT_BATCH: 500,
};
```

### 2.3 Fix WBS Tree Assembly — O(N) Algorithm
```typescript
static calculateWBSTree(wbs: WBSItem[], costs: CostRecord[], budgets: BudgetRecord[]) {
  const costMap = new Map<string, number>();
  const budgetMap = new Map<string, number>();
  for (const c of costs) costMap.set(c.wbsId, (costMap.get(c.wbsId) || 0) + c.amount);
  for (const b of budgets) budgetMap.set(b.wbsId, (budgetMap.get(b.wbsId) || 0) + b.estimatedAmount);

  const nodeMap = new Map<string, EnrichedWBSNode>();
  const childMap = new Map<string | null, EnrichedWBSNode[]>();

  for (const w of wbs) {
    const node: EnrichedWBSNode = {
      ...w, children: [], level: 0,
      budget: budgetMap.get(w.id) || 0,
      actual: costMap.get(w.id) || 0,
      // ... other fields
    };
    nodeMap.set(w.id, node);
    const key = w.parentId ?? null;
    if (!childMap.has(key)) childMap.set(key, []);
    childMap.get(key)!.push(node);
  }

  function rollup(node: EnrichedWBSNode, level: number) {
    node.level = level;
    node.children = (childMap.get(node.id) || []).sort((a, b) => a.sortOrder - b.sortOrder);
    for (const child of node.children) {
      rollup(child, level + 1);
      node.budget += child.budget;
      node.actual += child.actual;
    }
    node.variance = node.budget - node.actual;
    node.percentage = node.budget > 0 ? (node.actual / node.budget) * 100 : 0;
  }

  const roots = (childMap.get(null) || []).sort((a, b) => a.sortOrder - b.sortOrder);
  for (const root of roots) rollup(root, 0);
  return roots;
}
```

---

## 3. PHASE 2 — PERFORMANCE (Weeks 3-4)

### 3.1 Database Index Additions
```sql
-- Run as non-blocking concurrent builds
CREATE INDEX CONCURRENTLY idx_cost_project_type_deleted 
  ON "CostRecord"("projectId", "costType") 
  WHERE "deletedAt" IS NULL;

CREATE INDEX CONCURRENTLY idx_wbs_project_level_sort 
  ON "WBSItem"("projectId", "level", "sortOrder") 
  WHERE "deletedAt" IS NULL;

CREATE INDEX CONCURRENTLY idx_fiscal_locked_dates 
  ON "FiscalPeriod"("startDate", "endDate") 
  WHERE "isLocked" = true;

CREATE INDEX CONCURRENTLY idx_budget_project_type 
  ON "BudgetRecord"("projectId", "costType") 
  WHERE "deletedAt" IS NULL;

CREATE INDEX CONCURRENTLY idx_invoice_project_status 
  ON "Invoice"("projectId", "status") 
  WHERE "deletedAt" IS NULL;
```

### 3.2 Materialized View for Dashboard Stats
```sql
-- Create materialized view for global and per-project stats
CREATE MATERIALIZED VIEW mv_project_financial_summary AS
SELECT
  p.id AS project_id,
  p."companyId",
  COALESCE(SUM(c.amount) FILTER (WHERE c."deletedAt" IS NULL), 0) AS total_cost,
  COALESCE(SUM(b."estimatedAmount") FILTER (WHERE b."deletedAt" IS NULL), 0) AS total_budget,
  COALESCE(SUM(r.amount) FILTER (WHERE r."deletedAt" IS NULL AND r."invoiceId" IS NULL), 0) AS total_revenue
FROM "Project" p
LEFT JOIN "CostRecord" c ON c."projectId" = p.id
LEFT JOIN "BudgetRecord" b ON b."projectId" = p.id
LEFT JOIN "Revenue" r ON r."projectId" = p.id
WHERE p."deletedAt" IS NULL
GROUP BY p.id, p."companyId";

CREATE UNIQUE INDEX ON mv_project_financial_summary(project_id);

-- Refresh strategy: after any cost/budget/revenue mutation
-- Use REFRESH MATERIALIZED VIEW CONCURRENTLY mv_project_financial_summary;
```

### 3.3 Import Service — Chunked Batch Processing
```typescript
static async importCosts(projectId: string, data: any[], userId?: string) {
  const CHUNK_SIZE = 100;
  const validated = data.map((row, i) => {
    if (!row.amount || isNaN(Number(row.amount))) throw new Error(`Row ${i}: invalid amount`);
    if (!row.wbsId) throw new Error(`Row ${i}: missing wbsId`);
    return {
      projectId,
      wbsId: row.wbsId,
      amount: round(Number(row.amount)),
      costType: row.costType || 'material',
      note: row.note || 'Imported',
      date: row.date ? new Date(row.date) : new Date(),
      createdById: userId,
    };
  });

  let success = 0;
  for (let i = 0; i < validated.length; i += CHUNK_SIZE) {
    const chunk = validated.slice(i, i + CHUNK_SIZE);
    await prisma.costRecord.createMany({ data: chunk, skipDuplicates: true });
    success += chunk.length;
  }
  return { success, failed: 0, errors: [] };
}
```

---

## 4. PHASE 3 — SCALE ARCHITECTURE (Month 2-3)

### 4.1 Read/Write Separation

```typescript
// lib/prisma.ts — add read replica
const readPrisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL_REPLICA } } });
const writePrisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

// Use readPrisma for all GET handlers, writePrisma for mutations
```

### 4.2 Background Job Queue for Heavy Operations

Current `Job` model exists in schema but is unused. Implement:

```typescript
// Queue heavy operations
await prisma.job.create({
  data: {
    type: 'GENERATE_REPORT',
    payload: { projectId, reportType: 'FINANCIAL_SUMMARY' },
    status: 'PENDING',
    runAt: new Date(),
  }
});

// Background worker processes jobs
// Use Supabase Edge Functions or a separate Node.js worker
```

**Operations to background:**
- Export to Excel/CSV (large datasets)
- Dashboard aggregation refresh
- Bulk import validation and insertion
- Journal posting batches

### 4.3 Cursor-Based Pagination for Infinite Scroll

Replace offset pagination for high-volume tables:
```typescript
// Instead of skip/take:
cursor: lastItemId ? { id: lastItemId } : undefined,
take: 50,
skip: lastItemId ? 1 : 0,
```

### 4.4 React Query Optimization

```typescript
// Set appropriate stale times
staleTime: 5 * 60 * 1000,      // Project list: 5 min
staleTime: 30 * 1000,           // Cost/revenue: 30 sec
staleTime: 15 * 60 * 1000,     // WBS structure: 15 min

// Enable garbage collection
gcTime: 30 * 60 * 1000,        // Keep unused cache 30 min

// Use select to minimize re-renders
select: (data) => data.filter(c => c.status === 'unpaid'),
```

---

## 5. PHASE 4 — ENTERPRISE SCALE (Month 4-6)

### 5.1 Table Partitioning for Cost Records

```sql
-- Partition CostRecord by year for time-series queries
CREATE TABLE "CostRecord_2025" PARTITION OF "CostRecord"
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE "CostRecord_2026" PARTITION OF "CostRecord"
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
```

### 5.2 Horizontal Sharding by Company

Multi-tenant architecture: each company gets its own schema or database. Supabase Row Level Security (RLS) provides the enforcement layer at the DB level, removing the need for application-level tenant injection.

### 5.3 Event-Driven Architecture

Replace synchronous journal posting with event queue:
```typescript
// After cost approval:
await eventBus.emit('cost.approved', { costId, projectId, amount, costType });

// Journal posting happens asynchronously via worker
eventBus.on('cost.approved', async (event) => {
  await PostingEngine.postCost(prisma, event);
});
```

### 5.4 Supabase Realtime for Collaborative Features

```typescript
// Subscribe to project changes for multi-user collaboration
const subscription = supabase
  .channel('project-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'CostRecord', filter: `projectId=eq.${projectId}` },
    (payload) => queryClient.invalidateQueries({ queryKey: queryKeys.costs.byProject(projectId) })
  )
  .subscribe();
```

---

## 6. TARGET ENTERPRISE BENCHMARKS (After All Phases)

| Metric | Current | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|---|---|---|---|---|---|
| API latency (P95) | 500ms-3s | 200-500ms | 100-200ms | 50-100ms | <50ms |
| Dashboard load | 2-5s | 1-2s | <500ms | <200ms | <100ms |
| WBS (1000 items) | 2-3s | <100ms | <50ms | <20ms | <10ms |
| Import 10k rows | FAIL | 30s | 10s | 3s | <1s |
| Concurrent users | 20-50 | 100 | 500 | 2000 | 10,000+ |
| DB size at full scale | — | — | <100GB | <1TB | Partitioned |

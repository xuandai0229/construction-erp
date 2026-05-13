# TEST PLAN — Construction ERP
**Date:** 2026-05-13 | **Auditor:** QA Automation Lead

---

## 1. STRATEGY

| Layer | Tool | Purpose |
|---|---|---|
| Unit | Jest + ts-jest | Financial logic, math, validators |
| Integration | Jest + Prisma test env | Service→DB flows, transactions |
| E2E | Playwright | Full user journeys |
| Load | k6 | API throughput benchmarks |
| Stress | k6 concurrent VUs | Concurrency / race conditions |

---

## 2. UNIT TESTS

### 2.1 Financial Math (`lib/math.ts`)

```typescript
// tests/unit/math.test.ts
import { round, areEqualMoney, safeNumber } from '@/lib/math';

describe('round', () => {
  it('fixes 0.1+0.2 float issue', () => expect(round(0.1 + 0.2)).toBe(0.30));
  it('rounds 1.005 correctly', () => expect(round(1.005)).toBe(1.01));
  it('handles VND billions', () => expect(round(999_999_999.999)).toBe(1_000_000_000.00));
});

describe('areEqualMoney', () => {
  it('treats <0.001 difference as equal', () => expect(areEqualMoney(100.0001, 100)).toBe(true));
  it('treats 0.01 difference as not equal', () => expect(areEqualMoney(100.01, 100)).toBe(false));
});

describe('safeNumber', () => {
  it('returns 0 for null/undefined', () => {
    expect(safeNumber(null)).toBe(0);
    expect(safeNumber(undefined)).toBe(0);
  });
  it('handles Prisma Decimal strings', () => expect(safeNumber('123456.78')).toBe(123456.78));
});
```

### 2.2 WBS Tree Assembly Performance (`services/finance/projectFinance.ts`)

```typescript
// tests/unit/projectFinance.test.ts
import { ProjectFinance } from '@/services/finance/projectFinance';

const makeWBS = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `n${i}`, parentId: i === 0 ? null : `n${Math.floor((i - 1) / 2)}`,
    name: `Node ${i}`, sortOrder: i, level: 0, projectId: 'p1',
    budgetAmount: 0, code: '', createdAt: new Date(), updatedAt: new Date(),
    deletedAt: null, deletedById: null,
  }));

it('assembles 1000-node tree in <100ms', () => {
  const wbs = makeWBS(1000);
  const t = Date.now();
  ProjectFinance.calculateWBSTree(wbs as any, [], []);
  expect(Date.now() - t).toBeLessThan(100);
});

it('rolls up child costs to parent', () => {
  const wbs = [
    { id: 'p', parentId: null, name: 'Parent', sortOrder: 0, level: 0, projectId: 'x', budgetAmount: 0, code: '', createdAt: new Date(), updatedAt: new Date(), deletedAt: null, deletedById: null },
    { id: 'c', parentId: 'p', name: 'Child',  sortOrder: 0, level: 1, projectId: 'x', budgetAmount: 0, code: '', createdAt: new Date(), updatedAt: new Date(), deletedAt: null, deletedById: null },
  ];
  const costs = [{ wbsId: 'c', amount: 500_000 } as any];
  const [root] = ProjectFinance.calculateWBSTree(wbs as any, costs, []);
  expect(root.actual).toBe(500_000);
  expect(root.children[0].actual).toBe(500_000);
});

it('does not double-count revenue from payments', () => {
  const revenues = [{ id: 'r1', amount: 100_000_000, status: 'paid', wbsId: 'w1', projectId: 'p', invoiceId: null } as any];
  const result = ProjectFinance.calculateProjectStats({ costs: [], budgets: [], revenues, invoices: [], wbsCount: 1, taskStats: [] });
  expect(result.totalRevenue).toBe(100_000_000);
});
```

### 2.3 CSV Export (`lib/export.ts`)

```typescript
it('prefixes dangerous formula characters', () => {
  const data = [{ name: '=SUM(A1)', amount: 1000 }];
  // After fix: value should start with apostrophe to prevent formula injection
  // expect exported CSV cell to contain "'=SUM(A1)"
});

it('includes UTF-8 BOM for Vietnamese characters', () => {
  const data = [{ name: 'Hạng mục thi công' }];
  // exported blob should start with \uFEFF
});
```

---

## 3. INTEGRATION TESTS

### 3.1 Project Lifecycle

```typescript
// tests/integration/project.test.ts
describe('ProjectService', () => {
  it('creates project with audit log', async () => {
    const p = await ProjectService.create({ name: '__TEST_PROJ', investor: 'X', contractValue: 1e9 });
    const log = await prisma.auditLog.findFirst({ where: { entityId: p.id } });
    expect(log?.action).toBe('CREATE');
  });

  it('optimistic lock rejects stale version', async () => {
    const p = await ProjectService.create({ name: '__TEST_LOCK', investor: 'X' });
    const [r1, r2] = await Promise.allSettled([
      ProjectService.update(p.id, { name: '__V2', version: 1 }),
      ProjectService.update(p.id, { name: '__V3', version: 1 }),
    ]);
    const wins = [r1, r2].filter(r => r.status === 'fulfilled').length;
    expect(wins).toBe(1);
  });

  it('cascade soft-delete covers WBS and costs', async () => {
    const p = await ProjectService.create({ name: '__TEST_CASCADE', investor: 'X' });
    const w = await prisma.wBSItem.create({ data: { projectId: p.id, name: 'W1', level: 0, sortOrder: 0 } });
    await prisma.costRecord.create({ data: { projectId: p.id, wbsId: w.id, amount: 1000, costType: 'material' } });

    await ProjectService.delete(p.id, 'test-user');

    const wbs   = await prisma.wBSItem.findMany({ where: { projectId: p.id } });
    const costs = await prisma.costRecord.findMany({ where: { projectId: p.id } });
    expect(wbs).toHaveLength(0);
    expect(costs).toHaveLength(0);
  });
});
```

### 3.2 Payment Concurrency

```typescript
// tests/integration/payment-concurrency.test.ts
it('prevents overpayment under concurrent requests', async () => {
  const inv = await createTestInvoice(1_000_000);

  // Two payments of 600k against a 1M invoice
  const [a, b] = await Promise.allSettled([
    RevenueService.createPayment({ invoiceId: inv.id, projectId: inv.projectId, amount: 600_000, requestId: crypto.randomUUID() }),
    RevenueService.createPayment({ invoiceId: inv.id, projectId: inv.projectId, amount: 600_000, requestId: crypto.randomUUID() }),
  ]);
  const succeeded = [a, b].filter(r => r.status === 'fulfilled').length;
  expect(succeeded).toBe(1);

  const updated = await prisma.invoice.findUnique({ where: { id: inv.id } });
  expect(Number(updated!.paidAmount)).toBeLessThanOrEqual(1_000_000);
});
```

### 3.3 Transaction Rollback Safety

```typescript
it('audit log not written when transaction rolls back', async () => {
  const cost = await createTestCost();
  const countBefore = await prisma.auditLog.count({ where: { entityId: cost.id } });

  // Force version conflict
  await prisma.costRecord.update({ where: { id: cost.id }, data: { version: { increment: 99 } } });

  try {
    await CostService.update(cost.id, { note: 'Should fail' }, { userId: 'u1' });
  } catch { /* expected */ }

  const countAfter = await prisma.auditLog.count({ where: { entityId: cost.id } });
  // After the fix (passing tx to AuditService), no spurious log should exist
  expect(countAfter).toBe(countBefore);
});
```

### 3.4 Import Service Batch

```typescript
it('imports 500 rows as chunks without deadlock', async () => {
  const data = Array.from({ length: 500 }, (_, i) => ({ wbsId: testWbsId, amount: 1000 + i }));
  const t = Date.now();
  const result = await ImportService.importCosts(testProjectId, data, testUserId);
  expect(result.success).toBe(500);
  expect(result.failed).toBe(0);
  expect(Date.now() - t).toBeLessThan(15_000);
});

it('partial failure does not corrupt successful rows', async () => {
  const data = [
    { wbsId: testWbsId, amount: 1000 },
    { wbsId: 'INVALID_UUID', amount: 2000 },  // bad row
    { wbsId: testWbsId, amount: 3000 },
  ];
  const result = await ImportService.importCosts(testProjectId, data, testUserId);
  expect(result.success).toBe(2);
  expect(result.failed).toBe(1);
});
```

---

## 4. E2E TESTS (Playwright)

```typescript
// tests/e2e/project.spec.ts
test('create project → appears in list', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.click('[data-testid="create-project-btn"]');
  await page.fill('[data-testid="project-name"]', 'E2E Alpha Project');
  await page.fill('[data-testid="contract-value"]', '1000000000');
  await page.click('[data-testid="submit-project"]');
  await expect(page.locator('text=E2E Alpha Project')).toBeVisible({ timeout: 5000 });
});

test('delete project → disappears from list', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.click('[data-testid="delete-project-btn"]:first-child');
  await page.click('[data-testid="confirm-delete"]');
  await expect(page.locator('[data-testid="deleted-project-name"]')).not.toBeVisible({ timeout: 5000 });
});

test('WBS tree renders after create', async ({ page }) => {
  await loginAs(page, 'admin');
  await navigateToProject(page, testProjectId);
  await page.click('[data-testid="create-wbs-btn"]');
  await page.fill('[data-testid="wbs-name"]', 'Foundation Work');
  await page.click('[data-testid="submit-wbs"]');
  await expect(page.locator('text=Foundation Work')).toBeVisible({ timeout: 5000 });
});
```

---

## 5. LOAD TESTS (k6)

```javascript
// tests/load/api-load.js
export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m',  target: 50 },
    { duration: '1m',  target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed:   ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('http://localhost:3000/api/projects?page=1&limit=20', { headers: AUTH });
  check(res, { 'status 200': r => r.status === 200, '<500ms': r => r.timings.duration < 500 });
  sleep(1);
}
```

---

## 6. PRIORITY MATRIX

| Test | Priority | Blocks Deploy |
|---|---|---|
| Revenue double-count (BUG-001) | P0 | YES |
| Journal reversal P2002 (BUG-002) | P0 | YES |
| Concurrent payment safety | P0 | YES |
| Role bypass via user_metadata (SEC-001) | P0 | YES |
| Tenant isolation (SEC-002) | P0 | YES |
| Optimistic locking | P1 | YES |
| Cascade soft-delete | P1 | NO |
| WBS tree rollup accuracy | P1 | NO |
| Import batch safety | P1 | NO |
| CSV BOM for Vietnamese | P2 | NO |
| Load: 100 concurrent users | P2 | NO |

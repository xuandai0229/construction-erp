import { expect, test } from '@playwright/test';

const pages = [
  '/',
  '/projects',
  '/wbs',
  '/budget',
  '/costs',
  '/revenue',
  '/debt',
  '/reports',
  '/settings',
  '/system',
  '/login',
  '/projects/AUDIT_20260518_project_city',
];

const apiRoutes = [
  '/api/health',
  '/api/health/financial',
  '/api/projects',
  '/api/wbs?projectId=AUDIT_20260518_project_city',
  '/api/costs?projectId=AUDIT_20260518_project_city',
  '/api/budgets?projectId=AUDIT_20260518_project_city',
  '/api/invoices?projectId=AUDIT_20260518_project_city',
  '/api/payments?projectId=AUDIT_20260518_project_city',
  '/api/revenues?projectId=AUDIT_20260518_project_city',
  '/api/dashboard/stats?projectId=AUDIT_20260518_project_city',
  '/api/analytics?projectId=AUDIT_20260518_project_city&action=all',
  '/api/reports/financial?projectId=AUDIT_20260518_project_city',
  '/api/reports/aging?projectId=AUDIT_20260518_project_city',
  '/api/reports/monthly?projectId=AUDIT_20260518_project_city',
  '/api/workspace/action-center?projectId=AUDIT_20260518_project_city',
  '/api/workspace/executive-summary?projectId=AUDIT_20260518_project_city',
  '/api/workspace/intelligence?projectId=AUDIT_20260518_project_city',
  '/api/workspace/notifications',
  '/api/system/alerts',
  '/api/system/diagnostics',
  '/api/monitoring/performance',
];

test.beforeEach(async ({ page }) => {
  await page.request.post('/api/auth/session', { data: { role: 'SUPER_ADMIN' } });
});

test('all enterprise pages render without console errors or failed requests', async ({ page }) => {
  const consoleErrors: string[] = [];
  const requestFailures: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    const errorText = request.failure()?.errorText || '';
    if (!errorText.includes('net::ERR_ABORTED')) {
      requestFailures.push(`${request.method()} ${request.url()} ${errorText}`);
    }
  });

  for (const route of pages) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.status(), route).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
  }

  expect(requestFailures).toEqual([]);
  expect(consoleErrors.filter((error) => !error.includes('favicon'))).toEqual([]);
});

test('sampled APIs are healthy and reasonably bounded', async ({ request }) => {
  await request.post('/api/auth/session', { data: { role: 'SUPER_ADMIN' } });

  for (const route of apiRoutes) {
    const startedAt = Date.now();
    const response = await request.get(route);
    const elapsed = Date.now() - startedAt;
    const body = await response.text();

    expect(response.status(), route).toBeLessThan(400);
    expect(elapsed, route).toBeLessThan(3_000);
    expect(body.length, route).toBeLessThan(500_000);
  }
});

test('unauthenticated mutations are rejected by proxy', async ({ playwright }) => {
  const isolated = await playwright.request.newContext({ baseURL: 'http://localhost:3000', storageState: { cookies: [], origins: [] } });
  const response = await isolated.post('/api/projects', {
    data: {
      name: 'SHOULD_NOT_BE_CREATED',
      investor: 'Unauthorized',
      contractValue: 1,
      totalBudget: 1,
      status: 'PLANNED',
    },
  });

  expect(response.status()).toBe(401);
});

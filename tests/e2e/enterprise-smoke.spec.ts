import { expect, test, type APIRequestContext } from '@playwright/test';

const staticPages = [
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
];

const staticApiRoutes = [
  '/api/health',
  '/api/health/financial',
  '/api/projects',
  '/api/workspace/notifications',
  '/api/system/alerts',
  '/api/system/diagnostics',
  '/api/monitoring/performance',
];

async function getProjectId(request: APIRequestContext) {
  const response = await request.get('/api/projects');
  expect(response.status()).toBeLessThan(400);
  const payload = await response.json();
  return payload?.data?.[0]?.id as string | undefined;
}

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

  const projectPayload = await page.request.get('/api/projects').then((response) => response.json());
  const projectId = projectPayload?.data?.[0]?.id as string | undefined;
  const pages = projectId ? [...staticPages, `/projects/${projectId}`] : staticPages;

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
  const projectId = await getProjectId(request);
  const projectRoutes = projectId
    ? [
        `/api/wbs?projectId=${projectId}`,
        `/api/costs?projectId=${projectId}`,
        `/api/budgets?projectId=${projectId}`,
        `/api/invoices?projectId=${projectId}`,
        `/api/payments?projectId=${projectId}`,
        `/api/revenues?projectId=${projectId}`,
        `/api/dashboard/stats?projectId=${projectId}`,
        `/api/analytics?projectId=${projectId}&action=all`,
        `/api/reports/financial?projectId=${projectId}`,
        `/api/reports/aging?projectId=${projectId}`,
        `/api/reports/monthly?projectId=${projectId}`,
        `/api/workspace/action-center?projectId=${projectId}`,
        `/api/workspace/executive-summary?projectId=${projectId}`,
        `/api/workspace/intelligence?projectId=${projectId}`,
      ]
    : [];

  for (const route of [...staticApiRoutes, ...projectRoutes]) {
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

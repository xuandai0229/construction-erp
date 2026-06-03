import { expect, test, type APIRequestContext } from '@playwright/test';

async function getProjectId(request: APIRequestContext) {
  const response = await request.get('/api/projects');
  expect(response.status()).toBeLessThan(400);
  const payload = await response.json();
  return payload?.data?.[0]?.id as string | undefined;
}

test.beforeEach(async ({ page, request }) => {
  await page.request.post('/api/auth/session', { data: { role: 'SUPER_ADMIN' } });
  await request.post('/api/auth/session', { data: { role: 'SUPER_ADMIN' } });
});

test('/print/debt uses audited A4 print template', async ({ page, request }) => {
  const projectId = await getProjectId(request);
  test.skip(!projectId, 'Không có project ID read-only để kiểm tra print debt.');

  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('favicon')) {
      consoleErrors.push(message.text());
    }
  });

  const response = await page.goto(`/print/debt?projectId=${projectId}`, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  await expect(page.getByText('CÔNG TY CP THƯƠNG MẠI VÀ XÂY DỰNG SỐ 2 HN')).toBeVisible();
  await expect(page.getByText(/BÁO CÁO TỔNG HỢP CÔNG NỢ PHẢI THU/)).toBeVisible();
  await expect(page.getByRole('button', { name: /In/ })).toBeVisible();

  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/Ãƒ|Ã„|Ã‚|Ã¢â‚¬|Ã¡Âº|Ã¡Â»|Ã†Â°|Ã†Â¡|ï¿½/);
  expect(consoleErrors).toEqual([]);
});

test('/print/ledger uses audited A4 print template', async ({ page, request }) => {
  const projectId = await getProjectId(request);
  test.skip(!projectId, 'Không có project ID read-only để kiểm tra print ledger.');

  const response = await page.goto(`/print/ledger?projectId=${projectId}`, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  await expect(page.getByText('CÔNG TY CP THƯƠNG MẠI VÀ XÂY DỰNG SỐ 2 HN')).toBeVisible();
  await expect(page.getByText(/SỔ CÁI CHI TIẾT TÀI KHOẢN/)).toBeVisible();
  await expect(page.getByRole('button', { name: /In/ })).toBeVisible();

  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/Ãƒ|Ã„|Ã‚|Ã¢â‚¬|Ã¡Âº|Ã¡Â»|Ã†Â°|Ã†Â¡|ï¿½/);
});

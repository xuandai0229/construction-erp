import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.request.post('/api/auth/session', { data: { role: 'SUPER_ADMIN' } });
});

test('dashboard financial metric opens and closes drilldown drawer', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);

  const drilldownResponsePromise = page.waitForResponse((res) => res.url().includes('/api/trace/financial-drilldown'));
  await page.getByText('Tổng doanh thu hạch toán').click();
  const drilldownResponse = await drilldownResponsePromise;
  expect(drilldownResponse.status()).toBeLessThan(400);

  await expect(page.getByText('Truy vết tổng doanh thu')).toBeVisible();
  await expect(page.getByText('Tổng tiền:')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Chứng từ nguồn' })).toBeVisible();

  await page.getByLabel('Đóng truy vết tài chính').click();
  await expect(page.getByText('Truy vết tổng doanh thu')).toBeHidden();
});

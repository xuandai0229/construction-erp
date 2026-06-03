import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = path.join(process.cwd(), 'test-results', 'visual-pilot');

test.beforeEach(async ({ page }) => {
  fs.mkdirSync(artifactDir, { recursive: true });
  await page.request.post('/api/auth/session', { data: { role: 'SUPER_ADMIN' } });
});

test('financial drilldown drawer stays inside viewport and exposes required tabs', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);

  await page.getByText('Tổng doanh thu hạch toán').click();
  const drawerTitle = page.getByText('Truy vết tổng doanh thu');
  await expect(drawerTitle).toBeVisible();

  for (const tab of ['Tổng quan', 'Chứng từ nguồn', 'Bút toán', 'Hợp đồng/NCC', 'Audit/Trace']) {
    await expect(page.getByRole('button', { name: tab })).toBeVisible();
  }

  const drawer = page.locator('aside').last();
  const box = await drawer.boundingBox();
  expect(box).toBeTruthy();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(1440);
  expect(box!.y + box!.height).toBeLessThanOrEqual(900);

  await page.screenshot({ path: path.join(artifactDir, 'financial-drilldown-drawer.png'), fullPage: true });

  await page.getByRole('button', { name: 'Audit/Trace' }).click();
  await expect(page.getByText('Chưa có trace chi tiết cho chỉ tiêu này trong pilot.')).toBeVisible();

  await page.getByLabel('Đóng truy vết tài chính').click();
  await expect(drawerTitle).toBeHidden();
});

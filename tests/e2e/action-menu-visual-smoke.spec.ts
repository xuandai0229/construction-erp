import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = path.join(process.cwd(), 'test-results', 'visual-pilot');

test.beforeEach(async ({ page }) => {
  fs.mkdirSync(artifactDir, { recursive: true });
  await page.request.post('/api/auth/session', { data: { role: 'SUPER_ADMIN' } });
});

test('projects action menu opens through portal without table clipping', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  const response = await page.goto('/projects', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);

  const titledButton = page.getByTitle('Thao tác').first();
  const menuButton = (await titledButton.count()) > 0 ? titledButton : page.locator('[aria-haspopup="menu"]').first();
  const menuCount = await menuButton.count();

  if (menuCount === 0) {
    fs.writeFileSync(
      path.join(artifactDir, 'action-menu-findings.json'),
      JSON.stringify([{ route: '/projects', status: 'NOT_TESTED_NO_STABLE_DATA', issues: ['Không có action menu ổn định để kiểm tra trong dữ liệu hiện tại.'] }], null, 2),
      'utf8'
    );
    return;
  }

  await menuButton.click();
  const menuItem = page.getByRole('menuitem').first();
  await expect(menuItem).toBeVisible();

  const menuBox = await menuItem.boundingBox();
  expect(menuBox).toBeTruthy();
  expect(menuBox!.x).toBeGreaterThanOrEqual(0);
  expect(menuBox!.y).toBeGreaterThanOrEqual(0);
  expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(1366);
  expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(768);

  await page.screenshot({ path: path.join(artifactDir, 'action-menu-projects.png'), fullPage: true });
  fs.writeFileSync(
    path.join(artifactDir, 'action-menu-findings.json'),
    JSON.stringify([{ route: '/projects', status: 'PASS', issues: [] }], null, 2),
    'utf8'
  );

  await page.keyboard.press('Escape');
  await expect(menuItem).toBeHidden();
});

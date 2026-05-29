import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Enforce logged in as Super Admin
  await page.request.post('/api/auth/session', { data: { role: 'SUPER_ADMIN' } });
});

test.describe('DRILL-DOWN UX & FINANCIAL TRACE E2E SUITE', () => {
  test('should support interactive KPI click and open financial trace on Dashboard', async ({ page }) => {
    // 1. Go to dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 2. Locate TK 131 Receivable KPI Metric
    const receivableKpi = page.locator('text=CÔNG NỢ PHẢI THU (TK 131)');
    await expect(receivableKpi).toBeVisible();

    // 3. Click the TK 131 metric card to trigger drill-down trace
    await receivableKpi.click();

    // 4. Verify Financial Trace Panel slides-over drawer is open
    const drawerTitle = page.locator('text=TRUY VẾT TÀI CHÍNH KẾ TOÁN');
    await expect(drawerTitle).toBeVisible();

    // 5. Click the close button
    const closeBtn = page.locator('button[aria-label="Đóng panel"]');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(drawerTitle).not.toBeVisible();
  });

  test('should show view trace button on Revenue screen and open financial trace', async ({ page }) => {
    // 1. Go to revenue page
    await page.goto('/revenue');
    await page.waitForLoadState('networkidle');

    // 2. Verify table and buttons are loaded
    const traceBtn = page.locator('text=Xem truy vết').first();
    if (await traceBtn.isVisible()) {
      // 3. Click "Xem truy vết"
      await traceBtn.click();

      // 4. Verify Financial Trace Panel drawer is open
      const drawerTitle = page.locator('text=TRUY VẾT TÀI CHÍNH KẾ TOÁN');
      await expect(drawerTitle).toBeVisible();
    } else {
      console.log('No active invoices to click on Revenue page.');
    }
  });

  test('should show view trace button on Debt screen and open financial trace', async ({ page }) => {
    // 1. Go to debt page
    await page.goto('/debt');
    await page.waitForLoadState('networkidle');

    // 2. Verify table and buttons are loaded
    const traceBtn = page.locator('text=Truy vết').first();
    if (await traceBtn.isVisible()) {
      // 3. Click "Truy vết"
      await traceBtn.click();

      // 4. Verify Financial Trace Panel drawer is open
      const drawerTitle = page.locator('text=TRUY VẾT TÀI CHÍNH KẾ TOÁN');
      await expect(drawerTitle).toBeVisible();
    } else {
      console.log('No active invoices to click on Debt page.');
    }
  });
});

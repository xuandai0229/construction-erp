import { test, expect } from '@playwright/test';

test.describe('Enterprise Financial Governance & Stability', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Financial Dashboard Integrity: Metrics or Empty State', async ({ page }) => {
    const isEmpty = await page.locator('.erp-empty').isVisible();
    const hasKPIs = await page.locator('.t-kpi-value').count() > 0;
    
    expect(isEmpty || hasKPIs).toBeTruthy();
  });

  test('UI Scaling Resilience: Typography Constraints', async ({ page }) => {
    const title = page.locator('.t-page-title').first();
    if (await title.isVisible()) {
      const fontSize = await title.evaluate((el) => window.getComputedStyle(el).fontSize);
      const sizePx = parseFloat(fontSize);
      expect(sizePx).toBeLessThanOrEqual(32); 
    }
  });

  test('Layout Responsiveness: Main Container Bounding', async ({ page }) => {
    const shell = page.locator('.erp-shell').first();
    if (await shell.isVisible()) {
        const width = await shell.evaluate((el) => el.getBoundingClientRect().width);
        const viewport = page.viewportSize();
        const viewportWidth = viewport ? viewport.width : 1280;
        expect(width).toBeLessThanOrEqual(viewportWidth);
    }
  });

  test('Design System: Sidebar Presence', async ({ page }) => {
    const sidebar = page.locator('.erp-sidebar');
    await expect(sidebar).toBeVisible();
  });
});

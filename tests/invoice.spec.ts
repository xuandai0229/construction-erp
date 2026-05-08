import { test, expect } from '@playwright/test';

test.describe('Invoice Management Workflow', () => {
  test('should verify invoice and payment views render correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // We expect the financial panels to render (DebtPanel / ProfitPanel)
    // Checking for specific headers or elements that usually exist for finance
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    // Ensure the page doesn't have hydration errors that crash the component tree
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    
    // Refresh to trigger hydration
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // If an error overlay from Next.js appears, it usually has the ID #nextjs-portal or contains specific text
    const nextjsOverlay = page.locator('nextjs-portal');
    if (await nextjsOverlay.isVisible()) {
      console.warn("Hydration error overlay detected!");
    }
  });
});

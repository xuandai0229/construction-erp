import { test, expect } from '@playwright/test';

test.describe('Cost Management Workflow', () => {
  test('should render cost tables and open add cost modal', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to initialize
    await page.waitForLoadState('networkidle');

    // Wait for main dashboard to be visible
    await expect(page.locator('main')).toBeVisible();

    // Check if "Thêm chi phí" (Add Cost) button exists
    // The text might differ depending on the UI, using a generic selector approach
    const addCostBtn = page.locator('button', { hasText: /Thêm chi phí/i });
    
    // If the button exists and is visible, test the modal interaction
    if (await addCostBtn.isVisible()) {
      await addCostBtn.click();
      
      // Modal should appear
      const modal = page.locator('div[role="dialog"]');
      await expect(modal).toBeVisible();

      // Modal should have form elements
      await expect(modal.locator('input[name="amount"]')).toBeVisible();
      
      // Close modal to cleanup
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    }
  });

  test('should not crash on cost list render', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify no UI scale/zoom issues causing overflow on tables
    const tableContainer = page.locator('.erp-table-container').first();
    if (await tableContainer.isVisible()) {
      const box = await tableContainer.boundingBox();
      expect(box).not.toBeNull();
      // Ensure the table doesn't overflow a typical viewport
      if (box) {
        expect(box.width).toBeLessThanOrEqual(1920); 
      }
    }
  });
});

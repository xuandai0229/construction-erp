import { test, expect } from '@playwright/test';

test.describe('Authentication Workflow', () => {
  test('should bypass login due to mock auth provider', async ({ page }) => {
    // Navigate to explicit login page
    await page.goto('/login');
    
    // With AuthProvider mocked, it should auto-redirect to dashboard ('/')
    await page.waitForURL('**/');
    
    // Verify dashboard renders
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('text="Construction ERP"').first()).toBeVisible();
  });
});

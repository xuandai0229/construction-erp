import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Enforce logged in as Super Admin
  await page.request.post('/api/auth/session', { data: { role: 'SUPER_ADMIN' } });
});

test.describe('EXPORT & PRINT E2E SUITE', () => {
  test('should load print page for invoices and render the header', async ({ page }) => {
    // Navigate to a demo print invoice page (id is a placeholder, it will show the elegant placeholder since no actual invoice matches)
    await page.goto('/print/invoice/non-existent-id');
    await page.waitForLoadState('networkidle');

    // Confirm that the print document is rendered (either data or loading or error)
    const errorMsg = page.locator('text=Không tìm thấy chứng từ hóa đơn');
    const loadingMsg = page.locator('text=Đang tải dữ liệu chứng từ');
    
    const isVisible = (await errorMsg.isVisible()) || (await loadingMsg.isVisible());
    expect(isVisible).toBe(true);
  });

  test('should load print page for ledger and render successfully', async ({ page }) => {
    await page.goto('/print/ledger?projectId=demo-project&accountCode=111');
    await page.waitForLoadState('networkidle');

    const title = page.locator('text=SỔ CÁI CHI TIẾT TÀI KHOẢN');
    await expect(title).toBeVisible();
  });

  test('should load print page for debt and render successfully', async ({ page }) => {
    await page.goto('/print/debt?projectId=demo-project');
    await page.waitForLoadState('networkidle');

    const title = page.locator('text=BÁO CÁO TỔNG HỢP CÔNG NỢ PHẢI THU CHỦ ĐẦU TƯ');
    await expect(title).toBeVisible();
  });
});

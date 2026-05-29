import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Enforce logged in as Super Admin
  await page.request.post("/api/auth/session", { data: { role: "SUPER_ADMIN" } });
});

test.describe("APPROVAL INBOX E2E SUITE", () => {
  test("should load approvals page and render title and tabs", async ({ page }) => {
    await page.goto("/approvals");
    await page.waitForLoadState("networkidle");

    // Title verify
    const title = page.locator("text=Bàn Phê Duyệt Kế Toán (Approval Inbox)");
    await expect(title).toBeVisible();

    // Tabs verify
    const pendingTab = page.locator("text=Chờ tôi duyệt");
    await expect(pendingTab).toBeVisible();

    const myCreatedTab = page.locator("text=Tôi đã tạo");
    await expect(myCreatedTab).toBeVisible();

    const historyTab = page.locator("text=Tôi đã xử lý");
    await expect(historyTab).toBeVisible();

    const overdueTab = page.locator("text=Quá hạn duyệt");
    await expect(overdueTab).toBeVisible();

    const matrixTab = page.locator("text=Permission Matrix");
    await expect(matrixTab).toBeVisible();
  });

  test("should switch tabs and load components without crash", async ({ page }) => {
    await page.goto("/approvals");
    await page.waitForLoadState("networkidle");

    // Click on history tab
    await page.click("button:has-text('Tôi đã xử lý')");
    await page.waitForTimeout(500);
    
    // Check either table headers or empty state is visible
    const emptyState = page.locator("text=Không tìm thấy chứng từ nào phù hợp với bộ lọc");
    const tableHeader = page.locator("text=Số chứng từ");
    const isVisible = (await emptyState.isVisible()) || (await tableHeader.isVisible());
    expect(isVisible).toBe(true);

    // Click on matrix tab
    await page.click("button:has-text('Permission Matrix')");
    await page.waitForTimeout(500);
    const matrixHeader = page.locator("text=Ma Trận Phân Quyền Hệ Thống");
    await expect(matrixHeader).toBeVisible();
  });
});

import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.request.post("/api/auth/session", { data: { role: "SUPER_ADMIN" } });
});

test("approval inbox role-based work queue renders KPI, tabs and table safely", async ({ page }) => {
  const failedRequests: string[] = [];
  const consoleErrors: string[] = [];

  page.on("response", (response) => {
    if (response.url().includes("/api/approvals") && [403, 500].includes(response.status())) {
      failedRequests.push(`${response.status()} ${response.url()}`);
    }
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  const queueResponsePromise = page.waitForResponse((response) => response.url().includes("/api/approvals/work-queue"));
  const response = await page.goto("/approvals", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(400);
  const queueResponse = await queueResponsePromise;
  expect(queueResponse.status()).toBeLessThan(400);
  const queuePayload = await queueResponse.json();
  const itemCount = queuePayload?.data?.items?.length || 0;

  await expect(page.getByText("Hộp việc phê duyệt kế toán")).toBeVisible();
  await expect(page.getByText("Chờ tôi xử lý").first()).toBeVisible();
  await expect(page.getByText("Quá hạn")).toBeVisible();
  await expect(page.getByText("Giá trị đang chờ duyệt")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tôi đã gửi" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tất cả" })).toBeVisible();

  if (itemCount > 0) {
    await page.locator("tbody tr").first().click();
    await expect(page.getByText("Chi tiết công việc duyệt")).toBeVisible();
    await expect(page.getByText("Tổng quan")).toBeVisible();
    await expect(page.getByText("Workflow")).toBeVisible();
    await expect(page.getByText("Lịch sử thao tác")).toBeVisible();
  } else {
    await expect(page.getByText("Không có công việc phù hợp")).toBeVisible();
  }

  expect(failedRequests).toEqual([]);
  expect(consoleErrors.filter((error) => !error.includes("favicon"))).toEqual([]);
});

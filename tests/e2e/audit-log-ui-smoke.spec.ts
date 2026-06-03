import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.request.post("/api/auth/session", { data: { role: "SUPER_ADMIN" } });
});

test("financial drilldown shows read-only audit trail tab", async ({ page }) => {
  test.setTimeout(90_000);
  const failedAuditRequests: string[] = [];

  page.on("response", (response) => {
    if (response.url().includes("/api/audit/") && [403, 500].includes(response.status())) {
      failedAuditRequests.push(`${response.status()} ${response.url()}`);
    }
  });

  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(400);

  const drilldownResponsePromise = page.waitForResponse((res) => res.url().includes("/api/trace/financial-drilldown"), { timeout: 60_000 });
  await page.locator('main [class*="cursor-pointer"]').filter({ hasText: /doanh thu/i }).first().click();
  const drilldownResponse = await drilldownResponsePromise;
  expect(drilldownResponse.status()).toBeLessThan(400);

  const auditResponsePromise = page.waitForResponse((res) => res.url().includes("/api/audit/"), { timeout: 60_000 });
  await page.getByRole("button").filter({ hasText: /thao tác|Audit\/Trace/i }).last().click();
  const auditResponse = await auditResponsePromise;
  expect(auditResponse.status()).toBeLessThan(400);

  await expect(page.getByText("Lịch sử thao tác liên quan")).toBeVisible();
  await expect(page.getByText(/Chưa có lịch sử thao tác|Dữ liệu audit chỉ đọc|Read-only/)).toBeVisible();
  expect(failedAuditRequests).toEqual([]);
});

test("reports page shows recent export and print audit history panel", async ({ page }) => {
  const response = await page.goto("/reports", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(400);

  await expect(page.getByText("Lịch sử xuất/in gần đây")).toBeVisible();
  await expect(page.getByText("Read-only")).toBeVisible();
});

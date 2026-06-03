import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.request.post("/api/auth/session", { data: { role: "SUPER_ADMIN" } });
});

test("approvals page renders read-only workflow stepper", async ({ page }) => {
  const response = await page.goto("/approvals", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(400);

  const stepper = page.locator("section").filter({ hasText: "Luồng duyệt chứng từ" }).first();
  await expect(stepper).toBeVisible();
  await expect(stepper.getByText("Nháp", { exact: true })).toBeVisible();
  await expect(stepper.getByText("Chờ duyệt", { exact: true })).toBeVisible();
  await expect(stepper.getByText("Đã duyệt", { exact: true })).toBeVisible();
  await expect(stepper.getByText("Đã ghi sổ", { exact: true })).toBeVisible();
});

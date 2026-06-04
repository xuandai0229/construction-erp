import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.request.post("/api/auth/session", { data: { role: "SUPER_ADMIN" } });
});

test("approval SLA, notification and delegation pilot render safely", async ({ page }) => {
  const failedRequests: string[] = [];
  const consoleErrors: string[] = [];

  page.on("response", (response) => {
    if ((response.url().includes("/api/approvals") || response.url().includes("/api/workspace/notifications")) && [403, 500].includes(response.status())) {
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
  const payload = await queueResponse.json();
  const itemCount = payload?.data?.items?.length || 0;

  await expect(page.getByText("H\u1ed9p vi\u1ec7c ph\u00ea duy\u1ec7t k\u1ebf to\u00e1n")).toBeVisible();
  await expect(page.getByText("S\u1eafp qu\u00e1 h\u1ea1n").first()).toBeVisible();
  await expect(page.getByText("\u0110\u00e3 qu\u00e1 h\u1ea1n")).toBeVisible();
  await expect(page.getByText("Th\u1eddi gian ch\u1edd trung b\u00ecnh")).toBeVisible();
  await expect(page.getByText("Trung t\u00e2m th\u00f4ng b\u00e1o duy\u1ec7t")).toBeVisible();
  await expect(page.getByText("\u1ee6y quy\u1ec1n x\u1eed l\u00fd")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ch\u01b0a cho ph\u00e9p \u1ee7y quy\u1ec1n th\u1eadt" })).toBeDisabled();

  await page.getByRole("button", { name: "Qu\u00e1 h\u1ea1n", exact: true }).click();
  await expect(page.getByRole("button", { name: "Qu\u00e1 h\u1ea1n", exact: true })).toHaveClass(/bg-\[var\(--primary\)\]/);
  await page.getByRole("button", { name: "T\u1ea5t c\u1ea3 SLA", exact: true }).click();

  if (itemCount > 0) {
    await page.locator("tbody tr").first().click();
    await expect(page.locator("aside")).toBeVisible();
    await page.getByRole("button", { name: "SLA" }).click();
    await expect(page.getByText("Th\u1eddi gian ch\u1edd x\u1eed l\u00fd")).toBeVisible();
    await expect(page.getByText("M\u1ed1c t\u00ednh SLA")).toBeVisible();
    await expect(page.getByText("C\u1ea5p duy\u1ec7t \u0111\u1ec1 xu\u1ea5t")).toBeVisible();
    await expect(page.getByRole("button", { name: "Ch\u01b0a k\u00edch ho\u1ea1t \u1ee7y quy\u1ec1n th\u1eadt" })).toBeDisabled();
  } else {
    await expect(page.getByText("Kh\u00f4ng c\u00f3 c\u00f4ng vi\u1ec7c ph\u00f9 h\u1ee3p")).toBeVisible();
  }

  expect(failedRequests).toEqual([]);
  expect(consoleErrors.filter((error) => !error.includes("favicon"))).toEqual([]);
});

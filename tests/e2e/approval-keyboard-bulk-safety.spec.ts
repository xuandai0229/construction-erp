import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.request.post("/api/auth/session", { data: { role: "SUPER_ADMIN" } });
});

test("approval inbox supports safe keyboard navigation and guarded bulk preview", async ({ page }) => {
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
  await expect(page.getByRole("button", { name: "Phím tắt" })).toBeVisible();

  await page.keyboard.press("/");
  await expect(page.getByPlaceholder("Tìm số chứng từ, công trình, người tạo...")).toBeFocused();
  await page.locator("body").click({ position: { x: 12, y: 12 } });

  await page.keyboard.press("?");
  await expect(page.getByText("Mở chi tiết dòng đang focus")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText("Mở chi tiết dòng đang focus")).toBeHidden();

  if (itemCount > 0) {
    await page.keyboard.press("j");
    await page.keyboard.press("k");
    await page.keyboard.press("Space");
    await expect(page.getByText(/Đã chọn: 1 chứng từ/)).toBeVisible();

    const approveButton = page.getByRole("button", { name: "Duyệt hàng loạt" });
    const rejectButton = page.getByRole("button", { name: "Từ chối hàng loạt" });

    if (await approveButton.isEnabled()) {
      await approveButton.click();
      await expect(page.getByText("Xác nhận duyệt hàng loạt")).toBeVisible();
      await expect(page.getByText("Thao tác này sẽ gọi API hiện hữu theo từng chứng từ")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByText("Xác nhận duyệt hàng loạt")).toBeHidden();
    } else if (await rejectButton.isEnabled()) {
      await rejectButton.click();
      await expect(page.getByText("Xác nhận từ chối hàng loạt")).toBeVisible();
      await expect(page.getByRole("button", { name: "Xác nhận xử lý" })).toBeDisabled();
      await page.getByPlaceholder("Nhập lý do từ chối áp dụng cho toàn bộ chứng từ đã chọn...").fill("Không đủ hồ sơ duyệt");
      await expect(page.getByRole("button", { name: "Xác nhận xử lý" })).toBeEnabled();
      await page.keyboard.press("Escape");
      await expect(page.getByText("Xác nhận từ chối hàng loạt")).toBeHidden();
    } else {
      await expect(page.getByText("Có dòng không hợp lệ")).toBeVisible();
    }

    await page.keyboard.press("Enter");
    await expect(page.locator("aside")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("aside")).toBeHidden();
  } else {
    await expect(page.getByText("Không có công việc phù hợp")).toBeVisible();
  }

  expect(failedRequests).toEqual([]);
  expect(consoleErrors.filter((error) => !error.includes("favicon"))).toEqual([]);
});

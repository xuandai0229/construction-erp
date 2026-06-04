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

  await expect(page.getByText("H\u1ed9p vi\u1ec7c ph\u00ea duy\u1ec7t k\u1ebf to\u00e1n")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ph\u00edm t\u1eaft" })).toBeVisible();

  await page.keyboard.press("/");
  await expect(page.getByPlaceholder("T\u00ecm s\u1ed1 ch\u1ee9ng t\u1eeb, c\u00f4ng tr\u00ecnh, ng\u01b0\u1eddi t\u1ea1o...")).toBeFocused();
  await page.locator("body").click({ position: { x: 12, y: 12 } });

  await page.keyboard.press("?");
  await expect(page.getByText("M\u1edf chi ti\u1ebft d\u00f2ng \u0111ang focus")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText("M\u1edf chi ti\u1ebft d\u00f2ng \u0111ang focus")).toBeHidden();

  if (itemCount > 0) {
    await page.keyboard.press("j");
    await page.keyboard.press("k");
    await page.keyboard.press("Space");
    await expect(page.getByText(/\u0110\u00e3 ch\u1ecdn: 1 ch\u1ee9ng t\u1eeb/)).toBeVisible();

    const approveButton = page.getByRole("button", { name: "Duy\u1ec7t h\u00e0ng lo\u1ea1t" });
    const rejectButton = page.getByRole("button", { name: "T\u1eeb ch\u1ed1i h\u00e0ng lo\u1ea1t" });

    if (await approveButton.isEnabled()) {
      await approveButton.click();
      await expect(page.getByText("X\u00e1c nh\u1eadn duy\u1ec7t h\u00e0ng lo\u1ea1t")).toBeVisible();
      await expect(page.getByText("Thao t\u00e1c n\u00e0y s\u1ebd g\u1ecdi API hi\u1ec7n h\u1eefu theo t\u1eebng ch\u1ee9ng t\u1eeb")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByText("X\u00e1c nh\u1eadn duy\u1ec7t h\u00e0ng lo\u1ea1t")).toBeHidden();
    } else if (await rejectButton.isEnabled()) {
      await rejectButton.click();
      await expect(page.getByText("X\u00e1c nh\u1eadn t\u1eeb ch\u1ed1i h\u00e0ng lo\u1ea1t")).toBeVisible();
      await expect(page.getByRole("button", { name: "X\u00e1c nh\u1eadn x\u1eed l\u00fd" })).toBeDisabled();
      await page.getByPlaceholder("Nh\u1eadp l\u00fd do t\u1eeb ch\u1ed1i \u00e1p d\u1ee5ng cho to\u00e0n b\u1ed9 ch\u1ee9ng t\u1eeb \u0111\u00e3 ch\u1ecdn...").fill("Kh\u00f4ng \u0111\u1ee7 h\u1ed3 s\u01a1 duy\u1ec7t");
      await expect(page.getByRole("button", { name: "X\u00e1c nh\u1eadn x\u1eed l\u00fd" })).toBeEnabled();
      await page.keyboard.press("Escape");
      await expect(page.getByText("X\u00e1c nh\u1eadn t\u1eeb ch\u1ed1i h\u00e0ng lo\u1ea1t")).toBeHidden();
    } else {
      await expect(page.getByText("C\u00f3 d\u00f2ng kh\u00f4ng h\u1ee3p l\u1ec7")).toBeVisible();
    }

    await page.keyboard.press("Enter");
    await expect(page.locator("aside").first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("aside").first()).toBeHidden();
  } else {
    await expect(page.getByText("Kh\u00f4ng c\u00f3 c\u00f4ng vi\u1ec7c ph\u00f9 h\u1ee3p")).toBeVisible();
  }

  expect(failedRequests).toEqual([]);
  expect(consoleErrors.filter((error) => !error.includes("favicon"))).toEqual([]);
});

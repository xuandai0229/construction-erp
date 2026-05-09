# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: governance-financial.spec.ts >> Enterprise Financial Governance & Stability >> Financial Dashboard Integrity: Metrics or Empty State
- Location: tests\governance-financial.spec.ts:10:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e9] [cursor=pointer]:
    - img [ref=e10]
  - alert [ref=e13]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Enterprise Financial Governance & Stability', () => {
  4  |   
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await page.goto('/');
  7  |     await page.waitForLoadState('networkidle');
  8  |   });
  9  | 
  10 |   test('Financial Dashboard Integrity: Metrics or Empty State', async ({ page }) => {
  11 |     const isEmpty = await page.locator('.erp-empty').isVisible();
  12 |     const hasKPIs = await page.locator('.t-kpi-value').count() > 0;
  13 |     
> 14 |     expect(isEmpty || hasKPIs).toBeTruthy();
     |                                ^ Error: expect(received).toBeTruthy()
  15 |   });
  16 | 
  17 |   test('UI Scaling Resilience: Typography Constraints', async ({ page }) => {
  18 |     const title = page.locator('.t-page-title').first();
  19 |     if (await title.isVisible()) {
  20 |       const fontSize = await title.evaluate((el) => window.getComputedStyle(el).fontSize);
  21 |       const sizePx = parseFloat(fontSize);
  22 |       expect(sizePx).toBeLessThanOrEqual(32); 
  23 |     }
  24 |   });
  25 | 
  26 |   test('Layout Responsiveness: Main Container Bounding', async ({ page }) => {
  27 |     const shell = page.locator('.erp-shell').first();
  28 |     if (await shell.isVisible()) {
  29 |         const width = await shell.evaluate((el) => el.getBoundingClientRect().width);
  30 |         const viewport = page.viewportSize();
  31 |         const viewportWidth = viewport ? viewport.width : 1280;
  32 |         expect(width).toBeLessThanOrEqual(viewportWidth);
  33 |     }
  34 |   });
  35 | 
  36 |   test('Design System: Sidebar Presence', async ({ page }) => {
  37 |     const sidebar = page.locator('.erp-sidebar');
  38 |     await expect(sidebar).toBeVisible();
  39 |   });
  40 | });
  41 | 
```
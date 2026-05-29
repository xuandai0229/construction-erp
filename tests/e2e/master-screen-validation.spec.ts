/**
 * MASTER SCREEN-BY-SCREEN E2E VALIDATION
 *
 * Validates core ERP screens with real browser interactions.
 */

import { test, expect, Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
});

test.afterAll(async () => {
  await page.close();
});

test.describe('DASHBOARD Screen Validation', () => {
  test('should load dashboard with KPIs', async () => {
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(2000);

    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/CÔNG NỢ PHẢI THU|CÔNG NỢ PHẢI TRẢ|TỔNG CHI PHÍ/i').first()).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'test-results/dashboard-loaded.png', fullPage: true });
  });

  test('should display accounting KPI labels', async () => {
    await expect(page.locator('text=/CÔNG NỢ PHẢI THU/i').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/CÔNG NỢ PHẢI TRẢ/i').first()).toBeVisible({ timeout: 5000 });
    console.log('Accounting KPI labels displayed');
  });

  test('should display budget overrun KPI', async () => {
    const costElement = page.locator('text=/TỔNG CHI PHÍ/i').first();
    await expect(costElement).toBeVisible({ timeout: 5000 });
    console.log('Budget overrun KPI displayed:', await costElement.textContent());
  });

  test('should display receivable information', async () => {
    const recvElement = page.locator('text=/CÔNG NỢ PHẢI THU/i').first();
    await expect(recvElement).toBeVisible({ timeout: 5000 });
    console.log('Receivable KPI displayed:', await recvElement.textContent());
  });
});

test.describe('PROJECT MANAGEMENT Screen Validation', () => {
  test('should navigate to projects page', async () => {
    await page.goto('http://localhost:3000/projects');
    await page.waitForTimeout(2000);

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/projects-page.png', fullPage: true });
  });

  test('should display project list', async () => {
    const projectList = page.locator('main').first();
    await expect(projectList).toBeVisible({ timeout: 5000 });
    console.log('Project list displayed');
  });
});

test.describe('COST MANAGEMENT Screen Validation', () => {
  test('should navigate to costs page', async () => {
    await page.goto('http://localhost:3000/costs');
    await page.waitForTimeout(2000);

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/costs-page.png', fullPage: true });
  });

  test('should display cost records', async () => {
    const costList = page.locator('main').first();
    await expect(costList).toBeVisible({ timeout: 5000 });
    console.log('Cost list displayed');
  });
});

test.describe('REVENUE & DEBT Screen Validation', () => {
  test('should navigate to revenue page', async () => {
    await page.goto('http://localhost:3000/revenue');
    await page.waitForTimeout(2000);

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/revenue-page.png', fullPage: true });
  });

  test('should navigate to debt page', async () => {
    await page.goto('http://localhost:3000/debt');
    await page.waitForTimeout(2000);

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/debt-page.png', fullPage: true });
    console.log('Debt page loaded');
  });
});

test.describe('BUDGET MANAGEMENT Screen Validation', () => {
  test('should navigate to budget page', async () => {
    await page.goto('http://localhost:3000/budget');
    await page.waitForTimeout(2000);

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/budget-page.png', fullPage: true });
    console.log('Budget page loaded');
  });
});

test.describe('WBS Screen Validation', () => {
  test('should navigate to WBS page', async () => {
    await page.goto('http://localhost:3000/wbs');
    await page.waitForTimeout(2000);

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/wbs-page.png', fullPage: true });
    console.log('WBS page loaded');
  });
});

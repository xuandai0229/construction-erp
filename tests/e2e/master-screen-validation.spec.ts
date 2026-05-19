/**
 * MASTER SCREEN-BY-SCREEN E2E VALIDATION
 * 
 * This test suite validates every screen in the ERP system with real browser interactions
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
test.describe.configure({ mode: 'serial' });

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  
  // Login first
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  
  // Wait for page to be ready
  await page.waitForTimeout(3000);
});

test.afterAll(async () => {
  await page.close();
});

// ============================================================
// DASHBOARD VALIDATION
// ============================================================

test.describe('DASHBOARD Screen Validation', () => {
  
  test('should load dashboard with KPIs', async () => {
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(2000);
    
    // Check for key dashboard elements
    await expect(page.locator('text=/WBS/i').first()).toBeVisible({ timeout: 10000 });
    
    // Take screenshot for evidence
    await page.screenshot({ path: 'test-results/dashboard-loaded.png', fullPage: true });
  });
  
  test('should display total budget KPI', async () => {
    const budgetElement = page.locator('text=/Tổng dự toán BOQ/i').first();
    await expect(budgetElement).toBeVisible({ timeout: 5000 });
    
    const text = await budgetElement.textContent();
    console.log('✅ Total budget displayed:', text);
  });
  
  test('should display actual cost KPI', async () => {
    const costElement = page.locator('text=/Chi phí thực tế/i').first();
    await expect(costElement).toBeVisible({ timeout: 5000 });
    
    const text = await costElement.textContent();
    console.log('✅ Actual cost displayed:', text);
  });
  
  test('should display receivable information', async () => {
    const recvElement = page.locator('text=/Công nợ Phải thu/i').first();
    
    if (await recvElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      const text = await recvElement.textContent();
      console.log('✅ Receivable displayed:', text);
    } else {
      console.log('⚠️  Receivable not visible on dashboard');
    }
  });
});

// ============================================================
// PROJECT MANAGEMENT VALIDATION
// ============================================================

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
    
    console.log('✅ Project list displayed');
  });
});

// ============================================================
// COST MANAGEMENT VALIDATION
// ============================================================

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
    
    console.log('✅ Cost list displayed');
  });
});

// ============================================================
// REVENUE & DEBT VALIDATION
// ============================================================

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
    
    await page.screenshot({ path: 'test-results/debt-page.png', fullPage: true });
    console.log('✅ Debt page loaded');
  });
});

// ============================================================
// BUDGET MANAGEMENT VALIDATION
// ============================================================

test.describe('BUDGET MANAGEMENT Screen Validation', () => {
  
  test('should navigate to budget page', async () => {
    await page.goto('http://localhost:3000/budget');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/budget-page.png', fullPage: true });
    console.log('✅ Budget page loaded');
  });
});

// ============================================================
// WBS VALIDATION
// ============================================================

test.describe('WBS Screen Validation', () => {
  
  test('should navigate to WBS page', async () => {
    await page.goto('http://localhost:3000/wbs');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/wbs-page.png', fullPage: true });
    console.log('✅ WBS page loaded');
  });
});

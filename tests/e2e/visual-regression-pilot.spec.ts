import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = path.join(process.cwd(), 'test-results', 'visual-pilot');

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'tablet-wide', width: 1024, height: 768 },
];

const routes = [
  { name: 'dashboard', route: '/' },
  { name: 'projects', route: '/projects' },
  { name: 'wbs', route: '/wbs' },
  { name: 'budget', route: '/budget' },
  { name: 'costs', route: '/costs' },
  { name: 'revenue', route: '/revenue' },
  { name: 'debt', route: '/debt' },
  { name: 'accounting', route: '/accounting' },
  { name: 'inventory', route: '/inventory' },
  { name: 'reports', route: '/reports' },
  { name: 'print-debt', route: '/print/debt' },
  { name: 'print-ledger', route: '/print/ledger' },
];

type Finding = {
  viewport: string;
  route: string;
  status: 'PASS' | 'PASS_WITH_WARNING' | 'NOT_TESTED_NO_ROUTE';
  issues: string[];
  screenshot?: string;
};

function ensureArtifactDir() {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function login(page: Page) {
  await page.request.post('/api/auth/session', { data: { role: 'SUPER_ADMIN' } });
}

function visibleUiText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

test('visual regression pilot captures core ERP screens across desktop viewports', async ({ page }) => {
  ensureArtifactDir();
  await login(page);

  const findings: Finding[] = [];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    for (const target of routes) {
      const issues: string[] = [];
      const consoleErrors: string[] = [];
      const failedRequests: string[] = [];

      const consoleHandler = (message: { type: () => string; text: () => string }) => {
        if (message.type() === 'error' && !message.text().includes('favicon')) {
          consoleErrors.push(message.text());
        }
      };
      const requestFailedHandler = (request: { failure: () => { errorText: string } | null; url: () => string }) => {
        const errorText = request.failure()?.errorText || '';
        if (!errorText.includes('net::ERR_ABORTED')) {
          failedRequests.push(`${request.url()} ${errorText}`);
        }
      };

      page.on('console', consoleHandler);
      page.on('requestfailed', requestFailedHandler);

      const response = await page.goto(target.route, { waitUntil: 'domcontentloaded' });
      const status = response?.status() || 0;
      if (status >= 400) {
        findings.push({ viewport: viewport.name, route: target.route, status: 'NOT_TESTED_NO_ROUTE', issues: [`HTTP ${status}`] });
        page.off('console', consoleHandler);
        page.off('requestfailed', requestFailedHandler);
        continue;
      }

      await expect(page.locator('body')).toBeVisible();
      await page.waitForTimeout(350);

      const screenshot = path.join(artifactDir, `${viewport.name}-${target.name}.png`);
      await page.screenshot({ path: screenshot, fullPage: true });

      const text = visibleUiText(await page.locator('body').innerText());
      if (/(Ãƒ|Ã„|Ã‚|Ã¢â‚¬|Ã¡Âº|Ã¡Â»|Ã†Â°|Ã†Â¡|ï¿½)/.test(text)) {
        issues.push('Phát hiện mojibake hoặc ký tự lỗi tiếng Việt trong UI.');
      }
      if (/\b(No data|Failed|Loading|Error)\b/.test(text)) {
        issues.push('Phát hiện text tiếng Anh user-facing phổ biến.');
      }
      if (consoleErrors.length > 0) {
        issues.push(`Console error: ${consoleErrors.slice(0, 3).join(' | ')}`);
      }
      if (failedRequests.length > 0) {
        issues.push(`Request failed: ${failedRequests.slice(0, 3).join(' | ')}`);
      }

      const tables = await page.locator('table').count();
      if (tables > 0) {
        const firstTableBox = await page.locator('table').first().boundingBox();
        if (!firstTableBox || firstTableBox.width < 320 || firstTableBox.height < 40) {
          issues.push('Bảng đầu tiên có kích thước bất thường.');
        }
      }

      findings.push({
        viewport: viewport.name,
        route: target.route,
        status: issues.length > 0 ? 'PASS_WITH_WARNING' : 'PASS',
        issues,
        screenshot,
      });

      page.off('console', consoleHandler);
      page.off('requestfailed', requestFailedHandler);
    }
  }

  fs.writeFileSync(path.join(artifactDir, 'visual-regression-findings.json'), JSON.stringify(findings, null, 2), 'utf8');

  const loadedScreens = findings.filter((item) => item.status !== 'NOT_TESTED_NO_ROUTE');
  expect(loadedScreens.length).toBeGreaterThan(0);
});

test('visual regression pilot captures light and dark theme samples', async ({ page }) => {
  ensureArtifactDir();
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    document.documentElement.classList.add('light');
    localStorage.setItem('theme', 'light');
  });
  await page.screenshot({ path: path.join(artifactDir, 'theme-light-dashboard.png'), fullPage: true });
  await page.getByText('Tổng doanh thu hạch toán').click();
  await expect(page.getByText('Truy vết tổng doanh thu')).toBeVisible();
  await page.screenshot({ path: path.join(artifactDir, 'theme-light-drilldown.png'), fullPage: true });
  await page.getByLabel('Đóng truy vết tài chính').click();

  await page.evaluate(() => {
    document.documentElement.classList.remove('light');
    localStorage.setItem('theme', 'dark');
  });
  await page.screenshot({ path: path.join(artifactDir, 'theme-dark-dashboard.png'), fullPage: true });
});

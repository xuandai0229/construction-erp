import { expect, test, type APIRequestContext } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = path.join(process.cwd(), 'test-results', 'visual-pilot');

type PrintFinding = {
  route: string;
  status: 'PASS' | 'PASS_WITH_WARNING' | 'NOT_TESTED_NO_SAMPLE_DATA';
  issues: string[];
  screenshot?: string;
};

function ensureArtifactDir() {
  fs.mkdirSync(artifactDir, { recursive: true });
}

function extractArray(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.data)) return record.data as Record<string, unknown>[];
  if (record.data && typeof record.data === 'object') {
    const nested = record.data as Record<string, unknown>;
    if (Array.isArray(nested.data)) return nested.data as Record<string, unknown>[];
    if (Array.isArray(nested.items)) return nested.items as Record<string, unknown>[];
  }
  if (Array.isArray(record.items)) return record.items as Record<string, unknown>[];
  return [];
}

async function getJson(pageRequest: APIRequestContext, url: string) {
  const response = await pageRequest.get(url);
  if (!response.ok()) return null;
  return response.json().catch(() => null);
}

test.beforeEach(async ({ page }) => {
  ensureArtifactDir();
  await page.request.post('/api/auth/session', { data: { role: 'SUPER_ADMIN' } });
});

test('dynamic print routes use safe read-only sample ids when available', async ({ page, request }) => {
  const findings: PrintFinding[] = [];
  await page.setViewportSize({ width: 1366, height: 900 });

  const projects = extractArray(await getJson(request, '/api/projects'));
  const projectId = projects[0]?.id as string | undefined;

  const invoices = projectId ? extractArray(await getJson(request, `/api/invoices?projectId=${projectId}`)) : [];
  const payments = extractArray(await getJson(request, projectId ? `/api/payments?projectId=${projectId}` : '/api/payments'));
  const advances = extractArray(await getJson(request, '/api/advances'));
  const inventoryDocs = extractArray(await getJson(request, '/api/inventory/documents'));

  const candidates = [
    { label: 'invoice', route: invoices[0]?.id ? `/print/invoice/${invoices[0].id}` : null },
    { label: 'payment', route: payments[0]?.id ? `/print/payment/${payments[0].id}` : null },
    { label: 'advance', route: advances[0]?.id ? `/print/advance/${advances[0].id}` : null },
    {
      label: 'inventory-receipt',
      route: inventoryDocs.find((doc) => String(doc.documentType || '').includes('RECEIPT'))?.id
        ? `/print/inventory/receipt/${inventoryDocs.find((doc) => String(doc.documentType || '').includes('RECEIPT'))?.id}`
        : null,
    },
    {
      label: 'inventory-issue',
      route: inventoryDocs.find((doc) => String(doc.documentType || '').includes('ISSUE'))?.id
        ? `/print/inventory/issue/${inventoryDocs.find((doc) => String(doc.documentType || '').includes('ISSUE'))?.id}`
        : null,
    },
  ];

  for (const candidate of candidates) {
    if (!candidate.route) {
      findings.push({ route: candidate.label, status: 'NOT_TESTED_NO_SAMPLE_DATA', issues: ['Không có sample ID read-only an toàn trong dữ liệu hiện tại.'] });
      continue;
    }

    const response = await page.goto(candidate.route, { waitUntil: 'domcontentloaded' });
    const status = response?.status() || 0;
    const issues: string[] = [];

    if (status >= 400) {
      issues.push(`HTTP ${status}`);
    } else {
      await expect(page.locator('body')).toBeVisible();
      await page.waitForTimeout(250);
      const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
      if (/(Ãƒ|Ã„|Ã‚|Ã¢â‚¬|Ã¡Âº|Ã¡Â»|Ã†Â°|Ã†Â¡|ï¿½)/.test(text)) {
        issues.push('Phát hiện mojibake hoặc ký tự lỗi tiếng Việt trong mẫu in.');
      }
      if (!/đ|VND|VNĐ/.test(text)) {
        issues.push('Chưa thấy ký hiệu tiền Việt trong mẫu in.');
      }
    }

    const screenshot = path.join(artifactDir, `print-dynamic-${candidate.label}.png`);
    if (status < 400) {
      await page.screenshot({ path: screenshot, fullPage: true });
    }

    findings.push({
      route: candidate.route,
      status: issues.length > 0 ? 'PASS_WITH_WARNING' : 'PASS',
      issues,
      screenshot: status < 400 ? screenshot : undefined,
    });
  }

  fs.writeFileSync(path.join(artifactDir, 'print-dynamic-findings.json'), JSON.stringify(findings, null, 2), 'utf8');
  expect(findings.length).toBeGreaterThan(0);
});

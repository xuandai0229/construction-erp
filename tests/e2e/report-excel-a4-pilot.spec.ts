import { expect, test, type APIRequestContext } from '@playwright/test';

const pilotReportTypes = [
  'ADVANCE_PAYMENT_SUMMARY',
  'DEBT_AR_AP_SUMMARY',
  'COST_BY_PROJECT_WBS',
  'BUDGET_VS_ACTUAL',
] as const;

async function getProjectId(request: APIRequestContext) {
  const response = await request.get('/api/projects');
  expect(response.status()).toBeLessThan(400);
  const payload = await response.json();
  return payload?.data?.[0]?.id as string | undefined;
}

test.beforeEach(async ({ page, request }) => {
  await page.request.post('/api/auth/session', { data: { role: 'SUPER_ADMIN' } });
  await request.post('/api/auth/session', { data: { role: 'SUPER_ADMIN' } });
});

test('/reports shows grouped report pilot without mojibake', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('favicon')) {
      consoleErrors.push(message.text());
    }
  });

  const response = await page.goto('/reports', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  await expect(page.getByRole('heading', { name: 'Tạm ứng / thanh toán' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Công nợ phải thu / phải trả' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Chi phí / ngân sách công trình' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sổ cái / báo cáo tài chính' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Xuất CSV audited' }).first()).toBeVisible();

  const bodyText = await page.locator('body').innerText();
  expect(bodyText).not.toMatch(/Ãƒ|Ã„|Ã‚|Ã¢â‚¬|Ã¡Âº|Ã¡Â»|Ã†Â°|Ã†Â¡|ï¿½/);
  expect(consoleErrors).toEqual([]);
});

test('audited CSV fallback exports include A4 pilot header', async ({ request }) => {
  const projectId = await getProjectId(request);
  test.skip(!projectId, 'Không có project ID read-only để kiểm tra export pilot.');

  for (const reportType of pilotReportTypes) {
    const response = await request.post('/api/reports/audited-export', {
      data: {
        reportType,
        projectId,
        filters: { projectId, pilot: 'SPRINT_3A_5' },
        reason: `Kiểm tra export pilot ${reportType}`,
      },
    });

    expect(response.status(), reportType).toBeLessThan(400);
    expect(response.headers()['content-type'], reportType).toContain('text/csv');
    const csv = await response.text();
    expect(csv, reportType).toContain('CÔNG TY CP THƯƠNG MẠI VÀ XÂY DỰNG SỐ 2 HN');
    expect(csv, reportType).toContain('CSV fallback');
    expect(csv, reportType).not.toMatch(/Ãƒ|Ã„|Ã‚|Ã¢â‚¬|Ã¡Âº|Ã¡Â»|Ã†Â°|Ã†Â¡|ï¿½/);
  }
});

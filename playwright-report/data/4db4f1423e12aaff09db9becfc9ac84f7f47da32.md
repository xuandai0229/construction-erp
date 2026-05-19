# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: master-screen-validation.spec.ts >> DASHBOARD Screen Validation >> should load dashboard with KPIs
- Location: tests\e2e\master-screen-validation.spec.ts:34:7

# Error details

```
"beforeAll" hook timeout of 45000ms exceeded.
```

```
Error: page.waitForLoadState: Target page, context or browser has been closed
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - img [ref=e6]
        - generic [ref=e8]:
          - generic [ref=e9]: XÂY DỰNG
          - generic [ref=e10]: ERP DOANH NGHIỆP
      - navigation [ref=e11]:
        - generic [ref=e12]:
          - generic [ref=e13]: ĐIỀU HÀNH
          - button "Tổng quan" [ref=e14]:
            - img [ref=e17]
            - generic [ref=e19]: Tổng quan
          - button "Dự án" [ref=e20]:
            - img [ref=e22]
            - generic [ref=e24]: Dự án
          - button "Hạng mục (WBS)" [ref=e25]:
            - img [ref=e27]
            - generic [ref=e29]: Hạng mục (WBS)
          - button "Dự toán" [ref=e30]:
            - img [ref=e32]
            - generic [ref=e34]: Dự toán
          - button "Chi phí" [ref=e35]:
            - img [ref=e37]
            - generic [ref=e39]: Chi phí
          - button "Doanh thu" [ref=e40]:
            - img [ref=e42]
            - generic [ref=e44]: Doanh thu
          - button "Công nợ" [ref=e45]:
            - img [ref=e47]
            - generic [ref=e49]: Công nợ
          - button "Báo cáo" [ref=e50]:
            - img [ref=e52]
            - generic [ref=e54]: Báo cáo
          - button "Hệ thống" [ref=e55]:
            - img [ref=e57]
            - generic [ref=e59]: Hệ thống
      - generic [ref=e60]:
        - button "Chế độ hiển thị" [ref=e61]:
          - img [ref=e63]
          - generic [ref=e65]: Chế độ hiển thị
        - button "Thu gọn menu" [ref=e66]:
          - img [ref=e68]
          - generic [ref=e70]: Thu gọn menu
    - main [ref=e71]:
      - generic [ref=e73]:
        - button "Khu Đô Thị Thông Minh Vinhomes Ocean Park 3 7DBA033B • Vận hành" [ref=e76]:
          - generic [ref=e77]:
            - generic [ref=e78]:
              - generic [ref=e79]: Khu Đô Thị Thông Minh Vinhomes Ocean Park 3
              - img [ref=e80]
            - generic [ref=e82]:
              - generic [ref=e83]: 7DBA033B
              - generic [ref=e84]: •
              - generic [ref=e85]: Vận hành
        - generic [ref=e86]:
          - generic [ref=e87]:
            - img [ref=e89]
            - generic [ref=e91]:
              - generic [ref=e92]: Chủ đầu tư / Đối tác
              - generic [ref=e93]: Tập đoàn Vingroup
          - generic [ref=e94]:
            - img [ref=e96]
            - generic [ref=e98]:
              - generic [ref=e99]: Giá trị HĐ
              - generic [ref=e100]: 4.800.000.000.000
          - generic [ref=e101]:
            - img [ref=e103]
            - generic [ref=e105]:
              - generic [ref=e106]: Loại công trình
              - generic [ref=e107]: URBAN_DEVELOPMENT
        - generic [ref=e108]:
          - button "Chi phí" [ref=e110]:
            - img [ref=e111]
            - generic [ref=e113]: Chi phí
          - button [ref=e115]:
            - img [ref=e116]
          - button "QU Quản trị viên hệ thống Quản trị viên hệ thống" [ref=e120]:
            - generic [ref=e121]: QU
            - generic [ref=e122]:
              - generic [ref=e123]: Quản trị viên hệ thống
              - generic [ref=e124]: Quản trị viên hệ thống
            - img [ref=e125]
      - generic [ref=e127]:
        - generic [ref=e128]:
          - generic [ref=e130]:
            - generic [ref=e131]:
              - img [ref=e133]
              - generic [ref=e135]: Tài chính
            - generic [ref=e136]:
              - generic [ref=e137]: Doanh thu ghi nhận
              - generic [ref=e138]:
                - generic [ref=e139]: "0"
                - generic [ref=e140]: đ
          - generic [ref=e142]:
            - generic [ref=e143]:
              - img [ref=e145]
              - generic [ref=e147]: Tài chính
            - generic [ref=e148]:
              - generic [ref=e149]: Tổng dự toán BOQ
              - generic [ref=e150]:
                - generic [ref=e151]: 5.000.000.000.000
                - generic [ref=e152]: đ
          - generic [ref=e154]:
            - generic [ref=e155]:
              - img [ref=e157]
              - generic [ref=e159]: Tài chính
            - generic [ref=e160]:
              - generic [ref=e161]: Chi phí thực tế
              - generic [ref=e162]:
                - generic [ref=e163]: 78.000.000.000
                - generic [ref=e164]: đ
          - generic [ref=e166]:
            - generic [ref=e167]:
              - img [ref=e169]
              - generic [ref=e171]: Lỗ
            - generic [ref=e172]:
              - generic [ref=e173]: Lợi nhuận gộp
              - generic [ref=e174]:
                - generic [ref=e175]: "-78.000.000.000"
                - generic [ref=e176]: đ
          - generic [ref=e178]:
            - generic [ref=e179]:
              - img [ref=e181]
              - generic [ref=e183]: Công nợ
            - generic [ref=e184]:
              - generic [ref=e185]: Công nợ Phải thu
              - generic [ref=e186]:
                - generic [ref=e187]: "0"
                - generic [ref=e188]: đ
          - generic [ref=e190]:
            - generic [ref=e191]:
              - img [ref=e193]
              - generic [ref=e195]: Công nợ
            - generic [ref=e196]:
              - generic [ref=e197]: Công nợ Phải trả
              - generic [ref=e198]:
                - generic [ref=e199]: "0"
                - generic [ref=e200]: đ
        - generic [ref=e202]:
          - generic [ref=e204]:
            - heading "Phân bổ ngân sách" [level=4] [ref=e205]
            - generic [ref=e206]:
              - generic [ref=e207]:
                - img [ref=e208]
                - generic:
                  - generic:
                    - generic: 5800.0 tỷ
                    - generic: Triệu VND
              - generic [ref=e212]:
                - generic [ref=e213]:
                  - generic [ref=e215]: Nhân công
                  - generic [ref=e216]: 43%
                  - generic [ref=e217]: 2.500.000.000.000
                - generic [ref=e218]:
                  - generic [ref=e220]: Chi phí chung
                  - generic [ref=e221]: 57%
                  - generic [ref=e222]: 3.300.000.000.000
          - generic [ref=e224]:
            - generic [ref=e225]:
              - heading "Dòng tiền (triệu VND)" [level=4] [ref=e226]
              - generic [ref=e227]:
                - generic [ref=e228]: Thu
                - generic [ref=e230]: Chi
            - img [ref=e232]:
              - generic [ref=e234]: "0"
              - generic [ref=e236]: "16800"
              - generic [ref=e238]: "33600"
              - generic [ref=e240]: "50400"
              - generic [ref=e247]: 03/2024
              - generic [ref=e251]: 04/2024
              - generic [ref=e255]: 05/2024
              - generic [ref=e259]: 06/2024
              - generic [ref=e263]: 07/2024
          - generic [ref=e265]:
            - heading "Tiến độ tổng thể" [level=4] [ref=e266]
            - generic [ref=e267]:
              - generic [ref=e268]:
                - img [ref=e269]
                - generic:
                  - generic: 20%
              - generic [ref=e272]:
                - generic [ref=e273]:
                  - generic [ref=e274]: Kế hoạch
                  - generic [ref=e275]: 59.5%
                - generic [ref=e276]:
                  - generic [ref=e277]: Số ngày đã qua
                  - generic [ref=e278]: 869 / 1460 ngày
                - generic [ref=e279]:
                  - generic [ref=e280]: SPI
                  - generic [ref=e281]: "0.34"
                - generic [ref=e282]:
                  - generic [ref=e283]: CPI
                  - generic [ref=e284]: "12.82"
        - generic [ref=e285]:
          - generic [ref=e286]:
            - heading "WBS – Hạng mục và dự toán" [level=3] [ref=e288]
            - generic [ref=e292]:
              - generic "Cuộn ngang để xem thêm":
                - img
              - table [ref=e293]:
                - rowgroup [ref=e294]:
                  - row "Hạng mục thi công (WBS) Dự toán ngân sách Chi phí thực tế Chênh lệch Tiến độ" [ref=e295]:
                    - columnheader "Hạng mục thi công (WBS)" [ref=e296]
                    - columnheader "Dự toán ngân sách" [ref=e297]
                    - columnheader "Chi phí thực tế" [ref=e298]
                    - columnheader "Chênh lệch" [ref=e299]
                    - columnheader "Tiến độ" [ref=e300]
                - rowgroup [ref=e301]:
                  - 'row "Giai đoạn 1: Hạ tầng kỹ thuật 0 78.000.000.000 -78.000.000.000 0.0%" [ref=e302]':
                    - 'cell "Giai đoạn 1: Hạ tầng kỹ thuật" [ref=e303]':
                      - generic [ref=e304]:
                        - img [ref=e305]
                        - 'generic "Giai đoạn 1: Hạ tầng kỹ thuật" [ref=e307]'
                    - cell "0" [ref=e308]
                    - cell "78.000.000.000" [ref=e309]
                    - cell "-78.000.000.000" [ref=e310]
                    - cell "0.0%" [ref=e311]:
                      - generic [ref=e314]: 0.0%
                  - row "Hệ thống đường giao thông 0 78.000.000.000 -78.000.000.000 0.0%" [ref=e315]:
                    - cell "Hệ thống đường giao thông" [ref=e316]:
                      - generic "Hệ thống đường giao thông" [ref=e318]
                    - cell "0" [ref=e319]
                    - cell "78.000.000.000" [ref=e320]
                    - cell "-78.000.000.000" [ref=e321]
                    - cell "0.0%" [ref=e322]:
                      - generic [ref=e325]: 0.0%
                  - row "Hệ thống cấp thoát nước 0 0 +0 0.0%" [ref=e326]:
                    - cell "Hệ thống cấp thoát nước" [ref=e327]:
                      - generic "Hệ thống cấp thoát nước" [ref=e329]
                    - cell "0" [ref=e330]
                    - cell "0" [ref=e331]
                    - cell "+0" [ref=e332]
                    - cell "0.0%" [ref=e333]:
                      - generic [ref=e336]: 0.0%
                  - 'row "Giai đoạn 2: Xây dựng nhà ở 0 0 +0 0.0%" [ref=e337]':
                    - 'cell "Giai đoạn 2: Xây dựng nhà ở" [ref=e338]':
                      - 'generic "Giai đoạn 2: Xây dựng nhà ở" [ref=e340]'
                    - cell "0" [ref=e341]
                    - cell "0" [ref=e342]
                    - cell "+0" [ref=e343]
                    - cell "0.0%" [ref=e344]:
                      - generic [ref=e347]: 0.0%
                  - 'row "Giai đoạn 3: Tiện ích công cộng 0 0 +0 0.0%" [ref=e348]':
                    - 'cell "Giai đoạn 3: Tiện ích công cộng" [ref=e349]':
                      - 'generic "Giai đoạn 3: Tiện ích công cộng" [ref=e351]'
                    - cell "0" [ref=e352]
                    - cell "0" [ref=e353]
                    - cell "+0" [ref=e354]
                    - cell "0.0%" [ref=e355]:
                      - generic [ref=e358]: 0.0%
          - generic [ref=e359]:
            - generic [ref=e360]:
              - heading "Chi phí gần nhất" [level=3] [ref=e361]
              - generic [ref=e362] [cursor=pointer]: Xem tất cả
            - table [ref=e369]:
              - rowgroup [ref=e370]:
                - row "Ngày Nội dung / Nhà cung cấp Hạng mục WBS Phân loại Số tiền Trạng thái Nghiệp vụ" [ref=e371]:
                  - columnheader "Ngày" [ref=e372]
                  - columnheader "Nội dung / Nhà cung cấp" [ref=e373]
                  - columnheader "Hạng mục WBS" [ref=e374]
                  - columnheader "Phân loại" [ref=e375]
                  - columnheader "Số tiền" [ref=e376]
                  - columnheader "Trạng thái" [ref=e377]
                  - columnheader "Nghiệp vụ" [ref=e378]
              - rowgroup [ref=e379]:
                - row "01/04/2024 Nhân công thi công đường Công ty Nhân lực Xây dựng Việt Hệ thống đường giao thông Nhân công 30.000.000.000 Đã duyệt" [ref=e380]:
                  - cell "01/04/2024" [ref=e381]
                  - cell "Nhân công thi công đường Công ty Nhân lực Xây dựng Việt" [ref=e382]:
                    - generic "Nhân công thi công đường" [ref=e383]
                    - generic [ref=e384]: Công ty Nhân lực Xây dựng Việt
                  - cell "Hệ thống đường giao thông" [ref=e385]:
                    - generic "Hệ thống đường giao thông" [ref=e386]
                  - cell "Nhân công" [ref=e387]:
                    - generic [ref=e388]: Nhân công
                  - cell "30.000.000.000" [ref=e389]
                  - cell "Đã duyệt" [ref=e390]:
                    - generic [ref=e391]: Đã duyệt
                  - cell [ref=e393]:
                    - generic [ref=e394]:
                      - button "Hiệu chỉnh" [ref=e395]:
                        - img [ref=e396]
                      - button "Hủy / Xóa" [ref=e398]:
                        - img [ref=e399]
                - row "15/03/2024 Xi măng PCB40 cho đường giao thông Công ty Xi măng Hoàng Thạch Hệ thống đường giao thông Vật liệu 48.000.000.000 Đã duyệt" [ref=e401]:
                  - cell "15/03/2024" [ref=e402]
                  - cell "Xi măng PCB40 cho đường giao thông Công ty Xi măng Hoàng Thạch" [ref=e403]:
                    - generic "Xi măng PCB40 cho đường giao thông" [ref=e404]
                    - generic [ref=e405]: Công ty Xi măng Hoàng Thạch
                  - cell "Hệ thống đường giao thông" [ref=e406]:
                    - generic "Hệ thống đường giao thông" [ref=e407]
                  - cell "Vật liệu" [ref=e408]:
                    - generic [ref=e409]: Vật liệu
                  - cell "48.000.000.000" [ref=e410]
                  - cell "Đã duyệt" [ref=e411]:
                    - generic [ref=e412]: Đã duyệt
                  - cell [ref=e414]:
                    - generic [ref=e415]:
                      - button "Hiệu chỉnh" [ref=e416]:
                        - img [ref=e417]
                      - button "Hủy / Xóa" [ref=e419]:
                        - img [ref=e420]
        - generic [ref=e422]:
          - generic [ref=e424]:
            - heading "Công nợ" [level=4] [ref=e425]
            - generic [ref=e426]:
              - generic [ref=e427]:
                - generic [ref=e428]: Phải thu (Khách hàng)
                - generic [ref=e429]:
                  - generic [ref=e430]:
                    - generic [ref=e432]: Tổng phải thu
                    - generic [ref=e433]: "0"
                  - generic [ref=e434]:
                    - generic [ref=e436]: Đã thu
                    - generic [ref=e437]: "0"
                  - generic [ref=e438]:
                    - generic [ref=e440]: Còn lại
                    - generic [ref=e441]: "0"
                  - generic [ref=e442]:
                    - generic [ref=e444]: Quá hạn
                    - generic [ref=e445]: "0"
              - generic [ref=e446]:
                - generic [ref=e447]: Phải trả (Nhà cung cấp)
                - generic [ref=e448]:
                  - generic [ref=e449]:
                    - generic [ref=e451]: Tổng phải trả
                    - generic [ref=e452]: 78.000.000.000
                  - generic [ref=e453]:
                    - generic [ref=e455]: Đã trả
                    - generic [ref=e456]: 78.000.000.000
                  - generic [ref=e457]:
                    - generic [ref=e459]: Còn lại
                    - generic [ref=e460]: "0"
                  - generic [ref=e461]:
                    - generic [ref=e463]: Quá hạn
                    - generic [ref=e464]: "0"
          - generic [ref=e466]:
            - heading "Lãi lỗ dự án" [level=4] [ref=e467]
            - generic [ref=e468]:
              - generic [ref=e469]:
                - generic [ref=e470]:
                  - generic [ref=e471]: Doanh thu
                  - generic [ref=e472]: "0"
                - generic [ref=e473]:
                  - generic [ref=e474]: Tổng chi phí
                  - generic [ref=e475]: 78.000.000.000
                - generic [ref=e476]:
                  - generic [ref=e477]: Lợi nhuận
                  - generic [ref=e478]: "-78.000.000.000"
                - generic [ref=e479]:
                  - generic [ref=e480]: Tỷ lệ lợi nhuận
                  - generic [ref=e481]: 0.0%
                - generic [ref=e482]:
                  - generic [ref=e483]: Chênh lệch ngân sách
                  - generic [ref=e484]: +4922.0 tỷ
              - generic [ref=e485]:
                - img [ref=e486]
                - generic:
                  - generic: 1.6%
            - generic [ref=e489]:
              - generic [ref=e490]: Lợi nhuận -78.000.000.000 (0.0%)
              - generic [ref=e492]: Chi phí 78.000.000.000 (1.6%)
    - button [ref=e496]:
      - img [ref=e498]
  - generic [ref=e503]:
    - img [ref=e505]
    - button "Open Tanstack query devtools" [ref=e553] [cursor=pointer]:
      - img [ref=e554]
  - button "Open Next.js Dev Tools" [ref=e607] [cursor=pointer]:
    - img [ref=e608]
  - alert [ref=e611]
```

# Test source

```ts
  1   | /**
  2   |  * MASTER SCREEN-BY-SCREEN E2E VALIDATION
  3   |  * 
  4   |  * This test suite validates every screen in the ERP system with real browser interactions
  5   |  */
  6   | 
  7   | import { test, expect, Page } from '@playwright/test';
  8   | 
  9   | // Test configuration
  10  | test.describe.configure({ mode: 'serial' });
  11  | 
  12  | let page: Page;
  13  | 
  14  | test.beforeAll(async ({ browser }) => {
  15  |   page = await browser.newPage();
  16  |   
  17  |   // Login first
  18  |   await page.goto('http://localhost:3000');
  19  |   
  20  |   // Wait for page to load
> 21  |   await page.waitForLoadState('networkidle');
      |              ^ Error: page.waitForLoadState: Target page, context or browser has been closed
  22  | });
  23  | 
  24  | test.afterAll(async () => {
  25  |   await page.close();
  26  | });
  27  | 
  28  | // ============================================================
  29  | // DASHBOARD VALIDATION
  30  | // ============================================================
  31  | 
  32  | test.describe('DASHBOARD Screen Validation', () => {
  33  |   
  34  |   test('should load dashboard with KPIs', async () => {
  35  |     await page.goto('http://localhost:3000/dashboard');
  36  |     await page.waitForLoadState('networkidle');
  37  |     
  38  |     // Check for key dashboard elements
  39  |     await expect(page.locator('h1, h2').filter({ hasText: /dashboard/i })).toBeVisible({ timeout: 10000 });
  40  |     
  41  |     // Take screenshot for evidence
  42  |     await page.screenshot({ path: 'test-results/dashboard-loaded.png', fullPage: true });
  43  |   });
  44  |   
  45  |   test('should display project count KPI', async () => {
  46  |     const projectCountElement = page.locator('[data-testid="project-count"], text=/projects?/i').first();
  47  |     await expect(projectCountElement).toBeVisible({ timeout: 5000 });
  48  |     
  49  |     const text = await projectCountElement.textContent();
  50  |     console.log('✅ Project count displayed:', text);
  51  |   });
  52  |   
  53  |   test('should display total budget KPI', async () => {
  54  |     const budgetElement = page.locator('[data-testid="total-budget"], text=/budget|tổng ngân sách/i').first();
  55  |     await expect(budgetElement).toBeVisible({ timeout: 5000 });
  56  |     
  57  |     const text = await budgetElement.textContent();
  58  |     console.log('✅ Total budget displayed:', text);
  59  |   });
  60  |   
  61  |   test('should display cashflow information', async () => {
  62  |     const cashflowElement = page.locator('[data-testid="cashflow"], text=/cashflow|dòng tiền/i').first();
  63  |     
  64  |     if (await cashflowElement.isVisible({ timeout: 3000 }).catch(() => false)) {
  65  |       const text = await cashflowElement.textContent();
  66  |       console.log('✅ Cashflow displayed:', text);
  67  |     } else {
  68  |       console.log('⚠️  Cashflow not visible on dashboard');
  69  |     }
  70  |   });
  71  | });
  72  | 
  73  | // ============================================================
  74  | // PROJECT MANAGEMENT VALIDATION
  75  | // ============================================================
  76  | 
  77  | test.describe('PROJECT MANAGEMENT Screen Validation', () => {
  78  |   
  79  |   test('should navigate to projects page', async () => {
  80  |     await page.goto('http://localhost:3000/projects');
  81  |     await page.waitForLoadState('networkidle');
  82  |     
  83  |     await expect(page.locator('h1, h2').filter({ hasText: /project/i })).toBeVisible({ timeout: 10000 });
  84  |     await page.screenshot({ path: 'test-results/projects-page.png', fullPage: true });
  85  |   });
  86  |   
  87  |   test('should display project list', async () => {
  88  |     const projectList = page.locator('[data-testid="project-list"], table, [role="table"]').first();
  89  |     await expect(projectList).toBeVisible({ timeout: 5000 });
  90  |     
  91  |     console.log('✅ Project list displayed');
  92  |   });
  93  |   
  94  |   test('should be able to search/filter projects', async () => {
  95  |     const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="tìm" i]').first();
  96  |     
  97  |     if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  98  |       await searchInput.fill('Vinhomes');
  99  |       await page.waitForTimeout(1000); // Wait for filter
  100 |       console.log('✅ Search/filter functionality available');
  101 |     } else {
  102 |       console.log('⚠️  Search input not found');
  103 |     }
  104 |   });
  105 |   
  106 |   test('should open project details', async () => {
  107 |     const firstProject = page.locator('[data-testid="project-row"], tr').nth(1);
  108 |     
  109 |     if (await firstProject.isVisible({ timeout: 3000 }).catch(() => false)) {
  110 |       await firstProject.click();
  111 |       await page.waitForTimeout(1000);
  112 |       
  113 |       await page.screenshot({ path: 'test-results/project-details.png', fullPage: true });
  114 |       console.log('✅ Project details opened');
  115 |     } else {
  116 |       console.log('⚠️  No projects to click');
  117 |     }
  118 |   });
  119 | });
  120 | 
  121 | // ============================================================
```
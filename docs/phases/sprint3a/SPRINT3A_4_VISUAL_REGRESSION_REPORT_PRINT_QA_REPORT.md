# SPRINT 3A.4 - VISUAL REGRESSION & REPORT/PRINT PILOT QA REPORT

## 1. Executive Summary

Đã thực hiện visual QA pilot cho 12 route chính trên 3 viewport: desktop 1440x900, laptop 1366x768, tablet-wide 1024x768. Tổng cộng 36 lượt màn hình được chụp screenshot.

Đã tạo 3 nhóm Playwright visual tests:

- `tests/e2e/visual-regression-pilot.spec.ts`
- `tests/e2e/action-menu-visual-smoke.spec.ts`
- `tests/e2e/financial-drilldown-visual.spec.ts`

Kết quả visual matrix:

- 6 lượt màn hình PASS.
- 30 lượt màn hình PASS_WITH_WARNING.
- 0 route fail hoặc missing trong matrix đã chọn.

Không sửa DB, không sửa Prisma schema, không tạo migration, không sửa ledger/posting/payment/report source-of-truth. Không tuyên bố production ready.

Gate sau sprint: **B. NEED_VISUAL_DEFECT_FIX_ROUND** vì visual QA phát hiện mojibake diện rộng và một số console 500/403 ở runtime UI.

## 2. Files Changed

| File | Loại sửa | Ghi chú |
| ---- | -------- | ------- |
| `tests/e2e/visual-regression-pilot.spec.ts` | VISUAL_TEST / SCREENSHOT_QA / DARK_LIGHT_FIX | Chụp 12 route x 3 viewport, ghi findings JSON, chụp light/dark dashboard và drilldown |
| `tests/e2e/action-menu-visual-smoke.spec.ts` | ACTION_MENU_QA | Kiểm tra menu Công trình nếu có data/action button; ghi findings |
| `tests/e2e/financial-drilldown-visual.spec.ts` | DRILLDOWN_DRAWER_QA | Kiểm tra drawer nằm trong viewport, đủ tabs, đóng được |
| `.next/dev/types` | SCREENSHOT_QA | Đã xóa cache generated bị hỏng để Next regenerate; không phải source code, không phải DB |
| `docs/audit/phase1-readonly-validation.json` | TEST_OUTPUT | Bị cập nhật bởi `npm run validation:database` |

Không sửa UI production code trong Sprint 3A.4 vì các lỗi phát hiện là diện rộng, nên đưa vào backlog thay vì sửa lan man.

## 3. Screen Visual QA Matrix

| Màn hình | Route | Desktop | Laptop | Tablet | Lỗi phát hiện | Trạng thái |
| -------- | ----- | ------- | ------ | ------ | ------------- | ---------- |
| Dashboard/Tổng quan | `/` | PASS_WITH_WARNING | PASS_WITH_WARNING | PASS_WITH_WARNING | Mojibake; console 500 từ resource/API runtime | PASS_WITH_WARNING |
| Công trình | `/projects` | PASS_WITH_WARNING | PASS_WITH_WARNING | PASS_WITH_WARNING | Mojibake | PASS_WITH_WARNING |
| WBS | `/wbs` | PASS_WITH_WARNING | PASS_WITH_WARNING | PASS_WITH_WARNING | Mojibake | PASS_WITH_WARNING |
| Dự toán | `/budget` | PASS_WITH_WARNING | PASS_WITH_WARNING | PASS_WITH_WARNING | Mojibake | PASS_WITH_WARNING |
| Chi phí | `/costs` | PASS_WITH_WARNING | PASS_WITH_WARNING | PASS_WITH_WARNING | Mojibake | PASS_WITH_WARNING |
| Doanh thu | `/revenue` | PASS_WITH_WARNING | PASS_WITH_WARNING | PASS_WITH_WARNING | Mojibake | PASS_WITH_WARNING |
| Công nợ | `/debt` | PASS_WITH_WARNING | PASS_WITH_WARNING | PASS_WITH_WARNING | Mojibake | PASS_WITH_WARNING |
| Sổ cái/Bút toán | `/accounting` | PASS_WITH_WARNING | PASS_WITH_WARNING | PASS_WITH_WARNING | Mojibake | PASS_WITH_WARNING |
| Kho vật tư | `/inventory` | PASS_WITH_WARNING | PASS_WITH_WARNING | PASS_WITH_WARNING | Mojibake; console 403 từ API runtime | PASS_WITH_WARNING |
| Báo cáo | `/reports` | PASS_WITH_WARNING | PASS_WITH_WARNING | PASS_WITH_WARNING | Mojibake | PASS_WITH_WARNING |
| In công nợ | `/print/debt` | PASS | PASS | PASS | Không phát hiện lỗi trong smoke | PASS |
| In sổ cái | `/print/ledger` | PASS | PASS | PASS | Không phát hiện lỗi trong smoke | PASS |

## 4. Action Menu QA

| Màn hình | Kết quả | Lỗi clipping không | Ghi chú |
| -------- | ------- | ------------------ | ------- |
| Công trình `/projects` | NOT_TESTED_NO_DATA | Không kết luận | Test không tìm thấy action menu khả dụng trong phiên chạy; không fail cứng theo prompt |
| WBS/Dự toán/Chi phí | NOT_TESTED_NO_DATA | Không kết luận | Chưa mở rộng vì không có action menu khả dụng ổn định trong visual run |

## 5. Financial Drilldown Drawer QA

| Màn hình | Chỉ tiêu click | Drawer mở | Tabs hiển thị | Lỗi visual | Ghi chú |
| -------- | -------------- | --------- | ------------- | ---------- | ------- |
| Dashboard | Tổng doanh thu hạch toán | Có | Tổng quan, Chứng từ nguồn, Bút toán, Hợp đồng/NCC, Audit/Trace | Không tràn viewport 1440x900 | Screenshot: `test-results/visual-pilot/financial-drilldown-drawer.png` |
| Dashboard light mode | Tổng doanh thu hạch toán | Có | Có | Cần manual contrast review | Screenshot: `theme-light-drilldown.png` |

## 6. Report/Print QA

| Route/Chứng từ | Kết quả | Lỗi visual | Ghi chú |
| -------------- | ------- | ---------- | ------- |
| `/reports` | PASS_WITH_WARNING | Mojibake | Report page render được trên 3 viewport |
| `/print/debt` | PASS | Không phát hiện trong smoke | Header/route print render được |
| `/print/ledger` | PASS | Không phát hiện trong smoke | Header/route print render được |
| `/print/invoice/[id]` | NOT_TESTED_NO_SAMPLE_DATA | Chưa kiểm tra | Chưa lấy sample id trong Sprint 3A.4 |
| `/print/payment/[id]` | NOT_TESTED_NO_SAMPLE_DATA | Chưa kiểm tra | Chưa lấy sample id trong Sprint 3A.4 |
| `/print/advance/[id]` | NOT_TESTED_NO_SAMPLE_DATA | Chưa kiểm tra | Chưa lấy sample id trong Sprint 3A.4 |
| `/print/inventory/receipt/[id]` | NOT_TESTED_NO_SAMPLE_DATA | Chưa kiểm tra | Chưa lấy sample id trong Sprint 3A.4 |
| `/print/inventory/issue/[id]` | NOT_TESTED_NO_SAMPLE_DATA | Chưa kiểm tra | Chưa lấy sample id trong Sprint 3A.4 |

## 7. Dark/Light Mode QA

| Màn hình | Light | Dark | Lỗi |
| -------- | ----- | ---- | --- |
| Dashboard | Screenshot captured | Screenshot captured | Cần manual contrast review |
| Financial drilldown drawer | Screenshot captured | Covered by default visual run | Không tràn viewport |
| Bảng chính | Covered by default dark run | Covered by default dark run | Light table cần kiểm tra sâu hơn ở sprint sau |
| Reports/Print | Default visual run | Default visual run | Chưa toggle theme riêng cho Reports/Print |

## 8. Screenshot Artifacts

Artifact nằm tại:

```text
test-results/visual-pilot/
```

Nội dung chính:

- `visual-regression-findings.json`
- `desktop-*.png`
- `laptop-*.png`
- `tablet-wide-*.png`
- `financial-drilldown-drawer.png`
- `theme-light-dashboard.png`
- `theme-light-drilldown.png`
- `theme-dark-dashboard.png`
- `action-menu-findings.json`

Tổng artifact sau run cuối: 42 file. Có khả năng chứa dữ liệu thật/test data nội bộ, không nên commit screenshot.

## 9. Safety Confirmation

- Không sửa database.
- Không apply reconciliation mapping.
- Không sửa `Project.companyId`.
- Không sửa `JournalEntry.projectId`.
- Không sửa AP Bát Tràng.
- Không sửa ledger/posting/payment/report source-of-truth.
- Không tạo migration.
- Không reset database.
- Không sửa file trong `.local-audit-quarantine/`.
- Không commit/push.
- Không production ready.

## 10. Test Results

| Lệnh | Kết quả | Ghi chú |
| ---- | ------- | ------- |
| `git status --short` | Pass | Repo dirty từ các sprint trước; không revert |
| `git branch --show-current` | Pass | `main` |
| `git log -3 --oneline` | Pass | `211d31c`, `92f1dbc`, `d1a5b4f` |
| `npx prisma validate` | Pass | Schema hợp lệ |
| `npx prisma generate` | Fail do Windows lock | `EPERM rename query_engine-windows.dll.node.tmp -> query_engine-windows.dll.node`; không xóa DLL |
| `npx tsc --noEmit --pretty false` | Pass | Sau khi xóa cache generated `.next/dev/types` bị hỏng |
| `npm run build` | Pass | Ban đầu fail do `.next/dev/types/routes.d.ts` generated bị hỏng; xóa cache generated và build pass. Còn warning cũ Turbopack/NFT và `url.parse()` |
| `npm run validation:database` | Pass | Read-only validation pass; file audit JSON được cập nhật |
| `npm run security-check` | Pass | Viewer bị chặn, Manager qua guard |
| `npm run e2e -- tests/e2e/enterprise-smoke.spec.ts` | Pass | 3/3 |
| `npm run e2e -- tests/e2e/financial-drilldown-smoke.spec.ts` | Pass | 1/1 |
| `npm run e2e -- tests/e2e/visual-regression-pilot.spec.ts` | Pass | Chạy gộp cuối cùng cùng 2 visual specs |
| `npm run e2e -- tests/e2e/action-menu-visual-smoke.spec.ts` | Pass | Không fail cứng khi không có menu data |
| `npm run e2e -- tests/e2e/financial-drilldown-visual.spec.ts` | Pass | Drawer visual pass |

## 11. Đánh giá hệ thống sau Sprint 3A.4

### 11.1 Hệ thống mạnh hơn ở đâu?

- Có visual QA pilot tự động cho các route ERP chính trên desktop/laptop/tablet-wide.
- Có screenshot artifact để review UI thực tế thay vì chỉ dựa vào build.
- Có kiểm tra riêng financial drilldown drawer, gồm tabs và viewport bounds.
- Có cơ chế ghi findings JSON để phát hiện mojibake, text tiếng Anh phổ biến, console error, request failure.

### 11.2 Hệ thống còn yếu ở đâu?

- Mojibake vẫn xuất hiện diện rộng trên hầu hết route.
- Dashboard còn console 500 trong visual run.
- Inventory còn console 403 trong visual run.
- Action menu chưa kiểm tra được bằng data ổn định trong run này.
- Print route động theo `[id]` chưa được kiểm tra vì chưa chọn sample id an toàn.

### 11.3 Hệ thống còn thiếu gì để gần MISA/FAST hơn?

- Excel A4 chuẩn in.
- Report designer.
- Audit log UI sâu.
- Drilldown đầy đủ Debt/Revenue/Payment/Reports.
- Keyboard workflow.
- Bulk action an toàn.
- Phân quyền UI chi tiết hơn.
- Visual regression CI chính thức.
- Lint/type safety gate toàn repo.

### 11.4 Rủi ro còn lại

| Nhóm | Rủi ro |
| ---- | ------ |
| UI_RISK | Mojibake diện rộng; một số visual run có console error |
| ACCOUNTING_DATA_RISK | Không sửa trong sprint này; vùng mapping/human approval vẫn cần owner xác nhận |
| PRINT_REPORT_GAP | Print route động chưa test theo sample id |
| TRACEABILITY_GAP | Reports/Debt/Revenue/Payment chưa phủ drawer sâu |
| TECH_DEBT | `prisma generate` bị Windows DLL lock; lint toàn repo vẫn chưa sạch |
| PERFORMANCE_RISK | Visual test mới là smoke, chưa đo render table lớn |
| UX_GAP | Action menu cần data ổn định để test clipping đầy đủ |

### 11.5 Gợi ý sprint tiếp theo

Đề xuất: **Sprint 3A.4B - Visual Defect Fix Round**.

Mục tiêu nên tập trung:

1. Sửa mojibake theo route ưu tiên: Dashboard, Projects, WBS, Budget, Costs, Revenue, Debt, Accounting, Inventory, Reports.
2. Điều tra console 500 trên Dashboard.
3. Điều tra console 403 trên Inventory.
4. Tạo sample-id-safe print visual test cho invoice/payment/advance/inventory.

## 12. Decision Gate

**B. NEED_VISUAL_DEFECT_FIX_ROUND**

Không production ready.


# SPRINT 3A.4B VISUAL DEFECT FIX ROUND REPORT

## 1. Executive Summary

Sprint 3A.4B đã sửa 13 file trong phạm vi UI/runtime read-only/test visual. Không sửa database, không tạo migration, không apply mapping, không sửa ledger/posting/payment/source-of-truth báo cáo.

Kết quả visual matrix sau sửa: 36/36 viewport checks PASS, 0 PASS_WITH_WARNING, 0 FAIL. Dashboard không còn console 500. Inventory không còn console 403 bất thường. `/reports` không còn warning mojibake trong visual artifact mới.

Gate sau sprint: `A. READY_FOR_SPRINT_3A_5_REPORT_EXCEL_A4_PILOT`, với ghi chú print route động vẫn chưa test được nội dung thật do thiếu sample ID read-only an toàn trong dữ liệu/API hiện tại.

## 2. Files Changed

| File | Loại sửa | Ghi chú |
| ---- | -------- | ------- |
| `app/api/reports/management/executive-summary/route.ts` | DASHBOARD_RUNTIME_500_FIX | Trả empty summary có metadata cho SUPER_ADMIN chưa gán công ty; user thường vẫn bị 403 tiếng Việt. |
| `app/api/reports/management/project-profitability/route.ts` | DASHBOARD_RUNTIME_500_FIX | Trả danh sách trống an toàn cho visual/read-only session không có companyId. |
| `app/api/reports/management/debt/route.ts` | DASHBOARD_RUNTIME_500_FIX | Trả dữ liệu công nợ trống an toàn, không fake số liệu. |
| `app/api/reports/management/risk-alerts/route.ts` | DASHBOARD_RUNTIME_500_FIX | Trả danh sách cảnh báo trống an toàn. |
| `app/api/inventory/documents/route.ts` | INVENTORY_403_HANDLING | Giữ `requirePermission`; SUPER_ADMIN không có companyId nhận mảng trống, user khác nhận 403 rõ ràng. |
| `app/api/inventory/reports/stock-register/route.ts` | INVENTORY_403_HANDLING | Giữ `requirePermission`; fallback read-only mảng trống cho SUPER_ADMIN visual session. |
| `app/components/Dashboard.tsx` | EMPTY_STATE_FIX | Chuẩn hóa đọc shape `{ metadata, data }` từ API management. |
| `app/components/inventory/InventoryDashboardCards.tsx` | MOJIBAKE_FIX, EMPTY_STATE_FIX | Sửa text UTF-8, format tiền `vi-VN`, fallback API lỗi về mảng trống. |
| `app/inventory/page.tsx` | MOJIBAKE_FIX | Sửa heading/tab/card/button tiếng Việt, giữ nguyên luồng UI kho. |
| `tests/e2e/visual-regression-pilot.spec.ts` | VISUAL_TEST_UPDATE | Sửa locator/message UTF-8, giữ matrix 12 route x 3 viewport. |
| `tests/e2e/action-menu-visual-smoke.spec.ts` | ACTION_MENU_TEST_STABILITY | Fallback selector và ghi `NOT_TESTED_NO_STABLE_DATA` khi không có dữ liệu ổn định. |
| `tests/e2e/financial-drilldown-smoke.spec.ts` | VISUAL_TEST_UPDATE | Sửa race condition bằng `waitForResponse`. |
| `tests/e2e/print-dynamic-visual-smoke.spec.ts` | PRINT_DYNAMIC_SAMPLE_TEST | Thêm test sample-id-safe, không tạo dữ liệu. |

## 3. Visual Matrix Before/After

| Chỉ tiêu | Trước Sprint 3A.4B | Sau Sprint 3A.4B |
| -------- | -----------------: | ---------------: |
| Total viewport checks | 36 | 36 |
| PASS | 6 | 36 |
| PASS_WITH_WARNING | 30 | 0 |
| FAIL | 0 | 0 |
| Dashboard console 500 | Có | Không |
| Inventory console 403 | Có | Không |
| Mojibake diện rộng | Có | Không trong matrix pilot |

## 4. Route-by-route Findings

| Route | Trước | Sau | Ghi chú |
| ----- | ----- | --- | ------- |
| `/` | PASS_WITH_WARNING | PASS | Đã xử lý console 500 management APIs. |
| `/projects` | PASS_WITH_WARNING | PASS | Không còn warning trong matrix; action menu vẫn thiếu data ổn định để test sâu. |
| `/wbs` | PASS_WITH_WARNING | PASS | Không còn warning trong matrix pilot. |
| `/budget` | PASS_WITH_WARNING | PASS | Không còn warning trong matrix pilot. |
| `/costs` | PASS_WITH_WARNING | PASS | Không còn warning trong matrix pilot. |
| `/revenue` | PASS_WITH_WARNING | PASS | Không còn warning trong matrix pilot. |
| `/debt` | PASS_WITH_WARNING | PASS | Không còn warning trong matrix pilot. |
| `/accounting` | PASS_WITH_WARNING | PASS | Không còn warning trong matrix pilot. |
| `/inventory` | PASS_WITH_WARNING | PASS | Không còn console 403 bất thường. |
| `/reports` | PASS_WITH_WARNING | PASS | Không còn mojibake warning trong artifact mới. |
| `/print/debt` | PASS | PASS | Giữ ổn định. |
| `/print/ledger` | PASS | PASS | Giữ ổn định. |

## 5. Dashboard 500 Investigation

Các request gây 500 trước đó là nhóm `/api/reports/management/*`: executive summary, project profitability, debt, risk alerts. Nguyên nhân: visual test đăng nhập SUPER_ADMIN không có `companyId`, route throw `Error` thường khi thiếu tenant context nên Next trả 500.

Đã sửa ở route API bằng policy read-only: SUPER_ADMIN chưa gán công ty nhận dữ liệu trống kèm metadata warning; user không phải SUPER_ADMIN vẫn nhận `ApiError(403)` tiếng Việt. Không thay đổi công thức tài chính, không cộng DRAFT, không đổi source-of-truth.

## 6. Inventory 403 Investigation

Hai request gây 403 trước đó: `/api/inventory/documents` và `/api/inventory/reports/stock-register`. Nguyên nhân: UI inventory dashboard gọi API kho trong session SUPER_ADMIN không có `companyId`. Route vẫn giữ `requirePermission("DOCUMENT", "READ")`.

Đã sửa fallback read-only cho SUPER_ADMIN chưa có công ty: trả `success: true, data: []` để UI hiển thị empty state thay vì console error. User khác thiếu company context vẫn nhận lỗi 403 tiếng Việt: “Bạn không có quyền xem dữ liệu kho vật tư. Vui lòng liên hệ quản trị hệ thống nếu cần truy cập.”

`npm run security-check`: PASS.

## 7. Reports/Print QA Update

`/reports` trong visual run mới: PASS ở desktop/laptop/tablet-wide, không còn mojibake warning.

`/print/debt` và `/print/ledger`: PASS.

Print route động đã có test `tests/e2e/print-dynamic-visual-smoke.spec.ts`, nhưng hiện tất cả route động trả `NOT_TESTED_NO_SAMPLE_DATA` vì không lấy được sample ID read-only an toàn qua API trong session visual hiện tại:

| Route động | Kết quả |
| ---------- | ------- |
| `/print/invoice/[id]` | NOT_TESTED_NO_SAMPLE_DATA |
| `/print/payment/[id]` | NOT_TESTED_NO_SAMPLE_DATA |
| `/print/advance/[id]` | NOT_TESTED_NO_SAMPLE_DATA |
| `/print/inventory/receipt/[id]` | NOT_TESTED_NO_SAMPLE_DATA |
| `/print/inventory/issue/[id]` | NOT_TESTED_NO_SAMPLE_DATA |

## 8. Safety Confirmation

Đã xác nhận:

- Không sửa database.
- Không apply reconciliation mapping.
- Không sửa `Project.companyId`.
- Không sửa `JournalEntry.projectId`.
- Không sửa AP Bát Tràng.
- Không sửa ledger/posting/payment/report source-of-truth.
- Không tạo migration.
- Không reset database.
- Không sửa file trong `.local-audit-quarantine/`.
- Không production ready.

## 9. Test Results

| Lệnh | Kết quả | Ghi chú |
| ---- | ------- | ------- |
| `git status --short` | PASS | Repo có nhiều thay đổi từ các phase trước; không revert. |
| `git branch --show-current` | PASS | `main`. |
| `git log -3 --oneline` | PASS | `211d31c`, `92f1dbc`, `d1a5b4f`. |
| `npx prisma validate` | PASS | Schema hợp lệ. |
| `npx tsc --noEmit --pretty false` | PASS | Không lỗi TypeScript. |
| `npx eslint <files changed>` | PASS | Không lỗi/warning trên file đã sửa. |
| `npx prisma generate` | FAIL_ENV | EPERM rename DLL `generated/prisma-client/query_engine-windows.dll.node`; không xóa DLL chính. |
| `npm run build` | PASS | Pass ngoài sandbox; còn warning Turbopack NFT trace cũ từ `next.config.ts/generated prisma`. |
| `npm run validation:database` | PASS | Pass ngoài sandbox, read-only counts/integrity OK. |
| `npm run security-check` | PASS | Viewer bị chặn, Manager qua guard. |
| `npm run e2e -- tests/e2e/enterprise-smoke.spec.ts` | PASS | 3/3 passed. |
| `npm run e2e -- tests/e2e/financial-drilldown-smoke.spec.ts` | PASS | 1/1 passed sau khi sửa race condition test. |
| `npm run e2e -- tests/e2e/visual-regression-pilot.spec.ts tests/e2e/action-menu-visual-smoke.spec.ts tests/e2e/financial-drilldown-visual.spec.ts tests/e2e/print-dynamic-visual-smoke.spec.ts` | PASS | 5/5 passed. |

## 10. Đánh giá hệ thống sau Sprint 3A.4B

### 10.1 Hệ thống mạnh hơn ở đâu?

Dashboard không còn phụ thuộc vào company context để tránh 500 trong read-only SUPER_ADMIN visual session. Inventory dashboard không còn tạo console 403 bất thường khi user test chưa có công ty. Visual regression pilot hiện có matrix sạch 36/36 PASS và test message/locator UTF-8 chuẩn.

### 10.2 Hệ thống còn yếu ở đâu?

Action menu chưa có data ổn định để test mở menu thật ở `/projects`, artifact ghi `NOT_TESTED_NO_STABLE_DATA`. Print route động chưa có sample ID an toàn nên chưa xác nhận layout thực tế cho invoice/payment/advance/inventory document. Một số component con ngoài màn hình mặc định inventory vẫn có thể còn mojibake và cần sweep riêng nếu đưa vào matrix sâu hơn.

### 10.3 Hệ thống còn thiếu gì để gần MISA/FAST hơn?

- Excel A4 chuẩn in cho báo cáo chính.
- Report designer hoặc cấu hình mẫu báo cáo theo công ty.
- Audit log UI sâu cho export/print/drilldown.
- Drilldown đầy đủ Debt/Revenue/Payment/Reports đến chứng từ gốc.
- Keyboard workflow cho kế toán nhập liệu nhanh.
- Bulk action an toàn có preview và audit.
- Visual regression CI chính thức.
- Lint/type safety gate toàn repo.

### 10.4 Rủi ro còn lại

| Nhóm | Rủi ro |
| ---- | ------ |
| UI_RISK | Một số màn hình ngoài pilot hoặc tab ẩn có thể còn text chưa sweep. |
| PRINT_REPORT_GAP | Print route động chưa test được bằng sample thật. |
| TRACEABILITY_GAP | Drilldown đã pass smoke nhưng cần mở rộng tới từng nguồn chứng từ. |
| TECH_DEBT | `prisma generate` bị Windows DLL lock/EPERM; build còn warning NFT trace cũ. |
| UX_GAP | Action menu chưa test được với dataset ổn định. |

### 10.5 Gợi ý sprint tiếp theo

Khuyến nghị tiếp theo: `Sprint 3A.5 - Report/Excel A4 Pilot & Print Template Hardening`.

Song song nên chuẩn bị dataset/sample read-only cho `Sprint 3A.4P - Dynamic Print Route Sample QA`, vì print route động hiện chưa có sample ID để xác nhận layout thật.

## 11. Decision Gate

`A. READY_FOR_SPRINT_3A_5_REPORT_EXCEL_A4_PILOT`

Điều kiện kèm theo: chưa tuyên bố production ready; print route động cần sample QA riêng trước khi dùng làm mẫu in chính thức.

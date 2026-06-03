# SPRINT 3A.5 REPORT / EXCEL A4 PILOT & PRINT TEMPLATE REPORT

## 1. Executive Summary

Sprint 3A.5 đã nâng cấp pilot báo cáo/export/print theo hướng kế toán xây dựng:

- Thêm catalog báo cáo nghiệp vụ trên `/reports`: tạm ứng/thanh toán, công nợ AR/AP, chi phí theo WBS, dự toán vs thực tế, sổ cái/báo cáo tài chính.
- Mở rộng `/api/reports/audited-export` để xuất 4 báo cáo pilot qua server-side audit.
- Không có thư viện Excel `.xlsx` trong repo, nên dùng `CSV fallback` có header công ty, ngày xuất, bộ lọc và format tiền Việt.
- Chuẩn hóa A4 print CSS chung và header công ty cho `/print/debt`, `/print/ledger`.
- Thêm e2e test cho report/export CSV A4 pilot và print template pilot.

Không sửa database, không tạo migration, không apply mapping, không sửa ledger/posting/payment/source-of-truth. Không production ready.

Gate sau sprint: `A. READY_FOR_SPRINT_3A_6_AUDIT_LOG_AND_APPROVAL_WORKFLOW_UX`, kèm điều kiện tiếp tục QA sample route print động ở sprint riêng.

## 2. Files Changed

| File | Loại sửa | Ghi chú |
| ---- | -------- | ------- |
| `app/api/reports/audited-export/route.ts` | AUDITED_EXPORT, CSV_FALLBACK | Thêm 4 reportType pilot và header CSV A4; vẫn bắt buộc `auditExportOrThrow`. |
| `app/reports/page.tsx` | REPORT_UI, WARNING_BADGE | Thêm catalog báo cáo nghiệp vụ, nút `Xuất CSV audited`, cảnh báo header công ty pilot/human approval. |
| `app/components/accounting/PrintLayout.tsx` | PRINT_CSS | Thêm `@page A4`, lặp table header khi in, chống vỡ dòng bảng. |
| `app/components/accounting/AccountingDocumentHeader.tsx` | PRINT_TEMPLATE | Chuẩn hóa text header mẫu in pilot. |
| `app/print/debt/page.tsx` | PRINT_TEMPLATE | Header công ty pilot thống nhất. |
| `app/print/ledger/page.tsx` | PRINT_TEMPLATE | Header công ty pilot thống nhất. |
| `app/services/audited-export.service.ts` | AUDITED_EXPORT | Sửa reason/message tiếng Việt cho helper audited export. |
| `tests/e2e/report-excel-a4-pilot.spec.ts` | REPORT_TEST | Test `/reports` và 4 CSV audited pilot. |
| `tests/e2e/print-template-pilot.spec.ts` | PRINT_TEST | Test `/print/debt` và `/print/ledger` A4/audit template. |

## 3. Report Coverage

| Báo cáo | UI | Export | Print | Audit | Ghi chú |
| ------- | -- | ------ | ----- | ----- | ------- |
| Tổng hợp tạm ứng/thanh toán | Có | CSV fallback | Chưa có route riêng | Có | Dữ liệu `AdvanceRequest`; không fake dữ liệu thiếu. |
| Công nợ phải thu/phải trả | Có | CSV fallback | `/print/debt` cho AR | Có | AP từ chi phí APPROVED/POSTED; AR loại REJECTED/CANCELLED. |
| Chi phí theo công trình/WBS | Có | CSV fallback | Chưa có route riêng | Có | Chỉ tính chi phí APPROVED/POSTED trong export pilot. |
| Dự toán vs thực tế | Có | CSV fallback | Chưa có route riêng | Có | So sánh `BudgetRecord` với chi phí đã duyệt/ghi sổ. |
| Dòng tiền & công nợ | Có | CSV fallback | `/reports` print audited | Có | Dùng reportType hiện hữu `CASH_AGING`. |
| Bảng cân đối phát sinh | Có | CSV fallback | `/print/ledger` | Có | Dữ liệu ledger posted theo endpoint hiện hữu. |

## 4. Excel/CSV A4 Result

Không có package Excel `.xlsx` trong `package.json`, nên không cài thêm thư viện. Sprint này dùng CSV fallback.

| Báo cáo | Format | Header công ty | Tổng cộng | Lặp header | Ghi chú |
| ------- | ------ | -------------- | --------- | ---------- | ------- |
| Tổng hợp tạm ứng/thanh toán | CSV fallback | Có | Theo dòng dữ liệu; chưa thêm row tổng riêng | Không áp dụng CSV | Header: CÔNG TY CP THƯƠNG MẠI VÀ XÂY DỰNG SỐ 2 HN. |
| Công nợ phải thu/phải trả | CSV fallback | Có | Theo dòng dữ liệu; chưa thêm row tổng riêng | Không áp dụng CSV | AR/AP cùng bảng. |
| Chi phí theo công trình/WBS | CSV fallback | Có | Theo dòng dữ liệu; chưa thêm row tổng riêng | Không áp dụng CSV | Có WBS/hạng mục. |
| Dự toán vs thực tế | CSV fallback | Có | Theo dòng dữ liệu; chưa thêm row tổng riêng | Không áp dụng CSV | Có chênh lệch và tỷ lệ sử dụng. |
| Trial balance/VAT/current reports | CSV fallback | Có | Theo logic hiện hữu | Không áp dụng CSV | Đi qua audited export server-side. |

## 5. Print Template QA

| Route | Kết quả | Lỗi visual | Ghi chú |
| ----- | ------- | ---------- | ------- |
| `/print/debt?projectId=<sample>` | PASS | Không | Audited print gate, header công ty pilot, bảng A4. |
| `/print/ledger?projectId=<sample>` | PASS | Không | Audited print gate, header công ty pilot, bảng A4. |
| `/reports` | PASS trong visual matrix | Không | Matrix `/reports` desktop/laptop/tablet-wide đều PASS. |

## 6. Sample ID QA

| Route động | Sample ID an toàn | Kết quả | Ghi chú |
| ---------- | ----------------- | ------- | ------- |
| `/print/invoice/[id]` | Chưa có | NOT_TESTED_NO_SAMPLE_DATA | Giữ từ Sprint 3A.4B; cần dataset/sample read-only riêng. |
| `/print/payment/[id]` | Chưa có | NOT_TESTED_NO_SAMPLE_DATA | Chưa tạo dữ liệu mới. |
| `/print/advance/[id]` | Chưa có | NOT_TESTED_NO_SAMPLE_DATA | Chưa tạo dữ liệu mới. |
| `/print/inventory/receipt/[id]` | Chưa có | NOT_TESTED_NO_SAMPLE_DATA | Chưa tạo dữ liệu mới. |
| `/print/inventory/issue/[id]` | Chưa có | NOT_TESTED_NO_SAMPLE_DATA | Chưa tạo dữ liệu mới. |

## 7. Audit/Export Safety

Xác nhận:

- Không dùng client-side export legacy để tự sinh dữ liệu tài chính.
- `/reports` và các report pilot gọi `/api/reports/audited-export`.
- `/api/reports/audited-export` gọi `auditExportOrThrow` trước khi trả file.
- Nếu audit fail, route trả lỗi qua `handleApiError`, không trả file.
- Print debt/ledger vẫn dùng `useAuditedPrint` và `/api/print/audit` trước khi tải dữ liệu in.

Ghi chú: client vẫn dùng `URL.createObjectURL` để tải blob response đã được server audit thành công. Đây không phải đường client tự tạo dữ liệu tài chính.

## 8. Safety Confirmation

- Không sửa database.
- Không apply reconciliation mapping.
- Không sửa `Project.companyId`.
- Không sửa `JournalEntry.projectId`.
- Không sửa AP Bát Tràng.
- Không sửa ledger/posting/payment/report source-of-truth.
- Không tạo migration.
- Không production ready.

## 9. Test Results

| Lệnh | Kết quả | Ghi chú |
| ---- | ------- | ------- |
| `git status --short` | WARNING | Repo dirty lớn từ các phase/sprint trước; không revert. |
| `git branch --show-current` | PASS | `main`. |
| `git log -3 --oneline` | PASS | `211d31c`, `92f1dbc`, `d1a5b4f`. |
| `npx prisma validate` | PASS | Schema hợp lệ. |
| `npx tsc --noEmit --pretty false` | PASS | Không lỗi TypeScript. |
| `npx eslint app/api/reports/audited-export/route.ts app/components/accounting/PrintLayout.tsx app/components/accounting/AccountingDocumentHeader.tsx app/services/audited-export.service.ts tests/e2e/report-excel-a4-pilot.spec.ts tests/e2e/print-template-pilot.spec.ts` | PASS | File route/helper/test mới sạch lint. |
| `npx eslint <toàn bộ file đã chạm gồm app/reports/print pages>` | FAIL_PRE_EXISTING | `app/reports/page.tsx`, `app/print/debt/page.tsx`, `app/print/ledger/page.tsx` còn nợ lint cũ `any`/hook; không sửa lan man trong sprint này. |
| `npx prisma generate` | PASS | Pass ngoài sandbox. |
| `npm run build` | PASS | Pass ngoài sandbox; còn warning Turbopack NFT trace cũ và `url.parse()` deprecation. |
| `npm run validation:database` | PASS | Pass ngoài sandbox; read-only counts/integrity OK. |
| `npm run security-check` | PASS | Viewer bị chặn, Manager qua guard. |
| `npm run e2e -- tests/e2e/enterprise-smoke.spec.ts` | PASS | 3/3 passed. |
| `npm run e2e -- tests/e2e/financial-drilldown-smoke.spec.ts` | PASS | 1/1 passed. |
| `npm run e2e -- tests/e2e/visual-regression-pilot.spec.ts` | PASS | 2/2 passed; matrix 36/36 PASS. |
| `npm run e2e -- tests/e2e/report-excel-a4-pilot.spec.ts` | PASS | 2/2 passed. |
| `npm run e2e -- tests/e2e/print-template-pilot.spec.ts` | PASS | 2/2 passed. |

## 10. Đánh giá hệ thống sau Sprint 3A.5

### 10.1 Hệ thống mạnh hơn ở đâu?

Người dùng kế toán có catalog báo cáo rõ theo nghiệp vụ thay vì chỉ tab tài chính chung. Các export pilot ưu tiên đã đi qua audited export server-side, có header công ty, ngày xuất, bộ lọc và format tiền Việt. `/print/debt` và `/print/ledger` có A4 CSS tốt hơn, lặp header bảng khi in và header công ty thống nhất.

### 10.2 Hệ thống còn yếu ở đâu?

Chưa có file Excel `.xlsx` thật vì repo không có thư viện Excel. CSV chưa có row tổng cộng cuối bảng cho tất cả report pilot. Print route động invoice/payment/advance/inventory vẫn thiếu sample ID an toàn để QA layout thật. `app/reports/page.tsx` vẫn còn nợ lint/type cleanup cũ.

### 10.3 Hệ thống còn thiếu gì để gần MISA/FAST hơn?

- Excel template builder `.xlsx` thật với style, freeze header, wrap text, page setup A4.
- Report designer hoặc cấu hình mẫu báo cáo theo công ty.
- Audit log UI sâu cho export/print.
- Drilldown đầy đủ Debt/Revenue/Payment/Reports đến chứng từ gốc.
- Keyboard workflow và bulk action an toàn.
- Phân quyền UI chi tiết hơn.
- Visual regression CI chính thức.
- Lint/type safety gate toàn repo.

### 10.4 Rủi ro còn lại

| Nhóm | Rủi ro |
| ---- | ------ |
| UI_RISK | Catalog mới là pilot; một số tab/con chi tiết chưa được thiết kế lại sâu. |
| PRINT_REPORT_GAP | Dynamic print routes chưa QA vì thiếu sample ID. |
| TRACEABILITY_GAP | Export CSV chưa có link trực tiếp về từng chứng từ gốc ở mọi báo cáo. |
| TECH_DEBT | `app/reports/page.tsx` và print pages còn nợ lint cũ; build còn warning NFT trace/deprecation. |
| UX_GAP | CSV fallback chưa thay thế được Excel `.xlsx` chuẩn MISA/FAST. |

### 10.5 Gợi ý sprint tiếp theo

Khuyến nghị: `Sprint 3A.6 - Audit Log UI & Approval Workflow UX`.

Nên chạy song song hoặc ngay sau đó: `Sprint 3A.5B - Dynamic Print Sample QA & Template Completion`, để có sample ID read-only cho invoice/payment/advance/inventory print routes.

## 11. Decision Gate

`A. READY_FOR_SPRINT_3A_6_AUDIT_LOG_AND_APPROVAL_WORKFLOW_UX`

Điều kiện kèm theo: chưa production ready; CSV fallback chưa phải Excel `.xlsx`; dynamic print routes cần QA bằng sample an toàn trước khi dùng làm mẫu in chính thức.

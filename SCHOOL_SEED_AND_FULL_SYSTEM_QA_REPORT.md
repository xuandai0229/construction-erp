# SCHOOL SEED AND FULL SYSTEM QA REPORT

## 1. Executive Summary

- Reset dữ liệu cũ: Có, đã reset các bảng nghiệp vụ sandbox bằng guarded seed script sau khi backup thành công. Không xóa User/RBAC/Company/LedgerAccount/Fiscal metadata.
- Backup: `D:\construction-erp\.local-audit-quarantine\db-backups\before-school-seed-reset-20260604_171411.sql`.
- Công trình seed: `CT-TH-2026` - Công trình xây dựng Trường Tiểu học Minh Khai 2026.
- Test tổng: seed validation pass, ledger integrity pass, build pass, E2E trọng tâm pass 21/21.
- Vấn đề còn lại: Drilldown static guard báo dashboard chưa tích hợp `FinancialTracePanel`; Next build có warning NFT trace ở audited export route; Excel hiện là CSV fallback theo test.
- Gate sau phase: `B. SEED_COMPLETED_WITH_WARNINGS_NEED_MORE_TEST_DATA`.

## 2. Environment Safety

| Hạng mục | Kết quả | Ghi chú |
| -------- | ------- | ------- |
| DATABASE_URL detected | Yes | Không in secret |
| Database host | localhost | DB local |
| Database name | construction_erp | Không chứa prod/live |
| Production risk | LOW | Được phép tiếp tục |
| Guard `ALLOW_SANDBOX_RESET=true` | Pass | Bắt buộc trong seed script |
| Guard `REQUIRE_LOCAL_DATABASE=true` | Pass | Bắt buộc trong seed script |
| Guard `SEED_NAME=SEED_SCHOOL_CONSTRUCTION_PROJECT` | Pass | Bắt buộc trong seed script |

## 3. Backup/Restore

| Nội dung | Kết quả | Đường dẫn |
| -------- | ------- | --------- |
| SQL backup trước reset | Pass | `D:\construction-erp\.local-audit-quarantine\db-backups\before-school-seed-reset-20260604_171411.sql` |
| Restore instruction | Pass | `D:\construction-erp\.local-audit-quarantine\db-backups\SCHOOL_SEED_RESTORE_INSTRUCTIONS.md` |

## 4. Required Input Data Analysis

| Module | Dữ liệu cần nhập | Đã seed chưa | Còn thiếu |
| ------ | ---------------- | ------------ | --------- |
| Project | Công trình active, chủ đầu tư, dates, value | Có | Nhiều công trình/phân kỳ |
| WBS | WBS nhiều cấp | Có | BOQ chi tiết theo khối lượng |
| Budget | Budget theo costType/WBS | Có | Versioning/approval budget |
| Cost/AP | Chi phí nhiều trạng thái, NCC, VAT | Có | PO/GRN 3-way match đầy đủ |
| Contract | Main contract và NCC contracts | Có | Payment plan/acceptance nhiều đợt |
| AR/Invoice | Posted + draft invoice, VAT, retention | Có | Nhiều đợt nghiệm thu |
| Payment | Payment approved/posted + allocation | Có | Partial/multiple allocations |
| Advance | Paid advances + settlements | Có | Advance employee workflow đầy đủ |
| Inventory | Warehouse/material/receipt | Có một mẫu | Issue/transfer/balance movement đầy đủ |
| Ledger | Double-entry journal | Có | Closing/trial balance snapshots |
| Approval | Pending request + step | Có | Multi-role approval/SoD sâu |
| Audit | Seed audit logs | Có | Audit thực tế cho từng UI action nhiều hơn |
| Report/Print/Export | Debt, ledger, CSV fallback | Có | Excel `.xlsx` thật và print visual full A4 matrix |

## 5. Reset Scope

| Nhóm dữ liệu | Đã reset | Ghi chú |
| ------------ | -------- | ------- |
| Project/WBS/Budget/Cost/Contract/Supplier | Có | Reset toàn bộ bảng nghiệp vụ liên quan |
| Invoice/Payment/Revenue/Allocation | Có | Reset và seed lại |
| Advance/Settlement | Có | Reset và seed lại |
| JournalEntry/TransactionLine | Có | Reset và tạo lại bằng posting engine |
| Inventory/Tax/CashBank | Có | Reset và seed mẫu |
| Approval/Notification/Snapshot/Audit | Có | Reset audit logs và seed marker |
| User/RBAC/Company/Ledger/Fiscal | Không reset | Giữ system/master data cần app chạy |

## 6. Seed Dataset Summary

| Nhóm | Số lượng | Ghi chú |
| ---- | -------: | ------- |
| Company | 1 used/upserted | `CTY-XD-SO2-HN` |
| Project | 1 | `CT-TH-2026` |
| Supplier | 6 | NCC vật tư, xi măng, thiết bị, nhân công, máy, thầu phụ |
| Contract | 7 | 1 main + 6 NCC |
| WBS | 18 | Nhiều cấp |
| Budget | 8 | Tổng 11.1 tỷ |
| Cost | 7 | 4 posted, 1 pending, 2 draft |
| Advance | 3 | Tổng đã chi 650 triệu |
| Settlement | 2 | Đối trừ 200 triệu |
| Invoice | 2 | 1 posted/approved, 1 draft |
| Payment | 1 | Thu 2 tỷ |
| JournalEntry | 11 | Balanced |
| TransactionLine | 28 | Balanced lines |
| AuditLog | 31 | Marker seed |

## 7. Accounting Summary

| Chỉ tiêu | Giá trị |
| -------- | ------: |
| Giá trị hợp đồng | 12.000.000.000 đ |
| Tổng dự toán | 11.100.000.000 đ |
| Chi phí đã ghi sổ | 1.780.000.000 đ |
| Chi phí chờ duyệt | 500.000.000 đ |
| Chi phí draft | 390.000.000 đ |
| Doanh thu/hóa đơn đã ghi sổ | 3.300.000.000 đ |
| Đã thu tiền | 2.000.000.000 đ |
| Công nợ phải thu gross theo DB | 1.300.000.000 đ |
| Công nợ phải thu sau retention quản trị | 1.150.000.000 đ |
| Công nợ phải trả NCC từ posted cost | 1.780.000.000 đ |
| Tạm ứng còn lại | 450.000.000 đ |
| Lãi/lỗ dự kiến | 900.000.000 đ |

## 8. Screen Data Readiness Matrix

| Màn hình | Có dữ liệu | UI ổn | Logic ổn | Vấn đề |
| -------- | ---------- | ----- | -------- | ------ |
| Dashboard | Có | PASS | PASS_WITH_WARNING | Drilldown guard tĩnh báo thiếu `FinancialTracePanel` integration |
| Projects | Có | PASS | PASS | E2E page loaded |
| WBS | Có | PASS | PASS | E2E page loaded |
| Budget | Có | PASS | PASS | E2E page loaded |
| Costs | Có | PASS | PASS | E2E page loaded |
| Revenue/Invoices | Có | PASS | PASS | Có posted + draft |
| Payments | Có | PASS | PASS | Dynamic print tìm được payment |
| Debt | Có | PASS | PASS | Print debt pass |
| Advances | Có | PASS | PASS | Dynamic print tìm được advance |
| Inventory | Có mẫu | PASS_WITH_WARNING | PASS_WITH_WARNING | Có receipt, chưa có issue/transfer full |
| Reports | Có | PASS | PASS_WITH_WARNING | CSV fallback, chưa xác nhận `.xlsx` thật |
| Approvals | Có | PASS | PASS | Smoke pass |
| AuditLog | Có | PASS | PASS | Smoke pass |
| Financial Drilldown | Có | PASS_WITH_WARNING | PASS | E2E pass, static guard 4/5 |
| Print debt/ledger | Có | PASS | PASS | A4 template smoke pass |
| Export reports | Có | PASS_WITH_WARNING | PASS | CSV fallback |

## 9. Business Flow Test Matrix

| Luồng nghiệp vụ | Kết quả | Ghi chú |
| --------------- | ------- | ------- |
| Công trình -> Hợp đồng -> WBS -> Dự toán | PASS | Seed đủ liên kết |
| NCC -> Hợp đồng NCC -> Chi phí | PASS | 6 NCC contracts, 7 costs |
| Tạm ứng -> Hoàn ứng/Đối trừ | PASS | Guard 25/25 |
| Nghiệm thu -> Hóa đơn -> Thu tiền | PASS_WITH_WARNING | Invoice DB remaining gross 1.3 tỷ; quản trị sau retention 1.15 tỷ |
| Chi phí -> Duyệt -> Ghi sổ | PASS | 4 posted costs tạo ledger |
| Doanh thu -> Ghi sổ | PASS | Invoice posted bằng posting engine |
| Công nợ phải thu/phải trả | PASS | AR/AP > 0 |
| Ledger double-entry | PASS | 11 entries, 0 unbalanced |
| Báo cáo công trình | PASS_WITH_WARNING | Có data; cần thêm nhiều kỳ/công trình |
| Drilldown từ số tổng về chứng từ | PASS_WITH_WARNING | E2E pass; guard static dashboard fail |
| Audit trail | PASS | Audit marker + audit UI smoke pass |
| Approval workflow | PASS | Smoke pass |
| Print/Export | PASS_WITH_WARNING | CSV fallback, print smoke pass |

## 10. Report / Excel / Print QA Matrix

| Báo cáo/In/Export | Có dữ liệu | Xuất được | Đúng mẫu | Vấn đề |
| ----------------- | ---------- | --------- | -------- | ------ |
| Audited report export | Có | PASS | PASS_WITH_WARNING | CSV fallback, chưa phải Excel `.xlsx` thật |
| Debt print | Có | PASS | PASS | A4 smoke pass |
| Ledger print | Có | PASS | PASS | A4 smoke pass |
| Invoice print | Có | PASS | PASS_WITH_WARNING | Dynamic smoke pass, chưa kiểm pixel A4 chi tiết |
| Payment print | Có | PASS | PASS_WITH_WARNING | Dynamic smoke pass |
| Advance print | Có | PASS | PASS_WITH_WARNING | Dynamic smoke pass |
| Inventory receipt print | Có | PASS | PASS_WITH_WARNING | Dynamic smoke pass |
| Inventory issue print | Ít/không đủ | PASS_WITH_WARNING | PASS_WITH_WARNING | Seed chưa có issue document đầy đủ |
| Export ledger/debt/advance/payment/invoice endpoints | Có | PASS | PASS_WITH_WARNING | Guard endpoint/source pass, chưa mở file Excel thật |

## 11. Test Results

| Lệnh/Test | Kết quả | Ghi chú |
| --------- | ------- | ------- |
| `git status --short` | PASS | Không in ra thay đổi trước khi bắt đầu |
| `git branch --show-current` | PASS | `main` |
| `git log -5 --oneline` | PASS | Đã kiểm tra baseline |
| `npx prisma validate` | PASS | Schema valid |
| `npx tsc --noEmit --pretty false` | PASS | Không lỗi type |
| `npm run build` | PASS_WITH_WARNING | NFT trace warning + `url.parse()` deprecation |
| `npm run validation:database` | PASS | 0 unbalanced, 0 orphan sampled |
| `npm run security-check` | PASS | Viewer blocked, Manager allowed |
| `npx tsx scripts/audit/verify-ledger-integrity.ts` | PASS | Unbalanced 0, orphan lines 0 |
| `npx tsx scripts/seed/validate-school-construction-project-sandbox.ts` | PASS | 14/14 checks |
| Playwright selected UI/report/print | PASS | 21/21 |
| `scripts/tests/export-print-guards.ts` | PASS | 20/20 |
| `scripts/tests/drilldown-ui-guards.ts` | FAIL_MINOR | 4/5; dashboard static integration missing |
| `scripts/tests/financial-trace-guards.ts` | PASS | 7/7 |
| `scripts/tests/advance-settlement-offset-guards.ts` | PASS | 25/25 |

## 12. Missing Data / Missing Test Coverage

| Nhóm | Thiếu / cần bổ sung |
| ---- | ------------------- |
| Data/Accounting | Nhiều kỳ kế toán, BOQ/progress certification, PO/GRN/AP 3-way match, payment plan/acceptance nhiều đợt |
| UI/UX | Visual diff toàn bộ màn hình desktop/mobile, dark/light sâu, action menu/drawer từng module |
| Report/Print/Excel | Excel `.xlsx` thật, mở file bằng parser, pixel/A4 check toàn bộ chứng từ |
| Workflow/RBAC | Multi-approver, segregation of duties, role matrix theo số tiền |
| Performance/LAN | Load test danh sách lớn, nhiều user LAN, export file lớn |
| Backup/Restore | Restore drill thực tế vào DB sandbox khác |

## 13. Bugs / Issues Found

| Mức độ | Khu vực | Lỗi | Ảnh hưởng | Đề xuất xử lý |
| ------ | ------- | --- | --------- | ------------- |
| P2 | Dashboard drilldown | `scripts/tests/drilldown-ui-guards.ts` báo Dashboard chưa tích hợp `FinancialTracePanel` | Guard tĩnh fail; có thể thiếu trace panel chuẩn ở dashboard | Sprint UI drilldown |
| P3 | Build/report export | Next Turbopack warning: traced whole project path via `app/api/reports/audited-export/route.ts` -> generated Prisma/next config | Build pass nhưng có rủi ro bundle trace rộng | Sprint technical debt |
| P3 | Export Excel | Test xác nhận CSV fallback, chưa phải `.xlsx` thật | Không đáp ứng kỳ vọng Excel đầy đủ nếu người dùng cần workbook | Sprint report/export |
| P3 | Accounting presentation | DB constraint yêu cầu invoice remaining gross 1.3 tỷ; quản trị sau retention là 1.15 tỷ | Cần UI/report phân biệt gross AR vs collectible AR sau retention | Sprint accounting report |

## 14. Safety Warning

`SANDBOX_SEED_DATA`

`SCHOOL_PROJECT_TEST_DATA`

`NOT_FOR_PRODUCTION`

`DO_NOT_USE_FOR_REAL_ACCOUNTING`

Không dùng seed này làm dữ liệu kế toán thật. Không kết luận production ready.

## 15. Rollback Instruction

Xem file restore: `D:\construction-erp\.local-audit-quarantine\db-backups\SCHOOL_SEED_RESTORE_INSTRUCTIONS.md`.

Backup SQL: `D:\construction-erp\.local-audit-quarantine\db-backups\before-school-seed-reset-20260604_171411.sql`.

## 16. Decision Gate

`B. SEED_COMPLETED_WITH_WARNINGS_NEED_MORE_TEST_DATA`

## Đánh giá sau khi hoàn thành

1. Reset + seed 1 công trình trường học giúp hệ thống có baseline sạch, có đủ luồng construction accounting chính: project, WBS, budget, cost, AR/AP, advance, payment, ledger, audit.
2. Dữ liệu seed đủ để test dashboard/report/drilldown/workflow smoke; chưa đủ để mô phỏng nhiều kỳ, nhiều công trình, nhiều role phê duyệt.
3. Cần bổ sung BOQ/progress certification, PO/GRN/AP 3-way match, issue kho, payment plan, acceptance nhiều đợt, nhiều invoice/payment allocation.
4. UI/UX pass smoke cho màn hình chính; dashboard drilldown còn bị guard tĩnh báo thiếu integration chuẩn.
5. Ledger double-entry, cost posting, invoice posting, payment posting, advance/settlement offset đang pass; phần AR sau retention cần tách rõ trong report.
6. Excel/in/xuất chứng từ: print smoke pass, export CSV fallback pass; chưa có xác nhận Excel `.xlsx` thật và A4 pixel check toàn bộ mẫu.
7. Rủi ro lớn nếu nhầm seed sandbox với dữ liệu thật: số liệu giả có marker rõ nhưng vẫn có journal/payment/invoice, tuyệt đối không dùng production.
8. Nên bổ sung seed nhiều công trình/NCC/phân kỳ để test dashboard tổng hợp, aging, performance và so sánh liên công trình.
9. Sau seed cần test thêm full E2E suite, mobile/dark visual, restore drill, load test và RBAC theo role thật.
10. Nếu tiếp tục test sandbox: sửa dashboard drilldown guard, thêm `.xlsx` export thật, mở rộng seed nhiều kỳ và chạy full Playwright.
11. Nếu muốn production thật: làm migration/data governance riêng, UAT với kế toán, kiểm backup/restore thật, RBAC, period closing, reconciliation, không dùng seed này.
12. Gate hiện tại: `B. SEED_COMPLETED_WITH_WARNINGS_NEED_MORE_TEST_DATA`.

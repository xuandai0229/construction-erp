# SPRINT 3A.3 - FINANCIAL DRILLDOWN PILOT REPORT

## 1. Executive Summary

Đã triển khai pilot truy vết số liệu tài chính ở Dashboard/Tổng quan, bảng hiệu quả công trình và bảng Công trình.

- Đã thêm drawer `FinancialDrilldownDrawer` với 5 tab: Tổng quan, Chứng từ nguồn, Bút toán, Hợp đồng/NCC, Audit/Trace.
- Đã tạo endpoint read-only mới: `/api/trace/financial-drilldown`.
- Đã gắn click vào các card: doanh thu, chi phí, lãi/lỗ, dòng tiền/thanh toán, công nợ phải thu, công nợ phải trả, tạm ứng.
- Đã gắn click vào bảng hiệu quả công trình: giá trị hợp đồng, doanh thu, chi phí, lãi/lỗ.
- Đã gắn click vào bảng Công trình: ngân sách, thực chi.
- Không sửa database, không sửa Prisma schema, không tạo migration.
- Không sửa ledger/posting/payment allocation/report source-of-truth.
- Gate sau sprint: **A. READY_FOR_SPRINT_3A_4_VISUAL_REGRESSION_AND_REPORT_QA**.

## 2. Files Changed

| File | Loại sửa | Ghi chú |
| ---- | -------- | ------- |
| `app/api/trace/financial-drilldown/route.ts` | READ_ONLY_TRACE_API | Endpoint read-only, có auth/RBAC kế toán, project scope nếu có `projectId`, không ghi DB |
| `app/components/accounting/FinancialDrilldownDrawer.tsx` | DRILLDOWN_DRAWER / TRACE_PANEL / EMPTY_STATE / WARNING_BADGE | Drawer pilot có tabs, loading/error/empty state tiếng Việt, đóng bằng Escape |
| `app/components/Dashboard.tsx` | DASHBOARD_CLICK_TARGET | Gắn drawer vào dashboard và bảng hiệu quả công trình |
| `app/components/reports/ExecutiveSummaryCards.tsx` | DASHBOARD_CLICK_TARGET | Card tài chính có hover/click và text “Xem chi tiết” |
| `app/components/reports/ProjectProfitabilityTable.tsx` | PROJECT_FINANCIAL_TRACE | Các số hợp đồng/doanh thu/chi phí/lãi lỗ có click trace theo project |
| `app/components/projects/ProjectTable.tsx` | PROJECT_FINANCIAL_TRACE | Cột ngân sách/thực chi mở drawer theo project |
| `app/components/ui-enterprise/EnterpriseMetric.tsx` | EMPTY_STATE | Sửa ký hiệu trend mojibake trên card |
| `tests/e2e/financial-drilldown-smoke.spec.ts` | E2E_TEST | Smoke test dashboard drilldown mở/đóng drawer và endpoint trả thành công |
| `docs/audit/phase1-readonly-validation.json` | TEST_OUTPUT | File được cập nhật bởi `npm run validation:database` |

## 3. Drilldown Coverage

| Màn hình | Chỉ tiêu/số liệu | Có drilldown chưa | Nguồn dữ liệu | Ghi chú |
| -------- | ---------------- | ----------------- | ------------- | ------- |
| Dashboard/Tổng quan | Tổng doanh thu | Có | Invoice, JournalEntry/TransactionLine posted | Click card mở drawer |
| Dashboard/Tổng quan | Tổng chi phí | Có | CostRecord, JournalEntry/TransactionLine posted | Click card mở drawer |
| Dashboard/Tổng quan | Lãi/lỗ | Có | Invoice - CostRecord, JournalEntry/TransactionLine posted | Pilot tính trace nguồn từ chứng từ liên quan, không đổi số dashboard |
| Dashboard/Tổng quan | Dòng tiền/thanh toán | Có | Payment, JournalEntry/TransactionLine posted | Click card mở drawer |
| Dashboard/Tổng quan | Công nợ phải thu | Có | Invoice, Payment, ledger posted | Click card mở drawer |
| Dashboard/Tổng quan | Công nợ phải trả | Có | CostRecord, Payment, ledger posted | Có cảnh báo human approval |
| Dashboard/Tổng quan | Tạm ứng/hoàn ứng | Có | AdvanceRequest, ledger posted | Có cảnh báo human approval |
| Bảng hiệu quả công trình | Giá trị hợp đồng | Có | Contract | Theo `projectId` |
| Bảng hiệu quả công trình | Doanh thu/chi phí/lãi lỗ | Có | Invoice, CostRecord, ledger posted | Theo `projectId` |
| Bảng Công trình | Ngân sách | Có | BudgetRecord | Theo `projectId` |
| Bảng Công trình | Thực chi | Có | CostRecord, ledger posted | Theo `projectId` |
| Công nợ chi tiết | Số phải thu/phải trả từng dòng | Chưa mở rộng trong sprint này | Hiện đã có trace invoice ở màn hình Debt cũ | Cần Sprint 3A.3B nếu muốn phủ kín |
| Doanh thu/Hóa đơn/Thanh toán | Chứng từ đơn lẻ | Một phần có sẵn | FinancialTracePanel cũ/API invoice/payment | Không refactor trong sprint này |
| Báo cáo | Số tổng trong report | Chưa mở rộng | Ledger/report APIs | Cần sprint sau |

## 4. Trace Data Sources

Đã dùng:

- `JournalEntry`
- `TransactionLine`
- `Invoice`
- `Payment`
- `CostRecord`
- `Contract`
- `Project`
- `WBS` qua relation của Budget/Cost/Invoice
- `BudgetRecord`
- `AdvanceRequest`
- `Supplier` qua Contract/Advance

Chưa dùng sâu:

- `AuditLog`: drawer có tab Audit/Trace nhưng endpoint pilot hiện trả empty state; cần mở rộng bằng mapping entity/source ở sprint sau.
- `AdvanceSettlement`: hiện mới lấy trong relation của AdvanceRequest, chưa có bảng chi tiết hoàn ứng riêng.
- Báo cáo tổng hợp: chưa gắn vào các số tổng trên trang Reports để tránh fake trace hoặc đổi source-of-truth.

## 5. Human Approval Warning

Drawer hiển thị cảnh báo khi chỉ tiêu có khả năng liên quan vùng cần rà soát:

- Project/company mapping còn chờ quyết định.
- CASH_BANK journal mapping còn chờ owner/kế toán xác nhận.
- AP Bát Tràng còn manual review.

Thông điệp hiển thị:

> Dữ liệu đối soát này đang chờ kế toán/owner xác nhận. Không dùng làm sổ kế toán thật.

Không tự sửa dữ liệu để làm mất cảnh báo.

## 6. Safety Confirmation

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

## 7. Test Results

| Lệnh | Kết quả | Ghi chú |
| ---- | ------- | ------- |
| `git status --short` | Pass | Repo dirty từ nhiều phase trước; sprint này chỉ tính các file nêu trên |
| `git branch --show-current` | Pass | `main` |
| `git log -3 --oneline` | Pass | `211d31c`, `92f1dbc`, `d1a5b4f` |
| `npx prisma validate` | Pass | Schema hợp lệ |
| `npx prisma generate` | Pass | Sandbox bị `spawn EPERM`, chạy ngoài sandbox pass |
| `npx tsc --noEmit --pretty false` | Pass | Không có lỗi TypeScript |
| `npx eslint <files Sprint 3A.3>` | Pass | Lint riêng file đã sửa pass |
| `npm run build` | Pass | Sandbox bị `.next/trace EPERM`, chạy ngoài sandbox pass; còn warning cũ Turbopack/NFT và `url.parse()` |
| `npm run validation:database` | Pass | Read-only validation: unbalanced posted journal = 0, orphan WBS = 0, draft posted payments = 0 |
| `npm run security-check` | Pass | Viewer bị chặn, Manager qua guard |
| `npm run e2e -- tests/e2e/enterprise-smoke.spec.ts` | Pass | 3/3 tests pass |
| `npm run e2e -- tests/e2e/financial-drilldown-smoke.spec.ts` | Pass | 1/1 test pass |

## 8. Remaining Issues

- Chưa gắn drilldown vào mọi số tổng trên Reports.
- Màn hình Debt/Revenue/Payment đã có trace đơn lẻ một phần nhưng chưa được chuẩn hóa vào drawer mới.
- Tab Audit/Trace mới là empty state pilot, chưa truy vấn sâu `AuditLog`.
- Drilldown đang lấy tối đa 25 dòng nguồn để giữ runtime nhẹ; cần pagination nếu dùng thật.
- Còn lint debt toàn repo ngoài phạm vi Sprint 3A.3.
- Build còn warning cũ Turbopack/NFT và `url.parse()`.
- Còn các text mojibake cũ ở nhiều file ngoài phạm vi sprint này.

## 9. Đánh giá hệ thống sau Sprint 3A.3

### 9.1 Hệ thống mạnh hơn ở đâu?

- Kế toán có thể bấm trực tiếp vào số tài chính quan trọng để xem chứng từ nguồn và bút toán liên quan.
- Dashboard không còn chỉ là số tổng tĩnh; có trace pilot theo chỉ tiêu.
- Bảng hiệu quả công trình và bảng Công trình có click target rõ ràng trên số tiền.
- Drawer có cảnh báo human approval để tránh hiểu nhầm dữ liệu đối soát là sổ thật.

### 9.2 Hệ thống còn yếu ở đâu?

- Trace chưa phủ hết từng màn hình nghiệp vụ.
- Audit trail chưa nối sâu vào drawer.
- Chưa có pagination/filter trong drawer.
- Chưa có visual regression screenshot ở nhiều viewport.

### 9.3 Hệ thống còn thiếu gì để gần MISA/FAST hơn?

- Excel A4 và in chứng từ chuẩn mẫu.
- Drilldown nhiều tầng: số tổng -> chứng từ -> bút toán -> audit log.
- Keyboard workflow cho kế toán nhập liệu nhanh.
- Audit log UI đầy đủ.
- Phân quyền UI chi tiết hơn theo vai trò.
- Visual regression test cho bảng/drawer/report.

### 9.4 Rủi ro còn lại

| Nhóm | Rủi ro |
| ---- | ------ |
| UI_RISK | Drawer chưa được chụp screenshot ở nhiều viewport |
| ACCOUNTING_DATA_RISK | Vùng mapping/human approval vẫn chưa được owner xác nhận |
| TRACEABILITY_GAP | Reports, Debt chi tiết, Revenue/Payment chi tiết chưa phủ drawer mới |
| TECH_DEBT | Lint toàn repo còn nợ cũ |
| PERFORMANCE_RISK | Drawer chưa có pagination nếu dữ liệu thật lớn |
| UX_GAP | Chưa có drilldown nhiều tầng như phần mềm kế toán chuyên nghiệp |

### 9.5 Gợi ý sprint tiếp theo

Đề xuất: **Sprint 3A.4 - Visual Regression & Report/Print Pilot QA**.

Nếu muốn phủ trace sâu hơn trước, chọn: **Sprint 3A.3B - Expand Drilldown Coverage** cho Debt, Revenue, Payment và Reports.

## 10. Decision Gate

**A. READY_FOR_SPRINT_3A_4_VISUAL_REGRESSION_AND_REPORT_QA**

Không kết luận production ready.


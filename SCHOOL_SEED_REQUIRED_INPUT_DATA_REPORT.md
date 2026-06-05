# SCHOOL SEED REQUIRED INPUT DATA REPORT

Markers: `SANDBOX_SEED_DATA`, `SCHOOL_PROJECT_TEST_DATA`, `NOT_FOR_PRODUCTION`, `DO_NOT_USE_FOR_REAL_ACCOUNTING`.

## 6.1 Danh mục dữ liệu cần nhập theo module

| Module | Cần dữ liệu gì | Bảng/model liên quan | Màn hình sử dụng | Bắt buộc hay tùy chọn |
| ------ | -------------- | -------------------- | ---------------- | --------------------- |
| Dashboard | Project active, budget, posted cost, invoice/payment, ledger, snapshot | Project, BudgetRecord, CostRecord, Invoice, Payment, JournalEntry, FinancialSnapshot | `/`, `/api/dashboard/stats`, workspace APIs | Bắt buộc |
| Projects/Công trình | Công trình, chủ đầu tư, giá trị hợp đồng, ngày, status, company/branch | Project, Company, Branch, Contract | `/projects`, `/projects/[id]`, `/api/projects` | Bắt buộc |
| WBS/Hạng mục | WBS nhiều cấp, code, parent, sort order, budget amount | WBSItem | `/wbs`, `/api/wbs`, trace WBS | Bắt buộc |
| Budget/Dự toán | Dự toán theo WBS và costType | BudgetRecord, WBSItem, Project | `/budget`, `/api/budgets`, reports budget vs actual | Bắt buộc |
| Costs/Chi phí | Chi phí material/labor/machine/subcontract/overhead, trạng thái draft/pending/posted, NCC, VAT | CostRecord, Supplier, JournalEntry, TransactionLine | `/costs`, `/api/costs`, ledger, debt | Bắt buộc |
| Suppliers/NCC | NCC code/name/tax/phone/address/type, liên kết project | Supplier, ProjectSupplier, Contract | contracts, costs, trace supplier | Bắt buộc |
| Contracts/Hợp đồng | Hợp đồng chủ đầu tư và hợp đồng/PO NCC, value, dates, retention/VAT note | Contract, PaymentPlan, Acceptance | accounting contracts, invoices, cash-bank | Bắt buộc |
| Revenue/Invoices | Invoice posted/draft, VAT, retention, paid/remaining | Invoice, Revenue, TaxInvoice, JournalEntry | `/revenue`, `/api/invoices`, print/export invoice | Bắt buộc |
| Payments/Thanh toán | Payment approved/posted, allocation, cash/bank document | Payment, PaymentAllocation, CashBankDocument | `/revenue`, print payment, debt | Bắt buộc |
| Debt/Công nợ | AR/AP balances, paid/remaining, supplier payable | Invoice, Payment, CostRecord, JournalEntry | `/debt`, `/print/debt`, `/api/reports/aging` | Bắt buộc |
| Advances/Tạm ứng | Advance paid, settlement/offset, remaining | AdvanceRequest, AdvanceSettlement, JournalEntry | `/api/advances`, `/print/advance`, outstanding advance reports | Bắt buộc |
| Cash/Bank | Phiếu thu/chi, bank/cash method, debit/credit accounts | CashBankDocument, LedgerAccount | `/cash-bank`, print receipt/payment | Bắt buộc cho print tiền |
| Inventory/Kho | Kho, vật tư, phiếu nhập/xuất, line, amount/VAT | Warehouse, MaterialItem, InventoryDocument, InventoryDocumentLine | `/inventory`, inventory reports/exports | Tùy chọn nhưng nên có |
| Accounting/Ledger | Tài khoản, bút toán cân, sourceType/sourceId | LedgerAccount, JournalEntry, TransactionLine | `/accounting`, `/print/ledger`, ledger reports | Bắt buộc |
| Reports/Báo cáo | Dữ liệu chi phí, ngân sách, công nợ, tạm ứng, ledger, audit export | FinancialSnapshot, AuditLog, business docs | `/reports`, export routes | Bắt buộc |
| Approvals/Duyệt | Request pending, step pending, notification | ApprovalRequest, ApprovalStep, Notification | `/approvals`, workspace notifications | Bắt buộc để test workflow |
| AuditLog | Log create/approve/post/export/print | AuditLog | audit panels, report history | Bắt buộc |
| Print/Export | Entity ids cho invoice/payment/advance/ledger/debt; audit reason | Invoice, Payment, AdvanceRequest, JournalEntry, AuditLog | `/print/*`, `/api/export/*`, `/api/reports/audited-export` | Bắt buộc |
| Financial Drilldown | Source document ids, journal source links, audit logs | JournalEntry, TransactionLine, AuditLog | trace APIs, drilldown drawer | Bắt buộc |

## 6.2 Danh sách chứng từ cần có

| Chứng từ | Đã seed | Ghi chú |
| -------- | ------- | ------- |
| Hợp đồng chủ đầu tư | Có | `HD-THMK-2026-001`, 12 tỷ |
| Hợp đồng/đơn hàng NCC | Có | 6 hợp đồng NCC |
| Dự toán công trình | Có | 8 dòng, tổng 11.1 tỷ |
| Phiếu chi phí vật tư | Có | posted |
| Phiếu chi phí nhân công | Có | posted |
| Phiếu chi phí máy thi công | Có | posted |
| Phiếu chi phí thầu phụ | Có | pending |
| Phiếu tạm ứng | Có | 3 phiếu |
| Phiếu hoàn ứng/đối trừ | Có | 2 settlement posted |
| Hóa đơn nghiệm thu | Có | 1 posted, 1 draft |
| Phiếu thu tiền | Có | CashBankDocument posted |
| Bút toán ghi sổ | Có | 11 journal entries, 28 lines |
| Báo cáo công nợ | Có dữ liệu | AR gross 1.3 tỷ; AR sau retention 1.15 tỷ |
| Báo cáo tạm ứng/thanh toán | Có dữ liệu | remaining advance 450 triệu |
| Báo cáo dự toán vs thực tế | Có dữ liệu | budget 11.1 tỷ, posted cost 1.78 tỷ |

## 6.3 Dữ liệu tối thiểu để test UI/UX

| Màn hình | Tối thiểu cần có | Seed hiện tại |
| -------- | ---------------- | ------------- |
| Projects | Ít nhất 1 công trình active | 1 active school project |
| WBS | Ít nhất 8 hạng mục nhiều cấp | 18 WBS items |
| Budget | Ít nhất 5 nhóm chi phí | 8 budget rows, 6 cost types |
| Costs | draft/pending/approved/posted | 7 costs đủ draft/pending/posted |
| Invoice | draft/pending/posted | 1 posted/approved, 1 draft |
| Payment | paid/partial | 1 approved payment, invoice partial |
| Debt | AR/AP có số dư | AR > 0, AP from posted costs > 0 |
| Advances | Paid/settled/remaining | 3 advances, 2 settlements, remaining > 0 |
| Reports | Có số liệu report | snapshot/revenue/ledger/cost/budget |
| Approvals | Chứng từ chờ duyệt | 1 ApprovalRequest pending |
| Audit | Log tạo/sửa/duyệt/in/xuất | Seed audit present; export/print E2E also creates audit |


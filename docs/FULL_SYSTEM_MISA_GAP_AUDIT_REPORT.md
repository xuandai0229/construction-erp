# FULL SYSTEM MISA GAP AUDIT REPORT

Audit date: 2026-05-28  
Workspace: `C:\Users\admin\construction-erp`  
Scope: source code, Prisma schema, API routes, service layer, UI pages/components, runtime scripts, build, lint, migration status, Playwright E2E.  
Important limitation: database content was not manually mutated. Direct data-orphan verification was limited because the project has one unapplied migration and the custom validation scripts currently fail before running.

## 1. Executive Summary

The system is beyond a simple UI demo: it has a real Next.js 16 app, Prisma/PostgreSQL schema, ledger/accounting tables, RBAC, fiscal period structures, audit log, vouchers, posting engine integration, and many enterprise-oriented APIs. However, it is not ready for real accounting operation at MISA-like quality.

Current assessed level: **Level 2 - dùng nội bộ hạn chế**. It can run and build, but accounting correctness and governance are uneven across modules.

Runtime evidence:

- `npm run build`: PASS outside sandbox. Next.js generated 69 routes, but warned that `next.config.ts -> generated/prisma-client/index.js -> app/api/revenues/[id]/route.ts` traces the whole project unexpectedly.
- `npx tsc --noEmit`: PASS.
- `npx prisma validate`: PASS.
- `npx prisma migrate status`: FAIL governance, migration `20260527000100_phase2_enterprise_database` not applied.
- `npm run lint`: FAIL with 796 problems, 601 errors, 195 warnings.
- `npm test`: FAIL because no `test` script exists.
- `npm run e2e`: FAIL, 2 passed, 2 failed, 11 skipped/not run. `/api/wbs?projectId=...` returned 404; dashboard validation did not find expected `WBS` text.
- `npm run security:routes`: FAIL, `app/api/accounting-core/route.ts` lacks auth/sensitive guard.
- `npm run validation:database` and `npm run financial-check`: FAIL because scripts import `../generated/prisma-client` from a nested folder where that path does not exist.

Largest risks:

- A financial action route, `app/api/accounting-core/route.ts`, exposes supplier/contract/acceptance/invoice/payment creation without auth/RBAC.
- Project deletion has a hard-delete branch that can delete many financial and operational tables when the project is considered empty; this is unsafe for accounting governance.
- Some reports use ledger while other screens still aggregate `CostRecord`, `Invoice`, `Revenue`, or UI fallback values, so figures can diverge.
- Migration drift means runtime DB may not match the current schema.
- Important UI integrity widgets show static or mock-derived values.

Strongest points:

- Prisma schema uses `Decimal @db.Decimal(18,2)` broadly for money fields.
- Several core flows already use transactions, period-lock checks, audit logs, optimistic locking, and posting/reversal logic.
- RBAC matrix and segregation-of-duties checks exist for voucher/cost approvals.
- Build and typecheck are viable, so the app is structurally runnable.

First upgrade priority: close the governance/security gap, apply/verify migrations, standardize single source of truth for reports, and remove fake/static financial integrity indicators.

## 2. System Map

### Module hiện có

| Nhóm | Hiện trạng |
| --- | --- |
| Dashboard / workspace | `/`, `Dashboard`, `ExecutiveRiskCenter`, `FinancialIntegrityDashboard`, workspace action/notification/intelligence APIs |
| Dự án / công trình | `/projects`, `/projects/[id]`, `ProjectService`, project CRUD APIs |
| WBS / hạng mục | `/wbs`, `WBSService`, WBS APIs, WBS aggregation |
| Dự toán | `/budget`, `BudgetService`, budget CRUD/import APIs |
| Chi phí | `/costs`, `CostService`, cost CRUD, approval, vendor payment |
| Doanh thu / hóa đơn / thanh toán | `/revenue`, `/debt`, `RevenueService`, invoice/payment APIs |
| Hợp đồng / nhà cung cấp / nghiệm thu | `/accounting`, `/accounting/contracts/[id]`, `ConstructionAccountingService`, `Supplier`, `Contract`, `Acceptance`, `PaymentPlan` |
| Kế toán / sổ cái | `/accounting`, voucher APIs, ledger reports, trial balance, general journal |
| Báo cáo | `/reports`, `FinancialAggregationService`, `ReportingService`, aging, reconciliation, monthly, financial, audit export |
| Phân quyền / governance | `/settings`, `RBAC`, fiscal periods, accounting period closing, permission matrix API |
| System / backup | `/system`, backup/restore, diagnostics, alerts, monitoring APIs |
| AI chat | `app/components/AIChatBox.tsx`, `/api/ai/chat` |

### Màn hình hiện có

`/`, `/accounting`, `/accounting/contracts/[id]`, `/budget`, `/costs`, `/debt`, `/login`, `/projects`, `/projects/[id]`, `/reports`, `/revenue`, `/settings`, `/system`, `/wbs`.

### API hiện có

72 API route files were found under `app/api`. Key groups:

- Accounting: `/api/accounting-core`, `/api/accounting/accounts`, `/api/accounting/vouchers/*`, `/api/accounting/reports/*`
- Projects/WBS/tasks: `/api/projects`, `/api/projects/[id]`, `/api/wbs`, `/api/wbs/[id]`, `/api/tasks`, `/api/tasks/[id]`
- Finance documents: `/api/costs`, `/api/costs/[id]`, `/api/costs/[id]/approve`, `/api/costs/[id]/payment`, `/api/invoices`, `/api/invoices/[id]`, `/api/payments`
- Reports: `/api/reports/aging`, `/api/reports/financial`, `/api/reports/reconciliation`, `/api/reports/ledger`, `/api/reports/trial-balance`, `/api/reports/period-closing`, etc.
- Governance/system: `/api/governance/*`, `/api/fiscal-periods`, `/api/system/backup`, `/api/system/diagnostics`, `/api/admin/financial-health`
- Workspace/AI: `/api/workspace/*`, `/api/ai/chat`, `/api/stream`

### Database table hiện có

Important Prisma models include `Project`, `WBSItem`, `BudgetRecord`, `CostRecord`, `Revenue`, `Invoice`, `Payment`, `VendorPayment`, `PaymentAllocation`, `LedgerAccount`, `JournalEntry`, `TransactionLine`, `Contract`, `Supplier`, `ProjectSupplier`, `Acceptance`, `PaymentPlan`, `DocumentChecklist`, `AuditLog`, `ApprovalRequest`, `ApprovalStep`, `FiscalPeriod`, `FiscalYear`, `AccountingPeriod`, `TrialBalanceSnapshot`, `BalanceSheetSnapshot`, `ProfitLossSnapshot`, procurement, inventory, BOQ, subcontract, workflow, saga, read model, cash/bank, resource, claim, commitment tables.

### Service hiện có

Core services include `ProjectService`, `CostService`, `RevenueService`, `PaymentService`, `VoucherService`, `ConstructionAccountingService`, `FinancialAggregationService`, `ReportingService`, `ReconciliationService`, `AuditService`, `BudgetService`, `WBSService`, `ApprovalService`, `DashboardService`, `AccountingGovernance`, `PeriodClosingEngine`, `TrialBalanceService`, `LedgerReportService`, `GeneralJournalService`.

### Báo cáo hiện có

Dashboard stats, project financial summary, financial report, ledger, ledger lines, trial balance, general journal, aging, monthly, reconciliation, WIP closing, cash flow, debt, project profit/loss, audited export, fiscal years/periods, financial health.

## 3. UI/UX Audit

| Màn hình | Điểm UI/UX | Vấn đề | Mức độ nghiêm trọng | Đề xuất cải thiện |
| --- | ---: | --- | --- | --- |
| Dashboard `/` | 6/10 | E2E dashboard validation không tìm thấy `WBS`; `FinancialIntegrityDashboard` hiển thị `SYNCED`, `lockedPeriodWarnings = 0` tĩnh. | High | Dashboard phải giải thích nguồn KPI, có drill-down, bỏ chỉ số tĩnh/mock, sửa test contract. |
| Projects `/projects` | 7/10 | Có bảng, filter, stats, pagination; nhưng detail API GET không kiểm tra tenant trong route trước khi gọi service. | High | Chuẩn hóa tenant guard cho GET detail; hiển thị trạng thái empty/loading/error rõ hơn. |
| Project detail `/projects/[id]` | 6/10 | Có dữ liệu WBS/tasks nhưng chưa đủ bằng chứng drill-down chứng từ tài chính. | Medium | Thêm tab chứng từ/hợp đồng/công nợ, liên kết từ KPI tới chứng từ gốc. |
| WBS `/wbs` | 6/10 | E2E sampled API `/api/wbs?projectId=...` trả 404 cho project test; cần xác minh UX khi project không có WBS. | High | API trả empty state hợp lệ hoặc lỗi có hướng dẫn; UI cần tree/table ổn định. |
| Budget `/budget` | 6/10 | Có import/export-ish UI nhưng dùng `alert`; cần validate import thực tế rõ hơn. | Medium | Modal import có preview, validate lỗi theo dòng, rollback rõ. |
| Costs `/costs` | 6/10 | Có confirm xóa nhưng dùng browser `confirm/alert`; AP payment cũ còn compatibility simulation trong service. | High | Thay bằng enterprise modal, hiển thị workflow, hạn mức, ledger status, reason bắt buộc. |
| Revenue `/revenue` | 6/10 | Có confirm hành động; chưa đủ kiểm soát duyệt/thanh toán trên UI như phần mềm kế toán. | High | Tách lập hóa đơn, duyệt, ghi sổ, thu tiền, hoàn bút toán; drill-down ledger. |
| Debt `/debt` | 5/10 | Có xóa hóa đơn qua confirm; công nợ cần đối chiếu ledger rõ hơn. | High | Không cho xóa tài chính từ bảng thường; dùng hủy/đảo bút toán với lý do. |
| Accounting `/accounting` | 6/10 | Có luồng supplier-contract-acceptance-invoice-payment; text có dấu bị mojibake ở nhiều service/API. | High | Chuẩn hóa encoding tiếng Việt, form kế toán chuẩn, bắt buộc chứng từ/hồ sơ. |
| Contract detail | 7/10 | Có contract, acceptance, invoice, payment, checklist; nhưng tạo invoice dùng fallback WBS đầu tiên. | High | Không fallback WBS âm thầm; bắt người dùng chọn WBS/hạng mục nghiệm thu. |
| Reports `/reports` | 6/10 | Có nhiều endpoint report, nhưng nguồn dữ liệu chưa thống nhất hoàn toàn. | High | Báo cáo phải ghi nguồn ledger/subledger, có reconciliation badge và drill-down. |
| Settings `/settings` | 6/10 | Có role/period lock UI; dùng `alert` cho lỗi và unlock reason. | Medium | Enterprise toast/modal, reason workflow, audit trail visible. |
| System `/system` | 5/10 | Có backup/restore mạnh; restore có khả năng ghi đè toàn DB. | Critical | Tách khỏi UI thường, yêu cầu confirmation token, dry-run, scope tenant, backup verified. |
| Login `/login` | 6/10 | Có dev bootstrap route ngoài production. | Medium | Đảm bảo production không expose; thêm session expiry/role display. |
| AI Chatbox | 5/10 | Có UI chat, chưa đủ bằng chứng kiểm soát dữ liệu nhạy cảm/rate limit. | Medium | Audit prompt/data access, rate limit, citation nguồn dữ liệu, no hallucinated finance. |

## 4. Database Audit

| Bảng | Trạng thái | Vấn đề | Rủi ro | Đề xuất |
| --- | --- | --- | --- | --- |
| `Project` | PARTIAL | Có `deletedAt`, `companyId`, `version`; delete service vẫn có hard-delete branch. | Critical | Không hard delete project; archive-only với audit và retention. |
| `WBSItem` | PARTIAL | Có self relation, budget/cost/revenue links; API E2E 404 với project sample. | High | Validate root/leaf, unique WBS code per project, no orphan WBS/cost. |
| `BudgetRecord` | PARTIAL | Decimal và soft delete có; chưa thấy budget version locking bắt buộc trong CRUD chính. | Medium | Dự toán cần version, approval, freeze baseline. |
| `CostRecord` | PARTIAL | Có Decimal, workflow, version, audit; supplier còn là string, không FK Supplier. | High | Tách vendor master/contract FK cho AP; bắt buộc cost liên kết hợp đồng/PO khi cần. |
| `Revenue` | PARTIAL | Có invoice FK; vẫn có thể tính doanh thu từ `Revenue` ở vài nơi thay vì ledger. | High | Revenue accounting phải phát sinh từ invoice/ledger, không tạo record phụ làm nguồn chính. |
| `Invoice` | PARTIAL | Có contractId optional, companyId, approval, retention; vẫn cho invoice không contract ở schema. | High | Với ERP xây dựng, invoice tài chính nên bắt contract hoặc lý do exception. |
| `Payment` | PARTIAL | Có invoiceId/contractId optional; payment có thể mồ côi contract/invoice. | High | Payment bắt buộc allocation hoặc source document; no orphan payment. |
| `VendorPayment` | GOOD/PARTIAL | Có AP payment riêng, reversal, project/cost FK. | Medium | Cần partial status enum chính xác, allocation/reporting đầy đủ. |
| `PaymentAllocation` | PARTIAL | Cho payment/invoice/vendorPayment nullable. | High | Constraint: mỗi allocation phải có đúng một nguồn và một đích hợp lệ. |
| `LedgerAccount` | GOOD | Code unique, account hierarchy, active flag. | Medium | Cần chart-of-accounts đầy đủ theo chế độ kế toán VN. |
| `JournalEntry` | PARTIAL | Có status, isPosted, reversal; không có companyId trực tiếp trong schema. | High | Ledger phải company scoped trực tiếp, reference unique theo công ty/kỳ. |
| `TransactionLine` | PARTIAL | Decimal, debit/credit; balance enforced in service, not DB constraint. | High | Enforce double-entry by transaction service and reconciliation job. |
| `Contract` | PARTIAL | Có project FK, supplier optional, unique project/supplier/code. | High | Supplier không nên optional cho hợp đồng AP; cần customer/investor contract rõ. |
| `Supplier`, `ProjectSupplier` | GOOD/PARTIAL | Có supplier master và many-to-many với project. | Medium | Cần tax code, bank info, address, legal representative, payment terms. |
| `Acceptance` | PARTIAL | Có contract FK và unique acceptance number. | High | Cần status approval, document attachment, quantity/progress links. |
| `PaymentPlan` | PARTIAL | Có contract FK, dueDate, amount, status string. | Medium | Status nên enum; cần retention/advance separation. |
| `DocumentChecklist` | PARTIAL | Có contract FK nhưng status string. | Medium | Nên enum và có required document templates. |
| `AuditLog` | PARTIAL | Có model và service; nhiều flows log. | High | Bắt buộc mọi sensitive route, report export, restore, unlock, delete đều log đủ old/new/reason. |
| `ApprovalRequest/ApprovalStep` | PARTIAL | Có workflow tables nhưng không thấy thống nhất dùng ở mọi chứng từ. | High | Chuẩn hóa một workflow engine cho voucher/cost/invoice/payment. |
| `FiscalPeriod` | PARTIAL | Legacy month lock exists. | High | Đang song song với `FiscalYear/AccountingPeriod`; cần hợp nhất. |
| `FiscalYear/AccountingPeriod` | GOOD/PARTIAL | Có company, period, status, snapshots. | Medium | Migration chưa apply nên chưa chắc runtime DB có đủ. |
| Snapshots | PARTIAL | Có trial/balance/P&L snapshot tables. | Medium | Cần snapshot generation/reconciliation schedule rõ. |

## 5. Business Logic Audit

| Luồng nghiệp vụ | Trạng thái | Lỗi phát hiện | Rủi ro | Đề xuất |
| --- | --- | --- | --- | --- |
| Tạo/sửa/xóa công trình | PARTIAL/RISKY | `ProjectService.delete` hard-deletes nhiều bảng nếu không phát hiện financial history. `findById` không lọc `deletedAt` và route GET detail thiếu auth/tenant guard. | Critical | Archive-only; GET detail require auth + tenant; không trả project đã xóa. |
| Gắn WBS/dự toán | PARTIAL | WBS API failed E2E 404 for sample project; WBS totals can be synced from read path via `process.nextTick`. | High | WBS writebacks phải là job có audit/idempotency; API empty state rõ. |
| Hợp đồng | PARTIAL | Có contract/supplier/acceptance/payment plan; supplier optional in schema; route accounting-core không auth. | Critical | Bắt auth/RBAC, supplier/customer bắt buộc theo loại hợp đồng. |
| Tạm ứng | NOT IMPLEMENTED/PARTIAL | Không thấy advance request/settlement module riêng; report names reuse payable by supplier. | High | Thêm advance request, approval, payment, settlement/offset, outstanding advance report. |
| Thanh toán AR | PARTIAL | `RevenueService.createPayment` checks remaining and posts ledger; approval status starts DRAFT but posting happens at creation. | High | Payment should submit/approve/post; no ledger posting before approval. |
| Thanh toán AP | PARTIAL | `PaymentService.createVendorPayment` is better, but cost update still has `CREATE_AP_PAYMENT_SIMULATION`. | High | Remove compatibility simulation; all AP payments through VendorPayment. |
| Công nợ | PARTIAL | Some reports use ledger 131/331; contract service uses min(acceptance, invoice) - payment. | High | Define single receivable/payable formula and reconcile subledger vs ledger. |
| Doanh thu/chi phí/lãi lỗ | PARTIAL | Canonical service uses ledger for posted revenue/cost, but project list uses `CostRecord` and monthly report uses invoices/costs/payments. | High | Ledger is source for financial reports; management exposure separate and labeled. |
| Chứng từ/ghi sổ | PARTIAL/GOOD | Voucher service enforces balanced entries, approval, post, period lock, SoD. | Medium | Add companyId to journal entry, document status enum, hard tests. |
| Khóa kỳ | PARTIAL | `FiscalPeriod` and `AccountingPeriod` both exist; migration pending. | High | Consolidate period model; block all financial writes consistently. |
| Drill-down | PARTIAL | Contract reports have `href`; dashboard/report KPI drill-down incomplete. | Medium | Every KPI opens report lines and original vouchers/contracts. |

## 6. CRUD Audit

| Module | Thêm | Sửa | Xóa | Tìm kiếm | Lọc | Export | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Projects | PASS | PARTIAL | RISKY | PASS | PASS | PARTIAL | Hard-delete branch; detail GET lacks tenant/auth guard. |
| WBS | PARTIAL | PARTIAL | PARTIAL | PASS | PARTIAL | NOT IMPLEMENTED | E2E API 404 for sampled WBS. |
| Budget | PASS | PARTIAL | PASS | PASS | PASS | PARTIAL | Import exists but validation evidence insufficient. |
| Costs | PASS | PASS | PARTIAL | PASS | PASS | PARTIAL | Delete soft but audit reason says hard delete; AP simulation risk. |
| Invoices | PASS | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | Approval/posting mixed; delete needs reason in service. |
| Payments AR | PASS | FAIL/PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | Update blocked; needs reverse flow exposed clearly. |
| Vendor payments AP | PASS | PARTIAL | PARTIAL | PARTIAL | PARTIAL | NOT IMPLEMENTED | Good transaction/reversal base, UI coverage limited. |
| Revenue records | PASS | PARTIAL | NOT IMPLEMENTED | PARTIAL | PARTIAL | PARTIAL | Need avoid separate revenue source if ledger canonical. |
| Contracts | PASS | PARTIAL | NOT IMPLEMENTED | PARTIAL | PARTIAL | NOT IMPLEMENTED | Core route has no auth guard. |
| Suppliers | PASS | PARTIAL | NOT IMPLEMENTED | PARTIAL | PARTIAL | NOT IMPLEMENTED | Needs vendor master fields. |
| Acceptance | PASS | NOT IMPLEMENTED | NOT IMPLEMENTED | PARTIAL | PARTIAL | NOT IMPLEMENTED | No approval/status governance. |
| Vouchers | PASS | PASS | PASS | PASS | PASS | PARTIAL | Good governance, but no companyId in JournalEntry. |
| Reports | N/A | N/A | N/A | PARTIAL | PARTIAL | PARTIAL | Export exists for some routes. |
| Settings/periods | PASS | PARTIAL | N/A | PARTIAL | PARTIAL | N/A | Need one period model and stronger unlock governance. |
| System backup | PASS | N/A | RISKY | N/A | N/A | PASS | Restore deletes/recreates tables. |

## 7. API & Service Audit

| API/Service | Trạng thái | Vấn đề | Rủi ro | Đề xuất |
| --- | --- | --- | --- | --- |
| `app/api/accounting-core/route.ts` | FAIL | No `assertAuthenticated`, no RBAC, no tenant guard. Security inventory marks risky. | Critical | Add auth, RBAC, tenant checks, audit every POST. |
| `ProjectService` | RISKY | Hard delete cascade for empty projects; `findById` uses `findUnique` without deleted/tenant filtering. | Critical | Archive-only, route-level and service-level tenant/deleted filters. |
| `CostService` | PARTIAL | Strong transaction/workflow, but fire-and-forget aggregation and event publish; AP simulation path. | High | Move side effects to durable outbox; remove simulation. |
| `RevenueService` | PARTIAL | Payment posts ledger at creation while approvalStatus is DRAFT; event publish not awaited. | High | Separate create/submit/approve/post; durable events. |
| `PaymentService` | GOOD/PARTIAL | AP payment has transaction, cap and ledger post; partial status is still simplistic. | Medium | Full partial/remaining AP aging logic. |
| `VoucherService` | GOOD/PARTIAL | Strong double-entry, SoD, period lock; uses `any`; journal lacks direct companyId. | Medium | Strong types, company-scoped voucher numbers and journal rows. |
| `FinancialAggregationService` | PARTIAL | Good sourceOfTruth docs; but read path writes WBS totals via `process.nextTick`. | High | Read APIs must not mutate DB; schedule reconciliation jobs. |
| `app/api/system/backup/route.ts` | RISKY | Restore does many `deleteMany()` calls and recreate data. | Critical | Require offline mode, dry-run, signed confirmation, backup hash, tenant isolation. |
| `app/api/reports/financial/route.ts` | PARTIAL | Uses ledger groupBy but does not filter `isPosted/isReversed` in trial balance query. | High | Only posted, unreversed, non-deleted lines in financial statements. |
| Route security inventory | FAIL | 1 risky route and several company-scoped routes lack sensitive guard. | High | Enforce `requireRouteAccess` pattern across all routes. |
| Validation scripts | FAIL | Broken import path `../generated/prisma-client`. | Medium | Fix scripts to import `../../generated/prisma-client` or package alias. |

## 8. Permission & Governance Audit

| Chức năng | Ai được làm | Ai không được làm | Đang kiểm soát đúng chưa | Đề xuất |
| --- | --- | --- | --- | --- |
| Tạo dự án | Admin/Super Admin per RBAC | Viewer/Auditor/accounting roles mostly no | PARTIAL | Good for POST; detail GET must auth/tenant. |
| Sửa dự án | Admin/Super Admin | Non-admin | PARTIAL | Service-level tenant guard needed. |
| Xóa dự án | Admin/Super Admin | Non-admin | RISKY | Remove hard delete. |
| Tạo chi phí | Kế toán tổng hợp/Admin | Viewer/Auditor | PASS/PARTIAL | Good RBAC and tenant checks. |
| Duyệt chi phí | Kế toán trưởng/Giám đốc/Admin within limit | Creator and over-limit roles | PASS/PARTIAL | Good SoD in transition; ensure UI always uses transition. |
| Ghi sổ chi phí | Kế toán tổng hợp/Admin depending matrix | Creator/unauthorized | PARTIAL | Need consistent POST flow from UI. |
| Tạo hóa đơn | Kế toán công nợ/tổng hợp/Admin | Unauthorized roles | PARTIAL | Must require accepted progress and contract where applicable. |
| Duyệt hóa đơn | Kế toán trưởng/Giám đốc/Admin | Creator/unauthorized | PARTIAL | Need SoD in invoice approval, not clearly enforced. |
| Tạo thanh toán AR/AP | Payment/accounting roles/Admin | Unauthorized roles | PARTIAL | AR uses REVENUE permission; AP uses COST UPDATE in one route. |
| Ghi sổ voucher | Kế toán trưởng/tổng hợp/Admin per RBAC | Creator alone, unapproved voucher | GOOD/PARTIAL | Voucher service checks approval audit and SoD. |
| Bỏ ghi sổ | Kế toán trưởng/Admin | Staff/viewers | PARTIAL | Needs reason required and reversal journal policy. |
| Khóa/mở kỳ | Kế toán trưởng/Giám đốc/Admin | Staff/viewers | PARTIAL | Dual period models and unlock reason consistency issue. |
| Export reports | Report-authorized roles | Unauthorized roles | PARTIAL | Export audit exists for some routes; enforce all. |
| Backup/restore | Super admin only | Everyone else | RISKY | Restore blast radius too high for normal UI. |

### Ma trận quyền rút gọn

| Chức năng | Admin | Giám đốc | Kế toán trưởng | Kế toán | Quản lý công trình |
| --- | --- | --- | --- | --- | --- |
| Xem dashboard | Yes | Yes | Yes | Yes | Limited |
| Tạo dự án | Yes | No | No | No | No |
| Tạo chứng từ | Yes | No | Limited | Yes | No |
| Duyệt chứng từ | Yes | Yes | Yes | No | No |
| Ghi sổ | Yes | No/limited | Yes | Limited | No |
| Bỏ ghi sổ | Yes | No/limited | Yes | No | No |
| Xóa dữ liệu tài chính | Risky Yes | No | No | No | No |
| Khóa kỳ | Yes | Yes | Yes | No | No |
| Xem báo cáo tài chính | Yes | Yes | Yes | Yes/limited | Limited |
| Export Excel/PDF | Yes | Yes | Yes | Yes/limited | Limited |

## 9. Reporting Accuracy Audit

| Báo cáo | Nguồn dữ liệu | Có khớp không | Vấn đề | Đề xuất |
| --- | --- | --- | --- | --- |
| Dashboard stats | `FinancialAggregationService.getCanonicalProjectFinancials` across projects | PARTIAL | Good canonical intent, but version uses `Date.now`; not stable/cache-friendly. | Use snapshot version from data max updatedAt or ledger sequence. |
| Project summary | Canonical + snapshot + cost/budget groupBy | PARTIAL | Mix ledger posted cost with cost record groupings. | Show ledger reality vs management exposure separately. |
| Trial balance | TransactionLine/LedgerAccount | PARTIAL | Some report queries omit `isPosted/isReversed` filter. | Standard ledger query helper. |
| Balance sheet | Trial balance derived | PARTIAL | Retained profit is computed ad hoc in API. | Formal closing process and account mapping. |
| VAT summary | CostRecord VAT fields | PARTIAL | Uses source cost records, not necessarily posted ledger/tax document status. | VAT report must require approved/posted tax invoices. |
| Aging AR | Invoice remaining/due date | PARTIAL | Includes status `PAID` in aging query if remaining > 0. | Tight status rules and reconciliation with 131. |
| Aging AP | CostRecord status/retention | PARTIAL | AP payment partial status simplified. | Use VendorPayment allocations and 331 ledger. |
| Contract payable | Acceptance/invoice/payment in `ConstructionAccountingService` | PARTIAL | Good warnings, but route unauthenticated and may not match ledger. | Tie to ledger and require auth. |
| WBS P&L | WBS tree aggregation | PARTIAL | Read path writes budget totals. | Make reconciliation read-only, mutations via job. |
| Reconciliation | Ledger vs subledger | PARTIAL | Exists, but not enforced as release gate. | Add automated reconciliation tests and dashboard blocking alerts. |
| Cash flow | Payment/invoice forecasts | PARTIAL | Needs distinction forecast vs posted cash ledger. | Use bank/cash accounts as actual cash source. |

## 10. MISA Gap Analysis

| Tiêu chí chuẩn MISA | Hệ thống hiện tại | Khoảng cách | Mức ưu tiên |
| --- | --- | --- | --- |
| Dữ liệu kế toán chặt chẽ | Có ledger/voucher/Decimal nhưng route và report chưa thống nhất | Thiếu enforcement end-to-end | Critical |
| Chứng từ có quy trình rõ | Voucher tốt hơn các module khác | Invoice/payment/cost chưa đồng nhất | High |
| Sổ sách liên kết báo cáo | Có ledger reports | Một số KPI dùng subledger/direct records | High |
| Drill-down chứng từ gốc | Có một phần trong contract | Dashboard/reports chưa đủ | High |
| Phân quyền rõ | RBAC matrix có | Một route critical thiếu auth; route GET detail thiếu guard | Critical |
| Khóa kỳ | Có hai mô hình period | Migration pending, inconsistent usage | High |
| In/export chuẩn | Có vài export APIs | Chưa chuẩn MISA, chưa đủ audit/export template | Medium |
| Form kế toán quen thuộc | Có form nhập | Còn alert/confirm, thiếu chứng từ chuẩn, mojibake | Medium |
| Hệ thống tài khoản | Có chart/ledger accounts | Cần COA VN đầy đủ và mapping bắt buộc | High |
| Đối chiếu số liệu | Có reconciliation service/routes | Chưa thành control bắt buộc | High |
| Audit log | Có service/model | Chưa phủ hết route, reason thiếu ở vài flow | High |
| Backup/restore | Có | Restore quá nguy hiểm trong UI thường | Critical |

## 11. Strengths

- Money fields use Prisma `Decimal @db.Decimal(18,2)` in major tables such as `Project`, `CostRecord`, `BudgetRecord`, `Invoice`, `Payment`, `JournalEntry` lines, `Contract`, and snapshots.
- Build succeeds under Next.js 16.2.4 and generates a broad app/API surface.
- `npx tsc --noEmit` passes, indicating TypeScript compilation is structurally valid despite lint debt.
- `CostService.create` uses transaction, idempotency check, WBS/project validation, period lock, audit log, and tenant propagation.
- `PaymentService.createVendorPayment` prevents overpayment and posts Dr AP / Cr Bank.
- `VoucherService.saveVoucher` enforces debit equals credit and account validity before writing lines.
- `VoucherService.approveVoucher/postVoucher` checks RBAC and segregation of duties.
- `FinancialAggregationService.getCanonicalProjectFinancials` documents KPI `sourceOfTruth` for major values.
- Soft delete exists across many financial tables.
- Route security inventory exists and can detect risky routes.

## 12. Weaknesses

- Security hole: unauthenticated accounting-core route can create sensitive accounting entities.
- Migration drift: current DB is not fully migrated.
- Lint debt is very high: 601 errors.
- Validation scripts are broken due to incorrect generated Prisma client import path.
- Project hard delete can erase financial tables for "empty" projects and relies on detection logic.
- Several UI components show static/mock-derived financial integrity status.
- Some reports and screens mix ledger/subledger/direct aggregates without a strict accounting contract.
- Fire-and-forget events/aggregations can fail silently and leave stale reports.
- JournalEntry lacks direct company scope in schema, weakening multi-company ledger governance.
- Encoding mojibake appears in many Vietnamese messages, hurting professional UX.

## 13. Critical Risks

### Critical

- `app/api/accounting-core/route.ts` lacks authentication/RBAC for financial POST actions.
- `ProjectService.delete` hard-delete branch deletes many related tables and the project itself.
- `app/api/system/backup/route.ts` restore path deletes and recreates core tables.
- Migration `20260527000100_phase2_enterprise_database` is unapplied.
- AR payment creation posts ledger while approvalStatus is still `DRAFT`.

### High

- Dashboard/report values can diverge because some use ledger while others use CostRecord/Invoice/Revenue direct sums.
- Invoice and payment schema allows optional contract linkage, creating orphan risk.
- Financial report query paths need consistent `isPosted/isReversed/deletedAt` filters.
- WBS API sampled E2E returns 404.
- Database validation scripts do not run.
- Read path writes WBS totals via `process.nextTick`.

### Medium

- Browser `alert/confirm` used in accounting screens.
- UI has static integrity indicators.
- Export/import coverage incomplete.
- Large lint debt from `any`, unused vars, React hook warnings.
- Missing `npm test` script.

### Low

- Build emits `url.parse()` deprecation warnings.
- Dashboard version strings based on `Date.now()` make every response look changed.
- Some labels/messages have encoding corruption.

## 14. Upgrade Roadmap

### Phase 1: Fix nền tảng dữ liệu và CRUD

Mục tiêu:

- Apply and verify pending migration.
- Fix validation/audit scripts import paths.
- Close `accounting-core` auth/RBAC/tenant gap.
- Remove hard-delete project path; archive-only.
- Fix WBS sampled API 404 and dashboard test contract.
- Make delete/update flows require reason for financial documents.
- Make reporting queries use a shared ledger filter helper.

### Phase 2: Chuẩn hóa nghiệp vụ kế toán

Mục tiêu:

- Separate create, submit, approve, post, reverse for invoice/payment/cost.
- Stop posting AR payment at DRAFT creation.
- Use VendorPayment for AP only, remove AP simulation.
- Add formal advance request/payment/settlement/offset.
- Consolidate `FiscalPeriod` and `AccountingPeriod`.
- Require contract/customer/supplier linkage or approved exception.

### Phase 3: Nâng cấp UI/UX giống phần mềm kế toán chuyên nghiệp

Mục tiêu:

- Replace alert/confirm with enterprise modal/toast.
- Add ledger status chips, document lifecycle timeline, reason prompts.
- Add drill-down from every KPI to voucher/contract/source document.
- Add empty/loading/error states for all tables.
- Standardize form fields for Vietnamese construction accounting.
- Fix Vietnamese encoding.

### Phase 4: Tiến gần chuẩn MISA/ERP enterprise

Mục tiêu:

- Multi-company ledger governance with company-scoped journals.
- Audited backup/restore with dry-run and immutable logs.
- Scheduled reconciliation and period-close snapshots.
- Advanced approval workflow with delegation/escalation.
- AI assistant constrained to cited accounting data.
- Import/export templates and audit-ready financial statements.

## 15. Immediate Action List

| STT | Việc cần làm | Lý do | Mức ưu tiên | File/module liên quan |
| --: | --- | --- | --- | --- |
| 1 | Add auth/RBAC/tenant guard to accounting-core | Prevent unauthenticated financial writes | Critical | `app/api/accounting-core/route.ts` |
| 2 | Apply/verify pending migration | Runtime DB may not match schema | Critical | `prisma/migrations/20260527000100_phase2_enterprise_database` |
| 3 | Remove hard-delete project path | Avoid accidental financial data deletion | Critical | `services/project.service.ts` |
| 4 | Restrict/ redesign system restore | Restore deletes whole DB tables | Critical | `app/api/system/backup/route.ts`, `/system` |
| 5 | Stop ledger posting for DRAFT AR payments | Accounting entries before approval are wrong | Critical | `services/revenue.service.ts` |
| 6 | Fix broken validation scripts | Cannot certify DB integrity | High | `scripts/validation/master-erp-validation.ts`, `scripts/audit/enterprise-audit-check.js` |
| 7 | Fix WBS API 404 in E2E | Core WBS screen/API instability | High | `app/api/wbs/route.ts`, `tests/e2e/enterprise-smoke.spec.ts` |
| 8 | Add tenant/deleted guard to project detail GET | Cross-tenant/deleted data exposure risk | High | `app/api/projects/[id]/route.ts`, `ProjectService.findById` |
| 9 | Standardize ledger report filters | Avoid including unposted/reversed entries | High | `app/api/reports/financial/route.ts`, report services |
| 10 | Remove static integrity indicators | Dashboard can falsely say synced | High | `app/components/FinancialIntegrityDashboard.tsx` |
| 11 | Replace read-path DB writes | Reads should not mutate WBS totals | High | `FinancialAggregationService.syncWBSTotalsToDB` |
| 12 | Consolidate period models | Prevent inconsistent locking | High | `FiscalPeriod`, `FiscalYear`, `AccountingPeriod` |
| 13 | Add contract-required policy | Prevent orphan invoices/payments/contracts | High | `Invoice`, `Payment`, `Contract`, services |
| 14 | Build advance module | Missing core construction accounting flow | High | New advance request/settlement module |
| 15 | Add SoD to invoice/payment approval | Creator should not approve own document | High | `RevenueService.updateInvoiceApproval`, payment approval |
| 16 | Remove AP payment simulation path | Fake accounting risk | High | `CostService.update` |
| 17 | Fix lint baseline | 601 lint errors hide real defects | Medium | whole repo |
| 18 | Add `npm test` or document absence | CI cannot run unit tests | Medium | `package.json` |
| 19 | Fix Vietnamese mojibake | Professional UX and user trust | Medium | services/API/UI text |
| 20 | Add report drill-downs | MISA-like traceability | Medium | dashboard/reports/accounting UI |


# PHASE 3A UI PILOT CLOSURE REPORT

## 1. Executive Summary

Phase 3A đã hoàn thành gói UI Pilot cho ERP kế toán xây dựng, gồm quét tiếng Việt/encoding, hardening bảng và menu thao tác, financial drilldown, visual regression, báo cáo/export/print pilot, audit log UI, approval workflow, approval inbox theo vai trò, keyboard/bulk safety và SLA/notification/delegation pilot.

Hệ thống mạnh hơn ở các điểm chính:

- UI nghiệp vụ chính đã có lớp kiểm thử smoke/visual cho dashboard, báo cáo, audit, approval inbox, print và drilldown.
- Export báo cáo pilot đi qua server-side audited export; không dùng client-side bypass cho nhóm báo cáo pilot đã làm.
- Approval inbox đã có KPI, queue theo vai trò, drawer chi tiết, guard thao tác hàng loạt, cảnh báo SLA và delegation pilot read-only.
- Report/print pilot đã có header công ty, CSS A4, audit panel và test kiểm tra CSV fallback.
- Bộ kiểm tra hiện có phân biệt rõ lỗi thật với `FLAKY_PARALLEL_TIMEOUT` khi chạy Playwright song song.

Kết luận: Phase 3A UI Pilot có thể đóng ở mức pilot/hardening, nhưng hệ thống chưa production ready và chưa nên dùng dữ liệu kế toán thật nếu chưa hoàn tất human approval, reconciliation mapping, AP Bát Tràng, CASH_BANK journal decision, backup/restore runbook và các gap kế toán còn lại.

Gate sau Phase 3A: `A. PHASE3A_UI_PILOT_COMPLETE_READY_FOR_HUMAN_APPROVAL_FOLLOWUP`.

## 2. Sprint Closure Matrix

| Sprint | Mục tiêu | Kết quả | Gate | Rủi ro còn lại |
| ------ | -------- | ------- | ---- | -------------- |
| 3A.1 | Vietnamese UI & Encoding Sweep | Đã chuẩn hóa nhiều text UI/API/export, format tiền/ngày, badge trạng thái và message nghiệp vụ trong phạm vi pilot. | Hoàn thành pilot | Vẫn còn khả năng còn text cũ ở route ngoài ma trận test; cần sweep tiếp ở hardening sau. |
| 3A.2 | Enterprise Table & Action Menu Hardening | Đã harden bảng, menu thao tác, overflow và layout cho các màn hình pilot. | Hoàn thành pilot | Chưa xác nhận toàn bộ bảng dữ liệu lớn với volume thật. |
| 3A.3 | Financial Drilldown Pilot | Đã thêm/kiểm thử drawer drilldown tài chính read-only và liên kết truy vết ở dashboard. | Hoàn thành pilot | Drilldown sâu cho Debt/Revenue/Payment/Reports vẫn cần mở rộng. |
| 3A.4 | Visual Regression & Report/Print Pilot QA | Đã có ma trận visual regression cho màn hình ERP chính và mẫu report/print pilot. | Hoàn thành pilot | Chỉ là visual pilot; chưa thay thế QA thủ công với dữ liệu thật. |
| 3A.4B | Visual Defect Fix Round | Đã sửa các lỗi visual nhỏ sau vòng QA. | Hoàn thành pilot | Một số route động vẫn cần sample an toàn để QA riêng. |
| 3A.5 | Report/Excel A4 Pilot & Print Template Hardening | Đã mở rộng catalog báo cáo, audited CSV fallback, print CSS A4 cho debt/ledger và test export/print. | Hoàn thành pilot | Chưa có Excel `.xlsx` thật; dynamic print route invoice/payment/advance/inventory chưa QA đủ. |
| 3A.6 | Audit Log UI & Approval Workflow UX | Đã bổ sung audit log UI và workflow UX read-only/guarded ở các điểm pilot. | Hoàn thành pilot | Cần mở rộng search/filter audit và chuẩn hóa workflow backend thật. |
| 3A.7 | Approval Inbox & Role-based Work Queue | Đã nâng `/approvals` thành work queue theo vai trò với KPI, tabs, drawer và action wrapper. | Hoàn thành pilot | Chưa có workflow assignment table; queue vẫn dựa trên dữ liệu hiện có. |
| 3A.8 | Keyboard Workflow & Bulk Action Safety | Đã bổ sung keyboard workflow, bulk preview guard, confirm safety và e2e tương ứng. | Hoàn thành pilot | Bulk action chưa có backend batch/job/correlation id. |
| 3A.9 | Approval SLA, Notification & Delegation Pilot | Đã thêm SLA KPI/filter/badge, notification panel pilot và delegation disabled/read-only. | READY_FOR_SPRINT_3A_10 | Notification/delegation vẫn là pilot/read-only; chưa gửi email/SMS hoặc ghi DB. |

## 3. Current System Capability

| Nhóm | Khả năng hiện tại | Ghi chú |
| ---- | ----------------- | ------- |
| UI/UX | Dashboard, reports, approvals, audit, print và các màn hình chính có smoke/visual pilot. | Tốt cho pilot nội bộ; chưa đủ kết luận production ready. |
| Reports/Print | Có report catalog, audited CSV fallback, A4 CSS cho debt/ledger và audit panel. | Cần Excel `.xlsx` thật và QA route print động. |
| Approval Workflow | Có inbox theo vai trò, drawer chi tiết, reject modal, keyboard/bulk safety, SLA và delegation pilot. | Workflow backend assignment/delegation chưa hoàn chỉnh. |
| Audit/Traceability | Có audited export pilot, audit panel và drilldown audit tab. | Cần mở rộng filter/search và đảm bảo mọi export tài chính thật đều đi qua audit. |
| Visual QA | E2E/visual matrix bao phủ core screens, theme samples, report và print pilot. | Khi chạy chung có thể gặp `FLAKY_PARALLEL_TIMEOUT` ở drilldown. |
| Security/RBAC | `npm run security-check` pass: Viewer bị chặn, Manager được phép theo guard test. | Chưa thay thế audit bảo mật đầy đủ toàn hệ thống. |
| Accounting Data Readiness | `validation:database` read-only pass với journal posted sampled balanced, không phát hiện orphan WBS sample. | Chưa apply human-approved reconciliation, chưa xử lý AP Bát Tràng/manual decisions. |

## 4. Test Summary

| Nhóm test | Kết quả | Ghi chú |
| --------- | ------- | ------- |
| `git status --short` | Pass kiểm tra hiện trạng | Có thay đổi dở đúng phạm vi 3A.8/3A.9 và report mới, không revert. |
| `git branch --show-current` | `main` | Không tạo branch/commit/push. |
| `git log -5 --oneline` | Pass | Head: `c8e8d4e app_v2_pate8`. |
| `npx prisma validate` | PASS | Không sửa Prisma schema. |
| `npx tsc --noEmit --pretty false` | PASS | Không có lỗi TypeScript mới. |
| `npm run build` | PASS | Còn warning Turbopack NFT trace tại audited export/generated Prisma và warning Node `url.parse()`. |
| `npm run validation:database` | PASS | Read-only; counts: users 2281, projects 20, costs 13, invoices 13, payments 11, journalEntries 51; unbalanced posted journals 0. |
| `npm run security-check` | PASS | Viewer blocked, Manager passed. |
| Full Playwright 3A suite chạy chung | 14 PASS / 2 FAIL timeout | Hai fail ở drilldown/audit do chờ response khi chạy song song; phân loại `FLAKY_PARALLEL_TIMEOUT`. |
| Rerun riêng `financial-drilldown-smoke` + `audit-log-ui-smoke` | PASS 3/3 | Xác nhận không tái lập lỗi chức năng khi chạy riêng. |
| `npx eslint <files touched>` | PASS | Áp dụng cho các file code/test đang thay đổi từ 3A.9. |

## 5. Safety Confirmation

Đã xác nhận trong Sprint 3A.10:

- Không sửa database.
- Không apply reconciliation mapping.
- Không chạy `apply-project-company-mapping.ts`.
- Không chạy `apply-journal-project-mapping.ts`.
- Không sửa `Project.companyId`.
- Không sửa `JournalEntry.projectId`.
- Không đánh dấu `NON_PROJECT_FINANCE`.
- Không sửa AP Bát Tràng.
- Không sửa query chính thức để cộng DRAFT.
- Không sửa ledger, posting engine, payment allocation/accounting logic hoặc report source-of-truth.
- Không sửa Prisma schema.
- Không tạo migration.
- Không reset database.
- Không sửa file trong `.local-audit-quarantine/`.
- Không commit/push.
- Không tuyên bố production ready.

## 6. Production Readiness Gap

| Gap | Mức độ | Lý do | Việc cần làm |
| --- | ------ | ----- | ------------ |
| Human approval Phase 2.8 chưa được kế toán/owner thật xác nhận | P0 | Chưa có phê duyệt cuối cho mapping và dữ liệu nhạy cảm. | Thực hiện Phase 2.9 Human Approval Follow-up. |
| 19 project/company mapping còn chờ xác nhận nếu chưa xử lý | P0 | Mapping sai có thể làm lệch báo cáo theo công ty/công trình. | Owner/kế toán xác nhận, chạy validator, chỉ apply khi PASS. |
| 25 CASH_BANK journal còn chờ quyết định | P0 | Phân loại project/non-project sai có thể làm sai cashflow và sổ cái theo công trình. | Review từng journal, ghi quyết định và audit trail. |
| AP Bát Tràng còn manual review | P0 | Rủi ro công nợ phải trả sai đối tượng/công trình. | Chốt quyết định nghiệp vụ trước khi dùng dữ liệu thật. |
| Chưa có Excel `.xlsx` thật | P1 | CSV fallback chưa đủ chuẩn in/format/phân trang như workbook kế toán. | Thêm builder `.xlsx`, test format tiền, wrap text, A4, tổng cộng. |
| Dynamic print route invoice/payment/advance/inventory chưa QA bằng sample an toàn | P1 | Mẫu in chứng từ động có thể lệch layout hoặc thiếu dữ liệu. | Sprint 3A.5B Dynamic Print QA. |
| Delegation/notification vẫn pilot/read-only | P1 | Chưa có backend thật, chưa có audit guard khi ủy quyền/thông báo. | Phase 3B workflow backend design. |
| Workflow assignment table chưa có | P1 | Queue theo vai trò chưa quản lý được assignment thực tế. | Thiết kế bảng assignment, migration ở phase riêng có approval. |
| Bulk action chưa có backend batch/job/correlation id | P1 | Bulk approval thật cần atomicity, audit correlation và retry policy. | Thiết kế batch API, job log và audit correlation id. |
| Lint/type safety toàn repo chưa sạch | P2 | Sprint 3A chỉ lint file touched; repo có thể còn debt cũ. | Sprint 3A.11 Engineering Hardening. |
| Prisma generate có thể bị Windows DLL lock | P2 | Môi trường Windows từng bị file lock; không phải lỗi nghiệp vụ. | Viết runbook và quy trình dừng process trước generate. |
| Build còn warning NFT trace/url.parse | P2 | Warning không làm fail build nhưng là debt kỹ thuật. | Scope import audited export/generated Prisma và thay `url.parse` ở phase kỹ thuật. |

## 7. Backlog Priority

| Nhóm | Việc cần làm | Ưu tiên | Ghi chú |
| ---- | ------------ | ------- | ------- |
| Must Fix Before Real Accounting Data | Human approval Phase 2.8/2.9 | P0 | Điều kiện đầu tiên trước dữ liệu thật. |
| Must Fix Before Real Accounting Data | Apply approved reconciliation mapping Phase 2.7 rerun | P0 | Chỉ chạy sau khi human approval PASS. |
| Must Fix Before Real Accounting Data | AP Bát Tràng decision | P0 | Không để công nợ nhạy cảm ở trạng thái chưa chốt. |
| Must Fix Before Real Accounting Data | Project/company scope cleanup | P0 | Chống lệch báo cáo theo công ty/công trình. |
| Must Fix Before Real Accounting Data | CASH_BANK journal project/non-project decision | P0 | Chống lệch cashflow và project financials. |
| Must Fix Before Real Accounting Data | Backup/restore runbook | P0 | Bắt buộc trước vận hành nội bộ với dữ liệu thật. |
| UI/UX Next | Audit log search/filter expansion | P1 | Giúp kế toán truy vết nhanh hơn. |
| UI/UX Next | Approval delegation backend | P1 | Chuyển pilot read-only thành workflow thật. |
| UI/UX Next | Notification backend | P1 | Cần lưu, gửi và audit thông báo thật. |
| UI/UX Next | Keyboard workflow polish | P2 | Tối ưu thao tác nhanh cho kế toán. |
| UI/UX Next | Excel `.xlsx` builder | P1 | Thay CSV fallback cho báo cáo kế toán. |
| Engineering Debt | Lint debt toàn repo | P2 | Không thuộc Phase 3A pilot nhưng cần dọn trước scale. |
| Engineering Debt | Type safety toàn repo | P2 | Giảm regression khi mở rộng workflow/report. |
| Engineering Debt | Prisma generate Windows lock runbook | P2 | Giảm lỗi vận hành local/LAN. |
| Engineering Debt | Turbopack NFT trace warning | P2 | Cần xử lý import động/fs scope. |
| Engineering Debt | `url.parse` deprecation | P2 | Cần thay WHATWG URL API. |
| Engineering Debt | E2E flaky parallel timeout | P2 | Tách nhóm drilldown hoặc thêm route wait ổn định. |
| Accounting Feature Gap | Excel A4 thật | P1 | Bắt buộc cho báo cáo in/gửi kế toán. |
| Accounting Feature Gap | Print template đầy đủ | P1 | Cần đủ invoice/payment/advance/inventory. |
| Accounting Feature Gap | Drilldown sâu cho Debt/Revenue/Payment/Reports | P1 | Cần truy về chứng từ gốc đầy đủ hơn. |
| Accounting Feature Gap | Approval SLA config theo công ty | P2 | SLA hiện là policy pilot cố định. |
| Accounting Feature Gap | Workflow assignment table | P1 | Nền tảng cho phê duyệt thực tế. |
| Accounting Feature Gap | Bulk approval backend with audit correlation | P1 | Nền tảng cho duyệt hàng loạt an toàn. |

## 8. Recommended Next Step

Khuyến nghị ưu tiên: `A. Phase 2.9 Human Approval Follow-up`.

Lý do: Phase 3A đã đạt mục tiêu UI pilot, nhưng blocker lớn nhất trước khi dùng dữ liệu thật không còn nằm ở UI. Rủi ro cao nhất hiện là dữ liệu và quyết định kế toán: human approval Phase 2.8, project/company mapping, CASH_BANK journal, AP Bát Tràng và reconciliation apply readiness. Nếu mục tiêu là vận hành thật, cần hoàn tất Phase 2.9 trước khi tiếp tục mở rộng UI hoặc workflow backend.

Các hướng còn lại nên xếp sau:

- `B. Sprint 3A.11 Engineering Hardening`: làm sau khi muốn giảm debt lint/type/build warning.
- `C. Sprint 3A.5B Dynamic Print QA`: làm khi ưu tiên chứng từ in/Excel.
- `D. Phase 3B Workflow Backend Design`: làm khi dữ liệu nền và approval package đã được chốt.

## 9. Decision Gate

`A. PHASE3A_UI_PILOT_COMPLETE_READY_FOR_HUMAN_APPROVAL_FOLLOWUP`

Không production ready. Hệ thống chỉ sẵn sàng chuyển sang bước human approval follow-up và hardening có kiểm soát.

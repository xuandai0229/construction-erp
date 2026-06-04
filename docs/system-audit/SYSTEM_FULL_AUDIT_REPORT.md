# SYSTEM FULL AUDIT REPORT

Ngày kiểm tra: 2026-06-01  
Phạm vi: Next.js App Router, API routes, services, Prisma schema, UI, báo cáo, bảo mật, audit, hiệu năng, offline nội bộ, dữ liệu DB hiện có.  
Nguyên tắc: Không sửa business logic, không migration, không đổi schema. `npx prisma db pull` được chạy ở chế độ `--print` để không ghi đè `prisma/schema.prisma`.

## 1. Executive Summary

Hệ thống đã có nền tảng ERP kế toán xây dựng khá rộng: App Router, Prisma/PostgreSQL, RBAC, audit log, double-entry ledger, approval workflow, tạm ứng/hoàn ứng, hợp đồng, hóa đơn, thanh toán, kho, thuế VAT, báo cáo quản trị và export. Build production hiện pass, smoke E2E pass, Prisma schema hợp lệ, và dữ liệu hiện tại không phát hiện bút toán mất cân đối trong các script đã chạy.

Tuy nhiên hệ thống chưa đủ tin cậy để nhập liệu kế toán thật nếu chưa khóa các rủi ro P0/P1. Rủi ro lớn nhất là sai số kế toán do một số luồng báo cáo và thanh toán vẫn dùng bảng nghiệp vụ/DRAFT thay vì ledger hoặc chứng từ đã duyệt, kiểm soát kỳ kế toán khi post dùng ngày hiện tại thay vì ngày chứng từ, export báo cáo vẫn có đường client-side có thể tải file dù audit log thất bại, và UI/lỗi tiếng Việt bị lỗi encoding ở nhiều file.

Nên sửa ngay Phase 1: data integrity, period lock, payment allocation/idempotency, source of truth ledger, audit-export bắt buộc server-side, rồi mới mở rộng UI/Excel.

## 2. Overall Scorecard

| Nhóm kiểm tra | Điểm | Trạng thái | Nhận xét ngắn |
| --- | ---: | --- | --- |
| Kiến trúc | 7 | Khá | Có service layer/RBAC/audit, nhưng còn song song `app/services`, `services`, `lib`, `experimental` và logic tính toán phân tán. |
| Database | 7 | Khá | Schema rộng, Decimal đúng, nhiều index; còn thiếu một số unique/constraint nghiệp vụ và soft-delete uniqueness có rủi ro PostgreSQL null. |
| Nghiệp vụ kế toán xây dựng | 6 | Chưa khóa | Có WBS, hợp đồng, hóa đơn, payment, advance, ledger; một số luồng vẫn chưa bắt buộc chứng từ gốc/approved/posted nhất quán. |
| API/backend | 7 | Khá | 138/141 route có auth/permission pattern; response format chưa đồng nhất hoàn toàn, nhiều lỗi tiếng Anh/encoding. |
| Frontend/UI | 5 | Trung bình | Smoke render pass, nhưng tiếng Việt lỗi encoding, còn text Anh, action menu không portal, export client-side. |
| Báo cáo | 5 | Rủi ro | Có báo cáo quản trị/ledger/export, nhưng một số báo cáo dùng bảng nghiệp vụ không phải ledger và audit export có thể bypass. |
| Bảo mật/RBAC | 7 | Khá | RBAC khá đầy đủ; dev session route chỉ chặn production, UI menu vẫn là convenience guard, không thay thế API guard. |
| Audit log | 6 | Chưa đủ | Có AuditLog và export audit server-side; một số thao tác client export/log fire-and-forget, một số log dùng `SECURITY_ALERT` chưa đúng semantics. |
| Hiệu năng | 6 | Trung bình | Build pass; có cache 15s và pagination một phần; còn N+1 dashboard project summaries, build warning NFT trace, log spam CQRS. |
| Offline nội bộ | 7 | Khá | Không thấy CDN bắt buộc; PostgreSQL local phù hợp; Redis có fallback nhưng cần đánh giá an toàn khi multi-process. |
| Khả năng mở rộng | 6 | Trung bình | Domain rộng nhưng còn nhiều module thử nghiệm, lint fail 814 lỗi, thiếu `typecheck`/`test` script chuẩn. |

## 3. Strengths - Điểm mạnh

- `prisma/schema.prisma`: mô hình dữ liệu phủ rộng ERP xây dựng: `Project`, `WBSItem`, `BudgetRecord`, `CostRecord`, `Contract`, `Invoice`, `Payment`, `JournalEntry`, `TransactionLine`, `Supplier`, `AdvanceRequest`, `AdvanceSettlement`, `CashBankDocument`, `TaxInvoice`, `InventoryDocument`.
- `lib/accounting/postingEngine.ts:193`: có lõi double-entry, kiểm tra `Debit = Credit` tại `lib/accounting/postingEngine.ts:215-220`, tạo `JournalEntry`/`TransactionLine`, chống post trùng theo `sourceType/sourceId` tại `lib/accounting/postingEngine.ts:206-211`.
- `services/cost.service.ts`: luồng cost có idempotency `requestId`, optimistic locking `version`, period lock, audit log, SoD không tự duyệt tại `services/cost.service.ts:339-356`.
- `lib/route-security.ts`: có `requireAuth`, `requirePermission`, `requireCompanyScope`, `requireProjectAccess`, `auditExportOrThrow`.
- `services/project.service.ts:230-284`: xóa project đã được chuyển sang soft archive và block nếu có dữ liệu liên quan, tránh cascade mất dữ liệu kế toán.
- Kiểm thử thực tế: `npm run build` pass, `npx prisma validate` pass, `npx prisma generate` pass, Playwright smoke `tests/e2e/enterprise-smoke.spec.ts` pass 3/3, `npm run security-check` pass, `npm run validation:database` không thấy bút toán lệch trong sample.

## 4. Weaknesses - Điểm yếu

- Tiếng Việt bị lỗi encoding ở nhiều file: `lib/api-error.ts`, `lib/validations.ts`, `services/cost.service.ts`, `services/revenue.service.ts`, `app/components/layout/EnterpriseSidebar.tsx`, `app/components/ui-enterprise/EnterpriseDataTable.tsx`. Ảnh hưởng trực tiếp UI, báo lỗi API và tính pháp lý của chứng từ.
- Lint fail rất rộng: `npm run lint` báo 1079 vấn đề, gồm 814 errors và 265 warnings. Ví dụ `app/approvals/page.tsx:101` lỗi React `set-state-in-effect`, nhiều `any`, `require()`, unused vars.
- `package.json` không có `typecheck` và `test`; `npm run typecheck` và `npm test` đều fail do missing script.
- Báo cáo và dashboard vẫn có nhiều source of truth: `FinancialAggregationService.getCanonicalProjectFinancials` dùng ledger, nhưng `getProjectMonthlyReport` dùng `CostRecord`, `Invoice`, `Payment` không rejected tại `services/financial-aggregation.service.ts:582-585`.
- Export báo cáo ở `app/reports/page.tsx:115-137` gọi `/api/reports/audit-export` dạng fire-and-forget rồi vẫn tải CSV bằng `exportToCsv`; nếu audit thất bại, file vẫn tải.
- `EnterpriseActionMenu` dùng absolute dropdown trong table tại `app/components/ui-enterprise/EnterpriseActionMenu.tsx:51-53`, không portal, rủi ro bị clipping trong container `overflow-x-auto`.
- Build warning NFT trace: `generated/prisma-client/index.js` bị trace qua `app/api/revenues/route.ts`, có thể làm bundle/server trace quá rộng.
- Build log spam: nhiều dòng `[CQRS Projector] Initializing event subscribers...` trong giai đoạn static generation, rủi ro side effect khi import module server.

## 5. Critical Issues - Lỗi nghiêm trọng cần sửa ngay

| ID | Vấn đề | Vị trí | Mức độ | Ảnh hưởng | Cách xử lý đề xuất |
| -- | ------ | ------ | ------ | --------- | ------------------ |
| P0-01 | Ghi sổ kiểm tra kỳ khóa bằng ngày hiện tại, không phải ngày chứng từ | `lib/accounting/postingEngine.ts:203`, `:276` | P0 | Có thể post/hủy chứng từ thuộc kỳ đã khóa nếu thao tác hôm nay ở kỳ mở; sai sổ cái. | Truyền `accountingDate/documentDate` vào `createDoubleEntry` và `reverseJournal`; kiểm tra kỳ theo ngày chứng từ hoặc kỳ đảo bút toán có policy rõ. |
| P0-02 | Tạo payment sinh `Revenue` ngay khi payment còn DRAFT | `services/revenue.service.ts:168-182` | P0 | Dashboard/báo cáo dùng bảng `Revenue` có thể ghi nhận tiền/doanh thu chưa duyệt. | Không tạo `Revenue` ở DRAFT; chỉ cập nhật operational cash/revenue sau `APPROVED/POSTED`, hoặc bỏ bảng `Revenue` khỏi source of truth. |
| P0-03 | Báo cáo tháng dùng bảng nghiệp vụ chưa rejected thay vì ledger/posted | `services/financial-aggregation.service.ts:582-585` | P0 | DRAFT/PENDING invoice/cost/payment có thể đi vào báo cáo doanh thu, chi phí, cashflow; sai lãi/lỗ. | Chuẩn hóa báo cáo quản trị lấy từ ledger posted hoặc filter `APPROVED/POSTED`, đồng bộ với `sourceOfTruth` tại `:160-171`. |
| P0-04 | Payment có rủi ro double submit/overpay DRAFT vì check chỉ tính allocation ACTIVE | `services/revenue.service.ts:148-153`, `:169-177` | P0 | Nhiều payment DRAFT cùng lúc có thể vượt giá trị hóa đơn, sau đó duyệt gây lệch công nợ. | Bắt buộc `requestId` cho payment, dùng transaction isolation/row lock, tính cả DRAFT/PENDING theo policy hoặc reserve amount. |
| P1-01 | Client export tải file dù audit log thất bại | `app/reports/page.tsx:115-137`, `app/services/export.service.ts:46-55` | P1 | Người dùng có thể xuất báo cáo tài chính không có log kiểm toán. | Chuyển tất cả export tài chính sang `/api/reports/audited-export`; chỉ tải file sau khi audit server-side thành công. |
| P1-02 | UI/API tiếng Việt lỗi encoding | Nhiều file nêu ở mục 4 | P1 | Người dùng kế toán không đọc được cảnh báo, form, menu; giảm tin cậy và dễ thao tác sai. | Chuẩn hóa UTF-8, sửa mojibake, thêm kiểm tra CI chống ký tự lỗi `Ã`, `Ä`, `â`. |
| P1-03 | `JournalEntry` unique theo `[sourceType, sourceId, deletedAt]` với `deletedAt = null` | `prisma/schema.prisma:372` | P1 | PostgreSQL coi NULL là distinct; unique này không chắc chặn duplicate active entry ở DB. | Thêm partial unique index SQL cho active rows hoặc dùng key `activeSourceKey`. |
| P1-04 | `FiscalPeriod` legacy theo `month` global, `AccountingPeriod` theo company cùng tồn tại | `prisma/schema.prisma:715`, `:1548`; `lib/period.ts`; `services/finance/accounting-governance.ts` | P1 | Khóa kỳ có thể lệch giữa công ty/kỳ nếu module dùng legacy và module dùng model mới. | Chọn một period authority theo company/fiscal year; legacy chỉ readonly/backward compatibility. |
| P1-05 | `RevenueService.findRevenuesByProject` không nhận `companyId` | `services/revenue.service.ts:240-248` | P1 | Nếu route gọi trực tiếp không lọc tenant, có rủi ro lộ dữ liệu cross-company theo projectId. | Bắt buộc `companyId`/`requireProjectAccess` cho mọi query theo project. |
| P1-06 | Lint fail 814 errors | `npm run lint` | P1 | Không thể dùng lint làm quality gate; lỗi React hook có thể gây render cascade. | Tách baseline lint, sửa errors theo module ưu tiên accounting/API. |
| P1-07 | App có route dev session cấp token theo role khi không production | `app/api/auth/session/route.ts:15-31` | P1 | Nếu môi trường staging/internal chạy `NODE_ENV` không phải production, có thể bootstrap super admin. | Chỉ bật khi `ALLOW_DEV_SESSION=true`, audit, chặn theo host/IP hoặc bỏ khỏi build production. |
| P1-08 | Restore system route có đường xóa nhiều bảng nếu env bật | `app/api/system/backup/route.ts:201-239` | P1 | Sai cấu hình env có thể gây mất dữ liệu hàng loạt. | Giữ super admin + token, thêm two-person approval, backup immutable, dry-run default, không expose trong LAN thường. |
| P2-01 | Action menu không portal | `app/components/ui-enterprise/EnterpriseActionMenu.tsx:51-53` | P2 | Menu dễ bị che/clipping trong bảng nhiều cột. | Dùng `PortalOverlay` hoặc floating-ui, tính viewport collision. |
| P2-02 | Dashboard global N+1 canonical summaries | `app/api/dashboard/stats/route.ts` gọi `Promise.all(projectIds.map(...))` | P2 | 20 project hiện ổn, nhưng 100+ project sẽ chậm và spam query ledger. | Aggregate theo SQL/groupBy theo project hoặc materialized snapshot. |
| P2-03 | Cache 15s cho số liệu kế toán | `services/financial-aggregation.service.ts:250`, `:342`, `:739` | P2 | Người dùng có thể thấy số liệu cũ sau duyệt/ghi sổ nếu invalidation thiếu. | Cache theo event invalidation bắt buộc; số liệu posted dùng no-store hoặc versioned cache. |
| P2-04 | `formatShortVND` dùng B/M/K | `app/utils/format.ts:45-57` | P2 | Không đúng ưu tiên tiếng Việt/kế toán, dễ hiểu sai đơn vị. | Dùng `tỷ/triệu/nghìn` hoặc luôn hiển thị `5.000.000.000 đ`. |
| P2-05 | Export CSV chưa đạt Excel/PDF A4 | `app/services/export.service.ts`, `app/api/reports/audited-export/route.ts` | P2 | Thiếu header công ty, số trang, lặp header in, wrap text, tổng cộng chuẩn A4. | Tạo export Excel server-side bằng template, có metadata công ty và audit bắt buộc. |
| P2-06 | Build warning NFT trace | Output `npm run build` | P2 | Deploy có thể trace quá nhiều file, tăng kích thước/latency/rủi ro lộ file không cần thiết. | Xác định import dynamic trong Prisma client/api route, cấu hình output tracing hoặc tách server-only. |
| P2-07 | CQRS projector init nhiều lần trong build | Output `npm run build` | P2 | Import side effect không kiểm soát, log spam, có thể đăng ký event listener lặp. | Lazy-init theo runtime request/worker, guard singleton mạnh hơn. |
| P2-08 | Redis fallback memory lock trong queue | `services/queue/resilient-queue.service.ts` | P2 | Chạy nhiều process/LAN có thể xử lý trùng job nếu Redis lỗi. | Khi Redis down, chỉ cho single-worker mode hoặc dùng DB advisory lock. |
| P3-01 | Response error/message chưa 100% tiếng Việt | `lib/api-error.ts`, nhiều route có `Missing`, `Project not found` | P3 | UX không đồng nhất. | Chuẩn hóa error dictionary tiếng Việt. |
| P3-02 | Có `experimental/` rất lớn | `experimental/services`, `experimental/components` | P3 | Tăng nhiễu kiến trúc, dễ import nhầm. | Đánh dấu deprecated hoặc chuyển ra archive nếu không dùng. |
| P3-03 | `npx prisma db pull --print` cảnh báo check constraints Prisma không hỗ trợ | Output Prisma | P3 | Logic check ở DB không được Prisma client type hóa. | Ghi rõ constraints trong docs và test DB-level. |
| P3-04 | `.env` và `.env.local` tồn tại trong workspace | Root `.env`, `.env.local` | P3 | Không thấy tracked bởi `git ls-files`, nhưng vẫn rủi ro backup/chia sẻ máy. | Kiểm tra secret hygiene, chỉ dùng `.env.example` trong repo. |
| P3-05 | Không có script backup/restore vận hành chuẩn ngoài API | `app/api/system/backup/route.ts`, `infra/` | P3 | Vận hành LAN phụ thuộc thao tác admin app. | Viết runbook backup PostgreSQL, restore offline, kiểm thử định kỳ. |
| P3-06 | `PaymentStatus` chỉ `paid/unpaid` | `prisma/schema.prisma` enum | P3 | Trạng thái tiền mặt/nghiệp vụ nghèo hơn lifecycle chứng từ. | Chuẩn hóa lifecycle thanh toán: DRAFT/SUBMITTED/APPROVED/POSTED/REVERSED/CANCELLED ở document layer. |

Tổng phân loại: P0 = 4, P1 = 8, P2 = 8, P3 = 6.

## 6. Business Accounting Risks

- Sai doanh thu: `createPayment` tạo record `Revenue` ở trạng thái DRAFT payment (`services/revenue.service.ts:182`); monthly report cộng invoice không rejected thay vì ledger posted (`services/financial-aggregation.service.ts:582-585`).
- Sai chi phí: một số báo cáo dùng `CostRecord` không rejected, không nhất thiết đã posted. Actual cost theo accrual nên lấy chứng từ đã duyệt/ghi sổ theo policy rõ.
- Sai công nợ: payment DRAFT không reserve đầy đủ, check `activeRemaining` chỉ tính ACTIVE allocation (`services/revenue.service.ts:148-153`).
- Sai tạm ứng/hoàn ứng: schema có `AdvanceRequest`/`AdvanceSettlement`, service có policy, nhưng `services/advance.service.ts` có comment mock period lock; cần khóa thật theo kỳ/company.
- Sai lãi/lỗ công trình: dashboard canonical ledger tốt hơn, nhưng monthly/report/export có thể dùng nguồn khác.
- Sai ledger: dữ liệu hiện tại pass `verify-ledger-integrity` với unbalanced 0/orphan lines 0, nhưng unique DB active journal chưa chắc chắn do NULL.
- Không truy chứng từ gốc đầy đủ: `JournalEntry` có `sourceType/sourceId`; UI có financial trace routes cho invoice/payment/contract. Cần bắt buộc source doc cho mọi posting và hiển thị drilldown ở mọi số liệu.
- Không khóa kỳ chắc chắn: `PostingEngine` đang check `new Date()` khi post/reverse thay vì ngày chứng từ.
- Không lưu vết sửa/xóa hoàn toàn: có `AuditLog`, nhưng export client-side và một số helper client có thể bypass log.

## 7. UI/UX Findings

Dashboard:
- Tốt: smoke E2E render pass, `/api/dashboard/stats` có tenant filter và canonical summaries.
- Vấn đề: global dashboard có N+1 summary và text reconciliation không dấu `"Can doi soat du lieu"` tại `services/financial-aggregation.service.ts:211`.
- Mức độ: P2.
- Đề xuất: aggregate theo project bằng SQL/materialized snapshot, chuẩn hóa tiếng Việt.

Projects:
- Tốt: RBAC read/create, pagination, soft delete block khi có dữ liệu liên quan.
- Vấn đề: một số lỗi API tiếng Việt mojibake trong service; `orderBy/orderDir` ép `any`.
- Mức độ: P1/P3.
- Đề xuất: sửa encoding, type-safe query params.

WBS:
- Tốt: WBS nhiều cấp, roll-up, virtual orphan node trong `getWBSAggregation`.
- Vấn đề: export WBS client-side bằng Blob tại `app/wbs/WBSListScreen.tsx:74-78`, không audit.
- Mức độ: P2.
- Đề xuất: export server-side có audit nếu chứa số liệu tài chính.

Budget:
- Tốt: có `BudgetRecord` theo WBS/costType.
- Vấn đề: `BudgetRecord` không unique theo `(projectId,wbsId,costType,deletedAt)` nên dễ nhiều dòng dự toán cùng hạng mục/loại nếu không có version policy.
- Mức độ: P1.
- Đề xuất: thiết kế BudgetVersion/line hoặc unique active budget per WBS/costType.

Costs:
- Tốt: workflow DRAFT/APPROVED/POSTED, SoD, period lock, posting engine.
- Vấn đề: nhiều `Number()`/round trong tiền; AP payment simulation còn tồn tại trong `services/cost.service.ts`.
- Mức độ: P1/P2.
- Đề xuất: dùng Decimal end-to-end; tách AP payment document thật.

Revenue:
- Tốt: invoice có VAT/retention/dueDate/contractId.
- Vấn đề: payment DRAFT tạo revenue operational; invoice approval post ledger nhưng SoD không thấy ở `updateInvoiceApproval`.
- Mức độ: P0/P1.
- Đề xuất: chỉ ghi nhận revenue/cash khi approved/posted và áp SoD.

Debt:
- Tốt: có aging service và management debt report.
- Vấn đề: source AR/AP lẫn ledger và operational remaining; cần reconciliation bắt buộc trước khi hiển thị số chính thức.
- Mức độ: P1.
- Đề xuất: debt report chính lấy ledger 131/331, operational chỉ là đối chiếu.

Reports:
- Tốt: có audited export endpoint server-side.
- Vấn đề: page reports vẫn export client-side sau audit fire-and-forget.
- Mức độ: P1.
- Đề xuất: bỏ `exportToCsv` cho báo cáo tài chính; dùng `/api/reports/audited-export`.

## 8. Data Integrity Findings

- Dữ liệu DB hiện tại theo `npm run validation:database`: users 2281, companies 49, projects 20, wbs 11, costs 14, invoices 13, payments 11, revenues 0, contracts 23, journalEntries 51, transactionLines 128.
- Integrity script: sampled posted journal entries 42, unbalanced posted journal entries 0, orphan cost WBS 0, orphan invoice WBS 0, draft posted payments 0.
- `npx tsx scripts/audit/verify-ledger-integrity.ts`: Unbalanced 0, Orphan Lines 0.
- `scripts/audit/phase4a-data-integrity-audit.ts`: tổng lỗi 0, critical/high/medium/low đều 0.
- Rủi ro còn lại nằm ở code path tương lai, không phải dữ liệu hiện có: period lock theo ngày hiện tại, payment DRAFT/revenue, report source of truth, unique NULL.
- Dashboard canonical có khai báo source of truth tại `services/financial-aggregation.service.ts:160-171`, nhưng monthly report và export vẫn chưa nhất quán.

## 9. Security/RBAC/Audit Findings

- API auth coverage tốt: quét route cho thấy 138 route có pattern auth/permission; 3 route không có auth là `app/api/auth/session/route.ts`, `app/api/health/route.ts`, `app/api/readiness/route.ts`.
- `npm run security-check` pass: Viewer bị chặn, Manager qua guard theo script.
- Playwright test `unauthenticated mutations are rejected by proxy` pass với `/api/projects` trả 401.
- RBAC matrix có vai trò kế toán công nợ, kế toán thanh toán, kế toán tổng hợp, kế toán trưởng, giám đốc, ban kiểm soát, quản trị hệ thống.
- Rủi ro: dev session route cấp token trong non-production (`app/api/auth/session/route.ts:8-31`); cần env flag riêng.
- Audit export server-side có `auditExportOrThrow`, nhưng client page reports không chờ audit thành công.
- Audit log có user/action/entity/entityId/oldData/newData/ip/userAgent ở nhiều service, nhưng một số log dùng action `SECURITY_ALERT` cho export, chưa đúng phân loại nghiệp vụ.

## 10. Performance/Offline Findings

Kết quả lệnh:
- `git status`: branch `main`, có nhiều file dirty trước audit; sau audit chỉ thêm báo cáo mới, các file generated do Prisma generate đã được hoàn tác.
- `npm run build`: pass. Warning: NFT trace quá rộng qua `generated/prisma-client/index.js` và `app/api/revenues/route.ts`; nhiều deprecation warning `url.parse()`.
- `npm run lint`: fail 1079 problems, 814 errors, 265 warnings.
- `npm run typecheck`: fail vì thiếu script.
- `npm test`: fail vì thiếu script.
- `npx prisma validate`: pass.
- `npx prisma generate`: pass; có cảnh báo Prisma 5.22.0 -> 7.8.0.
- `npx prisma db pull --print`: pass, không ghi file; cảnh báo Prisma không hỗ trợ check constraints cho `CostRecord`, `Invoice`, `InventoryTransaction`.
- `npm run validation:check`: pass 12/13, warning Playwright browsers may need installation.
- `npm run validation:database`: pass read-only, không thấy sai lệch sample.
- `npm run e2e -- tests/e2e/enterprise-smoke.spec.ts`: pass 3/3.

Offline nội bộ:
- Không thấy CDN/font/script internet bắt buộc trong `app`, `public`, `services`, `lib`; có fallback Supabase mock ở `lib/supabase.ts`.
- PostgreSQL local phù hợp cho 3-10 máy nếu backup/connection pool được cấu hình.
- Redis fallback memory lock có rủi ro khi chạy nhiều process nếu Redis down.
- Build dùng `.env.local`, `.env`; cần tài liệu vận hành LAN, backup/restore và secret rotation.

## 11. Improvement Roadmap

### Phase 1 - Sửa lỗi nền tảng nghiêm trọng

Mục tiêu:
- Không sai số liệu.
- Không mất dữ liệu.
- Không xóa thiếu audit.
- Không ghi sổ sai.

Danh sách việc cần làm:
1. Sửa `PostingEngine` dùng ngày chứng từ/kỳ kế toán đúng khi post/reverse.
2. Sửa payment allocation: bắt buộc idempotency, reserve DRAFT/PENDING, chống concurrent overpay.
3. Bỏ tạo `Revenue` khi payment còn DRAFT; chỉ ghi nhận sau approved/posted.
4. Chuẩn hóa report chính theo ledger posted; bảng nghiệp vụ chỉ dùng reconciliation.
5. Bắt buộc export tài chính server-side audited, bỏ client export bypass.
6. Thêm DB partial unique index chống duplicate active `JournalEntry`.

### Phase 2 - Chuẩn hóa nghiệp vụ kế toán xây dựng

Mục tiêu:
- Chuẩn hợp đồng/NCC/công trình/WBS.
- Chuẩn tạm ứng/thanh toán/đối trừ.
- Chuẩn ledger.
- Chuẩn công nợ.

Danh sách việc cần làm:
1. Chọn một period authority theo company/fiscal year, legacy fiscal period chỉ readonly.
2. Chuẩn hóa BudgetVersion và unique active budget theo WBS/costType.
3. Bắt buộc source document cho mọi invoice/payment/cost/posting.
4. Hoàn thiện AP payment document thay cho simulation.
5. Chuẩn hóa AR/AP ledger 131/331 và reconciliation với operational tables.
6. Hoàn thiện tạm ứng/hoàn ứng/đối trừ theo supplier/employee/contract.

### Phase 3 - Nâng cấp UI/UX kiểu phần mềm kế toán chuyên nghiệp

Mục tiêu:
- Bảng đẹp, thẳng hàng.
- Inline edit hợp lý.
- Click số liệu mở chứng từ gốc.
- Dark/light ổn định.
- Trải nghiệm gần MISA/FAST hơn.

Danh sách việc cần làm:
1. Sửa toàn bộ encoding tiếng Việt và loại bỏ text Anh trong UI/API.
2. Dùng portal cho action menu/dropdown trong bảng.
3. Chuẩn hóa money/date/status badge toàn app.
4. Thêm drilldown từ dashboard/report/debt về chứng từ gốc.
5. Kiểm visual bằng Playwright screenshot desktop/mobile.

### Phase 4 - Báo cáo, Excel A4 và vận hành nội bộ

Mục tiêu:
- Báo cáo đủ cho giám đốc/kế toán.
- Export Excel in được.
- Log xuất báo cáo.
- Chạy offline LAN ổn định.

Danh sách việc cần làm:
1. Xây Excel server-side có header công ty `CÔNG TY CP THƯƠNG MẠI VÀ XÂY DỰNG SỐ 2 HN`.
2. Template A4: số trang, wrap text, repeat header, tổng cộng cuối bảng.
3. Log mọi export với user/IP/máy/reportType/filter.
4. Tài liệu deploy LAN, PostgreSQL backup/restore, restore drill.
5. Redis/queue mode an toàn khi offline hoặc Redis down.

### Phase 5 - Khóa cứng hệ thống trước khi dùng dữ liệu thật

Mục tiêu:
- Test đầy đủ.
- Backup/restore.
- Phân quyền.
- Tài liệu vận hành.
- Quy trình nhập liệu thật.

Danh sách việc cần làm:
1. Thêm `typecheck`, `test`, `test:integration`, `test:e2e`, `prisma:validate` vào CI.
2. Giảm lint về 0 errors ở modules accounting/API.
3. Viết UAT end-to-end: công trình -> NCC -> hợp đồng -> WBS -> budget -> cost -> approval -> post -> invoice -> payment -> advance -> settlement -> report -> export.
4. Backup/restore rehearsal trên DB copy.
5. Đóng dev session route và internal bypass trước production.

## 12. Recommended Next Prompts

- Prompt sửa P0 data integrity: period lock, payment allocation, DRAFT revenue, ledger source of truth.
- Prompt chuẩn hóa hợp đồng - nhà cung cấp - công trình - WBS và source document trace.
- Prompt nâng cấp báo cáo tạm ứng/thanh toán/hoàn ứng/đối trừ có Excel A4.
- Prompt sửa toàn bộ lỗi tiếng Việt/encoding UI/API.
- Prompt khóa audit log và export server-side bắt buộc.
- Prompt hardening RBAC/session/internal restore trước khi dùng dữ liệu thật.
- Prompt giảm lint/typecheck và thêm CI validation.

## 13. Final Conclusion

Hệ thống hiện tại có thể dùng để demo nội bộ, kiểm thử nghiệp vụ, và chạy pilot với dữ liệu giả/copy có giám sát. Chưa nên dùng làm sổ kế toán thật cho công trình nếu chưa sửa P0/P1, vì một số code path có thể ghi nhận doanh thu/thanh toán/báo cáo sai hoặc bypass audit export.

Việc phải làm trước tiên là Phase 1: khóa đúng kỳ kế toán, chống overpay/double submit payment, bỏ DRAFT revenue, thống nhất báo cáo theo ledger posted, và bắt buộc audited export. Sau đó mới chuẩn hóa nghiệp vụ nâng cao, UI/UX, Excel A4 và vận hành LAN.

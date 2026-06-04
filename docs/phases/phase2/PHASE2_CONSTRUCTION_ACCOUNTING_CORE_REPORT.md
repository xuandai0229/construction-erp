# PHASE2 CONSTRUCTION ACCOUNTING CORE REPORT

Ngày hoàn thành: 2026-06-01

## 1. Executive Summary

Phase 2 đã tập trung vào chuẩn hóa lõi nghiệp vụ kế toán xây dựng sau Phase 1: truy vết chứng từ gốc, liên kết công trình - hợp đồng - nhà cung cấp - WBS, đối chiếu AR/AP giữa ledger và bảng nghiệp vụ, kiểm soát export tài chính qua audit server-side, và bổ sung script kiểm chứng đọc dữ liệu.

Hệ thống hiện đã có lớp trace server-side để từ số liệu tài chính truy về chứng từ nguồn, công trình, hợp đồng, nhà cung cấp, WBS, bút toán và audit log. Các màn hình export tài chính rủi ro cao đã chuyển sang `/api/reports/audited-export`; tuy nhiên các trang in chứng từ `app/print/*` vẫn còn `window.print` client-side chưa audit server-side.

Không có migration/schema mới trong Phase 2. Các phát hiện dữ liệu còn lại cần xử lý bằng backfill/đối soát có kiểm soát: 19 công trình thiếu `companyId`, 17 journal posted thiếu `projectId`, và 1 công trình lệch AP giữa ledger và operational.

## 2. Scope Completed

| Nhóm | Trạng thái | File chính | Ghi chú |
| --- | --- | --- | --- |
| Source document trace | Hoàn thành | `lib/accounting/financialTrace.ts` | Trace COST, INVOICE, PAYMENT, ADVANCE, ADVANCE_SETTLEMENT, CONTRACT, SUPPLIER, WBS |
| Trace API | Hoàn thành | `app/api/trace/*/route.ts` | Thêm trace theo source, project, contract, supplier, WBS, AR/AP reconciliation |
| Export tài chính audited | Hoàn thành một phần | `app/api/reports/audited-export/route.ts` | Bổ sung COSTS, BUDGET, REVENUE_OPERATIONAL |
| UI export chính | Hoàn thành một phần | `app/costs/page.tsx`, `app/budget/page.tsx`, `app/debt/page.tsx`, `app/revenue/page.tsx`, `app/accounting/page.tsx` | Chuyển từ `exportToCsv` sang `auditedCsvExport` |
| Validation scripts | Hoàn thành | `scripts/validation/verify-*.ts` | 5 script Phase 2 đã chạy |
| Export/print audit matrix | Hoàn thành | `EXPORT_PRINT_AUDIT_MATRIX.md` | Có danh sách đường còn bypass audit |

## 3. Data Model Changes

Không thay đổi Prisma schema trong Phase 2.

Không tạo migration mới trong Phase 2.

Không xóa dữ liệu, không reset database, không đổi business logic ghi sổ của Phase 1.

Lý do không thêm schema ở Phase 2: các quan hệ cần kiểm tra đã tồn tại đủ để trace bằng dữ liệu hiện có. Những thiếu sót phát hiện là vấn đề dữ liệu cũ/backfill, không cần phá schema ngay trong phase này.

## 4. Accounting Policy

Sau Phase 2, policy được thể hiện rõ hơn ở code/export:

| Số liệu | Chính thức | Preview/operational |
| --- | --- | --- |
| Chi phí | Ưu tiên ledger posted; nếu dùng bảng nghiệp vụ phải là chứng từ approved/posted theo policy Phase 1 | Cost records theo trạng thái nghiệp vụ, dùng cho màn hình vận hành |
| Doanh thu | Ledger posted là nguồn chính thức | `REVENUE_OPERATIONAL` là legacy/operational, không dùng làm báo cáo tài chính chính thức |
| Cashflow/thanh toán | Ledger posted hoặc payment approved/posted theo policy Phase 1 | Draft/pending không được cộng vào báo cáo chính thức |
| AR/AP | Đối chiếu ledger posted với invoice/payment/contract operational | Script reconciliation chỉ cảnh báo lệch, không tự sửa |
| Export tài chính | Server-side audited export | Client-side export chỉ được dùng cho non-financial hoặc sau khi có audit wrapper |

## 5. Source Document Trace

Đã thêm helper `lib/accounting/financialTrace.ts` để gom dữ liệu:

- Entity gốc: cost, invoice, payment, advance, settlement, contract, supplier, WBS.
- Liên kết công trình, hợp đồng, nhà cung cấp, WBS khi có dữ liệu.
- JournalEntry và TransactionLine liên quan.
- AuditLog liên quan theo entity/source.
- Financial summary theo công trình từ source canonical hiện có.

API mới:

| Endpoint | Mục đích |
| --- | --- |
| `GET /api/trace/source-document?sourceType=...&sourceId=...` | Truy từ chứng từ nguồn sang ledger/audit/liên kết |
| `GET /api/trace/project-financial?projectId=...` | Trace tổng thể công trình |
| `GET /api/trace/contract-financial?contractId=...` | Trace hợp đồng và phát sinh |
| `GET /api/trace/supplier-financial?supplierId=...` | Trace nhà cung cấp qua hợp đồng/công trình |
| `GET /api/trace/wbs-financial?wbsItemId=...` | Trace WBS, budget, cost, invoice |
| `GET /api/trace/ar-ap-reconciliation?projectId=...` | Đối chiếu AR/AP ledger và operational |

Kết quả script `verify-source-document-trace.ts`: WARNING vì có 17 posted journal thiếu `projectId`; không có journal thiếu source và không có approved cost/invoice/payment thiếu ledger active trong mẫu kiểm tra.

## 6. Advance/Settlement/Offset

Script `verify-advance-settlement-offset.ts` đã kiểm tra:

- Advance thiếu project.
- Advance thiếu recipient.
- Advance thiếu purpose.
- Paid advance thiếu journal.
- Settlement vượt advance.

Kết quả: PASS. Không phát hiện advance thiếu link bắt buộc hoặc settlement vượt số dư trong dữ liệu hiện tại.

Rủi ro còn lại: Phase 2 mới kiểm tra dữ liệu và trace, chưa chuẩn hóa sâu workflow hoàn ứng/đối trừ nhiều bước và chưa ép toàn bộ in/xuất phiếu tạm ứng qua audit server-side.

## 7. AR/AP Ledger Reconciliation

Script `verify-ar-ap-ledger-reconciliation.ts` kiểm tra 20 công trình.

| Project | AR ledger | AR operational | AR lệch | AP ledger | AP operational | AP lệch |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `project-battrang` - Trường mầm non Bát Tràng | 0 | 0 | 0 | -8.286.592 | 0 | 8.286.592 |

Không phát hiện approved payment chưa allocation hoặc settlement vượt advance trong kết quả script. Lệch AP này cần đối soát tài khoản AP, sourceType/sourceId của journal và mapping operational cho công trình trước khi dùng báo cáo công nợ thật.

## 8. Export/Print Audit Matrix

Chi tiết nằm tại `EXPORT_PRINT_AUDIT_MATRIX.md`.

Tóm tắt:

| Nhóm | Kết quả |
| --- | ---: |
| Tổng file có marker export/print/download | 23 |
| File high-risk chưa audit | 12 |
| Export tài chính chính đã chuyển audited | costs, budget, debt, revenue, accounting, reports |
| Rủi ro lớn còn lại | `app/print/*`, `app/services/export.service.ts`, `lib/export.ts` |

Các đường print chứng từ còn bypass audit cần xử lý ở Phase 3/Phase 4 bằng audited print endpoint hoặc print-token server-side.

## 9. Test Results

| Lệnh | Kết quả | Ghi chú |
| --- | --- | --- |
| `npx prisma validate` | PASS | Prisma schema hợp lệ |
| `npx prisma generate` | PASS | Generated Prisma Client v5.22.0 |
| `npm run build` | PASS | Next build pass, có warning Turbopack NFT và warning `url.parse()` cũ |
| `npm run lint` | FAIL | 1077 vấn đề: 816 errors, 261 warnings; chủ yếu nợ repo-wide như `no-explicit-any`, unused vars, hook lint |
| `npm run validation:database` | PASS | 42 journal posted sample không lệch debit/credit; orphan WBS = 0; draftPostedPayments = 0 |
| `npm run e2e -- tests/e2e/enterprise-smoke.spec.ts` | PASS | 3/3 test pass |
| `npx tsx scripts/validation/verify-project-supplier-contract-wbs-links.ts` | WARNING | 19 công trình thiếu `companyId` |
| `npx tsx scripts/validation/verify-source-document-trace.ts` | WARNING | 17 journal posted thiếu `projectId` |
| `npx tsx scripts/validation/verify-advance-settlement-offset.ts` | PASS | Không phát hiện lỗi advance/settlement trong dữ liệu hiện tại |
| `npx tsx scripts/validation/verify-ar-ap-ledger-reconciliation.ts` | WARNING | 1 công trình lệch AP 8.286.592 |
| `npx tsx scripts/validation/verify-export-print-audit-coverage.ts` | WARNING | 12 high-risk export/print paths chưa audit |

## 10. Remaining Risks

| ID | Rủi ro | Mức độ | Vị trí | Hướng xử lý |
| --- | --- | --- | --- | --- |
| R1 | In chứng từ tài chính chưa audit server-side | P1 | `app/print/*` | Thêm audited print endpoint/print-token |
| R2 | Helper export legacy có thể bị dùng lại để bypass audit | P1 | `app/services/export.service.ts`, `lib/export.ts` | Đánh dấu legacy, cấm dùng cho financial export, thêm lint/check |
| R3 | 19 công trình thiếu company scope | P1 | Dữ liệu `Project.companyId` | Backfill có review, thêm guard tạo mới |
| R4 | 17 posted journal thiếu `projectId` | P1 | Dữ liệu `JournalEntry.projectId` | Backfill từ sourceType/sourceId, ghi audit dữ liệu |
| R5 | Lệch AP công trình Bát Tràng | P1 | `project-battrang` | Đối soát journal AP và operational payable |
| R6 | Lint toàn repo chưa pass | P2 | Nhiều module | Tách phase hardening kỹ thuật, không trộn với nghiệp vụ |

## 11. Recommended Phase 3

Phase 3 nên làm sau khi chốt các backfill dữ liệu có kiểm soát:

1. Backfill `companyId` cho 19 công trình thiếu scope và thêm validation không cho tạo công trình thiếu company.
2. Backfill `projectId` cho 17 posted journal từ chứng từ nguồn; nếu không truy được nguồn thì đưa vào danh sách đối soát thủ công.
3. Đối soát AP công trình `project-battrang` để xác định ledger đúng hay operational thiếu mapping.
4. Chuyển toàn bộ `app/print/*` sang audited print server-side.
5. Khóa helper `exportToCsv` legacy để không dùng cho dữ liệu tài chính.
6. Chuẩn hóa sâu hợp đồng - nhà cung cấp - công trình - WBS và AR/AP subledger.
7. Sau khi dữ liệu sạch, nâng UI kế toán chuyên nghiệp: click số liệu mở trace chứng từ, drill-down ledger, bảng công nợ/advance/settlement rõ trạng thái.

## 12. Final Conclusion

Phase 2 đã hoàn thành phần lõi cần thiết để truy vết chứng từ và đưa export tài chính chính về đường audit server-side. Hệ thống đã build được và smoke test pass, nhưng chưa nên coi là khóa cứng cho dữ liệu kế toán thật vì còn rủi ro audit print, dữ liệu thiếu company/project linkage và lệch AP ở một công trình.

Nên xử lý ngay R1-R5 trước khi chuyển sang nâng cấp UI lớn. Sau khi các rủi ro dữ liệu và audit print được khóa, có thể chuyển sang Phase 3 để chuẩn hóa trải nghiệm kế toán và drill-down chứng từ.

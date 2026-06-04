# PHASE2.5 DATA AUDIT LOCKDOWN REPORT

Ngày hoàn thành: 2026-06-01

## 1. Executive Summary

Phase 2.5 đã xử lý phần khóa audit in/xuất chứng từ và bổ sung guard dữ liệu lõi:

- Thêm cơ chế `POST /api/print/audit` và `useAuditedPrint` để audit server-side trước khi các trang `app/print/*` tải dữ liệu/in chứng từ.
- Khóa helper export legacy bằng runtime guard non-financial only.
- Thêm guard tạo mới Project: không cho tạo công trình nếu thiếu company scope hoặc company không hợp lệ.
- Thêm guard PostingEngine: không cho tạo posted journal thiếu `projectId` với source tài chính công trình.
- Tạo đủ scripts validation/dry-run/apply cho Project.companyId và JournalEntry.projectId.
- Tạo forensic AP riêng cho `project-battrang`.

Backfill dữ liệu lịch sử không cập nhật record nào vì dry-run không tìm được record đủ `HIGH` confidence. Theo nguyên tắc prompt, các record không chắc chắn được đưa vào `MANUAL_REVIEW`, không đoán default company/project.

Chưa nên chuyển sang Phase 3 UI lớn cho dữ liệu thật vì còn P1 data review: 19 project thiếu `companyId`, 25 posted journal thiếu `projectId`, và AP Bát Tràng cần kế toán/owner dữ liệu xác nhận mapping operational payable.

## 2. Data Backfill Summary

| Nhóm | Trước | Đã backfill | Manual review | Sau xử lý | Ghi chú |
| ---- | ----: | ----------: | ------------: | --------: | ------- |
| Project thiếu companyId | 19 | 0 | 19 | 19 | Không có bằng chứng companyId từ branch/chứng từ; `project-battrang` có dữ liệu kế toán nhưng cũng thiếu company evidence |
| Journal posted thiếu projectId | 25 | 0 | 25 | 25 | Tất cả là `CASH_BANK`, source document không có `projectId`; 8 journal reversed |
| Journal/source reversed cần reconciliation | 8 | 0 | 8 | 8 | Không tự loại/sửa vì cần xác nhận policy report với reversal |
| AP lệch project-battrang | 1 | 0 | 1 | 1 | Ledger AP và operational AP lệch; forensic đã xác định nguồn dòng AP |

## 3. Project Company Scope

Scripts:

- `scripts/validation/verify-project-company-scope.ts`
- `scripts/migrations/dry-run-backfill-project-company.ts`
- `scripts/migrations/apply-backfill-project-company.ts`

Kết quả:

- `projectsWithoutCompany`: 19
- `invalidCompanyProjects`: 0
- `highConfidenceBackfillCandidates`: 0
- `manualReview`: 19
- `projectsWithAccountingDataWithoutScope`: 1, là `project-battrang`

Danh sách backfill: không có record nào được update.

Danh sách manual review được ghi trong:

- `docs/audit/phase25-project-company-backfill-dry-run.json`
- `docs/audit/phase25-project-company-backfill.json`

Logic suy luận companyId:

1. Branch của Project.
2. `companyId` từ CostRecord/Invoice/Advance/CashBankDocument/InventoryDocument/TaxInvoice liên quan.
3. Chỉ `HIGH` nếu có đúng một companyId duy nhất từ các nguồn trên.
4. Không dùng default company nếu không có bằng chứng.

Guard tạo mới:

- `services/project.service.ts`: `ProjectService.create` ném lỗi tiếng Việt nếu thiếu `companyId` hoặc company không tồn tại.

## 4. Journal Project Linkage

Scripts:

- `scripts/validation/verify-journal-project-linkage.ts`
- `scripts/migrations/dry-run-backfill-journal-project.ts`
- `scripts/migrations/apply-backfill-journal-project.ts`

Kết quả:

- `postedJournalsMissingProject`: 25
- `invalidProjectJournals`: 0
- `reversedPostedMissingProject`: 8
- `highConfidenceBackfillCandidates`: 0
- `manualReview`: 25
- `affectedTransactionLines`: 50

Danh sách backfill: không có record nào được update.

Lý do không update: tất cả journal thiếu project là `sourceType=CASH_BANK`; các CashBankDocument nguồn không có `projectId`, nên không thể suy luận project chắc chắn.

Guard posting mới:

- `lib/accounting/postingEngine.ts`: `createDoubleEntry` chặn source tài chính công trình `COST`, `INVOICE`, `PAYMENT`, `ADVANCE`, `ADVANCE_SETTLEMENT`, `CONTRACT`, `GRN` nếu thiếu `projectId`.

## 5. Forensic AP Bát Tràng

Báo cáo chi tiết:

- `docs/audit/FORENSIC_AP_PROJECT_BATTRANG.md`

Kết luận:

- Reconciliation hiện tại: ledger AP = `-8.286.592`, operational AP = `0`, variance = `8.286.592`.
- Forensic TransactionLine tài khoản AP (`331`, `3310`, `3311`, `3318`) cho thấy tổng signed AP = `52.256.741`, trong đó journal reversed = `43.970.149`.
- Lệch không đủ bằng chứng để kết luận ledger sai. Dữ liệu cho thấy ledger có AP lines từ `COST:*` và `PAYMENT:*`, còn operational AP đang bằng 0 do chưa mapping/cộng cùng nguồn payable.
- Không tự tạo bút toán điều chỉnh trong Phase 2.5.

Record nổi bật:

- Reversed payment: `PAYMENT:591792d0-4194-4e71-aa67-92cce6341df8`, amount `43.970.149`.
- Các AP source lớn nhất gồm `PAYMENT:6a96a3dd-8099-4f20-bc9a-d745dc5d5974`, `COST:ddfef388-ee53-4335-85fd-eaaf4616302f`, `PAYMENT:5912d36d-b5f0-432d-9c8d-1b58e85040b9`.

Cần xử lý tiếp:

1. Kế toán xác nhận operational AP phải lấy từ bảng nào: CostRecord, VendorPayment, PaymentAllocation hay CashBankDocument.
2. Sửa query reconciliation nếu operational payable đang bỏ sót nguồn.
3. Chỉ tạo bút toán điều chỉnh nếu kế toán xác nhận ledger sai.

## 6. Audited Print Lockdown

| Print route | Trước | Sau | Audit mechanism | Trạng thái |
| ----------- | ----- | --- | --------------- | ---------- |
| advance | Fetch dữ liệu rồi in | Audit trước, fetch sau | `/api/print/audit`, `useAuditedPrint` | Đạt |
| bank-transfer | Fetch dữ liệu rồi in | Audit trước, fetch sau | `/api/print/audit`, `useAuditedPrint` | Đạt |
| cash-payment | Fetch dữ liệu rồi in | Audit trước, fetch sau | `/api/print/audit`, `useAuditedPrint` | Đạt |
| cash-receipt | Fetch dữ liệu rồi in | Audit trước, fetch sau | `/api/print/audit`, `useAuditedPrint` | Đạt |
| debt | Fetch dữ liệu rồi in | Audit trước, fetch sau | `/api/print/audit`, `useAuditedPrint` | Đạt |
| inventory issue | Fetch dữ liệu rồi in | Audit trước, fetch sau | `/api/print/audit`, `useAuditedPrint` | Đạt |
| inventory receipt | Fetch dữ liệu rồi in | Audit trước, fetch sau | `/api/print/audit`, `useAuditedPrint` | Đạt |
| invoice | Fetch dữ liệu rồi in | Audit trước, fetch sau | `/api/print/audit`, `useAuditedPrint` | Đạt |
| ledger | Fetch dữ liệu rồi in | Audit trước, fetch sau | `/api/print/audit`, `useAuditedPrint` | Đạt |
| payment | Fetch dữ liệu rồi in | Audit trước, fetch sau | `/api/print/audit`, `useAuditedPrint` | Đạt |

## 7. Legacy Export Lockdown

Files:

- `app/services/export.service.ts`
- `lib/export.ts`

Đã thêm:

- `legacyExportCsvNonFinancialOnly`
- `assertNonFinancialClientExport`
- Runtime guard chặn keyword: financial, accounting, debt, payment, cost, revenue, budget, ledger, invoice, advance, cash, bank, journal và các từ khóa tiếng Việt tương ứng.

Kết quả `verify-no-financial-client-export.ts`: PASS, `forbiddenFinancialUsage = 0`.

Các đường manual review:

- `app/components/Header.tsx`: nút print toàn trang.
- `app/wbs/WBSListScreen.tsx`: export WBS có thể liên quan dự toán, cần quyết định nghiệp vụ.

## 8. Export/Print Audit Matrix Updated

File đã cập nhật:

- `EXPORT_PRINT_AUDIT_MATRIX.md`

Tóm tắt:

- Tổng file export/print/download: 15
- High-risk chưa audit: 0
- Forbidden financial client export: 0
- Needs manual review: 2

## 9. Test Results

| Lệnh | Kết quả | Ghi chú |
| --- | --- | --- |
| `git status` | PASS | Worktree dirty từ nhiều phase; không revert thay đổi có sẵn |
| `npx prisma validate` | PASS | Schema hợp lệ |
| `npx prisma generate` | FAIL | EPERM rename `query_engine-windows.dll.node`; có process Node giữ file generated client |
| `npm run build` | PASS | Next build pass; có warning NFT trace và `url.parse()` cũ |
| `npm run validation:database` | PASS | Journal sample balanced; orphan WBS = 0; draft posted payments = 0 |
| `npm run e2e -- tests/e2e/enterprise-smoke.spec.ts` | PASS | 3/3 tests pass |
| `npm run security-check` | PASS | Viewer bị chặn, Manager qua guard |
| `npm run lint` | FAIL | 1080 problems: 818 errors, 262 warnings; nợ lint toàn repo |
| `npx eslint <Phase 2.5 files>` | PASS | Không còn error/warning trên file mới Phase 2.5 sau khi sửa hook dependency |

Scripts Phase 2.5:

| Script | Kết quả | Ghi chú |
| --- | --- | --- |
| `verify-project-company-scope.ts` | WARNING | 19 project thiếu companyId, 0 HIGH, 19 manual review |
| `dry-run-backfill-project-company.ts` | PASS | Ghi `phase25-project-company-backfill-dry-run.json` |
| `apply-backfill-project-company.ts` | PASS | Updated 0, skipped 19, manual review 19 |
| `verify-journal-project-linkage.ts` | WARNING | 25 posted journal thiếu projectId, 0 HIGH, 25 manual review |
| `dry-run-backfill-journal-project.ts` | PASS | Ghi `phase25-journal-project-backfill-dry-run.json` |
| `apply-backfill-journal-project.ts` | PASS | Updated 0, skipped 25, manual review 25 |
| `forensic-ap-project-battrang.ts` | WARNING | Ghi `FORENSIC_AP_PROJECT_BATTRANG.md`; AP variance còn cần review |
| `verify-export-print-audit-coverage.ts` | PASS | High-risk chưa audit = 0 |
| `verify-no-financial-client-export.ts` | PASS | Forbidden financial client export = 0 |

## 10. Remaining Risks

| ID | Mức độ | Vị trí | Vấn đề cụ thể | Đề xuất |
| --- | --- | --- | --- | --- |
| R1 | P1 | `Project.companyId`, 19 record trong `docs/audit/phase25-project-company-backfill.json` | Project thiếu company scope, không đủ bằng chứng backfill tự động | Owner dữ liệu xác nhận company; sau đó chạy script apply với mapping explicit |
| R2 | P1 | `JournalEntry.projectId`, 25 record trong `docs/audit/phase25-journal-project-backfill.json` | Posted journal `CASH_BANK` thiếu projectId; CashBankDocument nguồn cũng không có projectId | Đối soát cash/bank chứng từ với công trình hoặc xác nhận là non-project finance |
| R3 | P1 | `project-battrang`, `docs/audit/FORENSIC_AP_PROJECT_BATTRANG.md` | AP ledger và operational AP lệch; operational AP đang không map cùng nguồn ledger | Xác nhận source operational AP và sửa query/backfill mapping |
| R4 | P2 | `app/components/Header.tsx` | Print toàn trang còn manual review | Ẩn khỏi màn hình tài chính hoặc gọi audited print |
| R5 | P2 | `app/wbs/WBSListScreen.tsx` | WBS CSV client-side còn manual review | Nếu WBS là dự toán chính thức, chuyển sang audited export |
| R6 | P2 | repo-wide lint | `npm run lint` còn 818 errors, 262 warnings | Tách phase hardening kỹ thuật, không trộn với data lockdown |
| R7 | P2 | `generated/prisma-client/query_engine-windows.dll.node` | `npx prisma generate` bị EPERM do file DLL bị giữ | Dừng process Node đang giữ Prisma client rồi chạy lại generate |

## 11. Recommended Phase 3

Chưa nên vào Phase 3 UI lớn cho dữ liệu kế toán thật cho đến khi xử lý R1-R3.

Thứ tự tiếp theo:

1. Tạo mapping explicit cho 19 project thiếu `companyId`.
2. Xác nhận 25 journal `CASH_BANK` là non-project hay thuộc công trình nào.
3. Sửa AP reconciliation cho `project-battrang` sau khi xác định operational AP source.
4. Sau đó mới vào Phase 3 UI/UX: click số liệu mở trace chứng từ, drilldown ledger, bảng công nợ/tạm ứng/thanh toán, Excel A4, sửa encoding tiếng Việt toàn hệ thống, action menu/dropdown portal, visual regression bằng Playwright screenshot.

## 12. Final Conclusion

Phase 2.5 đã khóa được audit print/export ở mức high-risk = 0 và bổ sung guard để không phát sinh thêm project/journal thiếu scope ở các luồng chính. Dữ liệu lịch sử chưa được backfill vì không có bằng chứng đủ chắc; đây là quyết định đúng để tránh sửa sai số liệu kế toán. Các P1 còn lại là manual data reconciliation, không phải lỗi build/runtime mới.

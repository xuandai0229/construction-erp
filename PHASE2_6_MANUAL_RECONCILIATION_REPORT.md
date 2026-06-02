# PHASE2.6 MANUAL RECONCILIATION REPORT

Ngày hoàn thành: 2026-06-01

## 1. Executive Summary

Phase 2.6 đã tạo bộ workbook/mapping để kế toán hoặc owner dữ liệu xác nhận các P1 lịch sử còn lại trước khi nâng UI:

- Mapping 19 công trình thiếu `companyId`.
- Mapping 25 posted journal thiếu `projectId`.
- Mapping đối soát 26 dòng AP ledger của `project-battrang`.
- Scripts validate/apply mapping explicit cho Project và Journal.
- Script validate quyết định AP Bát Tràng.
- Workbook hướng dẫn điền và apply sau khi được xác nhận.

Không apply dữ liệu trong Phase 2.6 vì tất cả mapping draft đang để `MANUAL_REVIEW`, không có dòng `APPROVED_FOR_BACKFILL`. Đây là đúng policy: không đoán company/project và không tạo bút toán AP khi chưa có xác nhận kế toán.

Chưa nên chuyển Phase 3 UI lớn. Nên làm tiếp `Phase 2.7 - Apply Approved Reconciliation Mapping` sau khi owner/kế toán điền và phê duyệt mapping.

## 2. Mapping Files Created

| File | Mục đích | Số dòng | Trạng thái |
| ---- | -------- | ------: | ---------- |
| `docs/reconciliation/project-company-mapping.template.csv` | Template trống cho mapping Project -> Company | 0 | Đã tạo |
| `docs/reconciliation/project-company-mapping.draft.csv` | Draft 19 project thiếu companyId | 19 | Chờ owner xác nhận |
| `docs/reconciliation/journal-project-mapping.template.csv` | Template trống cho mapping Journal -> Project/non-project | 0 | Đã tạo |
| `docs/reconciliation/journal-project-mapping.draft.csv` | Draft 25 posted journal thiếu projectId | 25 | Chờ owner xác nhận |
| `docs/reconciliation/project-battrang-ap-reconciliation.template.csv` | Template trống cho quyết định AP Bát Tràng | 0 | Đã tạo |
| `docs/reconciliation/project-battrang-ap-reconciliation.draft.csv` | Draft 26 dòng AP ledger Bát Tràng | 26 | Chờ kế toán xác nhận |
| `docs/reconciliation/MANUAL_RECONCILIATION_WORKBOOK.md` | Hướng dẫn điền mapping và apply | 1 workbook | Đã tạo |

Scripts Phase 2.6:

- `scripts/reconciliation/generate-manual-reconciliation-workbook.ts`
- `scripts/reconciliation/validate-project-company-mapping.ts`
- `scripts/reconciliation/apply-project-company-mapping.ts`
- `scripts/reconciliation/validate-journal-project-mapping.ts`
- `scripts/reconciliation/apply-journal-project-mapping.ts`
- `scripts/reconciliation/validate-project-battrang-ap-decision.ts`

## 3. Project Company Reconciliation

Tổng project thiếu `companyId`: 19.

Project có dữ liệu kế toán: `project-battrang` với:

- 14 cost records.
- 13 invoices.
- 11 payments.
- 26 journal entries linked to project.

Các project còn lại là các project test/hardening không có bằng chứng company từ branch hoặc chứng từ liên quan.

Draft mapping:

- File: `docs/reconciliation/project-company-mapping.draft.csv`
- `ownerDecision` mặc định: `MANUAL_REVIEW`
- `suggestedCompanyId`: trống vì không có bằng chứng đủ chắc
- `action`: `REVIEW_LATER`

Có thể backfill sau xác nhận nếu owner điền:

- `ownerDecision=APPROVED_FOR_BACKFILL`
- `approvedCompanyId=<companyId đúng>`
- `decisionReason`
- `approvedBy`
- `approvedAt`
- `action=BACKFILL_COMPANY`

Không có project nào được tự động backfill trong Phase 2.6.

## 4. Journal Project Reconciliation

Tổng posted journal thiếu `projectId`: 25.

Phân loại:

- `sourceType=CASH_BANK`: 25.
- Reversed journal: 8.
- Affected transaction lines: 50 theo Phase 2.5.
- Backfill tự động: 0.
- Non-project finance đã xác nhận: 0.

Draft mapping:

- File: `docs/reconciliation/journal-project-mapping.draft.csv`
- Mỗi dòng có journal date, sourceType/sourceId, description, debit/credit total, cash bank document info nếu truy được, evidence và accounts.
- `ownerDecision` mặc định: `MANUAL_REVIEW`
- `action`: `REVIEW_LATER`

Journal có thể thuộc công trình nếu owner xác nhận cash/bank document liên quan hợp đồng, payment, WBS hoặc công trình cụ thể. Journal có thể là non-project finance nếu owner xác nhận là nghiệp vụ thu/chi tài chính chung và điền:

- `ownerDecision=NON_PROJECT_FINANCE`
- `action=MARK_NON_PROJECT`
- `nonProjectReason`

Không có journal nào được update `projectId` trong Phase 2.6.

## 5. AP Bát Tràng Reconciliation

Nguồn đối soát:

- `docs/audit/FORENSIC_AP_PROJECT_BATTRANG.md`
- `docs/reconciliation/project-battrang-ap-reconciliation.draft.csv`

Số liệu chính:

| Chỉ tiêu | Số tiền |
| --- | ---: |
| Ledger AP theo reconciliation | -8.286.592 |
| Operational AP theo reconciliation | 0 |
| Variance | 8.286.592 |
| AP tính từ TransactionLine forensic | 52.256.741 |
| AP thuộc journal reversed | 43.970.149 |

Top sources cần kế toán xác nhận:

- `PAYMENT:6a96a3dd-8099-4f20-bc9a-d745dc5d5974`
- `COST:ddfef388-ee53-4335-85fd-eaaf4616302f`
- `PAYMENT:5912d36d-b5f0-432d-9c8d-1b58e85040b9`
- `COST:8f2ab96c-86a2-4255-a105-7be1d31ac83f`
- `COST:1393f539-361b-42b0-95f4-757d7f3ee64b`
- `COST:86e5038c-9179-4bc2-9387-ae230851aaf6`

Kết luận Phase 2.6:

- Chưa kết luận ledger sai.
- Operational AP nhiều khả năng thiếu mapping/query nguồn payable vì operational AP đang bằng 0 trong khi ledger có AP lines.
- Chưa tạo adjustment proposal vì chưa có ownerDecision/kế toán trưởng xác nhận.
- Cần kế toán xác định dòng nào là `LEDGER_CORRECT_OPERATIONAL_MISSING`, `REVERSAL_POLICY_ISSUE`, `OPERATIONAL_CORRECT_LEDGER_NEEDS_REVIEW` hoặc `DUPLICATE_OR_WRONG_JOURNAL`.

## 6. Validation Results

| Lệnh | Kết quả | Ghi chú |
| --- | --- | --- |
| `git status` | PASS | Worktree đang dirty từ Phase 1/2/2.5/2.6; không revert thay đổi có sẵn |
| `npx prisma validate` | PASS | Schema hợp lệ |
| `npm run build` | PASS | Next build pass; còn warning Turbopack NFT và `url.parse()` cũ |
| `npm run validation:database` | PASS | Journal sample balanced; orphan WBS = 0; draft posted payments = 0 |
| `npm run e2e -- tests/e2e/enterprise-smoke.spec.ts` | PASS | 3/3 tests pass |
| `npm run security-check` | PASS | Viewer bị chặn, Manager qua guard |
| `npx prisma generate` | FAIL | EPERM rename `query_engine-windows.dll.node`; các node.exe PID 8684, 9328, 10980, 19708 có thể đang giữ Prisma DLL |
| `npx eslint scripts/reconciliation/*.ts` | PASS | Scripts Phase 2.6 không có lint error |

Scripts Phase 2.6:

| Script | Kết quả | Ghi chú |
| --- | --- | --- |
| `npx tsx scripts/reconciliation/generate-manual-reconciliation-workbook.ts` | PASS | Tạo 19 project rows, 25 journal rows, 26 AP rows |
| `npx tsx scripts/reconciliation/validate-project-company-mapping.ts` | WARNING | 19 dòng chưa approved, 0 issues |
| `npx tsx scripts/reconciliation/validate-journal-project-mapping.ts` | WARNING | 25 dòng chưa owner decision, 0 issues |
| `npx tsx scripts/reconciliation/validate-project-battrang-ap-decision.ts` | WARNING | 26 dòng AP còn manual review, 0 issues |

Ghi chú `npx prisma generate`: lỗi EPERM trên Windows không phải lỗi nghiệp vụ. Cần đóng process Node/Next dev server/terminal đang giữ `generated/prisma-client/query_engine-windows.dll.node`, hoặc restart máy rồi chạy lại.

## 7. Remaining P1

| ID | Vấn đề | Cần ai xác nhận | File mapping | Trạng thái |
| -- | ------ | --------------- | ------------ | ---------- |
| P1-01 | 19 project thiếu `companyId` | Owner dữ liệu/kế toán trưởng/admin tenant | `docs/reconciliation/project-company-mapping.draft.csv` | Chờ xác nhận |
| P1-02 | 25 posted journal `CASH_BANK` thiếu `projectId` | Kế toán ngân hàng/quỹ và kế toán công trình | `docs/reconciliation/journal-project-mapping.draft.csv` | Chờ xác nhận |
| P1-03 | AP Bát Tràng lệch ledger vs operational | Kế toán công nợ/kế toán trưởng | `docs/reconciliation/project-battrang-ap-reconciliation.draft.csv` | Chờ quyết định |
| P1-04 | 8 reversed cash-bank journal thiếu project policy | Kế toán trưởng | `docs/reconciliation/journal-project-mapping.draft.csv` | Chờ xác nhận non-project/backfill/exclude |

## 8. Decision Gate Trước Phase 3

Chưa đạt gate để sang Phase 3 UI lớn.

Điều kiện còn thiếu:

- 19 project chưa có owner decision.
- 25 journal chưa có owner decision.
- AP Bát Tràng chưa có kết luận ledger/operational.
- Chưa có người chịu trách nhiệm phê duyệt từng mapping row.

Đề xuất tiếp theo: `Phase 2.7 - Apply Approved Reconciliation Mapping`.

Phase 2.7 chỉ nên chạy sau khi các file draft đã được kế toán/owner điền và validator trả PASS. Khi đó mới chạy:

```bash
npx tsx scripts/reconciliation/validate-project-company-mapping.ts
npx tsx scripts/reconciliation/apply-project-company-mapping.ts
npx tsx scripts/reconciliation/validate-journal-project-mapping.ts
npx tsx scripts/reconciliation/apply-journal-project-mapping.ts
npx tsx scripts/reconciliation/validate-project-battrang-ap-decision.ts
npm run validation:database
```

## 9. Final Conclusion

Phase 2.6 đã hoàn thành phần cần thiết để chuyển rủi ro P1 từ trạng thái "không rõ nguồn" sang quy trình đối soát có kiểm soát. Không có dữ liệu kế toán nào bị sửa trong phase này. Hệ thống đã có đủ mapping file, validation script và apply script để thực hiện backfill an toàn khi owner/kế toán xác nhận.

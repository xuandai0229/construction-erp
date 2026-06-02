# MANUAL RECONCILIATION WORKBOOK

Ngày tạo: 2026-06-01T09:56:12.105Z

## 1. Project Company Mapping

Có 19 công trình cần kế toán/owner dữ liệu xác nhận company scope.

File cần điền:

- `docs/reconciliation/project-company-mapping.draft.csv`

Cách điền:

1. Xác định công ty đúng cho từng công trình từ hồ sơ nội bộ, hợp đồng, chứng từ nguồn hoặc quyết định quản lý.
2. Nếu chắc chắn, điền `ownerDecision=APPROVED_FOR_BACKFILL`, `approvedCompanyId`, `decisionReason`, `approvedBy`, `approvedAt`, `action=BACKFILL_COMPANY`.
3. Nếu là dữ liệu legacy không còn dùng, chọn `ARCHIVED_LEGACY` và `NO_ACTION`.
4. Không điền đại company mặc định nếu không có bằng chứng.

## 2. Journal Project Mapping

Có 25 posted journal cần xác nhận thuộc công trình hay nghiệp vụ tài chính chung.

File cần điền:

- `docs/reconciliation/journal-project-mapping.draft.csv`

Cách xác định:

- Nếu chứng từ cash/bank thanh toán cho công trình cụ thể, điền `APPROVED_FOR_BACKFILL`, `approvedProjectId`, `action=BACKFILL_PROJECT`.
- Nếu là nghiệp vụ tài chính chung không thuộc công trình, điền `ownerDecision=NON_PROJECT_FINANCE`, `action=MARK_NON_PROJECT`, và bắt buộc có `nonProjectReason`.
- Nếu chưa đủ chứng từ đối chiếu, giữ `MANUAL_REVIEW`.

## 3. AP Bát Tràng

Có 26 dòng AP ledger cần kế toán xác nhận.

File cần điền:

- `docs/reconciliation/project-battrang-ap-reconciliation.draft.csv`

Số liệu Phase 2.5:

- Ledger AP theo reconciliation: `-8.286.592`
- Operational AP theo reconciliation: `0`
- Variance: `8.286.592`
- AP từ TransactionLine forensic: `52.256.741`
- AP thuộc journal reversed: `43.970.149`

Câu hỏi cần trả lời:

1. Operational AP phải tính từ bảng nào?
2. Các dòng payment/cost top source đã được đối trừ đúng chưa?
3. Dòng reversed có đang bị policy reconciliation xử lý đúng chưa?
4. Cần sửa query operational, review ledger, hay lập proposal điều chỉnh?

## 4. Hướng dẫn apply sau khi xác nhận

```bash
npx tsx scripts/reconciliation/validate-project-company-mapping.ts
npx tsx scripts/reconciliation/apply-project-company-mapping.ts
npx tsx scripts/reconciliation/validate-journal-project-mapping.ts
npx tsx scripts/reconciliation/apply-journal-project-mapping.ts
npx tsx scripts/reconciliation/validate-project-battrang-ap-decision.ts
npm run validation:database
```

## 5. Cảnh báo

- Không điền đại company/project.
- Không sửa AP bằng tay nếu chưa có đối chiếu chứng từ.
- Không tạo adjustment nếu chưa có kế toán trưởng xác nhận.
- Chỉ dòng `APPROVED_FOR_BACKFILL` mới được apply dữ liệu.

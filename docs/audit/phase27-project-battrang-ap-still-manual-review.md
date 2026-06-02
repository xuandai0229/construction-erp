# Phase 2.7 - AP Bát Tràng Still Manual Review

Ngày kiểm tra: 2026-06-01

## Kết luận

File `docs/reconciliation/project-battrang-ap-reconciliation.draft.csv` chưa có dòng nào được kế toán/owner dữ liệu quyết định.

Kết quả validator:

| Chỉ tiêu | Kết quả |
| --- | ---: |
| Tổng dòng AP | 26 |
| Dòng đã có quyết định | 0 |
| Dòng còn `MANUAL_REVIEW` | 26 |
| Lỗi format | 0 |

## Không xử lý trong Phase 2.7

Không sửa reconciliation query, không sửa operational mapping, không review ledger bằng code và không tạo adjustment proposal vì chưa có:

- `ownerDecision`
- `mappingAction`
- `decisionReason`
- `approvedBy`
- `approvedAt`

## Việc cần kế toán xác nhận

Kế toán cần điền `docs/reconciliation/project-battrang-ap-reconciliation.draft.csv` theo từng dòng AP:

- `LEDGER_CORRECT_OPERATIONAL_MISSING`
- `OPERATIONAL_CORRECT_LEDGER_NEEDS_REVIEW`
- `REVERSAL_POLICY_ISSUE`
- `DUPLICATE_OR_WRONG_JOURNAL`
- `MANUAL_REVIEW`

Sau khi điền, chạy lại:

```bash
npx tsx scripts/reconciliation/validate-project-battrang-ap-decision.ts
```

Chỉ khi validator PASS mới được xử lý tiếp ở phase apply/sửa query.

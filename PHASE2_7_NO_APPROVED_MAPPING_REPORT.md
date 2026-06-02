# PHASE2.7 NO APPROVED MAPPING REPORT

Ngày kiểm tra: 2026-06-01

## 1. Executive Summary

Phase 2.7 đã kiểm tra ba file mapping từ Phase 2.6 và xác nhận chưa có dòng nào được owner/kế toán phê duyệt để apply.

Không apply dữ liệu.

Không update `Project.companyId`.

Không update `JournalEntry.projectId`.

Không đánh dấu journal nào là `NON_PROJECT_FINANCE`.

Không sửa AP Bát Tràng, không sửa reconciliation query và không tạo bút toán điều chỉnh.

Theo điều kiện bắt buộc của prompt Phase 2.7, quy trình phải dừng tại đây cho đến khi kế toán/owner điền mapping rõ ràng.

## 2. Mapping Approval Check

| Nhóm | Tổng dòng | Approved | Non-project confirmed | Manual review | Kết quả |
| ---- | -------: | -------: | --------------------: | ------------: | ------- |
| Project -> Company | 19 | 0 | 0 | 19 | WARNING - chưa có approval |
| Journal -> Project | 25 | 0 | 0 | 25 | WARNING - chưa có approval |
| Journal non-project | 25 | 0 | 0 | 25 | WARNING - chưa có approval |
| AP Bát Tràng | 26 | 0 | 0 | 26 | WARNING - chưa có quyết định AP |

## 3. Validator Results

| Lệnh | Kết quả | Ghi chú |
| --- | --- | --- |
| `npx tsx scripts/reconciliation/validate-project-company-mapping.ts` | WARNING | 19 dòng chưa approved, 0 issues |
| `npx tsx scripts/reconciliation/validate-journal-project-mapping.ts` | WARNING | 25 dòng chưa owner decision, 0 issues |
| `npx tsx scripts/reconciliation/validate-project-battrang-ap-decision.ts` | WARNING | 26 dòng AP còn manual review, 0 issues |
| `npx prisma validate` | PASS | Prisma schema hợp lệ |
| `git status --short` | PASS | Worktree dirty từ các phase trước; không revert |

## 4. Không Apply

Các apply script không được chạy vì không có dòng hợp lệ:

- `scripts/reconciliation/apply-project-company-mapping.ts`
- `scripts/reconciliation/apply-journal-project-mapping.ts`

Không tạo log apply Phase 2.7 vì không có transaction dữ liệu nào được thực hiện.

## 5. Files Cần Kế Toán Điền

| File | Việc cần điền |
| --- | --- |
| `docs/reconciliation/project-company-mapping.draft.csv` | Điền `APPROVED_FOR_BACKFILL`, `approvedCompanyId`, `decisionReason`, `approvedBy`, `approvedAt`, `action=BACKFILL_COMPANY` cho project được xác nhận |
| `docs/reconciliation/journal-project-mapping.draft.csv` | Điền `APPROVED_FOR_BACKFILL/BACKFILL_PROJECT` hoặc `NON_PROJECT_FINANCE/MARK_NON_PROJECT` cho từng journal |
| `docs/reconciliation/project-battrang-ap-reconciliation.draft.csv` | Điền quyết định AP và action xử lý cho từng dòng |

## 6. Remaining P1

| ID | Mức độ | Vấn đề | Còn bao nhiêu record | Người chịu trách nhiệm | Việc cần làm |
| -- | ------ | ------ | -------------------: | ---------------------- | ------------ |
| P1-01 | P1 | Project thiếu `companyId` chưa có owner decision | 19 | Owner dữ liệu/kế toán trưởng/admin tenant | Điền `project-company-mapping.draft.csv` |
| P1-02 | P1 | Posted journal thiếu `projectId` chưa có owner decision | 25 | Kế toán ngân hàng/quỹ và kế toán công trình | Điền `journal-project-mapping.draft.csv` |
| P1-03 | P1 | Journal non-project finance chưa được xác nhận | 25 ứng viên | Kế toán trưởng | Xác định dòng nào là nghiệp vụ chung |
| P1-04 | P1 | AP Bát Tràng chưa có quyết định ledger/operational | 26 dòng AP | Kế toán công nợ/kế toán trưởng | Điền `project-battrang-ap-reconciliation.draft.csv` |

## 7. Decision Gate Sang Phase 3

Chưa đạt điều kiện sang Phase 3 UI lớn.

Lý do:

- 19 project vẫn chưa có quyết định owner.
- 25 journal vẫn chưa có quyết định owner.
- AP Bát Tràng chưa có quyết định rõ ledger đúng hay operational thiếu mapping.
- Không có dòng nào được apply trong Phase 2.7.

Việc tiếp theo bắt buộc:

```text
Kế toán/owner dữ liệu điền mapping draft -> chạy lại validators -> thực hiện lại Phase 2.7.
```

Chỉ khi các mapping đã được phê duyệt và validators PASS mới được chạy apply scripts.

## 8. Final Conclusion

Phase 2.7 đã dừng đúng nguyên tắc an toàn. Không có dữ liệu nào bị thay đổi vì chưa có phê duyệt rõ ràng. Không được chuyển sang Phase 3 UI lớn cho dữ liệu thật cho đến khi mapping được owner/kế toán xác nhận.

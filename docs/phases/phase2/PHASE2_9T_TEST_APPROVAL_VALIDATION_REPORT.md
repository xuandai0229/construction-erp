# PHASE 2.9T TEST APPROVAL VALIDATION REPORT

Ngày thực hiện: 2026-06-04  
Workspace: `D:\construction-erp`  
Mục tiêu: Tạo approval giả lập do AI cho kiểm thử validator/apply flow trong sandbox nội bộ.

## 1. Executive Summary

Đây là test approval, không phải human approval thật.

Markers bắt buộc:

```text
TEST_ONLY_AI_APPROVAL
SANDBOX_VALIDATION_ONLY
NOT_FOR_PRODUCTION
NOT_HUMAN_APPROVAL
NOT_ACCOUNTING_SIGN_OFF
```

Kết quả chính:

- Đã kiểm tra môi trường trước khi làm.
- Database chính trong `.env` trỏ local PostgreSQL database `construction_erp`.
- Không phát hiện production hint trong `.env`/`.env.local`.
- Production risk đánh giá: `LOW` cho database chính.
- Đã tạo backup package trước khi sinh test approval.
- Đã tạo bản test-only riêng dưới `.local-audit-quarantine/human-approval-package/test-only/`.
- Không sửa 3 file approval gốc.
- Không sửa database.
- Không chạy apply script.
- Không sửa ledger/posting/payment/AP Bát Tràng.
- Validator test-only:
  - Project -> Company: `PASS`.
  - CASH_BANK Journal: `WARNING`.
  - AP Bát Tràng: `WARNING`.

Kết luận test-only:

```text
READY_FOR_TEST_ONLY_PHASE2_7_APPLY_PLAN
```

Kết luận production:

```text
NOT_PRODUCTION_READY
WAITING_FOR_REAL_HUMAN_APPROVAL_FOR_PRODUCTION
```

## 2. Environment Safety Check

| Hạng mục | Kết quả | Ghi chú |
| -------- | ------- | ------- |
| Branch hiện tại | `main` | Không tạo branch/commit/push. |
| `.env` DATABASE_URL | Detected: yes | Không in secret. |
| `.env` database host | `localhost/local` | Host local, không phải remote production. |
| `.env` database name | `construction_erp` | Phục vụ sandbox/dev nội bộ. |
| `.env.local` DATABASE_URL | Detected: no | Không có DB override trong `.env.local`. |
| Environment | `unknown` | Không thấy production hint. |
| Production risk | `LOW` | Tiếp tục được vì DB local. |
| Backup package | Có | Tạo trước khi sinh test-only CSV. |

Nếu phát hiện DB remote/production, phase này phải dừng với `BLOCKED_PRODUCTION_RISK`. Lần kiểm tra này không có dấu hiệu đó.

## 3. Backup Snapshot

Đã copy toàn bộ package gốc vào:

```text
.local-audit-quarantine/test-approval-backup/human-approval-package-before-test-approval/
```

Không commit thư mục backup. Thư mục nằm trong `.local-audit-quarantine/`, được Git ignore.

## 4. Test-only Files Created

| File | Mục đích | Ghi chú |
| ---- | -------- | ------- |
| `.local-audit-quarantine/human-approval-package/test-only/project-company-mapping.test-approval.csv` | Test approval project/company | Sinh từ file gốc, không ghi đè file gốc. |
| `.local-audit-quarantine/human-approval-package/test-only/journal-project-mapping.test-approval.csv` | Test approval CASH_BANK journal | Giữ manual review vì thiếu evidence đủ rõ để tự gán project/non-project. |
| `.local-audit-quarantine/human-approval-package/test-only/project-battrang-ap-reconciliation.test-approval.csv` | Test approval AP Bát Tràng | Giữ manual review + no action để không sửa AP/ledger. |
| `.local-audit-quarantine/human-approval-package/test-only/TEST_APPROVAL_DISCLAIMER.md` | Cảnh báo test-only | Ghi rõ không dùng production, không phải human approval. |

Không sửa các file gốc:

```text
project-company-mapping.for-approval.csv
journal-project-mapping.for-approval.csv
project-battrang-ap-reconciliation.for-approval.csv
```

## 5. Test Approval Scope

| Nhóm | Tổng dòng | Test approved | Manual review | Không xử lý |
| ---- | --------: | ------------: | ------------: | ----------: |
| Project -> Company | 19 | 18 | 1 | 0 |
| CASH_BANK Journal | 25 | 0 | 25 | 0 |
| AP Bát Tràng | 26 | 0 | 26 | 0 |

Quy tắc đã dùng:

- Project -> Company: chỉ test approve khi có `suggestedCompanyId` và `confidence=HIGH`.
- CASH_BANK Journal: không tự gán project/non-project nếu không có bằng chứng đủ rõ.
- AP Bát Tràng: không tự kết luận ledger đúng/sai, không tạo adjustment, giữ `MANUAL_REVIEW + NO_ACTION`.

## 6. Validator Results

| Validator | Kết quả | Ghi chú |
| --------- | ------- | ------- |
| `validate-project-company-mapping.ts` với file test-only | PASS | 19 dòng, 18 `approvedForBackfill`, 1 warning/manual review, 0 issues. |
| `validate-journal-project-mapping.ts` với file test-only | WARNING | 25 dòng đều manual review, 0 issues, không có dòng apply. |
| `validate-project-battrang-ap-decision.ts` với file test-only | WARNING | 26 dòng AP còn manual review, 0 issues, không có action sửa AP. |

Không chạy apply.

## 7. Safety Warning

```text
NOT_PRODUCTION_READY
TEST_ONLY_AI_APPROVAL
SANDBOX_VALIDATION_ONLY
DO_NOT_USE_FOR_REAL_ACCOUNTING
NOT_HUMAN_APPROVAL
NOT_ACCOUNTING_SIGN_OFF
```

Ràng buộc bắt buộc:

- Không được dùng các file `test-only` để ghi nhận production approval.
- Không được nói kế toán trưởng đã duyệt.
- Không được nói owner thật đã xác nhận.
- Không được dùng làm căn cứ báo cáo tài chính thật.
- Trước khi dùng dữ liệu thật, phải quay lại quy trình human approval thật.

## 8. Proposed Next Step

Nếu mục tiêu là kiểm thử sandbox:

```text
Phase 2.7T - Test-only Apply Approved Reconciliation on Sandbox
```

Phạm vi đề xuất cho Phase 2.7T:

- Chỉ lập kế hoạch apply test-only trước, chưa apply ngay.
- Nếu apply sandbox, chỉ apply nhóm Project -> Company đã validator PASS.
- Loại trừ toàn bộ CASH_BANK Journal vì validator chỉ `WARNING`, không có dòng apply.
- Loại trừ toàn bộ AP Bát Tràng vì validator chỉ `WARNING`, không có action sửa AP.
- Backup database trước mọi test apply.
- Ghi rõ rollback plan.
- Sau test, không dùng kết quả cho production.

Nếu muốn dùng thật:

```text
Quay lại human approval thật với kế toán/owner.
```

## 9. Technical Test Results

| Lệnh | Kết quả | Ghi chú |
| ---- | ------- | ------- |
| `git status --short --untracked-files=all` | PASS kiểm tra hiện trạng | Có nhiều report/file từ phase trước; không revert. |
| `git branch --show-current` | PASS | Branch `main`. |
| `git log -5 --oneline` | PASS | Head `c8e8d4e app_v2_pate8`. |
| `npx prisma validate` | PASS | Schema hợp lệ. |
| `npm run build` | PASS_WITH_WARNINGS | Build pass; còn warning Turbopack NFT trace và Node `url.parse()` cũ. |
| `npx tsc --noEmit --pretty false` | PASS | Không có lỗi TypeScript. |
| `npm run validation:database` | PASS | Read-only; posted journal sample balanced, orphan sample 0. |
| `npm run security-check` | PASS | Viewer bị chặn, Manager pass guard. |

## 10. Đánh giá sau khi hoàn thành

## 10.1 Việc vừa làm giúp test hệ thống tốt hơn ở điểm nào?

Phase 2.9T giúp kiểm thử được một phần luồng validator với dữ liệu sandbox mà không cần giả mạo human approval thật:

- Có file test-only riêng, tách khỏi file approval gốc.
- Có backup package trước khi sinh test approval.
- Có disclaimer rõ để tránh nhầm với production.
- Validator project/company đã được kiểm thử với 18 dòng test-approved.
- CASH_BANK và AP Bát Tràng được giữ manual review, giúp kiểm tra validator xử lý partial/warning mà không ép kết luận kế toán.

## 10.2 Rủi ro nếu nhầm test approval với human approval thật là gì?

Rủi ro rất cao:

- Sai báo cáo theo công ty/công trình nếu mapping test bị dùng thật.
- Sai cashflow hoặc công nợ nếu CASH_BANK/AP bị áp dụng sai.
- Mất giá trị audit vì AI/kỹ thuật không phải người chịu trách nhiệm kế toán.
- Có thể tạo niềm tin sai rằng hệ thống production ready.
- Có thể dẫn đến quyết định tài chính dựa trên dữ liệu chưa được kế toán xác nhận.

Vì vậy mọi file test-only đều phải giữ trong thư mục `test-only` và không dùng cho production.

## 10.3 Có phần nào vẫn đang bị blocker không?

Có. Production vẫn bị blocker:

- Chưa có human approval thật.
- `04_SIGN_OFF_FORM.md` chưa có kế toán/owner ký thật.
- CASH_BANK Journal vẫn chưa có quyết định owner.
- AP Bát Tràng vẫn chưa có quyết định kế toán.
- Phase 2.7 production apply vẫn chưa được phép chạy.

## 10.4 Nếu tiếp tục test sandbox, bước tiếp theo nên làm gì?

Nên làm:

```text
Phase 2.7T - Test-only Apply Approved Reconciliation on Sandbox
```

Nhưng chỉ nên lập kế hoạch trước khi apply:

- Xác định chỉ apply Project -> Company test-approved.
- Không apply CASH_BANK.
- Không apply AP Bát Tràng.
- Backup database trước test apply.
- Có rollback plan.
- Sau test apply phải tạo validation report.

## 10.5 Nếu muốn production thật, bước tiếp theo nên làm gì?

Quay lại quy trình human approval thật:

1. Gửi package cho kế toán/owner.
2. Kế toán/owner điền 3 CSV gốc.
3. Kế toán/owner ký `04_SIGN_OFF_FORM.md`.
4. Chạy lại Phase 2.9B.
5. Validator PASS.
6. Owner xác nhận cuối cùng.
7. Mới lập Phase 2.7 production apply plan.

## 10.6 Gate hiện tại

Gate test-only:

```text
A. READY_FOR_TEST_ONLY_PHASE2_7_APPLY_PLAN
```

Gate production:

```text
D. WAITING_FOR_REAL_HUMAN_APPROVAL_FOR_PRODUCTION
```

Không production ready.

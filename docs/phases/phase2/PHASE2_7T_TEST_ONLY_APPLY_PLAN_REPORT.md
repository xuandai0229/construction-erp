# PHASE 2.7T TEST-ONLY APPLY PLAN REPORT

Ngày lập: 2026-06-04  
Workspace: `D:\construction-erp`  
Mục tiêu: Lập kế hoạch apply test-only cho sandbox, chưa chạy apply và chưa sửa database.

## 1. Executive Summary

Đây là kế hoạch apply test-only cho sandbox, không phải apply production.

Markers bắt buộc:

```text
TEST_ONLY_AI_APPROVAL
SANDBOX_VALIDATION_ONLY
NOT_FOR_PRODUCTION
NOT_HUMAN_APPROVAL
NOT_ACCOUNTING_SIGN_OFF
```

Trạng thái:

- Chưa chạy apply DB.
- Chưa sửa `Project.companyId`.
- Chưa sửa `JournalEntry.projectId`.
- Chưa đánh dấu `NON_PROJECT_FINANCE`.
- Chưa sửa AP Bát Tràng.
- Chưa sửa ledger/posting/payment/source-of-truth.
- Chưa tạo migration.

Phạm vi apply test-only đề xuất:

- Project -> Company: 18 dòng test-approved.
- CASH_BANK Journal: 0 dòng.
- AP Bát Tràng: 0 dòng.

Gate sau phase:

```text
A. READY_FOR_TEST_ONLY_PHASE2_7_APPLY_AFTER_USER_CONFIRMATION
```

Không production ready.

## 2. Environment Safety

| Hạng mục | Kết quả | Ghi chú |
| -------- | ------- | ------- |
| Branch hiện tại | `main` | Không tạo branch/commit/push. |
| DATABASE_URL trong `.env` | Detected: yes | Không in secret. |
| Database host | `localhost` | Không phải remote DB. |
| Database name | `construction_erp` | Môi trường sandbox/dev nội bộ. |
| `.env.local` DATABASE_URL | Detected: no | Không override DB. |
| Production hint | Không phát hiện | Không thấy key/value production. |
| Production risk | LOW | Có thể lập kế hoạch sandbox. |
| Build baseline | PASS_WITH_WARNINGS | Warning cũ Turbopack NFT trace và `url.parse`. |

Nếu chuyển sang DB remote/production, phải dừng ngay với:

```text
BLOCKED_PRODUCTION_RISK
```

## 3. Proposed Apply Scope

| Nhóm | Tổng dòng | Sẽ apply test | Không apply | Lý do |
| ---- | --------: | ------------: | ----------: | ----- |
| Project -> Company | 19 | 18 | 1 | Validator test-only PASS; 18 dòng có `APPROVED_FOR_BACKFILL` + `BACKFILL_COMPANY`; 1 dòng manual review. |
| CASH_BANK Journal | 25 | 0 | 25 | Validator WARNING; tất cả giữ `MANUAL_REVIEW`, không có dòng backfill/non-project hợp lệ. |
| AP Bát Tràng | 26 | 0 | 26 | Validator WARNING; tất cả giữ `MANUAL_REVIEW`/`NO_ACTION`, không sửa AP/ledger. |

## 4. Project Company Apply Detail

Các dòng dưới đây chỉ là phạm vi apply test-only nếu user xác nhận ở phase sau.

| projectId | projectCode | projectName | currentCompanyId | approvedCompanyId | action |
| --------- | ----------- | ----------- | ---------------- | ----------------- | ------ |
| `091ba671-4cdf-4b8d-84c7-240d21692824` | `091ba671-4cdf-4b8d-84c7-240d21692824` | `Project TEST_PHASE2_3B_HARDENING_1779953123540` |  | `13ed4531-4450-4ea0-b48a-ad4aa29877ac` | `BACKFILL_COMPANY` |
| `7c8fa82c-1344-4a49-881d-7e0d38267b63` | `7c8fa82c-1344-4a49-881d-7e0d38267b63` | `Project TEST_PHASE2_3B_HARDENING_1779953160979` |  | `c7391a8c-f0b8-44ec-bd10-fd2725544f1b` | `BACKFILL_COMPANY` |
| `c1f8d981-2be1-438f-8eec-82dea6ac687e` | `c1f8d981-2be1-438f-8eec-82dea6ac687e` | `Project TEST_PHASE2_3B_HARDENING_1779953268719` |  | `62f7f167-dcf8-4904-a7a8-b55320f14a79` | `BACKFILL_COMPANY` |
| `975c1f22-5aaa-418f-9696-c68cbc3cd283` | `975c1f22-5aaa-418f-9696-c68cbc3cd283` | `Project TEST_PHASE2_3B_HARDENING_1779953401728` |  | `bf901dca-c199-4832-92f4-d349a7726fa7` | `BACKFILL_COMPANY` |
| `b36f16ef-0419-4aba-a405-6e174f475d8f` | `b36f16ef-0419-4aba-a405-6e174f475d8f` | `Project TEST_PHASE2_3B_HARDENING_1779953501203` |  | `adde9756-d23c-4f98-a487-4cb5e68eaeae` | `BACKFILL_COMPANY` |
| `51644eab-34d4-446d-8843-a3c69b593e4a` | `51644eab-34d4-446d-8843-a3c69b593e4a` | `Project TEST_PHASE2_3B_HARDENING_1779953734199` |  | `fe2ead7b-b383-402a-8a59-745e9dc87d25` | `BACKFILL_COMPANY` |
| `f2ee65a1-d338-4cef-9cc5-2cc3c453f2e8` | `f2ee65a1-d338-4cef-9cc5-2cc3c453f2e8` | `Project TEST_PHASE2_3B_HARDENING_1779953871854` |  | `4421d43b-c058-4a40-9b41-19635196aa0f` | `BACKFILL_COMPANY` |
| `89dfb5f8-330c-434c-a12a-a78c81267158` | `89dfb5f8-330c-434c-a12a-a78c81267158` | `Project TEST_PHASE2_3B_HARDENING_1779954022218` |  | `182bd925-6ad8-438b-8fc6-3d5a0d783919` | `BACKFILL_COMPANY` |
| `6986c4d0-8eb0-4f43-96cc-a9463e86c5ab` | `6986c4d0-8eb0-4f43-96cc-a9463e86c5ab` | `Project TEST_PHASE2_3B_HARDENING_1779954051332` |  | `30908c53-b1cc-456b-8412-6e798239ea83` | `BACKFILL_COMPANY` |
| `c6ebeb6b-dfec-43fb-ae9e-282d266a3deb` | `c6ebeb6b-dfec-43fb-ae9e-282d266a3deb` | `Project TEST_PHASE2_3B_HARDENING_1779954487869` |  | `75213224-7b44-4a51-bc70-2ab5a51becbf` | `BACKFILL_COMPANY` |
| `d5c0b467-fdb9-4668-8d12-796fff4288cf` | `d5c0b467-fdb9-4668-8d12-796fff4288cf` | `Project TEST_PHASE2_3B_HARDENING_1779954531626` |  | `0246280d-b169-419c-938d-4c6b894d47df` | `BACKFILL_COMPANY` |
| `b0d32c00-1711-4e0e-8ae5-917905eb6d47` | `b0d32c00-1711-4e0e-8ae5-917905eb6d47` | `Project TEST_PHASE2_3B_HARDENING_1779954729510` |  | `bb1678b0-8207-4e73-b659-521f091f184c` | `BACKFILL_COMPANY` |
| `3f579fe6-5aad-4348-b49d-411f121e6cb1` | `3f579fe6-5aad-4348-b49d-411f121e6cb1` | `Project TEST_PHASE2_3B_HARDENING_1779954769748` |  | `232a20a0-c873-4526-9d97-4f87666915a0` | `BACKFILL_COMPANY` |
| `3d61f59a-e7e6-40d1-8be7-8c44f7ee0916` | `3d61f59a-e7e6-40d1-8be7-8c44f7ee0916` | `Project TEST_PHASE2_3B_HARDENING_1779954828451` |  | `c9a1d1dd-c1d4-4e6b-8933-9e531fcc2d5c` | `BACKFILL_COMPANY` |
| `eb50f4aa-09bb-433b-8049-4ae44a3b7b5c` | `eb50f4aa-09bb-433b-8049-4ae44a3b7b5c` | `Project TEST_PHASE2_3B_HARDENING_1779954914482` |  | `65f7da9f-8e29-4989-bb8b-9fa89f9fcb0f` | `BACKFILL_COMPANY` |
| `8056bf95-1055-4e81-84e6-08bd2d5bb35b` | `8056bf95-1055-4e81-84e6-08bd2d5bb35b` | `Project TEST_PHASE2_3B_HARDENING_1779954934653` |  | `5755559d-b2c0-4128-99d9-9b98971133c6` | `BACKFILL_COMPANY` |
| `2d5210bd-e265-4632-82cc-526cc204ef1f` | `2d5210bd-e265-4632-82cc-526cc204ef1f` | `Project TEST_PHASE2_3B_HARDENING_1779955180462` |  | `d4beb3e5-1a7f-46d3-be1c-31c7aede9dda` | `BACKFILL_COMPANY` |
| `54efc369-7a16-4bd8-adba-b1938585c19b` | `54efc369-7a16-4bd8-adba-b1938585c19b` | `Project TEST_PHASE2_3B_HARDENING_1779955247648` |  | `f972f36c-96be-4613-a819-4a07082dc117` | `BACKFILL_COMPANY` |

Decision reason trong file test-only đều có marker:

```text
TEST_ONLY_AI_APPROVAL
SANDBOX_VALIDATION_ONLY
NOT_FOR_PRODUCTION
NOT_HUMAN_APPROVAL
NOT_ACCOUNTING_SIGN_OFF
```

## 5. Exclusions

Không apply:

```text
Không apply 25 CASH_BANK Journal vì validator WARNING/manual review.
Không apply 26 AP Bát Tràng vì validator WARNING/manual review.
Không sửa ledger.
Không sửa payment/posting.
Không tạo adjustment.
Không đánh dấu NON_PROJECT_FINANCE.
Không update JournalEntry.projectId.
```

## 6. Apply Script Review

## 6.1 `apply-project-company-mapping.ts`

| Tiêu chí | Kết quả | Ghi chú |
| -------- | ------- | ------- |
| Nhận path qua env `PROJECT_COMPANY_MAPPING_PATH` | Có | Qua `mappingPathFromEnv`. |
| Có dry-run mode | Không | Script hiện tại update DB ngay khi chạy. |
| Có ghi audit log | Có | Tạo `AuditLog` action `DATA_RECONCILIATION_BACKFILL`. |
| Có backup/snapshot tự động | Không | Chỉ ghi audit JSON sau apply. |
| Chỉ update dòng approved hợp lệ | Có một phần | Filter `ownerDecision=APPROVED_FOR_BACKFILL` và `action=BACKFILL_COMPANY`. |
| Chặn AI approval | Không | Không phân biệt test-only với human approval thật. |

Kết luận: không nên chạy script hiện tại trực tiếp cho Phase 2.7T nếu chưa thêm guard sandbox/test-only hoặc chưa có wrapper an toàn.

## 6.2 `apply-journal-project-mapping.ts`

| Tiêu chí | Kết quả | Ghi chú |
| -------- | ------- | ------- |
| Nhận path qua env `JOURNAL_PROJECT_MAPPING_PATH` | Có | Qua `mappingPathFromEnv`. |
| Có dry-run mode | Không | Script hiện tại update DB/ghi audit ngay khi chạy. |
| Có ghi audit log | Có | Ghi backfill và non-project audit. |
| Có backup/snapshot tự động | Không | Chỉ ghi audit JSON sau apply. |
| Chỉ update dòng approved hợp lệ | Có | Backfill project và non-project theo ownerDecision/action. |
| Chặn AI approval | Không | Không phân biệt test-only với human approval thật. |

Kết luận: không chạy trong Phase 2.7T vì CASH_BANK không có dòng apply và script hiện tại không có guard test-only.

## 6.3 Khuyến nghị script cho Phase 2.7T-APPLY

Nên tạo Phase 2.7T-APPLY riêng với guard:

```text
ALLOW_TEST_ONLY_AI_APPROVAL=true
REQUIRE_SANDBOX_DATABASE=true
PROJECT_COMPANY_MAPPING_PATH=.local-audit-quarantine/human-approval-package/test-only/project-company-mapping.test-approval.csv
```

Script/wrapper Phase 2.7T-APPLY phải:

- Check DB host là localhost.
- Check database name là `construction_erp` hoặc sandbox name được user xác nhận.
- Check file có marker `TEST_ONLY_AI_APPROVAL`.
- Chặn nếu path không nằm trong `/test-only/`.
- Tạo DB backup trước apply.
- Xuất rollback CSV trước apply.
- Chỉ apply 18 dòng Project -> Company.
- Không gọi `apply-journal-project-mapping.ts`.
- Không đụng AP Bát Tràng.

## 7. Backup Plan

## 7.1 PostgreSQL backup trước test apply

Không chạy trong phase này. Lệnh đề xuất:

```powershell
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = "D:\construction-erp\.local-audit-quarantine\db-backups\before-phase2_7T_$timestamp.sql"

New-Item -ItemType Directory -Force -Path "D:\construction-erp\.local-audit-quarantine\db-backups"

& "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" `
  --host localhost `
  --port 5432 `
  --username postgres `
  --format plain `
  --file $backupPath `
  construction_erp
```

Nếu PostgreSQL path khác, cần tìm `pg_dump.exe` tương ứng trước khi chạy.

## 7.2 Package backup

Đã có snapshot package test approval:

```text
.local-audit-quarantine/test-approval-backup/human-approval-package-before-test-approval/
```

## 8. Rollback Plan

## 8.1 Rollback full DB

Nếu cần phục hồi toàn DB:

```powershell
psql -U postgres -h localhost -p 5432 -d construction_erp -f <backupPath>
```

Cảnh báo: restore full DB có thể ghi đè dữ liệu phát sinh sau thời điểm backup.

## 8.2 Rollback targeted cho `Project.companyId`

Trước khi apply test-only, Phase 2.7T-APPLY phải xuất file:

```text
.local-audit-quarantine/test-approval-backup/phase2_7T_project_company_rollback.csv
```

Nội dung bắt buộc:

| projectId | beforeCompanyId | afterCompanyId |
| --------- | --------------- | -------------- |
| 18 dòng trong phạm vi apply | Giá trị trước apply | `approvedCompanyId` từ test-only CSV |

Rollback targeted sẽ set lại `Project.companyId` về `beforeCompanyId`.

Không chạy rollback trong phase này.

## 9. Proposed Commands For Next Phase

Chưa chạy các lệnh dưới đây trong phase này.

Phase sau có thể dùng command mẫu nếu user xác nhận:

```powershell
$env:ALLOW_TEST_ONLY_AI_APPROVAL="true"
$env:REQUIRE_SANDBOX_DATABASE="true"
$env:PROJECT_COMPANY_MAPPING_PATH=".local-audit-quarantine/human-approval-package/test-only/project-company-mapping.test-approval.csv"
npx tsx scripts/reconciliation/apply-project-company-mapping.ts
```

Nhưng do script hiện tại chưa có guard `ALLOW_TEST_ONLY_AI_APPROVAL` và chưa tạo backup/rollback tự động, khuyến nghị tốt hơn là tạo wrapper/script Phase 2.7T riêng trước khi chạy apply.

## 10. Required Owner/Test Confirmation Before Apply

Trước khi chạy Phase 2.7T apply test, user cần xác nhận nguyên văn:

```text
Tôi xác nhận đây là môi trường test/sandbox.
Tôi hiểu đây không phải human approval thật.
Tôi cho phép chạy apply test-only cho 18 dòng Project -> Company.
Tôi không cho phép apply CASH_BANK/AP Bát Tràng.
Tôi đã backup DB hoặc chấp nhận tạo backup trước apply.
```

Nếu thiếu xác nhận này, không được chạy apply.

## 11. Safety Confirmation

Đã xác nhận:

```text
Không sửa database trong phase này.
Không chạy apply script.
Không sửa Project.companyId.
Không sửa JournalEntry.projectId.
Không đánh dấu NON_PROJECT_FINANCE.
Không sửa AP Bát Tràng.
Không sửa ledger/posting/payment/source-of-truth.
Không sửa Prisma schema.
Không tạo migration.
Không reset database.
Không production ready.
```

## 12. Technical Test Results

| Lệnh | Kết quả | Ghi chú |
| ---- | ------- | ------- |
| `git status --short --untracked-files=all` | PASS kiểm tra hiện trạng | Có nhiều file/report từ phase trước; không revert. |
| `git branch --show-current` | PASS | Branch `main`. |
| `git log -5 --oneline` | PASS | Head `c8e8d4e app_v2_pate8`. |
| `npx prisma validate` | PASS | Schema hợp lệ. |
| `npx tsc --noEmit --pretty false` | PASS | Không có lỗi TypeScript. |
| `npm run build` | PASS_WITH_WARNINGS | Build pass; còn warning cũ Turbopack NFT trace và Node `url.parse`. |
| `npm run validation:database` | PASS | Read-only; posted journal sample balanced, orphan sample 0. |
| `npm run security-check` | PASS | Viewer bị chặn, Manager pass guard. |

## 13. Decision Gate

```text
A. READY_FOR_TEST_ONLY_PHASE2_7_APPLY_AFTER_USER_CONFIRMATION
```

Không production ready.

## 14. Đánh giá sau khi hoàn thành

## 14.1 Việc vừa làm giúp test hệ thống tốt hơn ở điểm nào?

Kế hoạch này biến test-only approval từ một bộ CSV thành một phạm vi apply có kiểm soát:

- Biết chính xác 18 dòng Project -> Company sẽ được apply nếu user xác nhận.
- Biết chính xác CASH_BANK và AP Bát Tràng không được apply.
- Biết script hiện tại có thiếu dry-run/backup/test-only guard.
- Có backup plan và rollback plan trước khi sửa DB.
- Có câu xác nhận bắt buộc trước khi chạy phase apply.

## 14.2 Rủi ro nếu chạy test apply là gì?

Rủi ro chính:

- `Project.companyId` của 18 project sandbox sẽ bị thay đổi.
- Nếu không backup, rollback sẽ khó hơn.
- Nếu nhầm file test-only thành human approval thật, có thể tạo tiền lệ sai về governance.
- Script hiện tại không có dry-run và không chặn AI approval, nên cần wrapper/guard trước khi chạy.
- Nếu DB không còn là sandbox/local, apply có thể gây sai dữ liệu thật.

## 14.3 Có phần nào vẫn không được apply không?

Không được apply:

- 25 CASH_BANK Journal.
- 26 AP Bát Tràng.
- Mọi update `JournalEntry.projectId`.
- Mọi đánh dấu `NON_PROJECT_FINANCE`.
- Mọi sửa ledger/payment/posting/source-of-truth.
- Mọi adjustment journal.

## 14.4 Có phần nào vẫn đang bị blocker cho production không?

Production vẫn bị chặn:

- Chưa có human approval thật.
- Chưa có sign-off kế toán/owner thật.
- Test-only approval không thay thế được xác nhận kế toán.
- CASH_BANK và AP Bát Tràng vẫn cần người thật quyết định.

Gate production vẫn là:

```text
D. WAITING_FOR_REAL_HUMAN_APPROVAL_FOR_PRODUCTION
```

## 14.5 Nếu tiếp tục test sandbox, bước tiếp theo nên làm gì?

Nên thực hiện:

```text
Phase 2.7T-APPLY - Test-only Apply Approved Project Company Mapping on Sandbox
```

Nhưng phase đó phải:

- Tạo DB backup thật trước apply.
- Tạo rollback CSV trước apply.
- Check DB host local.
- Check marker `TEST_ONLY_AI_APPROVAL`.
- Chỉ apply 18 dòng Project -> Company.
- Không apply CASH_BANK/AP.

## 14.6 Nếu muốn production thật, bước tiếp theo nên làm gì?

Quay lại human approval thật:

1. Gửi package cho kế toán/owner.
2. Kế toán/owner điền 3 CSV gốc.
3. Kế toán/owner ký `04_SIGN_OFF_FORM.md`.
4. Chạy lại Phase 2.9B.
5. Validator PASS.
6. Owner xác nhận cuối cùng.
7. Lập plan Phase 2.7 production apply.

## 14.7 Gate hiện tại

Gate test-only:

```text
A. READY_FOR_TEST_ONLY_PHASE2_7_APPLY_AFTER_USER_CONFIRMATION
```

Gate production:

```text
D. WAITING_FOR_REAL_HUMAN_APPROVAL_FOR_PRODUCTION
```


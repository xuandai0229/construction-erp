# PHASE 2.7T TEST-ONLY APPLY RESULT REPORT

Ngày thực hiện: 2026-06-04  
Workspace: `D:\construction-erp`  
Phạm vi: Test-only apply Project -> Company trên sandbox.

## 1. Executive Summary

Đây là test-only/sandbox apply, không phải production apply.

Markers bắt buộc:

```text
TEST_ONLY_AI_APPROVAL
SANDBOX_VALIDATION_ONLY
NOT_FOR_PRODUCTION
NOT_HUMAN_APPROVAL
NOT_ACCOUNTING_SIGN_OFF
DO_NOT_USE_FOR_REAL_ACCOUNTING
```

Kết quả:

- Đã tạo backup DB thật trước apply.
- Đã tạo rollback CSV trước apply.
- Đã tạo script apply test-only có guard.
- Đã apply 18 dòng Project -> Company từ file test-only.
- Không apply CASH_BANK Journal.
- Không apply AP Bát Tràng.
- Không update `JournalEntry.projectId`.
- Không đánh dấu `NON_PROJECT_FINANCE`.
- Không sửa ledger/posting/payment/source-of-truth.
- Không sửa Prisma schema, không tạo migration.
- Không production ready.

Lưu ý kỹ thuật: 18 dòng được apply đều có `beforeCompanyId = afterCompanyId`, nghĩa là dữ liệu DB đã khớp với `approvedCompanyId` trước apply. Script vẫn tạo AuditLog test-only cho từng dòng để kiểm thử luồng audit/apply.

Decision gate test-only:

```text
A. TEST_ONLY_APPLY_COMPLETED_SANDBOX_VALIDATION_PASS
```

Production status:

```text
D. WAITING_FOR_REAL_HUMAN_APPROVAL_FOR_PRODUCTION
```

## 2. Environment Safety

| Hạng mục | Kết quả | Ghi chú |
| -------- | ------- | ------- |
| Branch hiện tại | `main` | Không tạo branch/commit/push. |
| `.env` DATABASE_URL | Detected: yes | Không in secret. |
| Database host | `localhost` | Sandbox/local. |
| Database name | `construction_erp` | Không phát hiện production hint. |
| `.env.local` DATABASE_URL | Detected: no | Không override DB. |
| Production risk | LOW | Cho phép test-only apply. |
| Guard `ALLOW_TEST_ONLY_AI_APPROVAL` | PASS | Required before script run. |
| Guard `REQUIRE_SANDBOX_DATABASE` | PASS | Required before script run. |
| Mapping path in `/test-only/` | PASS | Chỉ dùng file test-only. |
| Required markers | PASS | File có marker test-only/not-production. |

## 3. Backup Result

| Backup | Kết quả | Đường dẫn |
| ------ | ------- | --------- |
| PostgreSQL backup | PASS | `D:\construction-erp\.local-audit-quarantine\db-backups\before-phase2_7T_20260604035102..sql` |
| Package backup | PASS | `.local-audit-quarantine/test-approval-backup/human-approval-package-before-test-approval/` |

Ghi chú: lần gọi `pg_dump` đầu tiên fail do cách truyền connection string trong PowerShell. Không có apply nào chạy trước backup thành công. Backup thành công được tạo bằng Node spawn với password qua env, không in secret.

## 4. Rollback Snapshot

| File | Kết quả | Ghi chú |
| ---- | ------- | ------- |
| `.local-audit-quarantine/test-approval-backup/phase2_7T_project_company_rollback.csv` | PASS | Có 18 dòng, gồm `projectId`, `projectCode`, `projectName`, `beforeCompanyId`, `afterCompanyId`, `testApprovalReason`. |
| `.local-audit-quarantine/test-approval-backup/PHASE2_7T_ROLLBACK_INSTRUCTIONS.md` | PASS | Có hướng dẫn full DB restore và rollback targeted. |

## 5. Apply Result

| projectId | projectName | beforeCompanyId | afterCompanyId | Result |
| --------- | ----------- | --------------- | -------------- | ------ |
| `091ba671-4cdf-4b8d-84c7-240d21692824` | `Project TEST_PHASE2_3B_HARDENING_1779953123540` | `13ed4531-4450-4ea0-b48a-ad4aa29877ac` | `13ed4531-4450-4ea0-b48a-ad4aa29877ac` | UPDATED_TEST_ONLY |
| `7c8fa82c-1344-4a49-881d-7e0d38267b63` | `Project TEST_PHASE2_3B_HARDENING_1779953160979` | `c7391a8c-f0b8-44ec-bd10-fd2725544f1b` | `c7391a8c-f0b8-44ec-bd10-fd2725544f1b` | UPDATED_TEST_ONLY |
| `c1f8d981-2be1-438f-8eec-82dea6ac687e` | `Project TEST_PHASE2_3B_HARDENING_1779953268719` | `62f7f167-dcf8-4904-a7a8-b55320f14a79` | `62f7f167-dcf8-4904-a7a8-b55320f14a79` | UPDATED_TEST_ONLY |
| `975c1f22-5aaa-418f-9696-c68cbc3cd283` | `Project TEST_PHASE2_3B_HARDENING_1779953401728` | `bf901dca-c199-4832-92f4-d349a7726fa7` | `bf901dca-c199-4832-92f4-d349a7726fa7` | UPDATED_TEST_ONLY |
| `b36f16ef-0419-4aba-a405-6e174f475d8f` | `Project TEST_PHASE2_3B_HARDENING_1779953501203` | `adde9756-d23c-4f98-a487-4cb5e68eaeae` | `adde9756-d23c-4f98-a487-4cb5e68eaeae` | UPDATED_TEST_ONLY |
| `51644eab-34d4-446d-8843-a3c69b593e4a` | `Project TEST_PHASE2_3B_HARDENING_1779953734199` | `fe2ead7b-b383-402a-8a59-745e9dc87d25` | `fe2ead7b-b383-402a-8a59-745e9dc87d25` | UPDATED_TEST_ONLY |
| `f2ee65a1-d338-4cef-9cc5-2cc3c453f2e8` | `Project TEST_PHASE2_3B_HARDENING_1779953871854` | `4421d43b-c058-4a40-9b41-19635196aa0f` | `4421d43b-c058-4a40-9b41-19635196aa0f` | UPDATED_TEST_ONLY |
| `89dfb5f8-330c-434c-a12a-a78c81267158` | `Project TEST_PHASE2_3B_HARDENING_1779954022218` | `182bd925-6ad8-438b-8fc6-3d5a0d783919` | `182bd925-6ad8-438b-8fc6-3d5a0d783919` | UPDATED_TEST_ONLY |
| `6986c4d0-8eb0-4f43-96cc-a9463e86c5ab` | `Project TEST_PHASE2_3B_HARDENING_1779954051332` | `30908c53-b1cc-456b-8412-6e798239ea83` | `30908c53-b1cc-456b-8412-6e798239ea83` | UPDATED_TEST_ONLY |
| `c6ebeb6b-dfec-43fb-ae9e-282d266a3deb` | `Project TEST_PHASE2_3B_HARDENING_1779954487869` | `75213224-7b44-4a51-bc70-2ab5a51becbf` | `75213224-7b44-4a51-bc70-2ab5a51becbf` | UPDATED_TEST_ONLY |
| `d5c0b467-fdb9-4668-8d12-796fff4288cf` | `Project TEST_PHASE2_3B_HARDENING_1779954531626` | `0246280d-b169-419c-938d-4c6b894d47df` | `0246280d-b169-419c-938d-4c6b894d47df` | UPDATED_TEST_ONLY |
| `b0d32c00-1711-4e0e-8ae5-917905eb6d47` | `Project TEST_PHASE2_3B_HARDENING_1779954729510` | `bb1678b0-8207-4e73-b659-521f091f184c` | `bb1678b0-8207-4e73-b659-521f091f184c` | UPDATED_TEST_ONLY |
| `3f579fe6-5aad-4348-b49d-411f121e6cb1` | `Project TEST_PHASE2_3B_HARDENING_1779954769748` | `232a20a0-c873-4526-9d97-4f87666915a0` | `232a20a0-c873-4526-9d97-4f87666915a0` | UPDATED_TEST_ONLY |
| `3d61f59a-e7e6-40d1-8be7-8c44f7ee0916` | `Project TEST_PHASE2_3B_HARDENING_1779954828451` | `c9a1d1dd-c1d4-4e6b-8933-9e531fcc2d5c` | `c9a1d1dd-c1d4-4e6b-8933-9e531fcc2d5c` | UPDATED_TEST_ONLY |
| `eb50f4aa-09bb-433b-8049-4ae44a3b7b5c` | `Project TEST_PHASE2_3B_HARDENING_1779954914482` | `65f7da9f-8e29-4989-bb8b-9fa89f9fcb0f` | `65f7da9f-8e29-4989-bb8b-9fa89f9fcb0f` | UPDATED_TEST_ONLY |
| `8056bf95-1055-4e81-84e6-08bd2d5bb35b` | `Project TEST_PHASE2_3B_HARDENING_1779954934653` | `5755559d-b2c0-4128-99d9-9b98971133c6` | `5755559d-b2c0-4128-99d9-9b98971133c6` | UPDATED_TEST_ONLY |
| `2d5210bd-e265-4632-82cc-526cc204ef1f` | `Project TEST_PHASE2_3B_HARDENING_1779955180462` | `d4beb3e5-1a7f-46d3-be1c-31c7aede9dda` | `d4beb3e5-1a7f-46d3-be1c-31c7aede9dda` | UPDATED_TEST_ONLY |
| `54efc369-7a16-4bd8-adba-b1938585c19b` | `Project TEST_PHASE2_3B_HARDENING_1779955247648` | `f972f36c-96be-4613-a819-4a07082dc117` | `f972f36c-96be-4613-a819-4a07082dc117` | UPDATED_TEST_ONLY |

AuditLog:

- 18 audit logs action `TEST_ONLY_DATA_RECONCILIATION_BACKFILL` được tạo cho entity `Project`.
- Reason có marker `TEST_ONLY_AI_APPROVAL_SANDBOX`.
- `newData` có `notForProduction`, `sandboxValidationOnly`, `notHumanApproval`, `notAccountingSignOff`.

## 6. Exclusion Confirmation

```text
CASH_BANK Journal: 0 update.
AP Bát Tràng: 0 update.
JournalEntry.projectId: 0 update.
Ledger/posting/payment: 0 update.
TransactionLine: 0 update.
NON_PROJECT_FINANCE: 0 update.
Adjustment journal: 0 created.
```

Targeted validation confirmed:

```text
approvedRows: 18
rollbackRows: 18
manualRows: 1
journalEntryUpdatesDetected: 0
issues: 0
```

## 7. Validation Results

| Check | Kết quả | Ghi chú |
| ----- | ------- | ------- |
| Apply script guard env | PASS | Required `ALLOW_TEST_ONLY_AI_APPROVAL=true`, `REQUIRE_SANDBOX_DATABASE=true`. |
| Apply script path guard | PASS | Mapping path under `.local-audit-quarantine/human-approval-package/test-only/`. |
| Marker guard | PASS | File contains all test-only/not-production markers. |
| Expected apply count | PASS | Exactly 18 rows. |
| Rollback CSV | PASS | 18 rows created before transaction. |
| Apply result | PASS | 18 rows processed. |
| Targeted validation | PASS | Project company after values match, no JournalEntry test update. |
| `npx prisma validate` | PASS | Schema valid. |
| `npx tsc --noEmit --pretty false` | PASS | No TypeScript error. |
| `npm run build` | PASS_WITH_WARNINGS | Build pass; old Turbopack NFT trace and `url.parse` warnings remain. |
| `npm run validation:database` | PASS | Read-only validation; posted journal sample balanced, orphan sample 0. |
| `npm run security-check` | PASS | Viewer blocked, Manager passed. |
| `npm run e2e -- tests/e2e/enterprise-smoke.spec.ts` | PASS | 3/3 tests passed. |

## 8. Safety Warning

```text
TEST_ONLY_AI_APPROVAL
SANDBOX_VALIDATION_ONLY
NOT_FOR_PRODUCTION
NOT_HUMAN_APPROVAL
NOT_ACCOUNTING_SIGN_OFF
DO_NOT_USE_FOR_REAL_ACCOUNTING
```

Không được dùng kết quả này làm human approval thật. Không được dùng để kết luận báo cáo tài chính thật. Không production ready.

## 9. Production Status

```text
D. WAITING_FOR_REAL_HUMAN_APPROVAL_FOR_PRODUCTION
```

Production vẫn cần:

- Kế toán/owner điền 3 CSV gốc.
- Kế toán/owner ký `04_SIGN_OFF_FORM.md`.
- Chạy lại Phase 2.9B.
- Validator production approval PASS.
- Owner xác nhận cuối cùng trước apply thật.

## 10. Decision Gate

```text
A. TEST_ONLY_APPLY_COMPLETED_SANDBOX_VALIDATION_PASS
```

## 11. Đánh giá sau khi hoàn thành

## 11.1 Việc vừa làm giúp test hệ thống tốt hơn ở điểm nào?

Phase 2.7T-APPLY đã kiểm thử end-to-end luồng test-only cho Project -> Company:

- Kiểm tra guard sandbox.
- Tạo backup DB thật.
- Tạo rollback CSV.
- Chạy apply có transaction và AuditLog.
- Chạy targeted validation sau apply.
- Xác nhận không đụng CASH_BANK/AP/ledger/payment/posting.

Điểm quan trọng: hệ thống đã chứng minh được đường test migration có thể chạy có kiểm soát trong sandbox.

## 11.2 Có rủi ro nào phát sinh sau test apply không?

Rủi ro còn lại:

- 18 AuditLog test-only đã được tạo trong DB sandbox.
- 18 project đã được update idempotent, dù before/after giống nhau.
- Nếu ai nhầm đây là approval thật sẽ gây sai governance.
- Backup file cần được giữ lại cho đến khi không cần rollback.

Không phát hiện lỗi validation sau apply.

## 11.3 Có cần rollback không?

Hiện chưa cần rollback vì:

- Targeted validation PASS.
- Database validation PASS.
- Enterprise smoke PASS.
- `beforeCompanyId` và `afterCompanyId` của 18 dòng đều giống nhau.
- Không có update ngoài phạm vi được phát hiện.

Nếu muốn dọn sandbox về trước khi test, có thể rollback theo:

```text
.local-audit-quarantine/test-approval-backup/PHASE2_7T_ROLLBACK_INSTRUCTIONS.md
```

## 11.4 Những phần nào vẫn chưa được apply?

Chưa apply:

- 1 dòng Project -> Company manual review.
- 25 CASH_BANK Journal.
- 26 AP Bát Tràng.
- Mọi `JournalEntry.projectId`.
- Mọi `NON_PROJECT_FINANCE`.
- Mọi ledger/posting/payment/source-of-truth.

## 11.5 Những phần nào vẫn chặn production?

Production vẫn bị chặn bởi:

- Không có human approval thật.
- Không có accounting sign-off thật.
- CASH_BANK Journal chưa được người thật quyết định.
- AP Bát Tràng chưa được người thật quyết định.
- Test-only approval không có giá trị kế toán thật.

## 11.6 Nếu tiếp tục test sandbox, bước tiếp theo nên làm gì?

Nên làm:

```text
Phase 2.7T-POST - Test-only Post-Apply Review & Optional Sandbox Rollback Decision
```

Mục tiêu:

- Review 18 AuditLog test-only.
- Xác nhận dashboard/report không bị lỗi.
- Quyết định giữ sandbox state hay rollback.
- Nếu rollback, chạy targeted rollback hoặc full DB restore theo hướng dẫn.

## 11.7 Nếu muốn production thật, bước tiếp theo nên làm gì?

Quay lại quy trình human approval thật:

1. Gửi package cho kế toán/owner.
2. Kế toán/owner điền CSV gốc.
3. Kế toán/owner ký sign-off.
4. Chạy lại Phase 2.9B.
5. Validator PASS.
6. Lập Phase 2.7 production apply plan.
7. Backup và apply thật chỉ sau khi owner xác nhận.

## 11.8 Gate hiện tại

Gate test-only:

```text
A. TEST_ONLY_APPLY_COMPLETED_SANDBOX_VALIDATION_PASS
```

Gate production:

```text
D. WAITING_FOR_REAL_HUMAN_APPROVAL_FOR_PRODUCTION
```

Không production ready.

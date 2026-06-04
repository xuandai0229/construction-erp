# PHASE 2.7T POST-APPLY REVIEW REPORT

Ngay thuc hien: 2026-06-04
Workspace: `D:\construction-erp`
Pham vi: Review sau test-only apply Project -> Company tren sandbox.

Markers bat buoc:

```text
TEST_ONLY_AI_APPROVAL
SANDBOX_VALIDATION_ONLY
NOT_FOR_PRODUCTION
NOT_HUMAN_APPROVAL
NOT_ACCOUNTING_SIGN_OFF
DO_NOT_USE_FOR_REAL_ACCOUNTING
```

## 1. Executive Summary

Phase 2.7T post-apply review da hoan thanh.

Ket luan:

- Project -> Company mapping sau apply: PASS.
- AuditLog test-only: PASS.
- Khong phat hien update ngoai pham vi Phase 2.7T.
- UI/report smoke: PASS.
- Rollback CSV va rollback instruction con ton tai.
- Khong can rollback sandbox o thoi diem review.
- Production chua ready va van phai cho human approval that.

Rollback decision:

```text
KEEP_SANDBOX_STATE
```

Ly do:

- 18 dong apply test-only la idempotent: `beforeCompanyId = afterCompanyId`.
- 18 project dang co `companyId` dung bang `approvedCompanyId`.
- 18 AuditLog test-only co du marker an toan.
- Khong co test-only audit log cho `JournalEntry` hoac `TransactionLine`.
- Enterprise smoke, visual pilot va report Excel A4 pilot deu PASS.

Luu y artifact: file apply report va mot so `testApprovalReason` trong rollback CSV hien co mojibake tieng Viet tu phase truoc. Day la warning ve tai lieu/test-only artifact, khong lam sai `projectId`, `beforeCompanyId`, `afterCompanyId` hoac ket qua verify DB. Phase nay khong sua cac artifact do vi yeu cau la post-apply review read-only.

Production status:

```text
D. WAITING_FOR_REAL_HUMAN_APPROVAL_FOR_PRODUCTION
```

## 2. Files Reviewed

| File | Ton tai | Ghi chu |
| ---- | ------- | ------- |
| `PHASE2_7T_TEST_ONLY_APPLY_RESULT_REPORT.md` | PASS | Co ghi backup path va gate test-only. Co mojibake trong mot so noi dung tieng Viet tu phase truoc. |
| `.local-audit-quarantine/test-approval-backup/phase2_7T_project_company_rollback.csv` | PASS | Co 18 dong data + 1 dong header. Co du `projectId`, `beforeCompanyId`, `afterCompanyId`. |
| `.local-audit-quarantine/test-approval-backup/PHASE2_7T_ROLLBACK_INSTRUCTIONS.md` | PASS | Co marker test-only va huong dan full DB restore/targeted rollback. |
| `.local-audit-quarantine/human-approval-package/test-only/project-company-mapping.test-approval.csv` | PASS | Co 19 dong mapping: 18 approved, 1 manual review. |
| `scripts/reconciliation/verify-phase2_7T-post-apply.ts` | CREATED | Script read-only de verify Project/AuditLog sau apply. |

Backup path da ghi trong report apply:

```text
D:\construction-erp\.local-audit-quarantine\db-backups\before-phase2_7T_20260604035102..sql
```

## 3. Project Company Verification

| Chi tieu | Ket qua | Ghi chu |
| -------- | ------- | ------- |
| Mapping rows | PASS | 19 dong: 18 test-approved, 1 manual review. |
| Approved rows | PASS | 18 dong hop le voi `APPROVED_FOR_BACKFILL` va `BACKFILL_COMPANY`. |
| Rollback rows | PASS | 18 dong rollback. |
| Project company match | PASS | 18/18 project co `companyId` hien tai bang `approvedCompanyId`. |
| Manual review untouched | PASS | 1 project manual review khong co AuditLog test-only. |
| Project ngoai scope | VERIFIED_BY_TARGETED_VALIDATION | Khong phat hien issue bang verify script va audit scope. |

Bang chi tiet Project -> Company:

| projectId | projectName | companyId hien tai | expectedCompanyId | Ket qua |
| --------- | ----------- | ------------------ | ----------------- | ------- |
| `091ba671-4cdf-4b8d-84c7-240d21692824` | Project TEST_PHASE2_3B_HARDENING_1779953123540 | `13ed4531-4450-4ea0-b48a-ad4aa29877ac` | `13ed4531-4450-4ea0-b48a-ad4aa29877ac` | PASS |
| `7c8fa82c-1344-4a49-881d-7e0d38267b63` | Project TEST_PHASE2_3B_HARDENING_1779953160979 | `c7391a8c-f0b8-44ec-bd10-fd2725544f1b` | `c7391a8c-f0b8-44ec-bd10-fd2725544f1b` | PASS |
| `c1f8d981-2be1-438f-8eec-82dea6ac687e` | Project TEST_PHASE2_3B_HARDENING_1779953268719 | `62f7f167-dcf8-4904-a7a8-b55320f14a79` | `62f7f167-dcf8-4904-a7a8-b55320f14a79` | PASS |
| `975c1f22-5aaa-418f-9696-c68cbc3cd283` | Project TEST_PHASE2_3B_HARDENING_1779953401728 | `bf901dca-c199-4832-92f4-d349a7726fa7` | `bf901dca-c199-4832-92f4-d349a7726fa7` | PASS |
| `b36f16ef-0419-4aba-a405-6e174f475d8f` | Project TEST_PHASE2_3B_HARDENING_1779953501203 | `adde9756-d23c-4f98-a487-4cb5e68eaeae` | `adde9756-d23c-4f98-a487-4cb5e68eaeae` | PASS |
| `51644eab-34d4-446d-8843-a3c69b593e4a` | Project TEST_PHASE2_3B_HARDENING_1779953734199 | `fe2ead7b-b383-402a-8a59-745e9dc87d25` | `fe2ead7b-b383-402a-8a59-745e9dc87d25` | PASS |
| `f2ee65a1-d338-4cef-9cc5-2cc3c453f2e8` | Project TEST_PHASE2_3B_HARDENING_1779953871854 | `4421d43b-c058-4a40-9b41-19635196aa0f` | `4421d43b-c058-4a40-9b41-19635196aa0f` | PASS |
| `89dfb5f8-330c-434c-a12a-a78c81267158` | Project TEST_PHASE2_3B_HARDENING_1779954022218 | `182bd925-6ad8-438b-8fc6-3d5a0d783919` | `182bd925-6ad8-438b-8fc6-3d5a0d783919` | PASS |
| `6986c4d0-8eb0-4f43-96cc-a9463e86c5ab` | Project TEST_PHASE2_3B_HARDENING_1779954051332 | `30908c53-b1cc-456b-8412-6e798239ea83` | `30908c53-b1cc-456b-8412-6e798239ea83` | PASS |
| `c6ebeb6b-dfec-43fb-ae9e-282d266a3deb` | Project TEST_PHASE2_3B_HARDENING_1779954487869 | `75213224-7b44-4a51-bc70-2ab5a51becbf` | `75213224-7b44-4a51-bc70-2ab5a51becbf` | PASS |
| `d5c0b467-fdb9-4668-8d12-796fff4288cf` | Project TEST_PHASE2_3B_HARDENING_1779954531626 | `0246280d-b169-419c-938d-4c6b894d47df` | `0246280d-b169-419c-938d-4c6b894d47df` | PASS |
| `b0d32c00-1711-4e0e-8ae5-917905eb6d47` | Project TEST_PHASE2_3B_HARDENING_1779954729510 | `bb1678b0-8207-4e73-b659-521f091f184c` | `bb1678b0-8207-4e73-b659-521f091f184c` | PASS |
| `3f579fe6-5aad-4348-b49d-411f121e6cb1` | Project TEST_PHASE2_3B_HARDENING_1779954769748 | `232a20a0-c873-4526-9d97-4f87666915a0` | `232a20a0-c873-4526-9d97-4f87666915a0` | PASS |
| `3d61f59a-e7e6-40d1-8be7-8c44f7ee0916` | Project TEST_PHASE2_3B_HARDENING_1779954828451 | `c9a1d1dd-c1d4-4e6b-8933-9e531fcc2d5c` | `c9a1d1dd-c1d4-4e6b-8933-9e531fcc2d5c` | PASS |
| `eb50f4aa-09bb-433b-8049-4ae44a3b7b5c` | Project TEST_PHASE2_3B_HARDENING_1779954914482 | `65f7da9f-8e29-4989-bb8b-9fa89f9fcb0f` | `65f7da9f-8e29-4989-bb8b-9fa89f9fcb0f` | PASS |
| `8056bf95-1055-4e81-84e6-08bd2d5bb35b` | Project TEST_PHASE2_3B_HARDENING_1779954934653 | `5755559d-b2c0-4128-99d9-9b98971133c6` | `5755559d-b2c0-4128-99d9-9b98971133c6` | PASS |
| `2d5210bd-e265-4632-82cc-526cc204ef1f` | Project TEST_PHASE2_3B_HARDENING_1779955180462 | `d4beb3e5-1a7f-46d3-be1c-31c7aede9dda` | `d4beb3e5-1a7f-46d3-be1c-31c7aede9dda` | PASS |
| `54efc369-7a16-4bd8-adba-b1938585c19b` | Project TEST_PHASE2_3B_HARDENING_1779955247648 | `f972f36c-96be-4613-a819-4a07082dc117` | `f972f36c-96be-4613-a819-4a07082dc117` | PASS |

## 4. AuditLog Verification

| Chi tieu | Ket qua | Ghi chu |
| -------- | ------: | ------- |
| AuditLog action `TEST_ONLY_DATA_RECONCILIATION_BACKFILL` | 18 | PASS. |
| `entity = Project` | 18 | PASS. |
| `reason` co `TEST_ONLY_AI_APPROVAL_SANDBOX` | 18 | PASS. |
| `newData.notForProduction = true` | 18 | PASS. |
| `newData.sandboxValidationOnly = true` | 18 | PASS. |
| `newData.notHumanApproval = true` | 18 | PASS. |
| `newData.notAccountingSignOff = true` | 18 | PASS. |
| Manual review project co AuditLog test-only | 0 | PASS. |
| JournalEntry test-only audit log | 0 | PASS. |
| TransactionLine test-only audit log | 0 | PASS. |

## 5. Exclusion Verification

| Khu vuc | Ket qua | Ghi chu |
| ------- | ------- | ------- |
| CASH_BANK | PASS | VERIFIED_BY_TARGETED_VALIDATION va AuditLog scope: 0 `JournalEntry` test-only audit. |
| AP Bat Trang | PASS | VERIFIED_BY_AUDIT_LOG_SCOPE; khong co apply AP trong phase nay. |
| `JournalEntry.projectId` | PASS | Targeted validation: `journalEntryUpdatesDetected = 0`. |
| `TransactionLine` | PASS | AuditLog scope: 0 `TransactionLine` test-only audit. |
| Ledger/posting/payment | PASS | Khong chay script lien quan; validation database PASS. |
| `NON_PROJECT_FINANCE` | PASS | 0 audit action `NON_PROJECT` trong ngay review theo verify script. |
| Adjustment journal | PASS | Verify script khong phat hien adjustment journal test-only/AP Bat Trang. |

Muc do chung minh:

```text
VERIFIED_BY_TARGETED_VALIDATION
VERIFIED_BY_AUDIT_LOG_SCOPE
```

Khong day la forensic proof tuyet doi cho moi bang lich su, nhung du de xac nhan script Phase 2.7T khong tao dau vet update ngoai pham vi cho sandbox.

## 6. UI/Report Smoke Result

| Test | Ket qua | Ghi chu |
| ---- | ------- | ------- |
| `npm run e2e -- tests/e2e/enterprise-smoke.spec.ts` | PASS | 3/3 pass. Dashboard/projects/reports/API smoke khong co loi 500/failed request bat thuong. |
| `npm run e2e -- tests/e2e/report-excel-a4-pilot.spec.ts` | PASS | 2/2 pass. Reports page khong mojibake theo spec, CSV fallback co A4 pilot header. |
| `npm run e2e -- tests/e2e/visual-regression-pilot.spec.ts` | PASS | 2/2 pass. Core ERP screens va light/dark samples render duoc. |

## 7. Rollback Decision

```text
KEEP_SANDBOX_STATE
```

Khong khuyen nghi rollback ngay vi:

- Apply la test-only va idempotent.
- Data hien tai dung voi approved test mapping.
- AuditLog test-only co ich de tiep tuc kiem thu audit trail.
- Khong phat hien scope issue.
- UI/report smoke pass.

Rollback van co the thuc hien neu user muon xoa trang thai test sandbox:

- Full DB restore: dung backup SQL trong `.local-audit-quarantine/db-backups/`.
- Targeted rollback: dung rollback CSV `.local-audit-quarantine/test-approval-backup/phase2_7T_project_company_rollback.csv`.

Khong chay rollback trong phase nay.

## 8. Safety Warning

```text
TEST_ONLY_AI_APPROVAL
SANDBOX_VALIDATION_ONLY
NOT_FOR_PRODUCTION
NOT_HUMAN_APPROVAL
NOT_ACCOUNTING_SIGN_OFF
DO_NOT_USE_FOR_REAL_ACCOUNTING
```

Ket qua nay chi dung de kiem thu sandbox. Khong duoc dung thay cho human approval that, khong duoc dung lam can cu bao cao tai chinh that, va khong duoc tuyen bo production ready.

## 9. Production Status

```text
D. WAITING_FOR_REAL_HUMAN_APPROVAL_FOR_PRODUCTION
```

Production van bi chan boi:

- Chua co human approval that cho 19 dong Project -> Company.
- Chua co human approval that cho 25 dong CASH_BANK Journal.
- Chua co human approval that cho 26 dong AP Bat Trang.
- `04_SIGN_OFF_FORM.md` chua duoc ke toan/owner that ky.
- Phase 2.7 apply production chua duoc phep chay.

## 10. Decision Gate

```text
A. TEST_ONLY_POST_APPLY_REVIEW_PASS_KEEP_SANDBOX_STATE
```

Khong production ready.

## 11. Test Results

| Lenh | Ket qua | Ghi chu |
| ---- | ------- | ------- |
| `git status --short` | PASS | Worktree dirty tu cac phase truoc va file moi cua phase nay. |
| `git branch --show-current` | PASS | `main`. |
| `git log -5 --oneline` | PASS | Latest commit `c8e8d4e app_v2_pate8`. |
| `npx prisma validate` | PASS | Schema valid. |
| `npx tsc --noEmit --pretty false` | PASS | Khong co TypeScript error. |
| `npm run build` | PASS_WITH_WARNINGS | Build pass khi chay ngoai sandbox. Warning cu: Turbopack NFT trace qua `app/api/reports/audited-export/route.ts`/generated Prisma va `DEP0169 url.parse`. |
| `npm run validation:database` | PASS | Pass khi chay ngoai sandbox. Trong sandbox bi EPERM khi ghi `docs/audit/phase1-readonly-validation.json`. |
| `npm run security-check` | PASS | Viewer bi chan, Manager pass guard. |
| `npx tsx scripts/reconciliation/verify-phase2_7T-post-apply.ts` | PASS | Pass khi chay ngoai sandbox do `tsx/esbuild` bi EPERM spawn trong sandbox. |
| `npx tsx scripts/reconciliation/validate-phase2_7T-test-apply.ts` | PASS | Targeted validation pass. |
| `npm run e2e -- tests/e2e/enterprise-smoke.spec.ts` | PASS | 3/3 pass. |
| `npm run e2e -- tests/e2e/report-excel-a4-pilot.spec.ts` | PASS | 2/2 pass. |
| `npm run e2e -- tests/e2e/visual-regression-pilot.spec.ts` | PASS | 2/2 pass. |

## 12. Danh gia sau khi hoan thanh

### 12.1 Viec vua lam giup test he thong tot hon o diem nao?

- Xac nhan ket qua apply test-only khong lam lech Project -> Company.
- Xac nhan AuditLog co du marker an toan de phan biet test-only voi human approval that.
- Xac nhan UI/report smoke van pass sau sandbox apply.
- Xac nhan rollback package van ton tai de co the quay lai neu can.

### 12.2 Co can rollback sandbox khong?

Chua can rollback. Khuyen nghi giu sandbox state de tiep tuc kiem thu audit trail va cac luong validation sau apply.

### 12.3 Neu giu sandbox state thi loi ich/rui ro la gi?

Loi ich:

- Giu duoc AuditLog test-only de kiem thu trace.
- Co the tiep tuc test dashboard/report/drilldown trong trang thai da apply.
- Khong ton thoi gian restore khi khong co loi du lieu.

Rui ro:

- Neu nham test-only approval voi human approval that thi co the gay quy trinh sai. Rui ro nay da duoc giam bang marker `NOT_FOR_PRODUCTION`, `NOT_HUMAN_APPROVAL`, `NOT_ACCOUNTING_SIGN_OFF`.
- Artifact test-only co mot so mojibake trong ly do approval/rollback, nen khong duoc dung cho production hoac ban giao ke toan.

### 12.4 Phan nao van chua duoc kiem thu?

- Chua test apply CASH_BANK Journal vi tat ca 25 dong van manual review.
- Chua test apply AP Bat Trang vi tat ca 26 dong van manual review/NO_ACTION.
- Chua test production human approval path.
- Chua test rollback targeted thuc te, chi co instruction va snapshot.

### 12.5 Phan nao van chan production?

- Chua co ke toan/owner that duyet 3 CSV.
- Chua co sign-off that.
- AI test approval khong duoc xem la approval ke toan.
- Cac artifact test-only khong duoc dung lam can cu bao cao tai chinh that.

### 12.6 Neu tiep tuc test sandbox, buoc tiep theo nen lam gi?

Nen lam:

```text
Phase 2.7T-ROLLBACK-DRYRUN hoặc Phase 2.7T-AUDIT-TRACE-REVIEW
```

Uu tien thuc te:

1. Chay audit trace review de kiem tra UI/API co hien dung AuditLog test-only hay khong.
2. Neu can dam bao kha nang quay lai, lap dry-run targeted rollback plan va chi rollback khi user xac nhan.
3. Khong apply CASH_BANK/AP Bat Trang khi chua co human approval that.

### 12.7 Neu muon production that, buoc tiep theo nen lam gi?

Quay lai quy trinh human approval:

1. Gui `human-approval-package` cho ke toan/owner.
2. Yeu cau dien 3 CSV va ky `04_SIGN_OFF_FORM.md`.
3. Chay Phase 2.9B validator sau khi nhan lai.
4. Chi khi validator PASS va owner xac nhan moi lap plan apply production.

### 12.8 Gate hien tai la gi?

```text
A. TEST_ONLY_POST_APPLY_REVIEW_PASS_KEEP_SANDBOX_STATE
```

Production gate:

```text
D. WAITING_FOR_REAL_HUMAN_APPROVAL_FOR_PRODUCTION
```

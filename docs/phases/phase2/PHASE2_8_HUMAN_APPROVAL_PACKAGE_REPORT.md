# PHASE 2.8 HUMAN APPROVAL PACKAGE REPORT

Ngày thực hiện: 2026-06-02  
Workspace: `D:\construction-erp`  
Package nội bộ: `.local-audit-quarantine/human-approval-package/`

## 1. Executive Summary

Đã tạo bộ hồ sơ xác nhận dữ liệu Phase 2.8 trong thư mục quarantine nội bộ:

```text
.local-audit-quarantine/human-approval-package/
```

Do môi trường hiện tại không có `exceljs`, `xlsx`, `openpyxl` hoặc bundled spreadsheet runtime, không tạo được `.xlsx`. Đã tạo **CSV fallback** đầy đủ để mở bằng Excel/LibreOffice, kèm file hướng dẫn Markdown. Package có thông báo riêng:

```text
Excel generation unavailable, CSV fallback created.
```

Không sửa database. Không chạy apply script. Không rollback. Không tự approve mapping. Không sửa AP Bát Tràng. Không sửa query báo cáo chính thức.

Người cần xác nhận tiếp theo:

- Admin tenant/owner dữ liệu công trình.
- Kế toán trưởng.
- Kế toán ngân hàng/quỹ.
- Kế toán công nợ.
- Người phụ trách công trình Bát Tràng.

Chưa được sang Phase 3 thật với dữ liệu kế toán. Có thể tiếp tục UI test/pilot nội bộ nếu không dùng mapping AI-approved làm dữ liệu thật.

## 2. Package Files

| File | Mục đích | Người xử lý | Có chứa dữ liệu nhạy cảm | Có commit không |
| ---- | -------- | ----------- | ------------------------ | --------------- |
| `.local-audit-quarantine/human-approval-package/01_PROJECT_COMPANY_APPROVAL.csv` | Bảng xác nhận project thuộc company/pháp nhân nào | Admin/Kế toán trưởng/Owner dữ liệu | Có | Không |
| `.local-audit-quarantine/human-approval-package/01_PROJECT_COMPANY_APPROVAL_HUONG_DAN.md` | Hướng dẫn điền project-company | Admin/Kế toán trưởng | Không | Không, giữ cùng package nội bộ |
| `.local-audit-quarantine/human-approval-package/02_CASH_BANK_JOURNAL_APPROVAL.csv` | Bảng xác nhận journal cash/bank thuộc project, non-project, reversed hoặc review | Kế toán ngân hàng/quỹ/Kế toán công trình | Có | Không |
| `.local-audit-quarantine/human-approval-package/02_CASH_BANK_JOURNAL_APPROVAL_HUONG_DAN.md` | Hướng dẫn điền journal cash/bank | Kế toán ngân hàng/quỹ | Không | Không, giữ cùng package nội bộ |
| `.local-audit-quarantine/human-approval-package/03_PROJECT_BATTRANG_AP_APPROVAL.csv` | Bảng xác nhận từng dòng AP Bát Tràng | Kế toán công nợ/Kế toán trưởng | Có | Không |
| `.local-audit-quarantine/human-approval-package/03_PROJECT_BATTRANG_AP_TONG_QUAN.csv` | Tổng quan lệch AP Bát Tràng | Kế toán công nợ/Kế toán trưởng | Có | Không |
| `.local-audit-quarantine/human-approval-package/03_PROJECT_BATTRANG_AP_APPROVAL_HUONG_DAN.md` | Hướng dẫn điền AP Bát Tràng | Kế toán công nợ | Không | Không, giữ cùng package nội bộ |
| `.local-audit-quarantine/human-approval-package/04_SIGN_OFF_FORM.md` | Biên bản ký xác nhận | Người lập/Người kiểm tra/Kế toán trưởng/Owner | Không nếu chưa điền; có sau khi ký | Không |
| `.local-audit-quarantine/human-approval-package/05_APPROVAL_GUIDE_FOR_ACCOUNTING_TEAM.md` | Hướng dẫn chung cho đội kế toán | Toàn bộ nhóm kế toán | Không | Không, giữ cùng package nội bộ |
| `.local-audit-quarantine/human-approval-package/06_PHASE2_8_APPROVAL_PACKAGE_INDEX.md` | Mục lục package và quy tắc bảo mật | Kế toán/Kỹ thuật | Không | Không, giữ cùng package nội bộ |
| `.local-audit-quarantine/human-approval-package/project-company-mapping.for-approval.csv` | CSV đúng format validator project-company | Kế toán/Kỹ thuật | Có | Không |
| `.local-audit-quarantine/human-approval-package/journal-project-mapping.for-approval.csv` | CSV đúng format validator journal-project | Kế toán/Kỹ thuật | Có | Không |
| `.local-audit-quarantine/human-approval-package/project-battrang-ap-reconciliation.for-approval.csv` | CSV đúng format validator AP Bát Tràng | Kế toán/Kỹ thuật | Có | Không |
| `.local-audit-quarantine/human-approval-package/RUN_VALIDATION_AFTER_APPROVAL.md` | Lệnh chạy validator sau khi người thật điền | Kỹ thuật | Không | Không, giữ cùng package nội bộ |
| `.local-audit-quarantine/human-approval-package/EXCEL_FALLBACK_NOTICE.md` | Ghi chú vì sao dùng CSV fallback | Kế toán/Kỹ thuật | Không | Không, giữ cùng package nội bộ |

## 3. Approval Scope

| Nhóm | Số dòng | Người xác nhận | Trạng thái |
| ---- | ------: | -------------- | ---------- |
| Project -> Company | 19 | Admin tenant/Kế toán trưởng/Owner dữ liệu công trình | Chờ người thật xác nhận |
| Cash Bank Journal -> Project/Non-project | 25 | Kế toán ngân hàng/quỹ/Kế toán công trình/Kế toán trưởng | Chờ người thật xác nhận |
| AP Bát Tràng | 26 | Kế toán công nợ/Kế toán trưởng/Phụ trách công trình Bát Tràng | Chờ người thật xác nhận |

## 4. Workbook Detail

### Project Company

- Số dòng: 19.
- File chính: `.local-audit-quarantine/human-approval-package/01_PROJECT_COMPANY_APPROVAL.csv`.
- File validator: `.local-audit-quarantine/human-approval-package/project-company-mapping.for-approval.csv`.
- Cột quyết định: `ownerDecision`, `approvedCompanyId`, `approvedCompanyName`, `decisionReason`, `approvedBy`, `approvedRole`, `approvedAt`, `action`, `notes`.
- Trạng thái hiện tại: tất cả reset về `MANUAL_REVIEW`/`REVIEW_LATER`, không giữ approval AI.
- Người cần xử lý: Admin tenant, Kế toán trưởng, Owner dữ liệu công trình.

### Cash Bank Journal

- Số dòng: 25.
- File chính: `.local-audit-quarantine/human-approval-package/02_CASH_BANK_JOURNAL_APPROVAL.csv`.
- File validator: `.local-audit-quarantine/human-approval-package/journal-project-mapping.for-approval.csv`.
- Cột quyết định: `ownerDecision`, `approvedProjectId`, `approvedProjectName`, `nonProjectReason`, `decisionReason`, `approvedBy`, `approvedRole`, `approvedAt`, `action`, `notes`.
- Trạng thái hiện tại: tất cả reset về `MANUAL_REVIEW`/`REVIEW_LATER`, không giữ nhãn `NON_PROJECT_FINANCE` do AI tạo.
- Người cần xử lý: Kế toán ngân hàng/quỹ, Kế toán công trình, Kế toán trưởng.

### AP Bát Tràng

- Số dòng: 26.
- File chính: `.local-audit-quarantine/human-approval-package/03_PROJECT_BATTRANG_AP_APPROVAL.csv`.
- File tổng quan: `.local-audit-quarantine/human-approval-package/03_PROJECT_BATTRANG_AP_TONG_QUAN.csv`.
- File validator: `.local-audit-quarantine/human-approval-package/project-battrang-ap-reconciliation.for-approval.csv`.
- Cột quyết định: `ownerDecision`, `mappingAction`, `decisionReason`, `approvedBy`, `approvedRole`, `approvedAt`, `notes`.
- Trạng thái hiện tại: tất cả reset về `MANUAL_REVIEW`/`NO_ACTION`, không giữ đề xuất `FIX_RECONCILIATION_QUERY` do AI tạo.
- Người cần xử lý: Kế toán công nợ, Kế toán trưởng, Người phụ trách công trình Bát Tràng.

## 5. Validation Instructions

Sau khi người thật điền file và ký sign-off, chạy:

```powershell
$env:PROJECT_COMPANY_MAPPING_PATH=".local-audit-quarantine/human-approval-package/project-company-mapping.for-approval.csv"
npx tsx scripts/reconciliation/validate-project-company-mapping.ts

$env:JOURNAL_PROJECT_MAPPING_PATH=".local-audit-quarantine/human-approval-package/journal-project-mapping.for-approval.csv"
npx tsx scripts/reconciliation/validate-journal-project-mapping.ts

$env:BATTRANG_AP_MAPPING_PATH=".local-audit-quarantine/human-approval-package/project-battrang-ap-reconciliation.for-approval.csv"
npx tsx scripts/reconciliation/validate-project-battrang-ap-decision.ts
```

Kết quả hiện tại trước khi người thật điền:

- Project Company validator: `WARNING`, 19 dòng chưa approved, 0 issue.
- Cash Bank Journal validator: `WARNING`, 25 dòng chưa có quyết định owner, 0 issue.
- AP Bát Tràng validator: `WARNING`, 26 dòng manual review, 0 issue.

Đây là trạng thái đúng cho package chưa được người thật xác nhận. Không được chạy apply ở trạng thái `WARNING`.

## 6. Git/Security Notes

- Package nằm trong `.local-audit-quarantine/human-approval-package/`.
- `.local-audit-quarantine/` đang được `.gitignore` chặn.
- Kiểm tra `git check-ignore` xác nhận package không bị Git track.
- Không cần commit package vì chứa dữ liệu kế toán nhạy cảm.
- Các file tạo trong package phải chia sẻ qua kênh nội bộ an toàn.
- `npm run validation:database` đã cập nhật `docs/audit/phase1-readonly-validation.json`; đây là artifact validation do lệnh kiểm tra sinh ra.

## 7. Remaining Gate

```text
CHƯA ĐƯỢC APPLY DỮ LIỆU
CHƯA ĐƯỢC DÙNG LÀM SỔ KẾ TOÁN THẬT
CHỈ ĐƯỢC CHẠY PHASE 2.7 APPLY SAU KHI NGƯỜI THẬT ĐIỀN VÀ VALIDATOR PASS
```

## 8. Recommended Next Step

Nếu kế toán đã điền và ký:

```text
Run Phase 2.7 again with approved mapping package.
```

Nếu chưa có kế toán điền:

```text
Wait for human approval.
```

## 9. Test Results

| Lệnh | Kết quả | Ghi chú |
| --- | --- | --- |
| `git status --short` | PASS/WARNING | Package bị ignore; repo còn dirty state từ validation và các report Phase 2.7R chưa commit. |
| `npx prisma validate` | PASS | Prisma schema hợp lệ. |
| `npm run build` | PASS | Pass khi chạy với quyền ghi `.next`; còn warning cũ về Turbopack NFT trace và `url.parse()`. |
| `npm run validation:database` | PASS | Read-only validation pass; có cập nhật artifact `docs/audit/phase1-readonly-validation.json`. |
| `npm run security-check` | PASS | Viewer bị chặn, Manager pass guard. |
| `npm run e2e -- tests/e2e/enterprise-smoke.spec.ts` | PASS | 3 tests pass. |

# PHASE 2.8F ENCODING AND PILOT GATE REPORT

Ngày thực hiện: 2026-06-02  
Workspace: `D:\construction-erp`  
Phạm vi: sửa encoding package Phase 2.8, kiểm tra safety gate trước Phase 3A UI Pilot. Không sửa database, không apply mapping, không rollback.

## 1. Executive Summary

- Đã sửa encoding tiếng Việt UTF-8 trong 8 file Markdown của package Phase 2.8.
- `.local-audit-quarantine/human-approval-package/` vẫn bị Git ignore.
- Không phát hiện file nhạy cảm/tạm đang tracked theo nhóm kiểm tra: `.local-audit-quarantine`, mapping draft CSV, dump DB, debug scripts, Playwright report, Prisma temp DLL.
- 3 file mapping validator vẫn ở trạng thái chờ human approval; không có `approvedBy=Kế toán Trưởng`, không có `APPROVED_FOR_BACKFILL`, không có `NON_PROJECT_FINANCE`, không có `FIX_RECONCILIATION_QUERY`.
- Không sửa database, không chạy apply, không sửa AP Bát Tràng, không sửa ledger, không sửa query báo cáo chính thức.
- Đủ điều kiện mở **Phase 3A UI Pilot only**. Không production ready.

Decision gate:

```text
A. READY_FOR_PHASE3A_UI_PILOT_ONLY
```

## 2. Encoding Fixes

| File | Trạng thái trước | Trạng thái sau | Ghi chú |
| ---- | ---------------- | -------------- | ------- |
| `.local-audit-quarantine/human-approval-package/RUN_VALIDATION_AFTER_APPROVAL.md` | Mojibake: `Ch? ch?y`, `ng??i th?t`, `N?u validator` | UTF-8 chuẩn | Đã sửa đúng nội dung tối thiểu prompt yêu cầu. |
| `.local-audit-quarantine/human-approval-package/04_SIGN_OFF_FORM.md` | Mojibake ở tiêu đề, chức vụ, bộ phận, kế toán trưởng | UTF-8 chuẩn | Không thay đổi nghiệp vụ sign-off. |
| `.local-audit-quarantine/human-approval-package/05_APPROVAL_GUIDE_FOR_ACCOUNTING_TEAM.md` | Mojibake trong toàn bộ hướng dẫn kế toán | UTF-8 chuẩn | Giữ nguyên nguyên tắc không cho AI tự approve. |
| `.local-audit-quarantine/human-approval-package/06_PHASE2_8_APPROVAL_PACKAGE_INDEX.md` | Mojibake trong bảng index package | UTF-8 chuẩn | Vẫn ghi rõ package không commit nếu chứa dữ liệu thật. |
| `.local-audit-quarantine/human-approval-package/01_PROJECT_COMPANY_APPROVAL_HUONG_DAN.md` | Mojibake trong nguyên tắc chọn decision/action | UTF-8 chuẩn | Không sửa CSV mapping. |
| `.local-audit-quarantine/human-approval-package/02_CASH_BANK_JOURNAL_APPROVAL_HUONG_DAN.md` | Mojibake trong cảnh báo non-project | UTF-8 chuẩn | Cảnh báo số tiền nhỏ không đủ làm lý do non-project. |
| `.local-audit-quarantine/human-approval-package/03_PROJECT_BATTRANG_AP_APPROVAL_HUONG_DAN.md` | Mojibake trong nguyên tắc AP/ledger/query | UTF-8 chuẩn | Vẫn chặn sửa query chính thức để cộng `DRAFT`. |
| `.local-audit-quarantine/human-approval-package/EXCEL_FALLBACK_NOTICE.md` | Mojibake trong lý do CSV fallback | UTF-8 chuẩn | Ghi rõ thiếu thư viện Excel trong môi trường hiện tại. |

Kiểm tra lại bằng `rg` trên `*.md` trong package không còn match các pattern mojibake chính.

## 3. Package Safety Check

| File | Có chứa dữ liệu nhạy cảm | Bị Git track không | Trạng thái |
| ---- | ------------------------ | ------------------ | ---------- |
| `.local-audit-quarantine/human-approval-package/01_PROJECT_COMPANY_APPROVAL.csv` | Có | Không, bị ignore | An toàn cho lưu nội bộ, không commit. |
| `.local-audit-quarantine/human-approval-package/02_CASH_BANK_JOURNAL_APPROVAL.csv` | Có | Không, bị ignore | An toàn cho lưu nội bộ, không commit. |
| `.local-audit-quarantine/human-approval-package/03_PROJECT_BATTRANG_AP_APPROVAL.csv` | Có | Không, bị ignore | An toàn cho lưu nội bộ, không commit. |
| `.local-audit-quarantine/human-approval-package/project-company-mapping.for-approval.csv` | Có | Không, bị ignore | Chờ người thật điền. |
| `.local-audit-quarantine/human-approval-package/journal-project-mapping.for-approval.csv` | Có | Không, bị ignore | Chờ người thật điền. |
| `.local-audit-quarantine/human-approval-package/project-battrang-ap-reconciliation.for-approval.csv` | Có | Không, bị ignore | Chờ người thật điền. |
| `.local-audit-quarantine/human-approval-package/04_SIGN_OFF_FORM.md` | Không nếu để trống; có sau khi ký | Không, bị ignore | Dùng nội bộ. |
| `.local-audit-quarantine/human-approval-package/RUN_VALIDATION_AFTER_APPROVAL.md` | Không | Không, bị ignore | UTF-8 chuẩn. |

Git/repo findings:

- Branch hiện tại: `main`.
- Commit gần nhất: `211d31c fix loi`.
- `.local-audit-quarantine/` được ignore bởi `.gitignore`.
- `git ls-files` không còn match file nhạy cảm/tạm theo pattern kiểm tra.
- Dirty state còn lại:
  - `docs/audit/phase1-readonly-validation.json`: artifact được cập nhật bởi `npm run validation:database`.
  - `scripts/validation/run-full-validation.ts`: dirty state ngoài phạm vi Phase 2.8F.
  - `PHASE2_7R_AI_APPROVAL_REVIEW_REPORT.md`, `PHASE2_8_HUMAN_APPROVAL_PACKAGE_REPORT.md`, `docs/audit/PHASE2_7R_ROLLBACK_PLAN.md`, `scripts/audit/phase27r-ai-approval-review.ts`: untracked nội bộ/previous phase.

## 4. Human Approval Gate

| Nhóm | Số dòng | Trạng thái | Có được apply không |
| ---- | ------: | ---------- | ------------------- |
| Project -> Company | 19 | Chờ người thật | Không |
| Cash Bank Journal | 25 | Chờ người thật | Không |
| AP Bát Tràng | 26 | Chờ người thật | Không |

Kiểm tra chuỗi trong 3 file validator:

- Không có `approvedBy=Kế toán Trưởng`.
- Không có `APPROVED_FOR_BACKFILL`.
- Không có `NON_PROJECT_FINANCE`.
- Không có `FIX_RECONCILIATION_QUERY`.

Validator hiện tại:

- Project -> Company: `WARNING`, 19 dòng chưa approved, 0 issue.
- Cash Bank Journal: `WARNING`, 25 dòng chưa có quyết định owner, 0 issue.
- AP Bát Tràng: `WARNING`, 26 dòng manual review, 0 issue.

Đây là trạng thái đúng trước khi kế toán thật điền.

## 5. Validation Results

| Lệnh | Kết quả | Ghi chú |
| ---- | ------- | ------- |
| `git status --short` | WARNING | Repo còn dirty state ngoài gate; không có package tracked. |
| `git branch --show-current` | PASS | `main`. |
| `git log -5 --oneline` | PASS | HEAD `211d31c fix loi`. |
| `git show --name-status HEAD` | PASS/WARNING | Commit cleanup đã remove mapping draft/temp DLL/Playwright report khỏi tracked set. |
| `git check-ignore .local-audit-quarantine/human-approval-package/RUN_VALIDATION_AFTER_APPROVAL.md` | PASS | File bị ignore. |
| `rg` mojibake trên package Markdown | PASS | Không còn match pattern mojibake chính sau khi sửa. |
| `npx tsx validate-project-company-mapping.ts` với env package | WARNING | Chờ human approval, không được apply. |
| `npx tsx validate-journal-project-mapping.ts` với env package | WARNING | Chờ human approval, không được apply. |
| `npx tsx validate-project-battrang-ap-decision.ts` với env package | WARNING | Chờ human approval, không được apply. |
| `npx prisma validate` | PASS | Prisma schema hợp lệ. |
| `npm run build` | PASS | Còn warning cũ Turbopack NFT trace và deprecation `url.parse()`. |
| `npm run validation:database` | PASS | Read-only validation pass; cập nhật `docs/audit/phase1-readonly-validation.json`. |
| `npm run security-check` | PASS | Viewer bị chặn, Manager pass guard. |
| `npm run e2e -- tests/e2e/enterprise-smoke.spec.ts` | PASS | 3 tests pass. |

Không chạy `apply-project-company-mapping.ts` hoặc `apply-journal-project-mapping.ts`.

## 6. Remaining Risks

- Chưa production ready.
- Chưa được dùng dữ liệu reconciliation làm sổ kế toán thật.
- AP Bát Tràng chưa xử lý; vẫn chờ kế toán công nợ/kế toán trưởng xác nhận.
- 25 journal `CASH_BANK` thiếu `projectId` vẫn cần kế toán xác nhận chứng từ gốc.
- `project-battrang` vẫn cần owner quyết định `companyId` nếu còn thiếu scope công ty.
- Repo còn dirty state ngoài phạm vi Phase 2.8F; cần owner quyết định commit/giữ/review ở phase quản trị repo.
- Lint repo-wide không được dùng làm gate Phase 2.8F nếu vẫn còn nợ cũ; nên xử lý ở hardening riêng.

## 7. Decision Gate

```text
A. READY_FOR_PHASE3A_UI_PILOT_ONLY
```

Điều kiện đi kèm:

- Phase 3A chỉ được triển khai như UI/UX pilot nội bộ.
- Không apply dữ liệu reconciliation.
- Không dùng package chưa ký làm dữ liệu kế toán thật.
- Không tuyên bố production ready.
- Khi kế toán thật điền và ký, phải chạy lại validator theo `RUN_VALIDATION_AFTER_APPROVAL.md`; chỉ khi validator PASS mới được xem xét chạy Phase 2.7 apply.

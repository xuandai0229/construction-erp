# PHASE 2.7C REPO CLEANUP REPORT

Ngày thực hiện: 2026-06-02  
Workspace: `D:\construction-erp`  
Phạm vi: cleanup repo và quarantine artifact reconciliation nhạy cảm. Không sửa database, không rollback, không approve mapping, không sửa AP Bát Tràng.

## 1. Executive Summary

- Đã phân loại 62 mục artifact/path trong `docs/audit/PHASE2_7C_ARTIFACT_INVENTORY.md`.
- Đã move/quarantine 41 file local vào `.local-audit-quarantine/`.
- Đã cập nhật `.gitignore` để chặn quarantine, dump JSON, debug scripts, mapping draft/proposed, forensic JSON, Playwright/test artifacts, `.next`, temp DLL và log/tmp.
- Đã gỡ khỏi Git index 19 file tracked không nên commit tiếp: 3 mapping draft, 15 Prisma temp DLL, 1 Playwright report.
- Có artifact nhạy cảm đã nằm trong commit gần nhất `92f1dbc app_v2_pate7`; Phase 2.7C chỉ cleanup ở commit tiếp theo, không rewrite history.
- Cần owner quyết định nếu repo đã public/push ra remote không kiểm soát.
- Gate hiện tại: **A. REPO CLEAN ENOUGH FOR INTERNAL PILOT, ACCOUNTING DATA STILL NEEDS HUMAN APPROVAL**.

Không được kết luận production ready. Dữ liệu kế toán reconciliation vẫn cần owner/kế toán thật xác nhận trước khi dùng cho Phase 3 thật.

## 2. Artifact Inventory Summary

| Nhóm | Tổng file/mục | Đã giữ | Đã quarantine | Đã ignore | Cần owner quyết định |
| ---- | ------------: | -----: | ------------: | --------: | -------------------: |
| A - Source code/template cần giữ | 12 | 12 | 0 | 0 | 1 |
| B - Báo cáo audit giữ nội bộ | 6 | 6 | 0 | 0 | 2 |
| C - File nhạy cảm | 8 | 0 | 8 | 8 | 8 |
| D - File tạm/generated/debug | 37 | 0 | 33 | 37 | 3 |

Ghi chú: một số file D vừa được quarantine vừa được `git rm --cached` nếu trước đó đã tracked.

## 3. Git Findings

- Branch hiện tại: `main`.
- Commit gần nhất: `92f1dbc app_v2_pate7`.
- Commit gần nhất có artifact nhạy cảm/tạm: có.
- File đang staged remove khỏi index:
  - `docs/reconciliation/journal-project-mapping.draft.csv`
  - `docs/reconciliation/project-battrang-ap-reconciliation.draft.csv`
  - `docs/reconciliation/project-company-mapping.draft.csv`
  - `generated/prisma-client/query_engine-windows.dll.node.tmp*` gồm 15 file tracked.
  - `playwright-report/index.html`
- File untracked đã được ignore:
  - `.local-audit-quarantine/**`
  - `scripts/reconciliation/dump-db.json`
  - `docs/reconciliation/*.draft.csv`
  - `docs/audit/*forensic*.json`
  - `docs/audit/*apply-result*.json`
  - `generated/prisma-client/query_engine-windows.dll.node.tmp*`
  - `playwright-report/**`
  - `test-results/**`

Unrelated/pre-existing dirty state còn thấy:

- `scripts/validation/run-full-validation.ts` đang modified nhưng không thuộc thao tác Phase 2.7C của tôi.
- Các báo cáo Phase 2.7R mới tạo vẫn untracked cho tới khi owner quyết định commit.

## 4. Quarantine Actions

| File gốc | Vị trí quarantine | Lý do |
| -------- | ----------------- | ----- |
| `docs/reconciliation/project-company-mapping.draft.csv` | `.local-audit-quarantine/reconciliation/project-company-mapping.draft.csv` | Mapping thật có dữ liệu dự án/công ty và approval AI. |
| `docs/reconciliation/journal-project-mapping.draft.csv` | `.local-audit-quarantine/reconciliation/journal-project-mapping.draft.csv` | Mapping thật có journal/cash-bank/counterparty. |
| `docs/reconciliation/project-battrang-ap-reconciliation.draft.csv` | `.local-audit-quarantine/reconciliation/project-battrang-ap-reconciliation.draft.csv` | AP Bát Tràng có dữ liệu ledger/operational. |
| `docs/reconciliation/ACCOUNTANT_MAPPING_ASSISTANCE_REPORT.md` | `.local-audit-quarantine/reconciliation/ACCOUNTANT_MAPPING_ASSISTANCE_REPORT.md` | Báo cáo tự phê duyệt không nên nằm trong repo shared. |
| `docs/audit/phase26-project-company-apply-result.json` | `.local-audit-quarantine/forensic-json/phase26-project-company-apply-result.json` | Apply result có dữ liệu trước/sau. |
| `docs/audit/phase26-journal-project-apply-result.json` | `.local-audit-quarantine/forensic-json/phase26-journal-project-apply-result.json` | Apply result có journal details. |
| `docs/audit/phase27r-forensic-data.json` | `.local-audit-quarantine/forensic-json/phase27r-forensic-data.json` | Forensic JSON có dữ liệu nội bộ. |
| `scripts/reconciliation/dump-db.json` | `.local-audit-quarantine/forensic-json/dump-db.json` | Dump DB. |
| `scripts/reconciliation/dump-db.ts` và 14 script debug/search/check/list/test/view/write | `.local-audit-quarantine/debug-scripts/` | Script điều tra tạm, không phải source chính thức. |
| `generated/prisma-client/query_engine-windows.dll.node.tmp*` | `.local-audit-quarantine/test-artifacts/` | File tạm Prisma engine. |
| `playwright-report/index.html` | `.local-audit-quarantine/test-artifacts/playwright-report/index.html` | Artifact test. |
| `validation-report.json` | `.local-audit-quarantine/test-artifacts/validation-report.json` | Artifact validation local. |

Tổng quarantine: 41 file.

## 5. Gitignore Changes

Đã thêm/cập nhật các rule:

```gitignore
.local-audit-quarantine/
scripts/reconciliation/dump-db.json
**/dump-db.json
**/*dump*.json
scripts/reconciliation/dump-db.ts
scripts/reconciliation/search-*.ts
scripts/reconciliation/check-*.ts
scripts/reconciliation/list-*.ts
scripts/reconciliation/test-*.ts
scripts/reconciliation/view-*.ts
scripts/reconciliation/write-*.ts
docs/reconciliation/*.draft.csv
docs/reconciliation/*.accountant-proposed.csv
docs/reconciliation/*mapping*.csv
!docs/reconciliation/templates/
!docs/reconciliation/templates/*.template.csv
docs/audit/*forensic*.json
docs/audit/*apply-result*.json
docs/audit/phase*-*-apply-result.json
docs/audit/phase27r-forensic-data.json
playwright-report/
test-results/
.next/
generated/prisma-client/query_engine-windows.dll.node.tmp*
*.tmp
*.log
```

## 6. Debug/Temp Cleanup

Đã move 15 debug/temp script:

- `dump-db.ts`
- `search-battrang.ts`
- `search-contracts.ts`
- `search-journals.ts`
- `check-ap-discrepancy.ts`
- `check-cashdoc.ts`
- `list-companies.ts`
- `list-projects.ts`
- `test-ap-calc.ts`
- `test-applied-results.ts`
- `test-company-mapping.ts`
- `view-ap-draft.ts`
- `write-ap-proposed.ts`
- `write-journal-project-proposed.ts`
- `write-project-company-proposed.ts`

Đã giữ lại script chính thức:

- `validate-project-company-mapping.ts`
- `apply-project-company-mapping.ts`
- `validate-journal-project-mapping.ts`
- `apply-journal-project-mapping.ts`
- `validate-project-battrang-ap-decision.ts`
- `generate-manual-reconciliation-workbook.ts`

## 7. Mapping CSV Handling

Mapping thật hiện nằm ở:

- `.local-audit-quarantine/reconciliation/project-company-mapping.draft.csv`
- `.local-audit-quarantine/reconciliation/journal-project-mapping.draft.csv`
- `.local-audit-quarantine/reconciliation/project-battrang-ap-reconciliation.draft.csv`

Template sạch nằm ở:

- `docs/reconciliation/templates/project-company-mapping.template.csv`
- `docs/reconciliation/templates/journal-project-mapping.template.csv`
- `docs/reconciliation/templates/project-battrang-ap-reconciliation.template.csv`

Validator còn chạy được khi trỏ env path:

```bash
PROJECT_COMPANY_MAPPING_PATH=.local-audit-quarantine/reconciliation/project-company-mapping.draft.csv npx tsx scripts/reconciliation/validate-project-company-mapping.ts
JOURNAL_PROJECT_MAPPING_PATH=.local-audit-quarantine/reconciliation/journal-project-mapping.draft.csv npx tsx scripts/reconciliation/validate-journal-project-mapping.ts
BATTRANG_AP_MAPPING_PATH=.local-audit-quarantine/reconciliation/project-battrang-ap-reconciliation.draft.csv npx tsx scripts/reconciliation/validate-project-battrang-ap-decision.ts
```

Kết quả format validator đều PASS, nhưng đây không phải phê duyệt kế toán thật. Owner/kế toán vẫn phải xác nhận nội dung mapping trước khi apply.

## 8. Validation Results

| Lệnh | Kết quả | Ghi chú |
| --- | --- | --- |
| `git status --short` | WARNING | Có staged remove 19 file khỏi index, các file report/template/script changes chưa commit. |
| `git diff --name-only` | WARNING | Có thay đổi `.gitignore` và 6 script reconciliation; `scripts/validation/run-full-validation.ts` là dirty state có sẵn/ngoài phạm vi. |
| `npx prisma validate` | PASS | Schema hợp lệ. |
| `npm run build` | PASS | Chạy pass khi escalated; sandbox run fail `EPERM .next/trace`. Còn warning trace Prisma và `url.parse()`. |
| `npm run validation:database` | PASS | Chạy pass khi escalated; sandbox run fail do không ghi được `docs/audit/phase1-readonly-validation.json`. |
| `npm run security-check` | PASS | Viewer bị chặn, Manager pass guard. |
| `npm run e2e -- tests/e2e/enterprise-smoke.spec.ts` | PASS | 3 tests pass khi escalated; sandbox run fail do không unlink được `test-results/.last-run.json`. |
| `PROJECT_COMPANY_MAPPING_PATH=... npx tsx validate-project-company-mapping.ts` | PASS | 19 rows, 18 approved format, 1 warning manual review. |
| `JOURNAL_PROJECT_MAPPING_PATH=... npx tsx validate-journal-project-mapping.ts` | PASS | 25 rows format pass, vẫn cần human accounting review. |
| `BATTRANG_AP_MAPPING_PATH=... npx tsx validate-project-battrang-ap-decision.ts` | PASS | 26 rows format pass, vẫn cần human accounting review. |

## 9. Remaining Risks

| ID | Mức độ | Rủi ro | File/nguồn | Cách xử lý tiếp |
| -- | ------ | ------ | ---------- | --------------- |
| R1 | P1 | Mapping draft đã từng nằm trong commit gần nhất. | `git show --name-status HEAD` | Commit cleanup; nếu repo public/pushed không kiểm soát thì owner quyết định purge history. |
| R2 | P1 | AI approval vẫn chưa có xác nhận người thật. | `.local-audit-quarantine/reconciliation/*.draft.csv` | Owner/kế toán review nội bộ trước khi apply hoặc Phase 3 thật. |
| R3 | P1 | AP Bát Tràng vẫn lệch và chưa có policy. | Phase 2.7R report, AP mapping quarantine | Giữ manual review; không cộng `DRAFT` vào báo cáo chính thức. |
| R4 | P2 | Prisma temp DLL từng tracked và commit trước đó. | `generated/prisma-client/query_engine-windows.dll.node.tmp*` | Commit cleanup, đảm bảo ignore rule hoạt động. |
| R5 | P2 | Build còn warning trace Prisma và `url.parse()`. | `npm run build` | Xử lý ở phase hardening riêng, không thuộc cleanup artifact. |
| R6 | P2 | Dirty state ngoài phạm vi còn tồn tại. | `scripts/validation/run-full-validation.ts` | Owner xác định đây là thay đổi cần giữ hay task khác. |

## 10. Decision Gate

Gate hiện tại:

```text
A. REPO CLEAN ENOUGH FOR INTERNAL PILOT, ACCOUNTING DATA STILL NEEDS HUMAN APPROVAL
```

Điều kiện:

- Có thể tiếp tục Phase 3 UI test/pilot nội bộ nếu không dùng mapping AI-approved như dữ liệu thật.
- Không được dùng kết luận production ready.
- Không được apply/rollback mapping kế toán khi chưa có owner/kế toán thật xác nhận.
- Nếu repo đã public hoặc push ra remote không kiểm soát, cần owner quyết định purge history trước khi mở rộng sử dụng.

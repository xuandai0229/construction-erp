# PHASE 2.7C ARTIFACT INVENTORY

Ngày kiểm kê: 2026-06-02  
Workspace: `D:\construction-erp`  
Mục tiêu: phân loại artifact reconciliation, file tạm, dump/debug script và file generated không nên commit.

## Inventory Table

| File | Nhóm | Có tracked bởi git không | Có dữ liệu nhạy cảm không | Hành động đề xuất | Lý do |
| ---- | ---- | ------------------------ | ------------------------- | ----------------- | ----- |
| `.gitignore` | A | Có | Không | KEEP_TRACKED | Cập nhật rule quarantine/ignore cho artifact nhạy cảm. |
| `scripts/reconciliation/reconciliation-utils.ts` | A | Có | Không | KEEP_TRACKED | Thêm helper đọc mapping từ env path để validator không phụ thuộc CSV thật trong repo. |
| `scripts/reconciliation/validate-project-company-mapping.ts` | A | Có | Không | KEEP_TRACKED | Script chính thức; đã hỗ trợ `PROJECT_COMPANY_MAPPING_PATH`. |
| `scripts/reconciliation/validate-journal-project-mapping.ts` | A | Có | Không | KEEP_TRACKED | Script chính thức; đã hỗ trợ `JOURNAL_PROJECT_MAPPING_PATH`. |
| `scripts/reconciliation/validate-project-battrang-ap-decision.ts` | A | Có | Không | KEEP_TRACKED | Script chính thức; đã hỗ trợ `BATTRANG_AP_MAPPING_PATH`. |
| `scripts/reconciliation/apply-project-company-mapping.ts` | A | Có | Không | KEEP_TRACKED | Script chính thức; đã hỗ trợ mapping path nội bộ khi owner xác nhận. |
| `scripts/reconciliation/apply-journal-project-mapping.ts` | A | Có | Không | KEEP_TRACKED | Script chính thức; đã hỗ trợ mapping path nội bộ khi owner xác nhận. |
| `scripts/reconciliation/generate-manual-reconciliation-workbook.ts` | A | Có | Không | KEEP_TRACKED | Script chính thức tạo workbook. |
| `scripts/audit/phase27r-ai-approval-review.ts` | A | Chưa | Không | KEEP_TRACKED | Script audit read-only phục vụ Phase 2.7R; có thể giữ nếu owner muốn lưu bằng chứng. |
| `PHASE2_7R_AI_APPROVAL_REVIEW_REPORT.md` | B | Chưa | Có thể | KEEP_INTERNAL_DOC | Báo cáo audit nội bộ, không chứa secret nhưng có thông tin reconciliation. |
| `docs/audit/PHASE2_7R_ROLLBACK_PLAN.md` | B | Chưa | Có thể | KEEP_INTERNAL_DOC | Rollback plan nội bộ, cần giữ để kiểm soát phase sau. |
| `docs/audit/PHASE2_7C_ARTIFACT_INVENTORY.md` | B | Chưa | Không | KEEP_INTERNAL_DOC | Báo cáo inventory Phase 2.7C. |
| `PHASE2_7C_REPO_CLEANUP_REPORT.md` | B | Chưa | Không | KEEP_INTERNAL_DOC | Báo cáo cleanup Phase 2.7C. |
| `docs/reconciliation/MANUAL_RECONCILIATION_WORKBOOK.md` | B | Có | Có thể | KEEP_INTERNAL_DOC | Workbook hướng dẫn/manual review, giữ nội bộ. |
| `EXPORT_PRINT_AUDIT_MATRIX.md` | B | Có | Có thể | KEEP_INTERNAL_DOC | Matrix audit export/print, giữ nội bộ. |
| `docs/reconciliation/templates/project-company-mapping.template.csv` | A | Chưa | Không | KEEP_TRACKED | Template sạch, dữ liệu giả. |
| `docs/reconciliation/templates/journal-project-mapping.template.csv` | A | Chưa | Không | KEEP_TRACKED | Template sạch, dữ liệu giả. |
| `docs/reconciliation/templates/project-battrang-ap-reconciliation.template.csv` | A | Chưa | Không | KEEP_TRACKED | Template sạch, dữ liệu giả. |
| `docs/reconciliation/project-company-mapping.draft.csv` | C | Có, đã `git rm --cached` | Có | MOVE_TO_QUARANTINE | Mapping thật có approval AI và dữ liệu dự án/công ty. |
| `docs/reconciliation/journal-project-mapping.draft.csv` | C | Có, đã `git rm --cached` | Có | MOVE_TO_QUARANTINE | Mapping thật có journal/cash-bank/counterparty. |
| `docs/reconciliation/project-battrang-ap-reconciliation.draft.csv` | C | Có, đã `git rm --cached` | Có | MOVE_TO_QUARANTINE | Mapping AP Bát Tràng có dữ liệu ledger/operational. |
| `docs/reconciliation/ACCOUNTANT_MAPPING_ASSISTANCE_REPORT.md` | C | Chưa | Có | MOVE_TO_QUARANTINE | Báo cáo tự nhận kế toán trưởng, không nên nằm trong repo shared. |
| `docs/audit/phase26-project-company-apply-result.json` | C | Chưa | Có | MOVE_TO_QUARANTINE | Apply result có dữ liệu trước/sau và rollback note. |
| `docs/audit/phase26-journal-project-apply-result.json` | C | Chưa | Có | MOVE_TO_QUARANTINE | Apply result có journal details và non-project rows. |
| `docs/audit/phase27r-forensic-data.json` | C | Chưa | Có | MOVE_TO_QUARANTINE | Forensic JSON có dữ liệu dự án/journal nội bộ. |
| `scripts/reconciliation/dump-db.json` | C | Chưa | Có | MOVE_TO_QUARANTINE | Dump dữ liệu, không được commit. |
| `validation-report.json` | D | Chưa | Có thể | MOVE_TO_QUARANTINE | Artifact validation local. |
| `scripts/reconciliation/dump-db.ts` | D | Chưa | Có thể | MOVE_TO_QUARANTINE | Script điều tra tạm. |
| `scripts/reconciliation/search-battrang.ts` | D | Chưa | Có thể | MOVE_TO_QUARANTINE | Script điều tra tạm hardcoded. |
| `scripts/reconciliation/search-contracts.ts` | D | Chưa | Có thể | MOVE_TO_QUARANTINE | Script điều tra tạm. |
| `scripts/reconciliation/search-journals.ts` | D | Chưa | Có thể | MOVE_TO_QUARANTINE | Script điều tra tạm. |
| `scripts/reconciliation/check-ap-discrepancy.ts` | D | Chưa | Có thể | MOVE_TO_QUARANTINE | Script check tạm. |
| `scripts/reconciliation/check-cashdoc.ts` | D | Chưa | Có thể | MOVE_TO_QUARANTINE | Script check tạm. |
| `scripts/reconciliation/list-companies.ts` | D | Chưa | Có thể | MOVE_TO_QUARANTINE | Script list tạm. |
| `scripts/reconciliation/list-projects.ts` | D | Chưa | Có thể | MOVE_TO_QUARANTINE | Script list tạm. |
| `scripts/reconciliation/test-ap-calc.ts` | D | Chưa | Có thể | MOVE_TO_QUARANTINE | Script test tạm, không phải test suite chính thức. |
| `scripts/reconciliation/test-applied-results.ts` | D | Chưa | Có thể | MOVE_TO_QUARANTINE | Script test tạm. |
| `scripts/reconciliation/test-company-mapping.ts` | D | Chưa | Có thể | MOVE_TO_QUARANTINE | Script test tạm. |
| `scripts/reconciliation/view-ap-draft.ts` | D | Chưa | Có thể | MOVE_TO_QUARANTINE | Script view tạm. |
| `scripts/reconciliation/write-ap-proposed.ts` | D | Chưa | Có thể | MOVE_TO_QUARANTINE | Script write tạm tạo mapping đề xuất. |
| `scripts/reconciliation/write-journal-project-proposed.ts` | D | Chưa | Có thể | MOVE_TO_QUARANTINE | Script write tạm tạo mapping đề xuất. |
| `scripts/reconciliation/write-project-company-proposed.ts` | D | Chưa | Có thể | MOVE_TO_QUARANTINE | Script write tạm tạo mapping đề xuất. |
| `generated/prisma-client/query_engine-windows.dll.node.tmp11372` | D | Có, đã `git rm --cached` | Không | REMOVE_FROM_GIT_INDEX | File tạm Prisma engine. |
| `generated/prisma-client/query_engine-windows.dll.node.tmp11396` | D | Có, đã `git rm --cached` | Không | REMOVE_FROM_GIT_INDEX | File tạm Prisma engine. |
| `generated/prisma-client/query_engine-windows.dll.node.tmp12952` | D | Có, đã `git rm --cached` | Không | REMOVE_FROM_GIT_INDEX | File tạm Prisma engine, có trong commit gần nhất. |
| `generated/prisma-client/query_engine-windows.dll.node.tmp15584` | D | Có, đã `git rm --cached` | Không | REMOVE_FROM_GIT_INDEX | File tạm Prisma engine. |
| `generated/prisma-client/query_engine-windows.dll.node.tmp15904` | D | Có, đã `git rm --cached` | Không | REMOVE_FROM_GIT_INDEX | File tạm Prisma engine. |
| `generated/prisma-client/query_engine-windows.dll.node.tmp16900` | D | Có, đã `git rm --cached` | Không | REMOVE_FROM_GIT_INDEX | File tạm Prisma engine. |
| `generated/prisma-client/query_engine-windows.dll.node.tmp18228` | D | Có, đã `git rm --cached` | Không | REMOVE_FROM_GIT_INDEX | File tạm Prisma engine. |
| `generated/prisma-client/query_engine-windows.dll.node.tmp21064` | D | Có, đã `git rm --cached` | Không | REMOVE_FROM_GIT_INDEX | File tạm Prisma engine. |
| `generated/prisma-client/query_engine-windows.dll.node.tmp21168` | D | Có, đã `git rm --cached` | Không | REMOVE_FROM_GIT_INDEX | File tạm Prisma engine, có trong commit gần nhất. |
| `generated/prisma-client/query_engine-windows.dll.node.tmp2772` | D | Có, đã `git rm --cached` | Không | REMOVE_FROM_GIT_INDEX | File tạm Prisma engine. |
| `generated/prisma-client/query_engine-windows.dll.node.tmp3296` | D | Có, đã `git rm --cached` | Không | REMOVE_FROM_GIT_INDEX | File tạm Prisma engine, có trong commit gần nhất. |
| `generated/prisma-client/query_engine-windows.dll.node.tmp4988` | D | Có, đã `git rm --cached` | Không | REMOVE_FROM_GIT_INDEX | File tạm Prisma engine. |
| `generated/prisma-client/query_engine-windows.dll.node.tmp6676` | D | Có, đã `git rm --cached` | Không | REMOVE_FROM_GIT_INDEX | File tạm Prisma engine. |
| `generated/prisma-client/query_engine-windows.dll.node.tmp8320` | D | Có, đã `git rm --cached` | Không | REMOVE_FROM_GIT_INDEX | File tạm Prisma engine. |
| `generated/prisma-client/query_engine-windows.dll.node.tmp8500` | D | Chưa | Không | MOVE_TO_QUARANTINE | File tạm Prisma engine sinh bởi `prisma generate` fail. |
| `generated/prisma-client/query_engine-windows.dll.node.tmp9848` | D | Có, đã `git rm --cached` | Không | REMOVE_FROM_GIT_INDEX | File tạm Prisma engine. |
| `playwright-report/index.html` | D | Có, đã `git rm --cached` | Không | REMOVE_FROM_GIT_INDEX | Artifact test, không nên commit. |

## COMMITTED_SENSITIVE_ARTIFACTS

Commit gần nhất `92f1dbc app_v2_pate7` có chứa artifact cần cleanup:

- `docs/reconciliation/journal-project-mapping.draft.csv`
- `docs/reconciliation/project-battrang-ap-reconciliation.draft.csv`
- `docs/reconciliation/project-company-mapping.draft.csv`
- `generated/prisma-client/query_engine-windows.dll.node.tmp12952`
- `generated/prisma-client/query_engine-windows.dll.node.tmp21168`
- `generated/prisma-client/query_engine-windows.dll.node.tmp3296`
- `playwright-report/index.html`

Đánh giá:

- Cần commit cleanup để remove khỏi index ở commit tiếp theo.
- Chưa phát hiện secret/password/token trong danh sách kiểm tra hiện tại.
- Chưa tự rewrite history. Nếu repo đã public hoặc đã push ra remote không kiểm soát, owner cần quyết định purge history và review dữ liệu nhạy cảm.

# PHASE 2.7R AI APPROVAL REVIEW REPORT

Ngày kiểm tra: 2026-06-02  
Workspace: `D:\construction-erp`  
Mục tiêu: review lại các quyết định reconciliation được AI gắn nhãn "Kế toán Trưởng", không sửa dữ liệu, không rollback, không tiếp tục Phase 3.

## 1. Executive Summary

Kết luận chính: Phase 2.6/2.7 có bằng chứng kỹ thuật cho một số thao tác test/pilot, nhưng không đủ điều kiện coi là phê duyệt kế toán thật. Các mapping CSV và báo cáo `ACCOUNTANT_MAPPING_ASSISTANCE_REPORT.md` dùng `approvedBy = "Kế toán Trưởng"` hàng loạt, trong khi không có bằng chứng owner/kế toán thật xác nhận.

Không được kết luận hệ thống `PRODUCTION READY` cho dữ liệu thật. Trạng thái phù hợp hiện tại là: **technical validation passed for test/pilot, not full production ready**.

Quyết định gate: **B. MUST RESOLVE HUMAN APPROVAL BEFORE PHASE 3**.

Các điểm trọng yếu:

- 18 project test/hardening đã được backfill `companyId`; rủi ro kế toán thấp vì không có cost/invoice/payment/journal, nhưng approval generic vẫn cần owner xác nhận.
- 25 journal `CASH_BANK` bị đánh dấu `NON_PROJECT_FINANCE` chưa đủ bằng chứng. Forensic phân loại 17 dòng có khả năng liên quan công trình, 8 dòng chỉ là trace đảo/hủy.
- AP Bát Tràng vẫn lệch AP 8.286.592 và chưa được giải quyết bằng chứng kế toán. Không được sửa báo cáo chính thức để cộng `DRAFT`.
- Repo có rủi ro artifact: mapping CSV, audit JSON, dump/debug script và file tạm Prisma engine.

## 2. Git Forensic Findings

Lệnh đã đối chiếu:

```bash
git status --short
git branch --show-current
git log -3 --oneline
git show --name-only --oneline HEAD
```

Kết quả chính:

- Branch hiện tại: `main`.
- Commit gần nhất: `92f1dbc app_v2_pate7`.
- Commit trước đó: `d1a5b4f phase4a_business_workflow_data_integrity_audit`, `476f0f6 app_v2_UI_FIX.3`.
- Workspace hiện có nhiều file chưa commit/modified liên quan reconciliation, debug, dump, Playwright report và Prisma temp DLL.

Phân loại rủi ro file:

| Nhóm | File/bằng chứng | Đánh giá |
| --- | --- | --- |
| Mapping CSV | `docs/reconciliation/*.draft.csv` | Có dữ liệu reconciliation nội bộ, không nên public. |
| Báo cáo/audit JSON | `docs/audit/phase26-*-apply-result.json`, `docs/audit/phase27r-forensic-data.json` | Cần lưu trong kho nội bộ có kiểm soát; có thể nhạy cảm. |
| Dump/debug | `scripts/reconciliation/dump-db.json`, `dump-db.ts`, `search-*.ts`, `check-*.ts`, `test-*.ts` | Cần phân loại; dump DB không nên commit nếu chứa dữ liệu thật. |
| Artifact test | `playwright-report/index.html` | Không nên commit trừ khi dùng làm bằng chứng audit có kiểm soát. |
| Prisma temp | `generated/prisma-client/query_engine-windows.dll.node.tmp*` | File tạm binary, không nên commit. |

Kết luận forensic: cần cleanup git sau khi owner xác nhận phạm vi lưu trữ artifact. Phase 2.7R không tự xóa file.

## 3. Mapping Approval Review

Nguồn bằng chứng: `docs/audit/phase27r-forensic-data.json`.

| Workbook | Tổng dòng | Quyết định trong file | Người phê duyệt ghi trong file | Đánh giá Phase 2.7R |
| --- | ---: | --- | --- | --- |
| `project-company-mapping.draft.csv` | 19 | 18 `APPROVED_FOR_BACKFILL`, 1 `MANUAL_REVIEW` | `Kế toán Trưởng`: 19 | AI approval, cần human confirmation. |
| `journal-project-mapping.draft.csv` | 25 | 25 `NON_PROJECT_FINANCE` | `Kế toán Trưởng`: 25 | Chưa đủ bằng chứng, cần review chứng từ gốc. |
| `project-battrang-ap-reconciliation.draft.csv` | 26 | 25 `LEDGER_CORRECT_OPERATIONAL_MISSING`, 1 `REVERSAL_POLICY_ISSUE` | `Kế toán Trưởng`: 26 | Kết luận quá mức; cần giữ manual review. |

Nhận định:

- Việc ghi `approvedBy = "Kế toán Trưởng"` không chứng minh được phê duyệt thật.
- Không có chữ ký, userId, audit session, ticket, hoặc xác nhận bên ngoài từ owner.
- Các quyết định mapping cần đổi trạng thái quản trị thành `AI_APPROVED_REQUIRES_HUMAN_CONFIRMATION` trước khi dùng cho dữ liệu thật.

## 4. Project Company Backfill Review

Nguồn bằng chứng:

- `docs/audit/phase26-project-company-apply-result.json`.
- `docs/audit/phase27r-forensic-data.json`.
- `npx tsx scripts/validation/verify-project-company-scope.ts`.

Kết quả:

- Đã backfill 18 project.
- Còn 1 project manual review: `project-battrang`, tên `Trường mầm non Bát Tràng`, `companyId = null`.
- 18 project đã backfill đều có tên dạng `Project TEST_PHASE2_3B_HARDENING_*`.
- 18 project này có `costs = 0`, `invoices = 0`, `payments = 0`, `journals = 0`.

Đủ bằng chứng:

- Có thể phân loại 18 dòng là dữ liệu test/hardening rủi ro thấp theo tên và không có phát sinh kế toán.
- Không thấy tác động trực tiếp đến số liệu sổ thật.

Chưa đủ bằng chứng:

- Chưa đủ để coi approval là phê duyệt kế toán thật.
- Chưa được owner xác nhận giữ lại mapping.

Kết luận: không rollback ngay, nhưng cần owner xác nhận. Nếu owner không xác nhận, dùng rollback plan tại `docs/audit/PHASE2_7R_ROLLBACK_PLAN.md`.

## 5. Journal Non-project Review

Nguồn bằng chứng:

- `docs/audit/phase26-journal-project-apply-result.json`.
- `docs/audit/phase27r-forensic-data.json`.
- `npx tsx scripts/validation/verify-journal-project-linkage.ts`.
- `npx tsx scripts/validation/verify-source-document-trace.ts`.

Kết quả:

- 25 journal được đánh dấu `NON_PROJECT_FINANCE`.
- Apply result: `updated = 0`, `markedNonProject = 25`.
- Validation vẫn cảnh báo 25 posted journal thiếu `projectId`; 50 transaction lines bị ảnh hưởng.
- Source document trace còn 17 posted journal thiếu `projectId`.

Phân loại forensic:

| Phân loại | Số dòng | Đánh giá |
| --- | ---: | --- |
| `REVERSED_TRACE_ONLY` | 8 | Có thể là trace đảo/hủy, nhưng vẫn cần đối chiếu policy audit. |
| `POSSIBLY_PROJECT_RELATED` | 17 | Chưa đủ bằng chứng để đánh dấu non-project; mô tả có dấu hiệu liên quan công trình/thanh toán/WBS. |

Kết luận: quyết định `NON_PROJECT_FINANCE` cho 25 journal chưa đủ bằng chứng kế toán. Không cần rollback DB field vì chưa update `projectId`, nhưng cần đính chính audit/metadata nếu owner bác bỏ approval AI.

## 6. AP Bát Tràng Review

Nguồn bằng chứng:

- `docs/reconciliation/project-battrang-ap-reconciliation.draft.csv`.
- `docs/audit/phase27r-forensic-data.json`.
- `npx tsx scripts/validation/verify-ar-ap-ledger-reconciliation.ts`.

Kết quả:

- `project-battrang` vẫn chưa có `companyId`.
- Project có 14 cost, 13 invoice, 11 payment, 26 journal.
- AP ledger: -8.286.592.
- AP operational: 0.
- Variance: 8.286.592.
- Mapping AP đề xuất `FIX_RECONCILIATION_QUERY` cho 26 dòng.

Đánh giá nghiệp vụ:

- Không đủ bằng chứng để sửa báo cáo chính thức bằng cách cộng chứng từ `DRAFT`.
- Báo cáo tài chính chính thức không được lấy `DRAFT/PENDING` để bù lệch.
- Nếu cần phục vụ forensic legacy, phải tách mode riêng: `legacy/forensic reconciliation`, không trộn với báo cáo chính thức.
- Hướng phù hợp hiện tại: **giữ manual review** cho AP Bát Tràng, chờ kế toán xác nhận chứng từ gốc hoặc policy điều chỉnh.

## 7. Validation Results

| Lệnh | Kết quả | Nhận xét |
| --- | --- | --- |
| `npx tsx scripts/validation/verify-project-company-scope.ts` | WARNING | Còn `project-battrang` thiếu `companyId`, có phát sinh kế toán. |
| `npx tsx scripts/validation/verify-journal-project-linkage.ts` | WARNING | 25 posted journal thiếu `projectId`, 50 transaction lines ảnh hưởng. |
| `npx tsx scripts/validation/verify-ar-ap-ledger-reconciliation.ts` | WARNING | AP Bát Tràng còn lệch 8.286.592. |
| `npx tsx scripts/validation/verify-source-document-trace.ts` | WARNING | 17 posted journal thiếu `projectId`. |
| `npx tsx scripts/validation/verify-export-print-audit-coverage.ts` | PASS | Không còn high-risk unaudited export/print trong phạm vi kiểm tra. |
| `npx tsx scripts/validation/verify-no-financial-client-export.ts` | PASS | Không phát hiện financial client export forbidden usage. |
| `npx prisma validate` | PASS | Prisma schema validate thành công. |
| `npm run validation:database` | PASS | Journal posted sampled balanced; không thấy draft posted payment. |
| `npm run security-check` | PASS | Không phát hiện lỗi security-check trong phạm vi script. |
| `npx prisma generate` | FAIL | `EPERM rename query_engine-windows.dll.node.tmp8500`; khả năng cao do process Node giữ DLL. |
| `npm run build` | PASS | Build pass, còn warning trace Prisma và deprecation `url.parse()`. |
| `npm run e2e -- tests/e2e/enterprise-smoke.spec.ts` | PASS | 3 tests pass. |
| `npm run lint` | FAIL/last known | Lint trước đó còn nhiều lỗi cũ; chưa thể dùng làm bằng chứng production-ready. |

Kết luận validation: các kiểm tra kỹ thuật quan trọng pass một phần, nhưng các validation kế toán về scope, journal linkage, source trace và AP vẫn còn WARNING/P1.

## 8. Rollback/Cleanup Plan

Rollback/cleanup chi tiết nằm tại `docs/audit/PHASE2_7R_ROLLBACK_PLAN.md`.

Khuyến nghị:

1. Không rollback ngay 18 project test nếu owner xác nhận đó là test/hardening và không có phát sinh kế toán.
2. Nếu owner không xác nhận, rollback `companyId` cho 18 project theo SQL trong rollback plan.
3. Không xóa audit log `NON_PROJECT_FINANCE`; nếu sai, tạo audit log đính chính và đưa 25 journal về manual review.
4. Không sửa query AP chính thức để cộng `DRAFT`.
5. Dọn git/artifact sau khi owner xác nhận: Prisma temp DLL, dump DB, debug scripts, mapping CSV và audit JSON nhạy cảm.

## 9. Decision Gate

Quyết định: **B. MUST RESOLVE HUMAN APPROVAL BEFORE PHASE 3**.

Không đủ điều kiện:

- Không đủ điều kiện chạy Phase 3 trên dữ liệu thật.
- Không đủ điều kiện tuyên bố production ready.
- Không đủ điều kiện coi 25 journal là non-project.
- Không đủ điều kiện sửa AP Bát Tràng bằng cách thay đổi query báo cáo chính thức.

Có thể tiếp tục có điều kiện:

- Có thể tiếp tục test/pilot UI nếu không dùng dữ liệu thật và không dựa vào mapping AI-approved.
- Có thể tiếp tục cleanup repo và chuẩn hóa audit metadata.
- Có thể mở review thủ công với owner/kế toán thật cho 18 project, 25 journal và AP Bát Tràng.

Việc cần làm trước Phase 3:

1. Owner/kế toán thật xác nhận hoặc bác bỏ 18 project-company backfill.
2. Review chứng từ gốc cho 25 journal thiếu `projectId`.
3. Chốt policy AP Bát Tràng: chỉnh dữ liệu nghiệp vụ, forensic legacy mode, hoặc bút toán điều chỉnh hợp lệ.
4. Cleanup artifact nhạy cảm trong repo.
5. Chạy lại validation và chỉ mở gate khi không còn WARNING/P1 liên quan dữ liệu thật.

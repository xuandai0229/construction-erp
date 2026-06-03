# SPRINT 3A.6 - AUDIT LOG UI & APPROVAL WORKFLOW UX REPORT

## 1. Executive Summary

Sprint 3A.6 đã thêm lớp UI audit log đọc-only và workflow duyệt đọc-only cho hệ thống ERP kế toán xây dựng.

- Audit UI đã thêm tại `FinancialDrilldownDrawer` và trang `/reports`.
- Workflow UX đã thêm tại trang `/approvals`.
- Có tạo endpoint read-only mới: `/api/audit/entity` và `/api/audit/recent`.
- Không sửa Prisma schema, không tạo migration, không reset database.
- Không chạy mapping reconciliation, không sửa ledger, không sửa posting engine, không sửa payment allocation/accounting logic.
- Gate sau sprint: `A. READY_FOR_SPRINT_3A_7_APPROVAL_INBOX_ROLE_QUEUE`.

Ghi chú vận hành: `npx prisma generate` còn fail do Windows file lock khi rename `generated/prisma-client/query_engine-windows.dll.node`. `npx prisma validate`, `npx tsc`, `npm run build`, database validation, security check và e2e đều pass.

## 2. Files Changed

| File | Loại sửa | Ghi chú |
| ---- | -------- | ------- |
| `lib/audit-log-read-model.ts` | AUDIT_READ_ONLY_API | Chuẩn hóa limit, filter recent audit, sanitize oldData/newData để ẩn password/token/secret. |
| `app/api/audit/entity/route.ts` | AUDIT_READ_ONLY_API | API đọc audit theo `entityType/entityId`, RBAC `AUDIT READ`, giới hạn tối đa 50 dòng. |
| `app/api/audit/recent/route.ts` | AUDIT_READ_ONLY_API | API đọc audit gần đây, hỗ trợ scope `financial-reports` cho export/print. |
| `app/components/accounting/AuditTrailPanel.tsx` | AUDIT_LOG_UI | Panel dùng chung, loading/empty/error tiếng Việt, format ngày/tiền, xem chi tiết JSON. |
| `app/components/accounting/FinancialDrilldownDrawer.tsx` | AUDIT_TRAIL_TAB | Tab audit pilot được nối với audit endpoint read-only theo Project. |
| `app/components/reports/ReportAuditHistoryPanel.tsx` | REPORT_EXPORT_HISTORY / PRINT_AUDIT_HISTORY | Panel lịch sử xuất/in gần đây trên `/reports`. |
| `app/reports/page.tsx` | REPORT_EXPORT_HISTORY | Gắn `ReportAuditHistoryPanel` vào trang báo cáo. |
| `app/components/approvals/ApprovalWorkflowStepper.tsx` | APPROVAL_WORKFLOW_STEPPER | Stepper Nháp -> Chờ duyệt -> Đã duyệt -> Đã ghi sổ, read-only. |
| `app/approvals/page.tsx` | APPROVAL_WORKFLOW_STEPPER | Gắn stepper workflow lên đầu trang approvals. |
| `tests/e2e/audit-log-ui-smoke.spec.ts` | E2E_TEST | Smoke test tab audit drilldown và lịch sử xuất/in reports. |
| `tests/e2e/approval-workflow-ui-smoke.spec.ts` | E2E_TEST | Smoke test workflow stepper trên `/approvals`. |

## 3. Audit Coverage

| Khu vực | Audit UI | Nguồn dữ liệu | Ghi chú |
| ------- | -------- | ------------- | ------- |
| FinancialDrilldownDrawer | Có | `/api/audit/entity?entityType=Project&entityId=...` | Không fake audit; nếu không có log sẽ hiển thị empty state. |
| Reports export history | Có | `/api/audit/recent?scope=financial-reports` | Lọc `FinancialExport` và `FinancialPrint`. |
| Print history | Có | Audit log server-side hiện có từ Sprint 3A.5 | Chỉ hiển thị, không ghi thêm log khi đọc. |

## 4. Approval Workflow Coverage

| Chứng từ/khu vực | Workflow UI | Trạng thái phủ | Ghi chú |
| ---------------- | ----------- | -------------- | ------- |
| `/approvals` | `ApprovalWorkflowStepper` | Nháp, Chờ duyệt, Đã duyệt, Đã ghi sổ, Từ chối, Đã hủy, Đã đảo bút toán | UX wrapper read-only, không thay đổi logic approve/reject. |

## 5. API Safety

- Route: `GET /api/audit/entity?entityType=...&entityId=...`
- Route: `GET /api/audit/recent?limit=...&scope=financial-reports`
- Auth/RBAC: dùng `requirePermission("AUDIT", "READ")`.
- Scope: read-only audit log; không ghi DB, không tạo audit log giả.
- Pagination: limit tối đa 50 dòng.
- Secret handling: ẩn các key nhạy cảm như password, token, secret, apiKey, authorization.
- Empty state: trả `{ success: true, data: { items: [], total: 0, hasMore: false } }` khi không có log.

## 6. Human Approval Warning

Các cảnh báo vẫn giữ nguyên:

- Project/company mapping chưa có người thật duyệt.
- Cash bank journal mapping chưa có người thật duyệt.
- AP Bát Tràng chưa có người thật duyệt.
- Hệ thống không được tuyên bố production ready.

## 7. Test Results

| Lệnh | Kết quả | Ghi chú |
| ---- | ------- | ------- |
| `git status --short` | PASS | Repo đang dirty từ nhiều sprint trước; không revert thay đổi ngoài phạm vi. |
| `git branch --show-current` | PASS | `main`. |
| `git log -3 --oneline` | PASS | Đã ghi nhận baseline. |
| `npx prisma validate` | PASS | Schema hợp lệ. |
| `npx prisma generate` | FAIL | EPERM rename `query_engine-windows.dll.node`, khả năng do Node/Next giữ file lock. Không đổi schema trong sprint này. |
| `npx tsc --noEmit --pretty false` | PASS | TypeScript pass. |
| `npx eslint <files changed>` | PASS | Lint cục bộ pass cho file mới/test mới. |
| `npm run build` | PASS | Pass khi chạy ngoài sandbox; còn warning NFT trace và `url.parse()` cũ. |
| `npm run validation:database` | PASS | Read-only validation pass; 0 unbalanced posted journal, 0 orphan sampled. |
| `npm run security-check` | PASS | Viewer bị chặn, Manager qua guard đúng. |
| `npm run e2e -- tests/e2e/audit-log-ui-smoke.spec.ts` | PASS | 2/2 pass. |
| `npm run e2e -- tests/e2e/approval-workflow-ui-smoke.spec.ts` | PASS | 1/1 pass. |
| `npm run e2e -- tests/e2e/enterprise-smoke.spec.ts` | PASS | 3/3 pass. |
| `npm run e2e -- tests/e2e/financial-drilldown-smoke.spec.ts` | PASS | 1/1 pass. |
| `npm run e2e -- tests/e2e/visual-regression-pilot.spec.ts` | PASS | 2/2 pass. |
| `npm run e2e -- tests/e2e/report-excel-a4-pilot.spec.ts` | PASS | 2/2 pass. |
| `npm run e2e -- tests/e2e/print-template-pilot.spec.ts` | PASS | 2/2 pass. |

## 8. Đánh giá hệ thống sau Sprint 3A.6

### 8.1 Hệ thống mạnh hơn ở đâu?

- Người dùng đã có điểm xem audit log trực tiếp trong financial drilldown thay vì empty pilot.
- Trang reports đã có lịch sử xuất/in gần đây, giúp đối chiếu ai xuất báo cáo, thời gian và metadata audit.
- Trang approvals có stepper workflow rõ ràng hơn cho kế toán/kế toán trưởng.
- API audit read-only có RBAC, limit, empty state và ẩn dữ liệu nhạy cảm.

### 8.2 Hệ thống còn yếu ở đâu?

- Audit UI mới phủ pilot theo Project và financial reports, chưa phủ hết từng chứng từ chi phí, hóa đơn, thanh toán, tạm ứng, kho vật tư.
- Chưa có bộ lọc audit nâng cao theo người dùng, khoảng ngày, action, loại chứng từ trên UI.
- Workflow stepper trên `/approvals` chưa lấy timeline từng chứng từ chi tiết vì dữ liệu timestamp/người duyệt chưa đồng bộ đủ ở mọi model.
- `npx prisma generate` còn bị Windows file lock, cần xử lý vận hành tiến trình Node/Next.

### 8.3 Hệ thống còn thiếu gì để gần MISA/FAST hơn?

- Audit log search/filter nâng cao theo khoảng ngày, người thực hiện, loại chứng từ, action.
- Approval inbox theo vai trò và hàng đợi công việc thực tế.
- Keyboard workflow cho kế toán duyệt nhanh.
- Bulk action an toàn có confirm/audit.
- Dynamic print route QA đầy đủ.
- Excel `.xlsx` thật thay vì CSV fallback.
- Lint/type safety gate toàn repo.

### 8.4 Rủi ro còn lại

| Nhóm | Rủi ro |
| ---- | ------ |
| AUDIT_GAP | Chưa có nút audit chi tiết cho mọi chứng từ nghiệp vụ. |
| WORKFLOW_GAP | Stepper mới là UX wrapper read-only, chưa tái dựng đầy đủ actor/timestamp từng bước. |
| ACCOUNTING_DATA_RISK | Các cảnh báo Phase 2.8 vẫn cần human approval, không dùng như production ready. |
| UI_RISK | Một số màn hình cũ vẫn còn text/encoding debt ngoài phạm vi Sprint 3A.6. |
| PRINT_REPORT_GAP | Print dynamic sample QA chưa phủ hết route in chứng từ. |
| TECH_DEBT | `prisma generate` bị file lock; build còn NFT trace warning cũ. |
| UX_GAP | Chưa có audit drawer/filter nâng cao như phần mềm kế toán thương mại. |

### 8.5 Gợi ý sprint tiếp theo

Sprint phù hợp tiếp theo: `Sprint 3A.7 - Approval Inbox & Role-based Work Queue`.

Nếu muốn ưu tiên mở rộng audit trước, có thể chạy: `Sprint 3A.6B - Audit Log Search/Filter Expansion`.

## 9. Decision Gate

`A. READY_FOR_SPRINT_3A_7_APPROVAL_INBOX_ROLE_QUEUE`

Điều kiện kèm theo: chưa production ready; cần xử lý file lock Prisma generate trong môi trường Windows và tiếp tục mở rộng audit/workflow coverage ở sprint sau.

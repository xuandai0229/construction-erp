# SPRINT 3A.7 - APPROVAL INBOX & ROLE-BASED WORK QUEUE REPORT

## 1. Executive Summary

Sprint 3A.7 đã nâng trang `/approvals` thành hộp việc phê duyệt theo vai trò.

- Inbox/work queue đã thêm tại `/approvals`.
- Có tạo API read-only mới: `GET /api/approvals/work-queue`.
- Có gắn action approve/reject wrapper trên UI, gọi API hiện hữu `/api/approvals/[id]/approve` và `/api/approvals/[id]/reject`.
- Không sửa database, không sửa Prisma schema, không tạo migration.
- Không chạy mapping reconciliation, không sửa ledger, posting engine, payment allocation/accounting logic.
- Không sửa workflow backend; chỉ dùng action API hiện hữu.
- Gate sau sprint: `A. READY_FOR_SPRINT_3A_8_KEYBOARD_BULK_ACTION_SAFETY`.

## 2. Files Changed

| File | Loại sửa | Ghi chú |
| ---- | -------- | ------- |
| `services/approval-work-queue.service.ts` | READ_ONLY_INBOX_API / ROLE_BASED_QUEUE | Tổng hợp read-only Invoice, Cost, Advance, Settlement thành hàng đợi theo vai trò, KPI và trạng thái hạn xử lý. |
| `app/api/approvals/work-queue/route.ts` | READ_ONLY_INBOX_API | Endpoint read-only có auth/RBAC qua `requireAccountingAccess("READ")`, filter tab/documentType/project/date/limit. |
| `app/approvals/page.tsx` | APPROVAL_INBOX_UI / KPI_SUMMARY / APPROVAL_ACTION_WRAPPER | Trang work queue mới với KPI, tabs, search/filter, bảng công việc, confirm approve. |
| `app/components/approvals/ApprovalWorkQueueDrawer.tsx` | WORKFLOW_DETAIL_DRAWER | Drawer chi tiết có Tổng quan, Workflow, Lịch sử thao tác, Chứng từ nguồn. |
| `app/components/approvals/RejectReasonModal.tsx` | REJECT_REASON_MODAL | Chuẩn hóa tiếng Việt, bắt buộc lý do từ chối tối thiểu 5 ký tự. |
| `tests/e2e/approval-inbox-role-queue-smoke.spec.ts` | E2E_TEST | Smoke test Sprint 3A.7 cho KPI, tabs, table/empty state và drawer. |
| `tests/e2e/approval-workflow-ui-smoke.spec.ts` | E2E_TEST | Cập nhật selector scope vào stepper sau khi thêm tab “Đã duyệt”. |
| `tests/e2e/audit-log-ui-smoke.spec.ts` | E2E_TEST | Harden selector dashboard drilldown để tránh click nhầm menu trái. |

## 3. Inbox Coverage

| Nhóm | Có hiển thị | Ghi chú |
| ---- | ----------- | ------- |
| Chờ tôi xử lý | Có | Tab `pending`, KPI `Chờ tôi xử lý`, ưu tiên pending/SUBMITTED. |
| Tôi đã gửi | Có | Tab `created`, lọc chứng từ do user tạo/gửi. |
| Bị từ chối | Có | Tab `rejected`, dùng status REJECTED/CANCELLED. |
| Đã duyệt | Có | Tab `approved`, dùng APPROVED và các trạng thái đã xử lý tương đương. |
| Đã ghi sổ | Có | Tab `posted`, dùng POSTED/PAID/FULLY_SETTLED/PARTIALLY_SETTLED. |
| Tất cả | Có | Hiển thị toàn bộ trong phạm vi role/company được phép. |

## 4. Role-based Behavior

| Vai trò | Thấy gì | Thao tác gì | Ghi chú |
| ------- | ------- | ----------- | ------- |
| SUPER_ADMIN/ADMIN | Toàn bộ trong phạm vi công ty fallback | Có thể approve/reject nếu không bị SoD và API backend cho phép | Dùng RBAC hiện có. |
| CFO/GROUP_DIRECTOR | Chứng từ chờ duyệt/đã xử lý trong phạm vi công ty | Approve/reject theo hạn mức và RBAC | Chứng từ giá trị lớn hiển thị “Cần cấp cao”. |
| ACCOUNTANT/MANAGER/BRANCH_DIRECTOR | Chứng từ liên quan hoặc do mình tạo, tùy quyền đọc kế toán | Action bị disable nếu không có quyền APPROVE | Không tự cấp quyền. |
| AUDITOR/VIEWER nếu được vào màn hình | Chủ yếu xem read-only theo phân quyền | Không approve/reject nếu RBAC không cho phép | Empty state nếu không có hàng đợi. |

## 5. API Safety

- Route: `GET /api/approvals/work-queue`.
- Auth/RBAC: `requireAccountingAccess("READ")`.
- Company scope: lọc theo `user.companyId`; nếu SUPER_ADMIN không có company thì fallback công ty đầu tiên như service approvals hiện hữu.
- Không ghi DB.
- Không tạo audit log giả.
- Limit tối đa: 50 item trả về, service đọc tối đa 200 mỗi nhóm nghiệp vụ để tổng hợp.
- Empty state: trả `items: []`, summary 0 nếu không có dữ liệu phù hợp.
- Không trả dữ liệu cross-company theo filter service.

## 6. Action Safety

- Approve gọi API hiện hữu: `POST /api/approvals/[id]/approve`.
- Reject gọi API hiện hữu: `POST /api/approvals/[id]/reject`.
- Confirm approve: có modal xác nhận trước khi gọi API.
- Reject reason: bắt buộc nhập lý do tối thiểu 5 ký tự.
- Sau action thành công: refetch inbox và đóng drawer/modal.
- Backend audit: giữ theo logic hiện hữu của `ApprovalInboxService`, không sửa trong sprint này.
- Không gắn submit/post/unpost/reverse vì prompt giới hạn Phase 3A UI Pilot và backend workflow chưa được hardening trong sprint này.

## 7. Human Approval Warning

Các cảnh báo tiếp tục giữ:

- Project/company mapping chưa người thật duyệt.
- Cash bank journal mapping chưa người thật duyệt.
- AP Bát Tràng chưa người thật duyệt.
- Không production ready.
- Dữ liệu đối soát công trình/công nợ còn chờ kế toán xác nhận, không dùng làm sổ kế toán thật.

## 8. Test Results

| Lệnh | Kết quả | Ghi chú |
| ---- | ------- | ------- |
| `git status --short` | PASS | Repo vẫn dirty từ nhiều sprint trước; không revert ngoài phạm vi. |
| `git branch --show-current` | PASS | `main`. |
| `git log -3 --oneline` | PASS | `211d31c`, `92f1dbc`, `d1a5b4f`. |
| `npx prisma validate` | PASS | Schema hợp lệ. |
| `npx tsc --noEmit --pretty false` | PASS | TypeScript pass. |
| `npx eslint <files changed>` | PASS | File sửa và test mới pass. |
| `npm run build` | PASS | Pass ngoài sandbox; còn warning NFT trace và `url.parse()` cũ. |
| `npm run validation:database` | PASS | Read-only validation pass; 0 unbalanced posted journal, 0 orphan sampled. |
| `npm run security-check` | PASS | Viewer bị chặn, Manager qua guard đúng. |
| `npm run e2e -- tests/e2e/approval-inbox-role-queue-smoke.spec.ts` | PASS | 1/1 pass. |
| `npm run e2e -- tests/e2e/enterprise-smoke.spec.ts` | PASS | 3/3 pass. |
| `npm run e2e -- tests/e2e/financial-drilldown-smoke.spec.ts` | PASS | 1/1 pass. |
| `npm run e2e -- tests/e2e/visual-regression-pilot.spec.ts` | PASS | 2/2 pass. |
| `npm run e2e -- tests/e2e/audit-log-ui-smoke.spec.ts` | PASS | 2/2 pass sau khi harden selector. |
| `npm run e2e -- tests/e2e/approval-workflow-ui-smoke.spec.ts` | PASS | 1/1 pass sau khi scope selector vào stepper. |
| `npm run e2e -- tests/e2e/report-excel-a4-pilot.spec.ts` | PASS | 2/2 pass. |
| `npm run e2e -- tests/e2e/print-template-pilot.spec.ts` | PASS | 2/2 pass. |

## 9. Đánh giá hệ thống sau Sprint 3A.7

### 9.1 Hệ thống mạnh hơn ở đâu?

- `/approvals` đã trở thành hộp việc thật hơn: có KPI, tabs, bảng công việc, hạn xử lý, mức ưu tiên và người đang xử lý.
- Người duyệt thấy rõ chứng từ quá hạn, sắp đến hạn, bị từ chối, đã duyệt, đã ghi sổ.
- Drawer chi tiết tái sử dụng workflow stepper và audit trail, giúp truy vết trước khi duyệt.
- Action approve/reject có confirm/refetch và không tạo action fake.

### 9.2 Hệ thống còn yếu ở đâu?

- Work queue mới mới phủ Invoice, Cost, Advance, Settlement; chưa phủ CashBankDocument, InventoryDocument, JournalEntry bằng cùng một endpoint.
- `submittedAt` còn dùng `updatedAt` khi model không có submitted timestamp riêng.
- Role queue dựa trên RBAC hiện hữu và dữ liệu model hiện tại; chưa có bảng assignment/workflow step đầy đủ cho từng chứng từ.
- Chưa có bulk action, delegation, notification và SLA reminder thật.

### 9.3 Hệ thống còn thiếu gì để gần MISA/FAST hơn?

- Bulk approval an toàn.
- Delegation/ủy quyền duyệt.
- Approval SLA/nhắc hạn.
- Mobile notification/email notification.
- Audit log search/filter nâng cao.
- Dynamic print route QA.
- Excel `.xlsx` thật.
- Lint/type safety gate toàn repo.

### 9.4 Rủi ro còn lại

| Nhóm | Rủi ro |
| ---- | ------ |
| WORKFLOW_GAP | Chưa có workflow assignment/timestamp đầy đủ cho từng bước phê duyệt. |
| AUDIT_GAP | Audit detail có nhưng chưa có filter nâng cao trong drawer. |
| ACCOUNTING_DATA_RISK | Dữ liệu Phase 2.8 vẫn cần human approval trước khi dùng chính thức. |
| UI_RISK | Một số màn hình cũ ngoài `/approvals` vẫn còn nợ text/encoding/visual. |
| RBAC_RISK | Role behavior dựa trên RBAC hiện hữu, cần kiểm thử thêm theo từng role thật. |
| TECH_DEBT | Build còn warning NFT trace và `url.parse()` cũ. |
| UX_GAP | Chưa có phím tắt/bulk action/duyệt nhanh kiểu MISA/FAST. |

### 9.5 Gợi ý sprint tiếp theo

Sprint phù hợp tiếp theo: `Sprint 3A.8 - Keyboard Workflow & Bulk Action Safety`.

Nếu muốn mở rộng audit/filter trước: `Sprint 3A.6B - Audit Log Search/Filter Expansion`.

Nếu muốn hoàn thiện print dynamic trước: `Sprint 3A.5B - Dynamic Print Sample QA & Template Completion`.

## 10. Decision Gate

`A. READY_FOR_SPRINT_3A_8_KEYBOARD_BULK_ACTION_SAFETY`

Không production ready. Gate này chỉ xác nhận Sprint 3A.7 UI pilot đã đủ ổn để chuyển sang keyboard workflow và bulk action safety.

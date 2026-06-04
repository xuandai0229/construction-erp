# SPRINT 3A.8 - KEYBOARD WORKFLOW & BULK ACTION SAFETY REPORT

## 1. Executive Summary

Sprint 3A.8 đã bổ sung keyboard workflow cho màn hình `/approvals`: J/ArrowDown, K/ArrowUp, Enter, Esc, A, R, `/`, Space và `?`.

Màn hình đã có row selection, thanh bulk action, bulk preview, confirm modal, reject reason bắt buộc và bảng kết quả xử lý từng dòng.

Bulk action đang bật thật theo mô hình wrapper tuần tự gọi API approve/reject hiện hữu theo từng chứng từ. Không tạo backend bulk API mới. Bulk action chỉ chạy khi toàn bộ dòng đã chọn đạt guard `ELIGIBLE`; nếu có dòng không hợp lệ thì nút bị disable và UI hiển thị lý do.

Không sửa database, không sửa Prisma schema, không tạo migration, không apply mapping, không sửa ledger/posting/payment/source-of-truth.

Gate đề xuất sau sprint: `A. READY_FOR_SPRINT_3A_9_APPROVAL_SLA_NOTIFICATION_DELEGATION`.

## 2. Files Changed

| File | Loại sửa | Ghi chú |
| ---- | -------- | ------- |
| `app/approvals/page.tsx` | KEYBOARD_SHORTCUTS, ROW_SELECTION, BULK_TOOLBAR, BULK_PREVIEW, BULK_APPROVE_WRAPPER, BULK_REJECT_WRAPPER, RBAC_SOD_DISABLED_REASON, RESULT_PANEL | Thêm keyboard workflow, chọn dòng, preview guard và xử lý hàng loạt tuần tự qua API hiện hữu. |
| `app/components/approvals/ApprovalWorkQueueDrawer.tsx` | RBAC_SOD_DISABLED_REASON | Sửa tiếng Việt/encoding trong drawer chi tiết được mở bằng Enter. Không đổi logic. |
| `app/components/approvals/RejectReasonModal.tsx` | REJECT_REASON_MODAL | Sửa tiếng Việt/encoding, giữ validate lý do tối thiểu 5 ký tự. |
| `tests/e2e/approval-keyboard-bulk-safety.spec.ts` | E2E_TEST | Test render `/approvals`, shortcut, selection, bulk preview và yêu cầu confirm/reject reason. |

## 3. Keyboard Coverage

| Phím | Chức năng | Có confirm không | Ghi chú |
| ---- | --------- | ---------------- | ------- |
| J / ArrowDown | Chuyển focus xuống dòng tiếp theo | Không | Chỉ đổi focus, không xử lý nghiệp vụ. |
| K / ArrowUp | Chuyển focus lên dòng trước | Không | Chỉ đổi focus, không xử lý nghiệp vụ. |
| Enter | Mở drawer chi tiết dòng đang focus | Không | Không approve/reject trực tiếp. |
| Esc | Đóng drawer/modal/help/result | Không | Không gọi API. |
| A | Mở modal xác nhận phê duyệt nếu có quyền | Có | Không tự approve trực tiếp bằng phím. |
| R | Mở modal từ chối nếu có quyền | Có | Reject bắt buộc nhập lý do. |
| `/` | Focus ô tìm kiếm | Không | Không kích hoạt khi đang nhập input/textarea/select. |
| Space | Chọn hoặc bỏ chọn dòng đang focus | Không | Chỉ đổi selection. |
| `?` | Mở modal trợ giúp phím tắt | Không | Có thể tắt phím tắt bằng checkbox. |

## 4. Bulk Action Coverage

| Action | Trạng thái | Guard | Ghi chú |
| ------ | ---------- | ----- | ------- |
| Bulk approve | Bật thật qua wrapper tuần tự | RBAC, status, priority, required info, `canApprove` | Gọi `/api/approvals/[id]/approve` từng dòng sau preview và confirm. |
| Bulk reject | Bật thật qua wrapper tuần tự | RBAC, status, priority, required info, `canReject`, reject reason | Gọi `/api/approvals/[id]/reject` từng dòng sau preview, confirm và lý do tối thiểu 5 ký tự. |
| Bulk clear selection | Bật | Không cần backend | Xóa selection trên UI. |
| Bulk open preview | Bật | Chỉ mở nếu không có dòng bị chặn | Nếu có blocked row, nút approve/reject bị disable. |

## 5. Safety Guards

| Guard | Đã có UI chưa | Backend có kiểm tra không | Ghi chú |
| ----- | ------------- | ------------------------- | ------- |
| RBAC | Có | Có, qua API approve/reject hiện hữu | UI không tự cấp quyền. |
| SoD | Có theo `canApprove/canReject` | Có trong service approve/reject hiện hữu | UI hiển thị lý do không đủ quyền hoặc bị chặn bất kiêm nhiệm. |
| Invalid status | Có | Có trong API/service hiện hữu | Dòng không ở trạng thái chờ duyệt bị chặn bulk. |
| High value approval | Có | Theo policy hiện hữu nếu service/API áp dụng | UI chặn dòng priority `Cần cấp cao`. |
| Human approval warning | Có | Không thay đổi backend | Vẫn hiển thị cảnh báo chưa dùng làm sổ kế toán thật. |
| Double submit prevention | Có ở UI | Backend hiện hữu chịu trách nhiệm nghiệp vụ | Button disabled khi `actionBusy`; bulk chạy tuần tự, không song song. |
| Reject reason required | Có | Có theo API reject hiện hữu nếu backend validate | UI yêu cầu tối thiểu 5 ký tự cho single và bulk reject. |

## 6. Action Result Handling

Có result panel sau bulk action.

Có báo kết quả từng dòng: loại chứng từ, số chứng từ, số tiền, kết quả và lý do lỗi nếu có.

Có refetch inbox sau khi xử lý.

Có xử lý partial failure: dòng fail được ghi `Thất bại`, lỗi không bị nuốt, các dòng còn lại tiếp tục theo policy tuần tự.

## 7. Human Approval Warning

Project/company mapping chưa người thật duyệt.

Cash bank journal mapping chưa người thật duyệt.

AP Bát Tràng chưa người thật duyệt.

Không production ready.

Sprint này không sửa reconciliation mapping, không sửa AP Bát Tràng, không sửa source-of-truth báo cáo và không thay đổi ledger/posting/payment.

## 8. Test Results

| Lệnh | Kết quả | Ghi chú |
| ---- | ------- | ------- |
| `npx prisma validate` | PASS | Schema hợp lệ. |
| `npx eslint app/approvals/page.tsx app/components/approvals/ApprovalWorkQueueDrawer.tsx app/components/approvals/RejectReasonModal.tsx tests/e2e/approval-keyboard-bulk-safety.spec.ts` | PASS | Lint riêng file sửa đã pass sau khi bỏ setState trực tiếp trong effect. |
| `npx tsc --noEmit --pretty false` | PASS | Typecheck pass. |
| `npm run build` | PASS | Chạy ngoài sandbox do `.next/trace` bị EPERM trong sandbox. Build còn warning cũ về NFT trace ở `audited-export` và `url.parse`. |
| `npm run validation:database` | PASS | Chạy ngoài sandbox do script ghi `docs/audit/phase1-readonly-validation.json`. |
| `npm run security-check` | PASS | Viewer bị guard chặn, Manager pass guard. |
| `npm run e2e -- ...required specs... approval-keyboard-bulk-safety.spec.ts` | 13 PASS, 2 timeout ở lượt tổng | Test mới 3A.8 PASS. Hai test financial drilldown/audit-log timeout khi chạy song song. |
| `npm run e2e -- tests/e2e/financial-drilldown-smoke.spec.ts tests/e2e/audit-log-ui-smoke.spec.ts` | PASS | Rerun riêng 3 test cũ pass, xác nhận lỗi lượt tổng là flaky/timeout, không phải regression 3A.8. |

## 9. Đánh giá hệ thống sau Sprint 3A.8

### 9.1 Hệ thống mạnh hơn ở đâu?

Người dùng kế toán có thể thao tác nhanh hơn trên hộp duyệt bằng bàn phím, chọn nhiều chứng từ và xem preview guard trước khi xử lý.

Bulk approve/reject không bypass audit backend vì vẫn gọi API hiện hữu theo từng chứng từ.

UI giảm rủi ro duyệt nhầm bằng confirm modal, reject reason bắt buộc, disabled state và result panel.

### 9.2 Hệ thống còn yếu ở đâu?

Bulk action vẫn là wrapper tuần tự ở UI, chưa có backend bulk transaction/job queue chuyên biệt.

Guard high-value/human approval hiện dựa vào dữ liệu work queue và service hiện hữu; chưa có workflow assignment table động đầy đủ.

Một số E2E cũ về financial drilldown có hiện tượng flaky khi chạy song song toàn bộ suite.

### 9.3 Hệ thống còn thiếu gì để gần MISA/FAST hơn?

Delegation/ủy quyền duyệt.

Approval SLA/nhắc hạn.

Notification/email/in-app notification.

Audit filter nâng cao.

Dynamic print route QA.

Excel `.xlsx` thật.

Workflow assignment table thật.

Lint/type safety gate ổn định cho toàn repo.

### 9.4 Rủi ro còn lại

`WORKFLOW_GAP`: chưa có cấu hình workflow assignment động đầy đủ.

`BULK_ACTION_RISK`: bulk wrapper tuần tự chưa có backend job/transaction tổng thể.

`AUDIT_GAP`: audit backend giữ theo API từng dòng, chưa có batch correlation id cho cả phiên bulk.

`ACCOUNTING_DATA_RISK`: các cảnh báo human approval từ Phase 2.8F vẫn còn, không production ready.

`UI_RISK`: E2E song song có flaky timeout ở financial drilldown cũ.

`TECH_DEBT`: build còn warning NFT trace và deprecation `url.parse` không thuộc phạm vi 3A.8.

`UX_GAP`: chưa có assignment/notification/SLA như phần mềm kế toán chuyên nghiệp.

### 9.5 Gợi ý sprint tiếp theo

Nếu tiếp tục Phase 3A theo đúng luồng: `Sprint 3A.9 - Approval SLA, Notification & Delegation Pilot`.

Nếu muốn khóa bulk action chặt hơn trước: `Sprint 3A.8B - Bulk Action Guard Hardening`.

Nếu ưu tiên audit trước: `Sprint 3A.6B - Audit Log Search/Filter Expansion`.

## 10. Decision Gate

`A. READY_FOR_SPRINT_3A_9_APPROVAL_SLA_NOTIFICATION_DELEGATION`

Không production ready.

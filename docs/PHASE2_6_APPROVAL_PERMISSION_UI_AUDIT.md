# SPRINT 2.6 AUDIT REPORT: APPROVAL & PERMISSION INBOX

## 1. Phân Tích Hệ Thống RBAC & Phân Quyền Hiện Có (UserRole)
Hệ thống sử dụng enum `UserRole` gồm các vai trò sau:
* `ADMIN` / `SUPER_ADMIN`
* `GROUP_DIRECTOR` (Giám đốc tập đoàn)
* `CFO` (Giám đốc tài chính / Kế toán trưởng)
* `BRANCH_DIRECTOR` (Giám đốc chi nhánh)
* `ACCOUNTANT` (Kế toán viên)
* `MANAGER` (Quản lý dự án / chỉ huy trưởng)
* `VIEWER` (Khách xem)
* `AUDITOR` (Kiểm toán viên độc lập)

Quyền hạn phê duyệt trong mã nguồn hiện có được kiểm tra thông qua `requireProjectPermission(projectId, module, action)` hoặc `requireAccountingAccess(action)`.

---

## 2. Phân Tích Quy Trình Phê Duyệt Từng Phân Hệ (Approval Flows)

Hệ thống hiện tại có các endpoint duyệt riêng cho từng chứng từ/phân hệ:
* **Hóa đơn đầu ra (Invoice)**: `POST /api/invoices/[id]/approve` -> gọi `RevenueService.updateInvoiceApproval`.
* **Đề nghị tạm ứng (Advance)**: `POST /api/advances/[id]/approve` -> gọi `AdvanceService.approveAdvance` / `rejectAdvance`.
* **Quyết toán tạm ứng (Settlement)**: `POST /api/settlements/[id]/approve` -> gọi `AdvanceService.approveSettlement` / `rejectSettlement`.
* **Chứng từ chi phí đầu vào (CostRecord)**: `POST /api/costs/[id]/approve` -> cập nhật `approvalStatus` của `CostRecord`.
* **Phiếu hạch toán tổng hợp (Voucher)**: `POST /api/accounting/vouchers/[id]/approve` -> duyệt định khoản, ghi sổ cái (`posted`).

---

## 3. Khoảng Trống Nghiệp Vụ & Thiết Kế (Gaps)

* **Thiếu Approval Inbox tập trung**: Chưa có màn hình hiển thị danh sách chứng từ chờ duyệt gom từ tất cả các phân hệ. Kế toán trưởng/Giám đốc phải vào từng màn hình (Invoice, Costs, Debt, Revenue) để tìm kiếm và duyệt lẻ tẻ.
* **Quy trình Self-Approval chưa được chặn triệt để**: Người tạo chứng từ (kế toán viên) vẫn có thể tự phê duyệt chứng từ của chính mình nếu được gán quyền duyệt dự án đó, điều này vi phạm nghiêm trọng nguyên tắc bất kiêm nhiệm (Segregation of Duties - SoD).
* **Thiếu Lý do từ chối trên UI**: Nút Từ chối (Reject) đôi khi chỉ cập nhật status mà không bắt buộc nhập lý do (comment/reason), gây khó khăn cho việc tra cứu lịch sử từ chối của cấp dưới.
* **Thiếu Audit Timeline trên UI**: Người duyệt không thể nhìn thấy lịch sử di chuyển trạng thái, người lập, người kiểm soát trước khi bấm Duyệt.

---

## 4. Bảng Đánh Giá Chi Tiết Phân Hệ Phê Duyệt (Audit Matrix)

| Phân hệ | Hiện trạng | Thiếu gì | Rủi ro | Đề xuất |
| :--- | :--- | :--- | :--- | :--- |
| **Invoice** | Đã có API Duyệt/Từ chối riêng biệt | Đưa vào Inbox tập trung; kiểm tra SoD | Người tạo tự duyệt hóa đơn sai lệch | Tích hợp Inbox + chặn self-approval |
| **Payment / Voucher** | Đã có API Duyệt & Ghi sổ cái | Tích hợp giao diện kiểm tra chéo trước khi ghi sổ | Ghi sổ nhầm chứng từ chưa được kiểm soát | Chỉ cho phép ghi sổ khi đã phê duyệt |
| **Costs** | Cập nhật trực tiếp `approvalStatus` | Tích hợp logic duyệt đồng bộ | Duyệt chi phí không khớp dự toán | Kiểm tra cảnh báo vượt ngân sách |
| **Advance** | Đã có API Duyệt/Từ chối | UI duyệt tập trung thân thiện | Tạm ứng vượt định mức | Hiển thị tổng dư nợ tạm ứng hiện tại |
| **Settlement** | Đã có API Duyệt & Tạo bút toán | Drawer hiển thị chi tiết hóa đơn gốc | Quyết toán khống không có chứng từ | Bắt buộc đối chiếu hóa đơn thực tế |

---

## 5. Câu Trả Lời Cho Các Câu Hỏi Khảo Sát

1. **Có approval inbox tập trung chưa?**
   * *Chưa*. Hiện hệ thống chỉ có `ActionCenterService` hỗ trợ lấy các task phê duyệt nhưng ở dạng thông báo tổng quát, chưa có màn hình giao diện người dùng chuyên trách (`/approvals`).
2. **Có màn hình chứng từ chờ tôi duyệt chưa?**
   * *Chưa*. Cần xây dựng màn hình `/approvals` với tab "Chờ tôi duyệt".
3. **Có phân biệt chứng từ tôi tạo và chứng từ tôi cần duyệt không?**
   * *Chưa rõ ràng trên giao diện*. Cần phân tách thành các tab riêng biệt: "Chờ tôi duyệt" (Pending) và "Tôi đã tạo" (My Created).
4. **Có lý do từ chối không?**
   * *API có hỗ trợ trường comment/reason nhưng UI chưa bắt buộc*. Cần ép nhập lý do tối thiểu 5 ký tự khi từ chối chứng từ.
5. **Có lịch sử duyệt không?**
   * *Có lưu trong AuditLog và ApprovalStep*, nhưng chưa hiển thị trực quan dạng Timeline dưới giao diện.
6. **Có SLA/quá hạn duyệt không?**
   * *Có logic tính daysWaiting trong ActionCenterService*, cần kéo dữ liệu này ra giao diện để tô màu cảnh báo quá hạn.
7. **Có filter theo module, công trình, trạng thái, người tạo, kỳ kế toán không?**
   * *Chưa có*. Cần xây dựng bộ lọc đa năng trên giao diện Inbox.
8. **Có audit timeline trên UI chưa?**
   * *Chưa có*. Sẽ thiết kế một component timeline lịch sử chứng từ ở Detail Drawer.
9. **Có rule chặn self-approval trên UI không?**
   * *Chưa có*. Cần chặn nút Approve nếu `createdById` trùng với ID của `User` đang đăng nhập.

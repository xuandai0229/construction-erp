# THIẾT KẾ HỆ THỐNG PHÊ DUYỆT TẬP TRUNG (APPROVAL INBOX & PERMISSION MATRIX)

Bản tài liệu này phác thảo kiến trúc luồng dữ liệu, cấu trúc giao diện người dùng và cơ chế kiểm soát chốt chặn an toàn cho phân hệ phê duyệt tập trung trong hệ thống ERP.

---

## 1. Luồng Nghiệp Vụ & Cơ Chế Chốt Chặn (Business Logic Guards)

### 1.1. Chống Tự Phê Duyệt (Anti Self-Approval - SoD)
Để tuân thủ chuẩn kiểm toán Big 4, hệ thống kiểm soát nghiêm ngặt:
* **API level**: Chặn hành vi phê duyệt nếu người dùng gửi yêu cầu chính là người tạo chứng từ (`requesterId === approverId` hoặc `createdById === currentUserId`).
* **UI level**: Ẩn hoặc disable nút "Phê duyệt" (Approve) và hiển thị cảnh báo đỏ `"Bạn không thể tự phê duyệt chứng từ do chính mình tạo ra"`.

### 1.2. Ép Nhập Lý Do Từ Chối (Mandatory Rejection Comment)
* Khi bấm "Từ chối" (Reject), một modal pop-up sẽ mở ra, bắt buộc người dùng phải nhập lý do từ chối tối thiểu 5 ký tự. Nếu không nhập, nút bấm sẽ bị vô hiệu hóa.

### 1.3. Khóa Kỳ Kế Toán (Fiscal Period Locked Guard)
* Nếu chứng từ thuộc một kỳ kế toán đã bị khóa (`isLocked === true`), hệ thống sẽ vô hiệu hóa tất cả các hành động phê duyệt / từ chối và hiển thị thông báo `"Kỳ kế toán đã đóng - Chứng từ không thể thay đổi"`.

---

## 2. Thiết Kế Giao Diện Người Dùng (UX Components)

### 2.1. Màn hình Approval Inbox (`/approvals`)
Giao diện hiển thị danh sách chứng từ chờ duyệt đa chức năng, hỗ trợ phân loại bằng các tab:
1. **Chờ tôi duyệt (Pending Action)**: Danh sách chứng từ cần tài khoản hiện tại phê duyệt.
2. **Tôi đã xử lý (My History)**: Lịch sử các chứng từ mà tài khoản hiện tại đã Duyệt/Từ chối.
3. **Yêu cầu tôi tạo (My Created)**: Các chứng từ do chính tài khoản này tạo ra đang đợi cấp trên duyệt.
4. **Bảng phân quyền (Permission Matrix)**: Xem nhanh ma trận quyền hạn giữa các vai trò trong hệ thống.

#### Cột danh sách bảng:
* **Loại**: `HÓA ĐƠN`, `TẠM ỨNG`, `QUYẾT TOÁN`, `CHI PHÍ`, `CHỨNG TỪ`.
* **Số chứng từ**: Hiển thị mã số hoặc ID của chứng từ kèm liên kết xem chi tiết.
* **Dự án**: Tên công trình xây dựng liên quan.
* **Số tiền**: Hiển thị định dạng tiền tệ VND trực quan.
* **Người tạo**: Tên kế toán lập chứng từ.
* **Ngày tạo / Chờ xử lý**: Hiển thị thời gian trôi qua để nhắc nhở phê duyệt (SLA).
* **Hành động**: Xem nhanh hoặc mở Drawer phê duyệt chi tiết.

### 2.2. Drawer Chi Tiết Phê Duyệt (Approval Detail Drawer)
Drawer xuất hiện từ phía bên phải màn hình khi click dòng chứng từ:
* **Thông tin tóm tắt**: Hiển thị toàn bộ các thuộc tính nghiệp vụ của chứng từ đó.
* **Bảng Định Khoản Tự Động (Nếu có)**: Thể hiện các bút toán Nợ (Debit) / Có (Credit) liên quan.
* **Bảng Truy Vết Tài Chính (Financial Trace)**: Hiển thị liên kết Hợp đồng -> Hóa đơn -> Thanh toán.
* **Lịch Sử Quy Trình Phê Duyệt (Approval Timeline)**: Hiển thị các bước duyệt và lý do từ chối nếu có từ trước.

### 2.3. Giao diện Ma Trận Quyền Hạn (Permission Matrix View)
* Hiển thị bảng lưới trực quan giữa các vai trò `SUPER_ADMIN`, `CFO`, `ACCOUNTANT`, `MANAGER` và các hành động tương ứng (`VIEW`, `CREATE`, `APPROVE`, `POST`, `EXPORT`, `PRINT`) trên từng phân hệ.

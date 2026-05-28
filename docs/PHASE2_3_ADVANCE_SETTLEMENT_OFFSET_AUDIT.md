# PHASE 2.3: ADVANCE / SETTLEMENT / OFFSET AUDIT

## 1. Mục tiêu
Rà soát trạng thái hiện tại của nghiệp vụ Tạm ứng (Advance), Hoàn ứng (Settlement), và Đối trừ (Offset) trong hệ thống kế toán xây dựng.

## 2. Kết quả Audit

| Nội dung | Hiện trạng | Rủi ro | Đề xuất |
| -------- | ---------- | ------ | ------- |
| **Model Tạm ứng (AdvanceRequest)** | Chưa có schema riêng cho AdvanceRequest. | Tiền xuất khỏi quỹ nhưng mất dấu (Orphan money), không biết đang nằm ở hợp đồng/cá nhân nào, tiến độ hoàn ứng ra sao. | Thiết kế schema `AdvanceRequest` chuyên biệt để quản lý lifecycle (Draft -> Approved -> Paid). |
| **Model Đối trừ (Settlement/Offset)** | Chưa có schema. Việc thanh toán (Payment) chỉ là 1:1 với Hóa đơn. | Không thể cấn trừ tự động tạm ứng vào hóa đơn (ví dụ: hóa đơn 100tr, đã tạm ứng 30tr, chỉ cần thu/chi 70tr). Kế toán phải làm thủ công ngoài hệ thống. | Tạo model `Settlement` nối giữa `AdvanceRequest` và `Invoice`. |
| **API/Route xử lý tạm ứng** | Chưa tồn tại. | User không có màn hình/chức năng tạm ứng/đối trừ. | Xây dựng API nền tảng: `POST /api/advances`, `POST /api/advances/[id]/settle`. |
| **Report Tạm ứng chưa hoàn** | Chưa có. | Thất thoát tài sản công ty do nhân viên/thầu phụ chây ì hoàn ứng. | Tạo report `Outstanding Advances` gom nhóm theo Supplier/Employee và theo Hợp đồng. |
| **Phân biệt đối tượng tạm ứng** | Schema hiện tại không có, vì model chưa tồn tại. | Nếu gộp chung, luồng hạch toán sẽ bị sai tài khoản (TK 141 Nhân viên vs TK 331 Thầu phụ). | Model `AdvanceRequest` phải có field `recipientType` (EMPLOYEE/VENDOR) và ID tương ứng. |
| **Dữ liệu lịch sử cần migrate** | Không có (vì chưa có bảng cũ). | Không rủi ro. | Không cần migration chuyển đổi, chỉ cần create table mới ở Sprint sau. |

## 3. Tổng kết
Hệ thống hiện tại hoàn toàn "trắng" về nghiệp vụ Tạm ứng/Hoàn ứng (Zero footprint). Đây là gap lớn so với thực tế quản trị xây dựng. Do yêu cầu Sprint 2.3 không tạo Migration lớn ngay, chúng ta sẽ bắt đầu bằng việc thiết kế quy trình, tạo Guard Policy và viết Test Logic/Audit Report giả định trước (Implementation pending schema).

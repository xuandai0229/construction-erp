# PHASE 2.3: ADVANCE / SETTLEMENT / OFFSET DESIGN

## 1. Quy tắc Thiết kế (Design Principles)
* **Bất biến (Immutability):** Các đối trừ/tạm ứng sau khi ghi sổ cái (POSTED) không được sửa/xóa, chỉ được phép hủy/đảo (REVERSED).
* **Nguồn gốc rõ ràng (Traceability):** Mọi khoản đối trừ phải xác định rõ Nguồn (Tạm ứng A) và Đích (Hóa đơn B).
* **Phân tách trách nhiệm (SoD):** Người lập đề nghị tạm ứng không được tự phê duyệt tiền.

## 2. Thiết kế Vòng đời Tạm ứng (Advance Lifecycle)
Áp dụng chung cho cả Nhà cung cấp (Vendor) và Nhân viên (Employee):
* `DRAFT`: Đang lập đề nghị, có thể sửa đổi thoải mái.
* `SUBMITTED`: Đã trình duyệt, chờ cấp quản lý/kế toán duyệt.
* `APPROVED`: Đã duyệt chi (bút toán chưa sinh).
* `PAID`: Kế toán thanh toán đã xuất tiền. Sinh bút toán (Nợ 141/331 - Có 111/112).
* `PARTIALLY_SETTLED`: Đã hoàn ứng/đối trừ một phần với hóa đơn thực tế.
* `FULLY_SETTLED`: Đã hoàn ứng/đối trừ toàn bộ 100%. Đóng luồng.
* `OVERDUE`: Quá hạn hoàn ứng (cảnh báo trên report).
* `REVERSED/CANCELLED`: Đã hủy (trước khi Paid) hoặc Đảo bút toán (sau khi Paid).

## 3. Thiết kế Bút toán Ghi sổ (Posting Rules)
### A. Tạm ứng Nhân viên/Công trình (TK 141)
* **Khi chi tiền (PAID):** 
  * Nợ TK 141 (Chi tiết Nhân viên)
  * Có TK 111/112
* **Khi hoàn ứng (SETTLED) bằng Hóa đơn/Chi phí:**
  * Nợ TK 621/622/627 (Chi tiết Công trình) / Có TK 141
* **Khi hoàn ứng (SETTLED) bằng Tiền mặt (Chi thừa thu lại):**
  * Nợ TK 111/112 / Có TK 141

### B. Tạm ứng Nhà thầu phụ/Cung cấp (TK 331)
* **Khi chi tiền (PAID):**
  * Nợ TK 331 (Chi tiết Nhà cung cấp)
  * Có TK 111/112
* **Khi đối trừ với Nghiệm thu/Hóa đơn mua vào (SETTLED):**
  * Tự động hạch toán cấn trừ (hoặc chỉ làm giảm số công nợ phải trả, không sinh bút toán mới nếu đã dùng TK 331).

## 4. Thiết kế Đối trừ (Offset Rules)
* **Không cho offset** nếu chứng từ Tạm ứng chưa `PAID` và Hóa đơn chưa `APPROVED`.
* **Không cho offset vượt** số dư tạm ứng còn lại hoặc số nợ hóa đơn còn lại.
* **Không cho offset chéo công ty** (Cross-company). Phải cùng `companyId`.
* **Không cho offset chéo đối tượng** (Khác Supplier/Employee) ngoại trừ có cờ `overrideRole` (dành cho kế toán trưởng xử lý công nợ tam giác).
* Mỗi lần offset phải sinh 1 record trong bảng `Settlement` (chờ Schema tạo ở Sprint 2.3B).

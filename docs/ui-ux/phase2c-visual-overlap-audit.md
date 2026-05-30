# Báo cáo Kiểm tra Visual Overlap & Bố cục Bảng — Phase 2C

Báo cáo kiểm thử giao diện thực tế (Visual Overlap Audit) được thực hiện bởi Senior Frontend QA Auditor trên toàn bộ 14 route chính của hệ thống Construction ERP.

---

## 1. DANH SÁCH VẤN ĐỀ PHÁT HIỆN & ĐỀ XUẤT SỬA ĐỔI

| STT | Route / Trang | File Liên Quan | Vấn Đề Phát Hiện | Mức Độ | Nguyên Nhân Nghi Ngờ | Cách Sửa Đề Xuất | Cần Sửa Ngay? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `/` (Tổng quan Dashboard) | `app/page.tsx` (Thành phần Debt Aging) | Cột `"SỐ NGÀY QUÁ HẠN"` trong bảng Debt Aging bị co lại thành `"SỐ NGÀY QU"`, chữ bị cắt cụt. | **High** | Component `EnterpriseTable` có thuộc tính `table-fixed` nhưng cột này không được chỉ định `width` hoặc `min-width` tối thiểu phù hợp trong mảng định nghĩa cột. | Định nghĩa rõ `width` hoặc `minWidth` tối thiểu (ví dụ: `150px`) cho cột số ngày quá hạn trong cấu hình bảng Debt Aging. | **Có** |
| **2** | `/` (Tổng quan Dashboard) | `app/page.tsx` (Thành phần Exception Alerts) | Alert card empty state (khi không có cảnh báo) hiển thị lệch hẳn sang phải và sinh ra thanh cuộn ngang (horizontal scroll) xấu xí trong lòng thẻ Card. | **High** | Thẻ bọc chứa trạng thái trống không được căn giữa chính xác hoặc thuộc tính width/position có độ rộng cố định quá lớn so với Card container. | Sử dụng bố cục Flexbox căn giữa hoàn hảo (`flex flex-col items-center justify-center text-center w-full`) và loại bỏ các width cố định gây tràn. | **Có** |
| **3** | `/reports` (Bảng báo cáo tài chính) | `app/reports/page.tsx` | Cột `"SỐ DƯ CUỐI KỲ"` trong bảng `TÀI SẢN` (Assets) và `NGUỒN VỐN` bị co thành `"SỐ D..."` ở màn hình laptop thông thường. | **High** | Thuộc tính `table-fixed` ép cột quá hẹp khi độ rộng màn hình giới hạn; thiếu thanh cuộn ngang an toàn (`overflow-x-auto`) cho từng bảng hoặc thiếu minWidth cột. | Tăng `minWidth` của toàn bộ bảng hoặc bổ sung thuộc tính `width` lớn hơn cho cột số dư cuối kỳ, đồng thời bọc container có `overflow-x-auto`. | **Có** |
| **4** | `/projects` (Danh sách dự án) | `app/components/projects/ProjectTable.tsx` | Cột trạng thái `"TRẠNG THÁI"` ngoài cùng bên phải bị ép chật, tiêu đề cột biến thành `"TRẠ"`, nội dung ô bị cắt thành `"LẬP KH..."`. | **Critical** | Bảng có 9 cột nhưng tổng `minWidth` là `"1750px"`, trong đó cột trạng thái và cột hành động bị chia sẻ không đều hoặc thiếu thuộc tính co giãn hợp lý khi màn hình nhỏ. | Nâng cấp thuộc tính `minWidth` của cột trạng thái, chuyển các nút bấm hành động (Chi tiết, Sửa, Đóng, Xóa) quá nhiều thành một menu xổ xuống `"Thao tác"` gọn gàng, tiết kiệm không gian. | **Có** |
| **5** | `/projects` (Danh sách dự án) | `app/components/projects/ProjectTable.tsx` | Không có thanh cuộn ngang khi xem trên màn hình nhỏ hoặc máy tính bảng làm cho phần bên phải của bảng bị cắt mất hẳn. | **High** | Thẻ bọc ngoài cùng không được thiết lập thuộc tính `overflow-x-auto` đúng cách hoặc bị ảnh hưởng bởi layout cha có `overflow-hidden`. | Đảm bảo thẻ bọc ngoài của bảng luôn có lớp `overflow-x-auto w-full scrollbar-thin` hoạt động mượt mà. | **Có** |

---

## 2. KẾ HOẠCH NÂNG CẤP & ĐẠI TU

### 2.1. Nâng cấp Component `EnterpriseTable` (Đồng bộ toàn bộ bảng)
Chúng ta sẽ nâng cấp trực tiếp component `app/components/ui-enterprise/EnterpriseTable.tsx` để hỗ trợ:
1. **Responsive Horizontal Scroll:** Đảm bảo có thẻ bọc `div className="overflow-x-auto w-full"` với thanh cuộn mịn.
2. **Column Custom Width & Alignment:** Thêm khả năng xử lý cột co giãn linh hoạt, cấu hình `minWidth` từng cột độc lập.
3. **Tooltip cho nội dung bị cắt:** Thêm tooltip tự động cho những ô có văn bản dài bị `truncate` để tránh đẩy layout.
4. **Tabular Numbers:** Định dạng các cột số tiền và số lượng bằng `font-mono tabular-nums text-right` tự động.

### 2.2. Tái cấu trúc Menu Thao tác (Action Dropdown)
Thay vì hiển thị quá nhiều nút bấm (Chi tiết, Sửa, Đóng, Xóa) trên cùng một dòng gây chen lấn cột dữ liệu ở `ProjectTable`:
- Tích hợp một nút bấm duy nhất `"Thao tác"` kèm biểu tượng mũi tên hoặc 3 dấu chấm dọc.
- Nhấp vào sẽ mở ra Menu Dropdown an toàn nằm đè (z-index cao) chứa các hành động phụ (Sửa, Đóng, Xóa).
- Chỉ giữ lại duy nhất 1 nút bấm chính `"Chi tiết"` hiển thị trực tiếp.

---

## 3. ĐÁNH GIÁ CHUNG
* **Trạng thái:** **SAFE TO COMMIT AFTER FIXES**
* Tất cả các lỗi đã phát hiện đều liên quan trực tiếp đến việc hiển thị bảng dữ liệu (Table Layout & Overlap), có thể khắc phục hoàn toàn bằng cách nâng cấp `EnterpriseTable` và tinh chỉnh cấu hình cột mà không ảnh hưởng đến bất kỳ API, Prisma hay logic nghiệp vụ nào.

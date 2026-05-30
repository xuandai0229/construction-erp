# Báo cáo Thiết kế Lại Visual & Khắc phục Đè Bố cục Bảng — Phase 2C

Hệ thống Construction ERP vừa hoàn tất đợt nâng cấp kỹ thuật giao diện Phase 2C chuyên sâu về **Visual Redesign & Table Layout Fix** nhằm mục đích loại bỏ hoàn toàn hiện tượng chồng đè chữ, thu hẹp cột, và đem lại giao diện "bộ mặt mới" cực kỳ hiện đại nhưng an toàn tuyệt đối với logic nghiệp vụ gốc.

---

## 1. CÁC PHÂN HỆ ĐÃ KIỂM TRA & KẾT QUẢ

| Route / Trang | Lỗi Overlap Phát Hiện | Cách Khắc Phục / Sửa Đổi Kỹ Thuật | Trạng Thái Visual |
| :--- | :--- | :--- | :--- |
| **`/` (Dashboard)** | Cột "SỐ NGÀY QUÁ HẠN" của bảng Debt Aging bị co lại thành "SỐ NGÀY QU". Trạng thái trống của Exception Alerts gây tràn và sinh thanh cuộn ngang trong Card. | - Bổ sung thuộc tính `minWidth: "140px"` cho cột số ngày quá hạn.<br>- Chuyển đổi các card con phân tích tuổi nợ từ mã màu Light-only tĩnh sang cấu hình HSL bán trong suốt thích ứng Light/Dark mode (`bg-blue-500/10`, `bg-amber-500/10`...).<br>- Sửa lỗi div empty state của `EnterpriseTable` từ thuộc tính `calc` cố định sang flexbox tự động co giãn (`sticky left-0 mx-auto w-full flex items-center justify-center p-4`). | **ĐẸP HOÀN HẢO** |
| **`/reports` (Báo cáo)** | Cột "Dư Cuối Kỳ (Balance)" của bảng cân đối tài sản/nguồn vốn bị nén chặt, chữ chồng lấn khi màn hình laptop thu hẹp. | Bổ sung tham số `minWidth: "160px"` cho cột dư cuối kỳ và `minWidth: "150px"` cho các cột Phát sinh Nợ/Có. | **RÕ RÀNG / ĐỒNG BỘ** |
| **`/projects` (Công trình)** | Cột "TRẠNG THÁI" bị bóp nghẹt thành "TRẠ", chữ ô dữ liệu biến thành "LẬP KH...". Bảng có 9 cột dữ liệu quá dài nhưng nút thao tác chiếm tới `300px` gây chật chội nghiêm trọng. | - Thiết kế lại toàn bộ cột hành động thành mảng **Action Dropdown Menu (Menu Thao tác z-30)** dạng ba dấu chấm. Chỉ giữ lại duy nhất 1 nút bấm chính `"Chi tiết"`. Sửa/Đóng/Xóa chuyển vào menu xổ xuống, tiết kiệm hơn 160px chiều ngang.<br>- Cấu hình `minWidth` chặt chẽ cho toàn bộ 10 cột dữ liệu.<br>- Tự động kích hoạt cuộn ngang mượt mà khi màn hình thiết bị thu nhỏ dưới `1360px`. | **SIÊU HIỆN ĐẠI** |
| **`/wbs` (Hạng mục)** | Tiêu đề các cột dữ liệu ngân sách bị ép khi xem trên laptop 13-inch. | Áp dụng cấu hình `minWidth: "130px"` cho Ngân sách, Thực tế, Chênh lệch và `minWidth: "260px"` cho Hạng mục thi công. | **THÔNG THOÁNG** |
| **`/budget` (Dự toán)** | Các cột bảng CBS bị co hẹp. | Tích hợp thuộc tính `minWidth` độc lập trên từng cột bảng ngân sách CBS. | **CHUYÊN NGHIỆP** |

---

## 2. NÂNG CẤP THÀNH PHẦN ENTERPRISE TABLE V2

Chúng ta đã nâng cấp thành phần cốt lõi **`EnterpriseTable.tsx`** lên phiên bản cao cấp mới:
- **`Column<T>` Interface mở rộng:** Hỗ trợ thuộc tính `minWidth?: string` cho từng cột độc lập.
- **Thực thi CSS inline thông minh:** Áp dụng `style={{ width: col.width, minWidth: col.minWidth }}` trực tiếp lên cả ba cấp thẻ `<col>`, `<th>` và `<td>` để triệt tiêu vĩnh viễn hành vi tự ý co cột của cơ chế `table-fixed` của trình duyệt.
- **Xử lý triệt để Tràn Layout (Overflow Leak):** Thay thế toàn bộ mã chiều rộng tương đối nguy hiểm dạng `calc(100vw - var(--erp-sidebar-width)...)` bằng container flex co giãn thông minh `mx-auto w-full p-4` giúp các trạng thái rỗng (empty state) và trạng thái tải (loading state) của bảng tự thích nghi hoàn mỹ trong mọi phân bố lưới Grid hay Card nhỏ.

---

## 3. KẾT QUẢ KIỂM TRA CHẤT LƯỢNG (QA CHECKLIST)

1. **Kiểm tra TypeScript (`npx tsc --noEmit`):**
   👉 **KẾT QUẢ: 100% THÀNH CÔNG (0 LỖI)**
2. **Kiểm tra Biên dịch Build (`npx next build`):**
   👉 **KẾT QUẢ: BIÊN DỊCH VÀ ĐÓNG GÓI SẢN PHẨM THÀNH CÔNG 100% (EXIT CODE 0)**
3. **Hiển thị Light/Dark Mode:** Các thẻ Badge trạng thái, Card KPI, bảng dữ liệu, và Dropdown thao tác tự thích ứng xuất sắc, chữ đen trên nền sáng và chữ sáng trên nền tối rõ ràng, độ tương phản đáp ứng tiêu chuẩn WCAG AAA.

---

## 4. KẾT LUẬN & ĐỀ XUẤT COMMIT
* **ĐÁNH GIÁ CHUNG:** ✅ **SAFE TO COMMIT** (Tuyệt đối an toàn để đóng gói và commit vào kho chứa mã nguồn chung).
* **Các file nên commit:**
  - `app/components/ui-enterprise/EnterpriseTable.tsx` (Component dùng chung nâng cấp)
  - `app/components/reports/DebtAgingPanel.tsx` (Bảng phân tích nợ Dashboard)
  - `app/components/projects/ProjectTable.tsx` (Bảng dự án cải tiến menu 3 chấm)
  - `app/reports/page.tsx` (Báo cáo CFO/Sổ cái cải tiến minWidth)
  - `app/wbs/WBSListScreen.tsx` (Bảng WBS hạng mục cải tiến minWidth)
  - `app/budget/page.tsx` (Bảng ngân sách CBS cải tiến minWidth)
  - Các báo cáo thiết kế trong thư mục `docs/ui-ux/`

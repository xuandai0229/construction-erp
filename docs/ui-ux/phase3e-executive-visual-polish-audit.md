# BÁO CÁO ĐÁNH GIÁ TRỰC QUAN & KHẢ DỤNG (PHASE 3E - VISUAL & USABILITY AUDIT)

> [!NOTE]
> Báo cáo rà soát và đánh giá mức độ chuyên nghiệp, phân cấp thị giác (visual hierarchy) và trải nghiệm khả dụng (usability) phục vụ Ban Giám đốc và CFO.

---

## 1. Executive Summary

Hệ thống đã đạt tính đồng bộ cấu trúc vững vàng sau Phase 3D. Tuy nhiên, để sản phẩm ERP đạt được cảm giác **cao cấp (premium) và tinh tế**, Phase 3E sẽ tập trung tinh chỉnh phân cấp thông tin (information design), bổ sung các chỉ số xu hướng tài chính trực quan, và tối ưu hóa mật độ hiển thị (visual density) của 3 màn hình mẫu: **Tổng quan điều hành (`/`)**, **Hồ sơ công trình (`/projects`)**, và **Trung tâm báo cáo tài chính (`/reports`)**.

---

## 2. Trạng thái Workspace trước khi làm

- **Thư mục làm việc sạch hoàn toàn**: Kiểm tra lệnh `git status` trả về `nothing to commit, working tree clean`.
- **Nhánh chính**: Nhánh `main` đồng nhất sau commit `c10a77f` (kết quả của Phase 3D).

---

## 3. Danh sách các Route đã Kiểm tra (Audited Routes)

1. **`/`** (Bàn làm việc / Dashboard)
2. **`/projects`** (Hồ sơ công trình)
3. **`/reports`** (Trung tâm báo cáo tài chính)
4. **`/debt`** (Quản lý công nợ)
5. **`/costs`** (Quản lý chi phí)
6. **`/cash-bank`** (Dòng tiền ngân quỹ)
7. **`/inventory`** (Quản lý kho bãi)

---

## 4. Đánh giá trải nghiệm theo vai trò người dùng (Persona Audit)

### 4.1. Giám đốc / Ban điều hành
- **Ưu điểm**: Dashboard (`/`) hiển thị rất trực quan các chỉ tiêu quan trọng như Doanh thu, Chi phí, Dòng tiền và Công nợ. Cảnh báo rủi ro được tổng hợp riêng biệt.
- **Điểm yếu**: Các chỉ số KPI lớn trong thẻ Metric chưa thể hiện rõ xu hướng tăng trưởng (tăng/giảm so với kỳ trước), khiến CEO khó đánh giá nhịp điệu phát triển kinh doanh nếu chỉ nhìn số liệu tĩnh.
- **Đề xuất**: Bổ sung tham số xu hướng `trend` và phân cấp lại các nhóm card theo vai trò.

### 4.2. Kế toán trưởng / CFO
- **Ưu điểm**: Sổ chi tiết Ledger drill-down hoạt động rất mượt mà. Khả năng khóa/mở khóa sổ trực tiếp trên bảng dòng tiền rất tuyệt vời.
- **Điểm yếu**: Bảng cân đối phát sinh tài khoản (`/reports` -> Trial Balance) có cột mã tài khoản được tô màu tím tĩnh và có icon mắt hiển thị thô sơ, chưa tạo được nhịp điệu chuyên nghiệp của sổ kế toán Việt Nam.
- **Đề xuất**: Thiết kế lại cột mã tài khoản với thẻ Badge màu tím nhạt mềm mại, điều chỉnh các đường kẻ viền phân tách mỏng và thoáng hơn.

### 4.3. Nhân viên kế toán
- **Ưu điểm**: Khả năng lọc tìm kiếm tức thì và các bộ lọc dropdown hoạt động ổn định, chính xác.
- **Điểm yếu**: Các input tìm kiếm và date-picker có độ tương phản đường viền (border contrast) hơi thấp ở Light Mode, gây cảm giác mờ nhạt.
- **Đề xuất**: Tăng cường viền tương phản tập trung (`focus-ring`) bằng màu chủ đạo `[var(--primary)]`.

---

## 5. Top vấn đề Visual còn tồn tại

1. **Màu sắc chỉ số Metric**: Thẻ Metric của Lợi nhuận và Dòng tiền tuy có thay đổi viền đỏ/xanh nhưng phần text số liệu vẫn giữ màu mặc định, chưa tạo điểm nhấn bắt mắt.
2. **Phân cấp tiêu đề**: Các Section của Dashboard sử dụng tiêu đề viết hoa thô ráp (ví dụ: `TỔNG QUAN TÀI CHÍNH (EXECUTIVE SUMMARY)`), cần chuẩn hóa thành dạng chữ thường chuyên nghiệp.
3. **Độ tương phản ở Light Mode**: Các nút action của bảng điều khiển dự án như `Xuất Excel` có viền xanh lá trên nền xám dễ bị chói nhẹ dưới ánh sáng mạnh.

---

## 6. Top vấn đề Usability còn tồn tại

1. **Hiếu chiến của các bộ lọc**: Các chip lọc ngày tháng (`DATE_PRESETS`) tại màn hình dự án có kích thước nhãn hơi nhỏ, dễ bấm trượt trên thiết bị máy tính bảng.
2. **Chỉ thị hành động**: Thẻ chỉ tiêu hạch toán có thể click drill-down được nhưng chưa có icon chỉ thị hành động click hoặc hiệu ứng hover rõ rệt.
3. **Phân bổ trang**: Phân trang của bảng chi tiết tài khoản ledger drill-down chưa có hiển thị số dòng/trang tùy chọn.

---

## 7. Top 10 khu vực ưu tiên đánh bóng (Polish Backlog)

1. **KPI Dashboard Cards**: Nâng cấp visual với các trend tích hợp động (`↑`, `↓`, `•`).
2. **Alert Section**: Bo viền mềm, tăng độ tương phản của nhãn rủi ro nguy hiểm.
3. **Project Stats cards**: Tinh chỉnh màu biểu tượng (icons) sang màu thích ứng dynamic.
4. **Project Filters Panel**: Bọc tương tác bóng bẩy, thu gọn khoảng cách padding thừa.
5. **Project Table Cells**: Tăng cường khoảng đệm (cell-padding) của tên công trình.
6. **Reports Header Section**: Thiết kế breadcrumb sạch sẽ, tách biệt bộ chọn dự án.
7. **Reports Tab UI**: Tạo hiệu ứng thanh trượt dưới tab hoạt động mềm mại.
8. **Trial Balance Table**: Thay đổi hiển thị mã tài khoản từ màu tím thô sang thẻ Badge bo tròn.
9. **CFO Drill-down Modal**: Điều chỉnh margin, padding của bảng chi tiết hạch toán trong Modal.
10. **Microcopy**: Việt hóa 100% các nhãn thô như "Net", "Debit", "Credit", "AR Aging" sang từ ngữ kế toán thông dụng tại Việt Nam.

---

## 8. Màn hình bảo lưu (Không sửa vì rủi ro)

- **`app/cash-bank/page.tsx`**: Giữ nguyên lưới hạch toán dòng tiền để tránh xung đột với các hoạt động nghiệp vụ hằng ngày của thủ quỹ.

---

## 9. Kết luận

> [!IMPORTANT]
> **KẾT LUẬN**: **CÓ PHÉP** tiến hành triển khai đánh bóng giao diện **Phase 3E-B** cho 3 màn hình mẫu: **Dashboard (`/`)**, **Projects (`/projects`)**, và **Reports (`/reports`)**. 

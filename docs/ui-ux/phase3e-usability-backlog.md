# BẢN GHI BACKLOG SỰ KHẢ DỤNG (PHASE 3E - USABILITY BACKLOG)

> [!NOTE]
> Tài liệu ghi chép các khuyến nghị cải tiến trải nghiệm người dùng (UX) và tối ưu hóa vi mô (micro-interactions) thuộc phạm vi ưu tiên trung bình/thấp được tách riêng để triển khai trong tương lai.

---

## 1. Danh sách Backlog Trải nghiệm người dùng (UX)

### 1.1. Lưới hạch hạch toán thủ công tại Ngân quỹ
- **Mã định danh**: UX-CB-01
- **Mục tiêu**: Hiện đại hóa bảng hạch toán thu chi thủ công tại `/cash-bank`.
- **Giải pháp đề xuất**: Quy chuẩn hóa sang V3 `EnterpriseDataTable`, hỗ trợ chỉnh sửa hàng loạt (batch editing) và tự động gợi ý tài khoản đối ứng theo dữ liệu lịch sử.
- **Rủi ro**: Cao (Ảnh hưởng trực tiếp đến tốc độ thao tác của kế toán viên).

### 1.2. Thống kê bộ lọc theo khoảng cách bấm (Tap-target sizes)
- **Mã định danh**: UX-PRJ-02
- **Mục tiêu**: Tăng kích thước vùng bấm cho các chip lọc khoảng thời gian khởi công (`DATE_PRESETS`) tại màn hình quản lý dự án để thân thiện với máy tính bảng.
- **Giải pháp đề xuất**: Tăng padding của nút chip từ `px-2.5 py-1` lên `px-3 py-1.5` và khoảng cách gap giữa các chip lên `gap-2.5`.

---

## 2. Kế hoạch triển khai dự kiến

| Độ ưu tiên | Mã số | Mô tả tính năng | Đường dẫn ảnh hưởng | Kế hoạch hoàn thành |
| :--- | :--- | :--- | :--- | :--- |
| **Medium** | UX-PRJ-02 | Tăng kích thước vùng bấm lọc | `/projects` | Sprint 4.1 |
| **Low** | UX-CB-01 | Hiện đại hóa lưới hạch toán | `/cash-bank` | Sprint 4.2 |

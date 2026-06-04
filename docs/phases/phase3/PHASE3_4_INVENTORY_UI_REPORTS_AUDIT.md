# BÁO CÁO ĐÁNH GIÁ HIỆN TRẠNG UI/UX PHÂN HỆ KHO (SPRINT 3.4 AUDIT)
**Dự án**: Construction ERP | **Đường dẫn**: `D:\construction-erp`

---

## I. KẾT QUẢ ĐÁNH GIÁ HIỆN TRẠNG (15 TIÊU CHÍ BẮT BUỘC)

| STT | Câu hỏi khảo sát | Trạng thái hiện tại | Chi tiết đánh giá |
|:---:|:---|:---:|:---|
| 1 | Đã có màn hình danh mục vật tư chưa? | **CHƯA CÓ** | Cần xây dựng màn hình hiển thị danh sách vật tư (`MaterialItem`) kèm chức năng tạo mới/sửa đổi. |
| 2 | Đã có màn hình danh mục kho chưa? | **CHƯA CÓ** | Cần xây dựng màn hình hiển thị danh sách kho bãi (`Warehouse`) phân quyền theo dự án/công ty. |
| 3 | Đã có màn hình chứng từ kho chưa? | **CHƯA CÓ** | Cần trang quản lý danh sách phiếu nhập/xuất/chuyển kho/điều chỉnh. |
| 4 | Có form nhập phiếu nhập/xuất kho chưa? | **CHƯA CÓ** | Cần form có dòng vật tư, số lượng, đơn giá, VAT, WBS, dự án và tự tính tổng tiền tức thời. |
| 5 | Có trạng thái DRAFT/SUBMITTED/APPROVED/POSTED/REVERSED trên UI chưa? | **CHƯA CÓ** | Cần hiển thị timeline tiến trình phê duyệt & ghi sổ. |
| 6 | Có readonly mode cho chứng từ POSTED chưa? | **CHƯA CÓ** | Các phiếu có trạng thái POSTED/REVERSED bắt buộc phải khóa toàn bộ form đầu vào. |
| 7 | Có nút submit/approve/post/reverse chưa? | **CHƯA CÓ** | Các nút chuyển đổi trạng thái cần ẩn/hiển thị linh động theo vai trò người dùng (Accountant/CFO). |
| 8 | Có thẻ kho chưa? | **CHƯA CÓ** | Cần trang hiển thị Thẻ kho (Stock Card) chi tiết một vật tư cụ thể theo kỳ kế toán. |
| 9 | Có báo cáo nhập xuất tồn chưa? | **CHƯA CÓ** | Cần trang báo cáo tổng hợp Nhập - Xuất - Tồn của tất cả vật tư. |
| 10 | Có báo cáo tồn kho theo công trình/WBS chưa? | **CHƯA CÓ** | Cần báo cáo phân tích tồn kho chi tiết tại từng hạng mục WBS của dự án. |
| 11 | Có in phiếu nhập/xuất chưa? | **CHƯA CÓ** | Cần route in ấn phiếu nhập kho (PN) và xuất kho (PX) dàn trang chuẩn khổ giấy A4. |
| 12 | Có export báo cáo kho chưa? | **CHƯA CÓ** | Cần tích hợp nút tải báo cáo dạng CSV kèm UTF-8 BOM hỗ trợ hiển thị tiếng Việt trên Excel. |
| 13 | Có drill-down từ báo cáo kho về chứng từ gốc chưa? | **CHƯA CÓ** | Khi click vào dòng nghiệp vụ thẻ kho, cần mở panel chi tiết phiếu kho tương ứng. |
| 14 | Có loading/empty/error state chuyên nghiệp chưa? | **CHƯA CÓ** | Cần các component Skeleton, hình ảnh Empty State và thông báo lỗi sắc nét. |
| 15 | Có filter theo kho, vật tư, công trình, WBS, kỳ kế toán chưa? | **CHƯA CÓ** | Cần thanh FilterBar đồng bộ cho cả 3 báo cáo kho. |

---

## II. KẾ HOẠCH HÀNH ĐỘNG SPRINT 3.4
Chúng ta sẽ triển khai toàn bộ giao diện người dùng, chức năng in ấn, bộ lọc, và export dữ liệu theo chuẩn MISA trong Sprint này để phân hệ Kho chính thức đi vào hoạt động thực tế.

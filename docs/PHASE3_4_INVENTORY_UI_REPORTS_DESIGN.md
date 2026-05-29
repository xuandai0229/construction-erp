# TÀI LIỆU THIẾT KẾ UI/UX PHÂN HỆ QUẢN LÝ KHO (SPRINT 3.4 DESIGN)
**Dự án**: Construction ERP | **Đường dẫn**: `D:\construction-erp`

---

## I. MÀN HÌNH INVENTORY DASHBOARD (TỔNG QUAN)

### 1. Chỉ số KPI chính (Dashboard Cards)
*   **Tổng giá trị tồn kho**: Tổng cộng số tiền tồn kho của tất cả vật tư tại tất cả các kho. Cập nhật theo thời gian thực dựa trên các chứng từ `POSTED` (không tính `DRAFT`/`SUBMITTED`/`APPROVED`).
*   **Vật tư cảnh báo hết hàng**: Số lượng vật tư có tồn kho hiện tại nhỏ hơn hoặc bằng định mức tồn tối thiểu.
*   **Chứng từ chờ duyệt**: Đếm số phiếu nhập/xuất kho đang ở trạng thái `SUBMITTED` cần CFO duyệt.
*   **Cảnh báo an toàn tài chính**: Hiển thị cảnh báo nếu:
    *   Phát hiện tồn kho bị âm (nếu tắt cấu hình chặn).
    *   Lệch giá trị tồn kho giữa sổ chi tiết kho và tài khoản Sổ cái 152.

---

## II. DANH MỤC VẬT TƯ & KHO HÀNG (MASTER TABLES)

### 1. Danh mục Vật tư (Material Master)
*   **Trình bày**: Dạng bảng (Table) cuộn ngang, hỗ trợ phân trang và tìm kiếm theo Mã/Tên vật tư.
*   **Các cột dữ liệu**: Mã vật tư, Tên vật tư, Đơn vị tính, Loại vật tư, Tài khoản kho mặc định (152/153), Tài khoản chi phí mặc định (621/627), Trạng thái active/inactive.
*   **Form tạo mới/chỉnh sửa**: Hỗ trợ modal popup sang trọng với hiệu ứng kính mờ (glassmorphism), validate bắt buộc Mã, Tên, Đơn vị tính, Tài khoản kho.

### 2. Danh mục Kho bãi (Warehouse Master)
*   **Trình bày**: Danh sách các kho bãi trong doanh nghiệp.
*   **Các cột dữ liệu**: Mã kho, Tên kho, Dự án phụ trách (nếu là kho công trình), Người quản lý kho, Trạng thái hoạt động.
*   **Ràng buộc cô lập**: Chỉ hiển thị kho thuộc về Công ty của user hiện tại đang đăng nhập.

---

## III. QUẢN LÝ CHỨNG TỪ KHO (INVENTORY DOCUMENTS)

### 1. Danh sách Chứng từ
*   Bảng tổng hợp tất cả phiếu nhập/xuất/chuyển kho/điều chỉnh.
*   Hỗ trợ bộ lọc nâng cao theo: Loại chứng từ, Trạng thái phiếu, Từ ngày - Đến ngày, Công trình/Dự án.
*   Badge trạng thái MISA-like:
    *   `DRAFT`: Xám nhạt.
    *   `SUBMITTED`: Vàng cam.
    *   `APPROVED`: Xanh lá cây nhạt.
    *   `POSTED`: Xanh dương (chữ đậm, viền nổi).
    *   `REVERSED`: Đỏ nhạt (gạch ngang số phiếu).

### 2. Form Chi tiết Chứng từ
*   **Header**:
    *   Số chứng từ (PN-..., PX-...).
    *   Ngày chứng từ & Ngày hạch toán.
    *   Loại chứng từ.
    *   Kho nguồn/Kho đích.
    *   Dự án & WBS liên kết.
    *   Nhà cung cấp (nếu là phiếu nhập).
    *   Diễn giải lý do.
*   **Grid dòng vật tư (Lines Table)**:
    *   Chọn vật tư (MaterialItem).
    *   Tự động điền đơn vị tính và tài khoản kho mặc định.
    *   Số lượng, Đơn giá nhập, Thành tiền hạch toán, Thuế suất VAT (%), Tiền thuế VAT.
*   **Trạng thái tương tác**:
    *   Khi ở trạng thái `POSTED` hoặc `REVERSED`, toàn bộ form sẽ tự động khóa (Readonly) và hiển thị `ReadonlyPostedBanner`.
    *   Hiển thị **Trực quan hóa Hạch toán Sổ cái (Journal Preview)**: Grid hiển thị chi tiết các bút toán Nợ/Có sẽ ghi vào Sổ cái khi Post chứng từ.
    *   **Lịch sử phê duyệt (Audit Timeline)**: Hiển thị chi tiết thời gian tạo, người lập, người duyệt, người post/reverse.

---

## IV. BÁO CÁO KHO (INVENTORY REPORTS)

Hệ thống cung cấp 3 báo cáo kế toán kho chuẩn hóa:
1.  **Thẻ kho (Stock Card)**: Trích xuất lịch sử nhập xuất của một vật tư tại một kho cụ thể trong kỳ, tính toán số dư tồn chạy lũy kế sau mỗi dòng giao dịch.
2.  **Báo cáo Nhập - Xuất - Tồn (Stock Register)**: Báo cáo tổng hợp cho kỳ kế toán hiển thị: Số dư đầu kỳ (Số lượng, Giá trị), Nhập trong kỳ (Số lượng, Giá trị), Xuất trong kỳ (Số lượng, Giá trị), Tồn cuối kỳ (Số lượng, Giá trị).
3.  **Số dư Tồn kho theo Công trình/WBS**: Thống kê số lượng vật tư đang nằm tại từng công trường cụ thể phục vụ kiểm soát thất thoát vật tư.

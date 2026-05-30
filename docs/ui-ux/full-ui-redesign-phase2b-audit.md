# BÁO CÁO KIỂM TOÁN GIAO DIỆN NHANH - PHASE 2B
(QUY MÔ RÀ SOÁT & KẾ HOẠCH NÂNG CẤP ĐỒNG BỘ)

> [!NOTE]
> Báo cáo này thống kê nhanh kết quả quét (static analysis) đối với các file thuộc phạm vi nâng cấp Phase 2B bao gồm: **Báo cáo (Reports)**, **Công trình (Projects)**, **Hạng mục (WBS)**, **Dự toán (Budget)**, và **Thuế VAT (Tax)**.

---

## 1. DANH SÁCH FILE TÌM THẤY TRONG PHẠM VI PHASE 2B

Dưới đây là các file route và component tương ứng đang vận hành trong hệ thống:

*   **Nhóm Báo cáo (Reports)**:
    *   `app/reports/page.tsx`
    *   `app/reports/inventory/stock-card/page.tsx`
    *   `app/reports/inventory/in-out-balance/page.tsx`
    *   `app/reports/inventory/project-stock/page.tsx`
*   **Nhóm Công trình (Projects & Contracts)**:
    *   `app/projects/page.tsx`
    *   `app/projects/ProjectListScreen.tsx`
    *   `app/projects/[id]/page.tsx`
    *   `app/components/projects/ProjectCardStats.tsx`
    *   `app/components/projects/ProjectFilters.tsx`
    *   `app/components/projects/ProjectTable.tsx`
    *   `app/components/projects/ProjectsHeader.tsx`
*   **Nhóm WBS & Dự toán (WBS & Budget)**:
    *   `app/wbs/page.tsx`
    *   `app/wbs/WBSListScreen.tsx`
    *   `app/components/wbs/WBSActions.tsx`
    *   `app/components/wbs/WBSHeader.tsx`
    *   `app/components/wbs/WBSStats.tsx`
    *   `app/budget/page.tsx`
*   **Nhóm Thuế (Tax)**:
    *   `app/tax/page.tsx`

---

## 2. FILE ƯU TIÊN SỬA ĐỒNG BỘ CẢI TIẾN

Chúng tôi sẽ tiến hành sửa đổi lần lượt theo thứ tự ưu tiên chặt chẽ:

1.  **Màn Báo cáo tổng hợp & Kho**:
    *   `app/reports/page.tsx` (Có modal tối hardcoded `bg-[#12121e]` rất xấu cần bỏ)
    *   `app/reports/inventory/project-stock/page.tsx` (Chứa hàng chục class `bg-zinc-900`, `border-zinc-800` phá vỡ Light Mode)
    *   `app/reports/inventory/in-out-balance/page.tsx` & `stock-card/page.tsx` (Dọn dẹp `bg-zinc-50/30`)
2.  **Màn Công trình & Hợp đồng**:
    *   `app/projects/ProjectListScreen.tsx`
    *   `app/components/projects/ProjectTable.tsx` & `ProjectFilters.tsx`
3.  **Màn WBS & Dự toán**:
    *   `app/wbs/WBSListScreen.tsx` & `app/budget/page.tsx`
4.  **Màn Thuế VAT**:
    *   `app/tax/page.tsx` (Cải tạo các hộp thoại lập hóa đơn và bảng kê khai Thuế, Việt hóa triệt để)

---

## 3. CÁC MÀU SẮC CỨNG (HARD-CODED COLORS) CẦN LOẠI BỎ

*   **`app/reports/page.tsx`**: `bg-[#12121e]` (dùng cho modal xem chi tiết) $\rightarrow$ Đổi sang `bg-[var(--card)]`
*   **`app/reports/inventory/project-stock/page.tsx`**: 
    *   `bg-zinc-900/30`, `border-zinc-800/80`, `bg-zinc-900`, `bg-zinc-800` $\rightarrow$ Thay thế bằng CSS Variables.
*   **`app/tax/page.tsx`**:
    *   `bg-gray-500/10 text-gray-400`, `bg-gray-500/20 text-gray-300` $\rightarrow$ Thay thế bằng helper `getStatusStyleClass` hoặc màu chuẩn.

---

## 4. NHÃN TIẾNG ANH (USER-VISIBLE ENGLISH TEXT) SẼ ĐƯỢC VIỆT HÓA

*   **Bộ lọc & Action**: `Create`, `Edit`, `Delete`, `Cancel`, `Save`, `Search`, `Filter` $\rightarrow$ Việt hóa thành `Tạo mới`, `Chỉnh sửa`, `Xóa`, `Hủy`, `Lưu`, `Tìm kiếm`, `Bộ lọc`.
*   **Tiêu đề & Trạng thái**: `No data`, `Loading`, `Status`, `Amount`, `Date`, `Supplier`, `Invoice` $\rightarrow$ Việt hóa thành `Chưa có dữ liệu`, `Đang tải`, `Trạng thái`, `Số tiền`, `Ngày`, `Nhà cung cấp`, `Hóa đơn`.
*   **Màn Báo cáo**: `General Journal`, `Ledger`, `Trial Balance` trong giao diện tab $\rightarrow$ Hạch toán Nhật ký chung, Sổ cái kế toán, Bảng cân đối phát sinh tài khoản.

---

## 5. NHỮNG MỤC PHẠM VI NGOẠI LỆ (FALSE POSITIVES) KHÔNG SỬA

> [!WARNING]
> Để tránh làm gián đoạn hệ thống và tôn trọng các tiêu chuẩn bảo vệ, các điểm sau đây sẽ được giữ nguyên:

1.  **Trang in vật lý (Route `/print/...`)**: Các màu xám nhạt `bg-zinc-50` hoặc `border-black` được giữ nguyên vì đây là cấu hình A4 vật lý tối ưu mực in, không áp dụng giao diện màu tối (Dark Mode).
2.  **Các tệp tin API, Prisma**: `generated/prisma-client`, `app/api/**/*` tuyệt đối giữ nguyên không chỉnh sửa bất kỳ trường dữ liệu hay logic nào.
3.  **Tệp tin cấu hình màu sắc chung**: `app/globals.css` - Nơi chứa khai báo các root variables.

---
*Kế hoạch được phê duyệt bởi Principal UI/UX Architect Antigravity.*

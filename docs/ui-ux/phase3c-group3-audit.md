# Báo cáo Khảo sát & Đánh giá Giao diện (UI/UX Audit) — Phase 3C Nhóm 3

Bản báo cáo khảo sát chi tiết trước khi nâng cấp giao diện, chuyển đổi layout sang App Shell mới và tích hợp `EnterpriseDataTable V3` cho các phân hệ Thuế (Tax), Doanh thu (Revenue), Kế toán (Accounting), Cấu hình (Settings) và Hệ thống (System).

---

## 1. Kết quả Khảo sát & Tìm kiếm các Phân hệ (Route Directory Search)

| Phân hệ (Route) | Trạng thái Tìm thấy | Tập tin UI chính | Hiện trạng layout |
| :--- | :--- | :--- | :--- |
| **`/tax`** | Tìm thấy | `app/tax/page.tsx` | Sử dụng Sidebar & Header cũ, bảng hiển thị HTML thủ công, nhiều màu cứng. |
| **`/revenue`** | Tìm thấy | `app/revenue/page.tsx` | Sử dụng layout cũ, dùng bảng `EnterpriseTable` V2 chưa được tối ưu. |
| **`/accounting`** | Tìm thấy | `app/accounting/page.tsx` <br> `app/accounting/contracts/[id]/page.tsx` | Sử dụng layout cũ, dùng bảng `EnterpriseTable` V2 chưa được tối ưu. |
| **`/settings`** | Tìm thấy | `app/settings/page.tsx` | Sử dụng layout cũ, form và modal dùng style thủ công, không nhất quán. |
| **`/system`** | Tìm thấy | `app/system/page.tsx` | Sử dụng layout cũ, log an ninh hiển thị danh sách thủ công, nhiều màu cứng. |
| **`/invoices`** | Không tồn tại | Không có | Tích hợp bên trong phân hệ `/tax` (Sổ đăng ký hóa đơn VAT). |
| **`/payments`** | Không tồn tại | Không có | Tích hợp bên trong phân hệ `/accounting` (Hạch toán tạm ứng/thanh toán). |
| **`/advances`** | Không tồn tại | Không có | Tích hợp bên trong phân hệ `/accounting` (Hạch toán tạm ứng/thanh toán). |
| **`/suppliers`** | Không tồn tại | Không có | Tích hợp bên trong phân hệ `/accounting` (Danh mục nhà cung cấp công trình). |
| **`/contracts`** | Không tồn tại | Không có | Tích hợp bên trong phân hệ `/accounting/contracts/[id]` (Hồ sơ kế toán hợp đồng). |

---

## 2. Chi tiết Đánh giá Từng Tập tin UI

### A. Phân hệ Thuế (`app/tax/page.tsx`)
- **App Shell mới**: Chưa sử dụng. Đang dùng thẻ `<Sidebar>` và `<Header>` thủ công.
- **Bảng dữ liệu (Data Grid)**: Đang kết xuất qua thẻ `<table>` HTML truyền thống với header và dòng dữ liệu tĩnh. Cần nâng cấp lên `EnterpriseDataTable` để cuộn ngang và chống đè chữ.
- **Màu cứng & Light/Dark Mode**: Có sử dụng các lớp màu xám như `bg-black/10` cho tr, `bg-gray-500/10`, `bg-blue-500/10` chưa thích ứng tối đa với Light Mode.
- **Nghiệp vụ rủi ro**: Chứa các tương tác Phát hành, Hủy, Ghi sổ và Đảo hóa đơn. Tuyệt đối **không được sửa đổi** logic fetch gọi các API endpoints `/api/tax/invoices/[id]/issue`, `cancel`, `post`, `reverse`.
- **Độ ưu tiên sửa**: **Critical** (Trực quan hóa hóa đơn, căn phải số tiền, action menu đồng bộ).

### B. Phân hệ Doanh thu (`app/revenue/page.tsx`)
- **App Shell mới**: Chưa sử dụng. Đang bao bọc bởi lớp `erp-page` cũ.
- **Bảng dữ liệu (Data Grid)**: Đang sử dụng component `EnterpriseTable` thế hệ V2. Cần nâng cấp lên `EnterpriseDataTable` V3 mới để thống nhất trải nghiệm hiển thị.
- **Độ ưu tiên sửa**: **High** (Cân đối số tiền, chuẩn hóa hành động).

### C. Phân hệ Kế toán Tổng hợp (`app/accounting/page.tsx` & `/contracts/[id]/page.tsx`)
- **App Shell mới**: Chưa sử dụng. Đang dùng layout sidebar/header cũ.
- **Bảng dữ liệu (Data Grid)**: Cả hai trang danh sách hợp đồng công nợ và chi tiết hợp đồng đều dùng bảng V2 `EnterpriseTable`. Cần nâng cấp toàn bộ sang `EnterpriseDataTable` V3.
- **Độ ưu tiên sửa**: **High** (Chuẩn hóa hạch toán Nợ/Có căn phải, tabular-nums đồng bộ).

### D. Cấu hình & Khóa Sổ Kỳ Kế Toán (`app/settings/page.tsx`)
- **App Shell mới**: Chưa sử dụng. Đang dùng layout cũ.
- **Form & Modal**: Có modal nhập lý do mở kỳ kế toán sử dụng popover màu nền primary cứng và nút bấm thủ công. Cần chuẩn hóa sang card và form thống nhất.
- **Độ ưu tiên sửa**: **Medium** (Chỉnh trang section, màu sắc thích nghi Light/Dark).

### E. Hệ thống & Giám sát Performance (`app/system/page.tsx`)
- **App Shell mới**: Chưa sử dụng. Đang dùng layout cũ.
- **Log an ninh**: Sử dụng khung cuộn tĩnh thủ công với các badge màu sắc cũ.
- **Độ ưu tiên sửa**: **Medium** (Chuẩn hóa thẻ telemetry, đảm bảo responsive 1366px cho ma trận vai trò).

---

## 3. Danh sách các Tập tin thuộc Phạm vi Nâng cấp (Phase 3C Nhóm 3)

Để thực hiện nâng cấp một cách an toàn và chuyên nghiệp nhất, chúng tôi đề xuất tập trung xử lý triệt để các tập tin sau:
1. `app/tax/page.tsx` (Nâng cấp App Shell, V3 DataTable, form modal VAT)
2. `app/revenue/page.tsx` (Nâng cấp App Shell, V3 DataTable)
3. `app/accounting/page.tsx` (Nâng cấp App Shell, V3 DataTable, form nhập liệu)
4. `app/accounting/contracts/[id]/page.tsx` (Nâng cấp App Shell, V3 DataTable chi tiết)
5. `app/settings/page.tsx` (Nâng cấp App Shell, form section, modal mở sổ)
6. `app/system/page.tsx` (Nâng cấp App Shell, telemetry cards, matrix)

---

## 4. Kế hoạch Triển khai An toàn (UI Transition Safe Guard)

> [!IMPORTANT]
> **Quy tắc an toàn trong Phase 3C Nhóm 3**:
> 1. Giữ nguyên toàn bộ logic gọi hàm, fetch API, xử lý state in-memory, store Zustand.
> 2. Các input form của hóa đơn, kế toán (Net, VAT, Nợ, Có, các checkbox, lý do ghi đè) giữ nguyên tên biến và bộ xử lý sự kiện `onChange`.
> 3. Tuyệt đối không thay đổi schema cơ sở dữ liệu hoặc logic kiểm soát nghiệp vụ tài chính.
> 4. Toàn bộ mã nâng cấp sẽ vượt qua `npx tsc --noEmit` và `npx next build` trước khi đề xuất commit.

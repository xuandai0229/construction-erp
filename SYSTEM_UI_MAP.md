# SYSTEM UI MAP

## 1. DANGEROUS FINANCIAL FLOWS
*   **Chi phí (Costs)**: `/costs` -> Nút "Thêm chi phí". Gọi API `POST /api/costs`. Luồng này đã bọc thép Idempotency ở Backend nhưng Frontend chưa sinh UUID.
*   **Hóa đơn (Invoices)**: `/revenue` -> Nút "Thêm hóa đơn". Gọi API `POST /api/invoices`. Cực kỳ nguy hiểm vì API `DELETE /api/invoices/[id]` vẫn dùng Hard Delete `prisma.delete()`.
*   **Ngân sách (Budgets)**: `/budget` -> Nút "Phân bổ ngân sách". Tương tự, vẫn dính Hard Delete ở tầng API.

## 2. PAGES & FORMS (Cấu trúc Menu)
*   **Dashboard** (`/`): Tổng hợp số liệu tài chính. Load khá nặng nếu dữ liệu lên đến hàng ngàn bản ghi.
*   **Dự án & WBS** (`/wbs`): Giao diện WBS Tree. Có modal thêm WBS.
*   **Chi phí** (`/costs`): Bảng dữ liệu mật độ cao. AddCostModal là trung tâm nhập liệu.
*   **Doanh thu** (`/revenue`): Quản lý Invoices và Payments.
*   **Ngân sách** (`/budget`): So sánh Kế hoạch vs Thực tế (BOQ).

## 3. UNSAFE UI PATTERNS
*   **AddCostModal.tsx**: Thiếu cơ chế tự động sinh UUID cho biến `requestId` khi Form Mount.
*   **Optimistic Updates**: Zustand Store cập nhật ngay số dư mà chưa chờ Backend xác nhận. Khi xảy ra lỗi (ví dụ Period Locked), màn hình sẽ bị "Stale Balance".
*   **Double Click Spam**: Dù có trạng thái Loading, nếu thao tác quá nhanh, React Query vẫn có thể spawn ra 2 request.

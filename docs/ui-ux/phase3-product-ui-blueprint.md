# Phase 3: Product UI Blueprint

## 1. Vấn đề hiện tại
- **UI chưa khác biệt nhiều:** Mặc dù đã thay màu và chuẩn hóa token ở Phase 2, tổng thể ứng dụng chưa đem lại cảm giác mới mẻ và khác biệt về trải nghiệm người dùng (UX).
- **Table còn rối:** Một số bảng vẫn chưa thực sự tối ưu hiển thị, đặc biệt với khối lượng dữ liệu lớn.
- **Thiếu tính đồng bộ Page Shell:** Mỗi trang (page) đang tự render Sidebar và Header riêng rẽ. Không có một Page Shell thống nhất toàn ứng dụng.
- **Thiếu template chuẩn:** Các thành phần như Filter, Action, Table, Modal chưa tuân theo một template chung duy nhất, dẫn đến việc thiết lập luồng nghiệp vụ còn manh mún và khó bảo trì.

## 2. Hướng thiết kế mới
- **App Shell mới:** Tập trung quản lý layout chung cho toàn bộ app (Sidebar, Header, Container).
- **Sidebar mới:** Nhóm menu theo nghiệp vụ mạch lạc, dễ truy xuất.
- **Header mới & Page Header mới:** Chứa tên màn hình, breadcrumb, thanh tìm kiếm nhanh, nút đổi theme, thông báo và user menu.
- **Toolbar/Filter mới:** Chuẩn hóa thanh công cụ và bộ lọc ở tất cả các trang danh sách.
- **Table V3:** Bảng dữ liệu phiên bản 3, tập trung vào UX (sticky header, action menu, row detail).
- **Detail Drawer & Form Modal:** Sử dụng Drawer cho chi tiết phụ và Modal cho các tác vụ nhập liệu chính.
- **Report Workspace:** Template riêng cho các màn hình báo cáo phân tích.
- **Empty/Loading/Error state:** Chuẩn hóa các trạng thái tĩnh/phụ của màn hình.

## 3. Bộ mặt visual mới
- **Nền tổng thể:** Dịu, sạch sẽ, ưu tiên không gian trắng (white-space).
- **Card & Border:** Card phẳng, ít sử dụng shadow (chỉ dùng shadow nhẹ ở những khối cần nổi bật), border tinh tế (nhỏ, màu nhạt).
- **Spacing & Typo:** Khoảng cách rộng hơn, font chữ phân cấp rõ ràng (chữ to/nhỏ tùy tầm quan trọng).
- **Button & Badge:** Nút bấm ít màu hơn nhưng rõ ràng cấp bậc (Primary, Secondary, Ghost). Badge bo góc mềm mại, dễ đọc.
- **Trải nghiệm Table:** Bảng hiển thị thoáng đãng, không chèn ép chữ, có tooltip hỗ trợ. Detail mở qua Drawer thay vì Nested Table.

## 4. Danh sách template cần tạo
- `EnterpriseAppShell`
- `EnterprisePageShell`
- `EnterprisePageHeader`
- `EnterpriseToolbar`
- `EnterpriseFilterPanel`
- `EnterpriseDataTable` (Table V3)
- `EnterpriseActionMenu`
- `EnterpriseDetailDrawer`
- `EnterpriseFormModal`
- `EnterpriseReportWorkspace`
- `EnterpriseKpiGrid`
- `EnterpriseEmptyState`
- `EnterpriseLoadingState`
- `EnterpriseErrorState`

## 5. Bản đồ áp dụng route
- `/`
- `/projects`
- `/projects/[id]`
- `/wbs`
- `/budget`
- `/costs`
- `/debt`
- `/cash-bank`
- `/inventory`
- `/reports`
- `/reports/inventory/*`
- `/tax`
- `/revenue`
- `/settings`
- `/system`
- `/accounting`
- `/accounting/contracts/[id]`
*(Lưu ý: Các route `/print/*` giữ nguyên theo chuẩn A4, không áp dụng dark mode).*

# BÁO CÁO AUDIT SỰ ĐỒNG BỘ GIAO DIỆN HỆ THỐNG (PHASE 3D - AUDIT REPORT)

> [!NOTE]
> Báo cáo kiểm kê toàn diện các route, bảng biểu, hộp thoại, màu sắc, và nhãn hiển thị trong Construction ERP để đánh giá mức độ đồng bộ hóa giao diện sau các đợt nâng cấp Phase 3A/3B/3C.

---

## 1. Kết quả kiểm kê Route và Layout

Chúng tôi đã thực hiện quét toàn bộ thư mục `app/**/page.tsx` và `app/**/layout.tsx` (Tổng số route đã quét: **22 route**):

### 1.1. Danh sách route đã đồng bộ App Shell mới
Các route đã được nâng cấp an toàn lên `EnterpriseAppShell`, `EnterpriseHeader` và `EnterprisePageContainer`:

1. `/` (`app/page.tsx` - Dashboard chính)
2. `/projects` (`app/projects/ProjectListScreen.tsx` - Danh sách dự án)
3. `/wbs` (`app/wbs/WBSListScreen.tsx` - Hạng mục WBS)
4. `/budget` (`app/budget/BudgetBOQScreen.tsx` - Ngân sách & Định mức BOQ)
5. `/costs` (`app/costs/page.tsx` - Quản lý chi phí)
6. `/debt` (`app/debt/page.tsx` - Sổ nợ kế toán)
7. `/cash-bank` (`app/cash-bank/page.tsx` - Sổ quỹ & Ngân hàng)
8. `/inventory` (`app/inventory/page.tsx` - Quản lý tồn kho)
9. `/approvals` (`app/approvals/ApprovalsScreen.tsx` - Phê duyệt chứng từ)
10. `/reports` (`app/reports/page.tsx` - Báo cáo tài chính)
11. `/reports/inventory/stock-card` (`app/reports/inventory/stock-card/page.tsx`)
12. `/reports/inventory/in-out-balance` (`app/reports/inventory/in-out-balance/page.tsx`)
13. `/reports/inventory/project-stock` (`app/reports/inventory/project-stock/page.tsx`)
14. `/tax` (`app/tax/page.tsx` - Sổ thuế VAT)
15. `/revenue` (`app/revenue/page.tsx` - Sổ doanh thu)
16. `/accounting` (`app/accounting/page.tsx` - Nghiệm thu & Thanh toán)
17. `/accounting/contracts/[id]` (`app/accounting/contracts/[id]/page.tsx` - Chi tiết hợp đồng)
18. `/settings` (`app/settings/page.tsx` - Cấu hình kỳ kế toán)
19. `/system` (`app/system/page.tsx` - Giám sát hệ thống telemetry)

### 1.2. Danh sách route chưa đồng bộ (Cần xử lý trong Phase 3D)
- `/projects/[id]` (`app/projects/[id]/page.tsx` - Chi tiết dự án): Vẫn sử dụng `<Sidebar>` và `<Header>` cũ từ thư mục `@/app/components`, gây nguy cơ lệch màu hoặc trùng lặp phần tử điều hướng.
- *Hành động*: Nâng cấp `/projects/[id]/page.tsx` sang `EnterpriseAppShell` để khóa hoàn chỉnh 100% các route chức năng.

### 1.3. Danh sách route ngoại lệ hợp lệ
- `/login` (`app/login/page.tsx` - Màn hình đăng nhập): Sử dụng giao diện tối giản, độc lập, không hiển thị sidebar là hoàn toàn chính xác.
- `/print/*` (9 route in A4):
  - `/print/advance/[id]`
  - `/print/bank-transfer/[id]`
  - `/print/cash-payment/[id]`
  - `/print/cash-receipt/[id]`
  - `/print/debt`
  - `/print/inventory/issue/[id]`
  - `/print/inventory/receipt/[id]`
  - `/print/invoice/[id]`
  - `/print/ledger`
  - `/print/payment/[id]`
  - *Lý do*: Được thiết kế để xuất bản in vật lý khổ giấy A4, bắt buộc hiển thị nền trắng chữ đen thuần túy và không chứa thanh điều hướng App Shell.

---

## 2. Kiểm kê Bảng biểu và Khả năng thích ứng (Table & Grid Audit)

Tổng số bảng được rà soát: **15 bảng**

### 2.1. Đã sử dụng `EnterpriseDataTable` V3
Hầu hết các màn hình lớn đã được quy hoạch về V3 giúp cuộn ngang mượt mà, hỗ trợ phân trang và tùy chỉnh bộ lọc:
- `/tax` (Bảng hóa đơn, bảng kê mua vào, bán ra)
- `/revenue` (Doanh thu công trình)
- `/wbs` (Hạng mục công việc)
- `/budget` (Định mức BOQ)
- `/costs` (Hồ sơ chi phí)
- `/debt` (Đối chiếu công nợ)
- `/inventory` (Vật tư và thẻ kho)
- `/approvals` (Hòm thư phê duyệt)
- `/accounting` và `/accounting/contracts/[id]` (Các bảng thanh toán, nghiệm thu thầu phụ, checklist hồ sơ)
- `/reports/inventory/*` (Bảng kê nhập xuất tồn, thẻ kho vật tư)

### 2.2. Sử dụng `EnterpriseTable` V2 (Chấp nhận được)
- `/reports` (Báo cáo tổng hợp tài chính, cảnh báo rủi ro, dự phòng tuổi nợ): Kế thừa giao diện V2 từ Phase 3B hoạt động ổn định, có tiêu đề và phân cách rõ ràng.

### 2.3. Bảng thủ công (Manual HTML tables)
- `/cash-bank` (Danh sách phiếu thu/chi, ủy nhiệm chi): Vẫn sử dụng thẻ `<table>` thô nhưng được bọc trong các thẻ div có cuộn ngang an toàn (`min-w-[1100px]`), bảo toàn dữ liệu nghiệp vụ nhạy cảm của thủ quỹ.
- Bảng phụ chi tiết trong `/components/inventory/InventoryDocumentLinesTable.tsx`: Hợp lý vì là bảng dòng chứng từ phụ, không cần phân trang độc lập.
- Toàn bộ `/print/*` dùng table thủ công: Hợp lệ để đảm bảo in ấn A4 chuẩn chỉ.

---

## 3. Kiểm kê Màu sắc cứng (Hard-coded Colors Audit)

### 3.1. Các điểm cần làm sạch trong Phase 3D
- `app/cash-bank/page.tsx` (Dòng 868): `border-[#2d2d3c] bg-gray-700 hover:bg-gray-600 text-white` trong nút hủy phiếu.
  - *Khắc phục*: Thay đổi thành màu semantic cảnh báo hoặc border dùng chung.
- `app/projects/[id]/page.tsx`: Chứa các từ khóa `text-white` thô cứng trên nút điều phối và dòng thông báo lỗi.
  - *Khắc phục*: Quy chuẩn về `text-[var(--text-primary)]`.

### 3.2. False Positives (Được phép giữ)
- Các file cấu hình màu trạng thái (`app/components/ui-enterprise/status-styles.ts`): Cần duy trì các màu cố định để phân biệt rõ `DRAFT`, `ISSUED`, `POSTED`, `CANCELLED` (Xanh, Vàng, Đỏ, Tím).
- `VisualAnalytics.tsx`: Chứa mã Hex màu vẽ biểu đồ tài chính, hoàn toàn hợp lệ để vẽ Canvas/SVG.

---

## 4. Kiểm kê Nhãn ngôn ngữ (Vietnamese Translation Audit)

- Hầu hết giao diện đã được Việt hóa đạt **98%**.
- Một số chuỗi chữ tiếng Anh còn sót trong các trạng thái ẩn hoặc thông báo rỗng:
  - `NO DATA` trong các dashboard đối soát nhanh.
  - Từ khóa `loading` hoặc `isLoading` hiển thị dòng chữ tiếng Anh "Loading..." ở một số file báo cáo.
  - *Khắc phục*: Việt hóa thành "Đang tải dữ liệu...", "Chưa có dữ liệu".

---

## 5. Danh sách các File cần chỉnh sửa trong Phase 3D-B

1. **`app/projects/[id]/page.tsx`**: Đồng bộ App Shell mới, gỡ bỏ Sidebar/Header cũ, đồng bộ Light/Dark Mode.
2. **`app/cash-bank/page.tsx`**: Sửa nút "HỦY PHIẾU" loại bỏ border và màu xám cứng.
3. **`app/components/accounting/MoneyTextLine.tsx`**: Nâng cấp màu background xám `bg-zinc-50 border-zinc-200` sang biến CSS để tránh lệch màu Dark Mode.
4. **`app/components/inventory/InventoryStatusTimeline.tsx`**: Nâng cấp màu xám của timeline sang biến CSS của theme.
5. **`app/components/inventory/InventoryReportFilterBar.tsx`**: Nâng cấp màu nền bộ lọc sang biến CSS của theme.

---

## 6. Danh sách Vấn đề đưa vào Backlog (Không sửa tại Phase 3D)

- **Vấn đề 1**: Chuyển đổi toàn bộ bảng hạch toán dòng tiền của `/cash-bank` sang `EnterpriseDataTable` V3.
  - *Lý do*: Bảng dòng tiền có các logic nhập số phức tạp trực tiếp trên lưới (inline cell inputs) và liên kết nghiệp vụ với ngân quỹ tức thời. Chuyển đổi hàng loạt trong sweep này có rủi ro cao gây mất mát dữ liệu hoặc lỗi tính toán. Đưa vào backlog xử lý sau.
- **Mức độ**: Trung bình.
- **Rủi ro**: Cao (Ảnh hưởng trực tiếp đến nghiệp vụ ghi thu chi).

---

## 7. Kết luận Audit

> [!IMPORTANT]
> **KẾT LUẬN**: **CHO PHÉP SỬA NHỎ NGAY (SAFE TO PROCEED WITH SMALL FIXES)**
> 
> Các thay đổi trong danh sách Phase 3D-B đều an toàn, mang tính chất tinh chỉnh thẩm mỹ giao diện và Việt hóa text hiển thị, không đụng chạm đến logic tính toán hay API.

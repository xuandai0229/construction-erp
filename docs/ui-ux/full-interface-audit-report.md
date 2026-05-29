# Báo Cáo Kiểm Tra Giao Diện UI/UX Toàn Diện (Forensic Audit Report)

**Ngày kiểm tra:** 29/05/2026
**Phạm vi kiểm tra:** Toàn bộ các màn hình chính trong hệ thống Construction ERP.
**Mục tiêu:** Đánh giá sự đồng bộ, tính chuyên nghiệp (Enterprise-grade), các vấn đề về Layout, Color, Typography, Table, Form và chuẩn bị cho kế hoạch chuẩn hóa Design System.

---

## 1. TỔNG QUAN VẤN ĐỀ (EXECUTIVE SUMMARY)

Hệ thống hiện tại đã có bộ khung giao diện khá tốt, sử dụng TailwindCSS và một số component dùng chung (`EnterpriseTable`, `EnterpriseCard`). Tuy nhiên, do quá trình phát triển nhanh, nhiều module đang bị "phân mảnh" về mặt giao diện (fragmentation):
- **Phá vỡ Design System:** Việc lạm dụng hard-code mã màu HEX (như `#1c1c24`, `#2d2d3c` trong module Quỹ/Ngân hàng) hoặc các class Tailwind cục bộ (`bg-zinc-50/30`) làm hỏng tính năng Dark/Light mode và gây mất đồng bộ.
- **Bất nhất trong Component:** Các thành phần như Tabs, Buttons, Filters, và Pagination được code tay lại ở nhiều trang khác nhau thay vì dùng chung component.
- **Bảng dữ liệu (Table) chưa đồng nhất:** Một số màn hình dùng `EnterpriseTable`, trong khi một số báo cáo (như Sổ quỹ, Sổ ngân hàng) lại dùng bảng HTML tự code, dẫn đến lệch cột, sai padding, hover effect khác nhau.
- **Empty State & Loading:** Có sự lộn xộn giữa việc dùng `EnterpriseEmptyState` và render text thuần (`<tr><td>Không có dữ liệu</td></tr>`).

---

## 2. DANH SÁCH MÀN HÌNH ĐÃ KIỂM TRA

1. **Dashboard (/):** Giao diện tổng quan, Layout, Navigation, KPI Cards.
2. **Projects (/projects):** Danh sách công trình, Phân trang, Table.
3. **Costs (/costs):** Quản lý chi phí, Filter Bar, Detail Modal.
4. **Debt (/debt):** Phải thu/Phải trả, Metric Cards, Tabs.
5. **Cash & Bank (/cash-bank):** Sổ quỹ, Ủy nhiệm chi, Báo cáo sổ chi tiết.
6. **Inventory (/inventory):** Tổng quan kho, Thẻ kho, Nhập xuất tồn.

---

## 3. CÁC LỖI UI NGHIÊM TRỌNG (CRITICAL / HIGH)

### 3.1. Phá vỡ Theme (Dark/Light Mode) & Hardcode màu sắc (High)
- **Vị trí:** `app/cash-bank/page.tsx`, `app/inventory/page.tsx`.
- **Vấn đề:** Module Quỹ/Ngân hàng sử dụng rất nhiều màu HEX cứng (`bg-[#1c1c24]`, `border-[#2d2d3c]`, `bg-[#22222e]`, `bg-[#18181c]`). Khi người dùng chuyển sang Light Mode, màn hình này sẽ vẫn tối đen hoặc màu sắc bị lẫn lộn, rất khó đọc và thiếu chuyên nghiệp.
- **Vấn đề 2:** Module Inventory sử dụng các dải màu của hệ zinc (`bg-zinc-900/40`, `border-zinc-800`), cũng không tuân thủ các CSS variables chuẩn như `var(--card)`, `var(--border)`, `var(--background)`.

### 3.2. Bảng dữ liệu (Tables) không đồng bộ (High)
- **Vị trí:** `app/cash-bank/page.tsx` (Tab Sổ quỹ và Sổ ngân hàng).
- **Vấn đề:** Thay vì dùng `EnterpriseTable`, hai sổ này dùng bảng table thuần với class Tailwind tự viết. Kết quả là padding, font-size, màu border, hover row state hoàn toàn lệch pha so với các màn hình khác (như `ProjectTable` hay `CostTable`).
- **Căn lề (Alignment):** Một số nơi số tiền chưa ép chuẩn font `tabular-nums` hoặc có sự sai lệch nhẹ về margin khi hiển thị empty state.

---

## 4. CÁC LỖI THIẾU ĐỒNG BỘ (MEDIUM)

### 4.1. Hệ thống Tabs (Medium)
- **Vấn đề:** Màn hình `Inventory`, `CashBank`, và `Debt` đều có Tabs nhưng cách implement khác nhau.
  - Inventory: `px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent text-zinc-400...`
  - CashBank: `px-6 py-3 text-[13px] font-bold border-b-2 border-transparent text-[var(--text-secondary)]...`
- **Hệ quả:** UI trông giống như được ghép từ nhiều template khác nhau. Cần 1 component `EnterpriseTabs` dùng chung.

### 4.2. Buttons và Action Bars (Medium)
- **Vấn đề:** Kích thước nút và màu sắc lộn xộn.
  - CashBank tạo nút mới (Thêm chứng từ) bằng: `bg-gradient-to-r from-blue-600 to-indigo-600`.
  - Costs dùng nút: `bg-blue-600 hover:bg-blue-500`.
  - Một số nơi dùng class toàn cục `.erp-btn`, một số nơi lại không dùng.
- **Hệ quả:** Nút nhấn chính của các màn hình không mang lại trải nghiệm click (tactile feedback) giống nhau.

### 4.3. Phân trang (Pagination) (Medium)
- **Vấn đề:** `ProjectListScreen.tsx` có một khối giao diện phân trang rất to và tự code. Nếu các màn hình khác cũng cần phân trang, sẽ phải copy-paste cục code này.
- **Hệ quả:** Rất dễ lỗi bảo trì. Cần đưa vào `EnterprisePagination` hoặc tích hợp thẳng vào `EnterpriseTable`.

---

## 5. CÁC ĐIỂM LÀM GIẢM CẢM GIÁC CHUYÊN NGHIỆP (LOW)

- **Empty State thủ công:** Bảng Sổ quỹ báo `Không có giao dịch tiền mặt đã ghi sổ nào` bằng thẻ `<tr><td colSpan={8}>` trống, thiếu Icon, thiếu mô tả như `EnterpriseEmptyState`.
- **Typography:** Lạm dụng việc gõ thẳng `text-[13px]`, `text-[11px]` thay vì dùng các biến CSS chuẩn như `var(--text-sm)`, `var(--text-xs)` đã định nghĩa trong `globals.css`.
- **Shadow/Elevation:** Có một số thẻ div tự bọc `shadow-2xl` tĩnh, trong khi `EnterpriseCard` xử lý hover shadow mượt mà hơn.

---

## 6. ĐỀ XUẤT HƯỚNG NÂNG CẤP (ACTION PLAN)

**Phase 2: Design System Foundation**
1. Cập nhật `app/components/ui-enterprise/index.ts` để thêm:
   - `EnterpriseTabs`: Component dùng chung cho chuyển tab.
   - `EnterprisePagination`: Đóng gói logic phân trang.
2. Xóa các màu HEX hardcode trong toàn hệ thống, thay bằng `var(--card)`, `var(--border)`, `var(--text-primary)`, `var(--text-secondary)`.

**Phase 3 & 4: Upgrade & Table Refinement**
1. Cấu trúc lại file `CashBankPage` và `InventoryPage`, ép dùng chung `EnterpriseTable` cho các báo cáo dạng lưới.
2. Chỉnh lại toàn bộ các nút chức năng chính về class chuẩn `.erp-btn` kết hợp với màu primary/success/danger để đảm bảo hover/active state đồng bộ.
3. Review lại toàn bộ Padding/Margin (Spacing) để chuẩn hóa theo hệ thống `--space-1` đến `--space-10`.

Báo cáo này làm cơ sở để tiến hành **Phase 2: Xây dựng nền tảng Design System**.

# Hướng Dẫn Kỹ Thuật UI/UX & Design System Hệ Thống Construction ERP

## 1. NGUYÊN TẮC THIẾT KẾ (DESIGN PRINCIPLES)

1. **Enterprise-Grade Focus:** Giao diện không phải là nơi để trang trí lòe loẹt. Mọi đường nét, màu sắc phải phục vụ cho việc đọc số liệu, phân tích dữ liệu, và thực hiện nghiệp vụ kế toán nhanh chóng, chính xác.
2. **Consistency (Đồng bộ tuyệt đối):** Không tự ý sáng tạo UI cho từng trang. Mọi nút bấm, bảng biểu, hộp thoại (modal), màu sắc cảnh báo đều phải dùng chung một chuẩn (Design Tokens).
3. **Responsive & Scalable:** Giao diện phải tương thích với mọi kích thước màn hình từ Desktop (chính), Laptop, đến Tablet. (Hệ thống ưu tiên Desktop/Laptop).
4. **Theme Support (Light/Dark Mode):** Không được hard-code các giá trị mã màu (Hex, RGB) trực tiếp vào component. Bắt buộc dùng CSS Variables được định nghĩa trong `globals.css`.

---

## 2. DESIGN TOKENS (SỬ DỤNG TRONG TAILWIND)

### 2.1. Màu sắc (Colors)
Chỉ sử dụng các biến CSS sau thông qua class Tailwind tương ứng hoặc truyền trực tiếp qua style:

- **Nền (Background):** `bg-[var(--background)]`, `bg-[var(--card)]`, `bg-[var(--secondary)]`, `bg-[var(--popover)]`
- **Chữ (Text):** 
  - `text-[var(--text-primary)]`: Tiêu đề, số liệu quan trọng.
  - `text-[var(--text-secondary)]`: Chữ thường, body text.
  - `text-[var(--text-muted)]`: Chữ mờ, chú thích, placeholder.
  - `text-[var(--text-tertiary)]`: Chữ mờ hơn, label phụ.
  - `text-[var(--text-accent)]`: Nhấn mạnh, liên kết.
- **Biên (Border):** `border-[var(--border)]`, `border-[var(--divider)]`, `border-[var(--input-border)]`
- **Màu thương hiệu & Trạng thái:** Dùng các class có sẵn của Tailwind theo tông chuẩn (VD: `blue-500`, `rose-500`, `emerald-500`, `amber-500`) nhưng áp dụng dưới dạng Badge (có nền nhạt 10%).

### 2.2. Khoảng cách & Typography (Spacing & Typography)
- Khuyến khích dùng các class spacing của Tailwind: `p-4`, `m-2`, `gap-4`, `space-y-4`.
- Font Size ưu tiên sử dụng biến: `var(--text-xs)`, `var(--text-sm)`, `var(--text-md)` hoặc các class chuẩn như `text-[12px]`, `text-[14px]`. Tuyệt đối không hardcode cỡ chữ ngẫu nhiên như `text-[13px]`, `text-[11px]`.
- Mọi con số (số tiền, tỉ lệ) đều phải có class `tabular-nums` và `font-mono` (hoặc font số đồng kích thước) để các hàng dọc luôn gióng thẳng nhau.

---

## 3. COMPONENT NỀN TẢNG (ENTERPRISE COMPONENTS)

Tất cả các file UI cần import component từ `app/components/ui-enterprise`.

### 3.1. EnterpriseTable
- **Chức năng:** Dùng cho MỌI BẢNG (Danh sách chứng từ, Sổ cái, Thẻ kho).
- **Quy tắc:**
  - `stickyHeader={true}` mặc định để khi cuộn dữ liệu vẫn thấy tiêu đề.
  - Cột số tiền (Amount, Cost) phải được căn phải (`align: 'right'`).
  - Hỗ trợ footer đính kèm (`sticky bottom`) để tính tổng số.
- **Không được dùng:** `<table>`, `<tr>`, `<td>` thủ công ở các trang ngoài.

### 3.2. EnterpriseCard & EnterpriseSection
- **Chức năng:** Phân chia các khối nội dung.
- **Quy tắc:** 
  - `EnterpriseSection` bọc toàn bộ một vùng dữ liệu lớn (có title to).
  - `EnterpriseCard` bọc một form hoặc bảng nhỏ (có border, shadow, hover effect).

### 3.3. EnterpriseEmptyState
- **Chức năng:** Hiển thị khi danh sách trống.
- **Quy tắc:** Bắt buộc phải có Icon, Title, và một dòng Description ngắn gọn hướng dẫn người dùng làm bước tiếp theo (VD: "Nhấn nút Thêm mới để tạo...").

### 3.4. EnterpriseTabs (Sắp được bổ sung)
- **Chức năng:** Chuyển đổi giữa các view trên cùng một màn hình (VD: Sổ quỹ / Danh sách / Báo cáo).
- **Quy tắc:** Hover effect rõ ràng, Active state gạch chân bằng màu Primary (`blue-500`).

### 3.5. Buttons (.erp-btn)
- Bất kỳ nút nào cũng nên thêm class `.erp-btn` để đồng bộ hiệu ứng click và hover (tactile feedback).
- Không tự viết các class hiệu ứng dư thừa.

---

## 4. QUY CHUẨN TỪNG MODULE (MODULE SPECIFICATIONS)

### 4.1. Dashboard
- Layout: Header phía trên, KPI bên trên cùng, Biểu đồ và Bảng cảnh báo ở dưới.
- Các thẻ KPI (Metric) phải sử dụng `EnterpriseMetric`.

### 4.2. Form & Nhập liệu (Data Entry)
- Các field nhập liệu phải thẳng hàng (grid cols).
- Sử dụng thẻ `<label>` chữ in hoa nhỏ (`text-[10px] uppercase font-bold tracking-wider`).
- Khi click (focus) vào input, viền phải đổi màu Primary (có ring effect).

### 4.3. Màu Trạng thái (Status Badges)
Định nghĩa class chuẩn cho các trạng thái chứng từ:
- **Thành công (Hoàn tất, Đã trả, POSTED):** Nền xanh lá nhạt, viền xanh lá, chữ xanh lá đậm (`bg-emerald-500/10 text-emerald-500 ring-emerald-500/30`).
- **Thất bại (Hủy, Từ chối, Lỗi, Quá hạn):** Nền đỏ/hồng nhạt, chữ đỏ (`bg-rose-500/10 text-rose-500 ring-rose-500/30`).
- **Chờ duyệt (Pending, Submitted):** Nền xanh lam nhạt, chữ xanh lam (`bg-blue-500/10 text-blue-500 ring-blue-500/30`).
- **Cảnh báo (Warning, Draft):** Nền xám hoặc cam (`bg-amber-500/10 text-amber-500 ring-amber-500/30`).

---

## 5. THỰC THI (ENFORCEMENT)

- Reviewer (Auditor) sẽ kiểm tra mã nguồn (CSS/Tailwind classes). Nếu phát hiện file nào không tuân thủ các biến CSS (dùng mã HEX cứng) hoặc tự thiết kế Table, Pull Request sẽ bị chặn (reject) và yêu cầu cấu trúc lại.

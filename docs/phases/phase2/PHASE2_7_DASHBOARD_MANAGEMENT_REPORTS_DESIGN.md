# SPRINT 2.7: DASHBOARD & MANAGEMENT REPORTS DESIGN

## 1. Mục tiêu
Thiết kế lại hệ thống Báo cáo quản trị (Management Reports) và Bàn làm việc Kế toán (Dashboard) để phục vụ cho các cấp độ quản lý khác nhau: Giám đốc (CEO), Kế toán trưởng (CFO), và Quản lý dự án (PM). 

## 2. Tổ chức Báo cáo (Report Groups)

Hệ thống Dashboard sẽ được tổ chức thành 4 phân hệ báo cáo chính:

### A. Executive Summary (Báo cáo Tổng quan Tài chính)
Dành cho **Giám đốc / Kế toán trưởng** đánh giá sức khỏe tài chính toàn công ty.
* **KPIs**:
  * Tổng Doanh thu / Tổng Chi phí / Lãi Lỗ (Net Profit).
  * Tổng Phải thu (AR) / Tổng Phải trả (AP).
  * Tạm ứng tồn đọng.
  * Dòng tiền thuần (Net Cashflow).
  * Số chứng từ chờ duyệt.
* **Đặc tả UI**: 
  * Grid gồm các `EnterpriseMetric` cards nổi bật.
  * Hỗ trợ So sánh kỳ này vs kỳ trước (Trend indicators).
  * Drill-down: Click vào AR mở báo cáo Debt, click Tạm ứng mở Advance list.

### B. Project Profitability Report (Báo cáo Hiệu quả Dự án)
Dành cho **Quản lý công trình / Kế toán dự án** giám sát ngân sách và doanh thu từng dự án.
* **KPIs & Bảng biểu**:
  * Bảng tổng hợp theo Project/Contract.
  * Cột: Giá trị HĐ, Doanh thu hạch toán, Đã thu, Phải thu còn lại, Chi phí hạch toán, Lãi/Lỗ, Profit Margin (%), % Sử dụng Ngân sách.
  * Trạng thái rủi ro (Risk Level): Xanh (Tốt), Vàng (Nguy cơ vượt ngân sách), Đỏ (Lỗ).
* **Đặc tả UI**: 
  * `EnterpriseTable` hỗ trợ sort theo Margin hoặc Lãi/Lỗ.
  * Action: Xem chi tiết dự án (Drill-down to Project Overview).

### C. Debt & Cashflow Report (Báo cáo Dòng tiền & Công nợ)
Dành cho **Kế toán trưởng / Kế toán thanh toán**.
* **Phần Công nợ (Debt)**:
  * AR/AP Aging Buckets: Chưa đến hạn, 1-30 ngày, 31-60 ngày, >90 ngày.
  * Top khách hàng nợ quá hạn.
* **Phần Dòng tiền (Cashflow)**:
  * Cash In (Dòng tiền vào - từ thu KH).
  * Cash Out (Dòng tiền ra - chi NCC, tạm ứng).
  * Net Cashflow (Dòng tiền thuần).
* **Đặc tả UI**: 
  * Biểu đồ/bảng tóm tắt Aging Buckets.
  * Bảng danh sách Hóa đơn quá hạn (Overdue Invoices).

### D. Exception / Risk Dashboard (Cảnh báo Rủi ro Kế toán)
Dành cho **Kiểm soát nội bộ / CFO**.
* **Cảnh báo**:
  * Chứng từ thiếu hồ sơ gốc (Source document missing).
  * Hóa đơn quá hạn thanh toán dài ngày.
  * Tạm ứng chưa hoàn ứng quá SLA.
  * Dự án vượt chi phí định mức (Over budget).
  * Bút toán Sổ Cái lệch hoặc chưa Post.
* **Đặc tả UI**: 
  * Danh sách dạng list cảnh báo (RiskAlertsPanel) với Severity (High, Medium, Low).
  * Nút "Xử lý ngay" dẫn trực tiếp đến màn hình giải quyết (vd: Approval Inbox, Payment).

## 3. Thành phần Giao diện & Filter
* **Report Filter Bar**:
  * Công ty (Tenant isolation).
  * Dự án / Hợp đồng.
  * Kỳ kế toán (Fiscal Period) hoặc Date Range.
  * Module/Status.
* **Export & Print**:
  * Tích hợp chức năng xuất Excel / in PDF từ hệ thống Print/Export (Sprint 2.5) cho từng nhóm báo cáo.
* **Trạng thái UI**:
  * Tái sử dụng `EnterpriseEmptyState` khi không có dữ liệu.
  * Loading skeletons mượt mà.
  * Hiển thị Tooltip nguồn dữ liệu (Data Source) cho từng KPI (vd: *Lấy từ PaymentAllocation*).

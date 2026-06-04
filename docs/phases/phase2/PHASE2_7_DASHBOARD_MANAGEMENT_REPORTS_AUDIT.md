# SPRINT 2.7: DASHBOARD & MANAGEMENT REPORTS AUDIT

## 1. Mục tiêu Audit
Đánh giá tình trạng thực tế của Dashboard kế toán và hệ thống báo cáo quản trị nhằm chuẩn bị cho việc nâng cấp ở Sprint 2.7. Mục tiêu là biến Dashboard thành trung tâm chỉ huy tài chính (Financial Command Center) với các số liệu chính xác 100% từ Ledger/Subledger.

## 2. Kết quả Audit Chi tiết

| Màn hình/Báo cáo | Hiện trạng | Thiếu gì | Rủi ro quản trị/kế toán | Đề xuất |
| ---------------- | ---------- | -------- | ----------------------- | ------- |
| **Dashboard Tổng quan** | Đã có UI đẹp (EnterpriseCard, EnterpriseMetric). | Thiếu filter theo Company, Period, Date Range. | Dữ liệu bị giới hạn ở 1 Project hoặc toàn cục không rõ ràng. | Bổ sung Global Filter Bar. Phân tách Executive Summary. |
| **Doanh thu / Chi phí** | Dựa trên `totalRevenue` và `totalCost` lưu sẵn trong Project. | Chưa query trực tiếp từ Ledger (TK 511, 621, v.v.). | Dữ liệu có thể bị drift nếu không update Project schema kịp thời. | Chuyển sang query từ Posted Ledger / Invoices. |
| **Công nợ (AR/AP)** | Có KPI Phải thu/Phải trả nhưng logic tính toán chưa tối ưu, thiếu aging. | Thiếu báo cáo Debt Aging (quá hạn 30, 60, 90 ngày). | Khó kiểm soát nợ đọng, rủi ro thiếu hụt dòng tiền. | Tạo báo cáo Debt Management riêng biệt. |
| **Dòng tiền (Cashflow)** | Chưa có báo cáo dòng tiền vào/ra (In/Out) theo tháng. | Hoàn toàn chưa có. | Giám đốc không nắm được Cash Position. | Xây dựng Cashflow Summary Chart/Table. |
| **Tạm ứng (Advances)** | Có hiển thị KPI Outstanding. Có drill-down trace. | Chưa có báo cáo chi tiết theo nhân viên. | Thất thoát tạm ứng nếu không theo dõi sát sao. | Tích hợp Risk Alerts cho tạm ứng quá hạn. |
| **Kiểm soát rủi ro** | Có cảnh báo "Chứng từ thiếu hóa đơn", "Đối chiếu Sổ cái" (nhưng đang hardcode 0 và Khớp 100%). | Logic check thực tế. | Rủi ro lọt lỗi do tin tưởng vào dữ liệu static/mock. | Gọi API Risk Alerts thực tế từ hệ thống. |
| **WBS / Profitability** | Có cảnh báo "Công trình lỗ". | Chưa có báo cáo Project Profitability chi tiết (Margin, Budget Usage). | Quản lý không phân tích được hiệu quả từng hợp đồng. | Tạo báo cáo Project Profitability Report (P&L). |

## 3. Trả lời các câu hỏi trọng tâm

1. **Dashboard có đang dùng dữ liệu thật từ ledger/subledger không?**
   Một phần dùng dữ liệu thật qua API `/api/dashboard/stats`, nhưng logic fallback vẫn gán số `0` và một số báo cáo chỉ dựa vào trường summary của bảng `Project`.

2. **Có KPI nào còn hardcode/mock/static không?**
   **CÓ**. Cảnh báo "Chứng từ thiếu hóa đơn gốc" gán `missingDocsCount: 0`. "Đối chiếu Số dư Sổ Cái vs Chi tiết" gán static `<EnterpriseBadge>Khớp 100%</EnterpriseBadge>`.

3. **Doanh thu có lấy từ posted ledger hoặc invoice source chuẩn không?**
   Chưa hoàn toàn. Đang lấy từ trường `totalRevenue` hoặc `contractValue` của Project (có nguy cơ drift).

4. **Công nợ có lấy từ PaymentAllocation/remainingAmount chuẩn không?**
   Cần refactor lại API stats để lấy trực tiếp từ `PaymentAllocation` làm nguồn chân lý (Source of Truth) theo đúng kiến trúc của Sprint 2.4A.

5. **Tạm ứng có lấy từ AdvanceRequest/AdvanceSettlement thật không?**
   Có, API đã tích hợp nhưng cần đảm bảo lấy đúng trạng thái `outstanding`.

6. **Lãi/lỗ công trình có dùng nguồn chuẩn không?**
   Đang so sánh đơn giản `cost > budget` hoặc `cost > contractValue`. Cần P&L chuẩn.

7. **Có filter company/project/contract/period/status không?**
   Hiện tại mới chỉ filter theo `currentProjectId` (zustand store), chưa có bộ lọc thời gian hay công ty (tenant-scope).

8. **Có drill-down từ KPI về chứng từ gốc không?**
   **CÓ**. KPI Công nợ và Tạm ứng đã tích hợp `FinancialTracePanel`. Cần mở rộng cho các chỉ số khác.

9. **Có cảnh báo bất thường không?**
   Có, nhưng cần làm sắc bén hơn (Overdue Invoices, Unallocated Payments).

10. **Có thể export/print báo cáo không?**
    Chưa có nút Export/Print trên giao diện Dashboard quản trị.

11. **Có empty/loading/error state chuyên nghiệp không?**
    **CÓ**. Đã sử dụng `EnterpriseEmptyState` rất chuyên nghiệp và rõ ràng.

12. **Có dashboard riêng cho kế toán trưởng/giám đốc không?**
    Chưa có sự phân tách rõ rệt giữa Executive (CFO/CEO) và Project Management (Quản lý dự án).

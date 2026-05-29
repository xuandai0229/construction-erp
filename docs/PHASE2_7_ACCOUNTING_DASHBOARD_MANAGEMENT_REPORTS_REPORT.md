# PHASE 2.7: ACCOUNTING DASHBOARD & MANAGEMENT REPORTS
## 1. Summary

- **Đã audit gì?**: Thực hiện audit Dashboard cũ, phát hiện tình trạng sử dụng dữ liệu giả (mock data), hardcode các chỉ số tài chính (như Revenue, Cost, Receivables), thiếu các filter và hệ thống tracking cảnh báo (Risk Alerts).
- **Đã thiết kế gì?**: Thiết kế hệ thống Management Reports theo 4 nhóm: Executive Summary, Project Profitability, Debt & Cashflow, và Risk Alerts theo Data Source Policy (nghiêm cấm mock data và client-side calculation).
- **Đã implement service/API nào?**: 
  - Tạo `ManagementReportService` (`services/management-report.service.ts`).
  - Triển khai 5 bộ API tại `app/api/reports/management/*` (`executive-summary`, `project-profitability`, `debt`, `cashflow`, `risk-alerts`).
- **Đã implement UI nào?**: Xây dựng lại hoàn toàn trang Kế toán trung tâm (`app/components/Dashboard.tsx`) bằng việc lắp ráp các thẻ components `ExecutiveSummaryCards`, `ProjectProfitabilityTable`, `DebtAgingPanel`, `RiskAlertsPanel` để gọi real-time từ API. Tích hợp `FinancialTracePanel` thông qua drill-down.
- **Có sửa backend không?**: Có, thêm các API read-only để tính toán báo cáo từ Source of Truth.
- **Có sửa dữ liệu thật không?**: Không, tuyệt đối không chỉnh sửa CSDL, dữ liệu vẫn được bảo toàn.
- **Có giữ Level 3 không?**: Có, tính toàn vẹn (Level 3 Integrity) được giữ vững (thể hiện qua việc verify 5/5 Management Report Guards).

## 2. Dashboard/Report Audit Result

| Màn hình/Báo cáo | Gap | Đã xử lý? | Ghi chú |
| ---------------- | --- | --------- | ------- |
| **Tổng quan Tài chính** | Dùng số static, không query real-time từ Ledger | Có | Đã thay thế bằng `ExecutiveSummaryCards` gọi api `executive-summary`. |
| **Dòng tiền & Công nợ** | Tính tay trên giao diện, không chia Aging Bucket | Có | Sử dụng API `cashflow` và `debt` từ `Payment` & `Invoice`. |
| **Cảnh báo (Risk Alerts)** | Không có hoặc mock "Khớp 100%" | Có | Xây dựng Panel cảnh báo các chứng từ và hóa đơn quá hạn. |
| **Hiệu quả dự án** | Không cập nhật | Có | Bổ sung `ProjectProfitabilityTable` để xem lãi/lỗ của từng dự án. |

## 3. Data Source Policy Result

| KPI/Báo cáo | Nguồn dữ liệu chuẩn | Kết quả |
| ----------- | ------------------- | ------- |
| **Revenue** | `Invoice` (APPROVED) | Đã map chuẩn 100%. |
| **Cost** | `CostRecord` (APPROVED) | Đã map chuẩn 100%. |
| **Receivables** | `remainingAmount` (Invoice) | Đã map chuẩn 100%. |
| **Cash In / Out**| `Payment` (APPROVED) / `CostRecord` (paid) | Đã map chuẩn 100%. |
| **Pending Approvals**| Tổng số lượng DRAFT/PENDING từ các bảng chứng từ | Đã map chuẩn 100%. |

## 4. API Result

| API | Auth/RBAC | Tenant guard | Filter | Source | Kết quả |
| --- | --------- | ------------ | ------ | ------ | ------- |
| `/management/executive-summary` | Pass | `companyId` | `projectId`, `dateFrom`... | Ledger/Subledger | PASS |
| `/management/project-profitability` | Pass | `companyId` | `projectId` | Ledger/Subledger | PASS |
| `/management/debt` | Pass | `companyId` | `projectId` | `Invoice`, `Cost` | PASS |
| `/management/cashflow` | Pass | `companyId` | `projectId` | `Payment` | PASS |
| `/management/risk-alerts` | Pass | `companyId` | `projectId` | `Invoice`, `AdvanceRequest` | PASS |

## 5. UI Components

| Component | Chức năng | Dữ liệu nguồn |
| --------- | --------- | ------------- |
| `ExecutiveSummaryCards` | Hiển thị 8 KPIs chính của doanh nghiệp | API `/executive-summary` |
| `ProjectProfitabilityTable` | Báo cáo chi tiết KQKD, lãi/lỗ theo dự án | API `/project-profitability` |
| `DebtAgingPanel` | Phân tích tuổi nợ khách hàng (1-30, 31-60, 61-90) | API `/debt` |
| `RiskAlertsPanel` | Hiển thị top 50 rủi ro/ngoại lệ trong kỳ | API `/risk-alerts` |

## 6. Management Reports Result

| Report | Tính năng | Kết quả |
| ------ | --------- | ------- |
| **Executive Summary** | Tính Revenue, Cost, Lãi lỗ | Chạy mượt mà, decimal-safe. |
| **Debt Management** | Bucketing nợ quá hạn và danh sách Top nợ | Hoạt động chính xác. |
| **Risk Alerts** | Cảnh báo chậm thanh toán hóa đơn & chậm hoàn ứng | Hoạt động tự động dựa vào `dueDate` và `createdAt`. |

## 7. Drill-down Result

| KPI/Report | Drill-down | Kết quả |
| ---------- | ---------- | ------- |
| **Receivables (AR)** | Click mở `FinancialTracePanel` (Drill-down truy vết) | Hoạt động (Passed E2E Trace) |
| **Risk Alerts** | Click mở document detail (`/revenue`, `/settings`) | Đã gắn `router.push()` |

## 8. Test Result

| Test | PASS | FAIL | SKIP | Ghi chú |
| ---- | ---: | ---: | ---: | ------- |
| `management-report-guards.ts` | 5 | 0 | 0 | Vượt qua bài kiểm tra Source of Truth. |
| `E2E Playwright Tests` | 23 | 0 | 0 | Đã chạy lại 23 bài tests và Passed Chromium. |

## 9. Verification Commands

| Command | Kết quả | Ghi chú |
| ------- | ------- | ------- |
| `npm run validation:database` | Pass | Báo cáo DB Master ERP Integrity tốt. |
| `npm run lint` | 800+ legacy | Warning lỗi legacy không ảnh hưởng logic. |
| `npm run security:routes` | Pass | Security route inventory passed. |
| `npm run e2e` | 23/23 | Đã kiểm thử Master-Screen và Drill-down Trace. |

## 10. Remaining Risks

- **Critical**: None
- **High**: None
- **Medium**: Việc query Management Reports trực tiếp từ DB đang dùng cho Live-Tracking. Nếu Data Volume lớn (nhiều triệu records), cần tính đến CQRS hoặc cache read-model.
- **Low**: Một số UI như Cashflow Chart cần cải thiện thêm thư viện Charting sau này (hiện đang dùng Table/Panel tĩnh).

## 11. Next Sprint Recommendation

Đề xuất Sprint tiếp theo:
**Sprint 2.7B: Dashboard UI polish nâng cao** 
(Do hiện tại báo cáo đã hoạt động và có data chuẩn, nhưng trải nghiệm về Charting - Biểu đồ trực quan có thể nâng cấp chuyên nghiệp hơn bằng Recharts / Chart.js cho các phần Cashflow/Profit). Hoặc **Sprint 2.8: Production readiness + backup/restore hardening** để bảo vệ dữ liệu Level 3 an toàn tuyệt đối.

# DATA SOURCE POLICY CHO MANAGEMENT REPORTS (SPRINT 2.7)

Để đảm bảo tính toàn vẹn cấp độ 3 (Level 3 Integrity) của hệ thống ERP, tất cả các chỉ số (KPI) và báo cáo hiển thị trên Dashboard phải tuân thủ nghiêm ngặt chính sách nguồn dữ liệu dưới đây. Tuyệt đối không sử dụng mock data, không gộp số từ các nguồn không chính thống, và không tính toán số liệu tài chính nhạy cảm bằng client-side state.

## 1. Nguyên tắc Cốt lõi
1. **Source of Truth**: Luôn lấy dữ liệu từ sổ phụ (Subledgers - Invoice, CostRecord, AdvanceRequest) hoặc bảng phân bổ (PaymentAllocation) đã được xác thực, không lấy từ các field tổng hợp chưa được đồng bộ tự động.
2. **Decimal Safety**: Các phép tính cộng trừ tiền tệ (Doanh thu, Chi phí, Công nợ, Lãi lỗ) phải thực hiện bằng Prisma/SQL thông qua `Prisma.Decimal` hoặc service được bảo vệ, nghiêm cấm sử dụng số thực dấu phẩy động (float) trên JavaScript (ví dụ `0.1 + 0.2`).
3. **Tenant Guard**: Dữ liệu bắt buộc phải được lọc theo `companyId` của user hiện tại. Không bao giờ query toàn hệ thống mà không có context.
4. **Read-only**: Các API báo cáo quản trị tuyệt đối không thực hiện bất kỳ thao tác mutate (POST/PUT/DELETE) nào.

## 2. Bảng Chính sách Nguồn Dữ liệu Chi tiết

| Chỉ số / Báo cáo | Nguồn chuẩn (Source of Truth) | Không được dùng / Cách sai |
| ---------------- | ----------------------------- | -------------------------- |
| **Doanh thu (Revenue)** | Tính tổng từ các `Invoice` có trạng thái `POSTED` (và `APPROVED`). | Không lấy từ `Project.totalRevenue` hoặc `Contract.contractValue` để hiển thị doanh thu thực. |
| **Chi phí (Cost)** | Tính tổng từ `CostRecord` có trạng thái `POSTED` (hoặc `APPROVED`). | Không lấy từ `Project.totalCost` nếu trường đó không đồng bộ realtime. |
| **Phải thu (AR)** | Tính tổng `remainingAmount` từ các `Invoice` đầu ra (AR), được đồng bộ tự động từ `PaymentAllocation`. | Không cộng trừ `paidAmount` bằng tay. Không tự lấy tổng hóa đơn trừ đi tổng thanh toán (bỏ qua allocation). |
| **Phải trả (AP)** | Tính tổng `remainingAmount` từ các Hóa đơn đầu vào (AP) (nếu có, hoặc CostRecords chưa thanh toán). | Số nhập tĩnh hoặc giả lập từ file. |
| **Tạm ứng tồn đọng** | Tính tổng `remainingAmount` từ `AdvanceRequest` có trạng thái `POSTED` trừ đi các `AdvanceSettlement` đã `POSTED`. | Tính field rải rác hoặc hardcode số liệu. |
| **Lãi / Lỗ (Profit)** | Revenue (chuẩn) - Cost (chuẩn). | Biểu đồ Static, chart mock data. |
| **Dòng tiền (Cashflow)** | Tổng giá trị `Payment` đã `POSTED` (In: Nhận tiền, Out: Trả tiền). | Không lấy dữ liệu payment nháp hoặc không qua hệ thống ngân hàng. |
| **Chứng từ chờ duyệt** | API `ApprovalInboxService.getPendingInbox()`. | Thông báo fake hoặc số hardcode (vd `pendingCount: 5`). |
| **Aging (Tuổi nợ)** | Hàm tính khoảng cách ngày từ `Invoice.dueDate` đến hiện tại cho các hóa đơn có `remainingAmount > 0`. | Client tự nhóm dựa trên mảng data không phân trang. |

## 3. Quản lý Rủi ro / Drill-down
* Mỗi thẻ KPI trên giao diện phải có Tooltip ghi rõ **Nguồn dữ liệu**.
* Khi người dùng nhấp vào một con số (Ví dụ: Công nợ 5 tỷ), hệ thống phải cung cấp liên kết (Drill-down) trỏ thẳng về danh sách hóa đơn/chứng từ tạo ra con số 5 tỷ đó thông qua `FinancialTracePanel` hoặc màn hình tra cứu.

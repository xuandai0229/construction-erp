# PHASE 2.4A PAYMENT ALLOCATION AUDIT REPORT

## 1. Mục tiêu Audit
Phân tích hiện trạng kiến trúc thanh toán (`Payment`) và Hóa đơn (`Invoice`) để chuyển đổi sang mô hình dùng `PaymentAllocation` làm nguồn chân lý (Source of Truth) cho các phép tính công nợ (`paidAmount`, `remainingAmount`) và đối soát (Reconciliation).

## 2. Kết quả Audit Schema & Models

### 2.1 Model `PaymentAllocation`
- **Hiện trạng:** Rất sơ khai. Chỉ có `id`, `paymentId`, `invoiceId`, `amount`, `isReversed`, `allocatedAt`.
- **Rủi ro:**
  - **Thiếu `companyId`**: Không thể cách ly dữ liệu Multi-Tenant (Tenant Isolation).
  - **Thiếu `status`**: Không có quản lý trạng thái Lifecycle (DRAFT, ACTIVE, CANCELLED, REVERSED). Việc chỉ dùng `isReversed: Boolean` là không đủ cho enterprise.
  - **Thiếu System Fields chuẩn**: `createdAt`, `updatedAt`, `deletedAt`, `version`, `createdBy`.
  - **Thiếu `contractId`**: Rất khó tracking allocation the level hợp đồng mà phải join qua Invoice.
- **Đề xuất:** Phải chạy một migration để chuẩn hoá `PaymentAllocation` theo quy chuẩn Level 3.

### 2.2 Model `Payment` & `Invoice`
- **Hiện trạng:** 
  - `Payment` có `invoiceId` (1 payment -> 1 invoice). Điều này ngăn cản Multi-invoice payment.
  - `Invoice` có `paidAmount`, `remainingAmount`.
- **Rủi ro:** Hard-linked 1-1 giữa Payment và Invoice khiến hệ thống không thể xử lý 1 Payment thanh toán cho nhiều Invoices.

## 3. Kết quả Audit Service Logic (RevenueService)

### 3.1 `createPayment`
- **Hiện trạng:** Cộng trực tiếp `amount` vào `invoice.paidAmount` ngay từ lúc tạo Payment (trạng thái DRAFT).
- **Rủi ro (CRITICAL):**
  - **Sai lệch kế toán:** Payment chưa được duyệt (DRAFT) nhưng hóa đơn đã bị ghi nhận giảm trừ công nợ. Điều này làm sai AR Aging report và Balance sheet.
  - **Không dùng Allocation:** Không tạo bản ghi `PaymentAllocation` nào.

### 3.2 `updatePaymentApproval`
- **Hiện trạng:** Đổi status thành APPROVED và gọi `PostingEngine`.
- **Rủi ro:** Không tính toán lại hay chốt sổ `paidAmount` tại thời điểm này. Nếu Payment bị REJECT, `paidAmount` của hóa đơn trước đó không bị trừ đi (dẫn đến vĩnh viễn sai lệch - Zombie Debt).

### 3.3 Reverse / Delete Flow
- **Hiện trạng:** Chưa có flow reverse allocation.

## 4. Rủi ro Tổng hợp (Risk Matrix)

| Nội dung | Hiện trạng | Rủi ro | Đề xuất |
| -------- | ---------- | ------ | ------- |
| **Tenant Isolation** | Allocation thiếu `companyId` | Rò rỉ dữ liệu chéo công ty | Thêm `companyId` vào Allocation schema. |
| **Lifecycle Status** | Allocation không có `status` | Khó audit và rollback | Thêm enum / string `status`. |
| **Source of Truth** | Cập nhật thẳng `invoice.paidAmount` ở hàm create DRAFT | Drift dữ liệu kế toán, AR report sai | Refactor: Update paidAmount từ sum của ACTIVE allocations khi Payment APPROVED. |
| **Multi-Invoice** | Payment hard-linked `invoiceId` | Không thể thanh toán 1 lúc nhiều hóa đơn | Tách dần sự phụ thuộc vào `Payment.invoiceId` (tuy chưa cần thiết xoá field này ngay). |

## 5. Kế hoạch Hardening (Sprint 2.4A)

1. **Thiết kế Policy**: Tạo `lib/accounting/paymentAllocationPolicy.ts` quy định mọi luật lệ của Allocation (cùng tenant, cùng supplier/customer, ko vượt quá invoice remaining).
2. **Schema Migration**: Bổ sung `companyId`, `status`, system fields cho `PaymentAllocation` an toàn mà không reset DB.
3. **Data Backfill**: Scan toàn bộ `Payment` hiện tại đang có `invoiceId`, sinh ra `PaymentAllocation` tương ứng và sync lại `paidAmount`.
4. **Service Refactor**: Sửa lại `RevenueService.createPayment` & `updatePaymentApproval` để tuân thủ mô hình Allocation-led.
5. **Report & Aging Update**: Ensure AR/AP Aging queries read from Allocations or accurately synced Invoice totals.
6. **Reconciliation**: Cập nhật forensic scripts để check 2 chiều Invoice <-> Allocations <-> Payment.

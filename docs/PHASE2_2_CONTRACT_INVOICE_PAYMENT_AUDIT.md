# PHASE 2.2: CONTRACT -> INVOICE -> PAYMENT AUDIT

## Mục tiêu Audit
Đánh giá mức độ chặt chẽ của vòng đời Hợp đồng -> Hóa đơn -> Thanh toán và khả năng truy vết (Drill-down) số liệu tài chính.

## Kết quả Audit

| Nội dung | Hiện trạng | Rủi ro | Đề xuất |
| -------- | ---------- | ------ | ------- |
| **Invoice Source Document** | Prisma schema có field `contractId` nhưng `RevenueService.createInvoice` không bắt buộc. | Hóa đơn bị tạo mồ côi (orphaned), mất kiểm soát so với giá trị Hợp đồng thực tế. | Bổ sung `SourceDocumentPolicy`, ép buộc truyền `contractId` hoặc `exceptionReason`. |
| **Payment Source Document** | `RevenueService.createPayment` bắt buộc có `invoiceId`. Schema `Payment` có `invoiceId` và `contractId` (optional). | Tương đối an toàn vì code đã chặn 404, nhưng thiếu concept phân bổ (Allocation). | Áp dụng rule: Payment phải map rõ allocation. |
| **Payment Allocation** | Schema có model `PaymentAllocation` nhưng chưa được sử dụng. `RevenueService` đang update thẳng `invoice.paidAmount`. | Không track được 1 Payment thanh toán cho nhiều Invoice, khó đối soát chi tiết. | Khởi tạo logic tính toán `paidAmount` dựa trên `PaymentAllocation`. |
| **Report: Paid Amount** | Chỉ tính khi `Invoice` lưu field `paidAmount`. Việc tính `remainingAmount` thực hiện lúc tạo Payment. | Nếu Payment bị Reversed/Draft, `paidAmount` vẫn bị giữ nguyên, gây sai lệch số nợ. | `paidAmount` phải được tính toán động (hoặc trigger) từ các Payment có trạng thái `POSTED`. |
| **AR/AP Aging Report** | Chưa có service/report Aging. | Không thể quản lý tuổi nợ, không nhắc nợ tự động được. | Cần xây dựng `aging.service.ts` phân nhóm 0-30, 31-60... dựa trên `dueDate`. |
| **Drill-down API** | Chưa có. | Người dùng thấy số liệu báo cáo nhưng không click xem được chứng từ cấu thành. | Cần API `/api/contracts/[id]/financial-trace` và tương tự cho Invoice/Payment. |
| **Fallback WBS** | Code kiểm tra WBS khá chặt (bắt buộc `wbsId` ở Invoice/Cost). | Ít rủi ro. | Xác nhận tiếp tục duy trì rule không fallback WBS. |
| **Audit Log** | Đã có AuditLog ở `RevenueService` khi Create/Approve Invoice/Payment. | An toàn. | Bổ sung log cho Allocation và Financial Trace errors. |

## Kết luận & Rủi ro
Hệ thống hiện tại có nền móng dữ liệu (schema) khá tốt, nhưng Logic (Service) còn bỏ ngỏ tính bắt buộc của Hợp đồng và chưa tận dụng `PaymentAllocation`. Cần xử lý khẩn cấp việc tính lại `remainingAmount` và `paidAmount` của Hóa đơn khi Thanh toán bị thay đổi trạng thái (Reversed).

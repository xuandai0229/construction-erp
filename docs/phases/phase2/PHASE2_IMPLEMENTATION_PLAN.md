# PHASE 2: IMPLEMENTATION PLAN

Kế hoạch nâng cấp hệ thống kế toán xây dựng đạt chuẩn mực nghiệp vụ rõ ràng, dễ dùng, truy vết được chứng từ gốc.

## Sprint 2.1: Chuẩn hóa Document Lifecycle (Hiện tại)
* **Mục tiêu**: Xây dựng nền tảng vững chắc về trạng thái chứng từ (Draft -> Submitted -> Approved -> Posted -> Reversed). Ngăn chặn mọi thao tác nhảy trạng thái sai hoặc sửa/xóa chứng từ đã ghi sổ.
* **File/module dự kiến**: `services/revenue.service.ts`, `services/finance/cost.service.ts`, `services/workflow/workflow.engine.ts`, `scripts/tests/document-lifecycle-guards.ts`.
* **Rủi ro**: Lỗi logic guard có thể chặn các luồng hợp lệ cũ.
* **Test cần chạy**: Bộ 12 test document lifecycle.

## Sprint 2.2: Chuẩn hóa Contract → Invoice → Payment
* **Mục tiêu**: Bổ sung Contract vào trung tâm dòng tiền. Mọi hóa đơn/thanh toán phải map với Contract. Xây dựng cấu trúc dữ liệu cho AR/AP Aging.
* **File/module dự kiến**: `prisma/schema.prisma` (update), `services/contract.service.ts`, `services/aging.service.ts`.
* **Rủi ro**: Cập nhật DB schema có thể ảnh hưởng báo cáo cũ. Cần migration an toàn.

## Sprint 2.3: Tạm ứng / Hoàn ứng / Đối trừ (Advance & Settlement)
* **Mục tiêu**: Xây dựng module xử lý luồng tiền ra nhưng chưa vào chi phí (Tạm ứng). Chức năng đối trừ (Offset) giữa Tạm ứng và Hóa đơn.
* **File/module dự kiến**: `services/advance.service.ts`, `services/settlement.service.ts`, `lib/accounting/postingEngine.ts`.
* **Rủi ro**: Hạch toán đối trừ là nghiệp vụ phức tạp, dễ gây mất cân đối Ledger nếu làm sai.

## Sprint 2.4: Drill-down Reports & Dashboard
* **Mục tiêu**: Báo cáo động, cho phép click từ KPI -> Dòng Báo cáo -> Sổ cái -> Chứng từ -> Hợp đồng. Bổ sung các trạng thái (Đã ghi sổ, Chờ duyệt) vào báo cáo.
* **File/module dự kiến**: `app/api/reports/...`, UI Components (Dashboard, DrillDownModal).
* **Rủi ro**: Performance issue khi truy xuất query phức tạp. Có thể cần caching.

## Sprint 2.5: UI/UX Kế toán (MISA-like Experience)
* **Mục tiêu**: Thiết kế lại UI thân thiện với kế toán VN. Form nhập liệu đa dòng, status chip rõ ràng, lịch sử chứng từ, export PDF.
* **File/module dự kiến**: Các trang frontend `app/(dashboard)/accounting/...`
* **Rủi ro**: Đòi hỏi nhiều công sức frontend, rủi ro vỡ layout hiện tại.

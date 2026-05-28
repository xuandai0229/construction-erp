# PHASE 2: ACCOUNTING WORKFLOW GAP REPORT

## Tổng quan
Báo cáo audit các module liên quan đến workflow kế toán, đối chiếu giữa trạng thái hiện tại của hệ thống và yêu cầu chuẩn mực của phần mềm kế toán (MISA-like workflow).

## Các Module & Đánh giá Gap

| Module | Hiện có | Thiếu gì | Rủi ro | Đề xuất |
| ------ | ------- | -------- | ------ | ------- |
| **Contract (Hợp đồng)** | Có model Contract, quản lý thông tin cơ bản | Quản lý vòng đời (Draft, Active, Completed), Phụ lục hợp đồng, Tạm ứng hợp đồng, Bảo lãnh | Không truy xuất được dòng tiền chi tiết theo hợp đồng, khó kiểm soát hạn mức thanh toán | Cập nhật schema để theo dõi chi tiết lifecycle và liên kết chặt với Invoice, Payment, Advance. |
| **Invoice (Hóa đơn)** | Tạo, Approval (Draft -> Approved), Xóa logic (Immutable) | Transition guard chặt chẽ giữa các trạng thái con (Submitted, Rejected), liên kết tới Contract/Nghiệm thu | Có thể bị thay đổi trạng thái tự do nếu thiếu Guard cứng, thiếu liên kết hợp đồng | Xây dựng State Machine cho Invoice Lifecycle, thêm trường ContractID, Nghiệm Thu ID. |
| **Payment/VendorPayment** | DRAFT, APPROVED, POSTED | Phân tách thanh toán nhà cung cấp và thanh toán khách hàng chưa rõ ràng trên UI/Workflow. Trạng thái Submitted/Rejected chưa được handle chuẩn | Nhầm lẫn giữa dòng tiền vào/ra nếu không map đúng đối tượng. | Tách biệt workflow AR Receipt và AP Payment, thêm đối tượng thanh toán rõ ràng, strict lifecycle guard. |
| **Cost (Chi phí)** | DRAFT, APPROVED, POSTED, có liên kết WBS | Vòng đời tạm ứng, hoàn ứng. Đối trừ tạm ứng với chi phí thực tế. | Chi phí có thể không phản ánh đúng dòng tiền ra nếu có tạm ứng trước. | Bổ sung Advance Request cho Cost, tính toán đối trừ tự động. |
| **Revenue (Doanh thu)** | Theo dõi theo Invoice | Workflow riêng cho nghiệm thu chưa xuất hóa đơn (Unbilled Revenue). | Khó ghi nhận doanh thu theo tiến độ nếu chờ hóa đơn. | Thêm trạng thái Accrued/Unbilled, liên kết với chứng từ Nghiệm thu khối lượng. |
| **Debt (Công nợ)** | Lấy trực tiếp từ Ledger (AR/AP) | Aging Report, Quản lý công nợ theo hợp đồng, Khấu trừ bảo hành, Quản lý công nợ tạm ứng | Rủi ro tranh chấp công nợ do thiếu chi tiết theo hạn thanh toán/hợp đồng. | Xây dựng module Debt Settlement, Aging calculation engine. |
| **Advance (Tạm ứng)** | Có field `advanceAmount` rải rác | Toàn bộ vòng đời Tạm ứng -> Thanh toán -> Hoàn ứng -> Đối trừ | Tiền ra khỏi quỹ nhưng không biết đích xác đang ở đâu, trạng thái nào. | Xây dựng AdvanceRequest model riêng biệt. |
| **Settlement/Offset** | Chưa có chuyên biệt | Đối trừ công nợ (Bù trừ phải thu - phải trả, bù trừ tạm ứng) | Kế toán phải làm thủ công qua General Journal. | Tạo module Settlement cho phép chọn nhiều chứng từ để đối trừ. |
| **Ledger (Sổ cái)** | Chuẩn xác, Immutable, Reversal | Tự động sinh bút toán đối trừ, ghi nhận thuế VAT, giữ lại bảo hành tự động | Mất thời gian thao tác thủ công, dễ sai sót. | Nâng cấp Posting Engine hỗ trợ đa dạng template (Advance, Offset). |
| **Report/Dashboard** | Dashboard cơ bản (Ledger source) | Drill-down từ Báo cáo tổng hợp -> Sổ cái -> Chứng từ gốc -> Hợp đồng | Kế toán khó kiểm tra chéo số liệu. | Xây dựng API Drill-down, cập nhật UI cho phép click vào các con số báo cáo. |
| **Export/Print** | CSV xuất cơ bản | In phiếu thu/chi, In chứng từ kế toán chuẩn Form | Kế toán phải chép tay ra Excel để in. | Tích hợp PDF generator chuẩn form kế toán Việt Nam. |
| **UI Forms** | CRUD cơ bản | UI Kế toán (Status Timeline, Approval Modal, Readonly Mode cho Posted) | Sai sót do nhập liệu nhầm, thiếu thông tin Audit trên UI | Tái thiết kế UI form chuyên biệt cho kế toán, hiển thị Audit Trail rõ ràng. |

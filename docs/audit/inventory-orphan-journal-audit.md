# BÁO CÁO AUDIT BÚT TOÁN KHO MỒ CÔI (INVENTORY ORPHAN JOURNAL AUDIT)
**Ngày kiểm toán**: 2026-05-29T08:11:30.742Z
**Môi trường**: development
**Người thực hiện**: Hệ thống Kế toán trưởng ERP tự động

---

## I. TỔNG QUAN HỆ THỐNG
*   **Tổng số bút toán kho quét được**: 0
*   **Số lượng bút toán mồ côi (Orphaned)**: 0
*   **Số lượng bút toán test hoạt động (Active Test Fixtures)**: 0

---

## II. DANH SÁCH BÚT TOÁN MỒ CÔI PHÁT HIỆN
Dưới đây là danh sách chi tiết các bút toán kho không liên kết với bất kỳ dự án hiện hành nào (có thể do dự án đã bị xóa sau khi chạy test):

*Không phát hiện bút toán mồ côi nào.*

---

## III. TUYÊN BỐ TUÂN THỦ LEVEL 3 ACCOUNTING
*   **Không Hard Delete**: Hệ thống tuân thủ nghiêm ngặt chuẩn mực kế toán Việt Nam và quy định ERP Level 3. Không có bất kỳ dòng dữ liệu nào bị xóa vật lý khỏi cơ sở dữ liệu.
*   **Soft Delete Audit Trail**: Các bút toán thử nghiệm mồ côi được đánh dấu `deletedAt` để ẩn khỏi báo cáo tài chính nhưng giữ nguyên toàn bộ lịch sử trong database phục vụ thanh tra thuế.

# BẢN GHI BACKLOG GIAO DIỆN PHỤ (PHASE 3D - UI BACKLOG)

> [!NOTE]
> Bản ghi chép các hạng mục giao diện phụ hoặc có rủi ro nghiệp vụ cao được tạm hoãn trong đợt quét đồng bộ Phase 3D để đảm bảo tính an toàn hệ thống và an tâm nghiệp vụ của phòng tài chính.

---

## 1. Chi tiết Hạng mục Trì hoãn & Phân tích Rủi ro

### Hạng mục 1: Chuyển đổi lưới dòng tiền sang `EnterpriseDataTable` V3
- **File liên quan**: `app/cash-bank/page.tsx`
- **Tóm tắt vấn đề**: Lưới giao dịch dòng tiền (Cash payments/receipts grid) hiện tại đang sử dụng thẻ `<table>` thô kết hợp với các logic ghi dữ liệu trực tiếp trên ô (inline edits), chọn nhanh tài khoản đối ứng và đối chiếu số dư tức thời.
- **Rủi ro hồi quy**: **CAO**. Trực tiếp đụng chạm đến logic thay đổi state dòng tiền nhạy cảm. Việc quy đổi sang V3 có thể phá vỡ tính năng hạch toán nhanh của kiểm soát viên.
- **Đề xuất xử lý**: Đưa vào một Sprint riêng biệt sau khi hệ thống chính thức Go-Live và có sẵn bộ kiểm thử hồi quy tự động cho dòng tiền.

---

## 2. Kế hoạch triển khai sau Go-Live

| Độ ưu tiên | Mô tả giao diện | File ảnh hưởng | Hạn hoàn thành dự kiến |
| :--- | :--- | :--- | :--- |
| **Medium** | Hiện đại hóa lưới hạch toán dòng tiền (V3 table) | `app/cash-bank/page.tsx` | Sprint 4.1 |
| **Low** | Quy hoạch các form in ấn A4 sang font hệ thống | `app/print/*` | Sprint 4.2 |

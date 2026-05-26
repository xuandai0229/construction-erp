# BÁO CÁO ĐỐI SOÁT PHÁP Y (RECONCILIATION FORENSIC REPORT)
**Giai đoạn:** Phase 1C - Reconciliation Engine
**Đánh giá:** Khoảng trống (Gaps) giữa Số liệu Vận Hành (Operational) và Số liệu Sổ Cái (Ledger).

---

## 1. KHẢO SÁT HIỆN TRẠNG (RECONCILIATION GAPS)

Hệ thống hiện tại chạy song song 2 luồng dữ liệu độc lập sau khi `PostingEngine` ghi nhận bút toán. Do thiếu ràng buộc hai chiều (Bi-directional enforcement), hệ thống đã nảy sinh các chênh lệch nghiêm trọng:

### Gap 1: Lệch Công nợ Phải thu (AR Drift)
- **Operational Data:** Tổng `Invoice.remainingAmount` (Chưa thu).
- **Ledger Data:** Số dư Nợ tài khoản `1310`.
- **Nguyên nhân lệch:** 
  1. Nếu Kế toán tự tạo 1 Journal Entry thủ công (Adjusting Entry) gõ trực tiếp vào mã `1310` để điều chỉnh tỷ giá hoặc cấn trừ công nợ, `Invoice.remainingAmount` không được cập nhật. Số dư 1310 sẽ khác với tổng Invoice.
  2. Bút toán đảo (ReverseJournal) đảo ngược TK 1310, nhưng KHÔNG phục hồi trạng thái `status='UNPAID'` hoặc số tiền `remainingAmount` của Invoice tương ứng.

### Gap 2: Lệch Lợi Nhuận (Profit Drift)
- **Operational Data (Dashboard):** Gross Profit = `SUM(Invoice.amount) - SUM(CostRecord.amount)`.
- **Ledger Data:** `SUM(5110) - SUM(62x)`.
- **Nguyên nhân lệch:** `PostingEngine` chỉ đẩy vào Sổ cái khi có hành động Post. Một số `CostRecord` ở trạng thái DRAFT vẫn được đưa vào Dashboard nếu thiếu điều kiện Lọc chặt, hoặc ngược lại, đã bị đảo (Reverse) nhưng vẫn nằm trong Aggregate của Node.js.

### Gap 3: Lệch VAT Đầu Ra/Đầu Vào
- **Operational Data:** Tab VAT Summary chỉ hiển thị các `CostRecord` có `vatAmount > 0`.
- **Ledger Data:** Chưa có cơ chế Mapping tự động đẩy Thuế Đầu vào lên `1331`. Hiện tại `PostingEngine.postCost` chỉ ghi nhận toàn bộ vào `62x` và `3310`, **HOÀN TOÀN BỎ QUÊN VAT ĐẦU VÀO**. Thuế đang bị cộng gộp vào Chi phí -> Lệch chuẩn Kế toán (Chi phí bị vống lên ảo).

---

## 2. GIẢI PHÁP RECONCILIATION ENGINE (PHASE 1C)

Trong đợt code sắp tới, BẮT BUỘC triển khai **Warning Engine** chạy đối soát (Reconciliation Check):

1. **AR Check:** `SUM(Invoice.remainingAmount) === Balance(1310)`. Nếu False -> Hiện Badge Đỏ cảnh báo CFO.
2. **AP Check:** `SUM(CostRecord.netAmount [ unpaid ]) === Balance(3310)`. 
3. **Reversal Sync:** Cập nhật lại PostingEngine: Khi hàm `reverseJournal()` được gọi, nó phải tìm `sourceType` và `sourceId` để đánh cờ `isReversed=true` hoặc `status=CANCELED` vào bảng Operational gốc, nhằm cấm Dashboard tổng hợp những dòng rác này.

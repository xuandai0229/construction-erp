# BÁO CÁO ÁNH XẠ TÀI KHOẢN (FINANCIAL ACCOUNT MAPPING)
**Giai đoạn:** Phase 1A - Ledger Truth Foundation
**Mục tiêu:** Thiết lập bản đồ Mapping chuẩn xác giữa Hệ thống Vận hành (Operational) và Hệ thống Sổ Cái (Ledger) theo chuẩn Kế toán Xây dựng.

---

## 1. MAPPING DOANH THU & PHẢI THU (REVENUE & AR)
**Nguồn Vận Hành:** Bảng `Invoice` (Hóa đơn xuất cho Chủ đầu tư).
- **1310 (Phải thu khách hàng):** Ghi Nợ (Debit) khi phát hành Hóa đơn. Ghi Có (Credit) khi nhận Thanh toán (`Payment`).
- **1368 (Phải thu khác - Retention):** Ghi Nợ (Debit) phần tiền bảo hành công trình giữ lại.
- **5110 (Doanh thu xây lắp):** Ghi Có (Credit) giá trị trước thuế (Net Amount).
- **33311 (Thuế GTGT đầu ra):** Ghi Có (Credit) tiền thuế VAT.

*Dashboard KPI Target:* `Gross Revenue` PHẢI tổng hợp từ phát sinh Có TK `5110`. Khóa hoàn toàn việc sum từ `Invoice.amount`.

---

## 2. MAPPING CHI PHÍ & PHẢI TRẢ (COSTS & AP)
**Nguồn Vận Hành:** Bảng `CostRecord` (Chi phí thi công), `PurchaseOrder`, `GoodsReceipt`.
- **6210 (Chi phí Nguyên vật liệu trực tiếp):** Ghi Nợ (Debit) khi nhập kho (`CostType.material`).
- **6220 (Chi phí Nhân công trực tiếp):** Ghi Nợ (Debit) từ chấm công/giao khoán (`CostType.labor`).
- **6230 (Chi phí Sử dụng máy thi công):** Ghi Nợ (Debit) từ thiết bị (`CostType.machine`).
- **6270 (Chi phí Sản xuất chung):** Ghi Nợ (Debit) từ các chi phí khác (`CostType.overhead / subcontract`).
- **3310 (Phải trả người bán):** Ghi Có (Credit) khi ghi nhận chi phí.
- **3311 (GRNI - Hàng về chưa hóa đơn):** Ghi Có tạm thời khi nhập kho (Goods Receipt) chưa có hóa đơn.

*Dashboard KPI Target:* `Total Cost` PHẢI tổng hợp từ phát sinh Nợ các TK `6210, 6220, 6230, 6270`. Không được tính từ `CostRecord.aggregate` nữa.

---

## 3. MAPPING DÒNG TIỀN (CASHFLOW)
**Nguồn Vận Hành:** Bảng `Payment`, `VendorPayment`.
- **1010 (Tiền mặt) / 1020 (Tiền gửi ngân hàng):** 
  - Ghi Nợ (Cash In) khi Chủ đầu tư thanh toán (`Payment`).
  - Ghi Có (Cash Out) khi thanh toán cho Nhà cung cấp (`VendorPayment`).

*Dashboard KPI Target:* `Total Cash In / Out` PHẢI đối chiếu với phát sinh Nợ/Có TK `1010` và `1020`.

---

## 4. BÚT TOÁN KẾT CHUYỂN CUỐI KỲ (CLOSING JOURNALS)
*(Hiện tại đang thiếu hoàn toàn trong PostingEngine)*
- **911 (Xác định kết quả kinh doanh):** Cần kết chuyển 5110 sang 911 (Nợ 5110 / Có 911), và 62x sang 911 (Nợ 911 / Có 62x).
- **421 (Lợi nhuận chưa phân phối):** Kết chuyển số dư 911 sang 421. 

*Hành động bắt buộc:* Phải bổ sung Job đóng kỳ để ngừng trò "Fly-calculation" lợi nhuận tại Sổ Cái.

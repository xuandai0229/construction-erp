# AUDIT HỆ THỐNG THUẾ GTGT & HÓA ĐƠN VAT - CONSTRUCTION ERP
## ĐÁNH GIÁ KHOẢNG CÁCH (GAP ANALYSIS) VỚI TIÊU CHUẨN KẾ TOÁN MISA

> [!NOTE]
> Tài liệu này thực hiện phân tích hiện trạng hệ thống Construction ERP so với chuẩn nghiệp vụ Thuế & Hóa đơn GTGT của phần mềm kế toán MISA và Thông tư 200/BTC.

---

### I. HIỆN TRẠNG HỆ THỐNG HIỆN TẠI (AS-IS STATE)

Hiện tại, hệ thống Construction ERP đã hoàn thành Phân hệ Quỹ & Ngân hàng (Sprint 3.1) và có các trường thông tin cơ bản liên quan đến hóa đơn và VAT trong 2 bảng dữ liệu chính:

1. **Bảng `Invoice` (Hóa đơn bán ra):**
   * Có `amount` (tổng cộng), `netAmount` (tiền trước thuế), `vatAmount` (tiền thuế), `vatRate` (thuế suất).
   * Có `invoiceNumber` (Số hóa đơn), `issuedDate` (Ngày hóa đơn).
   * Có liên kết `projectId`, `wbsId`, `contractId`.
   * **Trạng thái**: `InvoiceStatus` mới dừng lại ở `[DRAFT, SENT, PARTIAL, PAID, OVERDUE]` (dạng quản lý công nợ bán hàng) chứ chưa phải trạng thái hóa đơn thuế.

2. **Bảng `CostRecord` (Hóa đơn mua vào/Chi phí):**
   * Có `amount`, `netAmount`, `vatAmount`, `vatRate`.
   * Có trường `supplier` dạng string thô.
   * Chưa có: Số hóa đơn mua vào, ngày hóa đơn mua vào, ký hiệu hóa đơn mua vào.

3. **Hệ thống định khoản (Double-Entry Ledger):**
   * Đã có hệ thống tài khoản kế toán kép (LedgerAccount).
   * Đã có các tài khoản chi tiết `131` (Phải thu), `331` (Phải trả), `511` (Doanh thu), các tài khoản chi phí đầu vào xây dựng `621`, `622`, `627`, `642`.
   * Đã có tài khoản thuế GTGT đầu ra `33311` (Thuế GTGT đầu ra phải nộp) và thuế GTGT đầu vào được khấu trừ `1331`/`1332`.

---

### II. KHOẢNG CÁCH SO VỚI TIÊU CHUẨN MISA (GAP MATRIX)

Để đạt mức dùng nội bộ thay thế Excel/MISA 100% trong doanh nghiệp xây dựng Việt Nam, hệ thống còn thiếu các khoảng trống nghiệp vụ sau:

| STT | Nghiệp vụ MISA / VAS | Hiện trạng ERP hiện tại | Khoảng cách & Rủi ro Thuế (GAP) | Đề xuất Nâng cấp |
|:---|:---|:---|:---|:---|
| **1** | **Thông tin Hóa đơn VAT** | Chỉ có `invoiceNumber` và `issuedDate` trên Invoice bán ra. | * Thiếu Mẫu số (Template Symbol - ví dụ: 1C26TBB).<br>* Thiếu Ký hiệu (Series - ví dụ: C26TBB).<br>* Thiếu Mã số thuế (MST) của Khách hàng/Nhà cung cấp.<br>* Thiếu Địa chỉ thuế của đối tác. | Bổ sung các trường thông tin Thuế tiêu chuẩn thông qua bảng đăng ký hóa đơn chuyên dụng `TaxInvoice`. |
| **2** | **Vòng đời Hóa đơn VAT** | Chỉ có trạng thái thanh toán công nợ (`SENT`, `PAID`...). | * Thiếu trạng thái hóa đơn thuế: Phát hành (`ISSUED`), Ghi sổ (`POSTED`), Điều chỉnh (`ADJUSTED`), Thay thế (`REPLACED`), Hủy (`CANCELLED`).<br>* Rủi ro sửa/xóa hóa đơn đã phát hành gây sai lệch tờ khai thuế. | Thiết lập bộ máy trạng thái (Lifecycle State Machine) cho Hóa đơn Thuế, cấm sửa/xóa khi đã `ISSUED` hoặc `POSTED`. |
| **3** | **Thuế đầu vào (Cost/AP)** | CostRecord chỉ có số tiền VAT và thuế suất, nhập tay thô. | * Không có số hóa đơn đầu vào để lập bảng kê mua vào.<br>* Không có ngày hóa đơn đầu vào để xác định kỳ khấu trừ.<br>* Không phân tách rõ chi phí được khấu trừ và không được khấu trừ. | Tích hợp đăng ký Hóa đơn đầu vào mua vào (`INBOUND TaxInvoice`) gắn liền với `CostRecord`. |
| **4** | **Bút toán tự động (Auto-Posting)** | Sinh bút toán thủ công hoặc bán tự động chưa tách riêng thuế. | * Bán hàng có VAT: Chưa tự động hạch toán tách biệt thuế GTGT đầu ra (Có 33311) khi ghi sổ hóa đơn.<br>* Mua hàng có VAT: Chưa tự động hạch toán tách biệt thuế GTGT đầu vào được khấu trừ (Nợ 1331) khi ghi sổ chi phí. | Triển khai công cụ `TaxPostingEngine` tự động tách dòng doanh thu (511) và thuế đầu ra (33311) cho bán ra; chi phí và thuế đầu vào (1331) cho mua vào. |
| **5** | **Báo cáo thuế & Đối chiếu** | Chưa có bất kỳ báo cáo thuế nào. | * Không lập được Bảng kê Hóa đơn Bán ra (Mẫu 01-1/GTGT).<br>* Không lập được Bảng kê Hóa đơn Mua vào (Mẫu 01-2/GTGT).<br>* Không có Tờ khai VAT 01/GTGT nội bộ.<br>* Rủi ro chênh lệch số liệu giữa sổ cái tài khoản thuế (1331/33311) và hóa đơn gốc. | Xây dựng phân hệ báo cáo Thuế, tự động đối chiếu (Reconciliation) khớp sổ sách 100% trước khi kết chuyển kỳ thuế. |

---

### III. RỦI RO KẾ TOÁN VÀ THUẾ NẾU KHÔNG CÓ PHÂN HỆ VAT GTGT

1. **Rủi ro Thuế khi thanh tra**: Cơ quan thuế Việt Nam luôn đối chiếu ba luồng: **Sổ cái tài khoản 133/3331** ↔ **Báo cáo thuế đầu ra/đầu vào** ↔ **Hóa đơn gốc**. Nếu không có phân hệ quản lý và đối chiếu, việc nhập tay sẽ dẫn tới lệch số lẻ, lệch ngày kỳ thuế (ví dụ: ngày hóa đơn tháng 5 nhưng ghi sổ sổ cái tháng 6), dẫn tới bị loại thuế khấu trừ hoặc phạt chậm nộp thuế đầu ra.
2. **Rủi ro sửa đổi hồi tố (Backdating/Retroactive edit)**: Doanh nghiệp xây dựng có thể vô tình sửa đổi hóa đơn cũ đã kê khai thuế. Hệ thống ERP bắt buộc phải có tính năng **Khóa kỳ thuế (Tax Period Lock)** để bảo vệ tính toàn vẹn của dữ liệu đã nộp báo cáo.
3. **Rủi ro hóa đơn trùng**: Một hóa đơn mua vào của nhà cung cấp có thể bị nhập trùng 2 lần trên 2 CostRecord khác nhau nếu không kiểm soát duy nhất theo cặp (Nhà cung cấp - Số hóa đơn - Ký hiệu).

---

### V. GIẢI PHÁP ĐỀ XUẤT NÂNG CẤP (TO-BE SYSTEM ARCHITECTURE)

Tôi đề xuất xây dựng một Phân hệ Thuế tích hợp chuyên sâu, thiết kế tương đồng MISA nhưng tối giản hóa để phù hợp nội bộ công ty xây dựng:

1. **Thêm mô hình bảng `TaxInvoice`**: Lưu trữ hồ sơ thuế độc lập liên kết chặt chẽ với `Invoice` (bán ra) và `CostRecord` (mua vào). Điều này giúp bảo vệ mã nguồn cũ không bị ảnh hưởng, giữ nguyên tính ổn định của hệ thống lõi.
2. **Tax Registry (Sổ hóa đơn VAT)**: Làm trung tâm tra cứu cho cả 2 luồng bán ra và mua vào.
3. **Báo cáo Thuế động**: Sinh Bảng kê hóa đơn mua vào/bán ra, tự động tính thuế GTGT phải nộp/được khấu trừ chuyển kỳ tiếp theo.
4. **Đối chiếu Tự động (Tax Reconciliation Engine)**: Quét sổ cái và hóa đơn để tìm ra các bút toán mồ côi hoặc sai lệch số tiền.

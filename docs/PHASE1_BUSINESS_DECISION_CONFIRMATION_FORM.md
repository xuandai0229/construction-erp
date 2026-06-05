# PHIẾU XÁC NHẬN 7 QUYẾT ĐỊNH NGHIỆP VỤ GIAI ĐOẠN 1

Phiếu này dùng để người dùng/kế toán/chủ hệ thống xác nhận 7 quyết định nghiệp vụ trước khi tạo Excel template nháp.

Xác nhận phạm vi:

* Chưa tạo Excel.
* Chưa import dữ liệu.
* Chưa seed dữ liệu.
* Chưa viết import script.
* Chưa sửa schema/UI/code nghiệp vụ.
* Nếu chưa tick/chọn đầy đủ, không được coi là template cuối.
* Excel nháp chỉ được tạo sau khi form này được review hoặc chấp nhận tạo với cảnh báo.

> **Lưu ý quan trọng:** Việc xác nhận phiếu này chỉ cho phép tạo Excel template nháp để review. Phiếu này không cho phép import dữ liệu thật, không cho phép seed dữ liệu, không cho phép ghi dữ liệu vào database.

## Hướng dẫn xác nhận

* Mỗi quyết định chỉ chọn một phương án chính.
* Nếu chọn phương án khác đề xuất, ghi rõ lý do ở cột `Ghi chú`.
* Nếu chưa chắc, để nguyên `CHƯA XÁC NHẬN`.
* Nếu chọn “cần sửa schema trước”, không tạo Excel nháp cho tới khi schema được chốt.
* Nếu đồng ý tạo Excel nháp có cảnh báo, Excel đó chỉ dùng để review cấu trúc, chưa dùng import thật.

## Bảng xác nhận 7 quyết định

| STT | Quyết định cần chốt | Phương án A | Phương án B | Phương án C nếu có | Phương án đề xuất cho GĐ1 | Người xác nhận | Kết luận cuối | Ngày xác nhận | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `MaDuAn` / mã công trình | [ ] Phương án A: Thêm `Project.code` unique vào schema sau này, dùng `MaDuAn` làm mã công trình chính thức. | [x] Phương án B: Không sửa schema ngay, dùng `MaDuAn` làm khóa nội bộ trong Excel nháp, chưa import trực tiếp vào DB. | - | Phương án B cho Excel nháp; phương án A là hướng dài hạn khuyến nghị. | Chủ hệ thống / người phụ trách ERP | TẠM CHỐT GĐ1 |  | Cho phép tạo Excel nháp. `MaDuAn` chỉ dùng làm khóa nội bộ trong Excel, chưa import trực tiếp vào DB. Về dài hạn nên bổ sung `Project.code`. |
| 2 | Chủ đầu tư / khách hàng | [x] Phương án A: Tạm dùng `Project.investor` dạng text cho chủ đầu tư. | [ ] Phương án B: Tạo model riêng `Customer` hoặc `BusinessPartner` sau này. | [ ] Phương án C: Mở rộng `Supplier` thành đối tác có loại `SUPPLIER/CUSTOMER/INVESTOR`. | Phương án A cho Excel nháp; B/C là hướng dài hạn. | Chủ hệ thống / kế toán | TẠM CHỐT GĐ1 |  | GĐ1 dùng text để test nhanh. Chưa coi đây là module khách hàng/công nợ phải thu chuẩn. |
| 3 | Vật tư: `MaterialItem` hay `Material` | [x] Phương án A: Dùng `MaterialItem` cho Excel GĐ1. | [ ] Phương án B: Dùng `Material` legacy. | - | Chọn `MaterialItem`, không dùng `Material` legacy. | Chủ hệ thống / kế toán kho | TẠM CHỐT GĐ1 |  | GĐ1 dùng module vật tư/kho mới, không dùng legacy. |
| 4 | Kỳ kế toán: `FiscalYear + AccountingPeriod` hay `FiscalPeriod` | [x] Phương án A: Dùng `FiscalYear + AccountingPeriod` làm nguồn kỳ kế toán chính. | [ ] Phương án B: Dùng `FiscalPeriod` legacy. | [ ] Phương án C: Dùng song song cả hai. | Chọn `FiscalYear + AccountingPeriod`, không nhập `FiscalPeriod` song song. | Chủ hệ thống / kế toán trưởng | TẠM CHỐT GĐ1 |  | Không dùng song song hai nguồn kỳ để tránh lệch trạng thái mở/khóa kỳ. |
| 5 | Nguồn doanh thu | [x] Phương án A: Không import `Revenue` riêng; doanh thu lấy từ `Invoice/TaxInvoice` và posting/ledger. | [ ] Phương án B: Import `Revenue` riêng. | [ ] Phương án C: Chỉ dùng `JournalEntry` thủ công để ghi doanh thu. | Chọn phương án A. | Chủ hệ thống / kế toán doanh thu | TẠM CHỐT GĐ1 |  | Tránh trùng doanh thu giữa `Revenue`, `Invoice`, `TaxInvoice`, `JournalEntry`. |
| 6 | Nguồn chi phí | [x] Phương án A: `CostRecord` cho chi phí trực tiếp; `InventoryDocument` cho vật tư/kho; `CashBankDocument` cho thu/chi quỹ/ngân hàng; `JournalEntry` chỉ điều chỉnh/số dư. | [ ] Phương án B: Nhập mọi chi phí qua `JournalEntry`. | [ ] Phương án C: Nhập chi phí trùng ở nhiều nguồn rồi đối chiếu sau. | Chọn phương án A. | Chủ hệ thống / kế toán chi phí | TẠM CHỐT GĐ1 |  | Mỗi loại chi phí đi theo đúng nguồn chứng từ, không nhập trùng. |
| 7 | Bút toán thủ công | [x] Phương án A: Chỉ dùng cho số dư đầu kỳ/điều chỉnh/phát sinh không có chứng từ nguồn. | [ ] Phương án B: Cho phép nhập mọi phát sinh qua bút toán thủ công. | [ ] Phương án C: Không dùng bút toán thủ công trong GĐ1. | Chọn phương án A. | Chủ hệ thống / kế toán tổng hợp | TẠM CHỐT GĐ1 |  | Không dùng bút toán tay thay cho hóa đơn, thanh toán, kho, chi phí đã có chứng từ nguồn. |

## Checklist trước khi tạo Excel nháp

| Nội dung xác nhận | Có/Không | Người xác nhận | Ngày xác nhận | Ghi chú |
| --- | --- | --- | --- | --- |
| Đã xác nhận `MaDuAn` chưa? | Có | Chủ hệ thống / người phụ trách ERP |  | Dùng tạm làm khóa nội bộ Excel, chưa import trực tiếp. |
| Đã xác nhận chủ đầu tư/khách hàng chưa? | Có | Chủ hệ thống / kế toán |  | GĐ1 dùng `Project.investor` dạng text. |
| Đã xác nhận dùng `MaterialItem` chưa? | Có | Chủ hệ thống / kế toán kho |  | Dùng `MaterialItem`, không dùng `Material` legacy. |
| Đã xác nhận nguồn kỳ kế toán chính chưa? | Có | Chủ hệ thống / kế toán trưởng |  | Dùng `FiscalYear + AccountingPeriod`. |
| Đã xác nhận không import `Revenue` riêng mặc định chưa? | Có | Chủ hệ thống / kế toán doanh thu |  | Doanh thu lấy từ hóa đơn/posting/ledger. |
| Đã xác nhận nguồn chi phí chính chưa? | Có | Chủ hệ thống / kế toán chi phí |  | Tách nguồn theo `CostRecord`, `InventoryDocument`, `CashBankDocument`, `JournalEntry` điều chỉnh. |
| Đã xác nhận giới hạn bút toán thủ công chưa? | Có | Chủ hệ thống / kế toán tổng hợp |  | Chỉ số dư đầu kỳ/điều chỉnh/phát sinh không có chứng từ nguồn. |
| Có chấp nhận tạo Excel nháp với các cột cảnh báo/chờ xác nhận không? | Có | Chủ hệ thống |  | Excel chỉ dùng review cấu trúc, chưa import thật. |
| Có yêu cầu xử lý `Project.code` trước khi tạo Excel không? | Không | Chủ hệ thống |  | Chưa xử lý trước Excel nháp. Sẽ xem xét trước template cuối/import thật. |
| Có yêu cầu tạo `Customer/BusinessPartner` trước khi tạo Excel không? | Không | Chủ hệ thống |  | Chưa xử lý trước Excel nháp. Sẽ xem xét sau khi review template. |

## Xác nhận của người dùng/kế toán

* Người xác nhận: Chủ hệ thống / người phụ trách ERP
* Vai trò: Đại diện nghiệp vụ tạm chốt GĐ1
* Ngày xác nhận:
* Kết luận:
  * Cho phép tạo Excel nháp có cảnh báo: Có
  * Yêu cầu sửa schema trước Excel nháp: Không
  * Yêu cầu dừng để họp/chốt thêm: Không
* Ghi chú:
  * Đây là xác nhận tạm thời để tạo Excel template nháp phục vụ review cấu trúc.
  * Không cho phép import dữ liệu thật.
  * Không cho phép seed dữ liệu.
  * Không cho phép ghi dữ liệu vào database.
  * Trước template cuối/import thật, cần xem xét lại `Project.code` và mô hình khách hàng/chủ đầu tư.

## Kết luận tổng sau khi review form

* [x] Cho phép tạo Excel nháp có cảnh báo
* [ ] Chưa cho tạo Excel, cần sửa schema trước
* [ ] Chưa cho tạo Excel, cần họp/chốt thêm
* [ ] Chưa cho tạo Excel, cần kế toán bổ sung thông tin
* [x] Chỉ cho phép tạo Excel để review cấu trúc, không được import

* Người kết luận: Chủ hệ thống / người phụ trách ERP
* Vai trò: Đại diện nghiệp vụ tạm chốt GĐ1
* Ngày kết luận:
* Ghi chú:
  * Cho phép bước tiếp theo là cập nhật mapping GĐ1 theo quyết định tạm và tạo Excel template nháp có cảnh báo.
  * Excel nháp chỉ dùng để review, chưa dùng để import dữ liệu thật.

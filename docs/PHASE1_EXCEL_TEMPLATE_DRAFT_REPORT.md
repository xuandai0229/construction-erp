# PHASE 1 EXCEL TEMPLATE DRAFT REPORT

## 1. Thông tin tạo file

* Thời gian tạo: `2026-06-05 14:01:43 +07:00`.
* File Excel đã tạo: `templates/PHASE1_ERP_IMPORT_TEMPLATE_DRAFT_REVIEW.xlsx`.
* Mục đích: Excel template nháp GĐ1 để review cấu trúc và chuẩn bị dữ liệu, không dùng import thật.

## 2. Nguồn dùng để tạo Excel

1. `docs/PHASE1_EXCEL_FINAL_MAPPING_DRAFT.md` - nguồn mapping chính.
2. `docs/PHASE1_BUSINESS_DECISION_LOG.md` - nguồn decision/mapping review.
3. `docs/PHASE1_BUSINESS_DECISION_CONFIRMATION_FORM.md` - nguồn xác nhận tạm GĐ1.
4. `docs/REAL_DATA_REQUIRED_INPUT_MAP.md` - chỉ dùng bối cảnh tổng, bỏ qua nếu mâu thuẫn.

## 3. Sheet đã tạo

* Tổng số sheet: **27**.
* Sheet hướng dẫn/quản trị: **6** - `README_HuongDan`, `DECISION_LOG`, `MAPPING_STATUS`, `IMPORT_ORDER`, `ENUM_DROPDOWN`, `RISK_CHECKLIST`.
* Sheet dữ liệu GĐ1: **21** - `DM_CongTy`, `DM_ChiNhanh`, `DM_NguoiDung`, `DM_TaiKhoanKeToan`, `DM_KyKeToan`, `DM_NhaCungCap_KhachHang`, `DM_CongTrinh`, `DM_WBS`, `DM_DuToan`, `DM_HopDong`, `GD_HoaDon`, `GD_HoaDonThue`, `GD_ThanhToan`, `GD_PhieuThuChi`, `GD_ChiPhi`, `GD_TamUng`, `GD_HoanUng`, `DM_VatTu`, `DM_Kho`, `GD_Kho_NhapXuat`, `GD_ButToan_ThuCong`.

## 4. Thống kê mapping

* Cột có trạng thái cuối `CHẮC CHẮN`: **103**.
* Cột có trạng thái cuối `CẦN XÁC NHẬN`: **23**.
* Cột `SUY LUẬN NGHIỆP VỤ`: **5**.
* Cột `CẦN MỞ RỘNG SCHEMA`: **3**.
* Tổng cột nghiệp vụ được parse từ 21 sheet: **134**.
* Dòng review trong sheet `MAPPING_STATUS`: **44**, gồm 36 điểm `CẦN XÁC NHẬN`, 5 điểm `SUY LUẬN NGHIỆP VỤ`, 3 điểm `CẦN MỞ RỘNG SCHEMA` theo Decision Log.

## 5. Format và validation

* Freeze header/hàng hướng dẫn trên sheet dữ liệu.
* Autofilter trên tất cả sheet.
* Có 50 dòng trống đã format trên mỗi sheet dữ liệu.
* Có các cột quản trị: `TrangThaiMapping`, `CoImportKhong`, `CanXacNhanKhong`, `CanMoRongSchemaKhong`, `GhiChuRuiRo`, `NguonMapping`, `HuongDanNhap`.
* Có **97** vùng data validation/dropdown trong workbook.
* Màu cảnh báo tách biệt cột bắt buộc, cần xác nhận, suy luận nghiệp vụ, cần mở rộng schema và cột quản trị.
* Không có macro, VBA hoặc import script trong workbook.

## 6. Enum/dropdown

Đã tạo danh sách: `MappingStatus`, `CoImportKhong`, `YesNo`, `AccountType`, `ProjectStatus`, `CostType`, `InvoiceStatus`, `TaxInvoiceType`, `CashBankDocumentType`, `PaymentMethod`, `AdvanceRecipientType`, `InventoryDocumentType`, `TransactionType`.

`UserRole` được liệt kê tại `ENUM_DROPDOWN` với ghi chú `CẦN XÁC NHẬN` vì Mapping Draft chỉ ghi tên enum mà không liệt kê giá trị; workbook không tự bịa dropdown này.

## 7. Cảnh báo quan trọng

* `MaDuAn` chỉ là khóa nội bộ Excel GĐ1, chưa import trực tiếp vào DB nếu chưa có `Project.code`.
* Chủ đầu tư/khách hàng dùng `Project.investor` dạng text, chưa phải customer ledger master chuẩn.
* Không có sheet import `Revenue` riêng mặc định.
* Không dùng `Material` legacy; GĐ1 dùng `MaterialItem` trong `DM_VatTu`.
* `FiscalYear + AccountingPeriod` là nguồn kỳ GĐ1; không nhập `FiscalPeriod` song song.
* `JournalEntry` thủ công chỉ dùng cho số dư đầu kỳ/điều chỉnh/phát sinh không có chứng từ nguồn.
* Cột `CẦN MỞ RỘNG SCHEMA` không được import thật nếu chưa mở schema/API.
* Workbook không chứa dữ liệu nghiệp vụ thật.

## 8. Xác nhận phạm vi

* Chưa import dữ liệu.
* Chưa seed dữ liệu.
* Chưa ghi database.
* Chưa viết import script.
* Chưa sửa schema/UI/code nghiệp vụ.
* Chưa tạo template cuối.

## 9. Kết quả kiểm tra kỹ thuật

* File `.xlsx` đã tạo, dung lượng khoảng 375 KB.
* Gói OpenXML giải nén thành công.
* Tổng XML kiểm tra: 32; XML lỗi: 0.
* Workbook khai báo đúng 27 sheet.
* 21/21 sheet dữ liệu có đủ `TrangThaiMapping`, `CoImportKhong`, `GhiChuRuiRo`.
* Có cảnh báo `MaDuAn` không import trực tiếp.
* Không có sheet `GD_DoanhThu` hoặc sheet `Material` legacy.

## 10. Bước tiếp theo

1. Người dùng/kế toán review Excel template nháp.
2. Đánh dấu cột cần sửa, cột thiếu nghiệp vụ và enum/dropdown cần đổi.
3. Cập nhật mapping GĐ1 sau review.
4. Sau khi chốt template cuối mới thiết kế dry-run validator.
5. Chỉ sau dry-run đạt mới xem xét import dữ liệu thật.

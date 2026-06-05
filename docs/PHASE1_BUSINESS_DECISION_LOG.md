# PHASE 1 BUSINESS DECISION LOG & MAPPING LOCK

Tài liệu này dùng để chốt nghiệp vụ trước khi tạo Excel template nháp cho import kế toán lõi giai đoạn 1.

Phiếu xác nhận quyết định nghiệp vụ GĐ1: [PHASE1_BUSINESS_DECISION_CONFIRMATION_FORM.md](./PHASE1_BUSINESS_DECISION_CONFIRMATION_FORM.md)

Trạng thái sau khi review form: **7 quyết định đã TẠM CHỐT GĐ1 để cho phép tạo Excel template nháp có cảnh báo**. Đây chưa phải quyết định cuối cho template cuối hoặc import dữ liệu thật.

Excel template nháp GĐ1: [PHASE1_ERP_IMPORT_TEMPLATE_DRAFT_REVIEW.xlsx](../templates/PHASE1_ERP_IMPORT_TEMPLATE_DRAFT_REVIEW.xlsx)

Báo cáo tạo Excel nháp: [PHASE1_EXCEL_TEMPLATE_DRAFT_REPORT.md](./PHASE1_EXCEL_TEMPLATE_DRAFT_REPORT.md)

Xác nhận phạm vi hiện tại:

* Chưa tạo Excel.
* Chưa import dữ liệu.
* Chưa seed dữ liệu.
* Chưa viết import script.
* Chưa sửa schema/UI/code nghiệp vụ.
* Các quyết định trong tài liệu đã được tạm chốt cho Excel nháp theo phiếu xác nhận, chưa phải quyết định cuối cho template cuối/import thật.

Nguồn đối chiếu:

* `docs/REAL_DATA_REQUIRED_INPUT_MAP.md`
* `docs/REAL_DATA_REQUIRED_INPUT_MODEL_ROUTE_INVENTORY.md`
* `docs/PHASE1_EXCEL_FINAL_MAPPING_DRAFT.md`
* `prisma/schema.prisma`
* `lib/validations.ts`
* `lib/period.ts`
* `services/project.service.ts`
* `services/wbs.service.ts`
* `services/budget.service.ts`
* `services/contract.service.ts`
* `services/revenue.service.ts`
* `services/cost.service.ts`
* `services/payment.service.ts`
* `services/cash-bank.service.ts`
* `services/tax-invoice.service.ts`
* `services/advance.service.ts`
* `services/advance-settlement.service.ts`
* `services/inventory.service.ts`
* `services/voucher.service.ts`
* `app/api/**/route.ts` liên quan 37 route nhập liệu giai đoạn 1 đã đọc sâu trong mapping draft.

## 1. Decision Log — 7 quyết định nghiệp vụ cần chốt

| STT | Quyết định cần chốt | Hiện trạng theo schema/API/service | Ảnh hưởng tới sheet nào | Rủi ro nếu không chốt | Phương án GĐ1 đề xuất | Phương án dài hạn | Có cần sửa schema không | Có ảnh hưởng import không | Người/kế toán cần xác nhận | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `MaDuAn` / mã công trình | `Project` trong `prisma/schema.prisma:71` không có field `code`; `createProjectSchema` trong `lib/validations.ts:8` nhận `name`, `description`, `status`, `ownerId`, `contractValue`, `totalBudget`, `investor`, `projectType`, `startDate`, `endDate`; route/service dự án không chứng minh mã công trình riêng. | `DM_CongTrinh`, `DM_WBS`, `DM_DuToan`, `DM_HopDong`, `GD_HoaDon`, `GD_ThanhToan`, `GD_ChiPhi`, `DM_Kho`, `GD_ButToan_ThuCong`. | Dùng `Project.name` làm khóa dễ trùng/tên đổi; sai lookup sẽ làm lệch WBS, dự toán, hợp đồng, hóa đơn, thanh toán, chi phí. | Tạm giữ `MaDuAn` trong Excel như khóa nội bộ; chưa import trực tiếp vào DB nếu schema chưa có `Project.code`; không lookup bằng tên nếu chưa xác nhận. | Nên bổ sung `Project.code` unique hoặc cơ chế mapping chính thức `MaDuAn -> Project.id`. | CÓ nếu muốn import mã công trình thật vào DB. | CÓ, đây là blocker FK lớn nhất. | Chủ dự án ERP, kế toán trưởng, người phụ trách dữ liệu công trình. | TẠM CHỐT GĐ1 |
| 2 | Chủ đầu tư / khách hàng | Không thấy model `Customer`, `Client`, `Investor`; `Project` có `investor`; `Supplier` có `code`, `name`, `description`; `createProjectSchema` bắt buộc `investor`. | `DM_NhaCungCap_KhachHang`, `DM_CongTrinh`, `DM_HopDong`, `GD_HoaDon`, `GD_HoaDonThue`, báo cáo công nợ phải thu. | `Project.investor` dạng text không đủ cho AR/customer ledger; dùng `Supplier` cho cả khách hàng và NCC sẽ lẫn loại đối tác nếu không có field phân loại. | Tạm dùng `Project.investor` cho tên chủ đầu tư dạng text; chưa coi đây là module khách hàng/công nợ phải thu chuẩn. | Tạo `Customer`/`BusinessPartner` hoặc mở rộng `Supplier` thành đối tác có loại `SUPPLIER/CUSTOMER/INVESTOR`. | CÓ nếu cần khách hàng chuẩn. | CÓ với hóa đơn đầu ra/công nợ phải thu. | Kế toán công nợ, kế toán trưởng, chủ hệ thống. | TẠM CHỐT GĐ1 |
| 3 | Vật tư: `MaterialItem` hay `Material` | Route/service kho dùng `MaterialItem`; `InventoryDocumentLine.materialItemId` relation tới `MaterialItem` trong `prisma/schema.prisma:1949`; `Material` legacy còn liên quan `InventoryTransaction`/`SiteConsumption` quanh `prisma/schema.prisma:773`. | `DM_VatTu`, `GD_Kho_NhapXuat`, các lookup kho/vật tư. | Dùng sai model sẽ không lookup được phiếu kho hoặc trùng danh mục vật tư. | Dùng `MaterialItem`; không đưa `Material` legacy vào Excel lõi. | Nếu cần, migration/ẩn model legacy hoặc viết mapping chuyển đổi chính thức từ `Material` sang `MaterialItem`. | KHÔNG cho GĐ1 nếu dùng `MaterialItem`; CÓ nếu muốn dọn legacy. | CÓ với toàn bộ chứng từ kho. | Kế toán kho, quản lý vật tư, kỹ thuật phụ trách dữ liệu. | TẠM CHỐT GĐ1 |
| 4 | Kỳ kế toán: `AccountingPeriod` hay `FiscalPeriod` | Có `FiscalYear`/`AccountingPeriod` tại `prisma/schema.prisma:1529` và `1548`; có `FiscalPeriod` tại `prisma/schema.prisma:715`; `lib/period.ts` gọi `AccountingGovernance.assertPeriodIsOpen`; nhiều service dùng `assertPeriodNotLocked`. | `DM_KyKeToan`, `GD_HoaDon`, `GD_ThanhToan`, `GD_PhieuThuChi`, `GD_ChiPhi`, `GD_Kho_NhapXuat`, `GD_ButToan_ThuCong`. | Song song hai nguồn kỳ có thể làm chứng từ bị khóa/mở không nhất quán; báo cáo period bị lệch. | Chọn `FiscalYear + AccountingPeriod` làm nguồn kỳ chính; không import song song `FiscalPeriod` trong Excel GĐ1. | Dọn legacy hoặc đồng bộ toàn bộ cơ chế kiểm tra kỳ về một nguồn chính. | KHÔNG bắt buộc cho Excel nháp; CÓ nếu muốn dọn kiến trúc kỳ. | CÓ, vì API/service kiểm tra kỳ trước khi ghi nhận/post. | Kế toán trưởng, kế toán tổng hợp, chủ hệ thống. | TẠM CHỐT GĐ1 |
| 5 | Nguồn doanh thu | Có `Invoice`, `TaxInvoice`, `Revenue`, `JournalEntry`; `/api/revenues` tồn tại; `services/revenue.service.ts:198` ghi chú `Revenue` là legacy/operational, báo cáo tài chính chính thức dùng ledger posted; `TaxInvoiceService` có post bút toán. | `GD_HoaDon`, `GD_HoaDonThue`, không đưa `GD_DoanhThu` vào GĐ1 mặc định, `GD_ButToan_ThuCong` nếu điều chỉnh. | Import song song `Revenue` và `Invoice/TaxInvoice/JournalEntry` sẽ trùng doanh thu, sai P&L/dashboard. | Không import `Revenue` riêng mặc định; doanh thu lấy từ `Invoice`/`TaxInvoice` và bút toán đã post hoặc điều chỉnh có kiểm soát. | Chốt một nguồn doanh thu chính cho dashboard/report và khóa rule chống trùng. | KHÔNG cho GĐ1 nếu không dùng `Revenue`; có thể cần rule/metadata sau. | CÓ, ảnh hưởng trực tiếp doanh thu. | Kế toán doanh thu, kế toán trưởng, giám đốc tài chính. | TẠM CHỐT GĐ1 |
| 6 | Nguồn chi phí | Có `CostRecord`, `InventoryDocument`, `CashBankDocument`, `JournalEntry`; `CostService.create` kiểm tra kỳ và VAT/net/gross; `InventoryService.postDocument` sinh movement/bút toán khi post; `CashBankService.postDocument` sinh `JournalEntry`; voucher tạo bút toán thủ công. | `GD_ChiPhi`, `GD_Kho_NhapXuat`, `GD_PhieuThuChi`, `GD_ButToan_ThuCong`, báo cáo chi phí công trình. | Nhập một chi phí qua nhiều nguồn sẽ cộng đôi chi phí và lệch sổ cái. | `CostRecord` cho chi phí trực tiếp/dịch vụ/nhân công/thầu phụ; `InventoryDocument` cho vật tư/kho; `CashBankDocument` cho phiếu thu/chi/quỹ/ngân hàng; `JournalEntry` chỉ số dư đầu kỳ/điều chỉnh. | Thiết kế rule chống trùng chi phí theo `sourceType/sourceId`, loại chứng từ và tài khoản. | KHÔNG bắt buộc cho Excel nháp; có thể cần rule sau. | CÓ, ảnh hưởng P&L, WBS budget và ledger. | Kế toán chi phí, kế toán kho, kế toán trưởng. | TẠM CHỐT GĐ1 |
| 7 | Bút toán thủ công | `VoucherService.saveVoucher` trong `services/voucher.service.ts:162` tạo/cập nhật `JournalEntry`/`TransactionLine`, tự sinh reference nếu trống, kiểm tra kỳ qua `assertPeriodNotLocked`, kiểm tra tài khoản active, và bắt cân Nợ/Có; `JournalEntry` có unique `sourceType/sourceId/deletedAt`. | `GD_ButToan_ThuCong`, sổ cái, báo cáo tài chính, số dư đầu kỳ. | Nếu nhập bút toán tay cho nghiệp vụ đã có hóa đơn/thanh toán/kho/thuế, ledger sẽ bị ghi đôi. | Cho phép dùng `GD_ButToan_ThuCong` chỉ cho số dư đầu kỳ/điều chỉnh/phát sinh không có chứng từ nguồn; không dùng thay thế hóa đơn/thanh toán/kho/chi phí. | Có rule chặn trùng `sourceType/sourceId`, phân loại bút toán điều chỉnh và quy trình duyệt bút toán tay. | KHÔNG cho Excel nháp; có thể cần rule kiểm soát sau. | CÓ, ảnh hưởng trực tiếp sổ cái. | Kế toán tổng hợp, kế toán trưởng, kiểm soát nội bộ. | TẠM CHỐT GĐ1 |

## 2. Mapping Review — các cột chưa được khóa

Số lượng thực tế đọc từ `docs/PHASE1_EXCEL_FINAL_MAPPING_DRAFT.md`: **36** trạng thái `CẦN XÁC NHẬN`, **5** trạng thái `SUY LUẬN NGHIỆP VỤ`, **3** trạng thái `CẦN MỞ RỘNG SCHEMA`. Bảng dưới gom cả các ô `Required theo API/service` chưa khóa và các ô `Trạng thái mapping` chưa chắc chắn.

| STT | Sheet | Tên cột Excel | Model | Field DB hiện tại | API payload field hiện tại | Trạng thái hiện tại | Vấn đề cần xử lý | Quyết định tạm GĐ1 | Có import trong Excel nháp không | Có import thật sau này không | Cần ai xác nhận | Ghi chú rủi ro |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `DM_CongTy` | `MaCongTy` | Company | `code` | chưa có API import rõ | CẦN XÁC NHẬN | API tạo/import Company chưa khóa. | Giữ cột để chuẩn bị master data. | CÓ | CÓ ĐIỀU KIỆN | Chủ hệ thống/kỹ thuật | Thiếu route CRUD chuẩn cho import. |
| 2 | `DM_CongTy` | `TenCongTy` | Company | `name` | chưa có API import rõ | CẦN XÁC NHẬN | API tạo/import Company chưa khóa. | Giữ cột để chuẩn bị master data. | CÓ | CÓ ĐIỀU KIỆN | Chủ hệ thống/kỹ thuật | Cần có công ty trước dữ liệu tenant. |
| 3 | `DM_CongTy` | `MaSoThue` | Company | `taxCode` | chưa có API import rõ | CẦN XÁC NHẬN | API tạo/import Company chưa khóa. | Giữ cột để kế toán chuẩn bị MST. | CÓ | CÓ ĐIỀU KIỆN | Kế toán thuế | Sai MST ảnh hưởng hóa đơn/thuế. |
| 4 | `DM_CongTy` | `DiaChi` | Company | `address` | chưa có API import rõ | CẦN XÁC NHẬN | API tạo/import Company chưa khóa. | Giữ cột để kế toán chuẩn bị dữ liệu. | CÓ | CÓ ĐIỀU KIỆN | Kế toán/HCNS | Không phải blocker import nếu chưa dùng hóa đơn. |
| 5 | `DM_ChiNhanh` | `MaChiNhanh` | Branch | `code` | chưa có API import rõ | CẦN XÁC NHẬN | Chi nhánh là tùy chọn nhưng API import chưa khóa. | Chỉ nhập nếu phân tích theo chi nhánh. | CÓ nếu dùng Branch | CÓ ĐIỀU KIỆN | Kế toán trưởng/chủ hệ thống | Không có chi nhánh thì branch trống. |
| 6 | `DM_ChiNhanh` | `TenChiNhanh` | Branch | `name` | chưa có API import rõ | CẦN XÁC NHẬN | Chi nhánh là tùy chọn nhưng API import chưa khóa. | Chỉ nhập nếu phân tích theo chi nhánh. | CÓ nếu dùng Branch | CÓ ĐIỀU KIỆN | Kế toán trưởng/chủ hệ thống | Cần thống nhất mã chi nhánh. |
| 7 | `DM_ChiNhanh` | `MaCongTy` | Branch | `companyId` | `companyId` | CẦN XÁC NHẬN | Lookup Company chưa khóa theo API import. | Lookup nội bộ theo `DM_CongTy.MaCongTy`. | CÓ nếu dùng Branch | CÓ ĐIỀU KIỆN | Kỹ thuật/chủ hệ thống | Lỗi FK nếu mã công ty sai. |
| 8 | `DM_NguoiDung` | `MaCongTy` | User | `companyId` | chưa rõ | CẦN XÁC NHẬN | Chưa có route import user sản xuất chuẩn. | Giữ để chuẩn bị user tenant. | CÓ | CÓ ĐIỀU KIỆN | Admin hệ thống/HR | User không có company sẽ lỗi tenant/RBAC. |
| 9 | `DM_TaiKhoanKeToan` | `SoHieuTK` | LedgerAccount | `code` | chưa có POST route | CẦN XÁC NHẬN | Tài khoản có schema nhưng route tạo chưa khóa. | Giữ trong Excel nháp; cần import path riêng sau. | CÓ | CÓ ĐIỀU KIỆN | Kế toán trưởng | Thiếu account làm lỗi voucher/quỹ/kho/thuế. |
| 10 | `DM_TaiKhoanKeToan` | `TenTK` | LedgerAccount | `name` | chưa có POST route | CẦN XÁC NHẬN | Tài khoản có schema nhưng route tạo chưa khóa. | Giữ trong Excel nháp. | CÓ | CÓ ĐIỀU KIỆN | Kế toán trưởng | Sai tên/type ảnh hưởng báo cáo. |
| 11 | `DM_TaiKhoanKeToan` | `LoaiTK` | LedgerAccount | `type` | chưa có POST route | CẦN XÁC NHẬN | Enum/type tài khoản cần chốt. | Giữ dropdown enum theo schema. | CÓ | CÓ ĐIỀU KIỆN | Kế toán trưởng | Sai loại tài khoản ảnh hưởng BCTC. |
| 12 | `DM_KyKeToan` | `NamTaiChinh` | FiscalYear | `year` | `year` | CẦN XÁC NHẬN | Chưa chốt dùng `FiscalYear/AccountingPeriod` hay `FiscalPeriod`. | Ưu tiên `FiscalYear + AccountingPeriod`. | CÓ | CÓ sau xác nhận | Kế toán trưởng | Sai năm tài chính làm lệch kỳ. |
| 13 | `DM_KyKeToan` | `ThangKy` | AccountingPeriod/FiscalPeriod | `month` | `month` | CẦN XÁC NHẬN | Song song model kỳ gây trùng. | Không nhập `FiscalPeriod` song song trong GĐ1. | CÓ | CÓ sau xác nhận | Kế toán tổng hợp | Khóa kỳ không nhất quán. |
| 14 | `DM_KyKeToan` | `TrangThaiKy` | AccountingPeriod/FiscalPeriod | `status`/`isLocked` | `isLocked` | CẦN XÁC NHẬN | Cơ chế trạng thái khác nhau giữa model. | Excel nháp ghi trạng thái tham khảo; import theo nguồn kỳ đã chốt. | CÓ | CÓ sau xác nhận | Kế toán tổng hợp | Sai trạng thái làm API chặn ghi nhận. |
| 15 | `DM_NhaCungCap_KhachHang` | `MaDoiTac` | Supplier | `code` | accounting/procurement action chưa chốt | CẦN XÁC NHẬN | API/action tạo supplier chưa khóa. | Dùng cho nhà cung cấp; khách hàng chưa coi là master chuẩn. | CÓ | CÓ ĐIỀU KIỆN | Kế toán công nợ | Không có Customer model riêng. |
| 16 | `DM_NhaCungCap_KhachHang` | `TenDoiTac` | Supplier | `name` | chưa chốt | CẦN XÁC NHẬN | API/action tạo supplier chưa khóa. | Dùng cho NCC, chủ đầu tư chỉ khi xác nhận. | CÓ | CÓ ĐIỀU KIỆN | Kế toán công nợ | Dễ lẫn NCC/khách hàng. |
| 17 | `DM_NhaCungCap_KhachHang` | `LoaiDoiTac` | Supplier hoặc Project.investor | chưa có field riêng | chưa có | CẦN MỞ RỘNG SCHEMA | Không có field phân loại đối tác. | CHỈ DÙNG ĐỂ KẾ TOÁN CHUẨN BỊ DỮ LIỆU. | CÓ, không import trực tiếp | KHÔNG nếu chưa mở schema | Kế toán trưởng/chủ hệ thống | Cần tách khách hàng để AR chuẩn. |
| 18 | `DM_NhaCungCap_KhachHang` | `ThongTinLienHe` | Supplier | `description` | chưa chốt | SUY LUẬN NGHIỆP VỤ | Thông tin liên hệ không cấu trúc. | Có thể lưu tạm vào `description` nếu xác nhận. | CÓ | CÓ ĐIỀU KIỆN | Kế toán công nợ | Dữ liệu liên hệ khó chuẩn hóa. |
| 19 | `DM_CongTrinh` | `MaDuAn` | Project | không thấy `code` | không có trong `createProjectSchema` | CẦN MỞ RỘNG SCHEMA | DB/API chưa có mã công trình. | Giữ làm khóa nội bộ Excel, KHÔNG IMPORT TRỰC TIẾP Ở GĐ1. | CÓ, chỉ nội bộ | KHÔNG nếu chưa mở schema | Chủ dự án/kế toán trưởng | Dễ lỗi FK giữa sheet nếu không có mã ổn định. |
| 20 | `DM_CongTrinh` | `ChuDauTu` | Project | `investor` | `investor` | CẦN XÁC NHẬN | Không có Customer model riêng. | Dùng text `Project.investor`, không coi là AR customer master. | CÓ | CÓ, dạng text | Kế toán công nợ | Không phân tích AR chuẩn theo khách hàng. |
| 21 | `DM_CongTrinh` | `GiaTriHopDongDuKien` | Project | `contractValue` | `contractValue` | CẦN XÁC NHẬN | Có thể bị đồng bộ bởi `ContractService`. | Chỉ nhập nếu chưa có hợp đồng gốc. | CÓ | CÓ ĐIỀU KIỆN | Kế toán hợp đồng | Lệch với tổng hợp đồng thật. |
| 22 | `DM_CongTrinh` | `TongDuToan` | Project | `totalBudget` | `totalBudget` | SUY LUẬN NGHIỆP VỤ | Có thể lệch với `BudgetRecord`. | CHỈ DÙNG ĐỂ KẾ TOÁN CHUẨN BỊ DỮ LIỆU hoặc derived từ dự toán. | CÓ | TÙY sau xác nhận | Kế toán dự toán | Dễ lệch nếu vừa nhập totalBudget vừa nhập BudgetRecord. |
| 23 | `DM_WBS` | `MaDuAn` | WBSItem | `projectId` | `projectId` | CẦN XÁC NHẬN | Phụ thuộc quyết định `MaDuAn`. | Lookup nội bộ bằng `MaDuAn` sau khi chốt mapping Project. | CÓ | CÓ sau xác nhận | Kế toán dự án/kỹ thuật | Sai Project làm WBS mồ côi. |
| 24 | `DM_WBS` | `MaWBS` | WBSItem | `code` | `code` | SUY LUẬN NGHIỆP VỤ | Không unique DB. | Giữ mã WBS nghiệp vụ, cần kiểm tra unique trong Excel theo project. | CÓ | CÓ ĐIỀU KIỆN | Kế toán dự toán/PM | Trùng WBS làm sai budget/cost. |
| 25 | `DM_DuToan` | `MaDuAn` | BudgetRecord | `projectId` | `projectId` | CẦN XÁC NHẬN | Phụ thuộc quyết định `MaDuAn`. | Lookup nội bộ bằng `MaDuAn`. | CÓ | CÓ sau xác nhận | Kế toán dự toán | Sai project làm lệch budget. |
| 26 | `DM_HopDong` | `MaDuAn` | Contract | `projectId` | `projectId` | CẦN XÁC NHẬN | Phụ thuộc quyết định `MaDuAn`. | Lookup nội bộ bằng `MaDuAn`. | CÓ | CÓ sau xác nhận | Kế toán hợp đồng | Hợp đồng gắn sai công trình. |
| 27 | `DM_HopDong` | `NhaThauNhaCungCap` | Contract | `contractorName`/`supplierId` | `contractorName` | CẦN XÁC NHẬN | Service create hiện dùng text, schema có `supplierId`. | GĐ1 dùng text nếu chưa chốt Supplier FK. | CÓ | CÓ ĐIỀU KIỆN | Kế toán hợp đồng/công nợ | Công nợ NCC không chuẩn nếu chỉ dùng text. |
| 28 | `DM_HopDong` | `NgayKy` | Contract | `signedDate` | chưa có trong `createContract` | CẦN XÁC NHẬN | Service hiện chưa nhận field này. | CHỈ ĐỂ KẾ TOÁN CHUẨN BỊ DỮ LIỆU nếu API chưa nhận. | CÓ, có cảnh báo | KHÔNG nếu API không mở | Kế toán hợp đồng | Thiếu ngày ký ảnh hưởng hồ sơ hợp đồng. |
| 29 | `DM_HopDong` | `FileHopDong` | Document | chưa chốt field | chưa có | CẦN MỞ RỘNG SCHEMA | Chưa có chính sách file/storage cho import. | CHỈ ĐỂ KẾ TOÁN CHUẨN BỊ DỮ LIỆU. | CÓ, không import trực tiếp | KHÔNG nếu chưa có file policy | Chủ hệ thống/kế toán | Cần chính sách file/storage. |
| 30 | `GD_HoaDon` | `MaDuAn` | Invoice | `projectId` | `projectId` | CẦN XÁC NHẬN | Phụ thuộc quyết định `MaDuAn`. | Lookup nội bộ bằng `MaDuAn`. | CÓ | CÓ sau xác nhận | Kế toán công nợ | Hóa đơn gắn sai công trình. |
| 31 | `GD_HoaDon` | `SoHoaDon` | Invoice | `invoiceNumber` | `invoiceNumber` | SUY LUẬN NGHIỆP VỤ | Không unique DB. | Giữ cột và kiểm tra trùng nghiệp vụ trong Excel/dry-run. | CÓ | CÓ ĐIỀU KIỆN | Kế toán thuế/công nợ | Trùng số hóa đơn khó đối soát. |
| 32 | `GD_HoaDon` | `TienTruocVAT` | Invoice | `netAmount` | `netAmount` | CẦN XÁC NHẬN | `RevenueService.createInvoice` dùng `netAmount` hoặc suy từ `amount`; cần thống nhất gross/net. | Giữ cột, công thức kiểm tra `net + vat = gross`. | CÓ | CÓ sau xác nhận | Kế toán thuế | Nếu nhập amount là gross cần thống nhất. |
| 33 | `GD_HoaDon` | `TongTien` | Invoice | `amount` | `amount` | CẦN XÁC NHẬN | Cần thống nhất `amount` là gross. | Tạm coi `TongTien` là gross trong Excel nháp. | CÓ | CÓ sau xác nhận | Kế toán thuế/công nợ | Sai gross làm lệch VAT/công nợ. |
| 34 | `GD_ThanhToan` | `MaDuAn` | Payment | `projectId` | `projectId` | CẦN XÁC NHẬN | Service có thể lấy project từ invoice khi create. | Ưu tiên lookup qua hóa đơn; `MaDuAn` dùng đối chiếu. | CÓ | CÓ sau xác nhận | Kế toán thanh toán | Thanh toán sai công trình/invoice. |
| 35 | `GD_ChiPhi` | `MaDuAn` | CostRecord | `projectId` | `projectId` | CẦN XÁC NHẬN | Phụ thuộc quyết định `MaDuAn`. | Lookup nội bộ bằng `MaDuAn`. | CÓ | CÓ sau xác nhận | Kế toán chi phí | Chi phí sai công trình. |
| 36 | `GD_ChiPhi` | `TienTruocVAT` | CostRecord | `netAmount` | `netAmount` | CẦN XÁC NHẬN | Cần thống nhất `amount` gross/net; service có back-calc. | Giữ cột, công thức kiểm tra `net + vat = gross`. | CÓ | CÓ sau xác nhận | Kế toán chi phí/thuế | Sai VAT và chi phí. |
| 37 | `GD_ChiPhi` | `NhaCungCapText` | CostRecord | `supplier` | `supplier` | CẦN XÁC NHẬN | Field là text, không FK. | Dùng text ở GĐ1; không coi là công nợ NCC chuẩn. | CÓ | CÓ dạng text | Kế toán công nợ/chi phí | Khó đối chiếu công nợ NCC. |
| 38 | `GD_TamUng` | `SoTamUng` | AdvanceRequest | `advanceNo` | `advanceNo` | SUY LUẬN NGHIỆP VỤ | Không unique DB. | Giữ số tạm ứng để đối chiếu Excel/dry-run. | CÓ | CÓ ĐIỀU KIỆN | Kế toán thanh toán | Trùng số tạm ứng khó hoàn ứng. |
| 39 | `GD_TamUng` | `EmailNhanVien` | AdvanceRequest | `employeeId` | `employeeId` | CẦN XÁC NHẬN | Required tùy `recipientType`. | Chỉ bắt buộc nếu người nhận là nhân viên. | CÓ | CÓ sau xác nhận | Kế toán thanh toán/HR | Sai người nhận tạm ứng. |
| 40 | `GD_TamUng` | `MaNCC` | AdvanceRequest | `supplierId` | `supplierId` | CẦN XÁC NHẬN | Required tùy `recipientType`. | Chỉ bắt buộc nếu người nhận là nhà cung cấp. | CÓ | CÓ sau xác nhận | Kế toán thanh toán/công nợ | Sai NCC nhận tạm ứng. |
| 41 | `GD_HoanUng` | `NgayHoanUng` | AdvanceSettlement | `settlementDate` | `settlementDate` | CẦN XÁC NHẬN | Service create chưa thấy kiểm tra kỳ rõ. | Giữ cột, dry-run phải kiểm tra kỳ trước import. | CÓ | CÓ sau xác nhận | Kế toán thanh toán | Hoàn ứng sai kỳ kế toán. |
| 42 | `DM_Kho` | `MaDuAn` | Warehouse | `projectId` | `projectId` | CẦN XÁC NHẬN | Phụ thuộc quyết định `MaDuAn`; Warehouse có thể không gắn project. | Tùy chọn, chỉ nhập nếu kho theo công trình. | CÓ nếu dùng kho project | CÓ sau xác nhận | Kế toán kho/PM | Kho gắn sai công trình. |
| 43 | `GD_ButToan_ThuCong` | `MaDuAn` | JournalEntry | `projectId` | `projectId` | CẦN XÁC NHẬN | Phụ thuộc quyết định `MaDuAn`. | Tùy chọn, chỉ dùng khi bút toán cần phân tích theo công trình. | CÓ | CÓ sau xác nhận | Kế toán tổng hợp | Bút toán sai công trình. |
| 44 | `GD_ButToan_ThuCong` | `LoaiNguon` | JournalEntry | `sourceType` | `sourceType` | CẦN XÁC NHẬN | Không được nhập trùng `sourceType/sourceId` với auto docs. | Không cho người nhập tự do nếu là chứng từ tự sinh; chỉ dùng nguồn điều chỉnh được kiểm soát. | CÓ, hạn chế | CÓ sau rule | Kế toán tổng hợp/kiểm soát nội bộ | Trùng bút toán tự sinh. |

## 3. Quyết định tạm thời cho Excel GĐ1

Các dòng dưới đây là **phương án đề xuất**, chưa phải quyết định cuối.

| Chủ đề | Quyết định tạm GĐ1 | Áp dụng cho sheet/cột nào | Có import không | Có rủi ro không | Điều kiện để chuyển thành quyết định cuối |
| --- | --- | --- | --- | --- | --- |
| `MaDuAn` | Giữ trong Excel nháp; không import trực tiếp nếu DB chưa có `Project.code`; dùng để lookup nội bộ trong file. | `DM_CongTrinh.MaDuAn` và mọi sheet FK công trình. | KHÔNG import trực tiếp vào DB ở GĐ1 nếu chưa có field. | CÓ, nếu dùng tên công trình thay khóa. | Người dùng/kế toán xác nhận mở schema `Project.code` hoặc chốt bảng mapping chính thức. |
| Chủ đầu tư/khách hàng | GĐ1 dùng `Project.investor` dạng text; không coi là customer ledger master chuẩn. | `DM_CongTrinh.ChuDauTu`, hóa đơn/hợp đồng liên quan. | CÓ dạng text vào `Project.investor`. | CÓ, AR theo khách hàng không chuẩn. | Xác nhận có cần model `Customer/BusinessPartner` hoặc mở rộng đối tác. |
| Vật tư | GĐ1 dùng `MaterialItem`; không dùng `Material` legacy. | `DM_VatTu`, `GD_Kho_NhapXuat`. | CÓ với `MaterialItem`. | THẤP nếu thống nhất không dùng legacy. | Kế toán kho xác nhận toàn bộ vật tư import đi qua module kho mới. |
| Kỳ kế toán | GĐ1 ưu tiên `FiscalYear + AccountingPeriod`; không nhập `FiscalPeriod` song song. | `DM_KyKeToan` và mọi chứng từ có ngày hạch toán. | CÓ sau xác nhận nguồn kỳ chính. | CÓ nếu code vẫn dùng hai cơ chế. | Kế toán trưởng/chủ hệ thống xác nhận nguồn kỳ chính. |
| Doanh thu | Không import `Revenue` riêng mặc định; dùng `Invoice/TaxInvoice` và posting/ledger. | `GD_HoaDon`, `GD_HoaDonThue`, `GD_ButToan_ThuCong` điều chỉnh. | KHÔNG import `Revenue` riêng mặc định. | CÓ nếu sau này bật song song Revenue. | Kế toán doanh thu xác nhận nguồn doanh thu chính cho báo cáo. |
| Chi phí | `CostRecord` cho chi phí trực tiếp; `InventoryDocument` cho vật tư/kho; `CashBankDocument` cho quỹ/ngân hàng; `JournalEntry` chỉ điều chỉnh/số dư. | `GD_ChiPhi`, `GD_Kho_NhapXuat`, `GD_PhieuThuChi`, `GD_ButToan_ThuCong`. | CÓ theo từng nguồn chứng từ, không nhập trùng. | CÓ nếu một chi phí xuất hiện ở nhiều sheet. | Kế toán trưởng xác nhận rule nguồn chi phí chính. |
| Bút toán thủ công | Chỉ số dư đầu kỳ/điều chỉnh/phát sinh không có chứng từ nguồn; không dùng cho nghiệp vụ đã có hóa đơn/thanh toán/kho/chi phí. | `GD_ButToan_ThuCong`. | CÓ nhưng hạn chế. | CÓ, nếu dùng thay bút toán tự sinh. | Kế toán tổng hợp xác nhận loại bút toán được nhập tay và rule chống trùng. |

## 4. Checklist trước khi tạo Excel nháp

| Điều kiện | Trạng thái | Ghi chú | Có chặn tạo Excel nháp không |
| --- | --- | --- | --- |
| 21 sheet GĐ1 đã khóa phạm vi chưa? | ĐÃ KHÓA TẠM | Theo `PHASE1_EXCEL_FINAL_MAPPING_DRAFT.md`. | KHÔNG |
| GĐ2 đã tách riêng chưa? | ĐÃ TÁCH | Mua hàng nâng cao, thầu phụ, tiến độ, nguồn lực, claim, workflow. | KHÔNG |
| Cột nào import được đã được đánh dấu chưa? | ĐÃ ĐÁNH DẤU DRAFT | Còn cần người dùng/kế toán review. | KHÔNG, nếu Excel nháp có cảnh báo |
| Cột nào chỉ để kế toán chuẩn bị đã được đánh dấu chưa? | ĐÃ GOM REVIEW | Xem bảng Mapping Review. | KHÔNG, nếu không import trực tiếp |
| Cột nào cần mở rộng schema đã được đánh dấu chưa? | ĐÃ ĐÁNH DẤU | Có 3 trạng thái `CẦN MỞ RỘNG SCHEMA`. | KHÔNG cho Excel nháp, CÓ cho import thật |
| `MaDuAn` đã có quyết định tạm chưa? | CÓ, CHỜ XÁC NHẬN | Dùng khóa nội bộ Excel, không import trực tiếp nếu chưa có `Project.code`. | KHÔNG cho Excel nháp, CÓ cho template cuối/import |
| Khách hàng/chủ đầu tư đã có quyết định tạm chưa? | CÓ, CHỜ XÁC NHẬN | Tạm dùng `Project.investor` text. | KHÔNG cho Excel nháp, CÓ cho AR chuẩn |
| `MaterialItem` đã được chọn cho GĐ1 chưa? | CÓ, CHỜ XÁC NHẬN | Không dùng `Material` legacy. | KHÔNG |
| Nguồn kỳ kế toán chính đã được đề xuất chưa? | CÓ, CHỜ XÁC NHẬN | Ưu tiên `FiscalYear + AccountingPeriod`. | KHÔNG cho Excel nháp, CÓ cho import thật |
| Đã chốt tạm không import `Revenue` riêng chưa? | CÓ, CHỜ XÁC NHẬN | Doanh thu lấy từ hóa đơn/posting/ledger. | KHÔNG |
| Đã chốt tạm `JournalEntry` thủ công chỉ dùng số dư/điều chỉnh chưa? | CÓ, CHỜ XÁC NHẬN | Không dùng thay chứng từ nguồn. | KHÔNG |
| Có còn kết luận nào nói đủ import thật không? | KHÔNG | Báo cáo hiện hành ghi `Đủ import dữ liệu thật: CHƯA`. | KHÔNG |
| Có tạo Excel chưa? | KHÔNG | Chưa tạo file Excel ở bước này. | KHÔNG |
| Có import dữ liệu chưa? | KHÔNG | Chưa ghi DB/import dữ liệu. | KHÔNG |
| Có seed dữ liệu chưa? | KHÔNG | Chưa seed dữ liệu. | KHÔNG |
| Có sửa schema/UI/code chưa? | KHÔNG | Chỉ tạo/cập nhật Markdown. | KHÔNG |

## 5. Kết luận hiện hành

| Mức đánh giá | Trạng thái | Lý do |
| --- | --- | --- |
| Đủ tạo biên bản quyết định nghiệp vụ | CÓ | 7 blocker và 44 điểm mapping review đã được gom thành bảng xác nhận. |
| Đủ tạo Excel nháp sau khi người dùng/kế toán review | CÓ ĐIỀU KIỆN | Excel nháp phải giữ cảnh báo `CHỜ XÁC NHẬN`, `CHỈ ĐỂ KẾ TOÁN CHUẨN BỊ DỮ LIỆU`, `CẦN MỞ RỘNG SCHEMA`. |
| Đủ tạo Excel cuối | CHƯA | Còn phải xác nhận quyết định nghiệp vụ và cập nhật mapping theo quyết định cuối. |
| Đủ import dữ liệu thật | CHƯA | Chưa có template cuối, dry-run validator, dữ liệu thật đã đối chiếu, và rule chống trùng. |

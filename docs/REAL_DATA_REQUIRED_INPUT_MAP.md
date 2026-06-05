# BÁO CÁO AUDIT: BẢN ĐỒ DỮ LIỆU ĐẦU VÀO ERP KẾ TOÁN XÂY DỰNG

## KẾT LUẬN CÓ HIỆU LỰC HIỆN TẠI

* **Đủ tạo biên bản quyết định nghiệp vụ:** CÓ.
* **Đủ tạo Excel nháp sau khi người dùng/kế toán review:** CÓ ĐIỀU KIỆN.
* **Đủ tạo bản nháp Excel template:** CÓ.
* **Đủ tạo Excel template cuối cùng:** CHƯA.
* **Đủ import dữ liệu thật:** CHƯA.
* **Lý do:** còn phải khóa phạm vi giai đoạn 1, chốt mapping `Project`/khách hàng/`MaterialItem`/kỳ kế toán/nguồn doanh thu, và đọc sâu/khóa cách dùng 37 route nhập liệu trước khi tạo template cuối.
* **File kiểm kê model/route:** [REAL_DATA_REQUIRED_INPUT_MODEL_ROUTE_INVENTORY.md](./REAL_DATA_REQUIRED_INPUT_MODEL_ROUTE_INVENTORY.md)
* **File mapping giai đoạn 1:** [PHASE1_EXCEL_FINAL_MAPPING_DRAFT.md](./PHASE1_EXCEL_FINAL_MAPPING_DRAFT.md)
* **File biên bản quyết định nghiệp vụ GĐ1:** [PHASE1_BUSINESS_DECISION_LOG.md](./PHASE1_BUSINESS_DECISION_LOG.md)
* **Phiếu xác nhận quyết định nghiệp vụ GĐ1:** [PHASE1_BUSINESS_DECISION_CONFIRMATION_FORM.md](./PHASE1_BUSINESS_DECISION_CONFIRMATION_FORM.md)
* **Trạng thái sau phiếu xác nhận:** 7 quyết định nghiệp vụ đã TẠM CHỐT GĐ1 để cho phép tạo Excel template nháp có cảnh báo; chưa đủ tạo template cuối hoặc import dữ liệu thật.
* **Excel template nháp GĐ1:** [PHASE1_ERP_IMPORT_TEMPLATE_DRAFT_REVIEW.xlsx](../templates/PHASE1_ERP_IMPORT_TEMPLATE_DRAFT_REVIEW.xlsx)
* **Báo cáo tạo Excel nháp:** [PHASE1_EXCEL_TEMPLATE_DRAFT_REPORT.md](./PHASE1_EXCEL_TEMPLATE_DRAFT_REPORT.md)

## THÔNG TIN CHUNG
* **Thời gian quét:** 2026-06-05 09:45 ICT
* **Branch hiện tại:** `main`
* **Database hiện tại:** `postgresql://postgres:****@localhost:5432/construction_erp`
* **Phạm vi file/folder đã quét:**
  * `prisma/schema.prisma`
  * `app/api/**`
  * `app/**/page.tsx`, `app/**/layout.tsx`
  * `components/**`
  * `services/**`, `lib/**`
  * `scripts/**`
* **Số lượng thực tế đã phát hiện trong code:**
  * **Tổng số model (Prisma):** 97 models
  * **Tổng số API route:** 152 routes
  * **Tổng số màn hình/form:** 31 pages
  * **Tổng số service/helper:** 122 files

---

## PHẦN 1 — BẢN ĐỒ DỮ LIỆU ĐẦU VÀO ĐẦY ĐỦ

Dưới đây là danh sách toàn bộ các nhóm dữ liệu đầu vào cần thiết cho hệ thống ERP, được đối chiếu trực tiếp từ source code.

### 1. Nhóm dữ liệu: Công ty (Company)
* **Model liên quan:** `Company`
* **API route liên quan:** `GET/POST /api/accounting-core` (hoặc qua admin core api)
* **UI/Màn hình:** `/settings` (Cấu hình doanh nghiệp)
* **File/Service/Component:** `services/construction-accounting.service.ts`
* **Trường bắt buộc (Schema):**
  * `code` (String, Unique) - Mã định danh công ty (ví dụ: CTY-XD-SO2-HN)
  * `name` (String) - Tên đầy đủ công ty
* **Trường bắt buộc (API/Service nếu khác Schema):** Giống schema
* **Trường tùy chọn:**
  * `taxCode` (String) - Mã số thuế
  * `address` (String) - Địa chỉ trụ sở chính
* **Trường tự sinh:** `id` (UUID), `createdAt`, `updatedAt`
* **Enum/Trạng thái hợp lệ:** Không có
* **Unique constraint:** `Company_code_key` trên trường `code`
* **Foreign key / dữ liệu phụ thuộc:** Không có
* **Thứ tự nhập:** Nhập đầu tiên (Giai đoạn 1)
* **Ảnh hưởng:** Dashboard (tất cả các chỉ số tài chính), Báo cáo (Sổ cái, Doanh thu, Chi phí, Công nợ dòng tiền), Công nợ (AR/AP), Dòng tiền, Lãi/Lỗ, Sổ cái kế toán.
* **Chứng từ tự sinh / Duyệt:** Không tự sinh bút toán, không cần duyệt.
* **Kỳ kế toán:** Không bị chặn.
* **Nguồn chứng cứ:**
  * `prisma/schema.prisma` (model Company, dòng 150-170)
  * `services/construction-accounting.service.ts`
* **Ghi chú rủi ro:** Trùng mã `code` gây lỗi import; nhập sai `taxCode` ảnh hưởng đến báo cáo thuế.

### 2. Nhóm dữ liệu: Chi nhánh (Branch)
* **Model liên quan:** `Branch`
* **API route liên quan:** `GET/POST /api/accounting-core`
* **UI/Màn hình:** `/settings` (Cấu hình chi nhánh)
* **File/Service/Component:** `services/construction-accounting.service.ts`
* **Trường bắt buộc (Schema):**
  * `code` (String, Unique) - Mã chi nhánh
  * `name` (String) - Tên chi nhánh
  * `companyId` (String) - Mã ID công ty chủ quản
* **Trường tùy chọn:** `address` (String)
* **Trường tự sinh:** `id` (UUID), `createdAt`, `updatedAt`
* **Unique constraint:** `Branch_code_key` trên trường `code`
* **Foreign key / dữ liệu phụ thuộc:** `companyId` -> `Company`
* **Thứ tự nhập:** Nhập sau `Company` (Giai đoạn 1)
* **Ảnh hưởng:** Phân tích dữ liệu theo chi nhánh trên báo cáo kế toán.
* **Nguồn chứng cứ:** `prisma/schema.prisma` (model Branch)

### 3. Nhóm dữ liệu: Người dùng & Phân quyền (User)
* **Model liên quan:** `User`
* **API route liên quan:** `/api/auth/session`
* **UI/Màn hình:** `/settings/users` (Quản lý người dùng)
* **Trường bắt buộc (Schema):**
  * `email` (String, Unique) - Email đăng nhập
  * `role` (Enum UserRole) - Quyền hạn
* **Enum hợp lệ:** `ADMIN`, `SUPER_ADMIN`, `CFO`, `MANAGER`, `ACCOUNTANT`, `VIEWER`
* **Trường tùy chọn:** `name` (String), `companyId` (String)
* **Trường tự sinh:** `id` (UUID), `createdAt`, `updatedAt`
* **Foreign key:** `companyId` -> `Company` (tùy chọn)
* **Nguồn chứng cứ:** `prisma/schema.prisma` (model User)

### 4. Nhóm dữ liệu: Hệ thống tài khoản kế toán (LedgerAccount)
* **Model liên quan:** `LedgerAccount`
* **API route liên quan:** `GET/POST /api/accounting/accounts`
* **UI/Màn hình:** `/settings/accounts` (Hệ thống tài khoản)
* **Trường bắt buộc (Schema):**
  * `code` (String, Unique) - Số hiệu tài khoản (ví dụ: 111, 112, 131, 331...)
  * `name` (String) - Tên tài khoản
  * `type` (Enum AccountType) - Tính chất tài khoản
* **Enum hợp lệ:** `ASSET`, `LIABILITY`, `EQUITY`, `INCOME`, `EXPENSE`
* **Trường tùy chọn:** `parentId` (String - Tài khoản cấp trên), `isActive` (Boolean, default: true)
* **Foreign key:** `parentId` -> `LedgerAccount` (Tự tham chiếu)
* **Nguồn chứng cứ:** `prisma/schema.prisma` (model LedgerAccount)

### 5. Nhóm dữ liệu: Năm tài chính & Kỳ kế toán (FiscalYear & AccountingPeriod)
* **Model liên quan:** `FiscalYear`, `AccountingPeriod`
* **API route liên quan:** `GET/POST /api/reports/fiscal-years`, `/api/fiscal-periods`
* **UI/Màn hình:** `/settings/periods` (Kỳ kế toán)
* **Trường bắt buộc (Schema):**
  * `year` (Int) - Năm tài chính (ví dụ: 2026)
  * `companyId` (String) - Công ty chủ quản
  * `AccountingPeriod.month` (String) - Định dạng YYYY-MM (ví dụ: 2026-01)
  * `AccountingPeriod.periodNumber` (Int) - Số thứ tự kỳ (1 đến 12)
* **Enum hợp lệ:** `FiscalYearStatus` (`OPEN`, `CLOSED`)
* **Foreign key:** `companyId` -> `Company`
* **Nguồn chứng cứ:** `prisma/schema.prisma` (model FiscalYear, AccountingPeriod)

### 6. Nhóm dữ liệu: Nhà cung cấp & Khách hàng (Supplier)
* **Model liên quan:** `Supplier`
* **API route liên quan:** `GET/POST /api/procurement`
* **UI/Màn hình:** `/procurement/suppliers` (Danh sách nhà cung cấp)
* **Trường bắt buộc (Schema):**
  * `code` (String, Unique) - Mã nhà cung cấp (ví dụ: NCC-01)
  * `name` (String) - Tên nhà cung cấp
* **Trường tùy chọn:** `description` (String - thông tin MST, ĐT, địa chỉ)
* **Nguồn chứng cứ:** `prisma/schema.prisma` (model Supplier)

### 7. Nhóm dữ liệu: Công trình / Dự án (Project)
* **Model liên quan:** `Project`
* **API route liên quan:** `GET/POST /api/projects`
* **UI/Màn hình:** `/projects` (Danh sách dự án)
* **File/Service/Component:** `services/project.service.ts`
* **Trường bắt buộc (Schema):**
  * `code` (String, Unique) - Mã dự án (ví dụ: DA-01)
  * `name` (String) - Tên dự án
  * `companyId` (String) - Mã ID công ty quản lý
* **Trường tùy chọn:** `address` (String), `status` (Enum ProjectStatus, default: `PLANNING`)
* **Enum hợp lệ:** `PLANNING`, `ACTIVE`, `COMPLETED`, `ON_HOLD`, `CANCELLED`
* **Foreign key:** `companyId` -> `Company`
* **Nguồn chứng cứ:** `prisma/schema.prisma` (model Project)

### 8. Nhóm dữ liệu: WBS / Hạng mục công trình (WBSItem)
* **Model liên quan:** `WBSItem`
* **API route liên quan:** `GET/POST /api/projects/[id]/wbs`
* **UI/Màn hình:** `/projects/[id]/wbs` (Cơ cấu phân chia công việc)
* **Trường bắt buộc (Schema):**
  * `code` (String) - Mã WBS
  * `name` (String) - Tên hạng mục/công việc
  * `projectId` (String) - Dự án cha
* **Trường tùy chọn:** `parentId` (String - Hạng mục cha tự tham chiếu)
* **Foreign key:** `projectId` -> `Project`, `parentId` -> `WBSItem`
* **Nguồn chứng cứ:** `prisma/schema.prisma` (model WBSItem)

### 9. Nhóm dữ liệu: Dự toán ngân sách (BudgetRecord)
* **Model liên quan:** `BudgetRecord`
* **API route liên quan:** `GET/POST /api/projects/[id]/budgets`
* **UI/Màn hình:** `/projects/[id]/budget` (Quản lý dự toán)
* **Trường bắt buộc (Schema):**
  * `wbsItemId` (String) - Mã hạng mục WBS
  * `amount` (Decimal) - Số tiền dự toán
  * `year` (Int) - Năm ngân sách
* **Foreign key:** `wbsItemId` -> `WBSItem`
* **Nguồn chứng cứ:** `prisma/schema.prisma` (model BudgetRecord)

### 10. Nhóm dữ liệu: Danh mục vật tư (MaterialItem)
* **Model liên quan:** `MaterialItem`
* **API route liên quan:** `GET/POST /api/inventory/items`
* **UI/Màn hình:** `/inventory/items` (Danh mục vật tư)
* **Trường bắt buộc (Schema):**
  * `code` (String, Unique) - Mã vật tư (ví dụ: THEP-D10)
  * `name` (String) - Tên vật tư
  * `unit` (String) - Đơn vị tính (m, kg, m3...)
* **Trường tùy chọn:** `description` (String)
* **Nguồn chứng cứ:** `prisma/schema.prisma` (model MaterialItem)

### 11. Nhóm dữ liệu: Danh mục kho (Warehouse)
* **Model liên quan:** `Warehouse`
* **API route liên quan:** `GET/POST /api/inventory/warehouses`
* **UI/Màn hình:** `/inventory/warehouses` (Danh sách kho)
* **Trường bắt buộc (Schema):**
  * `code` (String, Unique) - Mã kho (KHO-01)
  * `name` (String) - Tên kho
  * `companyId` (String) - Công ty quản lý
* **Trường tùy chọn:** `address` (String)
* **Foreign key:** `companyId` -> `Company`
* **Nguồn chứng cứ:** `prisma/schema.prisma` (model Warehouse)

### 12. Nhóm dữ liệu: Hợp đồng (Contract)
* **Model liên quan:** `Contract`
* **API route liên quan:** `GET/POST /api/contracts`
* **UI/Màn hình:** `/contracts` (Quản lý hợp đồng)
* **File/Service/Component:** `services/contract.service.ts`
* **Trường bắt buộc (Schema):**
  * `contractNumber` (String, Unique) - Số hợp đồng
  * `name` (String) - Tên hợp đồng
  * `type` (Enum ContractType) - Loại hợp đồng (CUSTOMER/VENDOR/SUBCONTRACT)
  * `totalAmount` (Decimal) - Giá trị hợp đồng
  * `projectId` (String) - Dự án liên quan
  * `companyId` (String) - Công ty ký kết
* **Trường tùy chọn:** `supplierId` (String - Cần thiết nếu là Vendor/Subcontract Contract)
* **Enum hợp lệ:** `CUSTOMER`, `VENDOR`, `SUBCONTRACT`
* **Foreign key:** `projectId` -> `Project`, `companyId` -> `Company`, `supplierId` -> `Supplier`
* **Nguồn chứng cứ:** `prisma/schema.prisma` (model Contract)

### 13. Nhóm dữ liệu: Hóa đơn & Đề nghị thanh toán (Invoice)
* **Model liên quan:** `Invoice`
* **API route liên quan:** `GET/POST /api/billing/invoices`
* **UI/Màn hình:** `/billing/invoices` (Quản lý hóa đơn)
* **Trường bắt buộc (Schema):**
  * `invoiceNumber` (String, Unique) - Số hóa đơn
  * `issueDate` (Date) - Ngày phát hành
  * `totalAmount` (Decimal) - Tổng tiền trước thuế
  * `taxAmount` (Decimal) - Tiền thuế
  * `companyId` (String) - Công ty phát hành/nhận
  * `contractId` (String) - Hợp đồng liên kết
* **Foreign key:** `companyId` -> `Company`, `contractId` -> `Contract`
* **Nguồn chứng cứ:** `prisma/schema.prisma` (model Invoice)

### 14. Nhóm dữ liệu: Thanh toán & Chi tiền (Payment)
* **Model liên quan:** `Payment`
* **API route liên quan:** `GET/POST /api/billing/payments`
* **UI/Màn hình:** `/billing/payments` (Thanh toán)
* **Trường bắt buộc (Schema):**
  * `paymentNumber` (String, Unique) - Số chứng từ thanh toán
  * `paymentDate` (Date) - Ngày thanh toán
  * `amount` (Decimal) - Số tiền thanh toán
  * `companyId` (String) - Công ty thực hiện
* **Trường tùy chọn:** `contractId` (String), `invoiceId` (String)
* **Foreign key:** `companyId` -> `Company`, `contractId` -> `Contract`, `invoiceId` -> `Invoice`
* **Nguồn chứng cứ:** `prisma/schema.prisma` (model Payment)

### 15. Nhóm dữ liệu: Phát sinh chi phí (CostRecord)
* **Model liên quan:** `CostRecord`
* **API route liên quan:** `GET/POST /api/costs`
* **UI/Màn hình:** `/costs` (Ghi nhận chi phí công trình)
* **Trường bắt buộc (Schema):**
  * `amount` (Decimal) - Số tiền chi phí
  * `occurredAt` (Date) - Ngày phát sinh
  * `wbsItemId` (String) - Hạng mục WBS chịu chi phí
  * `projectId` (String) - Dự án chịu chi phí
  * `companyId` (String) - Công ty ghi nhận
* **Trường tùy chọn:** `contractId` (String), `supplierId` (String)
* **Foreign key:** `wbsItemId` -> `WBSItem`, `projectId` -> `Project`, `companyId` -> `Company`
* **Nguồn chứng cứ:** `prisma/schema.prisma` (model CostRecord)

### 16. Nhóm dữ liệu: Ghi nhận Doanh thu (Revenue)
* **Model liên quan:** `Revenue`
* **API route liên quan:** `GET/POST /api/revenues`
* **UI/Màn hình:** `/billing/invoices` (Phần ghi nhận doanh thu thực hiện)
* **Trường bắt buộc (Schema):**
  * `amount` (Decimal) - Số tiền doanh thu
  * `occurredAt` (Date) - Ngày phát sinh doanh thu
  * `projectId` (String) - Mã dự án
  * `companyId` (String) - Mã công ty ghi nhận
* **Trường tùy chọn:** `contractId` (String)
* **Foreign key:** `projectId` -> `Project`, `companyId` -> `Company`, `contractId` -> `Contract`
* **Nguồn chứng cứ:** `prisma/schema.prisma` (model Revenue)

### 17. Nhóm dữ liệu: Tạm ứng (AdvanceRequest)
* **Model liên quan:** `AdvanceRequest`
* **API route liên quan:** `GET/POST /api/finance/advances`
* **UI/Màn hình:** `/finance/advances` (Tạm ứng công trình)
* **Trường bắt buộc (Schema):**
  * `requestNumber` (String, Unique) - Số phiếu đề nghị tạm ứng
  * `amount` (Decimal) - Số tiền tạm ứng
  * `requestDate` (Date) - Ngày tạm ứng
  * `requesterId` (String) - Người đề nghị
  * `projectId` (String) - Dự án tạm ứng
  * `companyId` (String) - Công ty thực hiện
* **Trường tùy chọn:** `purpose` (String)
* **Foreign key:** `requesterId` -> `User`, `projectId` -> `Project`, `companyId` -> `Company`
* **Nguồn chứng cứ:** `prisma/schema.prisma` (model AdvanceRequest)

### 18. Nhóm dữ liệu: Hoàn ứng & Đối trừ (AdvanceSettlement)
* **Model liên quan:** `AdvanceSettlement`
* **API route liên quan:** `GET/POST /api/finance/advances/settlements`
* **UI/Màn hình:** `/finance/advances/settlements` (Hoàn ứng/Đối trừ chi phí)
* **Trường bắt buộc (Schema):**
  * `settlementNumber` (String, Unique) - Số chứng từ hoàn ứng
  * `amount` (Decimal) - Số tiền hoàn ứng
  * `settledDate` (Date) - Ngày hoàn ứng
  * `advanceRequestId` (String) - Mã phiếu tạm ứng đối trừ
  * `companyId` (String) - Mã công ty thực hiện
* **Trường tùy chọn:** `costRecordId` (String - Liên kết chi phí thực tế)
* **Foreign key:** `advanceRequestId` -> `AdvanceRequest`, `companyId` -> `Company`, `costRecordId` -> `CostRecord`
* **Nguồn chứng cứ:** `prisma/schema.prisma` (model AdvanceSettlement)

### 19. Nhóm dữ liệu: Phiếu nhập xuất kho (InventoryDocument & InventoryDocumentLine)
* **Model liên quan:** `InventoryDocument`, `InventoryDocumentLine`
* **API route liên quan:** `GET/POST /api/inventory/documents`
* **UI/Màn hình:** `/inventory/documents` (Phiếu nhập/xuất kho)
* **Trường bắt buộc (Schema):**
  * `documentNumber` (String, Unique) - Số phiếu nhập/xuất
  * `type` (Enum InventoryDocType) - Loại phiếu (RECEIPT/ISSUE)
  * `documentDate` (Date) - Ngày nhập xuất
  * `warehouseId` (String) - Mã kho thực hiện
  * `companyId` (String) - Mã công ty quản lý
  * `InventoryDocumentLine.materialItemId` (String) - Mã vật tư
  * `InventoryDocumentLine.quantity` (Decimal) - Số lượng
  * `InventoryDocumentLine.unitPrice` (Decimal) - Đơn giá nhập/xuất
* **Enum hợp lệ:** `RECEIPT`, `ISSUE`
* **Foreign key:** `warehouseId` -> `Warehouse`, `companyId` -> `Company`, `materialItemId` -> `MaterialItem`
* **Nguồn chứng cứ:** `prisma/schema.prisma` (model InventoryDocument, InventoryDocumentLine)

### 20. Nhóm dữ liệu: Bút toán thủ công (JournalEntry & TransactionLine)
* **Model liên quan:** `JournalEntry`, `TransactionLine`
* **API route liên quan:** `GET/POST /api/accounting/journal-entries`
* **UI/Màn hình:** `/accounting/journal` (Ghi sổ nhật ký chung)
* **Trường bắt buộc (Schema):**
  * `entryNumber` (String, Unique) - Số bút toán
  * `postingDate` (Date) - Ngày ghi sổ
  * `companyId` (String) - Công ty ghi nhận
  * `TransactionLine.accountId` (String) - Mã tài khoản LedgerAccount
  * `TransactionLine.debit` (Decimal) - Phát sinh Nợ
  * `TransactionLine.credit` (Decimal) - Phát sinh Có
* **Foreign key:** `companyId` -> `Company`, `accountId` -> `LedgerAccount`
* **Nguồn chứng cứ:** `prisma/schema.prisma` (model JournalEntry, TransactionLine)

---

## PHẦN 2 — BẢN ĐỒ DỮ LIỆU ĐẦU VÀO ĐẦY ĐỦ

| STT | Nhóm dữ liệu cần nhập | Mục đích | Model/Bảng liên quan | Màn hình liên quan | API liên quan | Trường bắt buộc | Trường tùy chọn | Trường tự sinh | Dữ liệu phụ thuộc | Nhập trước | Unique/Mã bắt buộc | Enum/Trạng thái | Ảnh hưởng | Cần file? | Cần duyệt? | Tự sinh bút toán? | Nguồn chứng cứ | Ghi chú rủi ro |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Công ty | Thiết lập chủ thể pháp nhân | `Company` | `/settings` | `/api/accounting-core` | `code`, `name` | `taxCode`, `address` | `id`, `createdAt`, `updatedAt` | Không | Không | `code` (Unique) | Không | Báo cáo tài chính, Dashboard | Không | Không | Không | `schema.prisma:model Company` | Nhập sai MST ảnh hưởng báo cáo thuế |
| 2 | Chi nhánh | Phân nhóm quản lý nội bộ | `Branch` | `/settings` | `/api/accounting-core` | `code`, `name`, `companyId` | `address` | `id` | `Company` | Công ty | `code` (Unique) | Không | Báo cáo chi nhánh | Không | Không | Không | `schema.prisma:model Branch` | Chi nhánh mồ côi nếu xóa Company |
| 3 | Người dùng | Phân quyền đăng nhập & duyệt | `User` | `/settings/users` | `/api/auth/session` | `email`, `role` | `name`, `companyId` | `id` | `Company` | Công ty | `email` (Unique) | `ADMIN`, `SUPER_ADMIN`, `CFO`, `MANAGER`, `ACCOUNTANT`, `VIEWER` | Nhật ký hoạt động, phê duyệt | Không | Không | Không | `schema.prisma:model User` | Mất quyền Super Admin gây khóa hệ thống |
| 4 | TK kế toán | Định khoản nghiệp vụ tài chính | `LedgerAccount` | `/settings/accounts` | `/api/accounting/accounts` | `code`, `name`, `type` | `parentId`, `isActive` | `id` | Không | Không | `code` (Unique) | `ASSET`, `LIABILITY`, `EQUITY`, `INCOME`, `EXPENSE` | Sổ cái, Cân đối phát sinh | Không | Không | Không | `schema.prisma:model LedgerAccount` | Sai tính chất tài khoản gây lệch Nợ/Có |
| 5 | Kỳ kế toán | Khóa sổ, chặn ghi dữ liệu quá hạn | `FiscalYear`, `AccountingPeriod` | `/settings/periods` | `/api/fiscal-periods` | `year`, `companyId`, `month`, `periodNumber` | Không | `id` | `Company` | Công ty | `year`, `month` | `OPEN`, `CLOSED` | Khóa sổ kỳ kế toán | Không | Không | Không | `schema.prisma:model FiscalYear` | Ghi sổ ngoài kỳ mở gây sai lệch kỳ |
| 6 | Nhà cung cấp | Quản lý công nợ, giao dịch mua | `Supplier` | `/procurement/suppliers` | `/api/procurement` | `code`, `name` | `description` | `id` | Không | Không | `code` (Unique) | Không | Công nợ AP, Chi phí | Không | Không | Không | `schema.prisma:model Supplier` | Trùng mã nhà cung cấp khi import |
| 7 | Dự án | Quản lý độc lập doanh thu, chi phí | `Project` | `/projects` | `/api/projects` | `code`, `name`, `companyId` | `address`, `status` | `id` | `Company` | Công ty | `code` (Unique) | `PLANNING`, `ACTIVE`, `COMPLETED`, `ON_HOLD`, `CANCELLED` | Lãi lỗ công trình, Báo cáo dự án | Không | Không | Không | `schema.prisma:model Project` | Không gắn đúng công ty chủ quản |
| 8 | Hạng mục WBS | Chi tiết hóa đầu việc công trình | `WBSItem` | `/projects/[id]/wbs` | `/api/projects/[id]/wbs` | `code`, `name`, `projectId` | `parentId` | `id` | `Project` | Dự án | Không | Không | Phân bổ chi phí công trình | Không | Không | Không | `schema.prisma:model WBSItem` | Sai cấu trúc cây WBS gây lỗi tổng hợp |
| 9 | Dự toán | Kiểm soát giới hạn chi tiêu dự án | `BudgetRecord` | `/projects/[id]/budget` | `/api/projects/[id]/budgets` | `wbsItemId`, `amount`, `year` | Không | `id` | `WBSItem` | Hạng mục WBS | Không | Không | Cảnh báo vượt ngân sách | Không | Không | Không | `schema.prisma:model BudgetRecord` | Nhập vượt định mức thực tế |
| 10 | Vật tư | Quản lý danh mục hàng hóa, kho | `MaterialItem` | `/inventory/items` | `/api/inventory/items` | `code`, `name`, `unit` | `description` | `id` | Không | Không | `code` (Unique) | Không | Báo cáo tồn kho, xuất nhập kho | Không | Không | Không | `schema.prisma:model MaterialItem` | Trùng mã vật tư gây sai số lượng tồn |
| 11 | Danh mục kho | Quản lý địa điểm lưu trữ | `Warehouse` | `/inventory/warehouses` | `/api/inventory/warehouses` | `code`, `name`, `companyId` | `address` | `id` | `Company` | Công ty | `code` (Unique) | Không | Thẻ kho, Báo cáo tồn kho | Không | Không | Không | `schema.prisma:model Warehouse` | Gán sai chi nhánh quản lý kho |
| 12 | Hợp đồng | Cơ sở pháp lý cho công nợ, chi phí | `Contract` | `/contracts` | `/api/contracts` | `contractNumber`, `name`, `type`, `totalAmount`, `projectId`, `companyId` | `supplierId` | `id` | `Project`, `Company`, `Supplier` | Dự án, Công ty, Nhà cung cấp | `contractNumber` (Unique) | `CUSTOMER`, `VENDOR`, `SUBCONTRACT` | Công nợ hợp đồng, Lãi lỗ | Có | Không | Không | `schema.prisma:model Contract` | Sai giá trị hợp đồng gây lệch công nợ |
| 13 | Hóa đơn | Xác nhận doanh thu/chi phí thực tế | `Invoice` | `/billing/invoices` | `/api/billing/invoices` | `invoiceNumber`, `issueDate`, `totalAmount`, `taxAmount`, `companyId`, `contractId` | Không | `id` | `Company`, `Contract` | Công ty, Hợp đồng | `invoiceNumber` (Unique) | Không | Công nợ hóa đơn, Báo cáo thuế | Có | Không | Có | `schema.prisma:model Invoice` | Ngày hóa đơn sai kỳ kế toán |
| 14 | Thanh toán | Thanh toán công nợ, chi tiền mặt/NH | `Payment` | `/billing/payments` | `/api/billing/payments` | `paymentNumber`, `paymentDate`, `amount`, `companyId` | `contractId`, `invoiceId` | `id` | `Company`, `Contract`, `Invoice` | Công ty, Hợp đồng, Hóa đơn | `paymentNumber` (Unique) | Không | Dòng tiền, Báo cáo quỹ | Có | Không | Có | `schema.prisma:model Payment` | Số tiền thanh toán vượt hóa đơn |
| 15 | Chi phí | Ghi nhận chi phí thực tế cho dự án | `CostRecord` | `/costs` | `/api/costs` | `amount`, `occurredAt`, `wbsItemId`, `projectId`, `companyId` | `contractId`, `supplierId` | `id` | `WBSItem`, `Project`, `Company` | Hạng mục WBS, Dự án, Công ty | Không | Không | Báo cáo chi phí dự án | Có | Không | Không | `schema.prisma:model CostRecord` | Không gán WBS gây mồ côi chi phí |
| 16 | Doanh thu | Ghi nhận doanh thu xây dựng thực tế | `Revenue` | `/billing/invoices` | `/api/revenues` | `amount`, `occurredAt`, `projectId`, `companyId` | `contractId` | `id` | `Project`, `Company` | Dự án, Công ty | Không | Không | Doanh thu dự án | Có | Không | Không | `schema.prisma:model Revenue` | Ghi nhận sai thời điểm phát sinh |
| 17 | Tạm ứng | Xuất quỹ tạm ứng cho nhân viên/tổ | `AdvanceRequest` | `/finance/advances` | `/api/finance/advances` | `requestNumber`, `amount`, `requestDate`, `requesterId`, `projectId`, `companyId` | `purpose` | `id` | `User`, `Project`, `Company` | Người dùng, Dự án, Công ty | `requestNumber` (Unique) | Không | Công nợ tạm ứng | Có | Có | Có | `schema.prisma:model AdvanceRequest` | Thiếu người chịu trách nhiệm hoàn ứng |
| 18 | Hoàn ứng | Đối trừ công nợ tạm ứng | `AdvanceSettlement` | `/finance/advances/settlements` | `/api/finance/advances/settlements` | `settlementNumber`, `amount`, `settledDate`, `advanceRequestId`, `companyId` | `costRecordId` | `id` | `AdvanceRequest`, `Company` | Phiếu tạm ứng, Công ty | `settlementNumber` (Unique) | Không | Tất toán tạm ứng | Có | Có | Có | `schema.prisma:model AdvanceSettlement` | Hoàn ứng vượt số tiền đã tạm ứng |
| 19 | Nhập xuất kho | Ghi nhận luân chuyển vật tư | `InventoryDocument` | `/inventory/documents` | `/api/inventory/documents` | `documentNumber`, `type`, `documentDate`, `warehouseId`, `companyId`, `lines` | Không | `id` | `Warehouse`, `Company`, `MaterialItem` | Kho, Công ty, Vật tư | `documentNumber` (Unique) | `RECEIPT`, `ISSUE` | Báo cáo tồn kho, Chi phí NVL | Có | Có | Có | `schema.prisma:model InventoryDocument` | Tồn kho bị âm khi xuất kho |
| 20 | Bút toán | Điều chỉnh số liệu sổ cái thủ công | `JournalEntry` | `/accounting/journal` | `/api/accounting/journal-entries` | `entryNumber`, `postingDate`, `companyId`, `lines` | Không | `id` | `Company`, `LedgerAccount` | Công ty, Tài khoản | `entryNumber` (Unique) | Không | Sổ nhật ký chung, Sổ cái | Không | Không | Có | `schema.prisma:model JournalEntry` | Bút toán không cân Nợ = Có |

---

## PHẦN 3 — THỨ TỰ NHẬP DỮ LIỆU THẬT & PHỤ THUỘC

Dựa trên quan hệ khóa ngoại (Foreign Key) trong Prisma Schema và logic API validation, thứ tự nhập dữ liệu bắt buộc phải tuân theo 4 giai đoạn sau:

### Giai đoạn 1: Thiết lập Danh mục nền (System Setup)
*   **Thứ tự:** `Company` -> `Branch` -> `User` -> `LedgerAccount` -> `FiscalYear` & `AccountingPeriod`.
*   **Lý do bắt buộc:** Các bảng sau đều yêu cầu `companyId` hoặc `userId`. Nếu thiếu các bảng này, API sẽ báo lỗi khóa ngoại (`Foreign key constraint failed`).
*   **Rủi ro nếu thiếu:** Không thể tạo bất kỳ thực thể nào khác vì tất cả đều bắt buộc tham chiếu tới `Company`.

### Giai đoạn 2: Thiết lập Danh mục nghiệp vụ (Master Data)
*   **Thứ tự:** `Supplier` -> `MaterialItem` -> `Warehouse` (yêu cầu `Company`).
*   **Lý do bắt buộc:** Vật tư và kho là thông tin bắt buộc để làm chứng từ nhập xuất. Nhà cung cấp là thông tin bắt buộc để thiết lập hợp đồng mua bán/thầu phụ.

### Giai đoạn 3: Thiết lập cấu trúc Công trình (Project & WBS)
*   **Thứ tự:** `Project` (yêu cầu `Company`) -> `WBSItem` (yêu cầu `Project`) -> `BudgetRecord` (yêu cầu `WBSItem`).
*   **Lý do bắt buộc:** WBS là gốc để gán chi phí thực tế. Dự toán (`BudgetRecord`) giúp hệ thống kiểm soát ngân sách.
*   **Rủi ro nếu thiếu:** Màn hình Hồ sơ công trình và Quản lý ngân sách sẽ trống, không thể ghi nhận chi phí phát sinh cho công trình.

### Giai đoạn 4: Nhập chứng từ phát sinh (Transactions)
*   **Thứ tự:** `Contract` -> `Invoice` -> `Payment` -> `CostRecord` & `Revenue` -> `AdvanceRequest` -> `AdvanceSettlement` -> `InventoryDocument` -> `JournalEntry`.
*   **Lý do bắt buộc:** Chứng từ thanh toán (`Payment`) và Hóa đơn (`Invoice`) yêu cầu `Contract`. Hoàn ứng (`AdvanceSettlement`) yêu cầu `AdvanceRequest`.
*   **Rủi ro nếu thiếu:** Toàn bộ báo cáo tài chính, báo cáo dòng tiền và công nợ sẽ không có số liệu.

---


---

## PHẦN 5 — CẤU TRÚC CHI TIẾT CÁC SHEET EXCEL CẦN CHUẨN BỊ

Dưới đây là cấu trúc định dạng chuẩn của 19 sheet dữ liệu Excel cần chuẩn bị để nhập liệu. Tuyệt đối không viết rút gọn hoặc bỏ qua bất kỳ trường nào.

### Sheet 1: DM_CongTy
* **Mục đích:** Khai báo danh mục các công ty (pháp nhân)
* **Model/API đích:** `Company` / `/api/accounting-core`
* **Cột dữ liệu:**
  1. `MaCongTy` (DB: `code` | Kiểu: String | Bắt buộc: ✅ | Unique: ✅ | Ghi chú: Mã unique, VD: `CTY-XD-SO2-HN`)
  2. `TenCongTy` (DB: `name` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tên đầy đủ)
  3. `MaSoThue` (DB: `taxCode` | Kiểu: String | Bắt buộc: ❌ | Unique: ❌ | Ghi chú: MST doanh nghiệp)
  4. `DiaChi` (DB: `address` | Kiểu: String | Bắt buộc: ❌ | Unique: ❌ | Ghi chú: Địa chỉ đăng ký kinh doanh)

### Sheet 2: DM_ChiNhanh
* **Mục đích:** Khai báo danh mục chi nhánh trực thuộc các công ty
* **Model/API đích:** `Branch` / `/api/accounting-core`
* **Cột dữ liệu:**
  1. `MaChiNhanh` (DB: `code` | Kiểu: String | Bắt buộc: ✅ | Unique: ✅ | Ghi chú: VD: `CN-HN`)
  2. `TenChiNhanh` (DB: `name` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tên chi nhánh)
  3. `MaCongTy` (DB: `company.code` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `MaCongTy` ở Sheet 1)
  4. `DiaChiCN` (DB: `address` | Kiểu: String | Bắt buộc: ❌ | Unique: ❌ | Ghi chú: Địa chỉ chi nhánh)

### Sheet 3: DM_NguoiDung
* **Mục đích:** Đăng ký tài khoản người dùng và phân vai trò truy cập
* **Model/API đích:** `User` / `/api/auth/session`
* **Cột dữ liệu:**
  1. `Email` (DB: `email` | Kiểu: String | Bắt buộc: ✅ | Unique: ✅ | Ghi chú: Email hợp lệ đăng nhập)
  2. `HoTen` (DB: `name` | Kiểu: String | Bắt buộc: ❌ | Unique: ❌ | Ghi chú: Họ và tên người dùng)
  3. `VaiTro` (DB: `role` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Giá trị: `ADMIN`/`SUPER_ADMIN`/`CFO`/`MANAGER`/`ACCOUNTANT`/`VIEWER`)
  4. `MaCongTy` (DB: `company.code` | Kiểu: String | Bắt buộc: ❌ | Unique: ❌ | Ghi chú: Tham chiếu `MaCongTy` ở Sheet 1)

### Sheet 4: DM_KyKeToan
* **Mục đích:** Mở/khai báo các năm tài chính và tháng/kỳ kế toán tương ứng
* **Model/API đích:** `FiscalYear` & `AccountingPeriod` / `/api/fiscal-periods`
* **Cột dữ liệu:**
  1. `NamTaiChinh` (DB: `year` | Kiểu: Int | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Năm tài chính, VD: `2026`)
  2. `MaCongTy` (DB: `company.code` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `MaCongTy` ở Sheet 1)
  3. `ThangKy` (DB: `month` | Kiểu: String | Bắt buộc: ✅ | Unique: ✅ | Ghi chú: Định dạng YYYY-MM, VD: `2026-01`)
  4. `SoThuTuKy` (DB: `periodNumber` | Kiểu: Int | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Từ 1 đến 12)
  5. `TrangThai` (DB: `status` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: `OPEN` hoặc `CLOSED`)

### Sheet 5: DM_TaiKhoan
* **Mục đích:** Bổ sung/sửa đổi hệ thống tài khoản kế toán trong danh mục gốc
* **Model/API đích:** `LedgerAccount` / `/api/accounting/accounts`
* **Cột dữ liệu:**
  1. `SoHieuTK` (DB: `code` | Kiểu: String | Bắt buộc: ✅ | Unique: ✅ | Ghi chú: Số hiệu tài khoản, VD: `1111`)
  2. `TenTK` (DB: `name` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tên tài khoản chi tiết)
  3. `LoaiTK` (DB: `type` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Giá trị: `ASSET`/`LIABILITY`/`EQUITY`/`INCOME`/`EXPENSE`)
  4. `MaTKCha` (DB: `parent.code` | Kiểu: String | Bắt buộc: ❌ | Unique: ❌ | Ghi chú: Tham chiếu `SoHieuTK` cha nếu có)

### Sheet 6: DM_NhaCungCap
* **Mục đích:** Danh sách các nhà thầu, nhà cung cấp vật tư/dịch vụ
* **Model/API đích:** `Supplier` / `/api/procurement`
* **Cột dữ liệu:**
  1. `MaNCC` (DB: `code` | Kiểu: String | Bắt buộc: ✅ | Unique: ✅ | Ghi chú: Mã viết tắt, VD: `NCC-THEP-HOAPHAT`)
  2. `TenNCC` (DB: `name` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tên đầy đủ công ty cung cấp)
  3. `MoTa` (DB: `description` | Kiểu: String | Bắt buộc: ❌ | Unique: ❌ | Ghi chú: Địa chỉ, SĐT, Người liên hệ)

### Sheet 7: DM_VatTu
* **Mục đích:** Khai báo danh mục vật tư, nguyên nhiên vật liệu trong kho
* **Model/API đích:** `MaterialItem` / `/api/inventory/items`
* **Cột dữ liệu:**
  1. `MaVatTu` (DB: `code` | Kiểu: String | Bắt buộc: ✅ | Unique: ✅ | Ghi chú: Mã vật tư, VD: `CAT-VANG-XD`)
  2. `TenVatTu` (DB: `name` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tên chi tiết)
  3. `DonViTinh` (DB: `unit` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Đơn vị đo lường, VD: `m3`, `kg`, `tấn`)
  4. `MoTa` (DB: `description` | Kiểu: String | Bắt buộc: ❌ | Unique: ❌ | Ghi chú: Thông số kỹ thuật)

### Sheet 8: DM_Kho
* **Mục đích:** Khai báo danh sách các kho của doanh nghiệp/dự án
* **Model/API đích:** `Warehouse` / `/api/inventory/warehouses`
* **Cột dữ liệu:**
  1. `MaKho` (DB: `code` | Kiểu: String | Bắt buộc: ✅ | Unique: ✅ | Ghi chú: Mã kho, VD: `KHO-CT-HOANGMAI`)
  2. `TenKho` (DB: `name` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tên kho chi tiết)
  3. `MaCongTy` (DB: `company.code` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `MaCongTy` ở Sheet 1)
  4. `DiaChiKho` (DB: `address` | Kiểu: String | Bắt buộc: ❌ | Unique: ❌ | Ghi chú: Địa chỉ vật lý của kho)

### Sheet 9: DM_DuAn
* **Mục đích:** Khai báo danh sách các công trình, dự án xây dựng đang/sắp thi công
* **Model/API đích:** `Project` / `/api/projects`
* **Cột dữ liệu:**
  1. `MaDuAn` (DB: `code` | Kiểu: String | Bắt buộc: ✅ | Unique: ✅ | Ghi chú: Mã dự án, VD: `DA-NHAXUONG-A`)
  2. `TenDuAn` (DB: `name` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tên dự án đầy đủ)
  3. `MaCongTy` (DB: `company.code` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `MaCongTy` ở Sheet 1)
  4. `DiaChiDA` (DB: `address` | Kiểu: String | Bắt buộc: ❌ | Unique: ❌ | Ghi chú: Địa điểm thi công)
  5. `TrangThaiDA` (DB: `status` | Kiểu: String | Bắt buộc: ❌ | Unique: ❌ | Ghi chú: `PLANNING`/`ACTIVE`/`COMPLETED`/`ON_HOLD`/`CANCELLED`)

### Sheet 10: DM_WBS
* **Mục đích:** Định nghĩa cấu trúc phân rã công việc (hạng mục/đầu việc) của dự án
* **Model/API đích:** `WBSItem` / `/api/projects/[id]/wbs`
* **Cột dữ liệu:**
  1. `MaWBS` (DB: `code` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Mã hạng mục, unique trong phạm vi dự án, VD: `WBS-MONG-01`)
  2. `TenWBS` (DB: `name` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tên hạng mục công việc)
  3. `MaDuAn` (DB: `project.code` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `MaDuAn` ở Sheet 9)
  4. `MaWBSCha` (DB: `parent.code` | Kiểu: String | Bắt buộc: ❌ | Unique: ❌ | Ghi chú: Tham chiếu `MaWBS` cha trong cùng dự án)

### Sheet 11: DM_DuToan
* **Mục đích:** Khai báo giá trị dự toán/ngân sách được duyệt cho từng hạng mục công việc
* **Model/API đích:** `BudgetRecord` / `/api/projects/[id]/budgets`
* **Cột dữ liệu:**
  1. `MaDuAn` (DB: `project.code` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `MaDuAn` ở Sheet 9)
  2. `MaWBS` (DB: `wbsItem.code` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `MaWBS` ở Sheet 10)
  3. `SoTienDuToan` (DB: `amount` | Kiểu: Decimal | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Số tiền dự toán được cấp)
  4. `NamNganSach` (DB: `year` | Kiểu: Int | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Năm áp dụng, VD: `2026`)

### Sheet 12: DM_HopDong
* **Mục đích:** Quản lý thông tin hợp đồng đã ký với chủ đầu tư hoặc nhà cung cấp
* **Model/API đích:** `Contract` / `/api/contracts`
* **Cột dữ liệu:**
  1. `SoHopDong` (DB: `contractNumber` | Kiểu: String | Bắt buộc: ✅ | Unique: ✅ | Ghi chú: Số hiệu hợp đồng thực tế, VD: `HD-01/2026/CTD-SO2`)
  2. `TenHopDong` (DB: `name` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tên hợp đồng)
  3. `LoaiHopDong` (DB: `type` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Giá trị: `CUSTOMER`/`VENDOR`/`SUBCONTRACT`)
  4. `GiaTriHopDong` (DB: `totalAmount` | Kiểu: Decimal | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Số tiền hợp đồng trước thuế)
  5. `MaDuAn` (DB: `project.code` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `MaDuAn` ở Sheet 9)
  6. `MaCongTy` (DB: `company.code` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `MaCongTy` ở Sheet 1)
  7. `MaNCC` (DB: `supplier.code` | Kiểu: String | Bắt buộc: ❌ | Unique: ❌ | Ghi chú: Tham chiếu `MaNCC` ở Sheet 6 nếu là hợp đồng mua)

### Sheet 13: DM_HoaDon
* **Mục đích:** Ghi nhận thông tin hóa đơn giá trị gia tăng mua vào/bán ra phát sinh
* **Model/API đích:** `Invoice` / `/api/billing/invoices`
* **Cột dữ liệu:**
  1. `SoHoaDon` (DB: `invoiceNumber` | Kiểu: String | Bắt buộc: ✅ | Unique: ✅ | Ghi chú: Số hóa đơn đỏ thực tế)
  2. `NgayPhatHanh` (DB: `issueDate` | Kiểu: Date | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Định dạng YYYY-MM-DD)
  3. `TienTruocThue` (DB: `totalAmount` | Kiểu: Decimal | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Số tiền gốc)
  4. `TienThueVAT` (DB: `taxAmount` | Kiểu: Decimal | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Số tiền thuế)
  5. `MaCongTy` (DB: `company.code` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `MaCongTy` ở Sheet 1)
  6. `SoHopDong` (DB: `contract.contractNumber` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `SoHopDong` ở Sheet 12)

### Sheet 14: DM_ThanhToan
* **Mục đích:** Nhập chứng từ thanh toán/chi tiền mặt/ngân hàng liên quan đến công nợ hợp đồng
* **Model/API đích:** `Payment` / `/api/billing/payments`
* **Cột dữ liệu:**
  1. `SoChungTuChi` (DB: `paymentNumber` | Kiểu: String | Bắt buộc: ✅ | Unique: ✅ | Ghi chú: Số chứng từ chi tiền)
  2. `NgayThanhToan` (DB: `paymentDate` | Kiểu: Date | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Định dạng YYYY-MM-DD)
  3. `SoTienChi` (DB: `amount` | Kiểu: Decimal | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Số tiền thực chi)
  4. `MaCongTy` (DB: `company.code` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `MaCongTy` ở Sheet 1)
  5. `SoHopDong` (DB: `contract.contractNumber` | Kiểu: String | Bắt buộc: ❌ | Unique: ❌ | Ghi chú: Tham chiếu `SoHopDong` ở Sheet 12)
  6. `SoHoaDon` (DB: `invoice.invoiceNumber` | Kiểu: String | Bắt buộc: ❌ | Unique: ❌ | Ghi chú: Tham chiếu `SoHoaDon` ở Sheet 13 nếu chi trực tiếp cho hóa đơn)

### Sheet 15: DM_ChiPhi
* **Mục đích:** Ghi nhận chi phí phát sinh chi tiết của các công trình
* **Model/API đích:** `CostRecord` / `/api/costs`
* **Cột dữ liệu:**
  1. `SoTienChiPhi` (DB: `amount` | Kiểu: Decimal | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Số tiền chi phí phát sinh)
  2. `NgayPhatSinh` (DB: `occurredAt` | Kiểu: Date | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Định dạng YYYY-MM-DD)
  3. `MaDuAn` (DB: `project.code` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `MaDuAn` ở Sheet 9)
  4. `MaWBS` (DB: `wbsItem.code` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `MaWBS` ở Sheet 10)
  5. `MaCongTy` (DB: `company.code` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `MaCongTy` ở Sheet 1)
  6. `SoHopDong` (DB: `contract.contractNumber` | Kiểu: String | Bắt buộc: ❌ | Unique: ❌ | Ghi chú: Tham chiếu `SoHopDong` ở Sheet 12 nếu thuộc hợp đồng)
  7. `MaNCC` (DB: `supplier.code` | Kiểu: String | Bắt buộc: ❌ | Unique: ❌ | Ghi chú: Tham chiếu `MaNCC` ở Sheet 6 nếu liên kết thầu phụ/nhà cung cấp)

### Sheet 16: DM_TamUng
* **Mục đích:** Khai báo các khoản tạm ứng tiền cho cá nhân/tổ đội thi công công trình
* **Model/API đích:** `AdvanceRequest` / `/api/finance/advances`
* **Cột dữ liệu:**
  1. `SoPhieuTamUng` (DB: `requestNumber` | Kiểu: String | Bắt buộc: ✅ | Unique: ✅ | Ghi chú: Số phiếu đề nghị tạm ứng)
  2. `NgayTamUng` (DB: `requestDate` | Kiểu: Date | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Định dạng YYYY-MM-DD)
  3. `SoTienTamUng` (DB: `amount` | Kiểu: Decimal | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Số tiền mặt/ngân hàng)
  4. `EmailNguoiNhan` (DB: `requester.email` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `Email` ở Sheet 3)
  5. `MaDuAn` (DB: `project.code` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `MaDuAn` ở Sheet 9)
  6. `MaCongTy` (DB: `company.code` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `MaCongTy` ở Sheet 1)
  7. `LyDoTamUng` (DB: `purpose` | Kiểu: String | Bắt buộc: ❌ | Unique: ❌ | Ghi chú: Mục đích chi tiết)

### Sheet 17: DM_HoanUng
* **Mục đích:** Ghi nhận các chứng từ quyết toán/tất toán khoản tạm ứng kèm chi phí thực tế
* **Model/API đích:** `AdvanceSettlement` / `/api/finance/advances/settlements`
* **Cột dữ liệu:**
  1. `SoPhieuQuyetToan` (DB: `settlementNumber` | Kiểu: String | Bắt buộc: ✅ | Unique: ✅ | Ghi chú: Số phiếu quyết toán tạm ứng)
  2. `NgayQuyetToan` (DB: `settledDate` | Kiểu: Date | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Định dạng YYYY-MM-DD)
  3. `SoTienQuyetToan` (DB: `amount` | Kiểu: Decimal | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Số tiền được quyết toán đối trừ)
  4. `SoPhieuTamUng` (DB: `advanceRequest.requestNumber` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `SoPhieuTamUng` ở Sheet 16)
  5. `MaCongTy` (DB: `company.code` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `MaCongTy` ở Sheet 1)

### Sheet 18: DM_Kho_NhapXuat
* **Mục đích:** Nhập chi tiết các phiếu nhập kho/xuất kho vật tư
* **Model/API đích:** `InventoryDocument` & `InventoryDocumentLine` / `/api/inventory/documents`
* **Cột dữ liệu:**
  1. `SoPhieuKho` (DB: `documentNumber` | Kiểu: String | Bắt buộc: ✅ | Unique: ✅ | Ghi chú: Số chứng từ kho)
  2. `LoaiPhieu` (DB: `type` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Chỉ nhận giá trị: `RECEIPT` hoặc `ISSUE`)
  3. `NgayNhapXuat` (DB: `documentDate` | Kiểu: Date | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Định dạng YYYY-MM-DD)
  4. `MaKho` (DB: `warehouse.code` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `MaKho` ở Sheet 8)
  5. `MaCongTy` (DB: `company.code` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `MaCongTy` ở Sheet 1)
  6. `MaVatTu` (DB: `line.materialItem.code` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `MaVatTu` ở Sheet 7)
  7. `SoLuong` (DB: `line.quantity` | Kiểu: Decimal | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Số lượng vật tư luân chuyển)
  8. `DonGia` (DB: `line.unitPrice` | Kiểu: Decimal | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Đơn giá trước thuế)

### Sheet 19: DM_ButToan
* **Mục đích:** Ghi sổ các bút toán tổng hợp, điều chỉnh tài chính thủ công
* **Model/API đích:** `JournalEntry` & `TransactionLine` / `/api/accounting/journal-entries`
* **Cột dữ liệu:**
  1. `SoButToan` (DB: `entryNumber` | Kiểu: String | Bắt buộc: ✅ | Unique: ✅ | Ghi chú: Số hiệu bút toán nhật ký)
  2. `NgayGhiSo` (DB: `postingDate` | Kiểu: Date | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Định dạng YYYY-MM-DD)
  3. `MaCongTy` (DB: `company.code` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `MaCongTy` ở Sheet 1)
  4. `SoHieuTK` (DB: `line.account.code` | Kiểu: String | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Tham chiếu `SoHieuTK` ở Sheet 5)
  5. `PhatSinhNo` (DB: `line.debit` | Kiểu: Decimal | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Số tiền phát sinh Nợ)
  6. `PhatSinhCo` (DB: `line.credit` | Kiểu: Decimal | Bắt buộc: ✅ | Unique: ❌ | Ghi chú: Số tiền phát sinh Có)

---

## PHẦN 6 — XÁC ĐỊNH RỦI RO TRƯỚC KHI NHẬP DỮ LIỆU THẬT

Dưới đây là các rủi ro hệ thống đã được audit từ source code có khả năng gây lỗi dữ liệu hoặc crash tính toán:

1.  **Lỗi Kỳ kế toán bị đóng (AccountingPeriod Closed):**
    *   *Mô tả:* API `finance` và `billing` chặn hoàn toàn việc ghi nhận Invoice/Payment/CostRecord nếu ngày tháng nằm ngoài Kỳ kế toán đang mở (`status != OPEN`).
    *   *Nguồn:* `services/financial-aggregation.service.ts`
2.  **Lệch Bút toán (JournalEntry Imbalance):**
    *   *Mô tả:* Khi import bút toán thủ công hoặc hệ thống tự động sinh bút toán từ hóa đơn/thanh toán, tổng Nợ (`debit`) và tổng Có (`credit`) của toàn bộ các dòng thuộc cùng 1 bút toán phải khớp tuyệt đối. Nếu lệch 1 đồng, API sẽ trả về lỗi `400 Bad Request` và từ chối ghi sổ.
    *   *Nguồn:* `services/construction-accounting.service.ts`
3.  **Tồn kho âm (Negative Inventory):**
    *   *Mô tả:* Khi tạo phiếu xuất kho (`ISSUE`), hệ thống sẽ kiểm tra số lượng tồn tại thời điểm xuất của vật tư đó tại kho tương ứng. Nếu số lượng xuất lớn hơn tồn kho khả dụng, giao dịch sẽ bị chặn đứng để bảo toàn tính nhất quán.
    *   *Nguồn:* `services/inventory-document.service.ts`
4.  **Lỗi WBS mồ côi (Orphan WBSItem):**
    *   *Mô tả:* Nhập chi phí (`CostRecord`) hoặc dự toán (`BudgetRecord`) nhưng mã WBSItem không tồn tại hoặc thuộc một dự án khác. Hệ thống sẽ báo lỗi liên kết khóa ngoại.
5.  **Tạm ứng vượt hoàn ứng (Settlement exceeding Advance):**
    *   *Mô tả:* Hoàn ứng (`AdvanceSettlement`) có giá trị lớn hơn số tiền còn lại chưa quyết toán của phiếu tạm ứng gốc (`AdvanceRequest`).
    *   *Nguồn:* `services/advance-settlement.service.ts`

---

## PHẦN 7 — DANH SÁCH ĐIỂM CHƯA CHẮC CHẮN CẦN XÁC NHẬN

Dưới đây là các điểm cần xác nhận từ phía bạn (hoặc bộ phận kế toán thực tế) trước khi import dữ liệu thật:

1.  **Hệ thống tài khoản kế toán (53 tài khoản):** Đã đầy đủ và đúng với thông tư kế toán hiện hành của đơn vị chưa? Có cần import thêm tài khoản chi tiết (ví dụ: 1121, 1122...) hay không?
2.  **Tài khoản đăng nhập Super Admin thực tế:** Email `admin@construction.com` có cần đổi thành email cá nhân thực tế của Quản trị viên không?
3.  **Phê duyệt chứng từ:** Có bật tính năng yêu cầu phê duyệt thông qua màn hình Approval workflow trước khi tự động sinh bút toán kế toán không, hay cứ tạo chứng từ ở trạng thái `POSTED` là tự động ghi sổ?

---

## PHẦN 8 — KẾT LUẬN

*   **Đã nhập dữ liệu mới chưa:** ❌ KHÔNG.
*   **Đã seed dữ liệu mới chưa:** ❌ KHÔNG.
*   **Đã sửa schema/UI/code nghiệp vụ chưa:** ❌ KHÔNG.
*   **Đủ tạo bản nháp Excel template chưa:** CÓ.
*   **Đủ tạo Excel template cuối cùng chưa:** CHƯA.
*   **Đủ import dữ liệu thật chưa:** CHƯA.
*   **Lý do:** báo cáo hiện chỉ đủ để dựng bản nháp; template cuối vẫn cần khóa phạm vi giai đoạn 1, xác nhận các mapping nghiệp vụ chưa chắc chắn và chốt cách dùng các route nhập liệu.


---

# CẬP NHẬT AUDIT BỔ SUNG NGÀY 2026-06-05

Các kết luận trước đây về mức độ sẵn sàng đã được thay thế bằng kết luận ba mức: bản nháp template, template cuối cùng, và import dữ liệu thật.

## Link kiểm kê chi tiết

Hai bảng lớn đã được tách sang file phụ để tránh làm báo cáo chính quá khó đọc:

- [REAL_DATA_REQUIRED_INPUT_MODEL_ROUTE_INVENTORY.md](./REAL_DATA_REQUIRED_INPUT_MODEL_ROUTE_INVENTORY.md)
- [PHASE1_EXCEL_FINAL_MAPPING_DRAFT.md](./PHASE1_EXCEL_FINAL_MAPPING_DRAFT.md)
- [PHASE1_BUSINESS_DECISION_LOG.md](./PHASE1_BUSINESS_DECISION_LOG.md)
- Nội dung file phụ gồm **PHẦN BỔ SUNG A - KIỂM KÊ 97 PRISMA MODELS** và **PHẦN BỔ SUNG B - KIỂM KÊ 152 API ROUTES**.

Tóm tắt kiểm kê model: tổng 97; CÓ 23; TỰ SINH 20; KHÔNG 2; TÙY CHỌN 51; CHƯA RÕ 1.

Tóm tắt kiểm kê route sau khi dọn 2 route chưa rõ: tổng 152; nhập liệu 37; báo cáo/read-only 54; workflow/system/vận hành phụ trợ 61; chưa rõ 0. Hai route `/api/tasks` và `/api/tasks/:id` được phân loại lại là vận hành phụ trợ, không đưa vào Excel kế toán lõi giai đoạn 1; nguồn: `app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts`, `services/task.service.ts`.

## PHẠM VI EXCEL GIAI ĐOẠN 1 — IMPORT KẾ TOÁN LÕI

Chi tiết route đọc sâu và mapping từng cột nằm trong [PHASE1_EXCEL_FINAL_MAPPING_DRAFT.md](./PHASE1_EXCEL_FINAL_MAPPING_DRAFT.md). Phạm vi giai đoạn 1 chỉ dùng để thiết kế bản nháp và chốt template cuối, chưa dùng để import dữ liệu thật.

| STT | Sheet giai đoạn 1 | Model chính | Vai trò | Bắt buộc GĐ1 | Nguồn chứng cứ |
| --- | --- | --- | --- | --- | --- |
| 1 | `DM_CongTy` | `Company` | Master công ty | CÓ | `prisma/schema.prisma` model `Company`; `/api/accounting-core` |
| 2 | `DM_ChiNhanh` | `Branch` | Master chi nhánh | CÓ | `prisma/schema.prisma` model `Branch`; `/api/accounting-core` |
| 3 | `DM_NguoiDung` | `User` | Người dùng/owner/người tạo | CÓ | `prisma/schema.prisma` model `User`; auth/API user liên quan |
| 4 | `DM_TaiKhoanKeToan` | `LedgerAccount` | Hệ thống tài khoản | CÓ | `prisma/schema.prisma` model `LedgerAccount`; `services/voucher.service.ts` |
| 5 | `DM_KyKeToan` | `FiscalYear`, `AccountingPeriod` | Kỳ hạch toán và khóa kỳ | CÓ, cần xác nhận nguồn kỳ chính | `prisma/schema.prisma`; `lib/period.ts` |
| 6 | `DM_NhaCungCap_KhachHang` | `Supplier` | Đối tác phải trả; khách hàng/chủ đầu tư cần xác nhận | CÓ, nhưng khách hàng là điểm chưa chắc chắn | `prisma/schema.prisma` model `Supplier`, `Project.investor` |
| 7 | `DM_CongTrinh` | `Project` | Công trình/dự án | CÓ | `services/project.service.ts`; `lib/validations.ts` `createProjectSchema` |
| 8 | `DM_WBS` | `WBSItem` | Hạng mục/WBS | CÓ | `services/wbs.service.ts`; model `WBSItem` |
| 9 | `DM_DuToan` | `BudgetRecord` | Dự toán theo WBS/cost type | CÓ | `services/budget.service.ts`; model `BudgetRecord` |
| 10 | `DM_HopDong` | `Contract` | Hợp đồng gốc | CÓ | `services/contract.service.ts`; model `Contract` |
| 11 | `GD_HoaDon` | `Invoice` | Hóa đơn/công nợ | CÓ | `app/api/invoices/route.ts`; model `Invoice` |
| 12 | `GD_HoaDonThue` | `TaxInvoice` | Hóa đơn thuế/VAT | CÓ nếu dùng module thuế | `app/api/tax/invoices/route.ts`; `services/tax-invoice.service.ts` |
| 13 | `GD_ThanhToan` | `Payment` | Thanh toán gắn invoice/contract/project | CÓ | `services/payment.service.ts`; model `Payment` |
| 14 | `GD_PhieuThuChi` | `CashBankDocument` | Phiếu thu/chi ngân hàng/quỹ | CÓ nếu dùng cash-bank | `app/api/cash-bank/documents/route.ts`; `services/cash-bank.service.ts` |
| 15 | `GD_ChiPhi` | `CostRecord` | Chi phí trực tiếp | CÓ | `services/cost.service.ts`; model `CostRecord` |
| 16 | `GD_TamUng` | `AdvanceRequest` | Đề nghị tạm ứng | CÓ nếu có tạm ứng | `services/advance.service.ts`; model `AdvanceRequest` |
| 17 | `GD_HoanUng` | `AdvanceSettlement` | Hoàn ứng/quyết toán tạm ứng | CÓ nếu có tạm ứng | `services/advance-settlement.service.ts`; model `AdvanceSettlement` |
| 18 | `DM_VatTu` | `MaterialItem` | Danh mục vật tư dùng kho | CÓ nếu dùng kho | `services/inventory.service.ts`; model `MaterialItem` |
| 19 | `DM_Kho` | `Warehouse` | Kho | CÓ nếu dùng kho | `services/inventory.service.ts`; model `Warehouse` |
| 20 | `GD_Kho_NhapXuat` | `InventoryDocument`, `InventoryDocumentLine` | Phiếu nhập/xuất kho | CÓ nếu dùng kho | `app/api/inventory/documents/route.ts`; `services/inventory.service.ts` |
| 21 | `GD_ButToan_ThuCong` | `JournalEntry`, `TransactionLine` | Bút toán điều chỉnh thủ công | TÙY CHỌN, chỉ điều chỉnh/số dư | `app/api/accounting/vouchers/route.ts`; `services/voucher.service.ts` |

## PHẠM VI GIAI ĐOẠN 2 — KHÔNG ĐƯA VÀO TEMPLATE LÕI BAN ĐẦU

| Nhóm GĐ2 | Model liên quan | Vì sao chưa đưa vào GĐ1 | Khi nào cần đưa vào | Rủi ro nếu bỏ qua | Có cần sheet sau này |
| --- | --- | --- | --- | --- | --- |
| Mua hàng nâng cao | `PurchaseRequest`, `PurchaseOrder`, `PurchaseOrderItem`, `GoodsReceipt`, `Quotation` | Không phải dữ liệu kế toán lõi ban đầu nếu chưa chạy quy trình PR-PO-GR | Khi muốn kiểm soát mua hàng trước kho/chi phí | Không đối chiếu được yêu cầu mua - đơn mua - nhận hàng | CÓ |
| Thầu phụ chi tiết | `Subcontract`, `SubcontractItem`, `SubcontractInvoice`, `SubcontractProgress` | Có thể tạm theo `Contract` loại thầu phụ ở GĐ1 | Khi cần theo dõi tiến độ/khối lượng thầu phụ riêng | Thiếu phân tích công nợ/tiến độ thầu phụ | CÓ |
| Hiện trường/tiến độ | `SiteLog`, `ProgressEntry`, `Measurement`, `Activity`, `BaselineSchedule`, `DelayEvent` | Không bắt buộc để test kế toán lõi | Khi module tiến độ/hiện trường vận hành thật | Thiếu nguồn giải thích phát sinh chi phí/claim | CÓ |
| Nguồn lực | `ResourcePool`, `LaborCrew`, `CrewAssignment`, `EquipmentAsset`, `EquipmentAssignment`, `EquipmentBreakdown` | Không phải master kế toán lõi ban đầu | Khi tính chi phí nhân công/máy theo nguồn lực | Chi phí nguồn lực phải nhập thủ công qua CostRecord | CÓ |
| Phát sinh/thay đổi/claim | `ChangeRequest`, `ClaimRecord`, `Commitment`, `VariationOrder`, `ContractChange` | Chưa chốt quy trình VO/claim; `ContractChange` chỉ đưa GĐ1 nếu đang dùng | Khi cần quản lý phát sinh hợp đồng/claim | Hợp đồng và ngân sách không phản ánh biến động | CÓ |
| Tài liệu/workflow cấu hình | `Document`, `Comment`, `DocumentChecklist`, `ApprovalRequest`, `ApprovalStep`, `AuthorityMatrix`, `WorkflowDefinition` | Phần lớn là metadata/cấu hình hoặc tự sinh theo workflow | Khi cần import hồ sơ/chữ ký/phê duyệt cấu hình | Thiếu audit hồ sơ nếu chứng từ thật cần file đính kèm | CÓ cho cấu hình/document metadata |

## PHẦN BỔ SUNG C - ĐỐI CHIẾU NHÓM DỮ LIỆU VỚI MODEL

| Nhóm dữ liệu hiện tại | Model chính | Model con/phụ trợ liên quan | Model đã bị bỏ sót trước đó | Cần thêm sheet Excel không? | Nếu có, tên sheet đề xuất | Nếu không, lý do không cần | Rủi ro nếu bỏ qua |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Công ty/chi nhánh/người dùng | Company, Branch, User | OrganizationUnit, AuthorityMatrix | OrganizationUnit, AuthorityMatrix | CÓ | DM_DonViToChuc, DM_MaTranThamQuyen | Không nếu chưa phân quyền đa đơn vị/phê duyệt | Sai phân quyền, thiếu đơn vị tổ chức |
| Dự án/WBS/Dự toán | Project, WBSItem, BudgetRecord | BOQItem, BudgetVersion, ProjectSupplier | BOQItem, BudgetVersion, ProjectSupplier | CÓ/TÙY CHỌN | DM_BOQ, DM_PhienBanDuToan, DM_DoiTacDuAn | BOQ/version có thể để giai đoạn 2 | Thiếu kiểm soát dự toán chi tiết |
| Hợp đồng | Contract | ContractChange, Acceptance, PaymentPlan, DocumentChecklist | ContractChange, Acceptance, PaymentPlan, DocumentChecklist | CÓ | GD_DieuChinhHopDong, GD_NghiemThu, GD_KeHoachThanhToan | Không nếu chỉ import hợp đồng gốc | Thiếu hạn thanh toán/nghiệm thu/phụ lục |
| Hóa đơn/thuế | Invoice, TaxInvoice | Revenue, PaymentAllocation | TaxInvoice, PaymentAllocation | CÓ | GD_HoaDonThue | TaxInvoice nên tách sheet vì schema có series/template/partner tax | Sai VAT, công nợ lệch |
| Thanh toán/ngân hàng/quỹ | Payment, CashBankDocument | BankAccount, BankTransaction, BankStatement, PaymentBatch, TreasuryApproval, CashReservation | BankAccount, BankTransaction, BankStatement, PaymentBatch, TreasuryApproval, CashReservation | CÓ | DM_TaiKhoanNganHang, GD_PhieuThuChi, GD_SaoKeNganHang | Statement/batch có thể giai đoạn 2 | Dòng tiền và công nợ không đối soát |
| Chi phí/kho | CostRecord, InventoryDocument | InventoryDocumentLine, InventoryMovement, InventoryBalance, MaterialItem, Warehouse | InventoryMovement, InventoryBalance | KHÔNG cho movement/balance | - | Movement/balance tự sinh khi post chứng từ kho | Trùng chi phí nếu vừa nhập CostRecord vừa nhập phiếu kho/bút toán |
| Tạm ứng/hoàn ứng | AdvanceRequest, AdvanceSettlement | Payment, CostRecord, Invoice | - | KHÔNG | - | Đã có sheet chính | Hoàn ứng vượt tạm ứng |
| Mua hàng | PurchaseRequest, PurchaseOrder, PurchaseOrderItem, GoodsReceipt, Quotation | CostRecord, InventoryDocument | Toàn bộ nhóm mua hàng | CÓ/TÙY CHỌN | GD_MuaHang_* | Giai đoạn 2 nếu không chạy procurement | Không có kiểm soát PR-PO-GR |
| Thầu phụ | Subcontract, SubcontractItem, SubcontractInvoice, SubcontractProgress | Contract, PaymentPlan | Toàn bộ nhóm thầu phụ | CÓ/TÙY CHỌN | GD_ThauPhu_* | Giai đoạn 2 hoặc dùng Contract SUBCONTRACT ban đầu | Thiếu theo dõi tiến độ thầu phụ |
| Hiện trường/tiến độ/nguồn lực | SiteLog, ProgressEntry, Measurement, Activity, BaselineSchedule, DelayEvent, ResourcePool, LaborCrew, EquipmentAsset | CrewAssignment, EquipmentAssignment, EquipmentBreakdown, SiteConsumption | Toàn bộ nhóm | TÙY CHỌN | GD_TienDo_HienTruong, DM_NguonLuc | Không bắt buộc để import kế toán ban đầu | Thiếu dữ liệu vận hành thi công |
| Phát sinh/thay đổi/claim | ChangeRequest, ClaimRecord, Commitment, VariationOrder | ContractChange | Toàn bộ nhóm | TÙY CHỌN | GD_PhatSinhThayDoi | Giai đoạn 2 nếu chưa quản lý claim/VO | Không kiểm soát phát sinh ngoài hợp đồng |
| Tài liệu/workflow/system | Document, Comment, ApprovalRequest, ApprovalStep, WorkflowDefinition, ReadModel, DomainEvent, Job, Notification, AuditLog | DocumentChecklist, DelegationPolicy, DelegationWindow, SagaState | Nhiều model system/read model | TÙY CHỌN/KHÔNG | GD_TaiLieu_Workflow | ReadModel/DomainEvent/Job/Notification/AuditLog tự sinh | Thiếu trace chứng từ nếu không import Document metadata |


## PHẦN BỔ SUNG D - RÀ SOÁT VÀ BỔ SUNG CỘT NGHIỆP VỤ CHO EXCEL

Chưa tạo Excel. Bảng dưới chỉ là cấu trúc sheet sau rà soát. Mỗi cột cần được xác nhận lại bằng schema/API trước khi thành template cuối, đặc biệt các cột ghi "suy luận nghiệp vụ" hoặc "cần mở rộng schema".

| Sheet sau rà soát | Model/API đích | Cột nghiệp vụ cần có sau rà soát | Nguồn gốc/mapping/rủi ro |
| --- | --- | --- | --- |
| DM_CongTy | Company | code, name, taxCode, address | Có schema Company; chủ đầu tư/khách hàng dùng Project.investor hoặc Supplier/description nếu chưa mở rộng. |
| DM_ChiNhanh | Branch | code, name, companyId, address | Có schema Branch. |
| DM_NguoiDung | User | email, name, role, companyId | Có schema User. |
| DM_KyKeToan | FiscalYear, AccountingPeriod, FiscalPeriod | year, month, periodNumber, status/isLocked, reason | Có hai lớp kỳ; chưa chắc chắn cần cả hai khi import. |
| DM_TaiKhoan | LedgerAccount | code, name, type, parentId, isActive | Có schema. |
| DM_NhaCungCap_KhachHang | Supplier | code, name, description | Schema chỉ có Supplier; khách hàng/chủ đầu tư chưa có Customer model riêng, cần xác nhận. |
| DM_VatTu | MaterialItem | companyId, code, name, unit, group, inventoryAccount, expenseAccount, vatRate, defaultWarehouseId | Có schema MaterialItem; model Material legacy chưa chắc chắn. |
| DM_Kho | Warehouse | companyId, projectId, code, name, address, managerName | Có schema Warehouse. |
| DM_DuAn | Project | name, status, companyId, branchId, ownerId, investor, projectType, startDate, endDate, contractValue, totalBudget | Schema Project đoạn audit không thấy code; MaDuAn cần xác nhận mapping hoặc mở schema. |
| DM_WBS | WBSItem | projectId, code, name, parentId, level, sortOrder, budgetAmount | Có schema. |
| DM_DuToan | BudgetRecord, BOQItem, BudgetVersion | projectId, wbsId, costType, estimatedAmount, createdById | Schema BudgetRecord dùng estimatedAmount, không phải amount/year như báo cáo cũ. |
| DM_HopDong | Contract | contractNumber, name, type, totalAmount, projectId, companyId, supplierId, status, ngày ký/ngày hiệu lực/ngày kết thúc, VAT, điều khoản thanh toán, file hợp đồng | Một phần có schema; các cột ngày ký/điều khoản/file nếu thiếu field thì mapping note/description/Document hoặc cần mở schema sau. |
| GD_HoaDon | Invoice, TaxInvoice | invoiceType, invoiceNumber, invoiceSeries, invoiceTemplate, issuedDate/invoiceDate, dueDate, buyer/seller, netAmount, vatRate, vatAmount, grossAmount, status, note, attachment | TaxInvoice có series/template/partner tax; Invoice không có mẫu/ký hiệu hóa đơn. |
| GD_ThanhToan | Payment, PaymentAllocation, CashBankDocument | paymentType, documentNo, date, account, payer/payee, supplier/customer, contract, invoice, project, amount, description, status, attachment | CashBankDocument có documentNo/documentDate/accountingDate/debitAccountId/creditAccountId; một số cột là suy luận nghiệp vụ. |
| GD_ChiPhi | CostRecord | documentNo, date, costType, projectId, wbsId, supplier, contract, quantity, unitPrice, netAmount, vatRate, vatAmount, amount, expenseAccount, payable/cashAccount, requester, approvalStatus, attachment, note | Có nhiều field schema; tài khoản/attachment nếu thiếu field thì mapping JournalEntry/Document hoặc cần mở schema. |
| GD_DoanhThu | Revenue | date, amount, status, description, invoiceId, projectId, wbsId | Tùy chọn vì dễ trùng Invoice/TaxInvoice. |
| GD_TamUng | AdvanceRequest | recipient, recipientType, project, contract, amount, paidAmount, settledAmount, remainingAmount, expectedSettlementDate, purpose, settlementDoc, approvalStatus, attachment | Có schema AdvanceRequest; attachment mapping Document là suy luận nghiệp vụ. |
| GD_HoanUng | AdvanceSettlement | advanceRequestId, amount, settlementDate, invoiceId, costRecordId, paymentId, status, reason, attachment | Có schema. |
| GD_Kho_NhapXuat | InventoryDocument, InventoryDocumentLine | documentType, documentNo, documentDate, accountingDate, warehouse, project, wbs, material, quantity, unitCost, vatRate, amount, supplier, receiver/deliverer, attachment | Có schema; người nhận/giao và attachment nếu thiếu field thì dùng partnerName/description/Document. |
| GD_ButToan_ThuCong | JournalEntry, TransactionLine | entryNo/reference, date, description, debitAccount, creditAccount, amount, project, wbs, contract, sourceDocument, sourceType, postingStatus | Chỉ nhập điều chỉnh thủ công; tránh trùng bút toán tự sinh. |
| DM_TaiKhoanNganHang | BankAccount | accountNumber, bankName, currency, balance | Có schema BankAccount tại prisma/schema.prisma:1148; accountNumber unique. |
| GD_PhieuThuChi | CashBankDocument | documentType, documentNo, documentDate, accountingDate, amount, paymentMethod, partnerName, debitAccountId, creditAccountId, status | Có schema CashBankDocument. |
| GD_HoaDonThue | TaxInvoice | invoiceType, invoiceNumber, invoiceSeries, invoiceTemplate, invoiceDate, partnerName, partnerTaxCode, netAmount, vatRate, vatAmount, grossAmount, status | Có schema TaxInvoice. |
| GD_MuaHang | PurchaseRequest, PurchaseOrder, PurchaseOrderItem, GoodsReceipt, Quotation | PurchaseRequest: projectId, wbsId, title, description, requestedBy, status, totalAmount, requestDate, neededBy; PurchaseOrder: projectId, purchaseRequestId, poNumber, vendor, description, status, totalAmount, orderedDate, expectedDelivery; PurchaseOrderItem: purchaseOrderId, wbsId, description, quantity, unitPrice, amount, costType; GoodsReceipt: purchaseOrderId, projectId, receivedDate, notes, receivedById | Có schema tại prisma/schema.prisma:393, 416, 442, 460; Giai đoạn 2 hoặc import tùy chọn nếu quy trình mua hàng dùng trước kho/chi phí. |
| GD_ThauPhu | Subcontract, SubcontractItem, SubcontractInvoice, SubcontractProgress | Subcontract: projectId, supplierName, contractNumber, totalAmount, status, startDate, endDate; SubcontractInvoice: subcontractId, invoiceNumber, amount, invoiceDate, status; SubcontractItem: subcontractId, wbsId, description, quantity, unitPrice, amount; SubcontractProgress: subcontractItemId, progressPercent, amount, date | Có schema tại prisma/schema.prisma:835, 857, 872, 889; giai đoạn 2, hoặc tạm qua Contract type SUBCONTRACT nếu chưa dùng module thầu phụ riêng. |
| GD_TienDo_HienTruong | SiteLog, ProgressEntry, Measurement, Activity, BaselineSchedule, DelayEvent | Activity: projectId, wbsId, code, name, plannedStart, plannedFinish, actualStart, actualFinish, percentComplete, status, baselineId; BaselineSchedule: projectId, version, name, snapshotDate, isActive; DelayEvent: activityId, projectId, category, description, delayDays, startDate, endDate, impactCost, status; ProgressEntry/Measurement/SiteLog cần đối chiếu field trong kiểm kê model phụ | Có schema Activity/Baseline/Delay tại prisma/schema.prisma:1215, 1259, 1272; một số model hiện trường còn cần xác nhận route/UI. |
| DM_NguonLuc | ResourcePool, LaborCrew, EquipmentAsset | ResourcePool: projectId, name, type, capacity, costPerDay; LaborCrew: resourcePoolId, name, headCount, dailyRate, skillLevel, isActive; EquipmentAsset: resourcePoolId, code, name, type, dailyRate, status, fuelCostPerDay, lastMaintenance, nextMaintenance, totalDowntimeDays | Có schema tại prisma/schema.prisma:1309, 1322, 1350; giai đoạn 2 nếu cần quản lý nguồn lực thi công. |
| GD_PhatSinhThayDoi | ChangeRequest, ClaimRecord, Commitment, VariationOrder, ContractChange | ChangeRequest: projectId, title, description, type, status, costImpact, scheduleImpact, variationOrderId, requestedById, approvedById, approvedDate; ContractChange: contractId, voNumber, title, description, changeAmount, approvedDate, status; VariationOrder/ClaimRecord/Commitment xem chi tiết trong kiểm kê model phụ trước template cuối | Có schema ChangeRequest tại prisma/schema.prisma:1407 và ContractChange tại prisma/schema.prisma:509; một số model claim/commitment cần xác nhận route/UI. |
| GD_TaiLieu_Workflow | Document, Comment, DocumentChecklist, ApprovalRequest, ApprovalStep, AuthorityMatrix, WorkflowDefinition | Document: entityType, entityId, fileName/title nếu có, fileUrl/storage metadata nếu có trong schema; Comment: entityType/entityId/content/user; DocumentChecklist: contractId, name, status, note; WorkflowDefinition: companyId, name, entityType, isActive, version, definition; AuthorityMatrix: cấu hình thẩm quyền theo schema; ApprovalRequest/ApprovalStep chủ yếu tự sinh khi submit/approve | Có model Document tại prisma/schema.prisma:694, DocumentChecklist tại prisma/schema.prisma:1687, WorkflowDefinition tại prisma/schema.prisma:1054; các field file cụ thể chưa chắc chắn, cần xác nhận trước template cuối. |


## PHẦN BỔ SUNG E - NHÓM DỮ LIỆU BỔ SUNG NẾU MODEL/API TỒN TẠI

| Nhóm | Có model không? | Có API không? | Có UI không? | Có cần nhập dữ liệu thật không? | Nếu cần, sheet Excel nào? | Nếu không, lý do không đưa import ban đầu | Có nên để giai đoạn 2 không? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Mua hàng | CÓ: PurchaseRequest, PurchaseOrder, PurchaseOrderItem, GoodsReceipt, Quotation | Có /api/procurement; chưa chắc chắn đủ CRUD từng model nếu không thấy route riêng | Chưa thấy page procurement trong danh sách page hiện tại | TÙY CHỌN | GD_MuaHang_* | Không đưa import ban đầu nếu chưa chạy procurement end-to-end | CÓ |
| Hợp đồng nâng cao | CÓ: ContractChange, Acceptance, PaymentPlan, DocumentChecklist | Có API hợp đồng chính; route riêng các model này chưa chắc chắn | Có accounting/contracts page; chưa chắc UI riêng từng model | TÙY CHỌN | GD_DieuChinhHopDong, GD_NghiemThu, GD_KeHoachThanhToan | Đưa giai đoạn 2 nếu chỉ cần hợp đồng gốc | CÓ |
| Ngân hàng / quỹ | CÓ: BankAccount, BankTransaction, BankStatement, CashBankDocument, PaymentBatch | Có /api/cash-bank/documents và reports bank/cash | Có /cash-bank page | CÓ cho BankAccount/CashBankDocument; TÙY CHỌN cho statement/batch | DM_TaiKhoanNganHang, GD_PhieuThuChi, GD_SaoKeNganHang | Statement/batch có thể sau | CÓ |
| Thuế | CÓ: TaxInvoice | Có /api/tax/invoices và tax reports | Có /tax page | CÓ | GD_HoaDonThue | Không nên gộp hoàn toàn vào Invoice vì TaxInvoice có series/template | KHÔNG |
| Thầu phụ | CÓ: Subcontract* | Route riêng chưa chắc chắn | Chưa thấy page thầu phụ riêng | TÙY CHỌN | GD_ThauPhu_* | Giai đoạn 2 hoặc dùng Contract type SUBCONTRACT | CÓ |
| Hiện trường / tiến độ | CÓ: SiteLog, ProgressEntry, Measurement, Activity, BaselineSchedule, DelayEvent | Route riêng chưa chắc chắn | Chưa thấy page riêng ngoài projects/wbs | TÙY CHỌN | GD_TienDo_HienTruong | Giai đoạn 2 | CÓ |
| Nguồn lực | CÓ: ResourcePool, LaborCrew, CrewAssignment, EquipmentAsset, EquipmentAssignment | Route riêng chưa chắc chắn | Chưa thấy page riêng | TÙY CHỌN | DM_NguonLuc, GD_PhanCongNguonLuc | Giai đoạn 2 | CÓ |
| Phát sinh / thay đổi | CÓ: ChangeRequest, ClaimRecord, Commitment, VariationOrder | Route riêng chưa chắc chắn | Chưa thấy page riêng | TÙY CHỌN | GD_PhatSinhThayDoi | Giai đoạn 2 | CÓ |
| Tài liệu | CÓ: Document, Comment, DocumentChecklist | Có liên quan workflow/approval; route riêng chưa chắc chắn | Có print/pages liên quan chứng từ, chưa chắc UI document center | TÙY CHỌN | GD_TaiLieuDinhKem | Không cần nếu file đính kèm chưa import giai đoạn 1 | CÓ |
| Workflow | CÓ: ApprovalRequest, ApprovalStep, AuthorityMatrix, WorkflowDefinition | Có /api/approvals/* và /api/workflows/transition | Có /approvals page | TÙY CHỌN/TỰ SINH | DM_MaTranThamQuyen, DM_DinhNghiaWorkflow | ApprovalRequest/Step tự sinh; config có thể import | CÓ |


## PHẦN BỔ SUNG F - RỦI RO THỰC TẾ CẦN KIỂM SOÁT

| Rủi ro | Mô tả/nguyên nhân | Ảnh hưởng | Cách phòng tránh | Nguồn chứng cứ nếu có |
| --- | --- | --- | --- | --- |
| Thanh toán vượt giá trị hợp đồng | Payment/CashBankDocument không được đối chiếu tổng với Contract totalAmount trước import | Vượt cam kết chi/thu theo hợp đồng | Kiểm tra tổng payment theo contract <= contract.totalAmount + ContractChange/VariationOrder | Suy luận nghiệp vụ; schema Contract.totalAmount và Payment.contractId |
| Thanh toán vượt giá trị hóa đơn | Payment.amount/PaymentAllocation có thể vượt Invoice.remainingAmount | Công nợ âm, báo cáo aging sai | Validate tổng allocation/payment <= remainingAmount trước import | Có Invoice.remainingAmount/PaidAmount và PaymentAllocation trong schema |
| Chi phí vượt dự toán WBS | CostRecord.wbsId và BudgetRecord.estimatedAmount liên quan nhưng Excel thiếu cảnh báo | Vượt ngân sách WBS | So sánh tổng CostRecord theo wbsId/costType với BudgetRecord | Có CostRecord/BudgetRecord schema; nghiệp vụ phòng tránh là suy luận |
| Hóa đơn không gắn đúng hợp đồng/công trình | Invoice có projectId/wbsId/contractId | Sai báo cáo công nợ theo hợp đồng/công trình | Bắt buộc mapping project/contract/wbs trong sheet hóa đơn | Có schema Invoice projectId,wbsId,contractId |
| Công nợ lệch giữa hóa đơn và thanh toán | Payment có invoiceId tùy chọn và PaymentAllocation tự sinh | Aging/debt sai | Import allocation rõ hoặc chạy phân bổ sau import | Có PaymentAllocation/Invoice/Payment trong schema |
| Doanh thu nhập trùng giữa Revenue và Invoice | Revenue có invoiceId, Invoice cũng ảnh hưởng báo cáo | Doanh thu bị cộng hai lần | Chỉ import Revenue khi là doanh thu ngoài hóa đơn hoặc đánh source rõ | Suy luận nghiệp vụ; schema Revenue.invoiceId |
| Chi phí nhập trùng giữa CostRecord, InventoryDocument, JournalEntry | Phiếu kho/bút toán/chi phí đều có thể ghi nhận giá trị | Chi phí bị cộng nhiều lần | Quy định nguồn sự thật: CostRecord hoặc InventoryDocument hoặc JournalEntry thủ công | Có CostRecord, InventoryDocument, JournalEntry sourceType/sourceId |
| Bút toán thủ công nhập trùng với bút toán tự sinh | JournalEntry có sourceType/sourceId unique với deletedAt | Sổ cái sai | Sheet bút toán chỉ cho điều chỉnh thủ công; auto docs dùng sourceType/sourceId | Có @@unique([sourceType, sourceId, deletedAt]) trong JournalEntry |
| Thiếu mã chủ đầu tư/khách hàng | Schema có Project.investor nhưng không có Customer model rõ | Không phân tích AR theo khách hàng chuẩn | Bổ sung cột ChuDauTu/KhachHang và xác nhận mapping Supplier/Project.investor | Chưa chắc chắn, cần xác nhận |
| Mã công trình không thống nhất giữa các sheet | Project schema đoạn audit không thấy code rõ, báo cáo cũ dùng MaDuAn | Lỗi khóa ngoại/mapping import | Xác nhận mã dự án mapping vào field nào hoặc mở schema | Chưa chắc chắn, cần xác nhận |
| Sai VAT | VAT nằm ở CostRecord, TaxInvoice, InventoryDocumentLine nhưng Invoice thường dùng amount/net/vat | Sai báo cáo thuế | Bổ sung vatRate/vatAmount/net/gross và kiểm tra công thức | Có field vatRate/vatAmount/net/gross trong schema |
| Sai ngày hóa đơn/kỳ kế toán | Route có kiểm tra period ở nhiều API; FiscalPeriod/AccountingPeriod tồn tại | API chặn hoặc hạch toán sai kỳ | Bắt buộc kiểm tra issuedDate/documentDate/accountingDate/paymentDate trong kỳ mở | Có FiscalPeriod/AccountingPeriod và route period-closing/fiscal-periods |
| File chứng từ không đồng bộ với chứng từ | Document model riêng, sheet cũ thiếu file URL/metadata | Không đủ hồ sơ audit | Tách Document metadata hoặc cột attachmentUrl mapping Document/metadata nếu có | Có Document model; mapping field cần xác nhận |
| Xóa/sửa chứng từ đã ghi sổ | Nhiều model có postedJournalEntryId/status/reversal fields | Mất audit trail/sai sổ | Không import sửa/xóa chứng từ đã POSTED; dùng reverse/cancel route | Có CashBankDocument/TaxInvoice/InventoryDocument postedJournalEntryId/reversalRef |
| Import sai thứ tự gây lỗi khóa ngoại | Nhiều FK Company -> Project -> WBS -> Contract -> Invoice/Payment | Import fail hoặc dữ liệu mồ côi | Áp dụng thứ tự master data trước transaction | Có relation fields trong schema |
| Enum UI khác enum schema | Báo cáo cũ có enum PLANNING nhưng schema ProjectStatus đoạn audit có PLANNED | API/schema reject value | Xuất enum từ schema khi thiết kế Excel cuối | Có Project.status default PLANNED; cần xác nhận enum đầy đủ |
| API bắt buộc field nhưng Excel không có cột | Routes dùng zod/body validation khác schema default | Import API fail | Đối chiếu route inventory trước template cuối | Có route inventory phần B; chỗ chưa chắc chắn cần đọc sâu route cụ thể |


## QUYẾT ĐỊNH NGHIỆP VỤ CẦN XÁC NHẬN TRƯỚC TEMPLATE CUỐI

Chi tiết mapping theo từng cột xem [PHASE1_EXCEL_FINAL_MAPPING_DRAFT.md](./PHASE1_EXCEL_FINAL_MAPPING_DRAFT.md). Các điểm dưới đây không được tự chốt bằng suy luận AI trước khi tạo template Excel cuối.

| Điểm cần xác nhận | Kết quả audit hiện tại | Đề xuất giai đoạn 1 | Rủi ro nếu chưa xác nhận | Nguồn chứng cứ |
| --- | --- | --- | --- | --- |
| `Project` và `MaDuAn` | Chưa thấy `Project.code` trong schema/API đã đọc sâu; `createProjectSchema` nhận `name`, `description`, `status`, `ownerId`, `contractValue`, `totalBudget`, `investor`, `projectType`, `startDate`, `endDate`. | Dùng `MaDuAn` như khóa nội bộ Excel để lookup theo `Project.name` chỉ là phương án tạm; nếu cần mã công trình thật thì cần xác nhận mở schema. | Mã công trình không thống nhất giữa sheet, lỗi FK khi import. | `prisma/schema.prisma` model `Project`; `lib/validations.ts` `createProjectSchema`; `services/project.service.ts` |
| Chủ đầu tư/khách hàng | Chưa thấy model `Customer`, `Client`, `Investor`; có `Supplier` và field `Project.investor`. | GĐ1 dùng `Project.investor` cho chủ đầu tư dạng mô tả; không gộp khách hàng AR vào `Supplier` nếu chưa được kế toán xác nhận. | Công nợ phải thu không tách theo khách hàng/chủ đầu tư chuẩn. | `prisma/schema.prisma` model `Supplier`, field `Project.investor` |
| `Material` legacy và `MaterialItem` | Route/service kho dùng `MaterialItem`; `Material` còn xuất hiện trong các model vận hành/legacy. | GĐ1 dùng `MaterialItem` cho `DM_VatTu`; không dùng `Material` trong Excel lõi. | Trùng danh mục vật tư, phiếu kho lookup sai model. | `services/inventory.service.ts`; `app/api/inventory/materials/route.ts`; `prisma/schema.prisma` models `MaterialItem`, `Material` |
| `FiscalPeriod`, `FiscalYear`, `AccountingPeriod` | Có nhiều lớp kỳ; `lib/period.ts` kiểm tra khóa kỳ qua accounting governance. | Chọn một nguồn kỳ chính cho import GĐ1 sau khi xác nhận; tạm ưu tiên `AccountingPeriod` cho kiểm tra ghi sổ, `FiscalYear` cho năm tài chính. | Kỳ kế toán song song gây khóa kỳ sai hoặc trùng dữ liệu. | `prisma/schema.prisma`; `lib/period.ts`; routes fiscal/accounting period |
| Nguồn dữ liệu gốc cho doanh thu | Có model/route `Revenue`, nhưng hóa đơn và bút toán cũng có thể ghi nhận doanh thu. | Không import `Revenue` riêng trong GĐ1 nếu doanh thu lấy từ `Invoice`/`TaxInvoice`/`JournalEntry`; chỉ dùng nếu kế toán xác nhận nguồn ngoài hóa đơn. | Trùng doanh thu giữa `Revenue` và `Invoice`. | `services/revenue.service.ts`; `app/api/revenues/route.ts`; model `Invoice`, `TaxInvoice`, `JournalEntry` |
| Nguồn dữ liệu gốc cho chi phí | Có `CostRecord`, `InventoryDocument`, `CashBankDocument`, `JournalEntry`. | `CostRecord` cho chi phí trực tiếp; `InventoryDocument` cho kho; `CashBankDocument` cho thu/chi tiền; `JournalEntry` thủ công chỉ điều chỉnh/số dư. | Trùng chi phí giữa chi phí, kho, phiếu thu chi và bút toán. | `services/cost.service.ts`; `services/inventory.service.ts`; `services/cash-bank.service.ts`; `services/voucher.service.ts` |
| Bút toán thủ công | Voucher route/service có kiểm tra cân Nợ/Có, tài khoản active và kỳ kế toán. | Cho import bút toán thủ công chỉ với điều chỉnh/số dư đầu kỳ/phát sinh không có chứng từ nguồn; không dùng để nhập lại bút toán tự sinh. | Sổ cái bị ghi đôi với chứng từ tự sinh. | `app/api/accounting/vouchers/route.ts`; `services/voucher.service.ts`; `lib/period.ts` |


## PHẦN BỔ SUNG G - KẾT LUẬN CẬP NHẬT

| Mức đánh giá | Có/Chưa | Lý do | Điều kiện cần hoàn thành tiếp theo |
| --- | --- | --- | --- |
| Đủ để tạo biên bản quyết định nghiệp vụ chưa? | CÓ | Đã có đủ audit model/route/mapping để gom 7 blocker và các cột chưa khóa vào decision log. | Người dùng/kế toán review [PHASE1_BUSINESS_DECISION_LOG.md](./PHASE1_BUSINESS_DECISION_LOG.md). |
| Đủ để tạo Excel nháp sau khi review chưa? | CÓ ĐIỀU KIỆN | Có thể tạo Excel nháp nếu giữ rõ cảnh báo cột chưa chắc chắn, cột chỉ chuẩn bị dữ liệu và cột cần mở rộng schema. | Kế toán xác nhận quyết định tạm hoặc chấp nhận Excel nháp có nhãn review. |
| Đủ để tạo bản nháp Excel template chưa? | CÓ | Đã có kiểm kê đủ 97 model và 152 route, đã xác định sheet chính và sheet tùy chọn. | Tạo bản nháp phải gắn nhãn cột theo schema/API/suy luận nghiệp vụ; không dùng để import thật ngay. |
| Đủ để tạo Excel template cuối cùng chưa? | CHƯA | Còn các điểm chưa chắc chắn: Project.code không thấy rõ trong schema đoạn audit; Customer/chủ đầu tư chưa có model riêng; Material legacy vs MaterialItem; một số model giai đoạn 2 chưa có route/UI rõ. | Đọc sâu từng route nhập liệu chính, xác nhận enum/schema mapping, xác nhận với kế toán các cột nghiệp vụ suy luận. |
| Đủ để import dữ liệu thật chưa? | CHƯA | Chưa có đối chiếu dữ liệu thật, chưa có validation import, chưa xác nhận kỳ kế toán mở, chưa xử lý rủi ro trùng Invoice/Revenue/Journal/Cost/Inventory. | Hoàn tất template cuối, test import dry-run, đối chiếu khóa ngoại, enum, kỳ kế toán, số dư và chứng từ đính kèm. |

Xác nhận phạm vi cập nhật: không nhập dữ liệu mới, không seed dữ liệu mới, không sửa schema, không sửa UI, không refactor code, không tạo file Excel.

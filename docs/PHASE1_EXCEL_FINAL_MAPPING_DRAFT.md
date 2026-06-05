# PHASE 1 EXCEL FINAL MAPPING DRAFT

Phạm vi: bản nháp mapping cuối cho Excel giai đoạn 1, chỉ phục vụ thiết kế template. Chưa tạo Excel, chưa nhập dữ liệu, chưa seed dữ liệu, chưa sửa schema/UI/code nghiệp vụ.

Ghi chú cập nhật: các cột chưa chắc chắn đã được gom vào [PHASE1_BUSINESS_DECISION_LOG.md](./PHASE1_BUSINESS_DECISION_LOG.md) để review. Các quyết định tạm GĐ1 trong file decision log không phải quyết định cuối cho tới khi người dùng/kế toán xác nhận.

Phiếu xác nhận quyết định nghiệp vụ GĐ1: [PHASE1_BUSINESS_DECISION_CONFIRMATION_FORM.md](./PHASE1_BUSINESS_DECISION_CONFIRMATION_FORM.md)

Trạng thái sau phiếu xác nhận: 7 quyết định nghiệp vụ đã **TẠM CHỐT GĐ1** để cho phép tạo Excel template nháp có cảnh báo. Excel nháp chỉ dùng review cấu trúc, chưa dùng import dữ liệu thật. Trước template cuối/import thật vẫn cần xem xét lại `Project.code` và mô hình khách hàng/chủ đầu tư.

Excel template nháp GĐ1: [PHASE1_ERP_IMPORT_TEMPLATE_DRAFT_REVIEW.xlsx](../templates/PHASE1_ERP_IMPORT_TEMPLATE_DRAFT_REVIEW.xlsx)

Báo cáo tạo Excel nháp: [PHASE1_EXCEL_TEMPLATE_DRAFT_REPORT.md](./PHASE1_EXCEL_TEMPLATE_DRAFT_REPORT.md)

Nguồn đối chiếu chính:
- `prisma/schema.prisma`
- `lib/validations.ts`
- `lib/period.ts`
- `services/project.service.ts`
- `services/wbs.service.ts`
- `services/budget.service.ts`
- `services/contract.service.ts`
- `services/revenue.service.ts`
- `services/cost.service.ts`
- `services/payment.service.ts`
- `services/cash-bank.service.ts`
- `services/tax-invoice.service.ts`
- `services/advance.service.ts`
- `services/advance-settlement.service.ts`
- `services/inventory.service.ts`
- `services/voucher.service.ts`
- `app/api/**/route.ts`

## Kết luận có hiệu lực hiện tại

| Mức đánh giá | Trạng thái | Lý do |
| --- | --- | --- |
| Đủ tạo bản nháp Excel template | CÓ | Đã có kiểm kê model/route và mapping giai đoạn 1 ở mức draft. |
| Đủ tạo Excel template cuối cùng | CHƯA | Còn phải xác nhận `MaDuAn`, khách hàng/chủ đầu tư, `Material` vs `MaterialItem`, kỳ kế toán chính, nguồn doanh thu/chi phí, và bút toán thủ công. |
| Đủ import dữ liệu thật | CHƯA | Chưa có dry-run validator, chưa đối chiếu dữ liệu thật, chưa xác nhận kỳ mở và chống trùng nguồn hạch toán. |

## PHẠM VI EXCEL GIAI ĐOẠN 1 - IMPORT KẾ TOÁN LÕI

| STT | Nhóm | Model chính | Model phụ đi kèm | API tạo/cập nhật chính | Service/validation liên quan | Bắt buộc GĐ1 | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Company | `Company` | - | Chưa thấy route CRUD riêng; có tham chiếu tenant trong nhiều service | `prisma/schema.prisma` model `Company` | CÓ | Master data gốc, cần có trước User/Project/Period. |
| 2 | Branch | `Branch` | `Company` | Chưa thấy route CRUD riêng | `prisma/schema.prisma` model `Branch` | TÙY CHỌN | Bắt buộc nếu muốn phân tích theo chi nhánh. |
| 3 | User | `User` | `Company` | `/api/auth/session` chỉ tạo/đọc session dev, không phải import user chuẩn | `app/api/auth/session/route.ts`, schema `User` | CÓ | Cần user để `createdBy`, RBAC, workflow; route hiện tại không phải import user sản xuất. |
| 4 | LedgerAccount | `LedgerAccount` | `TransactionLine` | `/api/accounting/accounts` GET only | schema `LedgerAccount`, `services/voucher.service.ts` | CÓ | Phải có tài khoản trước bút toán, quỹ, kho, thuế. |
| 5 | FiscalYear / AccountingPeriod | `FiscalYear`, `AccountingPeriod` | `FiscalPeriod` legacy | `/api/reports/fiscal-years`, `/api/fiscal-periods`, `/api/reports/periods` | `lib/period.ts`, `services/finance/accounting-governance` | CÓ | Cần chốt nguồn kỳ chính; không để song song gây trùng. |
| 6 | Supplier | `Supplier` | `ProjectSupplier` | `/api/accounting-core`, `/api/procurement` | `app/api/accounting-core/route.ts`, `services/procurement.service.ts` | CÓ | Dùng cho nhà cung cấp; khách hàng/chủ đầu tư cần xác nhận. |
| 7 | Project | `Project` | `Branch`, `Company`, `User` | `/api/projects` POST, `/api/projects/:id` PUT | `createProjectSchema`, `ProjectService.create/update` | CÓ | Schema không có `code`; `MaDuAn` cần xác nhận mapping. |
| 8 | WBSItem | `WBSItem` | `Project`, parent `WBSItem` | `/api/wbs` POST, `/api/wbs/:id` PUT | `createWBSSchema`, `WBSService.create/update` | CÓ | Nền để nhập dự toán, chi phí, hóa đơn, kho. |
| 9 | BudgetRecord | `BudgetRecord` | `Project`, `WBSItem` | `/api/budgets`, `/api/budgets/import` | `createBudgetSchema`, `BudgetService.create` | CÓ | Có kiểm tra kỳ kế toán qua `assertPeriodNotLocked(new Date())`. |
| 10 | Contract | `Contract` | `Project`, `Supplier`, `ContractChange` | `/api/contracts`, `/api/accounting-core` | `ContractService.createContract`, `accounting-core` schemas | CÓ | Hợp đồng gốc GĐ1; phụ lục/change để GĐ2 trừ khi kế toán yêu cầu. |
| 11 | Invoice / TaxInvoice | `Invoice`, `TaxInvoice` | `PaymentAllocation`, `Revenue` | `/api/invoices`, `/api/tax/invoices` | `createInvoiceSchema`, `RevenueService.createInvoice`, `TaxInvoiceService.createInvoice` | CÓ | Nên tách hóa đơn vận hành và hóa đơn VAT để tránh thiếu series/template. |
| 12 | Payment / CashBankDocument | `Payment`, `CashBankDocument` | `PaymentAllocation`, `LedgerAccount` | `/api/payments`, `/api/cash-bank/documents` | `createPaymentSchema`, `RevenueService.createPayment`, `CashBankService.createDocument` | CÓ | Payment gắn hóa đơn; CashBankDocument là phiếu thu/chi/quỹ/ngân hàng. |
| 13 | CostRecord | `CostRecord` | `Project`, `WBSItem`, `PurchaseOrder` tùy chọn | `/api/costs`, `/api/costs/:id` | `createCostSchema`, `CostService.create` | CÓ | Chi phí phát sinh lõi; tránh trùng với kho và bút toán tay. |
| 14 | AdvanceRequest | `AdvanceRequest` | `Supplier`, `User`, `Project`, `Contract` | `/api/advances` | `AdvanceService.createAdvance`, `AdvanceSettlementPolicy` | CÓ | Tạm ứng ở trạng thái DRAFT, thanh toán/post là workflow. |
| 15 | AdvanceSettlement | `AdvanceSettlement` | `AdvanceRequest`, `Invoice`, `CostRecord`, `Payment` | `/api/advances/:id/settlements` | `AdvanceSettlementService.createSettlement` | CÓ | Hoàn ứng gốc; submit/approve/post không đưa vào sheet nhập gốc. |
| 16 | MaterialItem | `MaterialItem` | `Warehouse` | `/api/inventory/materials` | `InventoryService.createMaterialItem` | CÓ | Dùng `MaterialItem` cho kho GĐ1; `Material` legacy không dùng. |
| 17 | Warehouse | `Warehouse` | `Company`, `Project` | `/api/inventory/warehouses` | `InventoryService.createWarehouse` | CÓ | Cần trước chứng từ kho. |
| 18 | InventoryDocument / Line | `InventoryDocument`, `InventoryDocumentLine` | `InventoryMovement`, `InventoryBalance` tự sinh | `/api/inventory/documents` | `InventoryService.createDocument` | CÓ | Movement/balance/JournalEntry sinh khi post, không nhập tay. |
| 19 | JournalEntry thủ công | `JournalEntry`, `TransactionLine` | `LedgerAccount`, `Project` | `/api/accounting/vouchers` | `VoucherService.saveVoucher` | TÙY CHỌN | Chỉ nhập điều chỉnh/số dư đầu kỳ; không nhập thay bút toán tự sinh. |

## PHẠM VI GIAI ĐOẠN 2 - KHÔNG ĐƯA VÀO TEMPLATE LÕI BAN ĐẦU

| Nhóm GĐ2 | Model | Vì sao chưa đưa vào GĐ1 | Khi nào cần đưa vào | Rủi ro nếu bỏ qua | Cần sheet riêng sau này |
| --- | --- | --- | --- | --- | --- |
| Mua hàng nâng cao | `PurchaseRequest`, `PurchaseOrder`, `PurchaseOrderItem`, `GoodsReceipt`, `Quotation` | GĐ1 kiểm thử kế toán lõi; procurement chưa có page riêng rõ và có thể phát sinh trùng với `CostRecord`/`InventoryDocument`. | Khi chạy quy trình PR -> PO -> GR -> Invoice. | Không kiểm soát cam kết mua trước khi phát sinh chi phí/kho. | CÓ: `GD_DeNghiMuaHang`, `GD_DonMuaHang`, `GD_NhapHang`, `GD_BaoGia`. |
| Thầu phụ chi tiết | `Subcontract`, `SubcontractItem`, `SubcontractInvoice`, `SubcontractProgress` | Có thể tạm quản lý bằng `Contract` type/thông tin nhà thầu; route/UI riêng chưa chắc chắn. | Khi cần tiến độ/thanh toán riêng cho thầu phụ. | Thiếu theo dõi khối lượng và công nợ thầu phụ chi tiết. | CÓ. |
| Hiện trường / tiến độ | `SiteLog`, `ProgressEntry`, `Measurement`, `Activity`, `BaselineSchedule`, `DelayEvent` | Không bắt buộc để kiểm thử kế toán lõi. | Khi triển khai module quản lý thi công/tiến độ. | Thiếu dữ liệu tiến độ để kiểm tra nghiệm thu/WIP. | CÓ. |
| Nguồn lực | `ResourcePool`, `LaborCrew`, `CrewAssignment`, `EquipmentAsset`, `EquipmentAssignment`, `EquipmentBreakdown` | Không phải nguồn dữ liệu kế toán lõi ban đầu. | Khi cần tính năng suất/chi phí nguồn lực. | Không phân tích được nhân công/máy móc theo activity. | CÓ. |
| Phát sinh / thay đổi / claim | `ChangeRequest`, `ClaimRecord`, `Commitment`, `VariationOrder`, `ContractChange` | GĐ1 chỉ khóa hợp đồng gốc; `ContractChange` đưa vào GĐ1 chỉ nếu có phụ lục làm thay đổi giá trị hợp đồng. | Khi có phát sinh/claim/VO ảnh hưởng hợp đồng. | Không kiểm soát vượt hợp đồng và claim. | CÓ. |
| Tài liệu / workflow cấu hình | `Document`, `Comment`, `DocumentChecklist`, `ApprovalRequest`, `ApprovalStep`, `AuthorityMatrix`, `WorkflowDefinition` | Một phần tự sinh từ workflow; file đính kèm cần chính sách storage riêng. | Khi yêu cầu kiểm soát hồ sơ, phê duyệt và checklist chứng từ. | Thiếu bằng chứng audit/thiếu phân quyền phê duyệt. | CÓ cho `Document`, `AuthorityMatrix`, `WorkflowDefinition`; không nhập tay `ApprovalRequest/ApprovalStep` phát sinh. |

## ĐỌC SÂU ROUTE NHẬP LIỆU GIAI ĐOẠN 1

| STT | Nhóm dữ liệu | Route path | Method | File path | Service/validation liên quan | Payload/body field | Required theo API | Required theo service | Required theo schema | Enum | FK lookup | Default/tự sinh | Kiểm tra kỳ kế toán | Tự sinh JournalEntry | Nên import trực tiếp | Lý do | Nguồn chứng cứ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Accounting core/multi-action | `/api/accounting-core` | GET/POST | `app/api/accounting-core/route.ts` | `ConstructionAccountingService`, zod schemas trong route | `action`, `projectId`, `contractId`, `supplierId`, các payload theo action | Theo `postSchema` | Theo service tương ứng | Theo model đích | Theo action | Project/Contract/Supplier | Tùy action | Chưa chắc chắn, cần đọc action cụ thể khi dùng | Có thể có theo service | KHÔNG cho import bulk | Route đa hành động, dễ lẫn nghiệp vụ; chỉ dùng nếu action được khóa rõ. | route + `services/construction-accounting.service.ts` |
| 2 | Bút toán thủ công | `/api/accounting/vouchers` | GET/POST | `app/api/accounting/vouchers/route.ts` | `VoucherService.saveVoucher` | `projectId`, `date`, `description`, `reference`, `sourceType`, `sourceId`, `status`, `lines[]` | `description`, `lines[]` | tổng Nợ = tổng Có; account active; user có company | `JournalEntry.description`, `TransactionLine.journalEntryId/accountId/amount/type` | `TransactionType`, voucher state | `LedgerAccount`, `Project` | `reference` tự sinh nếu trống; `status` mặc định `NHAP`; `isPosted` theo status | CÓ | KHÔNG khi save | CÓ, nhưng chỉ điều chỉnh/số dư đầu kỳ | Tránh trùng với bút toán tự sinh từ hóa đơn/kho/quỹ/thuế. | `services/voucher.service.ts` |
| 3 | Bút toán thủ công | `/api/accounting/vouchers/:id/save` | PUT/DELETE | `app/api/accounting/vouchers/[id]/save/route.ts` | `VoucherService.saveVoucher/deleteVoucher` | như voucher; DELETE không body chính | Theo service | Không sửa/xóa chứng từ đã ghi sổ | Theo `JournalEntry`, `TransactionLine` | `TransactionType` | `LedgerAccount`, `Project` | - | CÓ | KHÔNG | KHÔNG cho import gốc | Update/delete không phải nguồn nhập dòng Excel ban đầu. | route + `VoucherService` |
| 4 | Hoàn ứng | `/api/advances/:id/settlements` | POST | `app/api/advances/[id]/settlements/route.ts` | `AdvanceSettlementService.createSettlement`, `AdvanceSettlementPolicy` | `advanceRequestId`, `invoiceId`, `costRecordId`, `paymentId`, `contractId`, `amount`, `settlementDate`, `reason` | Body JSON | advance tồn tại; amount không vượt advance/invoice theo policy | `advanceRequestId`, `amount` | `SettlementStatus` | `AdvanceRequest`, `Invoice`, `CostRecord`, `Payment`, `Contract` | `status=DRAFT`, `createdBy`, `companyId` | Không thấy gọi `assertPeriodNotLocked` trong service hiện tại | KHÔNG | CÓ | Là chứng từ hoàn ứng gốc; post là workflow riêng. | `services/advance-settlement.service.ts` |
| 5 | Tạm ứng | `/api/advances` | GET/POST | `app/api/advances/route.ts` | `AdvanceService.createAdvance`, `AdvanceSettlementPolicy` | `companyId`, `projectId`, `contractId`, `wbsItemId`, `supplierId`, `employeeId`, `recipientType`, `advanceNo`, `amount`, `purpose`, `expectedSettlementDate` | Body JSON | `AdvanceSettlementPolicy.validateAdvanceCreate` | `recipientType`, `amount`, `remainingAmount` | `AdvanceRecipientType`, `AdvanceStatus` | `Company`, `Project`, `Contract`, `WBSItem`, `Supplier`, `User` | `status=DRAFT`, `paidAmount=0`, `settledAmount=0`, `remainingAmount=amount`, `requestedBy=userId` | Không thấy gọi `assertPeriodNotLocked` khi create | KHÔNG | CÓ | Nhập đề nghị tạm ứng; không nhập post/approve trong sheet gốc. | `services/advance.service.ts` |
| 6 | Dự toán | `/api/budgets` | GET/POST | `app/api/budgets/route.ts` | `createBudgetSchema`, `BudgetService.create` | `requestId`, `projectId`, `wbsId`, `costType`, `estimatedAmount`, `createdById` | `projectId`, `wbsId`, `estimatedAmount` | Project/WBS tồn tại, WBS thuộc Project | `projectId`, `wbsId`, `estimatedAmount` | `CostType` | `Project`, `WBSItem`, `User` | `costType=material`, `createdAt/updatedAt` | CÓ | KHÔNG | CÓ | Sheet dự toán lõi. | `lib/validations.ts`, `services/budget.service.ts` |
| 7 | Dự toán | `/api/budgets/import` | POST | `app/api/budgets/import/route.ts` | `BudgetService.create` | mảng dòng budget | Body phải là mảng | Như BudgetService | Như BudgetRecord | `CostType` | `Project`, `WBSItem` | Như BudgetRecord | CÓ | KHÔNG | CÓ/TÙY CHỌN | Có thể dùng cho import dự toán nếu route được kiểm thử riêng. | route + `BudgetService` |
| 8 | Dự toán | `/api/budgets/:id` | PUT/DELETE | `app/api/budgets/[id]/route.ts` | `updateBudgetSchema`, `BudgetService.update/delete` | `wbsId`, `costType`, `estimatedAmount` | Theo update schema | Không sửa kỳ khóa; budget tồn tại | Theo schema | `CostType` | `WBSItem` | - | CÓ | KHÔNG | KHÔNG cho import gốc | Update/delete không phải sheet nhập mới. | route + service |
| 9 | Phiếu thu chi | `/api/cash-bank/documents` | GET/POST | `app/api/cash-bank/documents/route.ts` | `CashBankService.createDocument` | `companyId`, `projectId`, `contractId`, `documentType`, `documentNo`, `documentDate`, `accountingDate`, `amount`, `currency`, `description`, `partnerName`, `paymentMethod`, `debitAccountId`, `creditAccountId` | Body JSON | amount > 0; description >= 5; debit/credit account bắt buộc; unique documentNo | `documentType`, `documentNo`, `amount`, `description`, `paymentMethod`, `debitAccountId`, `creditAccountId`, `createdBy` | `CashBankDocumentType`, `CashBankDocumentStatus` | `Company`, `Project`, `Contract`, `LedgerAccount` | `documentNo` tự sinh nếu trống; `currency=VND`; `status=DRAFT` | CÓ | KHÔNG khi create; post route mới sinh | CÓ | Sheet phiếu thu/chi/quỹ/ngân hàng gốc. | `services/cash-bank.service.ts` |
| 10 | Hợp đồng | `/api/contracts` | GET/POST | `app/api/contracts/route.ts` | `ContractService.createContract` | `projectId`, `title`, `contractNumber`, `originalValue`, `contractorName`, `createdById` | `projectId` qua permission; body theo service | originalValue làm `currentValue`; update Project.contractValue | `projectId`, `title`, `originalValue`, `currentValue` | `ContractStatus` | `Project`, `User`, `Supplier` nếu dùng schema mở rộng | `status=ACTIVE`, `currentValue=originalValue` | CÓ | KHÔNG | CÓ | Hợp đồng gốc GĐ1. | `services/contract.service.ts` |
| 11 | Thanh toán AP theo chi phí | `/api/costs/:id/payment` | POST | `app/api/costs/[id]/payment/route.ts` | `PaymentService.createVendorPayment` | `amount`, `paymentDate`, `note`, `reference` | `amount` | amount > 0; cost tồn tại; không vượt remaining; kỳ mở | `VendorPayment` fields | `PaymentStatus` | `CostRecord` | `paymentNo` tự sinh | CÓ | CÓ | KHÔNG cho sheet thanh toán gốc | Đây là AP payment phụ thuộc CostRecord, không phải Payment AR/CashBankDocument gốc. | `services/payment.service.ts` |
| 12 | Chi phí | `/api/costs` | GET/POST | `app/api/costs/route.ts` | `createCostSchema`, `CostService.create` | `requestId`, `projectId`, `wbsId`, `costType`, `amount`, `quantity`, `unitPrice`, `supplier`, `note`, `date`, `status`, `vatRate`, `vatAmount`, `netAmount`, `retentionRate`, `retentionAmount` | `projectId`, `wbsId`, `amount` | Project/WBS tồn tại, WBS thuộc Project, amount > 0, kỳ mở, PO 3-way nếu có | `projectId`, `wbsId`, `amount` | `CostType`, `PaymentStatus`, `ApprovalStatus` | `Project`, `WBSItem`, `PurchaseOrder` tùy chọn | `quantity=1`, `unitPrice=0`, `vatRate=10`, `status=unpaid`, `approvalStatus=DRAFT`, `workflowStatus=DRAFT` | CÓ | KHÔNG khi create; POSTED workflow mới sinh | CÓ | Sheet chi phí lõi, cần quy định tránh trùng với kho/bút toán tay. | `lib/validations.ts`, `services/cost.service.ts` |
| 13 | Chi phí | `/api/costs/:id` | PUT/DELETE | `app/api/costs/[id]/route.ts` | `updateCostSchema`, `CostService.update/delete` | partial cost fields | Theo update schema | Chặn sửa nếu workflow không editable; kỳ mở | Theo schema | `CostType`, `PaymentStatus` | `WBSItem` | - | CÓ | Có thể khi đổi status paid | KHÔNG cho import gốc | Không dùng để tạo dữ liệu ban đầu. | route + `CostService` |
| 14 | Kỳ legacy | `/api/fiscal-periods` | GET/POST | `app/api/fiscal-periods/route.ts` | `fiscalPeriodMutationSchema`, `AuditService` | `month`, `isLocked`, `reason` | `month`, `isLocked`, `reason >= 12` | auto tạo FiscalPeriod nếu chưa có | `month` unique | boolean lock | `User`, `Company` | có thể auto create periods | CÓ theo nghĩa route khóa/mở kỳ | KHÔNG | KHÔNG cho template lõi nếu chọn AccountingPeriod | Chỉ dùng nếu quyết định dùng `FiscalPeriod` legacy. | route + schema |
| 15 | Kho - chứng từ | `/api/inventory/documents` | GET/POST | `app/api/inventory/documents/route.ts` | `InventoryService.createDocument` | header + `lines[]` gồm material, quantity, unitCost, accounts, warehouse | `documentType`, `lines[]` | ít nhất 1 line; line math hợp lệ; unique documentNo; kỳ mở | `companyId`, `documentType`, `documentNo`, `createdBy`; line: `materialItemId`, `quantity`, `unitCost`, `amount` | `InventoryDocumentType`, `InventoryDocumentStatus` | `Company`, `Project`, `WBSItem`, `Supplier`, `Contract`, `Warehouse`, `MaterialItem`, `TaxInvoice` | `documentNo` tự sinh; status DRAFT; net/vat/gross tự tính | CÓ | KHÔNG khi create; post route sinh JournalEntry/Movement/Balance | CÓ | Sheet kho nhập/xuất gốc. | `services/inventory.service.ts` |
| 16 | Kho - chứng từ | `/api/inventory/documents/:id` | PUT/DELETE | `app/api/inventory/documents/[id]/route.ts` | `InventoryService.updateDocument/deleteDocument` | partial header/lines | Theo service | chỉ DRAFT sửa/xóa; kỳ mở | Theo schema | `InventoryDocumentType` | Như create | net/vat/gross tính lại | CÓ | KHÔNG | KHÔNG cho import gốc | Dùng cho sửa bản nháp, không là sheet nhập mới. | route + service |
| 17 | Vật tư | `/api/inventory/materials` | GET/POST | `app/api/inventory/materials/route.ts` | `InventoryService.createMaterialItem` | `companyId`, `code`, `name`, `unit`, `group`, `defaultWarehouseId`, `inventoryAccount`, `expenseAccount`, `vatRate` | `code`, `name`, `unit` | companyId từ user nếu trống; unique code/company | `companyId`, `code`, `name`, `unit` | - | `Company`, `Warehouse` | code uppercase; `inventoryAccount=152`, `expenseAccount=621`, `vatRate=10`, `isActive=true` | KHÔNG | KHÔNG | CÓ | Danh mục vật tư GĐ1; dùng `MaterialItem`, không dùng `Material`. | `services/inventory.service.ts` |
| 18 | Kho | `/api/inventory/warehouses` | GET/POST | `app/api/inventory/warehouses/route.ts` | `InventoryService.createWarehouse` | `companyId`, `projectId`, `code`, `name`, `address`, `managerName` | `code`, `name` | companyId từ user nếu trống; unique code/company | `companyId`, `code`, `name` | - | `Company`, `Project` | code uppercase | KHÔNG | KHÔNG | CÓ | Danh mục kho GĐ1. | `services/inventory.service.ts` |
| 19 | Hóa đơn vận hành | `/api/invoices` | GET/POST | `app/api/invoices/route.ts` | `createInvoiceSchema`, `RevenueService.createInvoice` | `projectId`, `wbsId`, `invoiceNumber`, `amount`, `netAmount`, `vatRate`, `issuedDate`, `dueDate`, `note`, `status`, `createdById`, `requestId` | `projectId`, `wbsId`, `amount` | Project/WBS tồn tại, WBS thuộc Project, net > 0, kỳ mở, tiến độ nghiệm thu đủ | `projectId`, `wbsId`, `amount`, `remainingAmount` | `InvoiceStatus`, `ApprovalStatus` | `Project`, `WBSItem`, `Contract` nếu có | `status=DRAFT`, `approvalStatus=DRAFT`, `remainingAmount=amount`, VAT default 10 | CÓ | KHÔNG khi create; approve mới post ledger | CÓ | Dùng cho công nợ/hóa đơn vận hành; VAT legal nên tách `TaxInvoice`. | `lib/validations.ts`, `services/revenue.service.ts` |
| 20 | Hóa đơn vận hành | `/api/invoices/:id` | PUT/DELETE | `app/api/invoices/[id]/route.ts` | `RevenueService.updateInvoice/deleteInvoice` | partial invoice; DELETE `reason` | `reason` khi delete | không sửa khi approved/paid; kỳ mở | Theo schema | `InvoiceStatus`, `ApprovalStatus` | `Invoice`, `Payment` | - | CÓ | Có reverse khi delete liên quan payment/revenue | KHÔNG cho import gốc | Không dùng cho tạo dữ liệu ban đầu. | route + service |
| 21 | Thanh toán AR | `/api/payments` | GET/POST | `app/api/payments/route.ts` | `createPaymentSchema`, `RevenueService.createPayment` | `requestId`, `projectId`, `invoiceId`, `amount`, `date`, `description` | `requestId`, `projectId`, `invoiceId`, `amount` | invoice tồn tại, không vượt remaining/reserved, kỳ mở | `projectId`, `amount` | `ApprovalStatus` | `Invoice`, `Project`, `PaymentAllocation` | `approvalStatus=DRAFT`, allocation DRAFT tự sinh | CÓ | KHÔNG khi create; approve mới post ledger | CÓ | Chỉ thanh toán theo hóa đơn AR; không thay thế phiếu thu chi quỹ. | `lib/validations.ts`, `services/revenue.service.ts` |
| 22 | Thanh toán AR | `/api/payments/:id` | PUT/DELETE | `app/api/payments/[id]/route.ts` | `RevenueService.updatePayment/delete/restore`, `PostingEngine` | partial payment | Theo service | Payment immutable; dùng reverse/restore | Theo schema | `ApprovalStatus` | `Invoice`, `PaymentAllocation` | - | CÓ | Có thể post/reverse trong workflow | KHÔNG cho import gốc | Không dùng để nhập mới. | route + service |
| 23 | Print audit | `/api/print/audit` | POST | `app/api/print/audit/route.ts` | `auditPrintOrThrow` | `printType`, `entityId`, `route`, `reason`, `format` | printType/entityId/route | quyền export/print | Không tạo model nguồn | - | chứng từ nguồn | AuditLog | KHÔNG | KHÔNG | KHÔNG | Audit in chứng từ, không phải nguồn import. | route |
| 24 | Procurement | `/api/procurement` | GET/POST | `app/api/procurement/route.ts` | `ProcurementService` | `projectId`, `createdById`, action theo service | `projectId` | theo procurement service | `Supplier`/PR/PO tùy action | `ProcurementStatus` | `Project`, `User` | tùy action | Không rõ theo route | KHÔNG | KHÔNG GĐ1 | Mua hàng nâng cao để GĐ2. | route + `services/procurement.service.ts` |
| 25 | Project | `/api/projects` | GET/POST | `app/api/projects/route.ts` | `createProjectSchema`, `ProjectService.create` | `name`, `description`, `status`, `ownerId`, `contractValue`, `totalBudget`, `investor`, `projectType`, `startDate`, `endDate` | `name`, `investor` | companyId bắt buộc từ user; owner hợp lệ | `name` | `ProjectStatus` | `Company`, `User` | `status=PLANNED`, `contractValue=0`, `totalBudget=0`, timestamps | KHÔNG | KHÔNG | CÓ | Công trình lõi; `MaDuAn` cần xác nhận vì schema không có code. | `lib/validations.ts`, `ProjectService.create` |
| 26 | Project | `/api/projects/:id` | PUT/DELETE | `app/api/projects/[id]/route.ts` | `updateProjectSchema`, `ProjectService.update/delete` | partial project + `version` | Theo update schema | OCC version; chặn xóa nếu có dữ liệu liên quan | Theo schema | `ProjectStatus` | `User` | version increment | KHÔNG | KHÔNG | KHÔNG cho import gốc | Update/delete không phải nhập mới. | route + service |
| 27 | Audited export | `/api/reports/audited-export` | POST | `app/api/reports/audited-export/route.ts` | `ReportingService`, `FinancialAggregationService` | `reportType`, `projectId`, `reason`, `filters` | `reportType`, `projectId` | quyền export/audit | Không tạo dữ liệu nguồn | - | `Project` | AuditLog | KHÔNG | KHÔNG | KHÔNG | Export báo cáo, không phải import. | route |
| 28 | Fiscal year | `/api/reports/fiscal-years` | GET/POST | `app/api/reports/fiscal-years/route.ts` | inline validation, `assertAuthenticated` | `year` | user.companyId; year 2020..2100 | tạo FiscalYear/AccountingPeriod theo route | `FiscalYear.year`, `companyId`; period fields | `FiscalYearStatus`/`PeriodStatus` theo schema | `Company`, `User` | periods có thể tự sinh | CÓ | KHÔNG | CÓ | Nên là nguồn kỳ kế toán chính GĐ1 nếu chọn `FiscalYear/AccountingPeriod`. | route + schema |
| 29 | Period closing | `/api/reports/period-closing` | POST/GET | `app/api/reports/period-closing/route.ts` | `PeriodClosingEngine` | `periodId`, `projectId`, `action`, `reason` | `periodId`, `projectId`, `action`; reopen cần reason | quyền lock/unlock; project access | `AccountingPeriod` | action lock/reopen | `AccountingPeriod`, `Project` | Snapshot/closing tùy engine | CÓ | Có thể tạo snapshot/closing, không import | KHÔNG | Workflow đóng/mở kỳ, không phải sheet nhập gốc. | route |
| 30 | Periods legacy | `/api/reports/periods` | GET/POST | `app/api/reports/periods/route.ts` | `FinancialAggregationService`, route-security | `month` | `month` | quyền PERIOD LOCK | `FiscalPeriod` | - | `Company` | toggle lock | CÓ | KHÔNG | KHÔNG nếu chọn AccountingPeriod | Legacy/toggle kỳ, cần chốt để tránh song song. | route |
| 31 | WIP closing | `/api/reports/wip-closing` | GET/POST | `app/api/reports/wip-closing/route.ts` | `WorkInProgressClosingService` | `projectId`, `startDate`, `endDate` | projectId/startDate/endDate | quyền accounting/project | Không nhập master/transaction gốc | - | `Project` | closing output | Có thể | Có thể tạo closing | KHÔNG | Báo cáo/closing, không nhập Excel gốc. | route |
| 32 | Revenue | `/api/revenues` | GET/POST | `app/api/revenues/route.ts` | `createRevenueSchema`, inline service logic | `projectId`, `wbsId`, `invoiceId`, `amount`, `date`, `status`, `description` | `projectId`, `wbsId`, `amount` | WBS tồn tại, invoice nếu có; kỳ mở | `projectId`, `wbsId`, `amount` | `PaymentStatus` | `Project`, `WBSItem`, `Invoice` | status unpaid, date now | CÓ | KHÔNG | KHÔNG GĐ1 mặc định | Dễ trùng doanh thu với Invoice/TaxInvoice/JournalEntry. | route + `lib/validations.ts` |
| 33 | Revenue | `/api/revenues/:id` | PUT | `app/api/revenues/[id]/route.ts` | `updateRevenueSchema`, `assertPeriodNotLocked` | `date`, `status`, `amount`, `description` | Theo update schema | invoice-linked revenue immutable; kỳ mở | Theo schema | `PaymentStatus` | `Revenue` | - | CÓ | KHÔNG | KHÔNG | Không nhập mới và Revenue không là nguồn GĐ1 mặc định. | route |
| 34 | Tax invoice | `/api/tax/invoices` | GET/POST | `app/api/tax/invoices/route.ts` | `TaxInvoiceService.createInvoice`, `TaxPolicy` | `companyId`, `projectId`, `contractId`, `wbsId`, `invoiceType`, `invoiceNumber`, `invoiceSeries`, `invoiceTemplate`, `invoiceDate`, `partnerName`, `partnerTaxCode`, `partnerAddress`, `netAmount`, `vatRate`, `vatAmount`, `description`, `sourceType`, `sourceId` | company scope; key body fields | net > 0; tax math; unique invoice number+series; kỳ mở | `invoiceType`, `invoiceNumber`, `invoiceSeries`, `partnerName`, `partnerTaxCode`, `netAmount`, `vatAmount`, `grossAmount` | `TaxInvoiceType`, `TaxInvoiceStatus` | `Company`, `Project`, `Contract`, `WBSItem` | `invoiceTemplate=1C26TBB`, `status=DRAFT`, `grossAmount=net+vat` | CÓ | KHÔNG khi create; post route mới sinh | CÓ | Sheet hóa đơn VAT GĐ1. | `services/tax-invoice.service.ts` |
| 35 | Tax invoice | `/api/tax/invoices/:id` | GET/PUT/DELETE | `app/api/tax/invoices/[id]/route.ts` | `TaxInvoiceService.updateInvoice/deleteInvoice` | invoice update fields, `overrideReason` | Theo service | chỉ DRAFT sửa/xóa; tax math; unique; kỳ mở | Theo schema | `TaxInvoiceStatus` | `TaxInvoice` | grossAmount tính lại | CÓ | KHÔNG | KHÔNG cho import gốc | Update/delete không tạo dữ liệu gốc. | route + service |
| 36 | WBS | `/api/wbs` | GET/POST | `app/api/wbs/route.ts` | `createWBSSchema`, `WBSService.create` | `projectId`, `name`, `code`, `parentId`, `sortOrder` | `projectId`, `name` | Project tồn tại; parent tồn tại và cùng project; code con phải bắt đầu bằng code cha nếu có | `projectId`, `name` | - | `Project`, parent `WBSItem` | `level` theo parent; `sortOrder=0` | KHÔNG | KHÔNG | CÓ | Sheet WBS lõi. | `lib/validations.ts`, `services/wbs.service.ts` |
| 37 | WBS | `/api/wbs/:id` | PUT/DELETE | `app/api/wbs/[id]/route.ts` | inline `updateWBSSchema`, `WBSService.update/delete` | `name`, `code`, `parentId`, `sortOrder` | Theo update schema | chống circular parent; chặn/xử lý xóa nếu có tài chính | Theo schema | - | `WBSItem` | level tính lại | KHÔNG | KHÔNG | KHÔNG cho import gốc | Update/delete không phải nhập mới. | route + service |

## DỌN ROUTE CHƯA RÕ

| Route | Kết luận mới | Lý do | Nguồn |
| --- | --- | --- | --- |
| `/api/tasks` | Không dùng cho import Excel kế toán lõi; phân loại `workflow/system/vận hành phụ trợ` | Route tạo/đọc `Task`, dùng `TaskService` và `createTaskSchema`; `Task` không nằm trong 21 sheet GĐ1. | `app/api/tasks/route.ts`, `services/task.service.ts`, `lib/validations.ts` |
| `/api/tasks/:id` | Không dùng cho import Excel kế toán lõi; phân loại `workflow/system/vận hành phụ trợ` | Route GET/PUT/DELETE task vận hành; không ảnh hưởng trực tiếp sổ cái/công nợ/dòng tiền GĐ1. | `app/api/tasks/[id]/route.ts`, `services/task.service.ts` |

## FINAL MAPPING DRAFT - EXCEL GIAI ĐOẠN 1

Quy ước trạng thái mapping:
- `CHẮC CHẮN`: có field/schema/API/service rõ.
- `CẦN XÁC NHẬN`: có field liên quan nhưng cần quyết định nghiệp vụ.
- `SUY LUẬN NGHIỆP VỤ`: cột cần cho kế toán nhưng code chưa bắt buộc rõ.
- `CẦN MỞ RỘNG SCHEMA`: không thấy field tương ứng đủ rõ trong schema/API hiện tại.

### Sheet `DM_CongTy`

| Tên cột Excel | Tên hiển thị tiếng Việt | Model | Field DB | API payload field | Kiểu dữ liệu | Required schema | Required API/service | Required nghiệp vụ | Enum/dropdown | FK lookup | Default | Derived/tự tính | Có import | Nguồn | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `MaCongTy` | Mã công ty | Company | `code` | chưa có API import rõ | String | CÓ | CẦN XÁC NHẬN | CÓ | - | - | - | - | CÓ | `prisma/schema.prisma` model Company | Thiếu route CRUD chuẩn cho import. | CHẮC CHẮN |
| `TenCongTy` | Tên công ty | Company | `name` | chưa có API import rõ | String | CÓ | CẦN XÁC NHẬN | CÓ | - | - | - | - | CÓ | schema Company | - | CHẮC CHẮN |
| `MaSoThue` | Mã số thuế | Company | `taxCode` | chưa có API import rõ | String | KHÔNG | CẦN XÁC NHẬN | CÓ | - | - | - | - | CÓ | schema Company | Sai MST ảnh hưởng hóa đơn/thuế. | CHẮC CHẮN |
| `DiaChi` | Địa chỉ | Company | `address` | chưa có API import rõ | String | KHÔNG | CẦN XÁC NHẬN | CÓ | - | - | - | - | CÓ | schema Company | - | CHẮC CHẮN |

### Sheet `DM_ChiNhanh`

| Tên cột Excel | Tên hiển thị tiếng Việt | Model | Field DB | API payload field | Kiểu dữ liệu | Required schema | Required API/service | Required nghiệp vụ | Enum/dropdown | FK lookup | Default | Derived/tự tính | Có import | Nguồn | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `MaChiNhanh` | Mã chi nhánh | Branch | `code` | chưa có API import rõ | String | CÓ | CẦN XÁC NHẬN | TÙY CHỌN | - | - | - | - | CÓ nếu dùng chi nhánh | schema Branch | Không có chi nhánh thì phân tích theo branch trống. | CHẮC CHẮN |
| `TenChiNhanh` | Tên chi nhánh | Branch | `name` | chưa có API import rõ | String | CÓ | CẦN XÁC NHẬN | TÙY CHỌN | - | - | - | - | CÓ nếu dùng chi nhánh | schema Branch | - | CHẮC CHẮN |
| `MaCongTy` | Mã công ty | Branch | `companyId` | `companyId` | FK | CÓ | CẦN XÁC NHẬN | CÓ nếu có Branch | - | `DM_CongTy.MaCongTy` | - | lookup Company.id | CÓ | schema Branch | Lỗi FK nếu mã công ty sai. | CHẮC CHẮN |
| `DiaChiChiNhanh` | Địa chỉ chi nhánh | Branch | `address` | chưa có API import rõ | String | KHÔNG | KHÔNG | TÙY CHỌN | - | - | - | - | CÓ | schema Branch | - | CHẮC CHẮN |

### Sheet `DM_NguoiDung`

| Tên cột Excel | Tên hiển thị tiếng Việt | Model | Field DB | API payload field | Kiểu dữ liệu | Required schema | Required API/service | Required nghiệp vụ | Enum/dropdown | FK lookup | Default | Derived/tự tính | Có import | Nguồn | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Email` | Email | User | `email` | `/api/auth/session` nhận `email` | String | CÓ unique | CÓ ở session route | CÓ | - | - | - | - | CÓ | schema User, `app/api/auth/session/route.ts` | Session route không phải import user sản xuất đầy đủ. | CHẮC CHẮN |
| `HoTen` | Họ tên | User | `name` | chưa rõ | String | KHÔNG | KHÔNG | CÓ | - | - | - | - | CÓ | schema User | - | CHẮC CHẮN |
| `VaiTro` | Vai trò | User | `role` | `role` | Enum | KHÔNG default | CÓ ở session route | CÓ | `UserRole` | - | `VIEWER` | - | CÓ | schema User, session route | Sai role ảnh hưởng RBAC. | CHẮC CHẮN |
| `MaCongTy` | Công ty | User | `companyId` | chưa rõ | FK | KHÔNG | CẦN XÁC NHẬN | CÓ | - | `DM_CongTy` | - | lookup Company.id | CÓ | schema User | User không có company sẽ lỗi nhiều service tenant. | CHẮC CHẮN |

### Sheet `DM_TaiKhoanKeToan`

| Tên cột Excel | Tên hiển thị tiếng Việt | Model | Field DB | API payload field | Kiểu dữ liệu | Required schema | Required API/service | Required nghiệp vụ | Enum/dropdown | FK lookup | Default | Derived/tự tính | Có import | Nguồn | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `SoHieuTK` | Số hiệu tài khoản | LedgerAccount | `code` | chưa có POST route | String | CÓ unique | CẦN XÁC NHẬN | CÓ | - | - | - | - | CÓ | schema LedgerAccount | Không có account thì voucher/quỹ/kho/thuế lỗi. | CHẮC CHẮN |
| `TenTK` | Tên tài khoản | LedgerAccount | `name` | chưa có POST route | String | CÓ | CẦN XÁC NHẬN | CÓ | - | - | - | - | CÓ | schema LedgerAccount | - | CHẮC CHẮN |
| `LoaiTK` | Loại tài khoản | LedgerAccount | `type` | chưa có POST route | Enum | CÓ | CẦN XÁC NHẬN | CÓ | `ASSET`, `LIABILITY`, `EQUITY`, `INCOME`, `EXPENSE` | - | - | - | CÓ | schema `AccountType` | Sai loại ảnh hưởng báo cáo. | CHẮC CHẮN |
| `SoHieuTKCha` | Tài khoản cha | LedgerAccount | `parentId` | chưa rõ | FK | KHÔNG | KHÔNG | TÙY CHỌN | - | cùng sheet `SoHieuTK` | - | lookup parent account | CÓ | schema LedgerAccount | - | CHẮC CHẮN |
| `HoatDong` | Đang hoạt động | LedgerAccount | `isActive` | chưa rõ | Boolean | KHÔNG | KHÔNG | CÓ | TRUE/FALSE | - | `true` | - | CÓ | schema LedgerAccount | Inactive account bị service voucher từ chối. | CHẮC CHẮN |

### Sheet `DM_KyKeToan`

| Tên cột Excel | Tên hiển thị tiếng Việt | Model | Field DB | API payload field | Kiểu dữ liệu | Required schema | Required API/service | Required nghiệp vụ | Enum/dropdown | FK lookup | Default | Derived/tự tính | Có import | Nguồn | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `NamTaiChinh` | Năm tài chính | FiscalYear | `year` | `year` | Int | CÓ | CÓ ở `/api/reports/fiscal-years` | CÓ | - | - | - | - | CÓ | route fiscal-years, schema FiscalYear | Chưa chốt dùng FiscalYear/AccountingPeriod hay FiscalPeriod. | CẦN XÁC NHẬN |
| `MaCongTy` | Công ty | FiscalYear | `companyId` | từ user.companyId | FK | CÓ | CÓ | CÓ | - | `DM_CongTy` | user.companyId | lookup Company.id | CÓ | route fiscal-years | User thiếu company không tạo kỳ được. | CHẮC CHẮN |
| `ThangKy` | Tháng/kỳ | AccountingPeriod/FiscalPeriod | `month` | `month` | String YYYY-MM | CÓ với AccountingPeriod/FiscalPeriod | CÓ ở `/api/fiscal-periods`/periods | CÓ | - | FiscalYear | - | có thể sinh từ year/month | CÓ | schema, routes periods | Song song model kỳ gây trùng. | CẦN XÁC NHẬN |
| `TrangThaiKy` | Trạng thái kỳ | AccountingPeriod/FiscalPeriod | `status`/`isLocked` | `isLocked` | Enum/Boolean | tùy model | CÓ với fiscal-periods | CÓ | `OPEN/CLOSED` hoặc TRUE/FALSE | - | OPEN/unlocked | - | CÓ | schema PeriodStatus, route fiscal-periods | Sai trạng thái làm API chặn ghi nhận. | CẦN XÁC NHẬN |

### Sheet `DM_NhaCungCap_KhachHang`

| Tên cột Excel | Tên hiển thị tiếng Việt | Model | Field DB | API payload field | Kiểu dữ liệu | Required schema | Required API/service | Required nghiệp vụ | Enum/dropdown | FK lookup | Default | Derived/tự tính | Có import | Nguồn | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `MaDoiTac` | Mã đối tác | Supplier | `code` | accounting/procurement action chưa chốt | String | CÓ unique | CẦN XÁC NHẬN | CÓ | - | - | - | - | CÓ | schema Supplier | Không có Customer model riêng. | CHẮC CHẮN |
| `TenDoiTac` | Tên đối tác | Supplier | `name` | chưa chốt | String | CÓ | CẦN XÁC NHẬN | CÓ | - | - | - | - | CÓ | schema Supplier | - | CHẮC CHẮN |
| `LoaiDoiTac` | Nhà cung cấp/khách hàng/chủ đầu tư | Supplier hoặc Project.investor | chưa có field riêng | chưa có | Enum nghiệp vụ | KHÔNG | KHÔNG | CÓ | SUPPLIER/CUSTOMER/INVESTOR | - | - | - | CÓ/TÙY CHỌN | schema không có field | Cần tách khách hàng để AR chuẩn. | CẦN MỞ RỘNG SCHEMA |
| `ThongTinLienHe` | Thông tin liên hệ | Supplier | `description` | chưa chốt | String | KHÔNG | KHÔNG | CÓ | - | - | - | - | CÓ | schema Supplier | Dữ liệu liên hệ không cấu trúc. | SUY LUẬN NGHIỆP VỤ |

### Sheet `DM_CongTrinh`

| Tên cột Excel | Tên hiển thị tiếng Việt | Model | Field DB | API payload field | Kiểu dữ liệu | Required schema | Required API/service | Required nghiệp vụ | Enum/dropdown | FK lookup | Default | Derived/tự tính | Có import | Nguồn | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `MaDuAn` | Mã công trình | Project | không thấy `code` | không có trong `createProjectSchema` | String | KHÔNG | KHÔNG | CÓ | - | - | - | Có thể map tạm vào `description` hoặc dùng khóa ngoài bằng tên | CÓ | schema Project, `createProjectSchema` | Dễ lỗi FK giữa sheet nếu không có mã ổn định. | CẦN MỞ RỘNG SCHEMA |
| `TenDuAn` | Tên công trình | Project | `name` | `name` | String | CÓ | CÓ | CÓ | - | - | - | - | CÓ | `createProjectSchema`, `ProjectService.create` | - | CHẮC CHẮN |
| `ChuDauTu` | Chủ đầu tư | Project | `investor` | `investor` | String | KHÔNG schema required nhưng API required | CÓ | CÓ | - | Có thể lookup sheet đối tác nếu chốt | - | - | CÓ | `createProjectSchema`, `ProjectService.create` | Không có Customer model riêng. | CẦN XÁC NHẬN |
| `TrangThai` | Trạng thái | Project | `status` | `status` | Enum | KHÔNG default | KHÔNG | CÓ | `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `ACTIVE`, `CLOSED`, `ARCHIVED` | - | `PLANNED` | - | CÓ | schema `ProjectStatus` | Enum cũ `PLANNING` không hợp lệ. | CHẮC CHẮN |
| `GiaTriHopDongDuKien` | Giá trị hợp đồng dự kiến | Project | `contractValue` | `contractValue` | Decimal | KHÔNG default | KHÔNG | CÓ | - | - | `0` | - | CÓ | `createProjectSchema`, `ProjectService.create` | Có thể bị sync bởi ContractService. | CẦN XÁC NHẬN |
| `TongDuToan` | Tổng dự toán | Project | `totalBudget` | `totalBudget` | Decimal | KHÔNG default | KHÔNG | CÓ | - | - | `0` | Có thể sync từ BudgetRecord | CÓ | `ProjectService`, `BudgetService.syncProjectBudget` | Dễ lệch nếu vừa nhập project totalBudget vừa nhập BudgetRecord. | SUY LUẬN NGHIỆP VỤ |

### Sheet `DM_WBS`

| Tên cột Excel | Tên hiển thị tiếng Việt | Model | Field DB | API payload field | Kiểu dữ liệu | Required schema | Required API/service | Required nghiệp vụ | Enum/dropdown | FK lookup | Default | Derived/tự tính | Có import | Nguồn | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `MaDuAn` | Mã công trình | WBSItem | `projectId` | `projectId` | FK | CÓ | CÓ | CÓ | - | `DM_CongTrinh` | - | lookup Project.id | CÓ | `createWBSSchema`, WBS schema | Phụ thuộc quyết định `MaDuAn`. | CẦN XÁC NHẬN |
| `MaWBS` | Mã WBS | WBSItem | `code` | `code` | String | KHÔNG | KHÔNG | CÓ | - | - | - | - | CÓ | schema WBSItem, `createWBSSchema` | Không unique DB; cần unique nghiệp vụ theo project. | SUY LUẬN NGHIỆP VỤ |
| `TenWBS` | Tên WBS | WBSItem | `name` | `name` | String | CÓ | CÓ | CÓ | - | - | - | - | CÓ | `createWBSSchema` | - | CHẮC CHẮN |
| `MaWBSCha` | Mã WBS cha | WBSItem | `parentId` | `parentId` | FK | KHÔNG | KHÔNG | TÙY CHỌN | - | cùng sheet | - | lookup parent id | CÓ | `WBSService.create` | Code con phải theo prefix cha nếu cả hai có code. | CHẮC CHẮN |
| `ThuTu` | Thứ tự | WBSItem | `sortOrder` | `sortOrder` | Int | KHÔNG | KHÔNG | TÙY CHỌN | - | - | `0` | - | CÓ | `createWBSSchema` | - | CHẮC CHẮN |

### Sheet `DM_DuToan`

| Tên cột Excel | Tên hiển thị tiếng Việt | Model | Field DB | API payload field | Kiểu dữ liệu | Required schema | Required API/service | Required nghiệp vụ | Enum/dropdown | FK lookup | Default | Derived/tự tính | Có import | Nguồn | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `MaDuAn` | Công trình | BudgetRecord | `projectId` | `projectId` | FK | CÓ | CÓ | CÓ | - | `DM_CongTrinh` | - | lookup Project.id | CÓ | `createBudgetSchema` | - | CẦN XÁC NHẬN |
| `MaWBS` | WBS | BudgetRecord | `wbsId` | `wbsId` | FK | CÓ | CÓ | CÓ | - | `DM_WBS` | - | lookup WBS.id | CÓ | `BudgetService.create` | WBS phải thuộc Project. | CHẮC CHẮN |
| `LoaiChiPhi` | Loại chi phí | BudgetRecord | `costType` | `costType` | Enum | KHÔNG default | KHÔNG | CÓ | `material`, `labor`, `machine`, `subcontract`, `overhead`, `other` | - | `material` | - | CÓ | schema `CostType`, `createBudgetSchema` | Sai enum reject. | CHẮC CHẮN |
| `SoTienDuToan` | Số tiền dự toán | BudgetRecord | `estimatedAmount` | `estimatedAmount` | Decimal | CÓ | CÓ | CÓ | - | - | - | - | CÓ | `createBudgetSchema` | API yêu cầu > 0. | CHẮC CHẮN |

### Sheet `DM_HopDong`

| Tên cột Excel | Tên hiển thị tiếng Việt | Model | Field DB | API payload field | Kiểu dữ liệu | Required schema | Required API/service | Required nghiệp vụ | Enum/dropdown | FK lookup | Default | Derived/tự tính | Có import | Nguồn | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `MaDuAn` | Công trình | Contract | `projectId` | `projectId` | FK | CÓ | CÓ | CÓ | - | `DM_CongTrinh` | - | lookup Project.id | CÓ | `ContractService.createContract` | - | CẦN XÁC NHẬN |
| `SoHopDong` | Số hợp đồng | Contract | `contractNumber` | `contractNumber` | String | KHÔNG unique optional | KHÔNG | CÓ | - | - | - | - | CÓ | schema Contract, service | Nếu trống khó đối chiếu. | CHẮC CHẮN |
| `TenHopDong` | Tên hợp đồng | Contract | `title` | `title` | String | CÓ | CÓ | CÓ | - | - | - | - | CÓ | schema Contract, service | - | CHẮC CHẮN |
| `GiaTriGoc` | Giá trị gốc | Contract | `originalValue` | `originalValue` | Decimal | CÓ | CÓ | CÓ | - | - | - | - | CÓ | `ContractService.createContract` | Service sync Project.contractValue. | CHẮC CHẮN |
| `GiaTriHienTai` | Giá trị hiện tại | Contract | `currentValue` | không nhập trực tiếp khi create | Decimal | CÓ | service set = originalValue | CÓ | - | - | `originalValue` | sync từ change/VO | KHÔNG khi create | `ContractService.createContract` | Nhập tay dễ lệch phụ lục. | CHẮC CHẮN |
| `NhaThauNhaCungCap` | Nhà thầu/NCC | Contract | `contractorName`/`supplierId` | `contractorName` | String/FK | KHÔNG | KHÔNG | CÓ | - | `DM_NhaCungCap_KhachHang` nếu dùng `supplierId` | - | - | CÓ | schema Contract, service | Service create hiện dùng text `contractorName`, schema có `supplierId`. | CẦN XÁC NHẬN |
| `NgayKy` | Ngày ký | Contract | `signedDate` | chưa có trong `createContract` | Date | KHÔNG | KHÔNG | CÓ | - | - | - | - | CÓ/TÙY CHỌN | schema Contract | Service hiện chưa nhận field này. | CẦN XÁC NHẬN |
| `FileHopDong` | File hợp đồng | Document | chưa chốt field | chưa có | String/URL | KHÔNG | KHÔNG | CÓ | - | `GD_TaiLieu` GĐ2 | - | - | KHÔNG GĐ1 | Document model | Cần chính sách file/storage. | CẦN MỞ RỘNG SCHEMA |

### Sheet `GD_HoaDon`

| Tên cột Excel | Tên hiển thị tiếng Việt | Model | Field DB | API payload field | Kiểu dữ liệu | Required schema | Required API/service | Required nghiệp vụ | Enum/dropdown | FK lookup | Default | Derived/tự tính | Có import | Nguồn | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `MaDuAn` | Công trình | Invoice | `projectId` | `projectId` | FK | CÓ | CÓ | CÓ | - | `DM_CongTrinh` | - | lookup Project.id | CÓ | `createInvoiceSchema`, `RevenueService.createInvoice` | - | CẦN XÁC NHẬN |
| `MaWBS` | WBS | Invoice | `wbsId` | `wbsId` | FK | CÓ | CÓ | CÓ | - | `DM_WBS` | - | lookup WBS.id | CÓ | service validates WBS belongs Project | - | CHẮC CHẮN |
| `SoHoaDon` | Số hóa đơn | Invoice | `invoiceNumber` | `invoiceNumber` | String | KHÔNG | KHÔNG | CÓ | - | - | - | - | CÓ | schema Invoice | Không unique DB; cần kiểm soát nghiệp vụ. | SUY LUẬN NGHIỆP VỤ |
| `NgayHoaDon` | Ngày hóa đơn | Invoice | `issuedDate` | `issuedDate` | Date | KHÔNG default | KHÔNG | CÓ | - | kỳ kế toán | now | - | CÓ | service checks period | Sai kỳ bị chặn. | CHẮC CHẮN |
| `NgayDenHan` | Ngày đến hạn | Invoice | `dueDate` | `dueDate` | Date | KHÔNG | KHÔNG | CÓ | - | - | - | - | CÓ | schema + validation | Ảnh hưởng aging. | CHẮC CHẮN |
| `TienTruocVAT` | Tiền trước VAT | Invoice | `netAmount` | `netAmount` | Decimal | KHÔNG | service dùng `netAmount || amount` | CÓ | - | - | từ `amount` nếu trống | - | CÓ | `RevenueService.createInvoice` | Nếu nhập amount là gross cần thống nhất. | CẦN XÁC NHẬN |
| `VATRate` | Thuế suất VAT | Invoice | `vatRate` | `vatRate` | Decimal | KHÔNG | KHÔNG | CÓ | - | - | `10` | - | CÓ | service | - | CHẮC CHẮN |
| `VATAmount` | Tiền VAT | Invoice | `vatAmount` | service tự tính | Decimal | KHÔNG | KHÔNG | CÓ | - | - | net*rate | Tự tính | KHÔNG nếu dùng service | service | Nhập tay có thể lệch. | CHẮC CHẮN |
| `TongTien` | Tổng tiền | Invoice | `amount` | `amount` | Decimal | CÓ | CÓ | CÓ | - | - | gross | service set gross | CÓ | schema Invoice, service | Cần thống nhất amount là gross theo service. | CẦN XÁC NHẬN |
| `TrangThai` | Trạng thái | Invoice | `status` | `status` | Enum | KHÔNG default | KHÔNG | CÓ | `DRAFT`, `SENT`, `PARTIAL`, `PAID`, `OVERDUE` | - | `DRAFT` | - | CÓ | schema InvoiceStatus | - | CHẮC CHẮN |

### Sheet `GD_HoaDonThue`

| Tên cột Excel | Tên hiển thị tiếng Việt | Model | Field DB | API payload field | Kiểu dữ liệu | Required schema | Required API/service | Required nghiệp vụ | Enum/dropdown | FK lookup | Default | Derived/tự tính | Có import | Nguồn | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `LoaiHoaDon` | Đầu vào/đầu ra | TaxInvoice | `invoiceType` | `invoiceType` | Enum | CÓ | CÓ | CÓ | `OUTBOUND`, `INBOUND` | - | - | - | CÓ | schema TaxInvoiceType, service | - | CHẮC CHẮN |
| `SoHoaDon` | Số hóa đơn VAT | TaxInvoice | `invoiceNumber` | `invoiceNumber` | String | CÓ | CÓ | CÓ | - | - | - | trim | CÓ | service | Unique với company/type/series. | CHẮC CHẮN |
| `KyHieu` | Ký hiệu | TaxInvoice | `invoiceSeries` | `invoiceSeries` | String | CÓ | CÓ | CÓ | - | - | - | uppercase | CÓ | service | Sai series gây trùng/sai thuế. | CHẮC CHẮN |
| `MauSo` | Mẫu số | TaxInvoice | `invoiceTemplate` | `invoiceTemplate` | String | KHÔNG default | KHÔNG | CÓ | - | - | `1C26TBB` | - | CÓ | schema + service | - | CHẮC CHẮN |
| `NgayHoaDon` | Ngày hóa đơn | TaxInvoice | `invoiceDate` | `invoiceDate` | Date | KHÔNG default | KHÔNG | CÓ | - | kỳ kế toán | now | - | CÓ | service assert period | - | CHẮC CHẮN |
| `TenDoiTac` | Người bán/người mua | TaxInvoice | `partnerName` | `partnerName` | String | CÓ | CÓ | CÓ | - | đối tác nếu chốt | - | trim | CÓ | schema + service | - | CHẮC CHẮN |
| `MSTDoiTac` | MST đối tác | TaxInvoice | `partnerTaxCode` | `partnerTaxCode` | String | CÓ | CÓ | CÓ | - | - | - | trim | CÓ | schema + service | - | CHẮC CHẮN |
| `TienTruocVAT` | Tiền trước VAT | TaxInvoice | `netAmount` | `netAmount` | Decimal | CÓ | CÓ | CÓ | - | - | - | - | CÓ | service | > 0. | CHẮC CHẮN |
| `VATRate` | Thuế suất | TaxInvoice | `vatRate` | `vatRate` | Decimal | KHÔNG default | CÓ | CÓ | - | - | `10` | - | CÓ | service + TaxPolicy | - | CHẮC CHẮN |
| `VATAmount` | Tiền VAT | TaxInvoice | `vatAmount` | `vatAmount` | Decimal | CÓ | CÓ | CÓ | - | - | - | validate tax math | CÓ | `TaxPolicy.validateTaxMath` | Sai VAT bị chặn nếu không có override. | CHẮC CHẮN |
| `TongTien` | Tổng tiền | TaxInvoice | `grossAmount` | không nhập trực tiếp | Decimal | CÓ | service tự tính | CÓ | - | - | net+vat | Tự tính | KHÔNG | service | - | CHẮC CHẮN |

### Sheet `GD_ThanhToan`

| Tên cột Excel | Tên hiển thị tiếng Việt | Model | Field DB | API payload field | Kiểu dữ liệu | Required schema | Required API/service | Required nghiệp vụ | Enum/dropdown | FK lookup | Default | Derived/tự tính | Có import | Nguồn | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `RequestId` | Mã idempotency | Payment | `requestId` | `requestId` | UUID | KHÔNG schema unique optional | CÓ | CÓ | - | - | - | - | CÓ | `createPaymentSchema`, `RevenueService.createPayment` | Thiếu requestId bị service chặn. | CHẮC CHẮN |
| `SoHoaDon` | Hóa đơn | Payment | `invoiceId` | `invoiceId` | FK | KHÔNG schema optional | CÓ | CÓ | - | `GD_HoaDon` | - | lookup Invoice.id | CÓ | payment schema/service | Payment GĐ1 bắt buộc gắn Invoice. | CHẮC CHẮN |
| `MaDuAn` | Công trình | Payment | `projectId` | `projectId` | FK | CÓ | CÓ | CÓ | - | `DM_CongTrinh` | từ Invoice nếu dùng service | lookup | CÓ | schema/payment schema | Service lấy project từ invoice khi create. | CẦN XÁC NHẬN |
| `NgayThanhToan` | Ngày thanh toán | Payment | `date` | `date` | Date | KHÔNG default | KHÔNG | CÓ | - | kỳ kế toán | now | - | CÓ | service assert period | - | CHẮC CHẮN |
| `SoTien` | Số tiền | Payment | `amount` | `amount` | Decimal | CÓ | CÓ | CÓ | - | - | - | - | CÓ | payment schema/service | Không được vượt invoice remaining/reserved. | CHẮC CHẮN |
| `DienGiai` | Diễn giải | Payment | `description` | `description` | String | KHÔNG | KHÔNG | CÓ | - | - | - | - | CÓ | schema/payment schema | - | CHẮC CHẮN |

### Sheet `GD_PhieuThuChi`

| Tên cột Excel | Tên hiển thị tiếng Việt | Model | Field DB | API payload field | Kiểu dữ liệu | Required schema | Required API/service | Required nghiệp vụ | Enum/dropdown | FK lookup | Default | Derived/tự tính | Có import | Nguồn | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `LoaiChungTu` | Loại chứng từ | CashBankDocument | `documentType` | `documentType` | Enum | CÓ | CÓ | CÓ | `CASH_RECEIPT`, `CASH_PAYMENT`, `BANK_TRANSFER`, `BANK_CREDIT_NOTICE`, `BANK_DEBIT_NOTICE` | - | - | - | CÓ | schema + service | - | CHẮC CHẮN |
| `SoChungTu` | Số chứng từ | CashBankDocument | `documentNo` | `documentNo` | String | CÓ | KHÔNG nếu để tự sinh | CÓ | - | - | tự sinh theo type/month | - | CÓ | service | Trùng số bị chặn. | CHẮC CHẮN |
| `NgayChungTu` | Ngày chứng từ | CashBankDocument | `documentDate` | `documentDate` | Date | KHÔNG default | KHÔNG | CÓ | - | - | now | - | CÓ | service | - | CHẮC CHẮN |
| `NgayHachToan` | Ngày hạch toán | CashBankDocument | `accountingDate` | `accountingDate` | Date | KHÔNG default | KHÔNG | CÓ | - | kỳ kế toán | now | - | CÓ | service assert period | Sai kỳ bị chặn. | CHẮC CHẮN |
| `SoTien` | Số tiền | CashBankDocument | `amount` | `amount` | Decimal | CÓ | CÓ | CÓ | - | - | - | - | CÓ | service | > 0. | CHẮC CHẮN |
| `PhuongThuc` | Tiền mặt/ngân hàng | CashBankDocument | `paymentMethod` | `paymentMethod` | Enum nghiệp vụ | CÓ | CÓ | CÓ | `CASH`, `BANK` | - | - | - | CÓ | service input | - | CHẮC CHẮN |
| `TaiKhoanNo` | TK Nợ | CashBankDocument | `debitAccountId` | `debitAccountId` | FK | CÓ | CÓ | CÓ | - | `DM_TaiKhoanKeToan` | - | lookup account id | CÓ | schema + service | - | CHẮC CHẮN |
| `TaiKhoanCo` | TK Có | CashBankDocument | `creditAccountId` | `creditAccountId` | FK | CÓ | CÓ | CÓ | - | `DM_TaiKhoanKeToan` | - | lookup account id | CÓ | schema + service | - | CHẮC CHẮN |
| `TrangThai` | Trạng thái | CashBankDocument | `status` | không nhập khi create | Enum | KHÔNG default | service set DRAFT | CÓ | `DRAFT`, `SUBMITTED`, `APPROVED`, `POSTED`, `REVERSED`, `CANCELLED` | - | `DRAFT` | workflow | KHÔNG khi create | schema + service | Workflow post mới sinh bút toán. | CHẮC CHẮN |

### Sheet `GD_ChiPhi`

| Tên cột Excel | Tên hiển thị tiếng Việt | Model | Field DB | API payload field | Kiểu dữ liệu | Required schema | Required API/service | Required nghiệp vụ | Enum/dropdown | FK lookup | Default | Derived/tự tính | Có import | Nguồn | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `RequestId` | Mã idempotency | CostRecord | `requestId` | `requestId` | UUID | KHÔNG unique optional | KHÔNG | CÓ | - | - | - | - | CÓ | `createCostSchema`, service | Chống nhập trùng. | CHẮC CHẮN |
| `MaDuAn` | Công trình | CostRecord | `projectId` | `projectId` | FK | CÓ | CÓ | CÓ | - | `DM_CongTrinh` | - | lookup | CÓ | schema + validation | - | CẦN XÁC NHẬN |
| `MaWBS` | WBS | CostRecord | `wbsId` | `wbsId` | FK | CÓ | CÓ | CÓ | - | `DM_WBS` | - | lookup | CÓ | service validates WBS belongs project | - | CHẮC CHẮN |
| `LoaiChiPhi` | Loại chi phí | CostRecord | `costType` | `costType` | Enum | KHÔNG default | KHÔNG | CÓ | `material`, `labor`, `machine`, `subcontract`, `overhead`, `other` | - | `material` | - | CÓ | schema + validation | - | CHẮC CHẮN |
| `SoTien` | Tổng tiền | CostRecord | `amount` | `amount` | Decimal | CÓ | CÓ | CÓ | - | - | - | net+vat theo service | CÓ | service | > 0. | CHẮC CHẮN |
| `NgayPhatSinh` | Ngày phát sinh | CostRecord | `date` | `date` | Date | KHÔNG default | KHÔNG | CÓ | - | kỳ kế toán | now | - | CÓ | service assert period | - | CHẮC CHẮN |
| `VATRate` | Thuế suất | CostRecord | `vatRate` | `vatRate` | Decimal | KHÔNG default | KHÔNG | CÓ | - | - | `10` | - | CÓ | validation/service | - | CHẮC CHẮN |
| `TienTruocVAT` | Tiền trước VAT | CostRecord | `netAmount` | `netAmount` | Decimal | KHÔNG | KHÔNG | CÓ | - | - | back-calc từ amount | Derived | CÓ | service | Cần thống nhất amount gross/net. | CẦN XÁC NHẬN |
| `NhaCungCapText` | Nhà cung cấp | CostRecord | `supplier` | `supplier` | String | KHÔNG | KHÔNG | CÓ | - | hoặc `DM_NhaCungCap` | - | - | CÓ | validation/schema | Field là text, không FK. | CẦN XÁC NHẬN |

### Sheet `GD_TamUng`

| Tên cột Excel | Tên hiển thị tiếng Việt | Model | Field DB | API payload field | Kiểu dữ liệu | Required schema | Required API/service | Required nghiệp vụ | Enum/dropdown | FK lookup | Default | Derived/tự tính | Có import | Nguồn | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `SoTamUng` | Số tạm ứng | AdvanceRequest | `advanceNo` | `advanceNo` | String | KHÔNG | KHÔNG | CÓ | - | - | - | - | CÓ | schema AdvanceRequest | Không unique DB. | SUY LUẬN NGHIỆP VỤ |
| `LoaiNguoiNhan` | Loại người nhận | AdvanceRequest | `recipientType` | `recipientType` | Enum | CÓ | policy | CÓ | `EMPLOYEE`, `VENDOR` | - | - | - | CÓ | schema AdvanceRecipientType | - | CHẮC CHẮN |
| `EmailNhanVien` | Nhân viên nhận | AdvanceRequest | `employeeId` | `employeeId` | FK | KHÔNG | policy tùy type | CÓ nếu EMPLOYEE | - | `DM_NguoiDung` | - | lookup User.id | CÓ | schema | - | CẦN XÁC NHẬN |
| `MaNCC` | Nhà cung cấp nhận | AdvanceRequest | `supplierId` | `supplierId` | FK | KHÔNG | policy tùy type | CÓ nếu VENDOR | - | `DM_NhaCungCap_KhachHang` | - | lookup Supplier.id | CÓ | schema | - | CẦN XÁC NHẬN |
| `SoTienTamUng` | Số tiền tạm ứng | AdvanceRequest | `amount` | `amount` | Decimal | CÓ | policy | CÓ | - | - | - | - | CÓ | schema + service | - | CHẮC CHẮN |
| `HanHoanUng` | Hạn hoàn ứng | AdvanceRequest | `expectedSettlementDate` | `expectedSettlementDate` | Date | KHÔNG | KHÔNG | CÓ | - | - | - | - | CÓ | schema | - | CHẮC CHẮN |
| `MucDich` | Mục đích | AdvanceRequest | `purpose` | `purpose` | String | KHÔNG | KHÔNG | CÓ | - | - | - | - | CÓ | schema | - | CHẮC CHẮN |

### Sheet `GD_HoanUng`

| Tên cột Excel | Tên hiển thị tiếng Việt | Model | Field DB | API payload field | Kiểu dữ liệu | Required schema | Required API/service | Required nghiệp vụ | Enum/dropdown | FK lookup | Default | Derived/tự tính | Có import | Nguồn | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `SoTamUng` | Phiếu tạm ứng | AdvanceSettlement | `advanceRequestId` | `advanceRequestId` | FK | CÓ | CÓ | CÓ | - | `GD_TamUng` | - | lookup AdvanceRequest.id | CÓ | service | - | CHẮC CHẮN |
| `SoTienHoanUng` | Số tiền hoàn ứng | AdvanceSettlement | `amount` | `amount` | Decimal | CÓ | CÓ | CÓ | - | - | - | - | CÓ | schema + service | Không vượt advance remaining/invoice remaining. | CHẮC CHẮN |
| `NgayHoanUng` | Ngày hoàn ứng | AdvanceSettlement | `settlementDate` | `settlementDate` | Date | KHÔNG default | KHÔNG | CÓ | - | - | now | - | CÓ | schema | Service hiện chưa kiểm tra kỳ rõ. | CẦN XÁC NHẬN |
| `SoHoaDon` | Hóa đơn bù trừ | AdvanceSettlement | `invoiceId` | `invoiceId` | FK | KHÔNG | tùy có offset | TÙY CHỌN | - | `GD_HoaDon` | - | lookup Invoice.id | CÓ | service | - | CHẮC CHẮN |
| `LyDo` | Lý do | AdvanceSettlement | `reason` | `reason` | String | KHÔNG | KHÔNG | TÙY CHỌN | - | - | - | - | CÓ | schema | - | CHẮC CHẮN |

### Sheet `DM_VatTu`

| Tên cột Excel | Tên hiển thị tiếng Việt | Model | Field DB | API payload field | Kiểu dữ liệu | Required schema | Required API/service | Required nghiệp vụ | Enum/dropdown | FK lookup | Default | Derived/tự tính | Có import | Nguồn | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `MaVatTu` | Mã vật tư | MaterialItem | `code` | `code` | String | CÓ | CÓ | CÓ | - | - | - | uppercase | CÓ | `InventoryService.createMaterialItem` | Unique theo company/code/deletedAt. | CHẮC CHẮN |
| `TenVatTu` | Tên vật tư | MaterialItem | `name` | `name` | String | CÓ | CÓ | CÓ | - | - | - | - | CÓ | schema/service | - | CHẮC CHẮN |
| `DonViTinh` | Đơn vị tính | MaterialItem | `unit` | `unit` | String | CÓ | CÓ | CÓ | - | - | - | - | CÓ | schema/service | - | CHẮC CHẮN |
| `NhomVatTu` | Nhóm vật tư | MaterialItem | `group` | `group` | String | KHÔNG | KHÔNG | TÙY CHỌN | - | - | - | - | CÓ | schema/service | - | CHẮC CHẮN |
| `TKKho` | Tài khoản kho | MaterialItem | `inventoryAccount` | `inventoryAccount` | String account code | KHÔNG default | KHÔNG | CÓ | - | `DM_TaiKhoanKeToan` | `152` | - | CÓ | service | Nếu account không tồn tại lúc post kho sẽ lỗi. | CHẮC CHẮN |
| `TKChiPhi` | Tài khoản chi phí | MaterialItem | `expenseAccount` | `expenseAccount` | String account code | KHÔNG default | KHÔNG | CÓ | - | `DM_TaiKhoanKeToan` | `621` | - | CÓ | service | - | CHẮC CHẮN |

### Sheet `DM_Kho`

| Tên cột Excel | Tên hiển thị tiếng Việt | Model | Field DB | API payload field | Kiểu dữ liệu | Required schema | Required API/service | Required nghiệp vụ | Enum/dropdown | FK lookup | Default | Derived/tự tính | Có import | Nguồn | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `MaKho` | Mã kho | Warehouse | `code` | `code` | String | CÓ | CÓ | CÓ | - | - | - | uppercase | CÓ | `InventoryService.createWarehouse` | Unique theo company/code/deletedAt. | CHẮC CHẮN |
| `TenKho` | Tên kho | Warehouse | `name` | `name` | String | CÓ | CÓ | CÓ | - | - | - | - | CÓ | schema/service | - | CHẮC CHẮN |
| `MaCongTy` | Công ty | Warehouse | `companyId` | `companyId` | FK | CÓ | CÓ hoặc từ user | CÓ | - | `DM_CongTy` | user.companyId | lookup | CÓ | schema/service | - | CHẮC CHẮN |
| `MaDuAn` | Công trình | Warehouse | `projectId` | `projectId` | FK | KHÔNG | KHÔNG | TÙY CHỌN | - | `DM_CongTrinh` | - | lookup | CÓ | schema/service | Phụ thuộc `MaDuAn`. | CẦN XÁC NHẬN |
| `QuanLyKho` | Người quản lý | Warehouse | `managerName` | `managerName` | String | KHÔNG | KHÔNG | TÙY CHỌN | - | - | - | - | CÓ | schema/service | - | CHẮC CHẮN |

### Sheet `GD_Kho_NhapXuat`

| Tên cột Excel | Tên hiển thị tiếng Việt | Model | Field DB | API payload field | Kiểu dữ liệu | Required schema | Required API/service | Required nghiệp vụ | Enum/dropdown | FK lookup | Default | Derived/tự tính | Có import | Nguồn | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `LoaiPhieu` | Loại phiếu | InventoryDocument | `documentType` | `documentType` | Enum | CÓ | CÓ | CÓ | `PURCHASE_RECEIPT`, `RETURN_RECEIPT`, `ADJUSTMENT_IN`, `ISSUE_TO_PROJECT`, `ISSUE_TO_COST`, `TRANSFER_OUT`, `TRANSFER_IN`, `ADJUSTMENT_OUT` | - | - | - | CÓ | schema + service | Quy định kho nguồn/đích phụ thuộc loại phiếu. | CHẮC CHẮN |
| `SoPhieu` | Số phiếu | InventoryDocument | `documentNo` | `documentNo` | String | CÓ | KHÔNG nếu tự sinh | CÓ | - | - | tự sinh PN/PX | - | CÓ | service | Trùng số bị chặn. | CHẮC CHẮN |
| `NgayHachToan` | Ngày hạch toán | InventoryDocument | `accountingDate` | `accountingDate` | Date | KHÔNG default | KHÔNG | CÓ | - | kỳ kế toán | now | - | CÓ | service assert period | - | CHẮC CHẮN |
| `MaVatTu` | Vật tư | InventoryDocumentLine | `materialItemId` | `lines[].materialItemId` | FK | CÓ | CÓ | CÓ | - | `DM_VatTu` | - | lookup MaterialItem.id | CÓ | service | - | CHẮC CHẮN |
| `SoLuong` | Số lượng | InventoryDocumentLine | `quantity` | `lines[].quantity` | Decimal | CÓ | CÓ | CÓ | - | - | - | - | CÓ | service validates line math | Xuất kho bị chặn nếu tồn âm. | CHẮC CHẮN |
| `DonGia` | Đơn giá | InventoryDocumentLine | `unitCost` | `lines[].unitCost` | Decimal | CÓ | CÓ | CÓ | - | - | - | - | CÓ | service | Xuất kho có thể dùng avg cost khi post. | CHẮC CHẮN |
| `MaKhoNguon` | Kho nguồn | InventoryDocumentLine | `sourceWarehouseId` | `sourceWarehouseId`/`lines[].sourceWarehouseId` | FK | KHÔNG | theo documentType khi post | CÓ với phiếu xuất/chuyển | - | `DM_Kho` | - | lookup | CÓ | service post logic | Thiếu kho nguồn làm post lỗi. | CHẮC CHẮN |
| `MaKhoDich` | Kho đích | InventoryDocumentLine | `targetWarehouseId` | `targetWarehouseId`/`lines[].targetWarehouseId` | FK | KHÔNG | theo documentType khi post | CÓ với phiếu nhập/chuyển | - | `DM_Kho` | - | lookup | CÓ | service post logic | Thiếu kho đích làm post lỗi. | CHẮC CHẮN |
| `TienTruocVAT` | Tiền trước VAT | InventoryDocumentLine | `amount` | không nhập trực tiếp | Decimal | CÓ | service tự tính | CÓ | - | - | quantity*unitCost | Tự tính | KHÔNG | service | - | CHẮC CHẮN |
| `VATRate` | Thuế suất | InventoryDocumentLine | `vatRate` | `lines[].vatRate` | Decimal | KHÔNG | KHÔNG | TÙY CHỌN | - | - | `0` | - | CÓ | service | - | CHẮC CHẮN |

### Sheet `GD_ButToan_ThuCong`

| Tên cột Excel | Tên hiển thị tiếng Việt | Model | Field DB | API payload field | Kiểu dữ liệu | Required schema | Required API/service | Required nghiệp vụ | Enum/dropdown | FK lookup | Default | Derived/tự tính | Có import | Nguồn | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `NgayHachToan` | Ngày hạch toán | JournalEntry | `date` | `date` | Date | KHÔNG default | KHÔNG | CÓ | - | kỳ kế toán | now | - | CÓ | `VoucherService.saveVoucher` | Kỳ khóa bị chặn. | CHẮC CHẮN |
| `DienGiai` | Diễn giải | JournalEntry | `description` | `description` | String | CÓ | CÓ | CÓ | - | - | - | - | CÓ | service | - | CHẮC CHẮN |
| `SoChungTu` | Số chứng từ | JournalEntry | `reference` | `reference` | String | KHÔNG | KHÔNG | CÓ | - | - | tự sinh PKT nếu trống | - | CÓ | service + VoucherNumberService | Trùng số nếu nhập tay không kiểm soát. | CHẮC CHẮN |
| `MaDuAn` | Công trình | JournalEntry | `projectId` | `projectId` | FK | KHÔNG | KHÔNG | TÙY CHỌN | - | `DM_CongTrinh` | - | lookup | CÓ | schema/service | Phụ thuộc `MaDuAn`. | CẦN XÁC NHẬN |
| `TaiKhoan` | Tài khoản | TransactionLine | `accountId` | `lines[].accountId` | FK | CÓ | CÓ | CÓ | - | `DM_TaiKhoanKeToan` | - | lookup | CÓ | service validates active accounts | - | CHẮC CHẮN |
| `LoaiPhatSinh` | Nợ/Có | TransactionLine | `type` | `lines[].type` | Enum | CÓ | CÓ | CÓ | `DEBIT`, `CREDIT` | - | - | - | CÓ | schema `TransactionType`, service | Tổng Nợ phải bằng tổng Có. | CHẮC CHẮN |
| `SoTien` | Số tiền | TransactionLine | `amount` | `lines[].amount` | Decimal | CÓ | CÓ | CÓ | - | - | - | - | CÓ | service | > 0, double-entry balance. | CHẮC CHẮN |
| `LoaiNguon` | Loại nguồn chứng từ | JournalEntry | `sourceType` | `sourceType` | String | KHÔNG | KHÔNG | TÙY CHỌN | - | - | null | - | CÓ nhưng hạn chế | schema/service | Không nhập sourceType/sourceId trùng auto docs. | CẦN XÁC NHẬN |

## QUYẾT ĐỊNH NGHIỆP VỤ CẦN XÁC NHẬN TRƯỚC TEMPLATE CUỐI

| Điểm cần chốt | Kết quả audit từ code | Phương án GĐ1 đề xuất | Rủi ro | Trạng thái |
| --- | --- | --- | --- | --- |
| `Project` và `MaDuAn` | `Project` schema không thấy `code`; `createProjectSchema` chỉ nhận `name`, `description`, `status`, `ownerId`, `contractValue`, `totalBudget`, `investor`, `projectType`, `startDate`, `endDate`; UI/API không chứng minh mã công trình riêng. | Không tự quyết. Tạm dùng `MaDuAn` làm khóa Excel nội bộ và map sang `Project.name` hoặc `description` chỉ sau khi bạn xác nhận; phương án sạch hơn là mở schema sau này. | FK giữa sheet dễ sai nếu dùng tên làm khóa. | CẦN XÁC NHẬN / CẦN MỞ RỘNG SCHEMA |
| Chủ đầu tư / khách hàng | Không thấy model `Customer`, `Client`, `Investor`; `Project` có `investor`; `Supplier` chỉ có `code/name/description`. | GĐ1 dùng `Project.investor` cho chủ đầu tư dạng text; không dùng làm Customer AR chuẩn cho tới khi xác nhận. | Công nợ phải thu không phân tích chuẩn theo khách hàng nếu chỉ là text. | CẦN XÁC NHẬN |
| `Material` legacy vs `MaterialItem` | Route kho `/api/inventory/materials`, `InventoryService`, `InventoryDocumentLine` đều dùng `MaterialItem`; `Material` chỉ liên quan model legacy như `InventoryTransaction`, `SiteConsumption`. | GĐ1 dùng `MaterialItem`; không đưa `Material` vào Excel lõi. | Nếu dữ liệu cũ nằm ở `Material`, cần migration/đối chiếu riêng. | CHẮC CHẮN cho GĐ1 |
| `FiscalPeriod` vs `FiscalYear/AccountingPeriod` | Có `/api/fiscal-periods` dùng `FiscalPeriod`; có `/api/reports/fiscal-years` tạo `FiscalYear` và liên quan `AccountingPeriod`; `lib/period.ts` gọi `AccountingGovernance.assertPeriodIsOpen`. | Chọn `FiscalYear/AccountingPeriod` làm nguồn kỳ chính cho import GĐ1; `FiscalPeriod` xem là legacy/toggle phụ, chưa import song song. | Song song hai nguồn kỳ làm khóa kỳ không nhất quán. | CẦN XÁC NHẬN |
| Nguồn dữ liệu gốc cho doanh thu | `Revenue` có route riêng nhưng `RevenueService` ghi chú báo cáo tài chính chính thức dùng ledger posted; `Invoice` và `TaxInvoice` có thể post bút toán. | GĐ1 không import `Revenue` riêng mặc định; doanh thu lấy từ `Invoice/TaxInvoice` đã post hoặc `JournalEntry` điều chỉnh được kiểm soát. | Import cả Revenue và Invoice làm trùng doanh thu. | CẦN XÁC NHẬN |
| Nguồn dữ liệu gốc cho chi phí | `CostRecord`, `InventoryDocument`, `CashBankDocument`, `JournalEntry` đều có thể ảnh hưởng chi phí/ledger. | GĐ1 dùng `CostRecord` cho chi phí dịch vụ/nhân công/phát sinh; dùng `InventoryDocument` cho vật tư kho; `JournalEntry` chỉ điều chỉnh/số dư đầu kỳ. | Nhập trùng chi phí qua CostRecord + InventoryDocument + JournalEntry. | CẦN XÁC NHẬN |
| Bút toán thủ công | `VoucherService.saveVoucher` cho phép tạo `JournalEntry/TransactionLine`, tự sinh reference, bắt cân Nợ/Có, kiểm tra kỳ và account active. | Cho import bút toán thủ công chỉ cho số dư đầu kỳ/điều chỉnh có kiểm soát; không dùng cho nghiệp vụ đã có chứng từ nguồn. | Trùng bút toán tự sinh từ hóa đơn/kho/quỹ/thuế. | CẦN XÁC NHẬN |

## Kiểm tra chất lượng trước khi dùng template draft

| Checklist | Kết quả |
| --- | --- |
| Còn kết luận gây hiểu nhầm có thể import ngay | KHÔNG trong file mapping này |
| Có tạo Excel | KHÔNG |
| Có nhập dữ liệu mới | KHÔNG |
| Có seed dữ liệu mới | KHÔNG |
| Có sửa schema/UI/code nghiệp vụ | KHÔNG |
| Có route nhập liệu nào chưa đọc sâu | Đã đọc sâu 37 route theo kiểm kê; một số route đa hành động vẫn cần khóa action trước khi dùng. |
| Có AI tự chốt quyết định nghiệp vụ | KHÔNG; các điểm cần xác nhận đã đánh dấu. |

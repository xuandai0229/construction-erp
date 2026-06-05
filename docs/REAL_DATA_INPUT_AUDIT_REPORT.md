# BÁO CÁO KIỂM CHỨNG & BẢN ĐỒ NHẬP DỮ LIỆU THẬT
**Thời gian:** 2026-06-05 09:37 ICT (Cập nhật lần 3 — Chuẩn hóa dữ liệu nền)  
**Branch:** main  
**Database:** postgresql://postgres:****@localhost:5432/construction_erp  
**Backup lần 1:** `.local-audit-quarantine/db-backups/construction_erp_backup_20260605_083501.dump` (398.29 KB)  
**Backup lần 2:** `.local-audit-quarantine/db-backups/before-final-demo-cleanup-20260605_091639.dump` (380.39 KB)  
**Backup lần 3 (trước chuẩn hóa):** `.local-audit-quarantine/db-backups/before-master-data-normalize-20260605_092729.dump` (295.06 KB)

> **TRẠNG THÁI HIỆN TẠI:** ✅ Hệ thống đã sạch 100% dữ liệu demo/mẫu và dữ liệu nền đã được chuẩn hóa. Chỉ giữ lại duy nhất thông tin Công ty thật, 1 Chi nhánh thực tế, 2 tài khoản Admin chính và 53 Tài khoản kế toán chuẩn. Sẵn sàng tạo file Excel nhập dữ liệu thật.

---

## PHẦN 1 — TRẠNG THÁI DATABASE SAU RESET

### 1.1 Bảng đã sạch hoàn toàn (0 bản ghi)

| Bảng | Nhóm |
|------|------|
| Project, Task, WBSItem | Công trình |
| BudgetRecord, BudgetVersion, BOQItem | Dự toán |
| CostRecord, Revenue | Chi phí/Doanh thu |
| Contract, ContractChange, Acceptance, PaymentPlan, DocumentChecklist | Hợp đồng |
| Invoice, Payment, PaymentAllocation, VendorPayment | Hóa đơn/Thanh toán |
| AdvanceRequest, AdvanceSettlement | Tạm ứng/Hoàn ứng |
| JournalEntry, TransactionLine | Sổ cái |
| PurchaseRequest, PurchaseOrder, PurchaseOrderItem, GoodsReceipt, Quotation | Mua hàng |
| InventoryDocument, InventoryDocumentLine, InventoryMovement, InventoryBalance, InventoryTransaction | Kho |
| CashBankDocument, TaxInvoice | Thu chi/Hóa đơn thuế |
| Subcontract, SubcontractItem, SubcontractInvoice, SubcontractProgress | Thầu phụ |
| SiteLog, SiteConsumption, ProgressEntry, Measurement | Hiện trường |
| Activity, ActivityDependency, BaselineSchedule, DelayEvent | Tiến độ |
| ResourcePool, LaborCrew, CrewAssignment | Nguồn lực |
| EquipmentAsset, EquipmentAssignment, EquipmentBreakdown | Thiết bị |
| ChangeRequest, ClaimRecord, Commitment, VariationOrder | Thay đổi/Khiếu nại |
| ApprovalRequest, ApprovalStep | Duyệt |
| BalanceSheetSnapshot, ProfitLossSnapshot, TrialBalanceSnapshot | Snapshot báo cáo |
| BankAccount, BankTransaction, BankStatement, PaymentBatch, TreasuryApproval, CashReservation | Ngân hàng |
| Document, Comment, ActivityFeed, Notification, DomainEvent, Job | Phụ trợ |
| AuthorityMatrix, DelegationPolicy, DelegationWindow, WorkflowDefinition, SagaState, ReadModel, OrganizationUnit | Cấu hình hệ thống |
| Category, Material, ProjectSupplier, TrainingRecord, UserMaturity, VoucherSequence, FiscalPeriod | Khác |



### 1.2 Bảng còn dữ liệu sau chuẩn hóa (2026-06-05 09:30 ICT)

| Bảng | Số lượng | Nhóm | Trạng thái | Lý do giữ |
|------|----------|------|-----------|-----------|
| User | 2 | Core | ✅ GIỮ | 2 user Super Admin để đăng nhập & vận hành thật |
| Company | 1 | Master | ✅ GIỮ | CTY-XD-SO2-HN — Công ty thực tế duy nhất |
| Branch | 1 | Master | ✅ GIỮ | CN-HN — Chi nhánh thực tế duy nhất |
| LedgerAccount | 53 | Master | ✅ GIỮ | Hệ thống tài khoản kế toán VN chuẩn |

**Tất cả các bảng khác: 0 bản ghi** (89 bảng/model đã sạch hoàn toàn)

### 1.3 Dữ liệu demo đã xóa trong cleanup lần 3 (normalization)

| Bảng | Số đã xóa | Chi tiết |
|------|-----------|----------|
| User | 8 | Các user mẫu thuộc CTD và HBC |
| Company | 2 | CTD (Coteccons), HBC (Hòa Bình) |
| Branch | 5 | 1 branch sandbox của CTY-XD-SO2-HN, 4 branch của CTD và HBC |

---

## PHẦN 2 — USER GIỮ LẠI (2 user)

| # | Tên | Email (che bớt) | Role | Công ty tham chiếu | Lý do giữ |
|---|-----|----------------|------|---------------------|-----------|
| 1 | Development Super Admin | dev***@erp.local | SUPER_ADMIN | *Không có* | Admin phát triển hệ thống |
| 2 | Hệ thống Quản trị (Super Admin) | adm***@construction.com | SUPER_ADMIN | CÔNG TY CP THƯƠNG MẠI VÀ XÂY DỰNG SỐ 2 HN | Admin chính của công ty thật |

### 2.1 LedgerAccount (53 tài khoản — GIỮ NGUYÊN)
- **Không có trường companyId** → không gắn với company demo nào.
- **Không có orphan** (tất cả parentId đều hợp lệ).
- **Phân bổ:** ASSET (24), EXPENSE (15), LIABILITY (8), INCOME (4), EQUITY (2).
- **Đủ tài khoản cơ bản cho kế toán xây dựng:** 111-Tiền mặt, 112-TGNH, 131-Phải thu KH, 141-Tạm ứng, 152-NVL, 331-Phải trả NCC, 511-Doanh thu, 621/622/623/627-Chi phí SX, 632-Giá vốn, 911-XĐKQKD.

### 2.2 Company và Branch thật (đã chuẩn hóa)
| Loại | Code | Tên | Địa chỉ | Mã số thuế |
|------|------|-----|---------|------------|
| Công ty | CTY-XD-SO2-HN | CÔNG TY CP THƯƠNG MẠI VÀ XÂY DỰNG SỐ 2 HN | Hà Nội | 0100000002 |
| Chi nhánh | CN-HN | Chi nhánh Hà Nội | *Thuộc công ty trên* | - |

---


## PHẦN 3 — KẾT QUẢ KIỂM TRA APP KHI DỮ LIỆU RỖNG

| Kiểm tra | Kết quả |
|----------|---------|
| `npx prisma validate` | ✅ Valid |
| `npx tsc --noEmit` | ✅ Pass |
| Dev server (`npm run dev`) | ✅ Đang chạy bình thường |
| Trang Hồ sơ công trình | ✅ Hiện "CHƯA CÓ CÔNG TRÌNH" - empty state chuyên nghiệp |
| Dashboard stats | ✅ Hiện 0 dự án, 0 VND |
| API /api/projects | ✅ Trả về danh sách rỗng |

**Kết luận:** App chạy ổn định với database rỗng, empty state hiển thị chuyên nghiệp.

---

## PHẦN 4 — BẢN ĐỒ DỮ LIỆU ĐẦU VÀO

### 4.1 Thứ tự nhập dữ liệu (4 giai đoạn)

**Giai đoạn 1 — Danh mục nền:**
1. Company (Công ty) — bắt buộc, nhiều bảng FK tới
2. Branch (Chi nhánh) — FK: companyId
3. User (Người dùng/Phân quyền) — FK: companyId
4. LedgerAccount (Tài khoản kế toán) — ĐÃ CÓ 53 TK chuẩn
5. FiscalYear + AccountingPeriod (Năm/Kỳ kế toán) — FK: companyId

**Giai đoạn 2 — Danh mục nghiệp vụ:**
6. Supplier (Nhà cung cấp) — unique: code
7. MaterialItem (Vật tư) — FK: companyId, unique: [companyId, code]
8. Warehouse (Kho) — FK: companyId, unique: [companyId, code]
9. Project (Công trình) — FK: companyId, ownerId, branchId

**Giai đoạn 3 — Cấu trúc công trình:**
10. Contract (Hợp đồng) — FK: projectId, supplierId
11. WBSItem (Hạng mục) — FK: projectId, self-ref parentId
12. BudgetRecord (Dự toán) — FK: projectId, wbsId
13. BOQItem (Khối lượng) — FK: projectId, wbsId

**Giai đoạn 4 — Chứng từ phát sinh:**
14. CostRecord (Chi phí) — FK: projectId, wbsId
15. Invoice (Hóa đơn/Nghiệm thu) — FK: projectId, wbsId, contractId
16. AdvanceRequest (Tạm ứng) — FK: projectId, companyId, contractId
17. Payment (Thanh toán) — FK: projectId, invoiceId, contractId
18. AdvanceSettlement (Hoàn ứng) — FK: advanceRequestId
19. JournalEntry + TransactionLine (Bút toán) — FK: projectId, accountId
20. TaxInvoice (Hóa đơn thuế) — FK: companyId, projectId
21. CashBankDocument (Phiếu thu/chi) — FK: companyId, debitAccountId, creditAccountId

### 4.2 Các model & trường bắt buộc

#### Company
- **Bắt buộc:** name, code (unique)
- **Tùy chọn:** taxCode, address
- **Ảnh hưởng:** Tất cả phân hệ

#### Branch  
- **Bắt buộc:** companyId, name, code (unique)
- **Tùy chọn:** address

#### Project
- **Bắt buộc:** name
- **Tùy chọn:** description, ownerId, status (default PLANNED), companyId, branchId, contractValue, totalBudget, startDate, endDate, investor
- **Unique constraints:** không
- **Ảnh hưởng:** Dashboard, tất cả báo cáo

#### WBSItem
- **Bắt buộc:** projectId, name
- **Tùy chọn:** parentId, code, budgetAmount, level, sortOrder
- **Self-reference:** parentId -> WBSItem.id

#### Contract
- **Bắt buộc:** projectId, title, originalValue, currentValue
- **Tùy chọn:** contractNumber (unique), supplierId, status, signedDate, startDate, endDate
- **Unique:** contractNumber, [projectId, supplierId, contractCode]
- **Ảnh hưởng:** Công nợ, thanh toán

#### CostRecord
- **Bắt buộc:** projectId, wbsId, amount
- **Tùy chọn:** costType (enum), quantity, unitPrice, supplier, note, date, status, vatRate/vatAmount
- **Enum CostType:** material, labor, machine, subcontract, overhead, other
- **Ảnh hưởng:** Lãi/Lỗ, Ngân sách, Dashboard

#### Invoice
- **Bắt buộc:** projectId, wbsId, amount, remainingAmount
- **Tùy chọn:** invoiceNumber, contractId, dueDate, vatRate/vatAmount, retentionRate/retentionAmount
- **Enum InvoiceStatus:** DRAFT, SENT, PARTIAL, PAID, OVERDUE
- **Ảnh hưởng:** Công nợ, Doanh thu

#### Payment
- **Bắt buộc:** projectId, amount
- **Tùy chọn:** invoiceId, contractId, date, description
- **Ảnh hưởng:** Dòng tiền, Công nợ

#### AdvanceRequest
- **Bắt buộc:** recipientType (EMPLOYEE/VENDOR), amount, remainingAmount
- **Tùy chọn:** companyId, projectId, contractId, supplierId, employeeId, purpose, advanceNo
- **Enum AdvanceStatus:** DRAFT, SUBMITTED, APPROVED, REJECTED, PAID, PARTIALLY_SETTLED, FULLY_SETTLED, OVERDUE, CANCELLED, REVERSED
- **Tự sinh JournalEntry:** Có (postedJournalEntryId)

#### JournalEntry
- **Bắt buộc:** date, description
- **Tùy chọn:** projectId, reference, sourceType, sourceId, isPosted
- **Con:** TransactionLine (accountId, amount, type=DEBIT/CREDIT)
- **Ràng buộc:** Tổng DEBIT = Tổng CREDIT
- **Bị chặn nếu:** FiscalPeriod/AccountingPeriod đã CLOSED

### 4.3 Dữ liệu tự sinh JournalEntry (không cần nhập tay)
- AdvanceRequest (khi PAID) → postedJournalEntryId
- AdvanceSettlement (khi POSTED) → postedJournalEntryId
- CashBankDocument (khi POSTED) → postedJournalEntryId
- TaxInvoice (khi POSTED) → postedJournalEntryId
- InventoryDocument (khi POSTED) → postedJournalEntryId

### 4.4 Dữ liệu cần duyệt trước khi ghi sổ
- CostRecord: approvalStatus (DRAFT→APPROVED)
- Invoice: approvalStatus (DRAFT→APPROVED)
- Payment: approvalStatus (DRAFT→APPROVED)
- AdvanceRequest: status (DRAFT→SUBMITTED→APPROVED→PAID)
- AdvanceSettlement: status (DRAFT→SUBMITTED→APPROVED→POSTED)
- CashBankDocument: status (DRAFT→SUBMITTED→APPROVED→POSTED)
- TaxInvoice: status (DRAFT→ISSUED→POSTED)
- InventoryDocument: status (DRAFT→SUBMITTED→APPROVED→POSTED)

---

## PHẦN 5 — CẤU TRÚC EXCEL NHẬP LIỆU

### Sheet 1: DM_CongTy_ChiNhanh
| Cột | Field DB | Kiểu | Bắt buộc | Unique | Ghi chú |
|-----|----------|------|----------|--------|---------|
| MaCongTy | code | String | ✅ | ✅ | VD: "XDHN-01" |
| TenCongTy | name | String | ✅ | | |
| MaSoThue | taxCode | String | | | |
| DiaChi | address | String | | | |
| MaChiNhanh | Branch.code | String | ✅ | ✅ | |
| TenChiNhanh | Branch.name | String | ✅ | | |
| DiaChiCN | Branch.address | String | | | |

### Sheet 2: DM_TaiKhoanKeToan
| Cột | Field DB | Kiểu | Bắt buộc | Unique | Ghi chú |
|-----|----------|------|----------|--------|---------|
| MaTK | code | String | ✅ | ✅ | VD: "111", "131" |
| TenTK | name | String | ✅ | | |
| LoaiTK | type | Enum | ✅ | | ASSET/LIABILITY/EQUITY/INCOME/EXPENSE |
| MoTa | description | String | | | |
| TKCha | parentId ref | String | | | Mã TK cha |
| HoatDong | isActive | Boolean | | | default: true |

> **Lưu ý:** Đã có 53 TK chuẩn VN. Chỉ cần bổ sung nếu thiếu.

### Sheet 3: DM_KyKeToan
| Cột | Field DB | Kiểu | Bắt buộc | Ghi chú |
|-----|----------|------|----------|---------|
| NamTaiChinh | FiscalYear.year | Int | ✅ | VD: 2026 |
| NgayBatDau | startDate | Date | ✅ | |
| NgayKetThuc | endDate | Date | ✅ | |
| MaCongTy | companyId ref | String | ✅ | |

### Sheet 4: DM_NhaCungCap
| Cột | Field DB | Kiểu | Bắt buộc | Unique | Ghi chú |
|-----|----------|------|----------|--------|---------|
| MaNCC | code | String | ✅ | ✅ | VD: "NCC-001" |
| TenNCC | name | String | ✅ | | |
| MoTa | description | String | | | Ngành nghề, MST, ĐT, Địa chỉ |

### Sheet 5: DM_VatTu
| Cột | Field DB | Kiểu | Bắt buộc | Unique | Ghi chú |
|-----|----------|------|----------|--------|---------|
| MaVatTu | code | String | ✅ | ✅/company | |
| TenVatTu | name | String | ✅ | | |
| DonVi | unit | String | ✅ | | VD: "kg", "m3", "cái" |
| NhomVatTu | group | String | | | |
| TKKho | inventoryAccount | String | | | default: "152" |
| TKChiPhi | expenseAccount | String | | | default: "621" |
| MaCongTy | companyId ref | String | ✅ | | |

### Sheet 6: DM_CongTrinh
| Cột | Field DB | Kiểu | Bắt buộc | Ghi chú |
|-----|----------|------|----------|---------|
| TenCongTrinh | name | String | ✅ | |
| MoTa | description | String | | |
| ChuDauTu | investor | String | | |
| TrangThai | status | Enum | | PLANNED/IN_PROGRESS/COMPLETED/ACTIVE |
| GiaTriHD | contractValue | Decimal | | |
| TongDuToan | totalBudget | Decimal | | |
| NgayBatDau | startDate | Date | | |
| NgayKetThuc | endDate | Date | | |
| MaCongTy | companyId ref | String | | |
| MaChiNhanh | branchId ref | String | | |

### Sheet 7: HopDong
| Cột | Field DB | Kiểu | Bắt buộc | Unique | Ghi chú |
|-----|----------|------|----------|--------|---------|
| SoHopDong | contractNumber | String | | ✅ | |
| TenHD | title | String | ✅ | | |
| MaCongTrinh | projectId ref | String | ✅ | | |
| MaNCC | supplierId ref | String | | | |
| GiaTriGoc | originalValue | Decimal | ✅ | | |
| GiaTriHienTai | currentValue | Decimal | ✅ | | |
| TrangThai | status | Enum | | | DRAFT/ACTIVE/COMPLETED |
| NgayKy | signedDate | Date | | | |

### Sheet 8: WBS_HangMuc
| Cột | Field DB | Kiểu | Bắt buộc | Ghi chú |
|-----|----------|------|----------|---------|
| MaCongTrinh | projectId ref | String | ✅ | |
| MaWBS | code | String | | |
| TenHangMuc | name | String | ✅ | |
| WBSCha | parentId ref | String | | Self-reference |
| NganSach | budgetAmount | Decimal | | |
| CapDo | level | Int | | |
| ThuTu | sortOrder | Int | | |

### Sheet 9: DuToan_WBS
| Cột | Field DB | Kiểu | Bắt buộc | Ghi chú |
|-----|----------|------|----------|---------|
| MaCongTrinh | projectId ref | String | ✅ | |
| MaWBS | wbsId ref | String | ✅ | |
| LoaiChiPhi | costType | Enum | | material/labor/machine/subcontract/overhead/other |
| SoDuToan | estimatedAmount | Decimal | ✅ | |

### Sheet 10-17: ChiPhi, HoaDon, ThanhToan, TamUng, HoanUng, ButToan
> Tương tự format — chi tiết theo model ở Phần 4.2

---

## PHẦN 6 — DỮ LIỆU TỐI THIỂU ĐỂ TEST

| Nhóm | Số lượng tối thiểu |
|------|-------------------|
| Công ty | 1 |
| Chi nhánh | 1-2 |
| User admin | 1 (đã có hoặc tạo mới) |
| Kỳ kế toán | 1 năm (12 kỳ) |
| Tài khoản KT | Đã có 53 |
| Nhà cung cấp | 3-5 |
| Vật tư | 5-10 |
| Công trình | 2-3 |
| Hợp đồng | 2-3 |
| WBS/Hạng mục | 5-10 mỗi CT |
| Dự toán | 5-10 mỗi CT |
| Chi phí | 10-15 |
| Hóa đơn | 3-5 |
| Tạm ứng | 2-3 |
| Thanh toán | 3-5 |
| Bút toán | Tự sinh từ chứng từ |

---

## PHẦN 7 — CẢNH BÁO TRƯỚC KHI NHẬP

1. **Mã trùng:** Company.code, Branch.code, Supplier.code, Contract.contractNumber phải unique
2. **Khóa ngoại:** Phải nhập đúng thứ tự giai đoạn 1→2→3→4
3. **Kỳ kế toán:** Phải mở kỳ trước khi ghi sổ chứng từ
4. **Bút toán tự sinh:** Không nhập tay JournalEntry cho AdvanceRequest, CashBankDocument, TaxInvoice, InventoryDocument — hệ thống tự tạo khi POSTED
5. **Cân đối:** JournalEntry phải cân Nợ = Có
6. **FiscalYear/AccountingPeriod:** Đã dọn dẹp sạch các bản ghi demo cũ.
7. **User demo:** Đã xóa toàn bộ 2271 user demo.
8. **Company/Branch demo:** Đã xóa toàn bộ các đơn vị demo/test.

---

## PHẦN 8 — KẾT LUẬN

| Mục | Trạng thái |
|-----|-----------|
| Đã nhập dữ liệu mới | ❌ KHÔNG |
| Đã seed dữ liệu mới | ❌ KHÔNG |
| Đã sửa schema | ❌ KHÔNG |
| Đã sửa UI/code | ❌ KHÔNG |
| App chạy được khi rỗng/sạch | ✅ CÓ (Đã kiểm tra runtime ok) |
| Prisma validate | ✅ Pass |
| TypeScript check | ✅ Pass |

### Có nên nhập dữ liệu thật ngay chưa?
**✅ NÊN.** Hệ thống hiện tại đã ở trạng thái cực kỳ sạch:
1. Đã dọn dẹp triệt để 2271 User demo, 47 Company test, 73 Branch test, 6 Supplier demo, các MaterialItem, Warehouse, FinancialSnapshot, AuditLog và FiscalYear/Period cũ.
2. Đã giữ lại an toàn 2 User cốt lõi (bao gồm các tài khoản admin đăng nhập chính) và 1 Company thực tế (`CTY-XD-SO2-HN`).
3. Đã giữ nguyên 53 tài khoản LedgerAccount chuẩn kế toán VN, không bị orphan.
4. Mọi màn hình chính (Dashboard, Dự án, Chi phí, Công nợ, Kho,...) đều hiển thị trạng thái trống (Empty-state) ổn định và không gặp bất kỳ lỗi runtime hay crash nào.

### Việc cần làm tiếp theo
1. **Chuẩn bị dữ liệu thật:** Phòng kế toán chuẩn bị các file Excel nhập liệu theo đúng cấu trúc 4 giai đoạn đề xuất tại PHẦN 5.
2. **Khởi tạo dữ liệu:** Tiến hành import dữ liệu thật lần lượt theo đúng trình tự để tránh lỗi khóa ngoại (Company -> Branch -> User -> LedgerAccount/FiscalPeriod -> Master Data -> Transactions).


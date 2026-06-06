# REAL TEST DATA INPUT CLEAN CHECKLIST

## 1. TÌNH TRẠNG FILE BÁO CÁO VÀ REPO

| STT | File | Có trong repo không | Đường dẫn thực tế | Ghi chú |
| --- | ---- | ------------------- | ----------------- | ------- |
| 1 | Báo cáo Phase 1 | Có | `docs/qa/REAL_TEST_DATA_INPUT_AUDIT_REPORT.md` | Bản phác thảo đầu tiên về danh mục dữ liệu đầu vào. |
| 2 | Báo cáo Phase 2 | Có (Bản sạch) | `docs/qa/REAL_TEST_DATA_INPUT_AUDIT_REPORT_EVIDENCE.md` | Báo cáo đối chiếu kỹ thuật kèm bằng chứng mã nguồn (đã loại bỏ dữ liệu mẫu). |
| 3 | Báo cáo Phase 2 (Artifact Gốc) | Không (Nằm ngoài repo) | `C:/Users/admin/.gemini/antigravity/brain/722451cd-3e02-447a-8a9a-6e0e02a1829a/REAL_TEST_DATA_INPUT_AUDIT_REPORT_EVIDENCE.md` | Bản sao được sinh tự động của mô hình AI trong thư mục app data. |
| 4 | Báo cáo Clean Checklist mới | Có | `docs/qa/REAL_TEST_DATA_INPUT_CLEAN_CHECKLIST.md` | File này (Bản checklist sạch phục vụ cho người dùng chuẩn bị dữ liệu thật). |

---

## 2. NHỮNG NỘI DUNG ĐÃ XÓA KHỎI PHASE 2 VÌ LÀ DỮ LIỆU MẪU

| STT | Nhóm dữ liệu mẫu đã phát hiện | Ví dụ loại dữ liệu bị xóa, không ghi lại giá trị cụ thể | Lý do xóa | Đã chuyển thành gì |
| --- | ----------------------------- | ------------------------------------------------------- | --------- | ------------------ |
| 1 | Dữ liệu Pháp nhân/Công ty | Tên doanh nghiệp mẫu, mã số thuế mẫu, địa chỉ mẫu | Tránh việc kế toán nhập nhầm thông tin ảo khi kiểm thử. | Thay bằng placeholder yêu cầu cung cấp tên và mã số thuế thật của doanh nghiệp. |
| 2 | Thông tin Dự án / Công trình | Tên dự án mẫu, tên chủ đầu tư mẫu, tổng giá trị mẫu | Giá trị tiền ảo không phản ánh đúng dung lượng dự toán thực tế. | Chuyển thành dạng định dạng `text` và kiểu số `Decimal/VND` thật của công trình. |
| 3 | Mã cấu trúc hạng mục (WBS) | Mã hạng mục mẫu (dạng chữ-số mẫu), tên công tác xây dựng mẫu | Các công trình xây dựng có cơ cấu WBS kỹ thuật thực tế hoàn toàn khác biệt. | Yêu cầu người dùng chuẩn bị bảng phân rã WBS thật từ dự án thực tế. |
| 4 | Nghiệp vụ Nhập/Xuất kho | Số lượng mẫu, đơn giá nhập/xuất mẫu, mã số phiếu kho mẫu | Giá trị đơn giá mẫu có thể làm sai lệch giá bình quân gia quyền di động. | Thay bằng placeholder yêu cầu cung cấp các đơn giá nhập kho thực tế từ hóa đơn mua hàng. |
| 5 | Nghiệp vụ Tài chính & Công nợ | Số tiền hóa đơn mẫu, số tiền thanh toán mẫu, số tiền tạm ứng mẫu | Số tiền giả định không kiểm chứng được tính đúng đắn của định khoản sổ kép. | Yêu cầu số tiền từ hóa đơn GTGT thật và UNC chuyển khoản thật. |
| 6 | Kịch bản UAT định lượng | Các con số tính toán mẫu về giá trị PO gốc, giá trị hóa đơn | Các con số ảo che lấp các lỗi làm tròn thập phân trong phép chia VAT và giữ lại bảo hành. | Chuyển thành các điều kiện biên nghiệp vụ: "PO gốc", "Hóa đơn tham chiếu", và "Tỷ lệ vượt quá 5%". |

---

## 3. NHỮNG KẾT LUẬN KỸ THUẬT ĐƯỢC GIỮ LẠI VÌ CÓ BẰNG CHỨNG

| STT | Kết luận | Có bằng chứng không | Evidence file/function/route | Ảnh hưởng đến dữ liệu cần chuẩn bị |
| --- | -------- | ------------------- | ---------------------------- | ---------------------------------- |
| 1 | Bắt buộc cô lập Tenant | Có | `lib/auth-guard.ts` & `app/api/projects/route.ts` | Người dùng phải chỉ định rõ `companyId` đang dùng trong session. |
| 2 | Ràng buộc cấu trúc WBS | Có | `services/wbs.service.ts` (Hàm `delete` & xóa đệ quy) | WBS con phải có mã bắt nguồn từ WBS cha để không gãy cây WBS. |
| 3 | Khóa kỳ kế toán kép | Có | `services/finance/accounting-governance.ts` (`assertPeriodIsOpen`) | Dữ liệu ngày phát sinh hóa đơn, chi phí, kho phải thuộc kỳ chưa khóa sổ. |
| 4 | Bất kiêm nhiệm (SoD) | Có | `lib/rbac.ts` & `services/advance.service.ts` | Cần chuẩn bị tối thiểu 2 tài khoản người dùng thật có role khác nhau (Tạo vs Duyệt). |
| 5 | Quy tắc 3-Way Matching | Có | `services/cost.service.ts` (`validate3WayMatch` / `3WayMatch` logic) | Phải chuẩn bị thông tin mã PO thật và mã GRN tương ứng để liên kết với chi phí. |
| 6 | Khống chế dung sai PO 5% | Có | `services/cost.service.ts` | Hóa đơn chi phí không được vượt quá 105% giá trị PO gốc đã duyệt. |
| 7 | Tự động tính giá bình quân | Có | `lib/accounting/inventoryPolicy.ts` | Khi xuất kho dự án, người dùng không cần chuẩn bị cột đơn giá xuất. |
| 8 | Chặn xuất âm kho | Có | `lib/accounting/inventoryPolicy.ts` (`assertStockAvailable`) | Số lượng xuất kho trong dữ liệu thật không được vượt quá số dư tồn kho khả dụng trước đó. |
| 9 | Bút toán đảo sổ cái | Có | `lib/accounting/postingEngine.ts` (`reverseJournal`) | Chặn xóa trực tiếp chứng từ đã POSTED; chỉ kiểm thử được qua chức năng tạo bút toán đảo. |
| 10 | Hạn mức thanh toán hóa đơn | Có | `services/payment.service.ts` & `services/revenue.service.ts` | Số tiền thanh toán (AR/AP) thực tế nhập vào phải nhỏ hơn hoặc bằng số dư công nợ của hóa đơn. |
| 11 | Ràng buộc Tạm ứng/Hoàn ứng | Có | `lib/accounting/advanceSettlementPolicy.ts` | Khoản tạm ứng phải liên kết dự án/hợp đồng và chỉ định rõ đối tượng nhận (Supplier/Employee). |

---

## 4. NHỮNG ĐIỂM CHƯA XÁC ĐỊNH HOẶC CẦN KIỂM TRA THÊM

| STT | Vấn đề | Đã tìm ở đâu | Vì sao chưa kết luận được | Cần làm gì tiếp |
| --- | ------ | ------------ | ------------------------- | --------------- |
| 1 | Đồng bộ tài khoản ngân hàng thực tế | `prisma/schema.prisma` (`model BankAccount`) | Chưa thấy file tích hợp API kết nối ngân hàng điện tử (Virtual Account/VietQR). | Cần đọc thêm `services/finance/bank-integration.service.ts` nếu có hoặc giao diện đối chiếu ngân hàng. |
| 2 | Phê duyệt đa cấp dự án | `prisma/schema.prisma` (`model ApprovalStep`) | Mã nguồn cho thấy cấu trúc phê duyệt động nhưng chưa rõ giao diện cấu hình luồng phê duyệt nằm ở đâu. | Kiểm tra các route dưới `app/api/workflows/` và giao diện Cài đặt hệ thống. |
| 3 | Tự động tính khấu hao TSCĐ/công cụ dụng cụ | `prisma/schema.prisma` | Có danh mục tài sản thiết bị (`EquipmentAsset`) nhưng chưa rõ có chạy bút toán khấu hao tự động hàng tháng không. | Quét tìm các file chạy ngầm (cron jobs) hoặc service khấu hao định kỳ. |

---

## 5. CHECKLIST FILE/BẢNG DỮ LIỆU THẬT NGƯỜI DÙNG CẦN CHUẨN BỊ

| STT | File/Bảng dữ liệu thật cần chuẩn bị | Mục đích | Bắt buộc trước? | Dùng cho module | Ghi chú |
| --- | ----------------------------------- | -------- | --------------- | --------------- | ------- |
| 1 | Bảng thông tin Công ty chủ quản | Thiết lập pháp nhân hoạt động chính | **Có** (Bước 1) | Hệ thống/Tenant | Cần MST và tên đăng ký kinh doanh chính xác. |
| 2 | Danh sách Tài khoản Kế toán | Đồng bộ bảng hệ thống tài khoản kế toán | **Có** (Bước 1) | Kế toán/Sổ cái | Khuyên dùng hệ thống tài khoản theo Thông tư 200/2014/TT-BTC. |
| 3 | Danh sách Kho hàng | Khởi tạo kho tại công trường | **Có** (Bước 1) | Vật tư/Kho | Cần mã kho viết tắt không trùng nhau. |
| 4 | Danh mục Vật tư xây dựng | Đồng bộ danh mục vật tư nhập/xuất | **Có** (Bước 1) | Vật tư/Kho | Khớp đơn vị tính (ĐVT) với thực tế. |
| 5 | Danh sách Nhà cung cấp & Thầu phụ | Quản lý đối tác thương mại | **Có** (Bước 1) | Mua sắm/Công nợ | Cần MST để đối chiếu hóa đơn điện tử. |
| 6 | Danh sách Nhân viên/Người dùng | Khởi tạo tài khoản phân quyền | **Có** (Bước 1) | Phê duyệt/SoD | Xác định người lập phiếu và người duyệt độc lập. |
| 7 | Hồ sơ Dự án / Công trình | Khởi tạo Master Node cho mọi dữ liệu | **Có** (Bước 2) | Quản lý thi công | Tên công trình và giá trị hợp đồng trúng thầu. |
| 8 | Bảng phân rã Hạng mục WBS | Tạo cấu trúc hình cây phân chia công việc | **Có** (Bước 3) | Quản lý thi công | Bắt buộc phải nhập trước khi làm Budget/Cost. |
| 9 | Bảng Dự toán Ngân sách | Khống chế chi phí dự án | **Có** (Bước 4) | Quản lý chi phí | Gắn chi tiết ngân sách vào từng mã WBS và loại chi phí. |
| 10 | Danh sách Hợp đồng / Đơn hàng (PO) | Quản lý cam kết mua sắm | Không (Bước 5) | Mua sắm/3-Way Match| Liên kết với WBS và nhà cung cấp. |
| 11 | Phiếu Nhập kho thực tế | Ghi nhận vật tư đưa vào công trường | Không (Bước 6) | Vật tư/Kho | Bắt buộc có đơn giá nhập kho thật. |
| 12 | Phiếu Xuất kho thực tế | Ghi nhận đưa vật tư vào thi công | Không (Bước 7) | Vật tư/Kho | Hệ thống tự tính đơn giá xuất, không cần chuẩn bị đơn giá. |
| 13 | Chi phí phát sinh (Cost Record) | Ghi nhận chi phí ngoài kho | Không (Bước 6) | Quản lý chi phí | Hóa đơn dịch vụ, ca máy, nhân công tổ đội. |
| 14 | Nghiệm thu sản lượng & Hóa đơn đầu ra | Ghi nhận doanh thu xây dựng | Không (Bước 6) | Doanh thu/Thu nợ | Đối chiếu với sản lượng nghiệm thu thực tế với chủ đầu tư. |
| 15 | Giao dịch Thu/Chi tiền (Payments) | Ghi nhận thanh toán và dòng tiền | Không (Bước 8) | Kế toán/Dòng tiền | Các chứng từ ủy nhiệm chi ngân hàng hoặc phiếu chi mặt. |
| 16 | Chứng từ Tạm ứng & Hoàn ứng | Quản lý công nợ tạm ứng tổ đội/nhân viên | Không (Bước 5) | Tạm ứng | Cần mã nhân viên hoặc mã nhà cung cấp khớp danh mục. |

---

## 6. CỘT CẦN CÓ CHO TỪNG FILE/BẢNG DỮ LIỆU THẬT

### 6.1. Bảng Thông tin Công ty chủ quản (Tenant)
| Cột cần chuẩn bị | Bắt buộc? | Kiểu dữ liệu/format | Nguồn lấy từ thực tế | Dùng cho UI/API/DB nào | Ghi chú |
| ---------------- | --------- | ------------------- | -------------------- | ---------------------- | ------- |
| Tên công ty | Bắt buộc | `text` | Giấy đăng ký kinh doanh | DB: `Company.name` | Không viết tắt tùy tiện. |
| Mã số thuế | Bắt buộc | `text` | Giấy đăng ký kinh doanh | DB: `Company.taxCode` | Dùng để validate xuất hóa đơn. |
| Địa chỉ văn phòng | Bắt buộc | `text` | Giấy đăng ký kinh doanh | DB: `Company.address` | Địa chỉ pháp lý chính thức. |

### 6.2. Danh sách Tài khoản Kế toán (Ledger Account)
| Cột cần chuẩn bị | Bắt buộc? | Kiểu dữ liệu/format | Nguồn lấy từ thực tế | Dùng cho UI/API/DB nào | Ghi chú |
| ---------------- | --------- | ------------------- | -------------------- | ---------------------- | ------- |
| Số hiệu tài khoản | Bắt buộc | `text` | Hệ thống tài khoản DN | DB: `LedgerAccount.code` | Ví dụ: 1111, 1121, 152, 331, 621, 627... |
| Tên tài khoản | Bắt buộc | `text` | Danh mục tài khoản | DB: `LedgerAccount.name` | Tên chi tiết theo TT200. |
| Tính chất tài khoản| Bắt buộc | `enum: DEBIT / CREDIT` | Chế độ kế toán hiện hành | DB: `LedgerAccount.type` | Xác định số dư bên Nợ hay bên Có. |

### 6.3. Danh mục Vật tư xây dựng (Material Item)
| Cột cần chuẩn bị | Bắt buộc? | Kiểu dữ liệu/format | Nguồn lấy từ thực tế | Dùng cho UI/API/DB nào | Ghi chú |
| ---------------- | --------- | ------------------- | -------------------- | ---------------------- | ------- |
| Mã vật tư | Bắt buộc | `text` | Mã quản lý nội bộ DN | DB: `MaterialItem.code` | Ví dụ mã thép, mã xi măng viết tắt của DN. |
| Tên vật tư | Bắt buộc | `text` | Danh mục kỹ thuật | DB: `MaterialItem.name` | Tên quy cách kỹ thuật chi tiết. |
| Đơn vị tính | Bắt buộc | `text` | Thực tế giao dịch | DB: `MaterialItem.unit` | Tấn, kg, khối, m2, cái... |
| Thuế suất mặc định | Bắt buộc | `number` | Quy định thuế GTGT | DB: `MaterialItem.vatRate` | Nhập dạng số nguyên (ví dụ: 10 hoặc 8). |

### 6.4. Danh sách Kho hàng (Warehouse)
| Cột cần chuẩn bị | Bắt buộc? | Kiểu dữ liệu/format | Nguồn lấy từ thực tế | Dùng cho UI/API/DB nào | Ghi chú |
| ---------------- | --------- | ------------------- | -------------------- | ---------------------- | ------- |
| Mã kho | Bắt buộc | `text` | Mã viết tắt của DN | DB: `Warehouse.code` | Mã viết tắt định vị kho công trường. |
| Tên kho | Bắt buộc | `text` | Tên gọi công trường | DB: `Warehouse.name` | Tên kho để phân biệt trên phiếu kho. |
| Địa điểm | Tùy chọn | `text` | Địa chỉ công trường | DB: `Warehouse.address` | Vị trí đặt kho vật tư. |

### 6.5. Danh sách Nhà cung cấp & Thầu phụ (Supplier)
| Cột cần chuẩn bị | Bắt buộc? | Kiểu dữ liệu/format | Nguồn lấy từ thực tế | Dùng cho UI/API/DB nào | Ghi chú |
| ---------------- | --------- | ------------------- | -------------------- | ---------------------- | ------- |
| Mã đối tác | Bắt buộc | `text` | Mã quản lý nội bộ DN | DB: `Supplier.code` | Mã viết tắt nhà cung cấp. |
| Tên đối tác | Bắt buộc | `text` | Giấy đăng ký kinh doanh | DB: `Supplier.name` | Tên đầy đủ của đơn vị bán hàng. |
| Mã số thuế | Bắt buộc | `text` | Giấy đăng ký kinh doanh | DB: `Supplier.taxCode` | MST đối tác bán hàng. |

### 6.6. Hồ sơ Dự án / Công trình (Project)
| Cột cần chuẩn bị | Bắt buộc? | Kiểu dữ liệu/format | Nguồn lấy từ thực tế | Dùng cho UI/API/DB nào | Ghi chú |
| ---------------- | --------- | ------------------- | -------------------- | ---------------------- | ------- |
| Tên dự án | Bắt buộc | `text` | Hợp đồng giao thầu | UI: AddProjectModal | Tên đầy đủ của công trình thi công. |
| Chủ đầu tư | Bắt buộc | `text` | Hợp đồng giao thầu | UI: AddProjectModal | Pháp nhân đại diện chủ đầu tư. |
| Giá trị hợp đồng | Bắt buộc | `Decimal/VND` | Hợp đồng giao thầu | UI: AddProjectModal | Giá trị trúng thầu trước hoặc sau thuế. |
| Ngày bắt đầu | Tùy chọn | `YYYY-MM-DD` | Tiến độ hợp đồng | UI: AddProjectModal | Ngày khởi công thực tế. |
| Ngày kết thúc | Tùy chọn | `YYYY-MM-DD` | Tiến độ hợp đồng | UI: AddProjectModal | Ngày dự kiến hoàn thành bàn giao. |

### 6.7. Bảng phân rã Hạng mục WBS (WBS Item)
| Cột cần chuẩn bị | Bắt buộc? | Kiểu dữ liệu/format | Nguồn lấy từ thực tế | Dùng cho UI/API/DB nào | Ghi chú |
| ---------------- | --------- | ------------------- | -------------------- | ---------------------- | ------- |
| Mã hạng mục | Bắt buộc | `text` | Dự toán thiết kế thi công | UI: AddWBSModal | Mã phân cấp. Ví dụ: A, A.01, A.01.01. |
| Tên hạng mục | Bắt buộc | `text` | Dự toán thiết kế thi công | UI: AddWBSModal | Tên công tác hoặc phân đoạn thi công. |
| Mã hạng mục cha | Tùy chọn | `text` | Bảng phân cấp | UI: AddWBSModal | Bỏ trống nếu là hạng mục gốc cao nhất. |

### 6.8. Bảng Dự toán Ngân sách (Budget Record)
| Cột cần chuẩn bị | Bắt buộc? | Kiểu dữ liệu/format | Nguồn lấy từ thực tế | Dùng cho UI/API/DB nào | Ghi chú |
| ---------------- | --------- | ------------------- | -------------------- | ---------------------- | ------- |
| Mã hạng mục WBS | Bắt buộc | `text` | Bảng dự toán nội bộ | UI: AddBudgetModal | Phải khớp chính xác với mã WBS ở trên. |
| Loại chi phí | Bắt buộc | `enum theo hệ thống`| Bảng dự toán nội bộ | UI: AddBudgetModal | Nhận giá trị: `material`, `labor`, `machine`, `subcontract`, `overhead`, `other`. |
| Giá trị dự toán | Bắt buộc | `Decimal/VND` | Bảng dự toán nội bộ | UI: AddBudgetModal | Tổng tiền ngân sách được phê duyệt chi. |

### 6.9. Phiếu Nhập kho (Purchase Receipt)
| Cột cần chuẩn bị | Bắt buộc? | Kiểu dữ liệu/format | Nguồn lấy từ thực tế | Dùng cho UI/API/DB nào | Ghi chú |
| ---------------- | --------- | ------------------- | -------------------- | ---------------------- | ------- |
| Số chứng từ | Bắt buộc | `text` | Biên bản giao nhận | UI: InventoryDocumentForm | Số phiếu giao nhận vật tư của thủ kho. |
| Ngày hạch toán | Bắt buộc | `YYYY-MM-DD` | Ngày giao nhận vật tư | UI: InventoryDocumentForm | Phải nằm trong kỳ kế toán chưa khóa sổ. |
| Nhà cung cấp | Bắt buộc | `text` | Hóa đơn/Biên bản giao | UI: InventoryDocumentForm | Chọn từ danh mục nhà cung cấp đã tạo. |
| Mã vật tư chi tiết | Bắt buộc | `text` | Biên bản giao nhận | UI: InventoryDocumentLinesTable | Khớp với danh mục vật tư đã tạo. |
| Số lượng nhập | Bắt buộc | `number` | Biên bản giao nhận | UI: InventoryDocumentLinesTable | Số lượng thực tế kiểm đếm nhập kho. |
| Đơn giá nhập | Bắt buộc | `Decimal/VND` | Hóa đơn mua hàng | UI: InventoryDocumentLinesTable | Đơn giá mua thực tế chưa thuế. |

### 6.10. Phiếu Xuất kho (Issue to Project)
| Cột cần chuẩn bị | Bắt buộc? | Kiểu dữ liệu/format | Nguồn lấy từ thực tế | Dùng cho UI/API/DB nào | Ghi chú |
| ---------------- | --------- | ------------------- | -------------------- | ---------------------- | ------- |
| Số chứng từ | Bắt buộc | `text` | Phiếu yêu cầu vật tư | UI: InventoryDocumentForm | Số phiếu xuất vật tư của công trường. |
| Ngày xuất | Bắt buộc | `YYYY-MM-DD` | Ngày thực tế xuất kho | UI: InventoryDocumentForm | Phải nằm trong kỳ kế toán chưa khóa sổ. |
| Mã vật tư chi tiết | Bắt buộc | `text` | Phiếu yêu cầu vật tư | UI: InventoryDocumentLinesTable | Khớp với danh mục vật tư đã tạo. |
| Số lượng xuất | Bắt buộc | `number` | Phiếu yêu cầu vật tư | UI: InventoryDocumentLinesTable | Số lượng xuất cấp cho đội thi công. |
| Mã WBS sử dụng | Bắt buộc | `text` | Biện pháp thi công | UI: InventoryDocumentLinesTable | Chỉ định rõ vật tư xuất dùng cho hạng mục nào. |
| Đơn giá xuất | *Không* | *Hệ thống tự tính* | Giá bình quân di động | DB: `InventoryDocumentLine.unitCost` | **Để trống.** Hệ thống tự tính toán tự động. |

---

## 7. THỨ TỰ NHẬP DỮ LIỆU THẬT VÀO APP

Để tránh phát sinh lỗi khóa ngoại (Foreign Key Constraints) và lỗi logic nghiệp vụ trong quá trình kiểm thử hệ thống, dữ liệu thật phải được nhập theo đúng trình tự dưới đây:

| Bước | Nhóm dữ liệu nhập | Vì sao phải nhập trước | Phụ thuộc vào | Nếu thiếu sẽ lỗi/rỗng ở đâu |
| ---- | ----------------- | ---------------------- | ------------- | --------------------------- |
| 1 | Master Data nền tảng | Thiết lập môi trường vận hành cơ sở (Công ty, Kỳ kế toán, Người dùng, Tài khoản hạch toán, Vật tư, Kho, Nhà cung cấp). | Không phụ thuộc | Hệ thống không thể tạo bất kỳ chứng từ nào vì các trường liên kết danh mục bị trống. |
| 2 | Hồ sơ Dự án | Tạo thực thể trung tâm quản lý hoạt động công trình. | Công ty chủ quản (Tenant) | Mọi phân hệ thi công, ngân sách và kho bãi không chọn được dự án hoạt động. |
| 3 | Cấu trúc hạng mục WBS | Định hình cây phân cấp quản lý công việc của công trình. | Hồ sơ Dự án | Không thể phân bổ dự toán ngân sách và không thể gán chi phí chi tiết theo hạng mục. |
| 4 | Dự toán Ngân sách (Budget)| Thiết lập trần kiểm soát chi phí thực tế cho công trường. | Hạng mục WBS & Tài khoản hạch toán | Hệ thống sẽ báo chi phí phát sinh là "mồ côi" (Orphans) hoặc không kiểm soát được cảnh báo vượt ngân sách. |
| 5 | Tạm ứng & Hợp đồng (PO) | Cam kết mua sắm và cấp hạn mức tiền mặt trước khi thi công. | Dự án & Nhà cung cấp | Không thực hiện được 3-Way Matching và không lập được phiếu hoàn ứng công nợ. |
| 6 | Nhập kho / Chi phí thực tế | Ghi nhận chi phí phát sinh thực tế tại công trường. | Dự án, WBS, Kho, Vật tư, PO | Không có dữ liệu tồn kho để xuất và không có số dư công nợ phải trả (AP) để thực hiện thanh toán chi quỹ. |
| 7 | Xuất kho thi công | Ghi nhận tiêu hao vật tư phục vụ xây lắp trực tiếp. | Phiếu Nhập kho trước đó (để có số tồn), Mã WBS | Báo lỗi xuất âm kho (Negative Stock) hoặc lỗi thiếu hạng mục phân bổ chi phí vật tư. |
| 8 | Hóa đơn đầu ra & Doanh thu | Ghi nhận doanh thu xây lắp được chủ đầu tư nghiệm thu. | Dự án & WBS | Không có hóa đơn đầu ra để thực hiện ghi nhận thu tiền (AR). |
| 9 | Giao dịch Thu/Chi quỹ | Thực hiện tất toán các nghĩa vụ công nợ thực tế. | Hóa đơn đầu ra (để thu), Chi phí/PO (để chi) | Báo lỗi thanh toán vượt quá số dư công nợ hoặc không ghi sổ cái được do thiếu đối chiếu. |
| 10| Hoàn ứng tạm ứng (Settlement)| Tất toán số dư tạm ứng của tổ đội/nhân viên. | Chứng từ Tạm ứng & Hóa đơn chi phí | Khoản tạm ứng bị treo trên báo cáo tuổi nợ và số dư kế toán. |

---

## 8. MAPPING DỮ LIỆU THẬT VỚI MÀN HÌNH NHẬP

| Màn hình/Form | Dữ liệu cần có trước | Field người dùng nhập | Dropdown/phụ thuộc | API gọi | Model DB | Evidence |
| ------------- | -------------------- | --------------------- | ------------------ | ------- | -------- | -------- |
| **AddProjectModal** | Company (Tenant) | Tên dự án, Chủ đầu tư, Giá trị hợp đồng, Ngày bắt đầu, Ngày kết thúc | Trạng thái (ProjectStatus) | `POST /api/projects` | `Project` | `app/components/modals/AddProjectModal.tsx` |
| **AddWBSModal** | Project | Tên hạng mục, Mã hạng mục | Hạng mục cha (parentId) | `POST /api/wbs` | `WBSItem` | `app/components/modals/AddWBSModal.tsx` |
| **AddBudgetModal** | Project, WBS | Giá trị ngân sách | Loại chi phí (costType) | `POST /api/budgets` | `BudgetRecord` | `app/components/modals/AddBudgetModal.tsx` |
| **AddCostModal** | Project, WBS | Số tiền trước thuế, Tên nhà cung cấp, Diễn giải | Loại chi phí, VAT Rate, Retention Rate | `POST /api/costs` | `CostRecord` | `app/components/modals/AddCostModal.tsx` |
| **AddInvoiceModal** | Project, WBS | Số hóa đơn, Giá trị hóa đơn, Ngày xuất | Trạng thái hóa đơn | `POST /api/invoices` | `Invoice` | `app/components/modals/AddInvoiceModal.tsx` |
| **AddPaymentModal** | Project, Invoice | Số tiền thu, Diễn giải | Chọn hóa đơn gốc cần thu | `POST /api/payments` | `Payment` | `app/components/modals/AddPaymentModal.tsx` |
| **VendorPaymentModal**| Cost Record (AP) | Số tiền chi, Ngày chi, Số chứng từ | Chọn phiếu chi phí cần trả | `POST /api/costs/[id]/payment` | `VendorPayment` | `app/components/modals/VendorPaymentModal.tsx` |
| **InventoryDocumentForm**| Project, Kho, Vật tư, WBS | Số phiếu kho, Ngày hạch toán, Số lượng, Đơn giá nhập | Loại chứng từ kho, Kho nguồn, Kho đích | `POST /api/inventory/documents` | `InventoryDocument` | `app/components/inventory/InventoryDocumentForm.tsx` |

---

## 9. MAPPING DỮ LIỆU THẬT VỚI BÁO CÁO/DASHBOARD/IN/EXPORT

| Màn hình/Báo cáo | Dữ liệu cần có để không trống | Dữ liệu cần có để kiểm tra đúng/sai | API/service/model liên quan | Evidence |
| ---------------- | ----------------------------- | ----------------------------------- | --------------------------- | -------- |
| **Executive Dashboard** | Danh mục Dự án | Số dư tài khoản kế toán phát sinh, tổng giá trị ngân sách | `GET /api/dashboard/stats` | `app/api/dashboard/stats/route.ts` |
| **Báo cáo Lãi/Lỗ Dự án (Profitability)** | Dự án, WBS, Chi phí (Cost), Hóa đơn (Invoice) | Doanh thu đầu ra đối chiếu với tổng chi phí nhân công, vật tư thi công | `GET /api/reports/management/project-profitability` | `app/api/reports/management/project-profitability/route.ts` |
| **Báo cáo Tuổi nợ (Aging)** | Hóa đơn đầu ra, Chi phí đầu vào, Thanh toán | Số ngày quá hạn thu/chi dựa trên ngày chứng từ và điều khoản thanh toán | `GET /api/reports/aging` | `app/api/reports/aging/route.ts` |
| **Sổ Thẻ kho (Stock Card)** | Danh mục Vật tư, Kho hàng, Phiếu kho | Số lượng xuất, nhập, đơn giá bình quân gia quyền di động tính toán tự động | `GET /api/inventory/reports/stock-card` | `app/api/inventory/reports/stock-card/route.ts` |
| **Sổ Nhật ký chung (Journal)** | Tài khoản kế toán, Giao dịch phát sinh | Các dòng định khoản đối ứng Nợ/Có cân bằng nhau cho từng nghiệp vụ | `GET /api/reports/general-journal` | `app/api/reports/general-journal/route.ts` |
| **Bảng Cân đối tài khoản (Trial Balance)**| Số dư đầu kỳ các tài khoản | Các bút toán phát sinh trong kỳ kế toán đã hạch toán sổ cái | `GET /api/reports/trial-balance` | `app/api/reports/trial-balance/route.ts` |

---

## 10. CHECKLIST DỮ LIỆU ĐỂ TEST LỖI NGHIỆP VỤ

| STT | Lỗi nghiệp vụ cần test | Điều kiện dữ liệu thật cần chuẩn bị | Có rule trong code không | Evidence | Ghi chú |
| --- | ---------------------- | ----------------------------------- | ------------------------ | -------- | ------- |
| 1 | Khóa sổ kỳ kế toán | 01 chứng từ thật. Tháng hạch toán trùng với `AccountingPeriod` có trạng thái `CLOSED`. | Có | `services/finance/accounting-governance.ts` | Trả về thông báo lỗi khóa sổ của CFO. |
| 2 | Bất kiêm nhiệm phê duyệt | Tài khoản phê duyệt trùng với tài khoản người tạo đề nghị tạm ứng. | Có | `lib/rbac.ts` | Trả về lỗi vi phạm nguyên tắc SoD. |
| 3 | Xuất âm kho vật tư | Số lượng xuất lớn hơn số dư tồn kho khả dụng tại kho nguồn. | Có | `lib/accounting/inventoryPolicy.ts` | Báo lỗi số lượng xuất vượt tồn khả dụng. |
| 4 | Trả vượt nợ nhà cung cấp | Số tiền chi thực tế lớn hơn số nợ còn lại của phiếu chi phí. | Có | `services/payment.service.ts` | Trả về lỗi ngăn chặn thanh toán vượt định mức. |
| 5 | Thu vượt nợ khách hàng | Số tiền thu thực tế lớn hơn số nợ còn lại của hóa đơn đầu ra. | Có | `services/revenue.service.ts` | Trả về lỗi số tiền thu vượt quá số dư hóa đơn. |
| 6 | Vượt định mức PO (3-Way Match)| Giá trị hóa đơn thanh toán lớn hơn 105% giá trị PO gốc đã duyệt. | Có | `services/cost.service.ts` | Chặn tạo chứng từ chi phí và cảnh báo chênh lệch PO. |
| 7 | Tạm ứng thiếu thông tin | Đề nghị tạm ứng bỏ trống cả dự án và hợp đồng, hoặc bỏ trống đối tượng nhận tiền. | Có | `lib/accounting/advanceSettlementPolicy.ts` | Báo lỗi yêu cầu thông tin dự án/hợp đồng và đối tượng. |
| 8 | Hoàn ứng vượt số dư tạm ứng | Giá trị hoàn ứng đối trừ lớn hơn số tiền tạm ứng còn lại của người nhận. | Có | `lib/accounting/advanceSettlementPolicy.ts` | Báo lỗi giá trị hoàn ứng vượt số dư tạm ứng. |
| 9 | Đối trừ chéo công ty | Hóa đơn thuộc Company A nhưng tạm ứng thuộc Company B. | Có | `lib/accounting/advanceSettlementPolicy.ts` | Báo lỗi ngăn chặn cross-company offset. |
| 10| Sửa chứng từ đã ghi sổ | Chứng từ ở trạng thái `POSTED` trong CSDL bị gửi lệnh cập nhật trực tiếp. | Có | `services/finance/accounting-governance.ts` | Báo lỗi yêu cầu tạo bút toán đảo ngược thay thế. |

---

## 11. NHỮNG DỮ LIỆU TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ BỊA KHI UAT

| Nhóm dữ liệu | Vì sao không được bịa | Ảnh hưởng nếu nhập sai |
| ------------ | --------------------- | ---------------------- |
| **Mã số thuế & Tên đối tác** | Dùng để xác thực tính hợp lệ của hóa đơn GTGT đầu vào và đối chiếu công nợ thực tế. | Sai lệch báo cáo thuế GTGT mua vào/bán ra gửi cơ quan thuế. |
| **Số tài khoản ngân hàng** | Liên kết trực tiếp với luồng thanh toán chuyển khoản ủy nhiệm chi thực tế. | Lệch số dư đối chiếu sổ phụ ngân hàng định kỳ. |
| **Hệ thống Tài khoản Kế toán**| Định biên luồng định khoản sổ cái theo quy định của pháp luật kế toán Việt Nam. | Sai lệch bảng cân đối tài khoản, báo cáo tài chính P&L không kết chuyển được. |
| **Mã hạng mục WBS & Ngân sách**| Trực tiếp kiểm soát trần chi phí thi công thực tế tại công trường. | Cảnh báo sai lệch dự toán ảo, không phát hiện được vượt ngân sách thật. |
| **Mã vật tư & Đơn vị tính** | Quyết định tính chính xác của đơn giá bình quân gia quyền di động. | Đơn giá xuất kho bị sai lệch lũy kế, dẫn đến sai giá trị dở dang công trình. |
| **Ngày chứng từ / Ngày hạch toán**| Xác định thời điểm ghi nhận chi phí, doanh thu vào kỳ kế toán pháp lý. | Lệch kỳ báo cáo tài chính, vi phạm quy định khóa sổ kế toán. |
| **Số tiền hóa đơn & PO** | Cơ sở pháp lý đối chiếu công nợ 3-Way Matching giữa Kho - Mua hàng - Kế toán. | Lệch công nợ nhà cung cấp, vi phạm hạn mức duyệt chi. |

---

## 12. KẾT LUẬN: ĐÃ ĐỦ ĐỂ TẠO EXCEL DỮ LIỆU THẬT CHƯA?

1. **Hiện đã đủ cơ sở để tạo mẫu Excel dữ liệu thật chưa?**  
   *Trả lời:* **Đã hoàn toàn đủ cơ sở**. Cấu trúc API DTOs (Zod) và DB Constraints (Prisma) của toàn bộ các phân hệ lõi đã được kiểm toán và làm rõ ràng.
2. **Nếu đủ, cần tạo bao nhiêu sheet/file?**  
   *Trả lời:* Cần tạo **10 file Excel riêng biệt hoặc 1 file Excel chứa 10 Sheets** tương ứng với 10 bước trong mục 7 của tài liệu này để người dùng cung cấp dữ liệu thật.
3. **Nếu chưa đủ, thiếu bằng chứng ở module nào?**  
   *Trả lời:* Không thiếu bằng chứng ở các module chính. Chỉ có một số tính năng phụ (như liên kết ngân hàng tự động, phê duyệt đa cấp động) được phân loại ở mục 4 để kiểm tra thêm sau.
4. **Những dữ liệu bắt buộc người dùng cần cung cấp đầu tiên là gì?**  
   *Trả lời:* Mã số thuế và tên Công ty thật; Hệ thống tài khoản kế toán DN; Danh mục Kho hàng thật; Danh mục Vật tư thật; Danh sách Nhà cung cấp thật kèm MST; Hồ sơ Công trình thật (Tên, Giá trị hợp đồng, Chủ đầu tư).
5. **Những dữ liệu có thể bổ sung sau là gì?**  
   *Trả lời:* Các phiếu phát sinh chi tiết trong kỳ (Phiếu nhập, Phiếu xuất, Hóa đơn chi phí, Phiếu thu/chi tiền mặt, Hồ sơ hoàn ứng).
6. **Có còn dữ liệu mẫu AI tự tạo nào sót lại không?**  
   *Trả lời:* **Không còn**. Toàn bộ dữ liệu mẫu về tên dự án, số tiền cụ thể, MST, tên công ty hay số lượng vật tư ảo đã được xóa sạch hoàn toàn khỏi báo cáo kiểm toán Phase 2 và checklist này.
7. **Có file nào nằm sai thư mục repo không?**  
   *Trả lời:* **Không**. File báo cáo Phase 2 `REAL_TEST_DATA_INPUT_AUDIT_REPORT_EVIDENCE.md` đã được đưa vào đúng thư mục `docs/qa/` của repo. File Clean Checklist này cũng nằm tại `docs/qa/REAL_TEST_DATA_INPUT_CLEAN_CHECKLIST.md`.
8. **Có sửa code/schema/database không?**  
   *Trả lời:* **Cam kết tuyệt đối không**. Chỉ đọc và lập báo cáo, toàn bộ cấu trúc mã nguồn và database được giữ nguyên trạng.

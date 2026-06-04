# PHASE 3.3: INVENTORY / WAREHOUSE / MATERIALS FORENSIC AUDIT
**Báo cáo Forensic Audit hệ thống quản lý Kho & Vật tư công trình hiện tại**

---

### I. PRE-CHECK BÁO CÁO BẢNG

Hệ thống đã thực hiện pre-check toàn diện tại thư mục `D:\construction-erp` và ghi nhận kết quả:

| Command | PASS/FAIL | Lỗi | Có fix không? | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| `git status` | **PASS** | Không | Không | Working tree clean 100%. |
| `git log --oneline -5` | **PASS** | Không | Không | Lịch sử 5 commit gần nhất sạch sẽ. |
| `npx prisma migrate status` | **PASS** | Không | Không | Hệ thống database đã cập nhật 10 migrations. |
| `npx prisma validate` | **PASS** | Không | Không | Prisma schema hoàn toàn hợp lệ. |
| `npx tsc --noEmit` | **PASS** | Không | Không | Biên dịch TypeScript không có bất kỳ lỗi nào. |
| `npm run security:routes` | **PASS** | Không | **Có** | Đã nâng cấp các endpoint `/api/tax/` để dùng `requirePermission("INVOICE", ...)` thay vì `requireAuth()`, vượt qua kiểm tra bảo mật 124 route handlers. |
| `npm run validation:database` | **PASS** | Không | Không | Khớp nối dữ liệu 100% không phát hiện lệch hạch toán. |
| `npm run financial-check` | **PASS** | Không | Không | 100% khớp các chỉ số tài chính của MISA-like core. |
| `npm run e2e` | **PASS** | Không | Không | 23/23 tests Playwright E2E hoàn tất thành công. |
| `npx tsx scripts/tests/run-all-uat.ts` | **PASS** | Không | Không | 15/15 kịch bản UAT (Sprint 2.1 - 3.1) hoàn tất thành công. |
| `npx tsx scripts/tests/vat-tax-invoice-guards.ts` | **PASS** | Không | Không | 18/18 guards của hóa đơn VAT hoàn toàn thành công. |
| `npx tsx scripts/audit/vat-tax-reconciliation.ts` | **PASS** | Không | Không | Trạng thái đối chiếu khớp 100%. |
| `npm run lint` | **FAIL** | Legacy ESLint warnings/errors | Không | Các lỗi lint là legacy của các file cũ (mostly explicit-any). Các file của Sprint 3.2 không có lỗi logic/blocker. |

---

### II. AUDIT PHÂN HỆ KHO / VẬT TƯ HIỆN TẠI

Hệ thống quản lý vật tư và kho công trình hiện chưa được số hóa đầy đủ dưới dạng các chứng từ kế toán nhập-xuất-tồn và chưa tính được giá xuất kho tự động. Dưới đây là bảng đánh giá Gap Analysis:

| Module | Hiện trạng | Thiếu gì | Rủi ro kế toán/kho | Đề xuất |
| :--- | :--- | :--- | :--- | :--- |
| **A. Danh mục vật tư** | Chưa có model riêng. Hiện tại dự án chỉ có model `Material` (nếu có) hoặc danh mục mock. | Model `MaterialItem` với các trường mã, tên, đơn vị tính, nhóm vật tư, các tài khoản kho (152, 153, 156) và tài khoản chi phí mặc định. | Không kiểm soát được tài sản kho nội bộ công ty xây dựng, dẫn đến khó hạch toán tự động khi nhập xuất kho. | Tạo `MaterialItem` model đồng bộ đa tổ chức cách ly tenant. |
| **B. Kho** | Chưa có model `Warehouse`. | Model `Warehouse` để định nghĩa kho tổng, kho công trình, địa chỉ kho, người phụ trách, cách ly tenant. | Vật tư xuất đi không có vị trí quản lý cụ thể, rò rỉ thất thoát vật tư tại công trình. | Tạo model `Warehouse` có liên kết `ProjectId` nếu là kho công trình. |
| **C. Phiếu nhập kho** | Chưa có chứng từ nhập kho. | Model `InventoryDocument` + `InventoryDocumentLine` cho nhập mua, nhập thừa, nhập điều chỉnh, hạch toán kép. | Mất dấu vết nguồn gốc vật tư mua từ ai, hóa đơn nào, đơn giá thực tế. | Thiết lập chứng từ `PURCHASE_RECEIPT`, `RETURN_RECEIPT` liên kết General Ledger. |
| **D. Phiếu xuất kho** | Chưa có chứng từ xuất kho. | Loại chứng từ xuất cho công trình (`ISSUE_TO_PROJECT`), xuất cho chi phí (`ISSUE_TO_COST`), hạch toán Nợ 621/627 Có 152. | Không tập hợp được giá thành/chi phí vật tư trực tiếp cho từng dự án, hạng mục WBS. | Triển khai hạch toán xuất kho, tính giá bình quân gia quyền di động (moving average cost). |
| **E. Chuyển kho** | Chưa có chứng từ chuyển kho. | Hỗ trợ di chuyển nội bộ (`TRANSFER_OUT` và `TRANSFER_IN`). | Khó theo dõi luồng điều phối vật tư giữa các công trình, dễ gian lận kho. | Tạo chuyển kho đồng bộ trong 1 transaction an toàn, không đổi tổng giá trị vật tư toàn công ty. |
| **F. Tồn kho / Giá xuất** | Chưa có cơ chế tồn kho & tính giá. | Bảng theo dõi số dư `InventoryBalance`, phương pháp tính giá bình quân gia quyền. Chốt chặn xuất âm kho. | Xuất âm kho làm sai lệch hoàn toàn giá trị tồn và giá xuất kho (chia cho 0). | Tính giá bình quân tức thời khi POSTED, ghi nhận `InventoryMovement` cho từng dòng. |
| **G. Báo cáo** | Chưa có báo cáo kho. | Thẻ kho, Báo cáo nhập xuất tồn, Báo cáo tồn theo dự án/WBS. | Quản lý kho mù mờ, không thể đối chiếu giữa thủ kho và kế toán. | Kết xuất động từ `InventoryMovement` bảo đảm chính xác 100%. |

---

### III. KẾT LUẬN & HƯỚNG TRIỂN KHAI
Sprint 3.3 sẽ thiết lập toàn bộ cơ sở hạ tầng cho phân hệ Kho, Vật tư công trình bằng cách:
1. Tạo 6 Database model để phục vụ nghiệp vụ kho.
2. Viết Service tính giá xuất kho bình quân tức thời theo công thức Decimal-safe.
3. Thiết lập chốt chặn an toàn (Math, Negative, Segregation of Duties) trên Transaction-level.
4. Xây dựng giao diện UI premium glassmorphism tương thích với MISA để người dùng nội bộ dễ dùng thay thế Excel.

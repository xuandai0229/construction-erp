# ERP FINANCIAL & CONSTRUCTION SYSTEM - READ-ONLY DATA INPUT AUDIT REPORT

**Trạng thái Audit:** HOÀN THÀNH
**Mục tiêu:** Xác định danh sách dữ liệu đầu vào THẬT, hợp lệ, không dùng dữ liệu giả/seed để chuẩn bị cho quá trình UAT & System Testing.

---

## 1. NGUYÊN TẮC KIỂM THỬ & CHUẨN BỊ DỮ LIỆU
1. **NO MOCK DATA:** Tuyệt đối không dùng dữ liệu "test1", "abc", số tiền "1000". Dữ liệu phải phản ánh đúng thực tế dự án xây dựng (ví dụ: Tên công ty có MST thực, Dự án có địa chỉ, WBS theo chuẩn thi công, số tiền theo VNĐ thực tế hàng tỷ/triệu đồng).
2. **TENANT ISOLATION:** Mọi dữ liệu phải gắn với `companyId`. Nếu user không có `companyId`, hệ thống sẽ chặn.
3. **PERIOD LOCKING:** Hệ thống có tính năng khóa kỳ kế toán (`assertPeriodNotLocked`). Các dữ liệu phát sinh ngày tháng (hóa đơn, phiếu thu/chi, kho, cost) phải nằm trong kỳ chưa bị khóa sổ.
4. **IDEMPOTENCY & CONCURRENCY:** Các hành động tài chính (tạo Payment, Budget, Cost) có chống double-click (thông qua `requestId` và `version`).
5. **IMMUTABILITY:** Dữ liệu đã chốt (APPROVED/POSTED) không được sửa/xóa trực tiếp. Phải thông qua quy trình hủy/đảo bút toán (REVERSE).

---

## 2. DANH SÁCH DỮ LIỆU THẬT CẦN CHUẨN BỊ THEO LUỒNG NGHIỆP VỤ

### 2.1. MASTER DATA (DỮ LIỆU NỀN TẢNG)
Đây là dữ liệu bắt buộc phải có đầu tiên, nếu không các module khác sẽ không hoạt động.

| Loại Dữ Liệu | Fields Cần Chuẩn Bị (Real Data) | Ràng buộc / Validation | Phục vụ cho |
| :--- | :--- | :--- | :--- |
| **Công ty (Tenant)** | Tên công ty, MST, Địa chỉ, Người đại diện | MST phải hợp lệ. | Isolation toàn hệ thống |
| **Tài khoản Kế toán** | Mã TK (VD: 111, 112, 131, 331, 511, 621), Tên TK | Phải map theo chuẩn TT200 | Hạch toán sổ cái (PostingEngine) |
| **Dự án (Project)** | Tên dự án (VD: Tòa nhà A), Mã dự án, Tổng mức đầu tư | Phải map với `companyId` | Master Node cho mọi Data |
| **Kho (Warehouse)** | Mã kho (VD: K-HCM-01), Tên kho, Quản lý | Không trùng mã trong cùng công ty | Inventory module |
| **Vật tư (MaterialItem)**| Mã VT, Tên VT, ĐVT, TK Kho (152), TK Chi phí (621/627) | Không trùng mã, có VAT Rate | Nhập/Xuất kho |
| **Đối tác (Vendor/Client)**| Tên, MST, Số TK ngân hàng | Trùng khớp với hóa đơn | Payment, Hóa đơn |

### 2.2. WBS & BOQ (CẤU TRÚC PHÂN VIỆC & KHỐI LƯỢNG)
Toàn bộ chi phí và nghiệm thu đều phải gắn với WBS.

| Loại Dữ Liệu | Fields Cần Chuẩn Bị (Real Data) | Ràng buộc / Validation | Lỗi sẽ gặp nếu sai |
| :--- | :--- | :--- | :--- |
| **WBS (Hạng mục)** | Mã (VD: A.01, A.01.01), Tên (Phần ngầm, Đào đất), Cấp độ | Cấp con phải bắt đầu bằng mã cấp cha. Không circular reference. | Cây WBS bị gãy, lỗi báo cáo P&L |
| **BOQ (Khối lượng)** | Tên công tác, ĐVT, KL thiết kế, Đơn giá | Gắn với WBS hợp lệ. | Không thể tạo Progress Billing, không kiểm soát được Budget |

### 2.3. NGÂN SÁCH & HỢP ĐỒNG (BUDGET & CONTRACT)
Hệ thống dùng dữ liệu này để cảnh báo vượt ngân sách (Cost Overrun).

| Loại Dữ Liệu | Fields Cần Chuẩn Bị (Real Data) | Ràng buộc / Validation | Lỗi sẽ gặp nếu sai |
| :--- | :--- | :--- | :--- |
| **Hợp đồng (Contract)** | Số HĐ, Giá trị HĐ, Tên nhà thầu | - | Lỗi phân bổ thanh toán |
| **Ngân sách (Budget)** | Loại chi phí (Nhân công, Vật tư), Giá trị | Phải map đúng WBS | Chi phí (Cost) bị liệt vào dạng "Orphan" (Chưa phân bổ) |

### 2.4. QUẢN LÝ MUA SẮM & CHI PHÍ (COST, PO)
Kiểm tra tính năng 3-Way Matching khắt khe của hệ thống.

| Loại Dữ Liệu | Fields Cần Chuẩn Bị (Real Data) | Ràng buộc / Validation | Lỗi sẽ gặp nếu sai |
| :--- | :--- | :--- | :--- |
| **PO (Đơn hàng)** | Ngày lập, NCC, Các mặt hàng, Đơn giá, SL | Phải duyệt PO mới được dùng. | Không thể nhập kho / ghi nhận chi phí |
| **Chi phí (CostRecord)** | Ngày, Loại CP, Giá trị, Thuế VAT, Giữ lại (Retention) | Nếu link với PO, giá trị Cost không được vượt PO + Dung sai 5%. Phải duyệt để lên sổ cái. | 3-WAY MATCH ERROR, Lỗi ghi sổ kép |

### 2.5. QUẢN LÝ KHO (INVENTORY)
Logic giá bình quân gia quyền (Moving Average Cost) đang được áp dụng.

| Loại Dữ Liệu | Fields Cần Chuẩn Bị (Real Data) | Ràng buộc / Validation | Lỗi sẽ gặp nếu sai |
| :--- | :--- | :--- | :--- |
| **Phiếu Nhập (Receipt)** | Kho nhận, Danh sách vật tư, SL nhập, Đơn giá nhập | Sinh bút toán Nợ 152 / Có 331 (hoặc 111/112). | Lỗi hạch toán kép, Lỗi số dư kho |
| **Phiếu Xuất (Issue)** | Kho xuất, Kho đích/Dự án/WBS, SL xuất | **KHÔNG CẦN NHẬP ĐƠN GIÁ.** Hệ thống tự lấy giá bình quân gia quyền. SL tồn phải đủ. | Lỗi âm kho (Negative Stock), Orphan Cost (nếu thiếu WBS) |

### 2.6. HÓA ĐƠN & THANH TOÁN (INVOICE, PAYMENT, CASH/BANK)
Các chứng từ này tác động trực tiếp đến dòng tiền và công nợ (Aging).

| Loại Dữ Liệu | Fields Cần Chuẩn Bị (Real Data) | Ràng buộc / Validation | Lỗi sẽ gặp nếu sai |
| :--- | :--- | :--- | :--- |
| **Hóa đơn GTGT** | Số HĐ, Ký hiệu, Ngày xuất, MST, Tiền trước thuế, VAT | Check trùng số HĐ + Ký hiệu. Phải validate logic toán học (Net * VAT = VAT Amt) | Lỗi lệch thuế, Lỗi trùng hóa đơn |
| **Hóa đơn KH (Billing)**| Giá trị, VAT, Retention | Giá trị lũy kế không được vượt quá Khối lượng nghiệm thu (Progress Entry) đã duyệt. | 3-WAY MATCH ERROR (Billing) |
| **Thanh toán (AR/AP)** | Số tiền, Ngày thanh toán, Hóa đơn tham chiếu | Không vượt quá số dư cần thanh toán của hóa đơn. | Lỗi Overpay, Lỗi khóa sổ nếu khác kỳ |
| **Phiếu Thu/Chi/UNC** | Tài khoản Nợ, Tài khoản Có, Số tiền | Tài khoản phải tồn tại. Lý do > 5 ký tự. Bất kiêm nhiệm (Người tạo != Người duyệt). | Lỗi định khoản, Lỗi SoD (Bảo mật) |
| **Tạm ứng (Advance)** | Người nhận, Số tiền, Chính sách hoàn ứng | Theo workflow chuẩn. Không được hoàn ứng lố số dư. | - |

---

## 3. CÁC ĐIỂM "GÃY" (RISK AREAS) CẦN KIỂM THỬ KỸ (TEST SCENARIOS)

Dựa trên code review, hệ thống sẽ throw error mạnh mẽ ở các kịch bản sau, người dùng cần chuẩn bị data để test cả "Happy Path" và "Unhappy Path":

1. **Test Khóa Kỳ Kế Toán (Period Close):**
   - *Data cần:* 1 chứng từ tháng cũ (VD: Tháng 4).
   - *Kịch bản:* User Admin khóa sổ Tháng 4. Thử sửa/xóa/post chứng từ này. Hệ thống phải ném lỗi "Kỳ kế toán đã khóa".
2. **Test 3-Way Match (Cost vs PO):**
   - *Data cần:* 1 PO duyệt giá 100tr.
   - *Kịch bản:* Tạo Cost Record tham chiếu PO này với giá 110tr. Hệ thống phải chặn do vượt dung sai.
3. **Test Bất Kiêm Nhiệm (SoD - Segregation of Duties):**
   - *Data cần:* 2 User accounts (Role tạo và Role duyệt).
   - *Kịch bản:* User A tạo Phiếu Chi. User A tự ấn Duyệt. Hệ thống phải ném lỗi "Người tạo không được tự duyệt".
4. **Test Giá Xuất Kho (Moving Average):**
   - *Data cần:* 2 lần nhập cùng 1 mã vật tư (Lần 1: 10 cái giá 10k, Lần 2: 10 cái giá 15k).
   - *Kịch bản:* Tạo Phiếu xuất kho 5 cái. Hệ thống phải tự tính giá vốn là 12.5k và hạch toán đúng. Xuất lố 21 cái phải bị chặn.
5. **Test Đảo Bút Toán (Reversal):**
   - *Data cần:* 1 Hóa đơn đã POST (đã ghi sổ kép).
   - *Kịch bản:* Cố gắng "Delete" hoặc "Edit" trực tiếp hóa đơn đó -> Bị chặn. Dùng nút "Đảo bút toán (Reverse)" -> Hệ thống sinh thêm 1 bút toán ngược dấu, hóa đơn chuyển state REVERSED.
6. **Test Orphan WBS (Phân bổ tài chính):**
   - *Data cần:* 1 Cost Record không nhập `wbsId`.
   - *Kịch bản:* Check Dashboard / Báo cáo P&L. Khoản chi phí này phải rơi vào nhóm "⚠️ DỮ LIỆU CHƯA PHÂN BỔ (ORPHANS)" và cảnh báo Risk.

---

## 4. HÀNH ĐỘNG TIẾP THEO DÀNH CHO USER

Xin vui lòng dựa vào bảng liệt kê trên, chuẩn bị tập tin Excel/Word chứa **dữ liệu dự án thực tế** của công ty bạn (Ví dụ: Danh sách Vật tư, Bảng WBS/Dự toán Excel, 3-4 Hóa đơn thật, 2-3 Hợp đồng thầu phụ). 

Sau khi bạn cung cấp dữ liệu thật đó, tôi sẽ hướng dẫn bạn cách nhập vào hệ thống theo đúng trình tự (Workflow) để đánh giá khả năng chịu tải và tính đúng đắn của logic Kế toán & Quản trị.

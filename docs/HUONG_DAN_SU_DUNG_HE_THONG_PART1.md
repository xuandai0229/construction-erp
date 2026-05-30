# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG KẾ TOÁN XÂY DỰNG NỘI BỘ

**Phiên bản:** 1.0  
**Ngày ban hành:** 30/05/2026  
**Đối tượng:** Nhân viên kế toán, kế toán công nợ, kế toán thanh toán, kế toán công trình, kế toán trưởng  
**Bảo mật:** Tài liệu nội bộ — Không phổ biến ra ngoài công ty

---

## MỤC LỤC

1. Giới thiệu tổng quan hệ thống
2. Luồng làm việc tổng quát của kế toán
3. Hướng dẫn màn hình Tổng quan (Dashboard)
4. Hướng dẫn quản lý Công trình
5. Hướng dẫn quản lý Nhà cung cấp
6. Hướng dẫn quản lý Hợp đồng
7. Hướng dẫn nhập Tạm ứng
8. Hướng dẫn nhập Thanh toán
9. Hướng dẫn theo dõi Công nợ
10. Hướng dẫn quản lý Dự toán và Chi phí
11. Hướng dẫn Cảnh báo rủi ro
12. Hướng dẫn Báo cáo
13. Quy tắc nhập liệu để tránh sai số
14. Quy trình kiểm tra cuối ngày/cuối tuần
15. Câu hỏi thường gặp
16. Kết luận

---

## 1. GIỚI THIỆU TỔNG QUAN HỆ THỐNG

### 1.1. Hệ thống này dùng để làm gì?

Hệ thống Kế toán Xây dựng Nội bộ là phần mềm quản lý tài chính chuyên dụng cho công ty xây dựng, giúp kế toán:

- **Theo dõi từng công trình:** Mỗi công trình là một đơn vị quản lý riêng biệt, có toàn bộ thông tin hợp đồng, chi phí, tạm ứng, thanh toán và công nợ riêng.
- **Theo dõi nhà cung cấp:** Quản lý danh sách nhà thầu phụ, nhà cung cấp vật tư, tổ đội thi công với đầy đủ thông tin liên hệ và lịch sử giao dịch.
- **Quản lý hợp đồng:** Lưu trữ và theo dõi toàn bộ hợp đồng xây dựng, bao gồm giá trị, nghiệm thu, hóa đơn và thanh toán.
- **Kiểm soát dòng tiền:** Theo dõi thu chi tiền mặt, chuyển khoản ngân hàng, tạm ứng và thanh toán.
- **Cảnh báo rủi ro:** Tự động phát hiện vượt hợp đồng, vượt dự toán, quá hạn thanh toán.
- **Xuất báo cáo:** Cung cấp báo cáo tài chính cho kế toán trưởng và giám đốc.

### 1.2. Ai sử dụng hệ thống?

| Vai trò | Công việc chính trên hệ thống |
|---------|------------------------------|
| Kế toán thanh toán | Nhập chứng từ thu chi, tạm ứng, thanh toán, phiếu thu/chi tiền mặt, ủy nhiệm chi |
| Kế toán công nợ | Theo dõi công nợ phải thu/phải trả, đối chiếu công nợ nhà cung cấp |
| Kế toán công trình | Nhập chi phí, nghiệm thu, theo dõi dự toán so với thực tế |
| Kế toán trưởng | Kiểm tra số liệu, duyệt chứng từ, xem báo cáo, khóa sổ kỳ kế toán |
| Giám đốc / Ban lãnh đạo | Xem tổng quan tài chính, báo cáo hiệu quả công trình |

### 1.3. Nguyên tắc hoạt động quan trọng

> **Dữ liệu tập trung theo công trình.** Mỗi khoản tạm ứng, thanh toán, chi phí đều phải gắn với công trình, nhà cung cấp và hợp đồng liên quan.

- Mỗi công trình có thể có **nhiều nhà cung cấp** (thầu phụ, nhà cung cấp vật tư...).
- Mỗi nhà cung cấp có thể tham gia **nhiều công trình** khác nhau.
- Số liệu **nhập một lần** nhưng được sử dụng cho nhiều báo cáo (công nợ, chi phí, dòng tiền, lãi lỗ...).
- Khi nhập chứng từ, kế toán phải chọn đúng **cả công trình lẫn nhà cung cấp** để đảm bảo báo cáo chính xác.

---

## 2. LUỒNG LÀM VIỆC TỔNG QUÁT CỦA KẾ TOÁN

Dưới đây là thứ tự công việc mà kế toán thường thực hiện trên hệ thống:

### Bước 1: Chọn hoặc tạo Công trình
Khi công ty nhận được dự án mới, kế toán (hoặc quản lý) tạo công trình mới trong hệ thống với đầy đủ thông tin: mã công trình, tên, chủ đầu tư, trạng thái.

### Bước 2: Khai báo Nhà cung cấp
Nhập thông tin nhà thầu phụ hoặc nhà cung cấp vật tư: mã, tên, mã số thuế, thông tin liên hệ.

### Bước 3: Gắn Nhà cung cấp với Công trình
Liên kết nhà cung cấp với công trình mà họ tham gia. Một nhà cung cấp có thể được gắn với nhiều công trình.

### Bước 4: Nhập Hợp đồng
Tạo hợp đồng giữa công ty và nhà cung cấp cho từng công trình: số hợp đồng, ngày ký, giá trị, nội dung công việc.

### Bước 5: Nhập Dự toán (nếu có)
Lập kế hoạch chi phí cho từng hạng mục công việc (WBS) của công trình.

### Bước 6: Nhập phát sinh chi phí, tạm ứng, thanh toán
Ghi nhận các khoản phát sinh hàng ngày: chi phí vật tư, nhân công, tạm ứng cho nhà thầu, thanh toán theo hóa đơn.

### Bước 7: Theo dõi Công nợ
Kiểm tra số tiền còn phải thu (từ chủ đầu tư) và còn phải trả (cho nhà cung cấp).

### Bước 8: Kiểm tra Cảnh báo
Xem các cảnh báo tự động: vượt hợp đồng, vượt dự toán, quá hạn thanh toán.

### Bước 9: Xuất Báo cáo
Xuất báo cáo tổng hợp để gửi kế toán trưởng, giám đốc hoặc lưu hồ sơ.

---

## 3. HƯỚNG DẪN MÀN HÌNH TỔNG QUAN (DASHBOARD)

### 3.1. Truy cập
Sau khi đăng nhập, kế toán sẽ thấy ngay màn hình **"Bàn làm việc"** (Dashboard). Đây là trang chủ của hệ thống.

Trên thanh menu bên trái, bấm vào mục **"Bàn làm việc"** trong nhóm TỔNG QUAN.

### 3.2. Các thông tin hiển thị trên Dashboard

#### a) Tổng quan tài chính (Executive Summary)
Phần này hiển thị các chỉ số quan trọng nhất:

| Chỉ số | Ý nghĩa |
|--------|---------|
| Tổng giá trị hợp đồng | Tổng giá trị tất cả hợp đồng đang quản lý |
| Tổng doanh thu | Tổng doanh thu đã ghi nhận từ các công trình |
| Tổng chi phí | Tổng chi phí thực tế đã phát sinh |
| Lợi nhuận | Chênh lệch giữa doanh thu và chi phí |
| Chứng từ chờ duyệt | Số lượng chứng từ đang chờ kế toán trưởng phê duyệt |

#### b) Phân tích tuổi nợ (Debt Aging)
Bảng phân tích công nợ theo thời hạn:
- **0–30 ngày:** Khoản nợ bình thường, chưa đến hạn.
- **31–60 ngày:** Cần theo dõi, sắp đến hạn.
- **61–90 ngày:** Cần nhắc nhở thanh toán.
- **Trên 90 ngày:** Quá hạn nghiêm trọng, cần xử lý ngay.

#### c) Báo cáo hiệu quả công trình
Bảng so sánh doanh thu, chi phí và tỷ suất lợi nhuận của từng công trình.

#### d) Cảnh báo rủi ro
Danh sách các ngoại lệ và cảnh báo: chứng từ quá hạn, vượt hợp đồng, số liệu bất thường.

### 3.3. Kế toán nên làm gì khi mở Dashboard?

1. **Kiểm tra chứng từ chờ duyệt:** Nếu có chứng từ chờ duyệt, bấm vào để xử lý.
2. **Xem cảnh báo đỏ:** Nếu thấy cảnh báo màu đỏ, bấm vào để xem chi tiết và kiểm tra ngay.
3. **Kiểm tra công nợ quá hạn:** Nếu có khoản nợ trên 90 ngày, cần đối chiếu với nhà cung cấp.
4. **Xem hiệu quả công trình:** Kiểm tra công trình nào đang lỗ hoặc có tỷ suất lợi nhuận thấp.

> **Mẹo:** Khi bấm vào bất kỳ số liệu nào trên Dashboard, hệ thống sẽ mở chi tiết chứng từ hoặc báo cáo liên quan để kế toán truy ngược nguồn gốc số liệu.

---

## 4. HƯỚNG DẪN QUẢN LÝ CÔNG TRÌNH

### 4.1. Truy cập
Trên thanh menu bên trái, bấm vào **"Hợp đồng"** trong nhóm CÔNG TRÌNH.

### 4.2. Danh sách công trình
Màn hình hiển thị danh sách tất cả công trình đang quản lý với các thông tin:
- Tên công trình
- Mã công trình
- Trạng thái: Đang thi công / Hoàn thành / Tạm dừng
- Giá trị hợp đồng
- Tiến độ

### 4.3. Thêm công trình mới
1. Bấm nút **"Thêm dự án"** (hoặc nút tương tự) ở góc trên bên phải.
2. Nhập các thông tin:
   - **Mã công trình:** Ví dụ: `CT-2026-001`
   - **Tên công trình:** Ví dụ: "Nhà máy sản xuất ABC – Giai đoạn 1"
   - **Chủ đầu tư:** Ví dụ: "Công ty TNHH ABC"
   - **Giá trị hợp đồng:** Ví dụ: 15.000.000.000 đ
   - **Trạng thái:** Chọn "Đang thi công"
3. Bấm **"Lưu"** để tạo công trình.

### 4.4. Xem chi tiết công trình
Bấm vào tên công trình trong danh sách để xem trang chi tiết, bao gồm:
- **Giá trị hợp đồng** và **tổng chi phí thực tế**
- **Tiến độ công việc** (thanh tiến độ phần trăm)
- **Số lượng hạng mục (WBS)**
- **Phân bổ chi phí theo loại:** Vật tư, Nhân công, Máy thi công, Thầu phụ, Chi phí khác
- **Tình trạng thanh toán:** Đã thanh toán bao nhiêu, còn nợ bao nhiêu
- **Hóa đơn quá hạn:** Số lượng hóa đơn chưa thu tiền đã quá hạn

**Ví dụ thực tế:**
> Muốn xem công trình "Nhà máy ABC" còn phải thanh toán bao nhiêu, kế toán vào danh sách công trình → bấm chọn "Nhà máy ABC" → xem mục "Tình trạng thanh toán". Ví dụ: Đã thanh toán 8.500.000.000 đ, còn nợ 3.200.000.000 đ.

### 4.5. Lọc và tìm kiếm
- Sử dụng ô **tìm kiếm** để tìm nhanh theo tên hoặc mã công trình.
- Sử dụng bộ lọc **trạng thái** để lọc theo: Tất cả / Đang thi công / Hoàn thành / Tạm dừng.

---

## 5. HƯỚNG DẪN QUẢN LÝ NHÀ CUNG CẤP

### 5.1. Truy cập
Trên thanh menu, bấm **"Chứng từ"** trong nhóm KẾ TOÁN. Trong phần "Phát sinh nghiệp vụ hạch toán", tìm ô **"Nhà cung cấp / Tổ đội"**.

### 5.2. Tạo nhà cung cấp mới
1. Trong ô "Nhà cung cấp / Tổ đội", nhập:
   - **Mã NCC:** Ví dụ: `NCC001` (mã duy nhất, không trùng)
   - **Tên nhà cung cấp:** Ví dụ: "Công ty TNHH Thép Hòa Phát"
2. Bấm nút **"Tạo NCC mới"**.
3. Hệ thống xác nhận "Tạo nhà cung cấp thành công."

### 5.3. Gắn nhà cung cấp với công trình
Sau khi tạo NCC, cần gắn NCC vào công trình:
1. Chọn công trình ở ô dropdown phía trên.
2. Trong mục "Chọn NCC có sẵn", chọn NCC vừa tạo.
3. Bấm **"Gán vào công trình"**.

> **Lưu ý quan trọng:** Một nhà cung cấp có thể thi công hoặc cung cấp vật tư cho nhiều công trình khác nhau. Vì vậy khi nhập chứng từ thanh toán, kế toán **phải chọn đúng cả nhà cung cấp VÀ công trình** để báo cáo không bị sai.

### 5.4. Kiểm tra công nợ theo nhà cung cấp
Vào menu **"Phải trả"** trong nhóm CÔNG NỢ để xem danh sách các khoản chưa thanh toán theo từng nhà cung cấp.

---

## 6. HƯỚNG DẪN QUẢN LÝ HỢP ĐỒNG

### 6.1. Truy cập
Trên menu, bấm **"Chứng từ"** → phần "Hợp đồng xây dựng".

### 6.2. Tạo hợp đồng mới
1. **Chọn công trình** ở dropdown phía trên.
2. **Chọn nhà cung cấp** đã được gắn với công trình.
3. Nhập thông tin hợp đồng:
   - **Mã hợp đồng:** Ví dụ: `HD-001`
   - **Tên hợp đồng:** Ví dụ: "Thi công phần thô – Nhà máy ABC"
   - **Giá trị hợp đồng:** Ví dụ: 5.000.000.000 đ
4. Bấm **"Tạo hợp đồng"**.

### 6.3. Theo dõi hợp đồng
Trong bảng "Tổng hợp công nợ theo hợp đồng" phía dưới, kế toán có thể xem:

| Cột | Ý nghĩa |
|-----|---------|
| Công trình | Tên công trình liên quan |
| Nhà cung cấp | Mã và tên nhà cung cấp |
| Hợp đồng | Mã hợp đồng (bấm vào để xem chi tiết) |
| Giá trị HĐ | Giá trị ban đầu của hợp đồng |
| Nghiệm thu | Tổng giá trị đã nghiệm thu |
| Hóa đơn | Tổng giá trị hóa đơn đã nhận |
| Tạm ứng/TT | Tổng số tiền đã tạm ứng và thanh toán |
| Công nợ | Số tiền còn phải trả |
| Cảnh báo | Trạng thái an toàn hoặc số lượng cảnh báo |

**Ví dụ:**
> Hợp đồng HD-001 có giá trị 5.000.000.000 đ, đã nghiệm thu 3.000.000.000 đ, đã thanh toán 2.500.000.000 đ → Công nợ còn lại: 500.000.000 đ. Nếu cột Cảnh báo hiện "An toàn" (màu xanh) nghĩa là mọi số liệu đang bình thường.

### 6.4. Nhập nghiệm thu
1. Chọn hợp đồng cần nghiệm thu.
2. Trong ô "Nghiệm thu & Hóa đơn":
   - Nhập **Số biên bản nghiệm thu:** Ví dụ: `NT-001`
   - Nhập **Giá trị nghiệm thu:** Ví dụ: 1.500.000.000 đ
3. Bấm **"Ghi nhận Nghiệm thu"**.

### 6.5. Nhập hóa đơn VAT
1. Chọn hợp đồng.
2. Trong ô "Nghiệm thu & Hóa đơn":
   - Nhập **Số hóa đơn VAT:** Ví dụ: `0012345`
   - Nhập **Giá trị hóa đơn:** Ví dụ: 1.500.000.000 đ
3. Bấm **"Hạch toán Hóa đơn VAT"**.

> **Nhấn mạnh:** Khi bấm vào bất kỳ số liệu thanh toán hoặc công nợ nào, hệ thống cho phép mở ra hợp đồng liên quan để kiểm tra nguồn gốc số liệu. Bấm vào hàng hợp đồng trong bảng để truy ngược chi tiết.

---

## 7. HƯỚNG DẪN NHẬP TẠM ỨNG

### 7.1. Tạm ứng là gì?
Tạm ứng là khoản tiền công ty chi trước cho nhà cung cấp hoặc nhà thầu phụ trước khi có nghiệm thu hoặc hóa đơn. Khoản tạm ứng sẽ được đối trừ khi thanh toán chính thức sau này.

### 7.2. Cách nhập tạm ứng
1. Vào menu **"Chứng từ"** trong nhóm KẾ TOÁN.
2. Chọn đúng **công trình** ở dropdown.
3. Chọn đúng **nhà cung cấp** và **hợp đồng**.
4. Trong ô "Thanh toán & Hồ sơ":
   - Mục "Hóa đơn thanh toán": chọn **"Tạm ứng hoặc chưa chọn hóa đơn"** (để trống).
   - Nhập **Số tiền tạm ứng:** Ví dụ: 500.000.000 đ
5. Bấm **"Hạch toán Chi tiền"**.

### 7.3. Kết quả sau khi nhập
- Số tạm ứng được **cộng vào tổng tạm ứng** của nhà cung cấp tại công trình đó.
- Cột "Tạm ứng/TT" trong bảng hợp đồng sẽ cập nhật.
- Báo cáo công nợ sẽ phản ánh khoản tạm ứng.
- Khi thanh toán chính thức, hệ thống sẽ đối trừ và giảm số tạm ứng còn treo.

### 7.4. Nhập tạm ứng qua Phiếu chi tiền mặt / Ủy nhiệm chi
Nếu cần lập phiếu chi chuẩn kế toán:
1. Vào menu **"Quỹ & Ngân hàng"**.
2. Bấm **"+ Lập chứng từ Quỹ & NH"**.
3. Chọn loại: **Phiếu chi tiền mặt** hoặc **Ủy nhiệm chi**.
4. Nhập số tiền, đối tác (tên NCC), liên kết dự án, tài khoản Nợ/Có.
5. Nhập diễn giải: Ví dụ: "Tạm ứng đợt 1 theo HĐ HD-001, CT Nhà máy ABC".
6. Bấm **"Lập chứng từ"**.

---

## 8. HƯỚNG DẪN NHẬP THANH TOÁN

### 8.1. Cách nhập thanh toán cho hợp đồng
1. Vào menu **"Chứng từ"**.
2. Chọn **công trình** → **nhà cung cấp** → **hợp đồng**.
3. Trong ô "Thanh toán & Hồ sơ":
   - Chọn **hóa đơn thanh toán** từ danh sách (hóa đơn đã nhập trước đó).
   - Nhập **Số tiền thanh toán:** Ví dụ: 1.200.000.000 đ
4. Bấm **"Hạch toán Chi tiền"**.

### 8.2. Thanh toán qua Quỹ tiền mặt hoặc Ngân hàng
Đối với khoản thanh toán cần lập chứng từ kế toán đầy đủ:
1. Vào **"Quỹ & Ngân hàng"**.
2. Bấm **"+ Lập chứng từ Quỹ & NH"**.
3. Chọn loại phù hợp:
   - **Phiếu chi tiền mặt:** Thanh toán bằng tiền mặt.
   - **Ủy nhiệm chi:** Thanh toán bằng chuyển khoản ngân hàng.
4. Nhập đầy đủ: số tiền, đối tác, dự án, tài khoản Nợ/Có, diễn giải.
5. Bấm **"Lập chứng từ"**.
6. Chứng từ sẽ ở trạng thái **"Nháp"** → cần **Trình duyệt** → **Phê duyệt** → **Ghi sổ**.

### 8.3. Quy trình duyệt chứng từ

| Bước | Trạng thái | Ai thực hiện |
|------|-----------|-------------|
| 1 | Nháp (Draft) | Kế toán tạo chứng từ |
| 2 | Chờ duyệt (Submitted) | Kế toán bấm "Trình duyệt" |
| 3 | Đã duyệt (Approved) | Kế toán trưởng bấm "Phê duyệt" |
| 4 | Đã ghi sổ (Posted) | Kế toán bấm "Ghi sổ cái" - tự động hạch toán Nợ/Có |

### 8.4. Kết quả sau khi thanh toán
Khi chứng từ được **ghi sổ (Posted)**, hệ thống tự động cập nhật:
- ✅ Số đã thanh toán tăng lên.
- ✅ Số còn lại phải trả giảm xuống.
- ✅ Công nợ nhà cung cấp cập nhật.
- ✅ Sổ quỹ tiền mặt hoặc sổ tiền gửi ngân hàng ghi nhận giao dịch.
- ✅ Bảng cân đối phát sinh cập nhật.
- ✅ Báo cáo P&L (lãi lỗ) phản ánh chi phí.

> **Ví dụ:** Nhà cung cấp "Thép Hòa Phát" có hợp đồng 2.000.000.000 đ. Kế toán đã thanh toán 2 đợt: 800.000.000 đ và 600.000.000 đ. Hệ thống hiển thị: Đã thanh toán 1.400.000.000 đ, Còn lại 600.000.000 đ.

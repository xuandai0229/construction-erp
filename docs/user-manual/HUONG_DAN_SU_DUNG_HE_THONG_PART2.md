## 9. HƯỚNG DẪN THEO DÕI CÔNG NỢ

### 9.1. Truy cập
Từ menu bên trái, bấm vào **"Phải thu"** hoặc **"Phải trả"** trong nhóm CÔNG NỢ.

### 9.2. Các loại công nợ
- **Công nợ phải thu (Receivable):** Số tiền công ty xây dựng sắp nhận từ Chủ đầu tư hoặc khách hàng theo hợp đồng và hóa đơn đã phát hành.
- **Công nợ phải trả (Payable):** Số tiền công ty xây dựng nợ các nhà cung cấp vật tư, đội thi công hoặc nhà thầu phụ chưa thanh toán.

### 9.3. Cách đọc công nợ
Trong màn hình công nợ, bạn sẽ thấy các thông tin:
- **Tổng công nợ:** Toàn bộ số tiền cần thu/cần trả.
- **Đã thu/Đã trả:** Tổng số tiền đã thanh toán/nhận được.
- **Còn phải thu/Còn phải trả:** Số tiền thực tế còn lại.
- **Phân tích tuổi nợ (Aging):** 
    - **0 - 30 ngày:** Chưa đến hạn.
    - **31 - 60 ngày:** Sắp đến hạn.
    - **61 - 90 ngày:** Quá hạn, cần xử lý.
    - **Trên 90 ngày:** Quá hạn lâu ngày.

**Ví dụ:**
> Nếu nhà cung cấp X (Ví dụ: Thép Hòa Phát) có hợp đồng 1.000.000.000 đ, công ty đã tạm ứng 200.000.000 đ, sau đó thanh toán thêm 500.000.000 đ. Khi kiểm tra "Phải trả", hệ thống sẽ hiển thị số còn lại cần thanh toán là 300.000.000 đ. Nếu trong đó có 100.000.000 đ nằm trong khung "Trên 90 ngày", kế toán cần lưu ý vì khoản này đã quá hạn thanh toán rất lâu.

### 9.4. Thu/Chi tiền công nợ
Từ màn hình công nợ, kế toán có thể thao tác:
- **Thu tiền:** Bấm "Thu tiền" trên dòng hóa đơn phải thu để tạo phiếu thu.
- **Chi tiền:** Bấm "Chi tiền" trên dòng công nợ phải trả để tạo ủy nhiệm chi hoặc phiếu chi.
- **Lịch sử/Truy vết:** Xem lại nguồn gốc công nợ xuất phát từ hóa đơn/hợp đồng nào.

---

## 10. HƯỚNG DẪN QUẢN LÝ DỰ TOÁN VÀ CHI PHÍ

### 10.1. Khái niệm cơ bản
- **Dự toán (Budget):** Là kế hoạch chi phí ban đầu cho từng hạng mục công việc (Ví dụ: Dự toán xây thô 5 tỷ, hoàn thiện 3 tỷ).
- **Chi phí thực tế (Actual):** Là số tiền thực tế đã chi trả hoặc phát sinh thông qua hóa đơn, chứng từ (Ví dụ: Tiền mua xi măng, trả nhân công).
- **Cấu trúc phân rã công việc (WBS - Work Breakdown Structure):** Danh sách các hạng mục công việc chi tiết của dự án.

### 10.2. Lập và xem Dự toán
1. Vào menu **"Dự toán"** (trong nhóm Công trình) để xem bảng Ngân sách WBS / CBS.
2. Chọn công trình ở phía trên.
3. Kế toán sẽ thấy bảng gồm các hạng mục công việc (WBS).
4. Các cột chính: 
   - **Dự toán:** Kế hoạch.
   - **Thực tế:** Đã chi.
   - **Chênh lệch:** Dự toán - Thực tế. (Số âm màu đỏ = Vượt ngân sách).
5. Để lập ngân sách cho một hạng mục, bấm **"Lập"** ở cột Nghiệp vụ và điền số tiền dự toán.

### 10.3. Nhập chi phí phát sinh
1. Vào menu **"Chi phí"**.
2. Bấm **"Thêm chi phí mới"**.
3. Điền các thông tin: Ngày, Nhà cung cấp, Hạng mục WBS liên quan, Loại chi phí (Vật tư, nhân công...), Số lượng, Đơn giá.
4. Bấm Lưu. Chi phí này sẽ cộng dồn vào cột "Thực tế" trong bảng Dự toán.

### 10.4. Kiểm tra cảnh báo
Khi nhập chi phí, nếu tổng Chi phí thực tế vượt mức Dự toán ban đầu, hệ thống sẽ báo đỏ (Vượt ngân sách) ở cột trạng thái của hạng mục đó. Kế toán cần giải trình hoặc xin ý kiến kế toán trưởng.

---

## 11. HƯỚNG DẪN CẢNH BÁO RỦI RO

### 11.1. Các loại cảnh báo
Hệ thống tự động quét dữ liệu và đưa ra cảnh báo ở màn hình Dashboard (phần "Cảnh báo rủi ro"):
- **Vượt giá trị hợp đồng:** Tổng số tiền thanh toán hoặc nghiệm thu lớn hơn giá trị ký kết ban đầu.
- **Vượt dự toán:** Chi phí thực tế vượt quá mức dự toán được duyệt.
- **Thanh toán vượt nghiệm thu:** Số tiền đã chi cho nhà cung cấp lớn hơn giá trị khối lượng họ đã hoàn thành.
- **Công nợ quá hạn:** Các khoản nợ chưa thanh toán đã vượt quá số ngày cho phép (60, 90 ngày).
- **Lệch dòng tiền/Hóa đơn:** Có sự chênh lệch số liệu giữa hóa đơn, chứng từ và sổ cái kế toán.

### 11.2. Ý nghĩa màu sắc cảnh báo
- **Màu ĐỎ (Lỗi nghiêm trọng):** Có sự sai lệch hoặc rủi ro cao (Vượt ngân sách, sai số liệu kép). Cần kiểm tra và xử lý ngay lập tức.
- **Màu VÀNG/CAM (Cảnh báo):** Sắp đến hạn hoặc có dấu hiệu rủi ro. Cần theo dõi (ví dụ: Công nợ sắp đến hạn).
- **Màu XANH:** Số liệu bình thường, hợp lệ, đã xử lý.

> Khi thấy cảnh báo đỏ, hãy bấm thẳng vào cảnh báo đó. Hệ thống sẽ mở ra chi tiết chứng từ/hợp đồng bị lỗi để bạn kiểm tra số liệu.

---

## 12. HƯỚNG DẪN BÁO CÁO

### 12.1. Truy cập
Menu **"Báo cáo tổng hợp"** hoặc truy cập các báo cáo trực tiếp trong từng phân hệ (Công nợ, Công trình, Quỹ).

### 12.2. Các báo cáo quan trọng

1. **Báo cáo Dòng tiền (P&L theo tháng):** 
   - Dùng để theo dõi Tổng thu, Tổng chi, Doanh thu, Lợi nhuận thuần hàng tháng.
   - Dành cho Giám đốc/Kế toán trưởng xem xét dòng tiền.
2. **Báo cáo Sổ quỹ Tiền mặt / Sổ Tiền gửi Ngân hàng:**
   - (Trong phân hệ Quỹ & Ngân hàng) Dùng để kiểm tra tồn quỹ thực tế so với sổ sách, chi tiết từng khoản thu/chi.
3. **Bảng Cân đối Phát sinh (Trial Balance):**
   - Đối chiếu số liệu Sổ cái (Tài khoản loại 1 đến 9) đảm bảo Tổng Nợ = Tổng Có. 
   - Dành cho Kế toán tổng hợp.
4. **Bảng Cân đối Kế toán (Balance Sheet):**
   - Tổng hợp Tài sản, Nguồn vốn của công ty tại thời điểm báo cáo.
5. **Báo cáo Thuế VAT:**
   - Danh sách hóa đơn đầu vào, số tiền chưa thuế, tiền thuế VAT. Phục vụ kê khai thuế.

### 12.3. Hướng dẫn xuất và in báo cáo
Tại góc phải trên của các màn hình báo cáo hoặc danh sách, luôn có các nút:
- **"Xuất Excel/CSV":** Lưu file bảng tính để xử lý số liệu thêm.
- **"In báo cáo (PDF)":** Xuất bản in đẹp mắt, đúng chuẩn để trình ký.
  
> **Lưu ý trước khi xuất:** Hãy chọn đúng công trình, đúng kỳ báo cáo (từ ngày - đến ngày) trên thanh công cụ để đảm bảo báo cáo chứa đúng dữ liệu bạn cần.

---

## 13. QUY TẮC NHẬP LIỆU ĐỂ TRÁNH SAI SỐ

Kế toán phải luôn tuân thủ các nguyên tắc sau:
1. **Luôn chọn đúng công trình:** Hạch toán sai công trình sẽ làm sai toàn bộ báo cáo lãi/lỗ của cả 2 công trình.
2. **Luôn chọn đúng nhà cung cấp:** Tránh tình trạng thanh toán nhầm hoặc báo cáo công nợ sai.
3. **Luôn gắn hợp đồng:** Nếu khoản thanh toán hoặc nghiệm thu liên quan đến hợp đồng, bắt buộc phải chọn hợp đồng đó.
4. **Không nhập trùng chứng từ:** Cần kiểm tra số hóa đơn, số chứng từ trước khi nhập.
5. **Kiểm tra kỹ ngày tháng và số tiền:** Lỗi sai "0" (nhập 1 tỷ thành 100 triệu) rất nguy hiểm.
6. **Không tự ý xóa dữ liệu:** Chỉ xóa khi chứng từ chưa duyệt. Nếu đã Ghi sổ, phải dùng nghiệp vụ "Đảo bút toán" hoặc xin phép Kế toán trưởng.
7. **Đính kèm chứng từ:** Nếu hệ thống/công ty yêu cầu có chứng từ gốc (scan PDF/ảnh hóa đơn).
8. **Kiểm tra cảnh báo sau khi nhập:** Nhập xong một chứng từ lớn, hãy xem Dashboard có hiện cảnh báo đỏ nào không.

---

## 14. QUY TRÌNH KIỂM TRA CUỐI NGÀY / CUỐI TUẦN

### 14.1. Checklist cuối ngày
- [ ] Kiểm tra các chứng từ mới nhập (thu, chi, tạm ứng).
- [ ] Xác nhận không có chứng từ nào bị treo ở trạng thái "Nháp" quên không gửi duyệt.
- [ ] Kiểm tra Dashboard xem có "Cảnh báo đỏ" nào phát sinh do giao dịch trong ngày không.
- [ ] Đối chiếu Tồn quỹ tiền mặt trên hệ thống khớp với két sắt.

### 14.2. Checklist cuối tuần / cuối tháng
- [ ] Đối chiếu công nợ với các nhà cung cấp/nhà thầu phụ (so sánh Phải trả).
- [ ] Rà soát các khoản Tạm ứng treo lâu ngày chưa hoàn ứng.
- [ ] Đối chiếu chi phí thực tế với dự toán công trình.
- [ ] Kiểm tra các hóa đơn VAT đầu vào.
- [ ] Xuất báo cáo Dòng tiền, Công nợ gửi Kế toán trưởng / Giám đốc.

---

## 15. CÂU HỎI THƯỜNG GẶP (FAQ)

**Q: Tôi nhập nhầm công trình thì làm sao?**
A: Nếu chứng từ đang ở trạng thái Nháp hoặc Chờ duyệt, bạn có thể sửa lại. Nếu đã Ghi sổ, hãy liên hệ Kế toán trưởng để được hỗ trợ "Đảo bút toán" và nhập lại chứng từ mới.

**Q: Vì sao số tiền Còn lại (công nợ) không đúng?**
A: Hãy kiểm tra lại lịch sử thanh toán của nhà cung cấp đó. Có thể bạn đã nhập Thanh toán nhưng quên chọn đúng Hợp đồng, hoặc có khoản Tạm ứng chưa được đối trừ.

**Q: Vì sao hệ thống báo vượt hợp đồng?**
A: Do tổng giá trị Nghiệm thu hoặc Tổng thanh toán (bao gồm cả Tạm ứng) bạn nhập đang lớn hơn Giá trị hợp đồng đã khai báo. Hãy kiểm tra lại hợp đồng có được phê duyệt phụ lục tăng giá trị không.

**Q: Vì sao không thấy hợp đồng khi nhập thanh toán?**
A: Bạn cần chọn Công trình và Nhà cung cấp trước. Hệ thống chỉ hiển thị hợp đồng tương ứng với Nhà cung cấp đó tại Công trình đó.

**Q: Tạm ứng và thanh toán khác nhau như thế nào trong hệ thống?**
A: Tạm ứng là chi tiền khi chưa có hóa đơn/nghiệm thu (treo công nợ tạm ứng). Thanh toán là chi tiền để thanh toán cho hóa đơn/nghiệm thu đã được xác nhận (giảm công nợ thực tế).

**Q: Nếu đã thanh toán nhưng báo cáo chưa cập nhật thì kiểm tra gì?**
A: Có thể chứng từ thanh toán của bạn mới ở trạng thái "Chờ duyệt". Chứng từ chỉ làm thay đổi báo cáo khi đạt trạng thái **"Đã ghi sổ" (Posted)**.

**Q: Có được xóa chứng từ không?**
A: Tùy quyền hạn. Kế toán viên thường chỉ được xóa chứng từ Nháp. Các chứng từ đã phê duyệt/ghi sổ không được phép xóa để đảm bảo dấu vết kiểm toán.

---

## 16. KẾT LUẬN

Hệ thống Kế toán Xây dựng Nội bộ là công cụ mạnh mẽ giúp chuẩn hóa toàn bộ luồng dữ liệu tài chính của công ty. Điểm cốt lõi của hệ thống là **Dữ liệu tập trung theo công trình** và **Tính liên kết chứng từ**.

Chỉ cần kế toán tuân thủ đúng quy tắc: **Chọn đúng Công trình - Đúng Nhà cung cấp - Đúng Hợp đồng** khi nhập liệu, hệ thống sẽ tự động tính toán chính xác mọi báo cáo công nợ, chi phí, dòng tiền và cảnh báo rủi ro kịp thời, hỗ trợ tối đa cho Kế toán trưởng và Giám đốc trong việc ra quyết định.

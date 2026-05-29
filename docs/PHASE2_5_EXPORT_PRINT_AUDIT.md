# BÁO CÁO KIỂM TOÁN VÀ KHẢO SÁT HỆ THỐNG XUẤT BẢN & IN ẤN CHỨNG TỪ (EXPORT/PRINT AUDIT)

## 1. TỔNG QUAN HIỆN TRẠNG HỆ THỐNG
Trong khuôn khổ của **Sprint 2.5: Export / Print / Accounting Documents**, chúng tôi thực hiện kiểm toán toàn diện tính năng xuất dữ liệu (CSV/Excel) và in ấn (PDF/Bản in cứng) trên toàn bộ hệ thống ERP Xây dựng hiện tại.

Hiện tại, hệ thống đã cung cấp một số cơ chế xuất/in cơ bản ở phía Client-side trong trang Báo cáo (`app/reports/page.tsx`) nhưng vẫn còn tồn tại các rủi ro bảo mật nghiêm trọng liên quan đến việc bỏ qua các lớp kiểm soát phía máy chủ (Client-side Bypass) và thiếu các mẫu biểu in ấn tiêu chuẩn kế toán Việt Nam (VAS/Thông tư 200).

---

## 2. BẢNG AUDIT CHI TIẾT CÁC MODULE

| Module | Hiện trạng | Thiếu gì | Rủi ro | Đề xuất xử lý |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard** | Đã có các chỉ số tài chính (TK 131, TK 141) hiển thị trên màn hình trực quan. | Chưa có nút xuất báo cáo nhanh hoặc in ấn Dashboard. | Người quản lý không thể lưu trữ bản in nhanh của Dashboard để họp hoặc lưu trữ dạng giấy. | Thêm tính năng in Dashboard nhanh qua CSS thân thiện máy in `@media print`. |
| **Revenue (Doanh thu)** | Có bảng danh sách hóa đơn bán ra dở dang của dự án. | Chưa có nút xuất danh sách hóa đơn ra Excel/CSV chuyên sâu; Chưa có phiếu xuất hóa đơn/phiếu in chi tiết. | Nhân viên kế toán phải sao chép số liệu thủ công khi đối chiếu số liệu với chủ đầu tư. | Bổ sung nút xuất Excel và liên kết in chi tiết hóa đơn theo mẫu Việt Nam. |
| **Debt (Công nợ)** | Hiển thị danh sách hóa đơn mua vào, công nợ nhà thầu phụ. | Thiếu nút xuất bảng kê công nợ tổng hợp của dự án và báo cáo chi tiết. | Khó khăn khi đối chiếu công nợ định kỳ với từng nhà thầu phụ, tổ đội thi công. | Cung cấp API xuất Excel công nợ kèm Tenant Guard; tích hợp trang in chi tiết công nợ từng đối tác. |
| **Ledger (Sổ cái)** | Có modal truy vết hạch toán kép (Nợ/Có) dở dang khi drill-down trên báo cáo. | Chưa có tính năng xuất Sổ cái chính thức (dạng Sổ cái tài khoản chi tiết - Thông tư 200). | Thiếu hồ sơ pháp lý Sổ cái giấy để ký đóng dấu của Kế toán trưởng và Giám đốc. | Xây dựng API `/api/export/ledger` và mẫu in Sổ cái chi tiết dạng A4 dọc tiêu chuẩn. |
| **Trial Balance (Bảng Cân đối Phát sinh)** | Đã có bảng hiển thị và nút xuất CSV chung phía Client-side. | Chưa có mẫu in Bảng cân đối phát sinh tài khoản tiêu chuẩn Việt Nam, có đầy đủ chữ ký các bên. | Dữ liệu xuất từ Client-side dễ bị bypass hoặc thay đổi giá trị cục bộ trước khi tải xuống. | Xây dựng mẫu in PDF/A4 ngang chuyên nghiệp có khối ký duyệt và mã hóa dữ liệu. |
| **Contract (Hợp đồng)** | Hiển thị tiến độ và truy vết dòng tiền hợp đồng. | Chưa có tính năng xuất/in thông tin dòng tiền và chi tiết phụ lục hợp đồng xây dựng. | Khó đối soát với Ban Quản lý dự án. | Tích hợp nút xuất báo cáo tài chính hợp đồng. |
| **Invoice (Hóa đơn)** | Có màn hình nhập và danh sách chi tiết hóa đơn. | Chưa có nút in hóa đơn hoặc Phiếu Kế toán (Journal Voucher) đi kèm hóa đơn đó. | Không có chứng từ kế toán ký duyệt vật lý làm bằng chứng ghi sổ nợ. | Bổ sung trang in Phiếu Kế toán cho hóa đơn đã ghi sổ. |
| **Payment (Thanh toán)** | Có dữ liệu hạch toán thanh toán/tạm ứng trong DB. | Chưa có tính năng in **Phiếu thu (Receipt Voucher)** và **Phiếu chi (Payment Voucher)**. | **RỦI RO P0 CỰC KỲ LỚN**: Kế toán không thể in phiếu thu/chi để khách hàng/nhà cung cấp ký khi giao nhận tiền mặt. | Thiết kế và cài đặt mẫu in Phiếu thu, Phiếu chi chuẩn Thông tư 200 có dịch số tiền thành chữ tiếng Việt. |
| **Advance / Settlement (Tạm ứng/Quyết toán)** | Đã có nghiệp vụ tạm ứng (TK 141) hoàn ứng trong cơ sở dữ liệu thật. | Thiếu mẫu in Giấy đề nghị tạm ứng, Giấy thanh toán tạm ứng/hoàn ứng của tổ đội, cán bộ. | Nhân viên phải viết tay giấy đề nghị gây chậm trễ và tăng sai sót số liệu. | Bổ sung mẫu in Phiếu tạm ứng và Báo cáo tạm ứng chưa quyết toán. |

---

## 3. KIỂM TRA CHỈ TIÊU KỸ THUẬT BẮT BUỘC

1. **Xuất dữ liệu có dùng nguồn Ledger/Source chuẩn không?**
   * *Hiện trạng*: Client-side đang xuất trực tiếp từ các state cục bộ của React Component. Đây là rủi ro nếu dữ liệu hiển thị trên component chưa được đồng bộ hoặc bị sửa đổi.
   * *Giải pháp*: Chuyển hướng xuất dữ liệu qua API backend chính thức để đảm bảo tính toàn vẹn của Sổ cái.
2. **Có nguy cơ Client-side Bypass không?**
   * *Hiện trạng*: Rất cao. User có thể dùng DevTools để sửa dữ liệu hiển thị trên màn hình trước khi gọi hàm xuất CSV của Client.
   * *Giải pháp*: Toàn bộ các API xuất tài chính nhạy cảm phải lấy dữ liệu trực tiếp từ Database qua kiểm soát của Backend.
3. **Có ghi nhận Nhật ký Kiểm toán (Audit Log) không?**
   * *Hiện trạng*: Đã có route `/api/reports/audit-export` ghi nhận log dạng `SECURITY_ALERT` nhưng chỉ áp dụng trên trang Báo cáo chung (`reports/page.tsx`). Các màn hình đơn lẻ khác hoàn toàn chưa ghi nhận.
   * *Giải pháp*: Chuẩn hóa việc ghi audit log đồng bộ trên toàn bộ các API xuất và in ấn.
4. **Có kiểm soát Phân quyền (RBAC) và Cô lập Tenant (Company/Tenant Guard) không?**
   * *Hiện trạng*: API `/api/reports/audit-export` đã có `requireAccountingAccess` và `requireProjectAccess`, nhưng do client tự gọi thủ công nên nếu hacker bypass API xuất trực tiếp thì sẽ mất lớp phòng thủ này.
   * *Giải pháp*: Đưa RBAC và Company Guard trực tiếp vào các Route API xuất bản mới của Sprint 2.5.
5. **Đã có định dạng Kế toán Việt Nam tiêu chuẩn chưa?**
   * *Hiện trạng*: Đã có định dạng tiền VND (ví dụ: `1.234.567.890 ₫`). Tuy nhiên, chưa có hàm chuyển đổi số tiền thành chữ viết tiếng Việt (ví dụ: *Một triệu hai trăm ba mươi tư ngàn...*) bắt buộc cho Phiếu Thu và Phiếu Chi.
   * *Giải pháp*: Xây dựng thuật toán `numberToVietnameseWords` chuẩn trong file tiện ích.

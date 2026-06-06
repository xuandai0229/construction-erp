# HƯỚNG DẪN ĐIỀN DỮ LIỆU THẬT UAT (UAT REAL DATA INPUT WORKING GUIDE)

**Trạng thái:** SẴN SÀNG  
**Phiên bản:** 1.0 - Bản phát hành phục vụ UAT  

Tài liệu này hướng dẫn chi tiết cách thức chuẩn bị và điền dữ liệu thật của doanh nghiệp vào tệp bảng tính làm việc phục vụ nghiệm thu hệ thống (UAT).

---

## 1. FILE EXCEL CẦN DÙNG (WORKING SPREADSHEET)
Kế toán/Người dùng chỉ điền dữ liệu vào tệp tin làm việc duy nhất:
```text
templates/UAT_REAL_DATA_INPUT_WORKING.xlsx
```
*Tệp tin này được sao chép nguyên trạng từ mẫu sạch của hệ thống, đã xóa toàn bộ dữ liệu mẫu tại Dòng 3 trở đi và giữ lại cấu trúc tiêu đề, hướng dẫn cùng danh mục lựa chọn (dropdown).*

---

## 2. FILE TUYỆT ĐỐI KHÔNG DÙNG (DO NOT USE)
Tuyệt đối **KHÔNG** sử dụng tệp tin sau để chuẩn bị dữ liệu thật:
```text
templates/PHASE1_ERP_IMPORT_TEMPLATE_DRAFT_FILLED_SAMPLE.xlsx
```
*Lý do: Tệp tin này chứa dữ liệu mô phỏng/ảo (ví dụ: `COMP-HN-02-TEST`, `TEST-0102026002`,...) từ các đợt dry-run thử nghiệm trước. Việc sử dụng tệp này có thể làm ô nhiễm cơ sở dữ liệu thật.*

---

## 3. THỨ TỰ ĐIỀN DỮ LIỆU TUẦN TỰ (17 SHEETS)

Người dùng/Kế toán cần tiến hành nhập liệu lần lượt theo đúng thứ tự logic dưới đây để đảm bảo không bị lỗi khóa ngoại liên kết (Foreign Key):

1.  **`DM_CongTy`**: Khởi tạo pháp nhân/công ty chủ quản (Tenant).
2.  **`DM_NguoiDung`**: Danh sách nhân viên thực hiện thao tác (phục vụ test SoD).
3.  **`DM_TaiKhoanKeToan`**: Bảng hệ thống tài khoản hạch toán sổ cái của doanh nghiệp.
4.  **`DM_KyKeToan`**: Thiết lập các kỳ kế toán phục vụ đóng/mở sổ.
5.  **`DM_NhaCungCap_KhachHang`**: Danh mục đối tác kinh doanh (Nhà cung cấp, khách hàng, thầu phụ).
6.  **`DM_CongTrinh`**: Danh sách các công trình/dự án đang thi công thực tế.
7.  **`DM_WBS`**: Cấu trúc phân rã hạng mục công việc chi tiết của từng dự án.
8.  **`DM_DuToan`**: Ngân sách được duyệt cho từng loại chi phí tại từng hạng mục WBS.
9.  **`DM_HopDong`**: Các hợp đồng kinh tế đã ký (bao gồm Đơn mua hàng PO).
10. **`DM_VatTu`**: Danh mục vật tư kỹ thuật công trường.
11. **`DM_Kho`**: Danh sách các kho bãi đặt tại công trường.
12. **`GD_Kho_NhapXuat`**: Các phiếu nhập kho/xuất kho vật tư thật phát sinh.
13. **`GD_ChiPhi`**: Các khoản chi phí phát sinh thực tế (hóa đơn dịch vụ, ca máy, thầu phụ).
14. **`GD_HoaDon`**: Hóa đơn đầu ra nghiệm thu sản lượng xây lắp với chủ đầu tư.
15. **`GD_ThanhToan`**: Chứng từ thu tiền khách hàng tương ứng với hóa đơn đầu ra.
16. **`GD_TamUng`**: Chứng từ tạm ứng tiền cho tổ đội hoặc nhân viên dự án.
17. **`GD_HoanUng`**: Hồ sơ đối trừ hoàn ứng từ hóa đơn chi phí thực tế.

> 📝 **Lưu ý các sheet có thể để trống tạm thời:**  
> Các sheet: `DM_ChiNhanh`, `GD_HoaDonThue`, `GD_PhieuThuChi`, `GD_ButToan_ThuCong` có thể để trống trong giai đoạn đầu nếu chưa thực hiện kịch bản test chuyên sâu về chi nhánh hoặc bút toán tổng hợp thủ công.

---

## 4. NGUYÊN TẮC ĐIỀN DỮ LIỆU BẮT BUỘC (DATA INTEGRITY RULES)

Để quá trình import và kiểm thử diễn ra trơn tru, kế toán bắt buộc phải tuân thủ các nguyên tắc sau:

*   **Chỉ điền dữ liệu thật:** Tuyệt đối không tự nghĩ ra tên công ty, MST, mã dự án hay số tiền giả lập. Tất cả phải được trích xuất từ chứng từ thực tế của doanh nghiệp.
*   **Định dạng ngày tháng:** Bắt buộc nhập dạng `YYYY-MM-DD` (Ví dụ: `2026-06-05`). Không nhập `05/06/2026` hay `5-6-2026`.
*   **Định dạng số tiền:** Nhập số nguyên hoặc số thập phân thuần túy, không định dạng dấu phân cách thủ công hay thêm chữ `đ`, `VND`. (Ví dụ nhập `50000000` thay vì `50.000.000 đ`).
*   **Tính nhất quán của mã liên kết:** Các trường mã định danh (như `MaDuAn`, `MaWBS`, `MaVatTu`, `MaKho`, `MaCongTy`) dùng làm liên kết giữa các sheet phải trùng khớp tuyệt đối 100% (cả chữ hoa, chữ thường và khoảng trắng).
*   **Quy tắc Kỳ kế toán mở:** Mọi ngày hạch toán phát sinh giao dịch ở các sheet `GD_` phải nằm trong tháng có kỳ kế toán đang hoạt động (`DM_KyKeToan` có `isLocked = False` hoặc `status = OPEN`).

---

## 5. DANH SÁCH SHEET CẦN ĐIỀN TRƯỚC (MASTER DATA)

| STT | Sheet | Bắt buộc? | Vì sao cần điền trước | Sheet phụ thuộc |
| --- | ----- | --------- | --------------------- | --------------- |
| 1 | `DM_CongTy` | **Bắt buộc** | Tạo môi trường Tenant tách biệt. | Tất cả các sheet khác. |
| 2 | `DM_TaiKhoanKeToan` | **Bắt buộc** | Làm cơ sở hạch toán tài khoản kế toán nợ/có. | `GD_Kho_NhapXuat`, `GD_ChiPhi`, `GD_ButToan_ThuCong`. |
| 3 | `DM_Kho` | **Bắt buộc** | Xác định kho nguồn/đích của vật tư. | `GD_Kho_NhapXuat`. |
| 4 | `DM_VatTu` | **Bắt buộc** | Định nghĩa đơn vị tính và mã vật tư giao dịch. | `GD_Kho_NhapXuat`. |
| 5 | `DM_NhaCungCap_KhachHang` | **Bắt buộc** | Xác định đối tượng công nợ mua bán. | `DM_HopDong`, `GD_ChiPhi`, `GD_HoaDon`, `GD_TamUng`. |
| 6 | `DM_CongTrinh` | **Bắt buộc** | Định danh công trình làm gốc phân bổ chi phí. | `DM_WBS`, `DM_DuToan`, `DM_HopDong`, `GD_ChiPhi`. |
| 7 | `DM_WBS` | **Bắt buộc** | Phân cấp đầu mục công việc chi tiết. | `DM_DuToan`, `GD_ChiPhi`, `GD_Kho_NhapXuat`. |
| 8 | `DM_DuToan` | **Bắt buộc** | Khống chế trần chi phí cho từng hạng mục thi công.| `GD_ChiPhi` (kiểm tra cảnh báo vượt ngân sách). |

---

## 6. DANH SÁCH SHEET GIAO DỊCH PHÁT SINH (TRANSACTION DATA)

| STT | Sheet | Dữ liệu cần lấy từ chứng từ thật | Phụ thuộc sheet nào | Dùng để test gì |
| --- | ----- | -------------------------------- | ------------------- | --------------- |
| 1 | `GD_Kho_NhapXuat` | Phiếu nhập/xuất kho thực tế công trường, số lượng, đơn giá mua từ hóa đơn. | `DM_Kho`, `DM_VatTu`, `DM_WBS` | Test tính giá xuất kho bình quân gia quyền di động và chặn xuất âm kho. |
| 2 | `GD_ChiPhi` | Hóa đơn GTGT mua vào, biên bản bàn giao khối lượng thầu phụ, bảng chấm công ca máy. | `DM_CongTrinh`, `DM_WBS`, `DM_NhaCungCap_KhachHang` | Test kiểm soát chi phí thực tế so với dự toán phê duyệt và ghi nhận công nợ AP. |
| 3 | `GD_HoaDon` | Hóa đơn GTGT đầu ra xuất cho chủ đầu tư, biên bản nghiệm thu giai đoạn. | `DM_CongTrinh`, `DM_NhaCungCap_KhachHang` | Test ghi nhận doanh thu xây dựng và công nợ phải thu AR. |
| 4 | `GD_ThanhToan` | Ủy nhiệm chi (UNC) ngân hàng, giấy báo Có, phiếu thu tiền mặt. | `GD_HoaDon` (để đối chiếu thu nợ) | Test tất toán công nợ khách hàng và ghi sổ cái tài khoản tiền. |
| 5 | `GD_TamUng` | Giấy đề nghị tạm ứng được duyệt, phiếu chi tiền tạm ứng tổ đội. | `DM_CongTrinh`, `DM_NhaCungCap_KhachHang` | Test hạn mức tạm ứng và phân hệ phê duyệt bất kiêm nhiệm SoD. |
| 6 | `GD_HoanUng` | Bảng thanh quyết toán khối lượng hoàn thành đối trừ tạm ứng. | `GD_TamUng`, `GD_ChiPhi` | Test kiểm soát giảm trừ công nợ tạm ứng tự động. |

---

## 7. CHECKLIST TRƯỚC KHI GỬI LẠI FILE EXCEL CHO AI KIỂM TRA

Kế toán/Người dùng vui lòng rà soát danh sách dưới đây trước khi gửi file làm việc cho hệ thống kiểm tra tính hợp lệ:

- [ ] **Công ty thật:** Đã điền tên công ty và mã số thuế hoạt động thật của doanh nghiệp.
- [ ] **Đối tác thật:** Đã cập nhật mã số thuế thật của các nhà cung cấp/chủ đầu tư lớn đang giao dịch.
- [ ] **Công trình thật:** Đã nhập mã và tên công trình thực tế kèm giá trị hợp đồng trúng thầu.
- [ ] **Mã WBS nhất quán:** Các mã hạng mục công việc tại sheet `DM_WBS` trùng khớp với mã WBS được gán trong `DM_DuToan`, `GD_ChiPhi`, `GD_Kho_NhapXuat`.
- [ ] **Dự toán đầy đủ:** Các hạng mục WBS thi công đều được lập dự toán ngân sách tương ứng trong `DM_DuToan`.
- [ ] **Vật tư & Kho:** Đã điền đúng đơn vị tính thực tế (tấn, kg, khối...) và mã kho viết tắt của công trường.
- [ ] **Không có dữ liệu mẫu:** Đã xóa hoặc kiểm tra đảm bảo không còn dòng dữ liệu test mẫu nào (như `COMP-HN-02-TEST`...) lọt vào file làm việc.
- [ ] **Liên kết mã chính xác:** Không có mã công trình hay mã đối tác nào ở các sheet giao dịch `GD_` mà không được khai báo trước ở các sheet danh mục `DM_`.
- [ ] **Không có dòng trống:** Dữ liệu được điền liên tục từ dòng 3 xuống dưới, không để cách dòng trống ở giữa bảng.
- [ ] **Định dạng tiền chuẩn:** Các cột số tiền không chứa chữ cái, ký hiệu tiền tệ hoặc dấu chấm phân cách hàng ngàn nhập tay.
- [ ] **Định dạng ngày chuẩn:** Tất cả cột ngày hạch toán đều sử dụng định dạng `YYYY-MM-DD`.

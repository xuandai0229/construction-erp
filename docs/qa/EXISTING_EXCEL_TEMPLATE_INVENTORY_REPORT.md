# BÁO CÁO KIỂM TRA MẪU TỆP EXCEL HIỆN CÓ (EXISTING EXCEL TEMPLATE INVENTORY REPORT)

**Trạng thái:** HOÀN THÀNH  
**Chế độ hoạt động:** READ-ONLY TEMPLATE AUDIT  

Báo cáo này liệt kê và đánh giá toàn bộ các tệp Excel/CSV hiện có trong kho lưu trữ (repository) nhằm xác định khả năng tái sử dụng cho quá trình chuẩn bị dữ liệu UAT, tránh tạo trùng lắp hoặc sử dụng nhầm dữ liệu mẫu.

---

## 1. TÌNH TRẠNG FILE BÁO CÁO VÀ REPO (GIT STATUS)

Báo cáo trạng thái các tệp tin liên quan đến quá trình audit và checklist dữ liệu:

| STT | File | Có trong repo không | Đường dẫn thực tế | Ghi chú |
| --- | ---- | ------------------- | ----------------- | ------- |
| 1 | Báo cáo Phase 1 | Có | `docs/qa/REAL_TEST_DATA_INPUT_AUDIT_REPORT.md` | Bản phác thảo đầu tiên về danh mục dữ liệu đầu vào. |
| 2 | Báo cáo Phase 2 | Có (Bản sạch) | `docs/qa/REAL_TEST_DATA_INPUT_AUDIT_REPORT_EVIDENCE.md` | Báo cáo đối chiếu kỹ thuật kèm bằng chứng mã nguồn (đã loại bỏ dữ liệu mẫu). |
| 3 | Báo cáo Clean Checklist mới | Có | `docs/qa/REAL_TEST_DATA_INPUT_CLEAN_CHECKLIST.md` | Bản checklist sạch phục vụ cho người dùng chuẩn bị dữ liệu thật. |
| 4 | Báo cáo Inventory Excel | Có | `docs/qa/EXISTING_EXCEL_TEMPLATE_INVENTORY_REPORT.md` | Tệp này (Báo cáo chi tiết về danh sách mẫu Excel hiện có trong hệ thống). |

---

## 2. DANH SÁCH FILE EXCEL VÀ CSV HIỆN CÓ TRONG HỆ THỐNG

Dưới đây là bảng tổng hợp tất cả các tệp bảng tính (Excel/CSV) được tìm thấy trong thư mục dự án:

| STT | File | Đường dẫn | Loại file | Dung lượng (Bytes) | Ngày sửa | Mục đích suy đoán từ tên file | Có nên dùng tiếp không |
| --- | ---- | --------- | --------- | ---------: | -------- | ----------------------------- | ---------------------- |
| 1 | `PHASE1_ERP_IMPORT_TEMPLATE_DRAFT_REVIEW.xlsx` | `templates/` | Excel (`.xlsx`) | 375,456 | 2026-06-05 | Tệp mẫu nhập liệu trống, có sẵn cấu trúc cột và ghi chú nghiệp vụ. | **Có (Khuyên dùng)**. Đây là tệp mẫu sạch tốt nhất. |
| 2 | `PHASE1_ERP_IMPORT_TEMPLATE_DRAFT_FILLED_SAMPLE.xlsx` | `templates/` | Excel (`.xlsx`) | 97,741 | 2026-06-05 | Tệp mẫu chứa dữ liệu test mẫu đã điền sẵn ở dòng 3. | **Không**. Chỉ dùng để tham khảo cách điền dữ liệu mẫu. |
| 3 | `project-company-mapping.template.csv` | `docs/reconciliation/` | CSV | 167 | 2026-06-01 | File CSV mẫu để đối chiếu ánh xạ Dự án - Công ty. | **Không**. Đây là file đối chiếu kỹ thuật sổ cái, không dùng nhập UAT. |
| 4 | `journal-project-mapping.template.csv` | `docs/reconciliation/` | CSV | 443 | 2026-06-01 | File CSV mẫu để đối chiếu ánh xạ Nhật ký chung - Dự án (chứa dữ liệu mẫu). | **Không**. Đây là file đối chiếu kỹ thuật sổ cái, không dùng nhập UAT. |
| 5 | `project-battrang-ap-reconciliation.template.csv` | `docs/reconciliation/` | CSV | 307 | 2026-06-01 | File CSV mẫu để đối chiếu công nợ phải trả dự án Bát Tràng. | **Không**. Đây là file đối chiếu kỹ thuật sổ cái, không dùng nhập UAT. |
| 6 | Các file tương tự trong `docs/reconciliation/templates/` | `docs/reconciliation/templates/` | CSV | - | 2026-06-01 | Bản sao lưu mẫu đối chiếu. | **Không**. Chỉ phục vụ đối chiếu dữ liệu cũ. |
| 7 | Các file CSV trong `.local-audit-quarantine/` | `.local-audit-quarantine/` | CSV | - | - | Thư mục cách ly chứa các file đối chiếu tự động trong quá trình chạy test. | **Không**. Đây là thư mục nháp/cách ly của hệ thống kiểm tra độc lập. |

---

## 3. CHI TIẾT CẤU TRÚC WORKBOOK CỦA FILE EXCEL MẪU TRONG HỆ THỐNG

Qua phân tích cấu trúc kỹ thuật (Read-only OpenXML XML parsing) của tệp **`templates/PHASE1_ERP_IMPORT_TEMPLATE_DRAFT_REVIEW.xlsx`**, hệ thống ghi nhận các đặc điểm sau:

### 3.1. Danh sách các Sheet hoạt động (27 Sheets)
Tệp Excel này được thiết kế cực kỳ quy chuẩn, bao gồm đầy đủ các sheet danh mục và giao dịch kế toán:
1. `README_HuongDan` (Hướng dẫn chung)
2. `DECISION_LOG` (Nhật ký quyết định nghiệp vụ)
3. `MAPPING_STATUS` (Trạng thái ánh xạ dữ liệu)
4. `IMPORT_ORDER` (Thứ tự import dữ liệu hệ thống)
5. `ENUM_DROPDOWN` (Danh mục Enum chuẩn hóa)
6. `RISK_CHECKLIST` (Danh mục kiểm soát rủi ro)
7. `DM_CongTy` (Danh mục Công ty/Tenant)
8. `DM_ChiNhanh` (Danh mục Chi nhánh)
9. `DM_NguoiDung` (Danh mục Người dùng/Tài khoản)
10. `DM_TaiKhoanKeToan` (Danh mục Tài khoản kế toán)
11. `DM_KyKeToan` (Danh mục Kỳ kế toán)
12. `DM_NhaCungCap_KhachHang` (Danh mục Đối tác)
13. `DM_CongTrinh` (Danh mục Dự án/Công trình)
14. `DM_WBS` (Danh mục Hạng mục công việc)
15. `DM_DuToan` (Danh mục Dự toán chi phí)
16. `DM_HopDong` (Danh mục Hợp đồng thầu/PO)
17. `GD_HoaDon` (Giao dịch Hóa đơn phải thu/AR)
18. `GD_HoaDonThue` (Giao dịch Hóa đơn Thuế)
19. `GD_ThanhToan` (Giao dịch Thanh toán thu tiền/AR)
20. `GD_PhieuThuChi` (Giao dịch thu/chi quỹ tiền mặt)
21. `GD_ChiPhi` (Giao dịch Chi phí phát sinh/AP)
22. `GD_TamUng` (Giao dịch Tạm ứng)
23. `GD_HoanUng` (Giao dịch Hoàn ứng)
24. `DM_VatTu` (Danh mục Vật tư)
25. `DM_Kho` (Danh mục Kho bãi)
26. `GD_Kho_NhapXuat` (Giao dịch Nhập/Xuất kho)
27. `GD_ButToan_ThuCong` (Giao dịch Bút toán thủ công kế toán)

### 3.2. Đánh giá tính phù hợp với `REAL_TEST_DATA_INPUT_CLEAN_CHECKLIST.md`

*   **Số dòng/số cột:** Mỗi sheet dữ liệu chứa 52 dòng mẫu sẵn (trong đó Dòng 1 là Tên cột kỹ thuật phục vụ Import, Dòng 2 chứa mô tả nghiệp vụ và kiểu dữ liệu kiểm toán). Từ Dòng 3 trở đi là trống hoàn toàn đối với tệp `PHASE1_ERP_IMPORT_TEMPLATE_DRAFT_REVIEW.xlsx`.
*   **Dữ liệu mẫu:** Tệp `PHASE1_ERP_IMPORT_TEMPLATE_DRAFT_REVIEW.xlsx` **hoàn toàn sạch**, không chứa bất kỳ bản ghi dữ liệu mẫu nào ở dòng 3 trở đi. Trong khi đó, tệp `PHASE1_ERP_IMPORT_TEMPLATE_DRAFT_FILLED_SAMPLE.xlsx` có chứa các bản ghi kiểm thử mô phỏng (ví dụ: `COMP-HN-02-TEST`, `CONG TY CP THUONG MAI VA XAY DUNG SO 2 HN`) cần tránh dùng trực tiếp.
*   **Công thức:** Các ô không chứa công thức phức tạp của người dùng để tránh lỗi import, nhưng có ghi nhận các liên kết cấu trúc.
*   **Dropdown/Data Validation:** Hệ thống phát hiện có thẻ `<dataValidation>` tích hợp trong hầu hết các sheet từ 7 đến 27. Excel sẽ tự động hiển thị dropdown chọn các giá trị Enum chuẩn (như `PLANNING`, `IN_PROGRESS`, `DEBIT`, `CREDIT`, `material`, `subcontract`...) lấy từ sheet `ENUM_DROPDOWN`, giúp ngăn ngừa nhập sai chính tả Enum hệ thống.
*   **Định dạng in ấn A4:** Không cấu hình `<pageSetup>` in ấn. Đây là tệp chuyên dụng để trao đổi dữ liệu kỹ thuật.
*   **Mức độ tương thích:** **Khớp 100%** với cấu trúc cột đã kiểm toán trong báo cáo `docs/qa/REAL_TEST_DATA_INPUT_CLEAN_CHECKLIST.md`. Các tên cột tại Dòng 1 tương ứng hoàn toàn với các trường database và Zod Schema được đối chiếu.

---

## 4. KẾT LUẬN CHI TIẾT & HƯỚNG DẪN TIẾP THEO

*   **Trong hệ thống đã có file Excel template chưa?**  
    *Trả lời:* **Đã có**. Hệ thống đã có sẵn 2 tệp Excel mẫu chất lượng cao trong thư mục `templates/`.
*   **File nào có thể tái sử dụng?**  
    *Trả lời:* Tái sử dụng tệp **`templates/PHASE1_ERP_IMPORT_TEMPLATE_DRAFT_REVIEW.xlsx`**. Tệp này đã có đầy đủ 27 sheets, tiêu đề cột kỹ thuật ở dòng 1 và hướng dẫn điền kèm Data Validation dropdown chuẩn.
*   **File nào là bản cũ/nháp không nên dùng?**  
    *Trả lời:* Các tệp CSV trong `.local-audit-quarantine/` và các file CSV mẫu trong `docs/reconciliation/` là bản nháp/bản đối soát cũ, tuyệt đối không dùng để chuẩn bị dữ liệu UAT.
*   **File nào đang chứa dữ liệu mẫu cần tránh?**  
    *Trả lời:* Tệp `templates/PHASE1_ERP_IMPORT_TEMPLATE_DRAFT_FILLED_SAMPLE.xlsx` chứa dữ liệu test mẫu ảo tại dòng 3, cần tránh import tệp này vào cơ sở dữ liệu thật.
*   **Có cần tạo Excel mới không?**  
    *Trả lời:* **Không cần tạo mới hoàn toàn**. Chúng ta chỉ cần copy tệp `PHASE1_ERP_IMPORT_TEMPLATE_DRAFT_REVIEW.xlsx` ra một bản sao làm việc (ví dụ đặt tên là `UAT_REAL_DATA_INPUT.xlsx`) để gửi cho người dùng điền thông tin thật.
*   **Nếu tạo mới, nên tạo mới hoàn toàn hay cập nhật từ file hiện có?**  
    *Trả lời:* Không tạo mới hoàn toàn. Nên sao chép và đổi tên từ tệp `PHASE1_ERP_IMPORT_TEMPLATE_DRAFT_REVIEW.xlsx` để bảo toàn cấu trúc cột kỹ thuật và các Data Validation dropdown có sẵn.
*   **Nên điền bao nhiêu sheet dựa trên checklist hiện tại?**  
    *Trả lời:* Dựa trên danh sách kiểm tra sạch, người dùng chỉ cần tập trung điền dữ liệu thật vào **10 sheets chính** tương ứng với các danh mục master và giao dịch UAT:
    1. `DM_CongTy` (Thông tin Công ty thành viên)
    2. `DM_TaiKhoanKeToan` (Hệ thống tài khoản kế toán doanh nghiệp)
    3. `DM_Kho` (Danh sách kho công trường)
    4. `DM_VatTu` (Danh mục vật tư thi công)
    5. `DM_NhaCungCap_KhachHang` (Danh sách Nhà cung cấp/Thầu phụ/Chủ đầu tư)
    6. `DM_NguoiDung` (Danh sách nhân sự thực hiện Tạo/Duyệt phiếu)
    7. `DM_CongTrinh` (Thông tin công trình/dự án)
    8. `DM_WBS` (Phân rã hạng mục công việc WBS)
    9. `DM_DuToan` (Dự toán chi phí ngân sách theo WBS)
    10. Các sheet giao dịch phát sinh tương ứng với kịch bản UAT (`GD_Kho_NhapXuat`, `GD_ChiPhi`, `GD_TamUng`, `GD_HoanUng`).
*   **Có sửa code/schema/database không?**  
    *Trả lời:* **Không**. Toàn bộ cấu trúc hệ thống và cơ sở dữ liệu được giữ nguyên trạng.

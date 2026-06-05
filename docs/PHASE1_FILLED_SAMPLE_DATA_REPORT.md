# BÁO CÁO DỮ LIỆU TEST MÔ PHỎNG GIAI ĐOẠN 1

Thời gian tạo: **2026-06-05 14:46:35 +07:00**

## 1. Phạm vi và mục đích

- File Excel đã tạo: [`templates/PHASE1_ERP_IMPORT_TEMPLATE_DRAFT_FILLED_SAMPLE.xlsx`](../templates/PHASE1_ERP_IMPORT_TEMPLATE_DRAFT_FILLED_SAMPLE.xlsx)
- File nguồn được giữ nguyên: [`templates/PHASE1_ERP_IMPORT_TEMPLATE_DRAFT_REVIEW.xlsx`](../templates/PHASE1_ERP_IMPORT_TEMPLATE_DRAFT_REVIEW.xlsx)
- Đây là **DỮ LIỆU TEST MÔ PHỎNG THỰC TẾ**, không phải dữ liệu thật.
- File chỉ dùng để review nghiệp vụ, kiểm tra cấu trúc và chuẩn bị cho dry-run validator.
- File không được dùng để import, seed hoặc ghi dữ liệu vào database.

## 2. Số dòng đã điền

| STT | Sheet | Số dòng test | Nội dung chính |
| ---: | --- | ---: | --- |
| 1 | `DM_CongTy` | 1 | Một công ty test |
| 2 | `DM_ChiNhanh` | 1 | Chi nhánh Hà Nội test |
| 3 | `DM_NguoiDung` | 4 | Super Admin, kế toán trưởng, kế toán công nợ, chỉ huy trưởng |
| 4 | `DM_TaiKhoanKeToan` | 17 | Tài khoản kế toán tối thiểu và tài khoản 411 đối ứng số dư đầu kỳ |
| 5 | `DM_KyKeToan` | 12 | Năm 2026; kỳ 01-11 mở, kỳ 12 đóng để test validator |
| 6 | `DM_NhaCungCap_KhachHang` | 8 | Chủ đầu tư, NCC, thầu phụ, nhân công và máy thi công |
| 7 | `DM_CongTrinh` | 2 | Công trình Minh Khai và Nhà xưởng Hải Phòng |
| 8 | `DM_WBS` | 14 | Bảy WBS cho mỗi công trình |
| 9 | `DM_DuToan` | 28 | Hai nhóm chi phí dự toán trên mỗi WBS |
| 10 | `DM_HopDong` | 5 | Hai hợp đồng đầu ra, hai hợp đồng thầu phụ, một hợp đồng vật tư |
| 11 | `GD_HoaDon` | 4 | Hai hóa đơn đầu ra và hai hóa đơn đầu vào |
| 12 | `GD_HoaDonThue` | 4 | Thông tin thuế tương ứng bốn hóa đơn test |
| 13 | `GD_ThanhToan` | 2 | Một khoản thu chủ đầu tư và một khoản trả NCC |
| 14 | `GD_PhieuThuChi` | 1 | Phiếu chi tạm ứng bằng tiền mặt |
| 15 | `GD_ChiPhi` | 15 | Vật tư mua thẳng, nhân công, máy, thầu phụ và chi phí chung |
| 16 | `GD_TamUng` | 2 | Một tạm ứng nhân viên và một tạm ứng nhà cung cấp |
| 17 | `GD_HoanUng` | 1 | Hoàn ứng một phần, còn số dư theo dõi |
| 18 | `DM_VatTu` | 7 | Vật tư theo `MaterialItem`, không dùng `Material` legacy |
| 19 | `DM_Kho` | 2 | Kho Minh Khai và kho Hải Phòng |
| 20 | `GD_Kho_NhapXuat` | 22 | Nhập kho trước, xuất kho sau trên hai kho |
| 21 | `GD_ButToan_ThuCong` | 6 | Ba bút toán, mỗi bút toán gồm một dòng Nợ và một dòng Có |
|  | **Tổng** | **158** |  |

## 3. Kịch bản nghiệp vụ đã bao phủ

- Danh mục công ty, chi nhánh, người dùng, tài khoản và kỳ kế toán.
- Hai công trình dùng mã `MaDuAn` nội bộ Excel, mỗi công trình có WBS và dự toán riêng.
- Công trình Hải Phòng có chi phí trước VAT bằng khoảng **92,46%** tổng dự toán để test cảnh báo gần ngân sách.
- Hợp đồng đầu ra, hợp đồng thầu phụ và hợp đồng cung cấp vật tư.
- Hóa đơn đầu ra/đầu vào với VAT 8% hoặc 10%, kèm bản ghi hóa đơn thuế tương ứng.
- Thanh toán một phần cho hóa đơn đầu ra và đầu vào.
- Phiếu chi tiền mặt phục vụ tạm ứng.
- Chi phí trực tiếp theo WBS và loại chi phí, không dùng bút toán tay thay chứng từ nguồn.
- Tạm ứng nhân viên, tạm ứng nhà cung cấp và hoàn ứng một phần.
- Danh mục `MaterialItem`, nhập/xuất kho trên hai công trình.
- Bút toán thủ công chỉ gồm số dư đầu kỳ và điều chỉnh nhỏ.
- Không tạo sheet hoặc dữ liệu `Revenue` riêng.

## 4. Kết quả kiểm tra logic

| Kiểm tra | Kết quả | Ghi chú |
| --- | --- | --- |
| Mã công trình nhất quán | PASS | Tất cả project lookup dùng hai mã test đã khai báo trong `DM_CongTrinh`. |
| WBS thuộc đúng công trình | PASS | Mọi WBS/dự toán/hóa đơn/chi phí được đối chiếu theo cặp `MaDuAn + MaWBS`. |
| Tổng dự toán công trình | PASS | Tổng `DM_DuToan` bằng `TongDuToan` của từng công trình. |
| Chi phí không vượt dự toán | PASS | Kiểm tra theo WBS, loại chi phí và tổng công trình trên giá trị trước VAT. |
| Hóa đơn không vượt giá trị hợp đồng dự kiến | PASS | Không hóa đơn nào vượt giá trị dự kiến của công trình. |
| VAT hóa đơn | PASS | `TienTruocVAT + VATAmount = TongTien` cho toàn bộ hóa đơn. |
| Thanh toán không vượt hóa đơn | PASS | Tổng thanh toán theo số hóa đơn nhỏ hơn hoặc bằng tổng hóa đơn. |
| Hoàn ứng không vượt tạm ứng | PASS | Hoàn ứng 60 triệu trên tạm ứng 100 triệu; còn dư 40 triệu. |
| Xuất kho không vượt nhập kho | PASS | Kiểm tra theo ngày, kho và mã vật tư; không phát sinh tồn âm. |
| Bút toán Nợ/Có cân | PASS | Ba số chứng từ đều có tổng Nợ bằng tổng Có. |
| Trùng doanh thu với `Revenue` | PASS | Không có sheet/dòng `Revenue` riêng. |
| Dùng `Material` legacy | PASS | Không có sheet legacy; danh mục dùng `MaterialItem`. |

## 5. Kiểm tra kỹ thuật workbook

- Workbook có **27 sheet**, gồm 6 sheet quản trị và 21 sheet dữ liệu GĐ1.
- Có **32 file XML** OpenXML được parse thành công; số XML lỗi: **0**.
- Có **97 data validation/dropdown**, được giữ nguyên từ template nguồn.
- Tất cả 21 sheet dữ liệu giữ đủ các cột quản trị:
  - `TrangThaiMapping`
  - `CoImportKhong`
  - `CanXacNhanKhong`
  - `CanMoRongSchemaKhong`
  - `GhiChuRuiRo`
  - `NguonMapping`
  - `HuongDanNhap`
- Mỗi dòng đều ghi rõ là dữ liệu test mô phỏng và không dùng để import DB.
- Không có sheet `GD_DoanhThu`; không có sheet `Material` legacy.

## 6. Nội dung vẫn cần dry-run validator

- Mapping `MaDuAn -> Project.id` vì DB chưa có `Project.code` chính thức.
- Phân loại đối tác vì `LoaiDoiTac` chưa có field DB/API chuẩn.
- Lookup email người dùng, mã công ty, tài khoản, vật tư, kho, hợp đồng, hóa đơn và WBS sang ID thật.
- Kiểm tra enum theo đúng phiên bản schema/service tại thời điểm chạy dry-run.
- Kiểm tra kỳ kế toán mở/đóng bằng service thực tế, đặc biệt kỳ `2026-12` đang được đóng để test lỗi.
- Kiểm tra trùng `requestId`, số hóa đơn, số hợp đồng, số phiếu và số chứng từ.
- Kiểm tra rule posting để tránh ghi đôi giữa hóa đơn, thanh toán, phiếu thu chi, kho, chi phí và bút toán thủ công.
- Kiểm tra số dư tồn kho và công nợ trên dữ liệu DB tại thời điểm dry-run; logic trong file chỉ kiểm tra trong phạm vi bộ dữ liệu test.
- Kiểm tra phân bổ thanh toán, công nợ phải thu/phải trả và liên kết hợp đồng do template hiện chưa có đầy đủ mọi FK.

## 7. Xác nhận phạm vi

- Chưa import dữ liệu vào database.
- Chưa seed database.
- Chưa ghi database.
- Chưa viết import script.
- Chưa sửa schema.
- Chưa sửa UI.
- Chưa sửa code nghiệp vụ.
- File Excel gốc không bị ghi đè; SHA-256 của file gốc sau thao tác vẫn là `C540C922329BEEC9BD28BC1623E400DDF8990F0E3FD613F5AEE25D4AD5BF239C`.

## 8. Bước tiếp theo

1. Kế toán/chủ hệ thống review 21 sheet và xác nhận dữ liệu mô phỏng phản ánh đúng luồng mong muốn.
2. Ghi nhận các cột, enum, lookup hoặc chứng từ cần sửa trong mapping GĐ1.
3. Chốt đặc tả dry-run validator: chỉ đọc Excel, kiểm tra lỗi và xuất báo cáo; chưa ghi DB.
4. Chỉ xem xét import thật sau khi template cuối và dry-run validator được duyệt.

# PHASE 2: ACCOUNTING WORKFLOW DESIGN

## Mục tiêu
Thiết kế quy trình vòng đời chứng từ chuẩn mực, chống sai sót, đảm bảo nguyên tắc bất biến (Immutability) và phân quyền SoD (Segregation of Duties).

## 1. Vòng đời Hợp đồng (Contract Lifecycle)
* **DRAFT**: Đang nháp, có thể sửa/xóa thoải mái. Không phát sinh số liệu.
* **ACTIVE**: Đã ký, đang thực hiện. Bắt đầu nhận/phát hành Invoice và Payment. Không được sửa các điều khoản tài chính cốt lõi (phải dùng Phụ lục).
* **SUSPENDED**: Tạm dừng. Không cho phát sinh thêm Invoice/Payment mới.
* **COMPLETED**: Đã thanh lý, tất toán. Không phát sinh số liệu.
* **CANCELLED**: Hủy bỏ (trước khi Active).

## 2. Vòng đời Hóa đơn / Chứng từ (Invoice/Cost Lifecycle)
* **DRAFT**: Đang nhập liệu. Có thể sửa/xóa. Chưa ảnh hưởng công nợ/doanh thu.
* **SUBMITTED**: Đã trình duyệt. KHÔNG được sửa. Chờ cấp trên duyệt. (Chuyển về DRAFT nếu hủy trình).
* **APPROVED**: Đã duyệt (Bởi người khác người tạo - SoD). Sẵn sàng ghi sổ.
* **POSTED**: Đã ghi sổ cái. BẤT BIẾN (Immutable). Khóa hoàn toàn.
* **PAID / PARTIALLY PAID**: Đã thanh toán (có Payment tương ứng).
* **REJECTED**: Bị từ chối duyệt.
* **CANCELLED / REVERSED**: Đã hủy hoặc đảo bút toán (nếu đã Posted).

## 3. Vòng đời Thanh toán (Payment Lifecycle)
* **DRAFT**: Nháp phiếu thu/chi.
* **SUBMITTED**: Trình duyệt chi/thu.
* **APPROVED**: Kế toán trưởng/Giám đốc duyệt. (Chưa ghi sổ).
* **POSTED**: Đã chi/thu tiền thực tế, ghi sổ quỹ/ngân hàng. Immutable.
* **REVERSED**: Đảo bút toán nếu phát hiện sai sót sau khi Posted.

## 4. Vòng đời Tạm ứng (Advance Lifecycle) (Sprint sau)
* **DRAFT** -> **SUBMITTED** -> **APPROVED** -> **PAID** (Đã xuất tiền).
* **PARTIALLY SETTLED**: Đã đối trừ một phần với hóa đơn/chi phí.
* **FULLY SETTLED**: Đã hoàn ứng/đối trừ toàn bộ.
* **OVERDUE**: Quá hạn hoàn ứng.
* **REVERSED**: Hủy phiếu chi tạm ứng.

## 5. Vòng đời Công nợ (Debt Lifecycle) (Sprint sau)
Công nợ không phải là chứng từ đơn lẻ mà là trạng thái tổng hợp:
* **OPEN**: Mới phát sinh, chưa thanh toán/đối trừ.
* **PARTIAL**: Đã thanh toán một phần.
* **SETTLED**: Đã tất toán.
* **OVERDUE**: Quá hạn thanh toán theo điều khoản.
* **DISPUTED**: Đang tranh chấp.

## 6. Quy tắc Ghi sổ (Posting Rules)
* **Chỉ POSTED khi trạng thái là APPROVED**.
* **Hóa đơn bán ra (Invoice)**: Nợ 131 / Có 511, Có 3331 (VAT).
* **Hóa đơn mua vào (Cost)**: Nợ 621/622/627, Nợ 1331 (VAT) / Có 331.
* **Phiếu thu (AR Receipt)**: Nợ 111/112 / Có 131 (Chi tiết theo Invoice/Contract).
* **Phiếu chi (AP Payment)**: Nợ 331 / Có 111/112 (Chi tiết theo Vendor/Contract).
* **Giữ lại/Bảo hành**: Tách tỷ lệ % sang tài khoản 338.
* **Trường hợp đã Posted mà sai**: Tuyệt đối KHÔNG sửa/xóa `JournalEntry`. Phải tạo bút toán đỏ (Reversal) và ghi Log "Reversed by User X".

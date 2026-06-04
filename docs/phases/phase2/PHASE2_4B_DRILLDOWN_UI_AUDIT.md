# BÁO CÁO AUDIT UI/UX DRILL-DOWN HIỆN TRẠNG KẾ TOÁN ERP

## 1. Kết Quả Khảo Sát Toàn Diện Màn Hình Kế Toán

Dưới đây là bảng đánh giá chi tiết về các lỗ hổng (Gaps) trải nghiệm người dùng, tính liên kết chứng từ và kiểm soát an toàn hệ thống kế toán hiện tại:

| Màn hình | Hiện trạng | Thiếu gì | Rủi ro UX/Kế toán | Đề xuất giải pháp |
| -------- | ---------- | -------- | ----------------- | ----------------- |
| **Dashboard Kế Toán** | Đã hiển thị 4 KPI kế toán chính và danh sách chứng từ chờ duyệt. | Số tiền trên KPI hoàn toàn là text tĩnh, chưa hỗ trợ click để mở chi tiết hoặc drill-down. | Người dùng không thể kiểm chứng nguồn gốc số liệu tổng hợp (Receivable/Payable). | Hỗ trợ click vào từng KPI để mở panel truy vết dòng tiền (`FinancialTracePanel`). |
| **Revenue List / Report** | Hiển thị bảng danh sách các khoản thu doanh thu dự án. | Chưa hiển thị liên kết PaymentAllocation và bút toán Sổ cái (Journal Entry). | Kế toán khó đối chiếu thu tiền thực tế so với hóa đơn đã phát hành. | Bổ sung nút action "Xem truy vết" để mở sơ đồ nguồn gốc thanh toán. |
| **Debt / AR/AP Report** | Có bảng "Phải thu" và "Phải trả", có Modal lịch sử thanh toán. | Chưa thể hiện dòng phân bổ (`PaymentAllocation`) và chưa hiển thị Journal Entry phát sinh. | Rủi ro lệch số liệu do kế toán viên chỉ nhìn thấy số tổng hợp mà không thấy vết phân bổ cụ thể. | Tích hợp dòng phân bổ kế toán và các bút toán kép hạch toán bên trong Modal lịch sử. |
| **Contract Detail** | Chỉ là danh sách hoặc xem thông tin thô sơ. | Chưa có Tab/Section chuyên biệt để hiển thị dòng chảy tài chính (Contract → Invoice → Payment). | Không kiểm soát được tiến độ giải ngân và công nợ tồn đọng theo hợp đồng xây dựng. | Bổ sung Tab "Financial Trace" hiển thị toàn bộ vòng đời chứng từ của Hợp đồng. |
| **Invoice Detail / Modal** | Đã có Modal hiển thị lịch sử thanh toán hóa đơn. | Thiếu readonly mode cho hóa đơn đã thanh toán hoàn toàn hoặc POSTED; thiếu Audit Timeline. | Cho phép sửa đổi thông tin hóa đơn đã ghi sổ hạch toán, gây rủi ro sai sót kiểm toán nghiêm trọng. | Thêm Readonly Banner và vô hiệu hóa các trường tài chính của Invoice đã POSTED/PAID. |
| **Payment Detail / Modal** | Đã có modal thêm thanh toán (DRAFT). | Chưa hiển thị chi tiết dòng phân bổ (Allocation Lines) và Journal Entries tự động sinh ra. | Không đối chiếu được nghiệp vụ 1 thanh toán phân bổ cho nhiều hóa đơn. | Thiết kế bảng `AllocationLinesTable` và `JournalLinesTable` trực quan bên trong modal. |
| **Advance / Settlement** | Các màn hình danh sách tạm ứng đã hoạt động thô sơ. | Thiếu hoàn toàn Status Timeline trực quan và Audit Timeline chi tiết. | Khó theo dõi trạng thái tạm ứng vượt hạn hoặc lý do hoàn ứng bị từ chối. | Xây dựng component `DocumentStatusTimeline` và `AuditTimeline` đồng bộ cho tạm ứng. |
| **Financial Integrity** | Hiển thị trạng thái đồng bộ Sổ cái nhưng là panel tĩnh. | Chưa cho phép bấm vào từng chỉ số để hiển thị danh sách chứng từ gây lệch. | Kế toán trưởng không biết giao dịch nào gây lệch sổ để xử lý. | Hỗ trợ bấm "Xem chi tiết" mở rộng báo cáo đối chiếu. |
| **Ledger / Journal Report** | Hiển thị danh sách bút toán thô dạng bảng. | Chưa cho phép click ngược về chứng từ gốc (Invoice, Payment). | Mất thời gian tìm kiếm thủ công chứng từ khi có chênh lệch kế toán. | Cho phép bấm vào Journal Entry ID để mở panel truy vết chứng từ gốc. |

---

## 2. Các Chỉ Tiêu Kiểm Tra Nghiệp Vụ Chốt Chặn

* **Số tiền trên Dashboard có click được không?** -> *Chưa*. Cần thiết lập sự kiện onClick trên `EnterpriseMetric`.
* **Từ công nợ có drill-down về invoice/payment không?** -> *Đang ở mức hiển thị ID thô sơ*. Cần chuyển thành liên kết truy vết động.
* **Từ invoice có xem được payment allocations không?** -> *Chưa*. Chỉ hiển thị danh sách thanh toán phẳng.
* **Từ payment có xem được journal lines không?** -> *Chưa*. Bút toán Sổ cái hoàn toàn bị ẩn ở giao diện phụ.
* **Từ contract có xem được toàn bộ financial trace không?** -> *Chưa*. Chưa có điểm chạm trực quan nào trên giao diện hợp đồng.
* **Có audit timeline trên UI chưa?** -> *Chưa*.
* **Chứng từ POSTED có readonly mode chưa?** -> *Chưa*. Mới chỉ chặn ở API/Backend, UI vẫn hiển thị input cho phép gõ (dù khi lưu sẽ báo lỗi).
* **Có status timeline chưa?** -> *Chưa*.
* **Có loading/empty/error state chưa?** -> *Đã có empty state cơ bản, thiếu loading và error kiểm soát lỗi nghiêm ngặt*.
* **Có filter theo project/contract/company/status/period chưa?** -> *Đã có filter thô sơ ở một số bảng, chưa thống nhất*.
* **Có phân biệt posted/unposted/draft/pending không?** -> *Có badge phân biệt cơ bản, nhưng hành vi thao tác chưa phân cấp*.

---

## 3. Kết Luận & Định Hướng Cải Tiến
Sprint 2.4B sẽ khắc phục toàn bộ các khoảng trống này bằng cách xây dựng một bộ component dùng chung chuyên nghiệp, không làm ảnh hưởng đến cơ sở dữ liệu đã khóa của hệ thống Level 3.

# BÁO CÁO KIỂM TOÁN TÍNH TOÀN VẸN SỔ CÁI (PHASE 1 LEDGER TRUTH AUDIT)
**Vai trò:** Principal ERP Architect, Big4 Auditor

---

## 1. TÌNH TRẠNG KIẾN TRÚC HIỆN TẠI (CURRENT ARCHITECTURE)

Hệ thống ERP hiện đang bị mắc kẹt ở kiến trúc **"Operational-Driven Reporting"** ngụy trang dưới vỏ bọc Kế toán:
- **Tầng Giao dịch (Operational):** `Invoice`, `CostRecord`, `Payment`.
- **Tầng Kế toán (Ledger):** `JournalEntry`, `TransactionLine`, `LedgerAccount`.
- **Sự phân mảnh:**
  - `python-analytics.service.ts` và `app/api/dashboard/stats/route.ts` TỪ CHỐI kết nối với Tầng Kế Toán. Chúng tổng hợp số liệu Doanh Thu (Revenue) và Chi Phí (Cost) trực tiếp từ `Invoice.aggregate` và `CostRecord.aggregate`.
  - `app/api/reports/financial/route.ts` đọc từ Ledger (Tầng Kế toán) để ra bảng Cân đối (Trial Balance).

**HẬU QUẢ: MULTIPLE SOURCES OF TRUTH**
CFO đang nhìn thấy 2 con số Lợi Nhuận hoàn toàn khác nhau nếu hệ thống có phát sinh sai lệch hoặc Bút toán đảo (Reverse Journals).

---

## 2. REVERSAL DRIFT RISK (RỦI RO BÚT TOÁN ĐẢO)

**Phân tích `PostingEngine.reverseJournal`:**
Hàm này tạo ra một `JournalEntry` mới với các dòng `TransactionLine` Đảo ngược (Nợ thành Có, Có thành Nợ). Đây là cách làm chuẩn xác về mặt Immutable Ledger (Bất biến). 

**TUY NHIÊN (Lỗ hổng):**
Bởi vì Dashboard KPI đọc thẳng từ `Invoice`, mà hàm `reverseJournal` KHÔNG HỀ cập nhật lại `Invoice.status = 'CANCELED'`, dẫn đến Hóa đơn đó vẫn được `Invoice.aggregate` cộng vào Doanh thu trên Dashboard.
**=> Fake Profit sinh ra ngay khi Kế toán lập Bút toán đảo.**

---

## 3. THIẾU TÍNH NĂNG TRUY VẾT KẾ TOÁN (MISSING DRILL-DOWN)

**Audit UI Sổ cái:**
Tại `app/reports/page.tsx`, `Trial Balance` hiển thị số dư bằng HTML tĩnh: `<td>{formatVnd(row.balance)}</td>`.
- **CFO-Blind-Spot:** Khi CFO thắc mắc *"Tại sao chi phí 6210 tháng này lên tới 2 Tỷ?"*, họ KHÔNG THỂ click vào con số 2 Tỷ để xem cấu thành từ những Bút toán (Journal Entry) nào, và cũng không thể drill-down tiếp xuống hóa đơn gốc (Source Document). 
- Đây là tiêu chuẩn bắt buộc (Mandatory) của mọi ERP chuẩn (SAP, Odoo).

---

## 4. RỦI RO KẾT CHUYỂN CUỐI KỲ (CLOSING LOGIC)

- **Retained Earnings "Bay Hơi":** Sổ cái không hề có bút toán kết chuyển. Mã `3330-RE` (Lợi nhuận) được cộng tay bằng Code JS tại API.
- Lợi nhuận qua các năm tài chính sẽ bị mất vết (Không thể khóa vĩnh viễn) nếu không sinh ra Closing Journal.

---

## 5. ENTERPRISE MIGRATION ROADMAP (LỘ TRÌNH CODE PHASE 1)

Dựa trên kết quả Audit, đây là Roadmap tôi sẽ thực thi Code ở bước tiếp theo để đạt **Ledger Truth Foundation**:

1. **Sửa Tận Gốc KPI Engine (`calculateJSKpis`):** Thay vì `prisma.costRecord.aggregate`, tôi sẽ sửa thành `prisma.transactionLine.aggregate` lọc theo tài khoản `511%` và `62%`.
2. **Sửa PostingEngine (Vá Lỗ hổng VAT & Reversal):**
   - Sửa `postCost` để tách tiền VAT sang tài khoản `1331` thay vì gộp chung vào Chi phí.
   - Sửa `reverseJournal` để bắn cờ `isReversed=true` về bảng Operational gốc (Invoice/CostRecord) nhằm dập tắt "Reversal Drift".
3. **Mã Code Reconciliation:** Khai báo Endpoint `/api/reports/reconciliation` để chạy thuật toán trừ chéo (Ledger Balance minus Operational Total) phát hiện độ lệch.
4. **UX Drill-Down:** Xây dựng Modal Component trong `reports/page.tsx` cho phép click vào số tiền trên Sổ cái để liệt kê 100 giao dịch (Journal Lines) hình thành nên con số đó.

***Lưu ý: Báo cáo đã hoàn tất. Tôi không sửa một dòng code nào trước khi CFO (User) thẩm định tài liệu này.***

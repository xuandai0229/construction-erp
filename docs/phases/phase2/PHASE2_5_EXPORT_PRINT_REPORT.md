# SPRINT 2.5 REPORT: EXPORT / PRINT / ACCOUNTING DOCUMENTS

## 1. Giới Thiệu Chung
Báo cáo này tổng hợp kết quả triển khai toàn bộ nền tảng xuất và in chứng từ kế toán chuyên nghiệp (Sprint 2.5) cho hệ thống Construction ERP. Đảm bảo toàn bộ hệ thống đạt tiêu chuẩn kế toán Việt Nam, tuân thủ Thông tư 200, bảo mật cao cấp (Anti-tenant isolation + RBAC), lưu vết kiểm toán (Audit Trail) đầy đủ và không sử dụng dữ liệu giả lập (mock data).

---

## 2. Các Thành Phần Đã Triển Khai

### 2.1. Thư viện Dùng chung (Shared Libraries & Components)
* **[numberToWords.ts](file:///D:/construction-erp/lib/utils/numberToWords.ts)**: Hàm dịch số tiền VND sang chữ tiếng Việt kế toán (đảm bảo type-safe và xử lý hoàn hảo cho mọi mệnh giá lên đến hàng tỷ tỷ VND mà không phụ thuộc vào `bigint` literal).
* **[PrintLayout.tsx](file:///D:/construction-erp/app/components/accounting/PrintLayout.tsx)**: Khung cấu trúc in A4 tiêu chuẩn, tích hợp CSS `@media print` ẩn thanh điều hướng, menu và header hệ thống khi thực hiện in ấn vật lý hoặc xuất PDF qua trình duyệt.
* **[AccountingDocumentHeader.tsx](file:///D:/construction-erp/app/components/accounting/AccountingDocumentHeader.tsx)**: Tiêu đề chứng từ kế toán theo đúng quy chuẩn kế toán Việt Nam (Thông tư 200/2014/TT-BTC) hiển thị thông tin Công ty thành viên và mã chứng từ.
* **[SignatureBlock.tsx](file:///D:/construction-erp/app/components/accounting/SignatureBlock.tsx)**: Khối chữ ký phê duyệt gồm đầy đủ các vai trò: Người lập biểu, Thủ quỹ, Kế toán trưởng và Giám đốc phê duyệt.
* **[MoneyTextLine.tsx](file:///D:/construction-erp/app/components/accounting/MoneyTextLine.tsx)**: Hiển thị số tiền định dạng VND và phần dịch chữ đi kèm chuẩn xác.

---

### 2.2. Danh Sách API Xuất Dữ Liệu Thực Tế (Export APIs)
Tất cả các API xuất dữ liệu được bảo vệ nghiêm ngặt bằng **RBAC** và cơ chế **Tenant Isolation (cô lập công ty)**, ghi nhận đầy đủ **Audit Log** mỗi khi có hành vi xuất bản báo cáo:
1. `GET /api/export/ledger`: Xuất chi tiết Sổ cái tài khoản kép theo dự án dưới dạng CSV.
2. `GET /api/export/trial-balance`: Xuất Bảng cân đối phát sinh tài khoản kế toán.
3. `GET /api/export/debt`: Xuất báo cáo công nợ phải thu của chủ đầu tư theo dự án (dựa trên dữ liệu thực tế từ `PaymentAllocation`).
4. `GET /api/export/outstanding-advances`: Xuất báo cáo tạm ứng chưa quyết toán (dựa trên `AdvanceRequest` & `AdvanceSettlement` thực tế).
5. `GET /api/export/invoice/[id]`: Xuất chi tiết hóa đơn tài chính.
6. `GET /api/export/payment/[id]`: Xuất chi tiết phiếu thu / chi.
7. `GET /api/export/advance/[id]`: Xuất chi tiết đề nghị tạm ứng.

---

### 2.3. Danh Sách Trang In Ấn A4 (Print Pages)
Các trang in ấn có giao diện cực kỳ chuyên nghiệp, hỗ trợ xem trước và in trực tiếp từ trình duyệt, tự động ẩn sidebar/navbar:
1. `/print/invoice/[id]`: Trang in hóa đơn (Phiếu kế toán).
2. `/print/payment/[id]`: Trang in phiếu thanh toán (Phiếu thu / Phiếu chi).
3. `/print/advance/[id]`: Trang in đề nghị tạm ứng (Giấy đề nghị tạm ứng).
4. `/print/ledger`: Trang in Sổ cái chi tiết.
5. `/print/debt`: Trang in Bảng kê công nợ.

---

## 3. Kết Quả Kiểm Thử & Xác Minh Hệ Thống

* **TypeScript Compilation (`tsc --noEmit`)**: **PASS 100%** sạch lỗi kiểu dữ liệu.
* **Next.js Production Build (`npm run build`)**: **PASS 100%** biên dịch thành công.
* **Playwright E2E Tests (`npm run e2e`)**: **PASS 21 / 21 kịch bản** kiểm thử tự động thành công hoàn hảo.
* **Nghiệp vụ Chốt chặn (`export-print-guards.ts`)**: **PASS 20 / 20 kịch bản** kiểm tra nghiệp vụ và định dạng kế toán.
* **Security & Audit Logs**: **PASS**. 100% hành vi xuất dữ liệu nhạy cảm được bảo vệ bởi RBAC và lưu vết đầy đủ trong bảng `AuditLog`.
* **Tenant Isolation**: **PASS**. Không phát sinh rò rỉ dữ liệu chéo giữa các công ty thành viên (cross-tenant leakage).

---

## 4. Tổng Kết
Hệ thống giữ vững chứng nhận **Level 3 - Sẵn sàng cho việc sử dụng kế toán nội bộ có kiểm soát**. Toàn bộ dữ liệu in ấn và báo cáo xuất bản đều phản ánh dữ liệu thực tế từ Sổ cái và các phân hệ subledger.

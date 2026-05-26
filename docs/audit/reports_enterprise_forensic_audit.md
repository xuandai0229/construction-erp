# BIG4 FORENSIC AUDIT: ENTERPRISE REPORTING ARCHITECTURE
**Auditor Roles:** Principal ERP Architect, Big4 Financial Systems Auditor, SAP/Odoo/MISA Reporting Specialist
**Status:** Báo cáo Pháp y Độc lập (Chưa tiến hành Phase 2 Hardening)

Dựa trên yêu cầu khắt khe của quy trình kiểm toán chứng nhận ERP Enterprise-grade, dưới đây là biên bản kiểm toán pháp y toàn diện đối với phân hệ Báo cáo (Reports), Dashboard và luồng Dữ liệu Tài chính (Financial Aggregation).

---

## 1. FRONTEND REPORTING UI (RỦI RO GIAO DIỆN)

Phân tích mã nguồn tại `app/reports/page.tsx` và `app/components/Dashboard.tsx`:

- **Missing Virtualization (DOM Overload):** Thẻ `<table>` trong các tab `Trial Balance` và `VAT Summary` sử dụng phương thức render vòng lặp `map()` thô sơ (`financialData?.trialBalance.map(...)`). Với một dự án ERP có 5,000+ tài khoản/chứng từ, việc nhồi toàn bộ thẻ `<tr>` vào DOM sẽ gây ra hiện tượng **Browser Freeze** (đơ trình duyệt) và vắt kiệt CPU của Client.
- **CFO Blind Spots (Thiếu Drill-down):** CFO không thể truy xuất ngược (Traceability). Khi nhìn thấy `Tài khoản 621 - Chi phí nguyên vật liệu` có số dư `5 tỷ`, UI chỉ hiển thị text tĩnh. Hoàn toàn vắng bóng sự kiện `onClick` để bung ra chi tiết từng bút toán (Ledger Lines) cấu thành nên con số đó. (Cấp độ MISA/SAP: 100% tài khoản phải có cơ chế Drill-down tới tận Chứng từ gốc).
- **Sticky Totals (Thất bại UX Kế toán):** Dòng `TỔNG CỘNG ĐỐI SOÁT LEDGER` được đính ở dưới cùng của bảng (Dòng 365, `reports/page.tsx`). Khi CFO cuộn chuột qua 500 dòng tài khoản, tiêu đề cột và dòng Tổng sẽ biến mất khỏi tầm mắt, gây mất phương hướng tài chính (Eye-flow disruption).
- **Rerender Storms:** Việc sử dụng chung một state `financialData` cho 4 tab, kèm với việc thiếu `useMemo` bọc các bảng dữ liệu tĩnh khiến mỗi lần đổi Tab hoặc xuất Export, React sẽ render lại toàn bộ hàng nghìn DOM nodes.

---

## 2. API REPORTING LAYER (PHÂN TÍCH LUỒNG API)

- **Thành tựu (Phase 1):** Các điểm nghẽn rò rỉ dữ liệu (Tenant Leakage) tại `api/reports/financial/route.ts` và `api/analytics/route.ts` đã được vá thành công thông qua `assertAuthenticated()` và kiểm tra `companyId`.
- **Export Security (Lỗ hổng mới phát hiện):** 
  - Tại `reports/page.tsx`, hàm `handleExport()` tải toàn bộ dữ liệu CSV dựa trên state phía Client và sử dụng `exportToCsv`.
  - **Audit Log Evasion:** Việc xuất file PDF/CSV không được ghi lại chi tiết vào bảng Audit DB của Backend (chỉ gọi API `/api/monitoring/performance` để đếm số lượng). Một nhân sự có thể âm thầm xuất toàn bộ dữ liệu Tài chính dự án ra Excel, mang ra khỏi công ty mà System Admin không có bằng chứng pháp lý (Legal Traceability).
  - Thiếu Watermarking trên các bản xuất PDF.

---

## 3. SERVICES & AGGREGATION ENGINE (SCALABILITY & MEMORY)

- **Khắc phục (Phase 1):** Hàm `getProjectSnapshot` (Kẻ thù gây OOM) và `Dashboard Stats` đã được nâng cấp lên DB Aggregation (`prisma.costRecord.aggregate`).
- **Nợ Kỹ Thuật (OLAP Immaturity):** 
  - Hệ thống vẫn đang tính toán Trial Balance "On-the-fly" mỗi khi CFO bấm vào trang Báo cáo:
    ```typescript
    const lineAggregations = await prisma.transactionLine.groupBy({ by: ['accountId', 'type'], _sum: { amount: true } });
    ```
  - Mặc dù không làm sập RAM Node.js (vì đã dùng DB Aggregation), nhưng khi Sổ cái đạt **1 Triệu dòng (1M rows)**, lệnh `groupBy` liên tục trên bảng `TransactionLine` (OLTP) sẽ gây Lock Contention và thắt cổ chai CPU của PostgreSQL.
  - **Mô phỏng 1M Rows:** Response time dự kiến tăng vọt lên 4-8 giây. Hệ thống vẫn chưa có tư duy Data Warehouse (Materialized Views) hay Cronjob Snapshot chạy ban đêm như SAP/Oracle.

---

## 4. ACCOUNTING CONSISTENCY FORENSIC (KIỂM TOÁN TÍNH ĐỒNG NHẤT)

⚠️ **CẢNH BÁO ĐỎ (CRITICAL RED FLAGS): FAKE ACCOUNTING & REVERSAL DRIFT**

Đây là lỗ hổng nghiêm trọng nhất, có nguy cơ đưa CFO ra quyết định sai lầm.

- **Sự chia rẽ Nguồn Dữ Liệu (Multiple Sources of Truth):**
  - **Trial Balance / Balance Sheet:** Lấy từ `TransactionLine` (Sổ cái) -> **Đúng chuẩn Kế toán (Accounting Driven).**
  - **Dashboard KPIs (Lợi nhuận, Cashflow):** Lấy từ `Invoice` và `CostRecord` (Operational Tables) -> **Fake Accounting.**
- **Reversal Drift (Sai lệch bút toán đảo):** 
  - Khi một Kế toán phát hiện hóa đơn bị sai, họ lập một bút toán đảo (Reverse Journal) trên Sổ cái. Trial Balance lập tức tự cân đối trừ đi số tiền này.
  - TUY NHIÊN, Dashboard KPIs (Doanh thu, Lợi nhuận) trong `PythonAnalyticsService.calculateJSKpis` vẫn đang đọc bằng `prisma.invoice.aggregate({ _sum })`. Lệnh này **KHÔNG HỀ BIẾT** rằng bút toán đó đã bị đảo trên Sổ cái.
  - **Kết quả:** CFO nhìn vào Dashboard thấy Dự án Lãi 5 Tỷ, nhưng nhìn vào Balance Sheet (Lợi nhuận chưa phân phối) chỉ có 2 Tỷ.
- **Retained Earnings Fake Logic:** Tại `financial/route.ts` (Dòng 66), Lợi nhuận giữ lại được tính kiểu "Bay hơi" bằng cách lấy `Tổng Thu (Type=INCOME) - Tổng Chi (Type=EXPENSE)`. Thiếu hoàn toàn bút toán kết chuyển tự động cuối kỳ tài chính (Period Closing Journals).

---

## 5. AUDITABILITY & COMPLIANCE (TÍNH KIỂM TOÁN VÀ TUÂN THỦ)

- **Snapshot Integrity:** Thiếu khả năng tạo báo cáo tĩnh (Static Reports). Hệ thống báo cáo hiện tại mang tính "Động" (Realtime). Nếu hôm nay in Sổ Cái, ngày mai một nhân sự quá khứ sửa/xóa mềm (Soft Delete) một Hóa đơn (nếu có quyền lách), Sổ Cái ngày mai in lại sẽ ra số khác. (IFRS nghiêm cấm điều này sau khi chốt kỳ).
- **Missing Period Warnings:** UI không hề hiện cảnh báo *"Báo cáo này được kết xuất trong kỳ kế toán đang mở, số liệu có thể thay đổi"* cho CFO.

---

## 6. CFO VISIBILITY ANALYSIS (GÓC NHÌN TÀI CHÍNH)

- **Blind Spots:** 
  - Thiếu Báo cáo Dòng tiền gián tiếp (Indirect Cashflow Statement).
  - Không có cảnh báo thanh khoản (Liquidity Warnings). CFO không thấy được chỉ số "Khả năng thanh toán nhanh" ngay trên mặt Dashboard.
- **Aging Exposure:** Có Aging Report nhưng không liên kết với Hạn mức tín dụng (Credit Limit) của từng Khách hàng.

---

## 7. ENTERPRISE BI & OLAP MATURITY

**Đánh giá Cấp độ:** Khởi nghiệp (Startup CRUD) mới nâng cấp lên Aggregation.
So sánh trực diện:
- **SAP Business One / Odoo:** Có khối dữ liệu (Cube Architecture), mọi giao dịch ghi nhận vào bảng Fact Table định kỳ.
- **Hệ thống ERP hiện tại:** Hoàn toàn là một cấu trúc Transactional Database bị ép làm công việc Analytical. Thiếu vắng hoàn toàn PostgreSQL `MATERIALIZED VIEWS` hoặc Read-Replicas cho Reporting.

---

## 8. ROOT CAUSE ANALYSIS (NGUYÊN NHÂN GỐC RỄ)

**Tại sao hệ thống lại rơi vào tình trạng "Fake Accounting" và "Blind Spots"?**
1. **Rush-to-market Architecture:** Chạy đua phát triển tính năng UI/UX đẹp mắt (Dashboard, React hook) trước khi định hình vững chắc lõi Ledger Sổ cái kép.
2. **Ledger Bolt-on:** Cấu trúc kế toán (JournalEntry, TransactionLine) bị "gắn thêm" vào giai đoạn sau, khi mà các bảng Vận hành (Invoice, CostRecord) đã ăn sâu vào logic của Python Analytics và Dashboard Stats.
3. **ORM Illusion:** Sự tiện lợi của Prisma khiến đội ngũ Dev lười viết các câu lệnh SQL phức tạp (`JOIN` Ledger với Operational) để đối soát, dẫn đến thói quen "bảng nào dễ thì query bảng đó".

---

## 9. FINAL SCORING (THANG ĐIỂM BIG4)

Đánh giá nghiêm ngặt, không khoan nhượng:

- **Reporting Integrity:** 4/10 (Multiple sources of truth nghiêm trọng).
- **Ledger Consistency:** 3/10 (Dashboard KPIs hoàn toàn lệch với Ledger nếu có Reversal).
- **Auditability:** 5/10 (Có Period Lock nhưng thiếu Snapshot khóa vĩnh viễn).
- **Security:** 9/10 (API đã được khóa, nhưng Export Legal Log còn hở).
- **Scalability:** 6/10 (Aggregation DB giải quyết OOM, nhưng thiếu OLAP/Materialized Views sẽ chết ở 1M Rows).
- **OLAP Maturity:** 1/10 (Chưa tồn tại).
- **CFO Visibility:** 6/10 (UI đẹp nhưng thiếu Drill-down chí mạng).
- **UX (Table/Render):** 4/10 (Thiếu Virtualization, DOM Overload risk, no Sticky Totals).

**🌟 ENTERPRISE READINESS SCORE: 4.8 / 10.0**
*(Trạng thái: An toàn không sập, nhưng CFO không thể dùng để ra quyết định kiểm toán vì số liệu chênh lệch).*

---

## 10. ROADMAP RECOMMENDATIONS (BẮT BUỘC TRƯỚC KHI GOLIVE TÀI CHÍNH)

**PHASE 2: ENTERPRISE ACCOUNTING TRUTH (Sự thật Kế Toán)**
1. Lập tức **điều hướng toàn bộ API Dashboard & KPI** sang đọc dữ liệu trực tiếp từ bảng `TransactionLine` thay vì `Invoice/CostRecord`.
2. Xây dựng cơ chế **Reconciliation Warning Engine**: Báo động ngay lập tức nếu Tổng Nợ 131 (Ledger) lệch với Tổng Giá trị Invoice chưa thu (Operational).

**PHASE 3: OLAP & UX ENTERPRISE (Tăng tốc Cấp độ Tập đoàn)**
1. Viết các **PostgreSQL MATERIALIZED VIEWS** (`view_monthly_cashflow`, `view_trial_balance`) chạy Cronjob 15 phút/lần, dập tắt áp lực tính toán "on-the-fly".
2. Tái cấu trúc React Table tại `reports/page.tsx` sử dụng `@tanstack/react-virtual` để hỗ trợ hiển thị mượt mà Sổ cái 10,000 dòng.
3. Code tính năng **Drill-down Ledger**, biến các con số Sổ cái thành Hyperlink bật Modal xem Chứng từ gốc.

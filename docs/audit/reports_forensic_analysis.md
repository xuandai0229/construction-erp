# BÁO CÁO KIỂM TOÁN HỆ THỐNG REPORTS (FORENSIC ANALYSIS)
**Vai trò:** ERP Chief Architect, CFO Auditor, Big4 Financial Systems Auditor

Dưới đây là kết quả kiểm toán toàn diện module Reports, đánh giá từ kiến trúc luồng dữ liệu, tính nhất quán kế toán, rủi ro cơ sở dữ liệu cho đến mức độ trưởng thành Enterprise của hệ thống hiện tại.

---

## 1. CURRENT SYSTEM ARCHITECTURE
**Kiến trúc hiện tại của Reports:**
- **Mô hình xử lý:** Request-Response truyền thống qua Next.js App Router (`app/api/reports/*`).
- **Luồng dữ liệu (Data Flow):** 
  - Frontend gọi API với `projectId`.
  - API Routes gọi qua các Service (`FinancialAggregationService`, `ReportingService`).
  - Service sử dụng Prisma Client để query dữ liệu thô (raw data) từ PostgreSQL.
  - Hầu hết việc tổng hợp (Aggregation), map, reduce, filter đều diễn ra ở **Application Layer (Node.js/JS)** thay vì Database Layer.
- **Caching:** Có sử dụng bộ đệm (Caching) bằng một service tự viết (`CacheService`) với TTL ngắn (15-60s) lưu tại mem/redis.
- **Render UI:** Client-side rendering với React Query (`useReports.ts`). Tuy nhiên, bảng biểu không có Pagination, không có Virtualization. DOM có nguy cơ bị sập nếu lượng dữ liệu lớn.

## 2. REPORT FLOW ANALYSIS
**Phân mảnh nguồn dữ liệu giữa các Báo cáo:**
Hệ thống đang chịu rủi ro "Multiple Sources of Truth" (Đa nguồn sự thật).
- **Báo cáo Dòng tiền & Công nợ (Monthly & Aging):** Đọc trực tiếp từ **Operational Data** (`Invoice`, `CostRecord`, `Payment`).
- **Bảng Cân đối phát sinh (Trial Balance) & Bảng Cân đối kế toán (Balance Sheet):** Đọc từ **Ledger Data** (`JournalEntry`, `TransactionLine`).
- **Báo cáo VAT:** Đọc từ Operational Data (`CostRecord.vatAmount`).

**Hệ quả nguy hiểm:** Nếu CFO thực hiện các bút toán điều chỉnh tay (Manual Journal Entry) hoặc hủy bút toán (Reverse Journal), các báo cáo Operational (Aging, Dòng tiền) **KHÔNG THỂ** nhìn thấy sự điều chỉnh này. CFO sẽ nhìn thấy độ vênh giữa Dashboard và Bảng Cân đối Phát sinh.

## 3. KPI ANALYSIS
**Tình trạng KPI hiện tại:**
- **Gross Margin / Profit (Dashboard & Monthly P&L):** Đang lấy Revenue từ `Invoice` và Cost từ `CostRecord`. **LÀ FAKE/INCONSISTENT KPI** vì không đối soát với hạch toán kế toán (Accrual vs Cash basis đang lẫn lộn).
- **Aging Report (Tuổi nợ):** Tính đúng theo ngày đến hạn (dueDate), nhưng đang dùng logic vòng lặp trong JS để tính khoảng thời gian (Bucket), dễ bị sai lệch múi giờ (Timezone drifts).
- **Budget Utilization & Cost Overrun:** Tương đối đáng tin do tính tổng từ `FinancialAggregationService.getProjectSnapshot()`, có sự phân chia rõ ràng giữa `COST_ACT` (thực tế) và `COST_EXP` (phơi nhiễm/exposure).

## 4. CFO VISIBILITY REPORT
**Góc nhìn của CFO:**
- **Điểm mạnh:** Có cái nhìn tổng quan về rủi ro dự án (`riskScore`), Dashboard có cảnh báo Cost Overrun và Aging buckets. Có cơ chế khóa kỳ kế toán (Period Closing).
- **Điểm mù (Blind Spots):**
  - **Reconciliation (Đối soát):** Không có sự minh bạch trong việc đối soát giữa Sổ Cái (Ledger) và Operational (Invoices/Costs).
  - Khó nhận diện được giao dịch nào chưa được hạch toán (Unposted/Orphan transactions).
  - Không có cashflow dự phóng sâu (Forecast) dựa trên lịch thanh toán thực tế của Vendor, chỉ có dựa trên AR (phải thu).

## 5. ACCOUNTING CONSISTENCY REPORT
**Lỗ hổng kế toán (Accounting Loopholes):**
- **Reversed Journal vs Operational Records:** Khi gọi hàm `PostingEngine.reverseJournal`, hệ thống chỉ tạo bút toán đảo trong `JournalEntry`. Nó KHÔNG cập nhật lại trạng thái `status` của `CostRecord` hay `Invoice`. Do đó, doanh thu hoặc chi phí đó **vẫn hiển thị** trong Báo cáo tháng (Monthly P&L).
- **Hard Delete / Soft Delete Sync:** `Invoice` và `CostRecord` dùng `deletedAt` để soft-delete, nhưng nếu xóa sau khi đã hạch toán, Sổ Cái sẽ bị lệch (Orphan Journals) vì Sổ Cái không bị xóa tự động theo.
- Lợi nhuận gộp trong Bảng Cân Đối (Retained Profit) đang được cộng dồn (hardcode id `retained_profit`) chỉ dựa vào số dư các tài khoản INCOME và EXPENSE trong cùng API, không dựa trên bút toán kết chuyển lãi lỗ cuối kỳ chuẩn.

## 6. AUDITABILITY REPORT
**Khả năng truy vết & Kiểm toán:**
- Có cơ chế **Period Lock** tốt (ngăn chặn sửa đổi kỳ đã khóa) qua `AccountingGovernance`.
- Có Immutable Ledger (JournalEntry không cho xóa, phải Reverse).
- **Lỗ hổng Kiểm toán:** Log Audit (`AuditLog`) ghi nhận, nhưng dữ liệu tính toán báo cáo có tính trôi nổi (fly-calculation). Báo cáo không có "Snapshot locking", in báo cáo hôm nay và in ngày mai có thể ra 2 số khác nhau cho kỳ quá khứ nếu có dữ liệu bị thay đổi mà lọt qua Period Lock.

## 7. PERFORMANCE BOTTLENECK REPORT
**Rủi ro Sập Server / OOM (Out Of Memory):**
- **Heavy Client-Side / JS Node Aggregation:** Tại `app/api/reports/financial/route.ts` và `DashboardService`:
  ```javascript
  const costs = await prisma.costRecord.findMany({ where: { deletedAt: null } });
  const invoices = await prisma.invoice.findMany({ where: { deletedAt: null } });
  ```
  Hệ thống load **TOÀN BỘ** chứng từ của công ty vào bộ nhớ Node.js. Với ERP có >100,000 chứng từ, Server sẽ bị **Out Of Memory (OOM)** và crash ngay lập tức. Tính toán nợ quá hạn và WBS Tree hoàn toàn lặp bằng vòng lặp `for`.
- **Rerender Storms:** Frontend `app/reports/page.tsx` sử dụng mảng tĩnh để render bảng Cân đối không có Pagination/Virtualization.

## 8. DATABASE RISK REPORT
- **Full Table Scans:** Các query `findMany` không có `LIMIT` (take), không có Cursor Pagination. Cực kỳ nguy hiểm ở Scale lớn.
- **N+1 Queries:** Không phát hiện N+1 trực tiếp trong Prisma queries hiện tại (do dùng Promise.all và flatMap), nhưng lại dính **Overfetching** (Lấy toàn bộ cột, toàn bộ hàng chỉ để đếm hoặc tính tổng). Phải dùng `prisma.*.aggregate({ _sum })` ở mọi nơi.
- **Missing Indexes:** Các cột dùng để filter như `status`, `workflowStatus`, `approvalStatus` trong `CostRecord` và `Invoice` chưa có Index riêng biệt ngoài Index ghép cơ bản.

## 9. SECURITY RISK REPORT
- **Unauthorized Report Access (Nghiêm trọng):** Tại các API endpoints như `app/api/reports/financial/route.ts`, `monthly/route.ts`, không có bất kỳ bước kiểm tra Session/JWT nào.
  ```typescript
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: ...});
  // Trả về thẳng dữ liệu báo cáo tài chính
  ```
- **Tenant Leakage (Rò rỉ dữ liệu chéo công ty):** Bất kỳ ai có `projectId` đều có thể gọi API xem số liệu tài chính của dự án đó, kể cả không thuộc Company đó.
- Lộ điểm cuối API Export CSV. Dễ bị bot cào (scrape) sạch sổ cái.

## 10. UX/UI REPORTING ANALYSIS
- **Misleading Charts / Tables:** Thiết kế bảng Trial Balance và Balance Sheet đẹp mắt với Tailwind CSS nhưng thiếu **Sticky Header** và **Sticky Totals**. Khi cuộn trang, CFO bị mất dấu dòng tổng (CFO Eye-flow kém).
- Format tiền tệ (vnd) tốt, màu sắc có phân cấp (Đỏ = Cash Out, Xanh = Cash In).
- Tuy nhiên việc đặt các Tabs render lại toàn bộ bảng gây cảm giác giật lag nếu lượng row lớn.

## 11. ROOT CAUSE ANALYSIS
Nguyên nhân gốc rễ của những yếu kém trên:
1. **Kiến trúc vội vàng (Rush-to-market Architecture):** Lập trình viên không viết SQL/Database Views/Stored Procedures để xử lý Aggregation mà dùng ORM Prisma kéo dữ liệu về JS array để tính toán cho nhanh.
2. **Bolt-on Ledger:** Module kế toán (`PostingEngine`, `LedgerAccount`) được xây dựng sau, "đắp thêm" vào trên module Operational (Costs/Invoices) nhưng chưa đồng bộ luồng Reports để đọc 100% từ Ledger. Dẫn tới hiện tượng 2 sổ.

## 12. TECHNICAL DEBT ANALYSIS
- Hàng ngàn dòng code logic tính toán dồn vào các file JS/TS thay vì tận dụng khả năng của PostgreSQL (ví dụ: dùng `GROUP BY`, `SUM`, Materialized Views).
- Tái sử dụng code kém: Logic tính tổng Invoice, Cost lặp lại ở `DashboardService`, `FinancialAggregationService`, API Route tĩnh.

## 13. ENTERPRISE GAP ANALYSIS
**So sánh với SAP B1 / Odoo Enterprise:**
- **Đang mạnh ở đâu:** Tốc độ load (với data nhỏ) nhanh do dùng Next.js, UI đẹp mắt, trải nghiệm người dùng hiện đại, có khái niệm Period Lock và Immutable Ledger tốt hơn các hệ thống tự chế khác.
- **Đang thua ở đâu:**
  - Kém xa về OLAP (Online Analytical Processing). Odoo/SAP dùng Data Cube hoặc View riêng cho Report.
  - Không có tính năng Drill-down (Click vào số tổng trên Trial Balance để mở sổ chi tiết Ledger Account -> click tiếp ra Source Document).
  - Không có Data Warehouse (DW) architecture.
- **Thiếu gì để đạt Enterprise:**
  1. Materialized Views cho Report.
  2. Background Jobs để gen report thay vì tính Real-time cho kỳ đã đóng.
  3. Single Source of Truth (Phải hợp nhất Operational và Ledger reporting).

## 14. BEFORE HARDENING ERP SCORE
**Chấm điểm (Thang 10):**
- **Reporting Integrity:** 4/10 *(Rủi ro lệnh số giữa Ledger và Operation)*
- **CFO Visibility:** 7/10 *(Dashboard đầy đủ thông tin hữu ích)*
- **Auditability:** 6/10 *(Có Audit log, Period Lock nhưng thiếu Snapshot)*
- **Financial Accuracy:** 5/10 *(Nguy cơ sai số khi đảo bút toán)*
- **Performance:** 2/10 *(Chắc chắn sập khi vượt 50k bản ghi do tính toán in-memory)*
- **Scalability:** 2/10 *(Không có pagination/aggregate views)*
- **Security:** 1/10 *(Lỗ hổng API lộ dữ liệu tài chính)*
- **UX:** 8/10 *(Mượt mà, giao diện tốt với data nhỏ)*
- **Enterprise Maturity:** 4.5/10 *(Còn cách khá xa với chuẩn Big4 ERP)*

---
**TỔNG KẾT ĐIỀU NGUY HIỂM NHẤT:** 
1. **Bảo mật:** API không có Auth, ai cũng xem được số liệu tài chính.
2. **Hiệu năng:** `findMany` load toàn bộ DB vào RAM. Sẽ gây Crash server.
3. **Tính chính xác:** Lệch số liệu báo cáo nếu phát sinh Journal Reversal.

**ROADMAP HARDENING TỐT NHẤT:**
- **Phase 1 (Immediate):** Khóa ngay API Security (thêm User/Session auth, Tenant isolation check). Sửa đổi các API `findMany` thành `aggregate` hoặc thêm `take`/`skip`.
- **Phase 2 (Accuracy):** Cấu trúc lại `FinancialAggregationService` để đảm bảo Aging Report và Monthly Report phải trừ đi phần Reversals hoặc tham chiếu chéo với Ledger.
- **Phase 3 (Enterprise):** Tạo PostgreSQL Materialized Views cho Financial Summaries và Trial Balances. Thêm tính năng Report Snapshots để khóa cứng Báo cáo cuối tháng. Thêm Server-side pagination và Virtualization cho UI.

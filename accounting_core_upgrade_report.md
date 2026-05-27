# Accounting Core Upgrade Report

## Mục tiêu nâng cấp
- Chuẩn hóa nền tảng kế toán công trình quanh quan hệ: công trình, nhà cung cấp, hợp đồng, nghiệm thu, hóa đơn, tạm ứng/thanh toán, kế hoạch thanh toán, hồ sơ và cảnh báo.
- Đưa luồng chính về màn "Tổng hợp tạm ứng, thanh toán", đảm bảo dòng tiền có thể truy ngược về hợp đồng gốc.
- Tạm ẩn dashboard/insight chung khỏi menu chính, không xóa code để có thể khôi phục.

## File đã kiểm tra
- `AGENTS.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- `prisma/schema.prisma`
- `app/api/contracts/route.ts`
- `app/api/invoices/route.ts`
- `app/api/payments/route.ts`
- `app/api/payments/[id]/route.ts`
- `app/reports/page.tsx`
- `app/debt/page.tsx`
- `app/components/Dashboard.tsx`
- `app/components/Sidebar.tsx`
- `services/contract.service.ts`
- `services/revenue.service.ts`
- `lib/validations.ts`
- `lib/prisma.ts`

## Phần đã tạm ẩn khỏi luồng chính
- Ẩn menu `overview` khỏi sidebar.
- Root route `/` chuyển hướng sang `/accounting`.
- Các dashboard/AI/analytics cũ vẫn giữ nguyên code và route, nhưng không còn là điểm vào chính cho nghiệp vụ kế toán công trình.

## Model/database đã sửa hoặc đề xuất sửa
- Schema hiện tại đã có các model cốt lõi: `Supplier`, `ProjectSupplier`, `Acceptance`, `PaymentPlan`, `DocumentChecklist`.
- Đã chạy `npx prisma generate` để generated Prisma client nhận các model này.
- Chưa ép `Invoice.contractId` và `Payment.contractId` thành NOT NULL ở migration vì dữ liệu cũ có thể đang mồ côi. Thay vào đó API mới chặn chứng từ mới không có hợp đồng và service có audit phát hiện chứng từ cũ thiếu liên kết.
- Ràng buộc hiện có/được dùng:
  - `Supplier.code` unique.
  - `ProjectSupplier` unique theo `(projectId, supplierId)`.
  - `Contract` unique theo `(projectId, supplierId, contractCode)`.
  - `Acceptance` unique theo `(contractId, acceptanceNumber)`.

## Luồng dữ liệu mới
1. Chọn công trình.
2. Chọn hoặc tạo nhà cung cấp.
3. Gán nhà cung cấp vào công trình.
4. Tạo hợp đồng cho nhà cung cấp trong công trình.
5. Nhập nghiệm thu, hóa đơn, tạm ứng/thanh toán, kế hoạch thanh toán, hồ sơ checklist theo hợp đồng.
6. Click dòng hợp đồng hoặc dòng cảnh báo để mở chi tiết hợp đồng gốc.

## API đã thêm/sửa
- Thêm `app/api/accounting-core/route.ts`:
  - `GET action=workspace`
  - `GET action=project&projectId=...`
  - `GET action=contract&contractId=...`
  - `GET action=audit`
  - `POST action=createSupplier`
  - `POST action=linkSupplier`
  - `POST action=createContract`
  - `POST action=createAcceptance`
  - `POST action=createInvoice`
  - `POST action=createPayment`
  - `POST action=createPaymentPlan`
  - `POST action=createChecklistItem`
- Sửa `app/api/payments/[id]/route.ts` để xử lý an toàn payment không có `invoiceId`.
- Sửa `app/api/reports/audited-export/route.ts` để typecheck sạch với `MonthlyReportRow`.

## UI đã sửa/thêm
- Thêm `app/accounting/page.tsx`: màn nhập liệu "Tổng hợp tạm ứng, thanh toán".
- Thêm `app/accounting/contracts/[id]/page.tsx`: màn chi tiết hợp đồng.
- Sửa `app/components/Sidebar.tsx`: thêm menu "Kế toán công trình", tạm ẩn tổng quan khỏi menu chính.
- Sửa `app/page.tsx`: chuyển hướng `/` sang `/accounting`.

## Rule cảnh báo offline đã thêm
- Tổng nghiệm thu vượt giá trị hợp đồng.
- Tổng hóa đơn vượt tổng nghiệm thu.
- Tổng thanh toán vượt tổng nghiệm thu.
- Tổng thanh toán vượt tổng hóa đơn.
- Thanh toán khi chưa có hóa đơn.
- Thanh toán khi chưa có nghiệm thu.
- Công nợ âm bất thường.
- Hợp đồng thiếu hồ sơ.
- Kế hoạch thanh toán đến hạn hoặc quá hạn.
- Hóa đơn/thanh toán cũ không liên kết được hợp đồng.
- Hợp đồng cũ thiếu nhà cung cấp hoặc mã hợp đồng.

Mỗi cảnh báo trả về: mức độ `RED/YELLOW/GREEN`, lý do, số tiền liên quan, loại chứng từ, id chứng từ, link hợp đồng nếu có, trạng thái xử lý mặc định `NEW`.

## Báo cáo đã thêm
Nguồn báo cáo được chuẩn hóa trong `ConstructionAccountingService.buildReports()`:
- Tổng hợp tạm ứng/thanh toán theo nhà cung cấp.
- Công nợ phải trả theo nhà cung cấp.
- Công nợ phải trả theo công trình.
- Công nợ theo hợp đồng.
- Nghiệm thu theo hợp đồng.
- Hóa đơn theo hợp đồng.
- Thanh toán theo hợp đồng.
- Hợp đồng vượt giá trị.
- Hồ sơ còn thiếu.
- Kế hoạch thanh toán.
- Quá hạn thanh toán.
- Tổng hợp theo công trình.
- Chi tiết nhà cung cấp qua nhiều công trình.
- Chi tiết công trình qua nhiều nhà cung cấp.

Màn `/accounting` có xuất CSV offline từ dữ liệu báo cáo hợp đồng.

## Công thức tính công nợ
- `totalAcceptance = sum(Acceptance.amount)`
- `totalInvoice = sum(Invoice.amount)`
- `totalPayment = sum(Payment.amount)`
- `payableBase = min(totalAcceptance, totalInvoice)`
- `debt = payableBase - totalPayment`

Lý do: công nợ phải trả hợp lệ cần có cả nghiệm thu và hóa đơn; nếu thiếu một trong hai, rule engine phát cảnh báo để kế toán xử lý chứng từ.

## Công thức đối chiếu
- Nghiệm thu vượt hợp đồng: `totalAcceptance > contract.currentValue`.
- Hóa đơn vượt nghiệm thu: `totalInvoice > totalAcceptance`.
- Thanh toán vượt nghiệm thu: `totalPayment > totalAcceptance`.
- Thanh toán vượt hóa đơn: `totalPayment > totalInvoice`.
- Công nợ âm: `debt < 0`.
- Kế hoạch đến hạn/quá hạn: so sánh `PaymentPlan.dueDate` với ngày hiện tại và tổng đã thanh toán của hợp đồng.

## Test đã chạy
- `npx prisma generate`: pass sau khi dừng dev server đang khóa Prisma engine.
- `npx tsc --noEmit`: pass.
- `npx eslint app/accounting/page.tsx app/accounting/contracts/[id]/page.tsx services/construction-accounting.service.ts app/api/accounting-core/route.ts`: pass.
- `npm run build`: pass khi cung cấp `SESSION_SECRET` và `INTERNAL_SYSTEM_TOKEN` tạm thời cho process build.
- `npx tsx tests/integration/ledger.test.ts`: không chạy được như test runner vì file dùng `describe` nhưng không có Jest/Vitest runtime.

## Kết quả test
- TypeScript sạch.
- Build production thành công.
- Build còn warning sẵn có của Turbopack/NFT do Prisma generated client trong import trace.
- Lint toàn repo chưa sạch vì nhiều lỗi cũ ngoài phạm vi, chủ yếu `no-explicit-any`, unused vars và require style ở các module hiện hữu.

## Lỗi còn tồn tại
- `Invoice.contractId` và `Payment.contractId` vẫn nullable ở database để tránh làm migration hỏng dữ liệu cũ; cần audit dữ liệu thật trước khi ép NOT NULL.
- API cũ `/api/invoices` và `/api/payments` vẫn cho luồng doanh thu cũ; nghiệp vụ kế toán công trình mới nên dùng `/api/accounting-core`.
- Một số text tiếng Việt cũ trong app đang mojibake do encoding lịch sử.
- Chưa có lưu trạng thái xử lý cảnh báo vào database; hiện rule engine trả trạng thái mặc định `NEW`.
- Chưa triển khai PDF export riêng cho bộ báo cáo kế toán công trình.

## Việc cần làm tiếp theo
- Chạy audit trên database thật và xử lý danh sách chứng từ thiếu `contractId`.
- Sau khi dữ liệu sạch, tạo migration an toàn để ép `Invoice.contractId`, `Payment.contractId`, `Contract.supplierId`, `Contract.contractCode` thành bắt buộc.
- Tách `Warning/AuditIssue` thành bảng lưu trạng thái xử lý và lý do bỏ qua.
- Nối bộ báo cáo kế toán mới vào trang `/reports` hoặc tách `/accounting/reports`.
- Chuẩn bị đóng gói offline bằng Electron/Tauri + database local. Hiện app vẫn có cấu hình Supabase/Redis/AI route cũ, nhưng luồng kế toán mới không gọi API ngoài.

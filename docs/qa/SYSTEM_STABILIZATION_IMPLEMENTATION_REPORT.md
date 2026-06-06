# SYSTEM STABILIZATION IMPLEMENTATION REPORT

Ngày thực hiện: 2026-06-06

## 1. Đã sửa những gì

### Auth/session để CRUD sống

- Sửa `store/erpStore.ts` để khi app khởi tạo trong dev/test, client gọi `/api/auth/session` và nhận cookie `erp-session`; không chỉ set admin client-side.
- Sửa `app/api/auth/session/route.ts` để ưu tiên user `SUPER_ADMIN`/`ADMIN` có `companyId`; nếu chưa có admin gắn công ty thì tạo user quản trị phát triển gắn với công ty hiện có. Route vẫn bị chặn trong production.

### Ngữ cảnh công trình

- Thêm `app/components/workspace/ProjectContextBar.tsx`.
- Gắn context bar vào:
  - `app/wbs/WBSListScreen.tsx`
  - `app/budget/page.tsx`
  - `app/costs/page.tsx`
  - `app/revenue/page.tsx`
  - `app/debt/page.tsx`
- Bar hiển thị mã công trình, tên công trình, chủ đầu tư, loại công trình, trạng thái, giá trị hợp đồng, tổng dự toán, tổng chi phí, công nợ phải thu, lãi/lỗ.

### CRUD chính

- Công trình:
  - Sửa `services/project.service.ts` để audit log không tự khóa xóa/lưu trữ công trình sạch.
  - Việt hóa message delete/not found ở `app/api/projects/[id]/route.ts`.
  - Sửa `app/components/projects/ProjectTable.tsx`: thêm giá trị hợp đồng, sửa confirm từ “xóa vĩnh viễn” sang “lưu trữ/xóa hồ sơ chưa phát sinh”.
- WBS:
  - Việt hóa lỗi not found ở `app/api/wbs/[id]/route.ts`.
  - Thêm action xóa WBS có confirm ở `app/wbs/WBSListScreen.tsx`; backend service vẫn chặn nếu có WBS con/dự toán/chi phí phát sinh.
- Dự toán:
  - Việt hóa lỗi not found ở `app/api/budgets/[id]/route.ts`.
  - Việt hóa fallback error trong `services/queries/useBudgets.ts`.
- Chi phí:
  - Sửa lỗi `CostService.update` trong `services/cost.service.ts`: trước đây sửa `amount` giữ `netAmount/vatAmount` cũ, vi phạm check constraint `cost_amount_equals_net_plus_vat`; hiện đã tính lại net/VAT/retention theo amount/vatRate/retentionRate.
  - Sửa optimistic locking update chi phí từ `update({ where: { id, version } })` sang `updateMany` có điều kiện `id/version/deletedAt`, sau đó đọc lại record.
  - Việt hóa fallback error trong query/API client.
- Doanh thu:
  - Thêm `DELETE /api/revenues/[id]` cho doanh thu thủ công, chặn doanh thu gắn hóa đơn.
  - Thêm `deleteRevenue` ở `services/api/revenue.api.ts` và `useDeleteRevenueMutation` ở `services/queries/useRevenues.ts`.
  - Thêm nút xóa doanh thu thủ công trên `app/revenue/page.tsx`.

### Cache/refetch sau CRUD

- Mở rộng invalidate query cho cost/revenue/invoice/payment/debt/project stats trong:
  - `services/queries/useCosts.ts`
  - `services/queries/useRevenues.ts`
  - `services/queries/useDebts.ts`
  - `services/queries/useWBS.ts`
  - `services/queries/useBudgets.ts`

### UI/tiếng Việt/format tiền

- Sửa `app/components/dashboard-data.ts` để `formatVnd`, `formatShortVnd`, `formatKpiValue` dùng hậu tố `đ`.
- Sửa một số chuỗi người dùng dễ thấy:
  - `N/A` trong chi phí thành “Chưa xác định”.
  - `Cost Record` trong tiêu đề chi phí thành tiếng Việt.
  - Fallback `Failed to fetch...`, `API Error...` ở các hook/API client chính thành tiếng Việt.

## 2. Lỗi nào đã hết

- CRUD công trình không còn bị kẹt vì client có admin nhưng API thiếu session trong dev/test.
- Công trình sạch tạo mới có thể sửa và xóa/lưu trữ; audit log không tự làm delete fail.
- WBS có đủ thêm/sửa/xóa qua UI/API.
- Dự toán create/update/delete qua API pass.
- Chi phí create/update/delete qua API pass; lỗi update amount vi phạm constraint net/VAT đã hết.
- Doanh thu thủ công create/update/delete qua API pass.
- Màn hình WBS/Budget/Costs/Revenue/Debt không còn mất ngữ cảnh công trình.
- Format tiền chính hiển thị dạng `5.000.000 đ`.

## 3. Lỗi nào còn lại

- `npm run lint` vẫn fail toàn repo: 801 errors, 253 warnings. Chủ yếu là legacy `any`, unused vars, hook lint ở `cash-bank`, require import, `@ts-nocheck`. Phạm vi quá rộng để sửa an toàn trong phase “app sống”.
- Hóa đơn/thanh toán chưa smoke create/delete trọn vòng vì rule nghiệp vụ đang chặn tạo hóa đơn khi khối lượng nghiệm thu được duyệt là `0 đ`: `3-WAY MATCH ERROR (Billing)`. Đây là kiểm soát đúng, cần dữ liệu nghiệm thu/hợp đồng phù hợp để test.
- Một số module ngoài phạm vi chính vẫn còn text tiếng Anh/user-facing: cash-bank, tax, system, print pages, một số report API.
- Dashboard còn warning build từ Turbopack NFT trace ở `app/api/reports/audited-export/route.ts` và deprecation `url.parse()`.
- Chưa sửa toàn bộ native `alert/confirm` sang toast/modal chuẩn; đã thêm confirm modal cho WBS và giữ một số native confirm ở Costs/Revenue do scope.

## 4. Kết quả lệnh kiểm tra

- `git status --short --branch`: ban đầu ở `main`, có nhiều file docs/templates chưa track sẵn; không ghi đè.
- `npx tsc --noEmit`: PASS trước và sau sửa.
- `npm run build`: PASS sau sửa. Còn warning Turbopack NFT trace và deprecation `url.parse()`.
- `npx prisma validate`: PASS.
- `npx prisma migrate status`: PASS, 12 migrations, database schema up to date.
- `npm run validation:check`: PASS, 12/13 checks pass, warning Playwright browsers có thể cần install.
- `npm run audit:check`: PASS; không phát hiện orphan cost/invoice WBS, overpaid invoice, negative cost, unbalanced journal trong dữ liệu hiện tại.
- `npm run lint`: FAIL; 801 errors, 253 warnings, là nợ kỹ thuật toàn repo chưa xử lý trong phase này.

## 5. Smoke test đã chạy

- Health: `GET /api/health` trả 200.
- Session: `POST /api/auth/session` trả success và set cookie.
- Công trình:
  - `GET /api/projects`: pass.
  - `POST /api/projects`: pass.
  - `PUT /api/projects/:id`: pass.
  - `DELETE /api/projects/:id`: pass; bản ghi test đã được xóa/lưu trữ.
- WBS:
  - `POST /api/wbs`: pass.
  - `PUT /api/wbs/:id`: pass.
  - `DELETE /api/wbs/:id`: pass.
- Dự toán/Chi phí:
  - Tạo WBS test.
  - `POST/PUT/DELETE /api/budgets`: pass.
  - `POST/PUT/DELETE /api/costs`: pass.
  - Xóa WBS test: pass.
- Doanh thu:
  - Tạo WBS test.
  - `POST/PUT/DELETE /api/revenues`: pass.
  - Xóa WBS test: pass.
- Hóa đơn:
  - `POST /api/invoices` bị chặn đúng bởi rule nghiệm thu: lũy kế yêu cầu thanh toán vượt khối lượng nghiệm thu được duyệt `0 đ`.

## 6. Hướng dẫn test nhanh cho người dùng

1. Mở Dashboard `/`.
   - Kỳ vọng: app vào được, không bị lỗi session/API 401.
2. Mở `Công trình`.
   - Chọn một công trình, kiểm tra bảng có chủ đầu tư, giá trị hợp đồng, ngân sách, thực chi, trạng thái.
3. Thêm công trình test.
   - Nhập tên, chủ đầu tư, giá trị hợp đồng, dự toán.
   - Kỳ vọng: lưu được, danh sách tự cập nhật.
4. Sửa công trình test.
   - Kỳ vọng: lưu được, không cần F5.
5. Xóa/lưu trữ công trình test chưa phát sinh.
   - Kỳ vọng: confirm tiếng Việt, xóa/lưu trữ thành công.
6. Chọn một công trình thật/sandbox rồi mở WBS, Dự toán, Chi phí, Doanh thu, Công nợ.
   - Kỳ vọng: luôn thấy thanh ngữ cảnh công trình ngay dưới header.
7. Tạo/sửa/xóa WBS test chưa phát sinh.
   - Kỳ vọng: thao tác được; nếu đã phát sinh liên quan, hệ thống báo lý do không cho xóa.
8. Tạo/sửa/xóa dự toán hoặc chi phí test trên WBS test.
   - Kỳ vọng: bảng cập nhật không cần F5, số tiền hiển thị `đ`.
9. Tạo/sửa/xóa doanh thu thủ công test.
   - Kỳ vọng: doanh thu gắn hóa đơn không cho xóa trực tiếp; doanh thu thủ công xóa được.
10. Nếu tạo hóa đơn bị chặn bởi 3-way match.
   - Kiểm tra dữ liệu nghiệm thu/khối lượng được duyệt trước; không nhập dữ liệu giả để vượt kiểm soát.

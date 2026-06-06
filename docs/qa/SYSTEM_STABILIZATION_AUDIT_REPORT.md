# SYSTEM STABILIZATION AUDIT REPORT

Ngày audit: 2026-06-06  
Phạm vi: audit read-only trước khi sửa code, tập trung app ERP/kế toán xây dựng để chuẩn bị nhập dữ liệu thật.

## 1. Tóm tắt tình trạng hệ thống

- App build được: `npm run build` pass khi chạy ngoài sandbox. Trong sandbox fail do EPERM khi ghi `.next/trace-build`, không phải lỗi code.
- TypeScript pass: `npx tsc --noEmit` pass.
- Database ổn ở mức schema/migration: `npx prisma validate` pass, `npx prisma migrate status` pass, database `construction_erp` đồng bộ 12 migration.
- CRUD chưa đáng tin hoàn toàn: API có validation, RBAC, soft delete/audit ở nhiều module; tuy nhiên UI tự set admin nội bộ trong Zustand nhưng API lại cần `erp-session` hoặc `ALLOW_INTERNAL_ADMIN_BYPASS=true`. `.env` hiện chưa bật bypass, nên người dùng có thể vào UI nhưng CRUD/API trả 401 nếu chưa bootstrap session.
- UI/UX có nền tảng enterprise table/modal, nhưng nhiều màn hình thiếu context công trình đầy đủ, bảng dùng min-width lớn gây scroll ngang, modal/form còn rườm rà, một số action dùng `alert/confirm` native thay vì toast/modal thống nhất.
- Logic tính toán đã có `FinancialAggregationService`/canonical source, nhưng một số màn hình vẫn tính lại bằng `Number`/`Math.round` phía client và `formatVnd` chưa thêm ký hiệu `đ`.
- Tiếng Việt chưa đủ 100%: còn các chuỗi người dùng có thể thấy như `Failed to fetch ...`, `Project deleted successfully`, `WBS item not found.`, `Budget item not found.`, `API Error`, `N/A`, `Cost Record`, `CSV`, `Construction ERP`, `Enterprise Operating System`, một số lỗi API báo tiếng Anh.
- Dashboard hiện gọi API báo cáo quản trị, không thấy mock KPI chính. Tuy nhiên nếu API fail thì UI trả `null`/`[]` âm thầm, dễ che lỗi thật.

## 2. Kết quả kiểm tra theo từng nhóm

### Source/build/runtime

- `git status --short --branch`: nhánh `main`.
- File chưa track ban đầu:
  - `docs/qa/EXISTING_EXCEL_TEMPLATE_INVENTORY_REPORT.md`
  - `docs/qa/REAL_TEST_DATA_INPUT_AUDIT_REPORT.md`
  - `docs/qa/REAL_TEST_DATA_INPUT_AUDIT_REPORT_EVIDENCE.md`
  - `docs/qa/REAL_TEST_DATA_INPUT_CLEAN_CHECKLIST.md`
  - `docs/qa/UAT_REAL_DATA_INPUT_WORKING_GUIDE.md`
  - `templates/UAT_REAL_DATA_INPUT_WORKING.xlsx`
- Không ghi đè các file trên.
- Next.js version: `16.2.4`; đã đọc `node_modules/next/dist/docs/index.md`. App dùng App Router.
- `npx tsc --noEmit`: pass.
- `npm run lint`: fail 800 errors, 252 warnings. Chủ yếu `@typescript-eslint/no-explicit-any`, unused vars, `react-hooks/set-state-in-effect`, `require()` import, `@ts-nocheck`.
- `npm run build`: pass khi escalated. Warning Turbopack: route `app/api/reports/audited-export/route.ts` trace cả project qua `generated/prisma-client/index.js` và `next.config.ts`; có deprecation `url.parse()`.
- `npm run validation:check`: pass khi escalated, cảnh báo Playwright browser có thể cần install.

### Database

- `npx prisma validate`: pass.
- `npx prisma migrate status`: pass khi escalated; 12 migrations, schema up to date.
- `npm run audit:check`: pass ở dữ liệu hiện tại:
  - projects 4, WBS 11, budgets 8, costs 3, invoices 1, revenues 1, journalEntries 1, transactionLines 4.
  - `badInvoiceRemainingAmount=0`, `overpaidInvoices=0`, `negativeCosts=0`, `unbalancedJournalEntries=0`, `orphanCostWbs=0`, `orphanInvoiceWbs=0`.
- Rủi ro còn lại: audit script chỉ kiểm một phần. Chưa có smoke CRUD thật với bản ghi sandbox vì phải sửa session trước để tránh thao tác 401.

### CRUD

- Công trình: API có create/update/delete, delete đã chặn khi có dữ liệu liên quan và soft delete/audit. UI có add/edit/delete/archive nhưng lỗi session có thể làm fail 401. Delete success message còn tiếng Anh.
- WBS/Hạng mục: API có GET/POST/PUT/DELETE và service chặn ràng buộc. UI chỉ có sửa/thêm con; chưa thấy delete action trên màn hình WBS. Lỗi not found còn tiếng Anh.
- Dự toán/Budget: API có GET/POST/PUT/DELETE/import. UI có add/edit/delete/import/export, nhưng POST tự đọc cookie `erp-session`; nếu không có session sẽ fail. Delete dùng modal confirm nhưng lỗi dùng `alert`.
- Chi phí/Costs: API có CRUD và payment. UI có add/edit/delete, invalidate costs/WBS/project detail nhưng chưa invalidate dashboard/reports/debt đầy đủ. Delete dùng `window.confirm`/`alert`, chưa toast chuẩn.
- Doanh thu/Hóa đơn/Thanh toán: API có revenues, invoices, payments. Revenue page có create/toggle paid nhưng không có edit/delete revenue rõ ràng. Debt page delete invoice chỉ invalidate `debts.receivables`, không invalidate `invoices.byProject`, `payments`, dashboard.
- Công nợ: tính từ invoices/costs, có modal thu tiền/chi tiền. Delete invoice chỉ cho khi paidAmount = 0, nhưng UI cần báo lỗi tiếng Việt rõ hơn nếu API chặn.
- Nhà cung cấp/Hợp đồng/Tạm ứng/Phê duyệt/Báo cáo: có API/services/pages rải rác, chưa smoke hết được trong phase audit. Cần ưu tiên sau khi session CRUD chính ổn.

### Logic tính toán

- Có canonical financial aggregation cho project summary trong service.
- Client vẫn tự tính VAT/retention/doanh thu bằng `Number` và `Math.round`; phù hợp hiển thị tạm nhưng chưa phải nguồn sự thật kế toán.
- Dashboard dùng API quản trị, không thấy mock KPI trực tiếp; nhưng query swallow lỗi bằng `json.success ? data : null/[]`.
- `formatVnd` đang trả `5.000.000.000` thay vì `5.000.000.000 đ`; `formatShortVnd` có dấu `₫` nhưng output terminal cho thấy có nguy cơ encoding/không thống nhất.

### UI/UX

- Có `EnterpriseDataTable` dùng `table-fixed`, `colgroup`, sticky header/footer, overflow-x.
- Nhiều bảng đặt `minWidth` lớn: WBS 1420px, Budget 1360px, Costs 1800px, Revenue 1480px. Trên laptop sẽ có scroll ngang; chấp nhận được cho nghiệp vụ dày dữ liệu nhưng cần context bar sticky và column sizing tốt hơn.
- Action menu có nguy cơ bị cắt trong container `overflow-x-auto overflow-y-hidden` nếu không portal hóa toàn bộ menu.
- Form/modal thêm/sửa còn nhiều thao tác và native alert/confirm; chưa đồng bộ toast/loading/error state.
- Project context hiện chỉ có `ProjectSwitcher` ở shell/sidebar/header tùy layout, chưa có sticky context bar hiển thị mã, tên, chủ đầu tư, trạng thái, giá trị hợp đồng, dự toán, chi phí, công nợ trên từng màn hình nghiệp vụ.

### Tiếng Việt

- Phần lớn label chính đã tiếng Việt.
- Còn tiếng Anh trong UI/API/helper: `Failed to fetch projects/WBS/budgets/costs/revenues/invoices/payments`, `Project deleted successfully`, `WBS item not found.`, `Budget item not found.`, `API Error`, `N/A`, `Cost Record`, `CSV`, `Construction ERP`, `Enterprise Operating System`, `SESSION_SECRET must be configured...`, `Unauthorized`, `User does not belong...`, các route report period-closing/ledger-lines.
- Một số chuỗi tiếng Anh là log/dev comment, không bắt buộc nếu không hiển thị. Nhưng API error có thể hiện ra UI nên cần Việt hóa.

### Ngữ cảnh công trình

- `currentProjectId` lưu trong Zustand/localStorage.
- `ProjectSwitcher` chỉ hiển thị tên và 8 ký tự ID, không hiển thị chủ đầu tư/trạng thái/giá trị hợp đồng/dự toán/chi phí/công nợ.
- WBS/Budget/Costs/Revenue/Debt/Reports không có project context bar nghiệp vụ riêng. Người dùng dễ mất ngữ cảnh khi chuyển màn hình.

### Lỗi tiềm ẩn

- Auth/session mismatch là rủi ro lớn nhất cho CRUD.
- Double submit được xử lý ở một số nơi nhưng chưa đồng bộ.
- React Query invalidate chưa phủ đủ màn hình phụ thuộc tài chính.
- Native `alert/confirm` làm UX không đồng nhất và khó kiểm soát loading.
- API/client có nhiều fallback error tiếng Anh.
- Một số report API yêu cầu company scope; SUPER_ADMIN không company có thể bị 403 trên management reports.
- `lib/supabase.ts` fallback mock URL/key nếu env thiếu, có thể che lỗi cấu hình ở dev.

## 3. Danh sách lỗi theo mức độ

| Mã lỗi | Mức độ | Màn hình/phân hệ | File/API/component | Mô tả | Cách tái hiện | Nguyên nhân nghi ngờ | Hướng sửa | Sửa ngay phase này |
|---|---|---|---|---|---|---|---|---|
| BLOCKER-01 | BLOCKER | Toàn bộ CRUD | `store/erpStore.ts`, `lib/auth-guard.ts`, API routes | UI có admin nội bộ nhưng API cần `erp-session`; `.env` không bật bypass | Mở app không login session, gọi `/api/projects` hoặc thêm/sửa/xóa | Client auth state không đồng bộ server session | Bootstrap dev session an toàn ở `init()` qua `/api/auth/session` trong non-production; không dùng dữ liệu giả | Có |
| HIGH-01 | HIGH | Công trình | `app/api/projects/[id]/route.ts`, `services/project.service.ts` | Một số message delete/lỗi còn tiếng Anh/không dấu | Delete project hoặc project not found | Chuỗi hardcode cũ | Việt hóa message trả về API | Có |
| HIGH-02 | HIGH | WBS/Budget | `app/api/wbs/[id]/route.ts`, `app/api/budgets/[id]/route.ts` | Lỗi not found tiếng Anh, UI WBS thiếu delete | Gọi update/delete id không tồn tại | API hardcode English; UI thiếu action | Việt hóa lỗi; thêm delete WBS có confirm nếu service chặn an toàn | Có nếu phạm vi nhỏ |
| HIGH-03 | HIGH | Debt/Revenue/Payment | `services/queries/useDebts.ts`, `services/queries/useRevenues.ts` | Invalidate cache chưa phủ đủ dashboard/invoices/payments/debt sau mutation | Tạo/xóa thanh toán/hóa đơn rồi chuyển dashboard/debt | Query key phân tán | Invalidate thêm các key liên quan/project stats | Có |
| HIGH-04 | HIGH | Dashboard/Báo cáo | `app/components/Dashboard.tsx` | API fail bị nuốt, trả null/[] nên dễ che lỗi thật | Tắt session/DB, mở dashboard | Query không throw error | Trả lỗi query hoặc hiển thị error state tiếng Việt | Có một phần |
| MEDIUM-01 | MEDIUM | Toàn UI project-related | `EnterpriseHeader`, pages WBS/Budget/Costs/Revenue/Debt/Reports | Thiếu sticky project context bar đầy đủ | Chọn công trình rồi chuyển màn hình | Chỉ có ProjectSwitcher ngắn | Tạo `ProjectContextBar` dùng project stats/query và gắn vào pages chính | Có |
| MEDIUM-02 | MEDIUM | UI table/action | `EnterpriseDataTable`, action menus | Bảng rộng, action menu có thể bị cắt bởi overflow | Màn hình nhỏ/laptop, mở action cuối bảng | Container overflow hidden | Giữ horizontal scroll nhưng bổ sung context, dense layout; kiểm action menu sau | Một phần |
| MEDIUM-03 | MEDIUM | Costs/Budget/Revenue/Debt | Page components | Dùng `alert/confirm`, không toast chuẩn | Lỗi hoặc xóa record | Chưa dùng ToastProvider đồng bộ | Dần thay bằng modal/toast tiếng Việt | Một phần |
| MEDIUM-04 | MEDIUM | Tiền tệ | `app/components/dashboard-data.ts` | Format tiền thiếu `đ` | Xem KPI/bảng tiền | Helper không thêm đơn vị | Chuẩn hóa `formatVnd` trả `... đ` | Có |
| MEDIUM-05 | MEDIUM | Tiếng Việt | API/client helpers | Còn English user-facing | Query fail/API fail | Hardcode English | Việt hóa các chuỗi có thể hiện ra UI | Có một phần |
| LOW-01 | LOW | Lint | Toàn repo | 800 lint errors | `npm run lint` | Rule nghiêm, nhiều legacy any | Không thể sửa hết trong phase ổn định nhanh; ghi nợ kỹ thuật | Không sửa hết |

## 4. Kế hoạch sửa theo thứ tự ưu tiên

1. App sống: sửa session bootstrap/dev auth mismatch, giữ production không bypass bừa; đảm bảo build/typecheck pass.
2. CRUD: Việt hóa lỗi API chính, sửa cache invalidation cho project/WBS/budget/cost/revenue/invoice/payment.
3. Database: không tạo migration, không drop, không seed dữ liệu thật. Chỉ dùng schema hiện có.
4. Logic: chuẩn hóa format tiền VND và không dùng mock để che lỗi dashboard.
5. UI/UX: thêm sticky project context bar cho màn hình WBS/Budget/Costs/Revenue/Debt và danh sách công trình hiển thị đủ thông tin hơn.
6. Tiếng Việt: xử lý chuỗi user-facing nổi bật trước.
7. Trải nghiệm kế toán chuyên nghiệp: ưu tiên bảng chắc, context rõ, hành động có xác nhận/lỗi tiếng Việt.

## 5. Phạm vi sẽ sửa ngay

- `store/erpStore.ts`: bootstrap session dev/test qua `/api/auth/session`, đồng bộ user thật từ server, không tạo dữ liệu nghiệp vụ.
- `app/components/workspace/ProjectContextBar.tsx` hoặc component tương đương mới: context công trình sticky.
- Pages: `app/wbs/WBSListScreen.tsx`, `app/budget/page.tsx`, `app/costs/page.tsx`, `app/revenue/page.tsx`, `app/debt/page.tsx`, có thể thêm `app/reports/page.tsx` nếu phạm vi nhỏ.
- Helpers/query: `services/queries/*`, `services/api/*`, `app/components/dashboard-data.ts`.
- API message chính: projects, WBS, budgets, tenant-context/api-error nếu an toàn.

## 6. Phạm vi chưa sửa

- Không sửa migration/schema nếu chưa chứng minh cần thiết.
- Không nhập dữ liệu thật, không seed dữ liệu giả để che lỗi.
- Không sửa toàn bộ 800 lint errors trong phase này vì phần lớn là legacy `any`/unused trên phạm vi rất rộng; chỉ sửa các lỗi liên quan trực tiếp ổn định app.
- Không kiểm thử E2E toàn bộ bằng Playwright trước khi sửa session/context; sẽ smoke test sau sửa.

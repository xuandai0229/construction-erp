# Phase 2 UAT Audit Report - Trước khi nhập dữ liệu thật

Ngày kiểm tra: 2026-06-06  
Phạm vi: baseline kỹ thuật, database, audit UI trực tiếp bằng Playwright, rà soát CRUD/logic/tiếng Việt trước khi sửa Phase 2.  
Nguyên tắc: không nhập dữ liệu thật, không drop bảng, không xóa migration, không tạo dữ liệu giả để che lỗi.

## 1. Tóm tắt tình trạng hệ thống

- App build được. `npm run build` pass sau khi chạy ngoài sandbox vì lần đầu bị lỗi quyền ghi `.next/trace-build`.
- TypeScript pass: `npx tsc --noEmit` pass.
- Prisma schema và migration ổn: `npx prisma validate` pass, `npx prisma migrate status` pass, database đang up to date với 12 migration.
- Audit dữ liệu pass: `npm run audit:check` pass, không phát hiện orphan/công nợ âm/thanh toán vượt/hạch toán lệch trong bộ dữ liệu hiện tại.
- `npm run lint` vẫn fail lớn toàn repo: 1053 vấn đề gồm 801 errors và 252 warnings. Đây là nợ kỹ thuật legacy, chưa phải blocker build/runtime Phase 2.
- UI trực tiếp mở được 15 màn hình kiểm tra. Không có document-level horizontal overflow, nhưng nhiều bảng nghiệp vụ rộng phải scroll ngang trong container.
- Ngữ cảnh công trình chưa đạt yêu cầu UAT: khi chưa có `currentProjectId`, các màn hình WBS/Dự toán/Chi phí/Doanh thu/Công nợ không hiển thị đầy đủ công trình đang làm việc.
- Hóa đơn/thanh toán chưa thể UAT trọn vẹn bằng UI vì rule 3-way match chặn khi chưa có nghiệm thu/khối lượng được duyệt. Thông báo chặn còn tiền tố tiếng Anh `3-WAY MATCH ERROR (Billing)`.
- Tiếng Việt chưa đạt 100%: phát hiện user-facing `N/A`, một số tiêu đề/phụ đề hệ thống còn tiếng Anh, và một số thông báo API còn tiếng Anh nếu UI surface lỗi.

## 2. Kết quả kiểm tra theo nhóm

### 2.1 Source/build/runtime

- Nhánh hiện tại: `main`.
- Trạng thái source ban đầu: có nhiều file đã modified/untracked từ phase trước. Không ghi đè các thay đổi này trong audit.
- Lệnh đã chạy:
  - `git status --short --branch`: pass.
  - `npx tsc --noEmit`: pass.
  - `npm run build`: pass sau khi rerun với quyền ngoài sandbox.
  - `npx prisma validate`: pass.
  - `npx prisma migrate status`: pass sau khi rerun với quyền ngoài sandbox.
  - `npm run audit:check`: pass.
  - `npm run lint`: fail, 801 errors/252 warnings.

### 2.2 Database

- Prisma validate pass.
- Migration status pass, database đồng bộ với migration.
- `audit:check` trả về dữ liệu hiện tại: users 3, companies 1, branches 1, projects 3, wbs 10, budgets 8, costs 3, invoices 1, payments 0, revenues 1, contracts 1, transactionLines 4.
- Kiểm tra integrity tự động: không phát hiện invoice remaining sai, overpaid invoice, negative cost, unbalanced journal, orphan cost WBS, orphan invoice WBS.
- Chưa thay đổi schema/migration trong audit.

### 2.3 CRUD

- Theo báo cáo phase trước: smoke test thủ công pass cho Công trình, WBS, Dự toán, Chi phí, Doanh thu.
- Phase 2 chưa tạo dữ liệu thật. UAT hóa đơn/thanh toán bị chặn bởi nghiệp vụ 3-way match vì chưa có nghiệm thu/khối lượng được duyệt.
- Cần tiếp tục smoke test UI sau khi sửa lỗi ngữ cảnh công trình để bảo đảm thêm/sửa/xóa không cần F5.

### 2.4 Logic tính toán

- `audit:check` không phát hiện sai lệch công nợ/hóa đơn/hạch toán ở dataset hiện tại.
- Dashboard/báo cáo mở được bằng UI, chưa có lỗi API hiển thị trên màn hình trong audit route.
- Rủi ro còn lại: cần xác minh dashboard, context bar và báo cáo dùng cùng nguồn dữ liệu sau khi có project context mặc định.

### 2.5 UI/UX trực tiếp bằng trình duyệt

Đã mở trực tiếp bằng Playwright ở viewport 1366x768:

- Dashboard: `docs/qa/screenshots/phase2-uat/dashboard.png`
- Công trình: `docs/qa/screenshots/phase2-uat/projects.png`
- WBS: `docs/qa/screenshots/phase2-uat/wbs.png`
- Dự toán: `docs/qa/screenshots/phase2-uat/budget.png`
- Chi phí: `docs/qa/screenshots/phase2-uat/costs.png`
- Doanh thu/Hóa đơn/Thanh toán: `docs/qa/screenshots/phase2-uat/revenue.png`
- Công nợ: `docs/qa/screenshots/phase2-uat/debt.png`
- Kế toán: `docs/qa/screenshots/phase2-uat/accounting.png`
- Quỹ/Ngân hàng: `docs/qa/screenshots/phase2-uat/cash-bank.png`
- Kho: `docs/qa/screenshots/phase2-uat/inventory.png`
- Thuế: `docs/qa/screenshots/phase2-uat/tax.png`
- Báo cáo: `docs/qa/screenshots/phase2-uat/reports.png`
- Phê duyệt: `docs/qa/screenshots/phase2-uat/approvals.png`
- Hệ thống: `docs/qa/screenshots/phase2-uat/system.png`
- Cài đặt: `docs/qa/screenshots/phase2-uat/settings.png`

Kết quả:

- Không màn hình nào trả HTTP lỗi.
- Không có document-level horizontal overflow.
- Các bảng WBS, Dự toán, Chi phí, Doanh thu, Kế toán, Quỹ/Ngân hàng, Thuế, Báo cáo rộng hơn vùng nhìn và phụ thuộc scroll ngang trong container. Đây là dạng dense table kế toán chấp nhận được ở mức có kiểm soát, nhưng cần bảo đảm cột thao tác/action không bị mất.
- Màn `/approvals` có vùng nội dung rộng 1661px trong viewport 1366px, gây overflow nội bộ rõ ràng.
- Console có lỗi WebSocket HMR trong dev audit (`/_next/webpack-hmr`). Đây là nhiễu môi trường dev/headless, không thấy ở build production.

### 2.6 Tiếng Việt

- Rà soát UI trực tiếp phát hiện `/system` còn `N/A`.
- Rà soát mã nguồn phát hiện thông báo user-facing có nguy cơ còn tiếng Anh:
  - `services/revenue.service.ts`: `3-WAY MATCH ERROR (Billing)`.
  - `lib/tenant-context.ts`: `Unauthorized`, `User does not belong to any company`, `Access Denied: Tenant Isolation Violation`.
  - `app/system/page.tsx`: tiêu đề/phụ đề như `Governance`, `Telemetry`, `Disaster Recovery`, `N/A`.
  - Một số fallback `N/A` ở `app/cash-bank/page.tsx`, `app/components/modals/VendorPaymentModal.tsx`, print/export views.

### 2.7 Ngữ cảnh công trình

- Khi Playwright mở app không có project đang chọn, các màn WBS/Dự toán/Chi phí/Doanh thu/Công nợ chỉ hiển thị cảnh báo chưa chọn công trình, không có mã/tên/chủ đầu tư/trạng thái/số liệu.
- Đây là lỗi UAT vì kế toán chuyển màn hình không biết đang làm việc với công trình nào nếu chưa từng chọn hoặc localStorage mất state.
- Cần sửa an toàn: tự thiết lập công trình mặc định đầu tiên khi có danh sách dự án và chưa có project đang chọn, đồng thời vẫn cho người dùng đổi công trình.

### 2.8 Lỗi tiềm ẩn

- Có rủi ro UI surface lỗi API tiếng Anh nếu các `ApiError` tiếng Anh được trả về toast/modal.
- Hóa đơn/thanh toán có rule đúng hướng, nhưng thông điệp chặn chưa đủ hướng dẫn nghiệp vụ cho người dùng cần tạo/phê duyệt nghiệm thu gì.
- Lint legacy rất lớn; không sửa toàn bộ trong Phase 2 để tránh rủi ro lan rộng.

## 3. Danh sách lỗi theo mức độ

| Mã lỗi | Mức độ | Phân hệ | File/API/component | Mô tả | Cách tái hiện | Nguyên nhân nghi ngờ | Hướng sửa | Sửa phase này |
|---|---|---|---|---|---|---|---|---|
| P2-HIGH-001 | HIGH | Ngữ cảnh công trình | `app/components/workspace/ProjectContextBar.tsx`, `store/erpStore.ts` | Màn WBS/Dự toán/Chi phí/Doanh thu/Công nợ không hiện đủ công trình khi chưa có `currentProjectId`. | Mở app bằng browser mới, vào `/wbs` hoặc `/costs`. | State project chỉ lấy từ localStorage, không có fallback mặc định. | Tự chọn công trình đầu tiên khi danh sách đã tải và chưa có lựa chọn; giữ cảnh báo khi không có dự án. | Có |
| P2-HIGH-002 | HIGH | Hóa đơn/Thanh toán | `services/revenue.service.ts` | Rule 3-way match chặn đúng nhưng thông báo còn tiếng Anh và chưa hướng dẫn tạo/phê duyệt nghiệm thu. | Tạo hóa đơn khi WBS chưa có progress approved. | Error message dùng tiền tố tiếng Anh. | Việt hóa và thêm hướng dẫn nghiệp vụ. | Có |
| P2-MED-001 | MEDIUM | Phê duyệt | `app/approvals/page.tsx` hoặc component con | Nội dung `/approvals` overflow nội bộ 1661px trên viewport 1366px. | Mở `/approvals` bằng Playwright. | Layout grid/flex hoặc tab/filter quá rộng. | Bọc container bằng `min-w-0`, `overflow-hidden`, cho filter wrap/scroll hợp lý. | Có nếu scoped |
| P2-MED-002 | MEDIUM | Bảng nghiệp vụ | WBS, Budget, Costs, Revenue, Accounting, Cash-bank, Tax, Reports | Bảng rộng phải scroll ngang; cần bảo đảm sticky header/cột thao tác không bị mất. | Mở các route audit. | Dense accounting table có min-width lớn. | Giữ scroll ngang có kiểm soát, ưu tiên sửa màn overflow nặng/action bị cắt nếu phát hiện sau smoke test. | Một phần |
| P2-MED-003 | MEDIUM | Tiếng Việt | `app/system/page.tsx`, `app/cash-bank/page.tsx`, `VendorPaymentModal.tsx` | User-facing còn `N/A` và một số label tiếng Anh. | Mở `/system` hoặc các modal liên quan. | Fallback kỹ thuật chưa Việt hóa. | Đổi fallback sang `Chưa có dữ liệu`/`Chưa xác định`, Việt hóa tiêu đề chính. | Có |
| P2-MED-004 | MEDIUM | API/session/tenant | `lib/tenant-context.ts` | Lỗi phân quyền có thể trả tiếng Anh ra UI. | Gọi API khi thiếu session/tenant. | Message mặc định tiếng Anh. | Việt hóa ApiError. | Có |
| P2-LOW-001 | LOW | Lint legacy | Toàn repo | `npm run lint` fail 801 errors, không ảnh hưởng build hiện tại. | Chạy `npm run lint`. | Nợ kỹ thuật cũ: any, hook deps, require, unused. | Không sửa toàn bộ Phase 2; chỉ sửa file chạm nếu liên quan. | Không toàn bộ |
| P2-LOW-002 | LOW | Dev server | Next dev HMR | Console có WebSocket HMR error trong audit headless. | Playwright headless trên dev server. | Nhiễu dev/headless, không thấy ở build. | Ghi nhận, không ưu tiên sửa nếu production build pass. | Không |

## 4. Kế hoạch sửa theo thứ tự ưu tiên

1. App sống/build/runtime: giữ nguyên trạng vì baseline pass, không tạo migration.
2. Ngữ cảnh công trình: sửa project context fallback để màn liên quan luôn có công trình nếu có dữ liệu dự án.
3. Hóa đơn/thanh toán: Việt hóa rule 3-way match và thông báo lỗi phân quyền/tenant.
4. UI/UX: sửa overflow rõ ràng ở `/approvals`; rà lại bảng/action bằng Playwright sau sửa.
5. Tiếng Việt: xử lý `N/A` và label tiếng Anh user-facing rõ nhất trong phạm vi file liên quan.
6. Smoke test lại UI và baseline lệnh kỹ thuật.

## 5. Phạm vi sẽ sửa ngay

- `app/components/workspace/ProjectContextBar.tsx`
- `services/revenue.service.ts`
- `lib/tenant-context.ts`
- `app/system/page.tsx`
- `app/cash-bank/page.tsx` nếu fallback `N/A` user-facing nằm trong màn đang dùng.
- `app/components/modals/VendorPaymentModal.tsx` nếu fallback `N/A` user-facing nằm trong modal thanh toán.
- `app/approvals/page.tsx` hoặc component con nếu xác định overflow do layout scoped.

## 6. Phạm vi chưa sửa trong phase này

- Không sửa toàn bộ 801 lint errors legacy vì rủi ro lan rộng và không phải blocker app sống.
- Không tạo migration/schema mới vì database đang validate và migrate pass.
- Không nhập dữ liệu thật.
- Không tạo dataset giả để che lỗi. Nếu cần CRUD smoke test, chỉ dùng bản ghi sandbox/test và xóa sau khi kiểm tra.
- Không refactor dashboard/báo cáo diện rộng nếu chưa phát hiện mismatch dữ liệu cụ thể trong UAT.

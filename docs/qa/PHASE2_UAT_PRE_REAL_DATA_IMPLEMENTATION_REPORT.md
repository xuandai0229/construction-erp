# Phase 2 UAT Implementation Report - Trước khi nhập dữ liệu thật

Ngày thực hiện: 2026-06-06  
Mục tiêu: kiểm tra trực tiếp bằng trình duyệt, sửa lỗi scoped để app đủ ổn định cho nhập dữ liệu sandbox có kiểm soát.

## 1. Đã kiểm tra những màn hình nào

Đã chạy Playwright ở viewport 1366x768 và chụp lại ảnh tại `docs/qa/screenshots/phase2-uat/`:

- Dashboard
- Công trình
- WBS/Hạng mục
- Dự toán
- Chi phí
- Doanh thu/Hóa đơn/Thanh toán
- Công nợ
- Kế toán
- Quỹ/Ngân hàng
- Kho
- Thuế
- Báo cáo
- Phê duyệt
- Hệ thống
- Cài đặt

File kết quả máy đọc: `docs/qa/phase2-ui-audit-results.json`.

## 2. Đã phát hiện lỗi gì

- Project context bar không hiển thị đủ thông tin công trình khi browser chưa có `currentProjectId`.
- Màn `/approvals` có layout nội bộ quá rộng do grid/flex không co lại đúng.
- Thông báo nghiệp vụ hóa đơn/doanh thu còn tiền tố tiếng Anh `3-WAY MATCH ERROR (Billing)`.
- Thông báo đối chiếu 3 bên của chi phí còn tiền tố tiếng Anh.
- Một số fallback user-facing còn `N/A` hoặc nhãn tiếng Anh ở hệ thống, kế toán, báo cáo, quỹ/ngân hàng.
- `npm run lint` vẫn fail legacy toàn repo, không thuộc phạm vi sửa lan rộng Phase 2.

## 3. Đã sửa lỗi gì

- Tự chọn công trình mặc định đầu tiên khi người dùng chưa chọn công trình và danh sách công trình đã tải.
- Bổ sung trạng thái tải rõ ràng cho context bar khi đang lấy danh sách công trình.
- Việt hóa thông báo lỗi phân quyền/tenant có thể trả ra UI.
- Việt hóa rule chặn lập hóa đơn khi chưa đủ nghiệm thu được duyệt; thông báo nêu rõ cần tạo/phê duyệt nghiệm thu/khối lượng WBS.
- Việt hóa thông báo đối chiếu 3 bên của chi phí.
- Sửa layout `/approvals` bằng `min-w-0` và grid `minmax(0, 1fr)` để tránh overflow container.
- Việt hóa các fallback/nội dung rõ ràng: `N/A`, `Budget`, `Ledger Preview`, `Auto-post`, `Failed Auth`, `Recon Fails`, `Disaster Recovery`.
- Smoke test UI tạo công trình sandbox: tạo thành công qua modal UI, thấy ngay trên bảng không cần F5, sau đó cleanup bằng API DELETE.

## 4. File đã sửa

- `app/components/workspace/ProjectContextBar.tsx`
- `app/components/layout/EnterpriseSidebar.tsx`
- `app/approvals/page.tsx`
- `app/system/page.tsx`
- `app/cash-bank/page.tsx`
- `app/accounting/page.tsx`
- `app/reports/page.tsx`
- `app/components/modals/VendorPaymentModal.tsx`
- `lib/tenant-context.ts`
- `services/revenue.service.ts`
- `services/cost.service.ts`
- `services/cash-bank.service.ts`
- `docs/qa/PHASE2_UAT_PRE_REAL_DATA_AUDIT_REPORT.md`
- `docs/qa/PHASE2_UAT_PRE_REAL_DATA_IMPLEMENTATION_REPORT.md`

## 5. Kết quả lệnh

- `git status --short --branch`: pass, nhánh `main`, repo có nhiều thay đổi/untracked từ trước phase này.
- `npx tsc --noEmit`: pass.
- `npm run build`: pass khi chạy ngoài sandbox. Build còn warning Turbopack/NFT cũ ở `app/api/reports/audited-export/route.ts` và deprecation warning `url.parse()`.
- `npx prisma validate`: pass.
- `npx prisma migrate status`: pass khi chạy ngoài sandbox, database schema up to date với 12 migrations.
- `npm run audit:check`: pass. Sau smoke test cleanup, counts vẫn `projects: 3`; integrity không có overpaid/orphan/unbalanced.
- `npm run lint`: fail legacy toàn repo, 1054 problems gồm 801 errors và 253 warnings. Không sửa toàn bộ trong phase này để tránh rủi ro lan rộng.

## 6. Kết quả smoke test UI bằng trình duyệt

- 15 route chính mở được, không route nào HTTP lỗi.
- Re-audit sau restart dev server: không còn console error trong Playwright audit.
- Không còn document-level horizontal overflow.
- Context bar đã hiển thị đúng trên các màn liên quan công trình:
  - WBS: pass
  - Dự toán: pass
  - Chi phí: pass
  - Doanh thu/Hóa đơn/Thanh toán: pass
  - Công nợ: pass
- Các bảng nghiệp vụ vẫn dùng horizontal scroll có kiểm soát do dense accounting table; chưa thấy tràn toàn trang.
- `/approvals` hết overflow toàn trang, nhưng bảng phê duyệt vẫn rộng và scroll ngang trong container.

## 7. Kết quả CRUD từng module

- Công trình: create UI sandbox pass, row xuất hiện ngay không cần F5; cleanup DELETE API pass.
- WBS/Dự toán/Chi phí/Doanh thu: theo phase trước đã smoke test thủ công pass; phase này re-audit xác nhận context bar và màn hình mở ổn.
- Hóa đơn/Thanh toán/Công nợ: chưa tạo hóa đơn hợp lệ vì dataset hiện tại chưa có nghiệm thu/khối lượng được duyệt đủ để vượt rule 3 bên.
- Nhà cung cấp/Hợp đồng/Tạm ứng/Hoàn ứng: chưa chạy CRUD UI đầy đủ trong phase này; chỉ audit màn hình/liên kết và giữ nguyên logic.

## 8. Kết quả test hóa đơn/thanh toán/công nợ

- Rule 3-way match vẫn chặn lập hóa đơn khi chưa đủ nghiệm thu được duyệt.
- Đã sửa thông báo để người dùng hiểu cần tạo/phê duyệt nghiệm thu/khối lượng WBS trước khi lập hóa đơn.
- `audit:check` xác nhận invoice remaining/overpaid hiện tại không sai.
- Chưa test thanh toán một phần/đủ/vượt vì chưa có hóa đơn mới hợp lệ trong dữ liệu sandbox hiện tại.

## 9. Danh sách lỗi còn lại

- `npm run lint` còn fail legacy toàn repo. Mức độ LOW/MEDIUM, chưa ảnh hưởng build/runtime hiện tại.
- Một số thuật ngữ kỹ thuật/viết tắt còn xuất hiện: `ERP`, `VAT`, `WBS`, `CSV`, `PDF`. Đây là viết tắt nghiệp vụ/kỹ thuật phổ biến, chưa xử lý trong phase này.
- Một số print/export route còn fallback `N/A`; chưa audit từng chứng từ in vì chưa có đủ dữ liệu nghiệp vụ tương ứng.
- Dashboard/báo cáo chưa được UAT số liệu sâu bằng dataset đủ hóa đơn/thanh toán/nghiệm thu.

## 10. Kết luận

Đủ điều kiện chuyển sang nhập dữ liệu sandbox có kiểm soát, chưa đủ điều kiện nhập dữ liệu thật production. App build/typecheck/database pass, context công trình đã rõ trên các màn chính, UI không tràn toàn trang, và CRUD công trình đã được smoke test trực tiếp bằng trình duyệt.

Điều kiện trước khi nhập dữ liệu thật: xử lý tiếp lint theo cụm rủi ro, chuẩn hóa print/export fallback, tạo dataset nghiệm thu/hợp đồng hợp lệ để UAT hóa đơn/thanh toán/công nợ đầy đủ.

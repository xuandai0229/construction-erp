# SPRINT 3A.2 - ENTERPRISE TABLE & ACTION MENU HARDENING REPORT

## 1. Executive Summary

Sprint 3A.2 đã xử lý phần UI table/action menu theo phạm vi pilot: không sửa database, không sửa Prisma schema, không tạo migration, không đụng ledger, posting, payment allocation, reconciliation mapping hoặc AP Bát Tràng.

Kết quả chính:

- Bảng enterprise dùng chung đã ổn định hơn về căn cột, sticky header/footer, chiều cao dòng, truncate và format ô số tiền.
- Action menu dùng chung đã chuyển sang portal overlay để giảm rủi ro bị clipping trong bảng có `overflow`.
- Màn hình Công trình đã bỏ action menu absolute cục bộ và dùng `EnterpriseActionMenu`.
- Build production pass, Prisma validate/generate pass, validation database pass, security-check pass, e2e enterprise smoke pass.
- Lint toàn repo vẫn fail vì lỗi cũ ngoài phạm vi Sprint 3A.2; lint riêng 4 file đã sửa trong sprint này pass.

Gate đề xuất: **A - READY_FOR_SPRINT_3A_3_FINANCIAL_DRILLDOWN_PILOT**.

## 2. Files Changed

| File | Thay đổi | Phạm vi |
| --- | --- | --- |
| `app/components/ui-enterprise/EnterpriseActionMenu.tsx` | Dùng `PortalOverlay`, hỗ trợ Escape, focus, ARIA menu, z-index cao, width ổn định, tooltip UTF-8 | UI only |
| `app/components/ui-enterprise/EnterpriseDataTable.tsx` | Chuẩn hóa sticky header/footer, default width cột ngày/trạng thái/thao tác, căn phải số tiền, loading/empty state tiếng Việt | UI only |
| `app/components/ui-enterprise/EnterpriseTable.tsx` | Chuẩn hóa sticky header/footer, truncate header/cell, loading/empty state tiếng Việt, row height ổn định | UI only |
| `app/components/projects/ProjectTable.tsx` | Thay menu action absolute bằng `EnterpriseActionMenu`, bỏ state menu cục bộ, sửa label hành động UTF-8, bỏ `any` phát sinh trong file | UI only |
| `SPRINT3A_2_TABLE_ACTION_MENU_HARDENING_REPORT.md` | Báo cáo hoàn tất sprint | Report |

## 3. Screen-by-screen Review

| Màn hình | Kết quả sau Sprint 3A.2 | Vấn đề còn lại |
| --- | --- | --- |
| Công trình | Bảng dùng `EnterpriseTable`; action menu đã dùng portal, giảm clipping; cột thao tác có chiều rộng ổn định | Một số text/mojibake cũ trong màn hình vẫn thuộc Sprint 3A.1/3A tiếp theo |
| WBS | Bảng dùng shared enterprise table nên hưởng sticky/truncate/align cải thiện | Chưa audit visual thủ công từng dòng cây WBS trong browser |
| Dự toán | `EnterpriseDataTable` cải thiện căn cột tiền/ngày/trạng thái và empty/loading state | Chưa xử lý sâu icon cây/hierarchy nếu còn mojibake cũ |
| Chi phí | `EnterpriseDataTable` áp dụng căn phải số tiền và header sticky nhất quán | Chưa thay đổi workflow, filter hay source dữ liệu |
| Công nợ | `EnterpriseDataTable` áp dụng layout ổn định hơn cho số tiền/cột trạng thái | Chưa xử lý drilldown chứng từ |
| Thanh toán/Doanh thu | Các bảng dùng shared table hưởng cải thiện layout | Không thay đổi nghiệp vụ cashflow/revenue |
| Kho vật tư | Bảng chứng từ kho hưởng cải thiện table shared ở vùng đang dùng `EnterpriseDataTable` | Không thay đổi API/export kho |

## 4. Action Menu Review

Trước sprint:

- `EnterpriseActionMenu` render dropdown bằng `absolute` bên trong container bảng.
- `ProjectTable` có menu riêng, dùng `activeMenuId`, dropdown nằm trong row nên dễ bị che bởi `overflow-x/overflow-y`.
- Menu chưa có ARIA menu đầy đủ và chưa đóng bằng Escape trong component dùng chung.

Sau sprint:

- `EnterpriseActionMenu` render qua `PortalOverlay` với `zIndex=500`.
- Dropdown được neo theo nút mở bằng `anchorElement`, có auto close khi click ngoài/scroll/Escape theo cơ chế `PortalOverlay`.
- `ProjectTable` dùng component chung, không còn state `activeMenuId`.
- Menu item có `role="menuitem"`, container có `role="menu"`, label dài được truncate.

Đánh giá clipping: **Đã giảm rủi ro chính ở table overflow và cột thao tác Công trình**. Cần kiểm tra visual sâu hơn ở các màn hình có action menu tùy biến chưa dùng component chung nếu phát hiện thêm trong Sprint 3A.3.

## 5. Table UX Improvements

- Sticky header/footer dùng z-index cao hơn và shadow divider rõ hơn.
- Cột `Thao tác`, `Trạng thái`, `Ngày` có width mặc định ổn định khi column chưa khai báo.
- Cột tiền/giá trị/dự toán tự căn phải, dùng `tabular-nums` và `font-mono`.
- Ô text căn trái mặc định truncate để tránh vỡ layout bảng.
- Loading state: `Đang tải dữ liệu...`
- Empty state mặc định: `Không tìm thấy dữ liệu phù hợp với bộ lọc hiện tại.` hoặc `Chưa có dữ liệu để hiển thị.`
- Row height ổn định cho density compact/comfortable.

## 6. Safety Confirmation

Không thực hiện các thao tác bị cấm trong prompt:

- Không chạy `apply-project-company-mapping.ts`.
- Không chạy `apply-journal-project-mapping.ts`.
- Không update `Project.companyId`.
- Không update `JournalEntry.projectId`.
- Không đánh dấu `NON_PROJECT_FINANCE`.
- Không sửa AP Bát Tràng.
- Không sửa query kế toán chính thức để cộng DRAFT.
- Không thay đổi posting engine.
- Không thay đổi payment allocation/accounting logic.
- Không sửa Prisma schema.
- Không tạo migration.
- Không reset database.
- Không sửa file trong `.local-audit-quarantine/`.
- Không commit/push.
- Không tuyên bố production ready.

## 7. Test Results

| Lệnh | Kết quả | Ghi chú |
| --- | --- | --- |
| `git status --short` | Pass | Repo đang dirty từ các phase/sprint trước; Sprint 3A.2 chỉ tính các file nêu ở mục 2 |
| `git branch --show-current` | Pass | `main` |
| `git log -3 --oneline` | Pass | `211d31c fix loi`, `92f1dbc app_v2_pate7`, `d1a5b4f phase4a_business_workflow_data_integrity_audit` |
| `npx prisma validate` | Pass | Schema hợp lệ |
| `npx prisma generate` | Pass | Cần chạy ngoài sandbox do `spawn EPERM` |
| `npm run build` | Pass | Cần chạy ngoài sandbox do `.next/trace EPERM`; còn warning Turbopack/NFT và `url.parse()` cũ |
| `npm run validation:database` | Pass | Read-only validation: posted journal sampled 42, unbalanced 0, orphan WBS 0, draft posted payments 0 |
| `npm run security-check` | Pass | Viewer bị chặn, Manager qua guard |
| `npm run e2e -- tests/e2e/enterprise-smoke.spec.ts` | Pass | 3/3 tests pass |
| `npm run lint` | Fail cũ ngoài phạm vi | 819 errors/261 warnings toàn repo, chủ yếu `any`, unused vars, React effect rule ở các file không thuộc Sprint 3A.2 |
| `npx eslint app/components/ui-enterprise/EnterpriseActionMenu.tsx app/components/ui-enterprise/EnterpriseDataTable.tsx app/components/ui-enterprise/EnterpriseTable.tsx app/components/projects/ProjectTable.tsx` | Pass | Xác nhận các file Sprint 3A.2 sạch lint |

## 8. Remaining Issues

- Lint toàn repo vẫn chưa sạch, cần sprint riêng để xử lý debt TypeScript/ESLint.
- Build còn warning Turbopack NFT từ import trace `next.config.ts -> generated/prisma-client/index.js -> app/api/reports/audited-export/route.ts`.
- Runtime/build còn warning `DEP0169 url.parse()`.
- Một số màn hình có bảng custom không dùng `EnterpriseDataTable/EnterpriseTable` vẫn cần audit visual riêng, đặc biệt các bảng thủ công trong cash-bank và report.
- Một số mojibake cũ còn nằm ngoài phạm vi table/action menu hardening, cần tiếp tục sweep localization.
- Chưa thực hiện visual screenshot chuyên sâu theo từng breakpoint; e2e smoke mới xác nhận render/API/proxy cơ bản.

## 9. System Assessment After Sprint 3A.2

Hệ thống mạnh hơn ở lớp giao diện vận hành vì bảng enterprise và action menu dùng chung bớt rủi ro vỡ layout, bị che dropdown hoặc lệch cột thao tác. Đây là cải thiện đúng hướng cho trải nghiệm kế toán kiểu phần mềm nội bộ.

Điểm còn yếu so với MISA/FAST:

- Chưa có audit visual bằng screenshot cho từng màn hình nghiệp vụ.
- Drilldown số liệu về chứng từ gốc chưa được nâng cấp trong sprint này.
- Inline edit, keyboard workflow, bulk action và table virtualization chưa được chuẩn hóa toàn hệ thống.
- Lint toàn repo chưa sạch nên chất lượng static vẫn còn nợ kỹ thuật.

Rủi ro còn lại không thuộc Sprint 3A.2:

- Lỗi localization/mojibake cũ ở nhiều màn hình.
- Các bảng custom không dùng shared enterprise table có thể vẫn còn clipping/scroll bất nhất.
- Warning build/runtime cần xử lý trước khi tiến tới hardening production.

## 10. Decision Gate

**Gate: A - READY_FOR_SPRINT_3A_3_FINANCIAL_DRILLDOWN_PILOT**

Lý do:

- Không có thay đổi database/nghiệp vụ.
- Build production pass.
- Prisma validate/generate pass.
- Validation database pass.
- Security-check pass.
- Enterprise smoke e2e pass.
- Lint riêng các file Sprint 3A.2 pass.

Điều kiện đi tiếp:

- Sprint 3A.3 nên tập trung financial drilldown pilot: click số liệu mở chứng từ/hợp đồng gốc, không thay đổi source-of-truth kế toán.
- Nên song song mở task cleanup lint toàn repo nhưng không trộn vào Sprint 3A UI pilot.


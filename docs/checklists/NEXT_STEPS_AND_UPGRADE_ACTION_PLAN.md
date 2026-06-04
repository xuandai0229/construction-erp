# NEXT STEPS AND UPGRADE ACTION PLAN

Ngày lập: 2026-06-04  
Workspace: `D:\construction-erp`  
Mục tiêu: Trả lời rõ “bước tiếp theo cần làm gì”, phân tích các thiếu sót còn lại từ báo cáo đánh giá hệ thống, và lập kế hoạch nâng cấp để hệ thống phù hợp kế toán xây dựng, thao tác gần phong cách MISA/FAST hơn.

## 1. Kết luận ngắn gọn

Bước tiếp theo không nên là sửa UI lớn ngay. Việc cần làm trước tiên là hoàn tất xác nhận dữ liệu kế toán bởi người thật.

Lý do: hiện hệ thống vẫn đang ở gate:

```text
C. WAITING_FOR_HUMAN_APPROVAL
```

Các điểm chặn chính:

- 19 dòng `Project -> Company` chưa được người thật duyệt.
- 25 dòng `CASH_BANK Journal` chưa được người thật quyết định thuộc công trình hay nghiệp vụ chung.
- 26 dòng `AP Bát Tràng` chưa được người thật xác nhận hướng xử lý.
- `04_SIGN_OFF_FORM.md` chưa ký đủ.
- Validator chưa chạy vì chưa có dòng human approval hợp lệ.
- Chưa được chạy Phase 2.7 apply.

Vì vậy thứ tự đúng là:

1. Gửi package human approval cho kế toán/owner điền và ký.
2. Nhận lại package, chạy lại Phase 2.9B để validator kiểm tra.
3. Nếu PASS, xin owner xác nhận chạy Phase 2.7 apply.
4. Sau khi dữ liệu nền đã khóa, mới nâng cấp báo cáo Excel/A4 và UI nhập liệu kiểu MISA.

## 2. Trạng thái hiện tại

## 2.1 Những phần đã làm tốt

| Nhóm | Trạng thái | Nhận xét |
| ---- | ---------- | -------- |
| Nền tảng ERP | Có nền tốt | Đã có công trình, WBS, chi phí, hợp đồng, hóa đơn, thanh toán, tạm ứng, kho, thuế, ledger. |
| Sổ cái double-entry | Có | Validation database từng cho thấy posted journal sample cân đối. |
| Audit/export pilot | Có | Một số báo cáo đã đi qua audited server-side export. |
| UI pilot | Đã cải thiện | Approval inbox, audit UI, report/print pilot, drilldown, SLA pilot đã có test. |
| Package human approval | Đã tạo | Đã có tài liệu bàn giao cho kế toán/owner trong `.local-audit-quarantine/human-approval-package/`. |
| Build/test cơ bản | Pass gần đây | `prisma validate`, `build`, `validation:database`, `security-check`, `enterprise-smoke` từng pass. |

## 2.2 Những phần chưa xong

| Nhóm | Thiếu sót | Mức độ | Ảnh hưởng |
| ---- | -------- | ------ | --------- |
| Human approval | 70 dòng dữ liệu nhạy cảm chưa có người thật duyệt | P0 | Chưa thể dùng dữ liệu thật, chưa thể apply reconciliation. |
| Sign-off | Chưa ký đầy đủ | P0 | Không có trách nhiệm xác nhận rõ ràng. |
| Project/company mapping | 19 dòng chưa chốt | P0 | Có thể sai báo cáo theo công ty/công trình. |
| CASH_BANK journal | 25 dòng chưa phân loại | P0 | Có thể sai cashflow công trình hoặc sổ cái theo công trình. |
| AP Bát Tràng | 26 dòng chưa chốt | P0 | Có thể sai công nợ phải trả. |
| Excel `.xlsx` | Chưa có Excel thật, mới có CSV fallback | P1 | Báo cáo chưa giống chuẩn kế toán/MISA. |
| Print A4 động | Chưa QA đủ invoice/payment/advance/inventory | P1 | Chứng từ in có thể thiếu thông tin/lệch layout. |
| Workflow backend | Approval vẫn nhiều phần pilot/read-only | P1 | Chưa vận hành phê duyệt thật theo vai trò/hạn mức. |
| UI nhập liệu | Chưa đủ nhanh như MISA | P1 | Kế toán vẫn thao tác nhiều click, chưa tối ưu bàn phím/grid. |
| Backup/restore | Chưa có runbook vận hành đủ | P1 | Chưa an toàn khi dùng dữ liệu thật nội bộ. |
| Engineering debt | Build warnings, lint/type debt, e2e flaky parallel | P2 | Tăng rủi ro regression khi mở rộng. |

## 3. Bước tiếp theo bạn cần làm ngay

## 3.1 Việc của bạn/kế toán/owner

Bạn cần gửi thư mục sau cho kế toán/owner:

```text
.local-audit-quarantine/human-approval-package/
```

Trong thư mục này, kế toán/owner cần đọc:

- `README_KE_TOAN_CAN_DIEN_GI.md`
- `CHECKLIST_TRUOC_KHI_GUI_LAI_KY_THUAT.md`
- `QUICK_REFERENCE_APPROVAL_VALUES.md`
- `MAU_TIN_NHAN_GUI_KE_TOAN_OWNER.md`

Sau đó cần điền 3 file:

1. `project-company-mapping.for-approval.csv`
2. `journal-project-mapping.for-approval.csv`
3. `project-battrang-ap-reconciliation.for-approval.csv`

Và ký:

```text
04_SIGN_OFF_FORM.md
```

## 3.2 Quy tắc bắt buộc khi kế toán điền

Không chấp nhận:

- `approvedBy=AI`
- `approvedBy=System`
- `approvedBy=Antigravity`
- `approvedBy=Kế toán Trưởng` chung chung
- `approvedAt` trống
- `decisionReason=Theo dữ liệu cũ`
- `decisionReason=AI xác nhận`
- Dòng `NON_PROJECT_FINANCE` không có lý do rõ

Bắt buộc:

- `approvedBy` là tên người thật.
- `approvedRole` là chức vụ/vai trò thật.
- `approvedAt` có ngày giờ rõ.
- `decisionReason` nêu lý do nghiệp vụ cụ thể.
- Nếu backfill company thì có `approvedCompanyId`.
- Nếu backfill project thì có `approvedProjectId`.
- Nếu non-project thì có `nonProjectReason`.
- Nếu AP Bát Tràng thì có `mappingAction`.

## 3.3 Sau khi kế toán gửi lại

Chạy lại prompt:

```text
Phase 2.9B - Human Approval Completion Support & Validator Rerun
```

Mục tiêu của lần chạy lại:

- Đọc lại 3 CSV đã được điền.
- Phân loại từng dòng.
- Kiểm tra sign-off.
- Chạy validator nếu có approval hợp lệ.
- Không apply.
- Kết luận READY / NOT_READY.

## 4. Kế hoạch nâng cấp theo thứ tự ưu tiên

## Phase 1 - Data Gate trước khi dùng thật

Mục tiêu: khóa dữ liệu nền để không sai báo cáo công trình/công nợ/cashflow.

Việc cần làm:

1. Hoàn tất human approval 70 dòng.
2. Chạy lại Phase 2.9B.
3. Nếu validator PASS, xin owner xác nhận Phase 2.7 apply.
4. Backup database trước apply.
5. Apply mapping được duyệt.
6. Chạy validation database sau apply.
7. Tạo báo cáo đối chiếu sau apply.

Kết quả mong muốn:

- Không còn dữ liệu nhạy cảm pending.
- Mapping công trình/công ty rõ ràng.
- CASH_BANK journal được phân loại đúng.
- AP Bát Tràng có quyết định kế toán rõ.

Không nên làm trước khi xong phase này:

- Không nhập dữ liệu kế toán thật quy mô lớn.
- Không báo production ready.
- Không nâng cấp UI lớn rồi dùng số liệu chưa khóa để ra quyết định.

## Phase 2 - Chuẩn hóa chứng từ kế toán xây dựng

Mục tiêu: hệ thống vận hành theo chứng từ, giống cách kế toán làm việc trong MISA/FAST.

Thiếu sót cần nâng cấp:

- Chưa thống nhất hoàn toàn vòng đời chứng từ.
- Một số màn hình còn thiên về module dữ liệu, chưa đặt chứng từ làm trung tâm.
- Drilldown chưa sâu đến mọi chứng từ gốc.
- Chưa có layout chứng từ chuẩn cho mọi nghiệp vụ.

Việc cần làm:

1. Chuẩn hóa lifecycle:
   - Nháp.
   - Chờ duyệt.
   - Đã duyệt.
   - Đã ghi sổ.
   - Đã hủy.
   - Đã đảo.
2. Mỗi chứng từ bắt buộc có:
   - Số chứng từ.
   - Ngày chứng từ.
   - Ngày hạch toán.
   - Kỳ kế toán.
   - Công ty.
   - Công trình.
   - WBS/hạng mục nếu có.
   - Đối tượng NCC/khách hàng.
   - Người lập/người duyệt.
3. Không cho ghi sổ chứng từ chưa duyệt.
4. Không cho sửa trực tiếp chứng từ đã ghi sổ.
5. Mọi bút toán phải mở được chứng từ gốc.
6. Mọi chứng từ phải có audit trail.

Kết quả mong muốn:

- Kế toán click vào số liệu là thấy chứng từ.
- Giảm rủi ro sửa/xóa sai.
- Chuẩn bị nền cho báo cáo và workflow thật.

## Phase 3 - Excel/A4 Reports giống phần mềm kế toán

Mục tiêu: báo cáo đủ dùng cho kế toán trưởng/giám đốc/in nội bộ.

Thiếu sót cần nâng cấp:

- CSV fallback chưa đủ.
- Chưa có Excel `.xlsx` thật.
- Một số print route động chưa QA đủ.
- Drilldown báo cáo chưa phủ hết công nợ/doanh thu/thanh toán/tạm ứng.

Việc cần làm:

1. Xây server-side Excel `.xlsx` builder.
2. Nâng cấp `/api/reports/audited-export`.
3. Tạo template A4 cho:
   - Công nợ phải thu/phải trả.
   - Tạm ứng/thanh toán/hoàn ứng/đối trừ.
   - Chi phí theo WBS.
   - Dự toán vs thực tế.
   - Lãi/lỗ công trình.
   - Sổ cái/nhật ký chung/bảng cân đối phát sinh.
4. Header báo cáo cần có:
   - Tên công ty.
   - Kỳ báo cáo.
   - Ngày in.
   - Người lập.
   - Người kiểm tra.
5. Format:
   - Tiền: `5.000.000.000 đ`.
   - Ngày: `dd/MM/yyyy`.
   - Tổng cộng cuối bảng.
   - Wrap text.
   - Freeze header.
   - In A4 ngang/dọc theo báo cáo.
6. Export phải audit server-side.

Kết quả mong muốn:

- Kế toán có thể xuất/in báo cáo không cần chỉnh tay nhiều.
- Báo cáo có thể dùng trong họp nội bộ.
- Không có export tài chính bypass audit.

## Phase 4 - UI nhập liệu nhanh kiểu MISA

Mục tiêu: kế toán thao tác nhanh bằng bàn phím, form dày, ít click, ít reload.

Thiếu sót cần nâng cấp:

- Chưa có voucher workspace chuẩn.
- Grid dòng chi tiết chưa đủ mạnh.
- Lookup công trình/WBS/NCC/hợp đồng/tài khoản/vật tư chưa đồng bộ kiểu nhập liệu nhanh.
- Chưa có bộ phím tắt nghiệp vụ đầy đủ.
- Bảng chưa đủ resize/hide/show/pin column ở mọi màn hình.

Việc cần làm:

1. Tạo voucher workspace cho:
   - Chi phí.
   - Hóa đơn.
   - Thanh toán.
   - Phiếu thu/phiếu chi/ngân hàng.
   - Tạm ứng/hoàn ứng.
   - Nhập/xuất kho.
2. Thêm toolbar kiểu nghiệp vụ:
   - Thêm.
   - Sửa.
   - Lưu.
   - Duyệt.
   - Ghi sổ.
   - In.
   - Xuất Excel.
3. Thêm phím tắt:
   - `Ctrl+S`: lưu.
   - `Ctrl+Enter`: lưu và thêm mới.
   - `F2`: sửa dòng.
   - `F3`: tìm nhanh.
   - `F4`: thêm dòng.
   - `Delete`: xóa dòng với confirm.
4. Grid dòng chi tiết:
   - Tab order chuẩn.
   - Lookup nhanh.
   - Tính tổng realtime.
   - Cảnh báo tại ô nhập.
5. Bảng danh sách:
   - Sticky header.
   - Sticky totals.
   - Column resize.
   - Show/hide column.
   - Saved filters.
   - Export audited.

Kết quả mong muốn:

- Gần trải nghiệm MISA/FAST hơn.
- Kế toán nhập liệu nhanh hơn.
- Ít lỗi thao tác hơn.

## Phase 5 - Workflow phê duyệt thật

Mục tiêu: chuyển approval UI pilot thành quy trình phê duyệt vận hành thật.

Thiếu sót cần nâng cấp:

- Chưa có workflow assignment table.
- Delegation/notification vẫn pilot.
- Bulk action chưa có backend batch/correlation id.
- SLA chưa cấu hình theo công ty/hạn mức.

Việc cần làm:

1. Thiết kế workflow assignment table.
2. Rule theo vai trò:
   - Kế toán viên.
   - Kế toán trưởng.
   - Giám đốc.
   - Admin.
3. Rule theo hạn mức tiền.
4. Không cho người tạo tự duyệt.
5. Thêm delegation backend.
6. Thêm notification backend.
7. Bulk approval có batch id.
8. Audit mọi approve/reject/delegate/bulk.

Kết quả mong muốn:

- Không thất lạc chứng từ chờ duyệt.
- Người duyệt có hàng đợi rõ.
- Có log đầy đủ khi kiểm toán.

## Phase 6 - Vận hành nội bộ, backup/restore, offline LAN

Mục tiêu: dùng ổn định cho 3-10 máy nội bộ.

Thiếu sót cần nâng cấp:

- Chưa có runbook vận hành LAN đầy đủ.
- Chưa có quy trình backup/restore được kiểm thử định kỳ.
- Build còn warning Turbopack NFT trace và `url.parse`.
- Prisma generate có thể bị Windows DLL lock.
- Cần kiểm tra cache invalidation số liệu kế toán.

Việc cần làm:

1. Viết hướng dẫn cài đặt LAN.
2. Viết backup PostgreSQL hằng ngày.
3. Viết restore drill định kỳ.
4. Test restore trên máy khác.
5. Chặn dev session ngoài dev.
6. Viết runbook xử lý Prisma DLL lock.
7. Giảm build warnings.
8. Test 3-10 máy truy cập cùng lúc.

Kết quả mong muốn:

- Có thể vận hành nội bộ an toàn.
- Có phương án khôi phục khi lỗi.
- Không phụ thuộc internet để chạy nội bộ.

## 5. Thứ tự làm tốt nhất

Nếu mục tiêu là dùng thật cho kế toán xây dựng, thứ tự nên là:

| Thứ tự | Việc cần làm | Vì sao |
| -----: | ------------ | ------ |
| 1 | Gửi package human approval cho kế toán/owner | Không có duyệt thật thì chưa thể tin dữ liệu nền. |
| 2 | Chạy lại Phase 2.9B sau khi nhận package | Kiểm tra validator trước khi apply. |
| 3 | Phase 2.7 apply chỉ khi owner xác nhận | Khóa mapping được duyệt vào hệ thống. |
| 4 | Backup/restore runbook | Trước khi dùng dữ liệu thật phải có đường khôi phục. |
| 5 | Excel `.xlsx` A4 reports | Kế toán/giám đốc cần báo cáo in/gửi được. |
| 6 | UI voucher workspace kiểu MISA | Tăng tốc nhập liệu và giảm lỗi thao tác. |
| 7 | Workflow backend thật | Vận hành duyệt chứng từ theo vai trò/hạn mức. |
| 8 | Engineering hardening | Dọn lint/type/build warning/performance. |
| 9 | LAN/offline hardening | Chạy ổn cho nhiều máy nội bộ. |

## 6. Việc chưa nên làm ngay

Không nên làm ngay:

- Không chạy apply nếu chưa có human approval hợp lệ.
- Không sửa DB/schema lớn trước khi khóa dữ liệu nền.
- Không nâng cấp UI lớn rồi dùng với dữ liệu chưa xác nhận.
- Không tuyên bố production ready.
- Không nhập dữ liệu thật quy mô lớn khi chưa có backup/restore.
- Không sửa AP Bát Tràng nếu chưa có quyết định kế toán.

## 7. Gợi ý prompt tiếp theo

## 7.1 Prompt cần dùng ngay

Sau khi kế toán/owner đã điền package, dùng prompt:

```text
Hãy thực hiện Phase 2.9B - Human Approval Completion Support & Validator Rerun.

Yêu cầu:
- Đọc lại `.local-audit-quarantine/human-approval-package/`.
- Kiểm tra 3 CSV approval đã được kế toán/owner điền.
- Phân loại từng dòng theo human approval rule.
- Kiểm tra `04_SIGN_OFF_FORM.md`.
- Chạy validator nếu có dòng human approval hợp lệ.
- Không chạy apply.
- Không sửa DB.
- Tạo báo cáo READY/NOT_READY cho Phase 2.7 apply.
```

## 7.2 Prompt sau khi validator PASS

```text
Hãy chuẩn bị Phase 2.7 Apply Approved Reconciliation Plan.

Yêu cầu:
- Chỉ lập kế hoạch apply, chưa chạy apply.
- Liệt kê chính xác dòng nào sẽ backfill Project.companyId.
- Liệt kê chính xác dòng nào sẽ backfill JournalEntry.projectId.
- Liệt kê dòng nào sẽ đánh dấu non-project nếu có.
- Liệt kê AP Bát Tràng action.
- Tạo backup checklist.
- Tạo rollback plan.
- Chờ owner xác nhận cuối cùng trước khi apply.
```

## 7.3 Prompt nâng cấp báo cáo Excel/A4

```text
Hãy thực hiện Sprint REPORT-1 - Excel XLSX A4 Accounting Reports.

Phạm vi:
- Nâng cấp báo cáo công nợ, tạm ứng/thanh toán, chi phí WBS, lãi/lỗ công trình, ledger.
- Export phải đi qua server-side audit.
- Tạo file `.xlsx` thật, không chỉ CSV.
- Format tiền Việt `5.000.000.000 đ`.
- Có header công ty, kỳ báo cáo, ngày in, người lập, tổng cộng.
- Không sửa source-of-truth báo cáo nếu chưa có yêu cầu riêng.
```

## 7.4 Prompt nâng cấp UI kiểu MISA

```text
Hãy thực hiện Sprint MISA-UX-1 - Voucher Workspace & Accounting Table Interaction.

Phạm vi:
- Nâng cấp UI nhập liệu và bảng danh sách cho cost, invoice, payment, cash-bank.
- Không sửa database schema.
- Không sửa posting engine.
- Không thay đổi source-of-truth báo cáo.
- Thêm voucher layout, sticky toolbar, grid dòng chi tiết, phím tắt, lookup nhanh, sticky totals.
- Format tiền `5.000.000.000 đ`, ngày `dd/MM/yyyy`.
```

## 8. Kết luận cuối

Bước tiếp theo bạn cần làm là gửi package human approval cho kế toán/owner và yêu cầu điền đủ. Đây là điều kiện bắt buộc trước khi dùng dữ liệu thật hoặc apply reconciliation.

Sau khi dữ liệu được duyệt và validator PASS, nên nâng cấp theo hai hướng:

1. Báo cáo Excel/A4 chuẩn kế toán.
2. UI nhập liệu chứng từ nhanh kiểu MISA.

Trạng thái hiện tại:

```text
WAITING_FOR_HUMAN_APPROVAL
NOT_PRODUCTION_READY
NEXT_ACTION_SEND_HANDOFF_PACKAGE_TO_ACCOUNTING_OWNER
```


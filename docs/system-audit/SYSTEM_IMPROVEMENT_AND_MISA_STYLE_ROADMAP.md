# SYSTEM IMPROVEMENT AND MISA-STYLE ROADMAP

Ngày lập: 2026-06-04  
Workspace: `D:\construction-erp`  
Mục tiêu: Đánh giá toàn bộ hệ thống hiện tại, xác định phần cần cải thiện/nâng cấp, và đề xuất bước tiếp theo để phù hợp với kế toán xây dựng và trải nghiệm thao tác gần các phần mềm kế toán Việt Nam như MISA/FAST.

## 1. Executive Summary

Hệ thống hiện tại đã có nền tảng ERP kế toán xây dựng khá rộng: công trình, WBS, dự toán, chi phí, hợp đồng, hóa đơn, thanh toán, tạm ứng/hoàn ứng, kho, thuế, sổ cái, audit log, phân quyền, báo cáo, workflow phê duyệt và UI pilot.

Sau các phase gần đây, phần UI/report/approval đã mạnh hơn rõ rệt:

- Dashboard, báo cáo, approvals, audit, print và drilldown đã có smoke/visual/e2e pilot.
- Export báo cáo pilot đã đi qua audited server-side export.
- Approval inbox đã có hàng đợi theo vai trò, SLA pilot, bulk safety và drawer chi tiết.
- Gói human approval Phase 2.8 đã được kiểm tra lại ở Phase 2.9.

Tuy nhiên hệ thống chưa nên dùng dữ liệu kế toán thật ở trạng thái hiện tại vì các quyết định dữ liệu nhạy cảm chưa được người thật xác nhận:

- 19 dòng Project -> Company chưa có human approval hợp lệ.
- 25 dòng CASH_BANK journal chưa có quyết định project/non-project.
- 26 dòng AP Bát Tràng chưa có quyết định nghiệp vụ hợp lệ.
- Chưa đủ điều kiện chạy lại Phase 2.7 apply.

Kết luận ngắn: hệ thống đã qua mức prototype thông thường và có nền tảng tốt, nhưng để phù hợp vận hành kế toán xây dựng thật và gần trải nghiệm MISA, cần ưu tiên khóa dữ liệu kế toán, chuẩn hóa quy trình chứng từ, nâng cấp báo cáo Excel/A4, hoàn thiện workflow phê duyệt thật, và cải thiện tốc độ thao tác bảng/form.

## 2. Current Maturity Scorecard

| Nhóm | Điểm hiện tại | Mức độ | Nhận xét |
| ---- | ------------: | ------ | -------- |
| Nền tảng kiến trúc | 7/10 | Khá | Có Next.js App Router, Prisma, service layer, RBAC, audit, ledger; nhưng còn nhiều module song song và debt kỹ thuật. |
| Database và dữ liệu kế toán | 6/10 | Chưa khóa | Schema rộng, có double-entry; nhưng còn human approval pending và một số source-of-truth cần khóa cứng. |
| Nghiệp vụ kế toán xây dựng | 6.5/10 | Có nền | Có công trình/WBS/hợp đồng/chi phí/thanh toán/tạm ứng/kho; cần chuẩn hóa vòng đời chứng từ và báo cáo theo công trình. |
| Sổ cái/ledger | 7/10 | Khá | Có posted journal và validation cân đối; cần liên kết chứng từ gốc sâu hơn và reconciliation apply có approval. |
| Báo cáo quản trị/kế toán | 6/10 | Pilot tốt | Có catalog, CSV audited, print debt/ledger; cần Excel `.xlsx`, mẫu A4 chuẩn, drilldown sâu và đối chiếu số liệu. |
| UI/UX kế toán | 6.5/10 | Pilot khá | Đã có table/action/approval hardening; cần thao tác nhanh hơn kiểu MISA: phím tắt, nhập liệu dày, inline lookup, voucher-centric. |
| Phân quyền/RBAC | 7/10 | Khá | Guard cơ bản pass; cần ma trận quyền chi tiết theo vai trò kế toán, kế toán trưởng, giám đốc, admin. |
| Audit log | 7/10 | Khá | Có audit/export/audit panel; cần mở rộng cho mọi thao tác nhạy cảm và tìm kiếm audit mạnh hơn. |
| Workflow phê duyệt | 6/10 | Pilot | UI approval tốt hơn; backend assignment, delegation, notification, batch approval chưa hoàn chỉnh. |
| Hiệu năng/offline LAN | 6.5/10 | Khá cho pilot | Build pass, LAN có tiềm năng; cần xử lý warning, cache invalidation, backup/restore và test 3-10 máy nội bộ. |
| Độ sẵn sàng production | 4/10 | Chưa sẵn sàng | Blocker lớn nhất là dữ liệu chưa được human approval và chưa hoàn thiện quy trình vận hành thật. |

## 3. What Is Already Good

## 3.1 Nền tảng nghiệp vụ rộng

Hệ thống đã có nhiều module mà một ERP kế toán xây dựng cần:

- Công trình/dự án.
- WBS/hạng mục.
- Dự toán.
- Chi phí.
- Hợp đồng.
- Hóa đơn.
- Thanh toán.
- Tạm ứng/hoàn ứng.
- Kho vật tư.
- Thuế.
- Sổ cái/bút toán.
- Báo cáo quản trị.
- Audit log.
- Phê duyệt.

Đây là lợi thế lớn vì không phải xây lại từ đầu. Việc cần làm tiếp theo là khóa chuẩn nghiệp vụ, dữ liệu và trải nghiệm nhập liệu.

## 3.2 Đã có double-entry accounting

Hệ thống có posted journal và transaction lines, đã từng chạy validation database cho thấy posted journal sample không lệch debit/credit. Đây là nền tảng bắt buộc để tạo báo cáo tài chính đáng tin.

Điểm cần nâng cấp là mọi báo cáo chính thức phải nhất quán với ledger posted hoặc policy approved/posted rõ ràng, không để DRAFT/PENDING trôi vào báo cáo chính thức.

## 3.3 UI pilot đã tiến bộ

Phase 3A đã cải thiện các vùng quan trọng:

- Bảng và action menu.
- Báo cáo/export/print.
- Audit log UI.
- Approval inbox.
- SLA/notification/delegation pilot.
- Visual/e2e matrix.

Để gần MISA hơn, cần chuyển từ “UI pilot đẹp hơn” sang “UI nhập liệu kế toán nhanh, dày, có phím tắt, lookup, chứng từ gốc, tổng hợp cuối bảng”.

## 4. Key Gaps Compared With Construction Accounting Needs

## 4.1 Dữ liệu chưa được người thật xác nhận

Đây là blocker P0. Phase 2.9 cho thấy chưa có human approval hợp lệ:

| Nhóm | Dòng cần xử lý | Human approved hợp lệ | Trạng thái |
| ---- | -------------: | --------------------: | ---------- |
| Project -> Company | 19 | 0 | Chờ owner/kế toán xác nhận |
| CASH_BANK Journal | 25 | 0 | Chờ kế toán ngân hàng/quỹ xác nhận |
| AP Bát Tràng | 26 | 0 | Chờ kế toán công nợ/phụ trách công trình xác nhận |

Ảnh hưởng thực tế:

- Có thể sai báo cáo theo công ty/công trình.
- Có thể sai cashflow theo công trình.
- Có thể sai công nợ phải trả Bát Tràng.
- Không đủ điều kiện apply reconciliation mapping.

Việc phải làm ngay: hoàn tất Phase 2.9 human approval follow-up, sau đó mới validator và xin xác nhận chạy Phase 2.7 apply.

## 4.2 Chứng từ chưa phải trung tâm trải nghiệm như MISA

Phần mềm kế toán kiểu MISA thường xoay quanh chứng từ: phiếu thu, phiếu chi, ủy nhiệm chi, hóa đơn, nghiệm thu, phiếu nhập/xuất kho, bút toán tổng hợp. Người dùng cần mở một số liệu là truy về chứng từ ngay.

Hệ thống hiện có nhiều module và drilldown pilot, nhưng cần nâng cấp:

- Mọi số liệu dashboard/report phải click về danh sách chứng từ nguồn.
- Mỗi bút toán ledger phải mở được chứng từ gốc.
- Mỗi chứng từ phải thấy lịch sử duyệt, lịch sử sửa, người tạo, người duyệt, kỳ kế toán.
- Mỗi chứng từ phải có vòng đời rõ: Nháp -> Chờ duyệt -> Đã duyệt -> Đã ghi sổ -> Đã hủy/Đảo.

## 4.3 Báo cáo chưa đạt chuẩn Excel/A4 kế toán thật

Hiện đã có CSV fallback và print pilot. Với kế toán thật, cần nâng lên:

- Excel `.xlsx` thật, không chỉ CSV.
- Header công ty chuẩn.
- Kỳ báo cáo, ngày in, người lập, người kiểm tra.
- Format tiền `5.000.000.000 đ`.
- Tổng cộng cuối bảng.
- Wrap text, freeze header, độ rộng cột hợp lý.
- In A4 ngang/dọc tùy báo cáo.
- Lặp header khi in.
- Có audit log xuất báo cáo.

Các báo cáo ưu tiên:

- Công nợ phải thu/phải trả theo công trình/NCC/khách hàng.
- Tạm ứng/thanh toán/hoàn ứng/đối trừ.
- Dự toán vs thực tế vs committed.
- Chi phí theo WBS.
- Lãi/lỗ công trình.
- Sổ cái, nhật ký chung, bảng cân đối phát sinh.
- Dòng tiền công trình.

## 4.4 Workflow phê duyệt mới ở mức pilot

UI approval đã khá hơn, nhưng để dùng thật cần backend workflow:

- Bảng assignment phê duyệt.
- Luồng theo vai trò và hạn mức.
- Ủy quyền có thời hạn.
- Thông báo thật.
- SLA theo công ty/phòng ban.
- Bulk approval có batch id và audit correlation id.
- Không cho người tạo tự duyệt chứng từ nhạy cảm.
- Không ghi sổ nếu chưa duyệt.

## 4.5 Thao tác kế toán chưa đủ nhanh

Muốn giống MISA, hệ thống cần tối ưu thao tác nhập liệu:

- Phím tắt: lưu, thêm dòng, xóa dòng, tìm nhanh, duyệt, in, xuất Excel.
- Form dạng chứng từ có grid dòng chi tiết.
- Lookup nhanh nhà cung cấp, hợp đồng, WBS, tài khoản, vật tư.
- Tab order hợp lý để nhập bằng bàn phím.
- Auto-fill thông tin theo hợp đồng/công trình/NCC.
- Cảnh báo lỗi ngay tại ô nhập.
- Không reload/F5 sau khi thêm/sửa/xóa.
- Bảng dữ liệu có filter, sort, pin column, column resize, export.

## 5. MISA-Style UX Target

Không cần sao chép giao diện MISA, nhưng nên học các nguyên tắc vận hành phù hợp kế toán Việt Nam:

## 5.1 Màn hình chính phải là workspace nghiệp vụ

Ưu tiên layout dạng phần mềm nghiệp vụ:

- Sidebar gọn, module rõ.
- Toolbar trên cùng có nút thao tác nhanh.
- Bảng dữ liệu dày, nhiều cột nhưng dễ scan.
- Bộ lọc kỳ/công ty/công trình luôn rõ.
- Tổng cộng cuối bảng.
- Action menu không bị che.
- Click số liệu mở chứng từ.

Không nên dùng nhiều hero/card marketing. ERP kế toán cần dày, rõ, thao tác nhanh.

## 5.2 Chứng từ cần có layout chuẩn

Mỗi form chứng từ nên có cấu trúc:

1. Header chứng từ:
   - Số chứng từ.
   - Ngày chứng từ.
   - Ngày hạch toán.
   - Kỳ kế toán.
   - Công ty.
   - Công trình.
   - Đối tượng.
   - Trạng thái.
2. Thông tin nghiệp vụ:
   - Hợp đồng.
   - WBS/hạng mục.
   - NCC/khách hàng.
   - Loại chi phí/doanh thu.
3. Grid chi tiết:
   - Tài khoản Nợ/Có.
   - Mã vật tư/hạng mục.
   - Diễn giải.
   - Số lượng.
   - Đơn giá.
   - Thành tiền.
   - VAT.
4. Footer:
   - Tổng trước thuế.
   - VAT.
   - Tổng thanh toán.
   - Đã thanh toán.
   - Còn phải thu/trả.
5. Audit/workflow:
   - Người lập.
   - Người duyệt.
   - Lịch sử sửa.
   - Link bút toán.

## 5.3 Bảng danh sách phải giống công cụ làm việc hằng ngày

Các bảng quan trọng cần có:

- Sticky header.
- Sticky footer tổng cộng.
- Column resize.
- Column hide/show.
- Search nhanh.
- Filter theo kỳ/công trình/NCC/trạng thái.
- Multi-select có guard.
- Phím tắt.
- Export audited.
- Không vỡ layout khi nhiều cột.
- Pagination hoặc virtualization.

## 5.4 Cảnh báo nghiệp vụ phải rõ kiểu kế toán

Ví dụ message nên rõ:

- “Không thể ghi sổ vì kỳ kế toán của ngày chứng từ đã bị khóa.”
- “Chứng từ chưa được duyệt nên chưa được ghi sổ.”
- “Số tiền thanh toán vượt giá trị còn phải trả của hóa đơn/hợp đồng.”
- “Không thể xóa chứng từ đã phát sinh bút toán. Hãy hủy/đảo chứng từ.”
- “Dòng này chưa có công trình/hạng mục, báo cáo công trình có thể bị lệch.”

## 6. Upgrade Roadmap

## Phase A - Khóa dữ liệu và readiness trước khi dùng thật

Mục tiêu: không sai dữ liệu nền khi chuyển sang vận hành thật.

Việc cần làm:

1. Hoàn tất human approval cho 70 dòng đang pending.
2. Chạy lại validator Phase 2.9 sau khi kế toán điền.
3. Nếu validator PASS, xin owner xác nhận chạy Phase 2.7 apply.
4. Apply mapping đã duyệt có audit.
5. Chạy validation database sau apply.
6. Tạo snapshot/backup trước và sau apply.
7. Chốt AP Bát Tràng.
8. Chốt CASH_BANK journal project/non-project.

Kết quả mong muốn:

- Không còn mapping nhạy cảm pending.
- Báo cáo theo công ty/công trình không bị lệch do mapping.
- Có bằng chứng người thật duyệt.
- Có thể chuyển sang hardening vận hành.

## Phase B - Chuẩn hóa chứng từ kế toán xây dựng

Mục tiêu: biến hệ thống thành app kế toán xây dựng dựa trên chứng từ.

Việc cần làm:

1. Chuẩn hóa vòng đời chứng từ cho cost, invoice, payment, advance, settlement, inventory, cash-bank.
2. Mỗi chứng từ phải có ngày chứng từ, ngày hạch toán, kỳ kế toán, công ty, công trình, WBS, đối tượng.
3. Không cho ghi sổ chứng từ chưa duyệt.
4. Không cho sửa trực tiếp chứng từ đã ghi sổ; chỉ cho hủy/đảo theo policy.
5. Mọi bút toán phải link về chứng từ gốc.
6. Mọi chứng từ phải có audit trail.
7. Chuẩn hóa trạng thái tiếng Việt.

Kết quả mong muốn:

- Luồng nhập liệu gần phần mềm kế toán thật.
- Số liệu report có thể truy ngược chứng từ.
- Giảm rủi ro sửa/xóa sai.

## Phase C - Báo cáo Excel/A4 và drilldown kế toán

Mục tiêu: báo cáo dùng được cho kế toán trưởng/giám đốc/in nội bộ.

Việc cần làm:

1. Xây server-side Excel `.xlsx` builder.
2. Tạo template A4 cho báo cáo công nợ, tạm ứng, chi phí WBS, lãi/lỗ công trình, ledger.
3. Thêm audit bắt buộc khi export.
4. Chuẩn hóa header công ty.
5. Thêm tổng cộng, số trang, ngày in, người lập.
6. Thêm drilldown từ mọi số liệu báo cáo về chứng từ.
7. Tạo test export Excel và print QA với sample an toàn.

Kết quả mong muốn:

- Kế toán có thể gửi/in báo cáo không phải chỉnh tay nhiều.
- Giám đốc click số liệu thấy nguồn gốc.
- Export không bypass audit.

## Phase D - UI nhập liệu nhanh kiểu MISA

Mục tiêu: kế toán thao tác nhanh, ít click, ít F5, ít mở nhiều tab.

Việc cần làm:

1. Thiết kế lại form chứng từ theo voucher layout.
2. Thêm grid dòng chi tiết có keyboard navigation.
3. Thêm lookup nhanh cho công trình, WBS, hợp đồng, NCC, tài khoản, vật tư.
4. Thêm phím tắt nghiệp vụ.
5. Thêm sticky toolbar và sticky totals.
6. Thêm column resize/show-hide.
7. Thêm inline validation.
8. Thêm saved filters theo người dùng.

Kết quả mong muốn:

- Nhập chứng từ nhanh hơn.
- Trải nghiệm quen với kế toán Việt Nam.
- Ít lỗi nhập liệu hơn.

## Phase E - Workflow backend thật

Mục tiêu: phê duyệt thật, không chỉ UI pilot.

Việc cần làm:

1. Thiết kế workflow assignment table.
2. Thêm rule theo vai trò/hạn mức.
3. Thêm delegation backend.
4. Thêm notification backend.
5. Thêm batch approval với correlation id.
6. Thêm audit cho approve/reject/delegate/bulk action.
7. Thêm SLA config theo công ty.

Kết quả mong muốn:

- Kế toán viên, kế toán trưởng, giám đốc có hàng đợi công việc rõ.
- Không thất lạc chứng từ chờ duyệt.
- Có log đầy đủ khi kiểm toán.

## Phase F - Vận hành nội bộ/offline LAN

Mục tiêu: chạy ổn cho 3-10 máy nội bộ.

Việc cần làm:

1. Viết runbook cài đặt LAN.
2. Chuẩn hóa backup/restore PostgreSQL.
3. Kiểm thử restore định kỳ.
4. Chặn dev session ngoài môi trường dev.
5. Xử lý Prisma generate Windows lock runbook.
6. Giảm build warnings.
7. Kiểm tra cache invalidation số liệu kế toán.
8. Kiểm thử tải với dữ liệu lớn.

Kết quả mong muốn:

- Có thể vận hành nội bộ an toàn.
- Có đường khôi phục khi lỗi.
- Không phụ thuộc internet/CDN.

## 7. Recommended Next Work

## 7.1 Việc nên làm ngay nhất

Nên làm tiếp:

```text
Phase 2.9B - Human Approval Completion Support & Validator Rerun
```

Lý do: Đây là blocker lớn nhất trước khi dùng dữ liệu thật. Nếu chưa có người thật duyệt 70 dòng đang pending, mọi nâng cấp UI/report tiếp theo vẫn chỉ là pilot vì dữ liệu nền chưa đáng tin.

Mục tiêu của Phase 2.9B:

1. Hỗ trợ kế toán/owner điền đúng package approval.
2. Kiểm tra không có approvedBy chung chung.
3. Kiểm tra approvedAt hợp lệ.
4. Kiểm tra decisionReason đủ nghiệp vụ.
5. Chạy validator nếu có dòng human-approved hợp lệ.
6. Kết luận có sẵn sàng xin owner chạy Phase 2.7 apply hay chưa.

Prompt đề xuất:

```text
Hãy thực hiện Phase 2.9B - Human Approval Completion Support & Validator Rerun.

Mục tiêu:
- Đọc lại package `.local-audit-quarantine/human-approval-package/`.
- Kiểm tra 3 CSV approval sau khi kế toán/owner đã điền.
- Phân loại từng dòng theo human approval rule.
- Chạy validator tương ứng nếu có human approval hợp lệ.
- Không chạy apply.
- Tạo báo cáo READY/NOT_READY cho Phase 2.7 apply.

Nguyên tắc:
- Không tự điền approvedBy.
- Không sửa DB.
- Không chạy apply script.
- Không sửa ledger/posting/payment.
- Nếu validator fail, ghi rõ dòng lỗi và cách kế toán cần sửa.
```

## 7.2 Nếu muốn nâng cấp giống MISA ngay sau khi dữ liệu được khóa

Nên làm:

```text
Sprint MISA-UX-1 - Voucher Workspace & Accounting Table Interaction
```

Mục tiêu:

- Thiết kế chuẩn layout chứng từ kế toán.
- Thêm toolbar kiểu nghiệp vụ.
- Thêm phím tắt.
- Thêm grid dòng chi tiết.
- Thêm lookup công trình/WBS/NCC/hợp đồng/tài khoản.
- Thêm sticky totals.
- Không sửa ledger nếu chưa có yêu cầu riêng.

Prompt đề xuất:

```text
Hãy thực hiện Sprint MISA-UX-1 - Voucher Workspace & Accounting Table Interaction.

Phạm vi:
- Chỉ nâng cấp UI nhập liệu và bảng danh sách cho cost/invoice/payment/cash-bank.
- Không sửa database schema.
- Không sửa posting engine.
- Không thay đổi source-of-truth báo cáo.
- Ưu tiên thao tác nhanh kiểu phần mềm kế toán Việt Nam:
  phím tắt, sticky toolbar, grid dòng chi tiết, lookup nhanh, sticky totals,
  format tiền `5.000.000.000 đ`, ngày `dd/MM/yyyy`.

Sau khi sửa:
- Chạy build.
- Chạy e2e smoke các màn hình đã sửa.
- Báo cáo file thay đổi và rủi ro còn lại.
```

## 7.3 Nếu muốn báo cáo giống MISA trước

Nên làm:

```text
Sprint REPORT-1 - Excel XLSX A4 Accounting Reports
```

Mục tiêu:

- Thay CSV fallback bằng Excel `.xlsx` thật cho nhóm báo cáo pilot.
- Giữ audited server-side export.
- Tạo template A4 có header công ty, kỳ báo cáo, tổng cộng, wrap text, format tiền Việt.

Prompt đề xuất:

```text
Hãy thực hiện Sprint REPORT-1 - Excel XLSX A4 Accounting Reports.

Phạm vi:
- Nâng cấp `/api/reports/audited-export` để hỗ trợ `.xlsx` cho báo cáo công nợ,
  tạm ứng/thanh toán, chi phí WBS, lãi/lỗ công trình và ledger.
- Không sửa query source-of-truth nếu chưa có yêu cầu.
- Không cho export nếu audit log thất bại.
- Tạo e2e/test kiểm tra file export có header công ty, format tiền Việt, tổng cộng.
```

## 7.4 Nếu muốn workflow thật

Nên làm:

```text
Phase 3B - Approval Workflow Backend & Delegation
```

Mục tiêu:

- Chuyển approval UI pilot thành workflow backend thật.
- Có assignment table, delegation, notification, SLA config, batch approval, audit correlation.

Prompt đề xuất:

```text
Hãy thiết kế và triển khai Phase 3B - Approval Workflow Backend & Delegation.

Yêu cầu:
- Trước khi sửa DB/schema phải đề xuất migration rõ ràng.
- Không phá approval UI hiện có.
- Không cho người tạo tự duyệt.
- Mọi approve/reject/delegate/bulk action phải có audit log.
- Có test cho role kế toán, kế toán trưởng, giám đốc, admin.
```

## 8. Priority Order

Thứ tự tốt nhất nếu mục tiêu là dùng thật cho kế toán xây dựng:

1. `Phase 2.9B - Human Approval Completion Support & Validator Rerun`
2. `Phase 2.7 Apply Approved Reconciliation` chỉ sau khi owner xác nhận
3. `Backup/Restore Runbook & Production Data Gate`
4. `Sprint REPORT-1 - Excel XLSX A4 Accounting Reports`
5. `Sprint MISA-UX-1 - Voucher Workspace & Accounting Table Interaction`
6. `Phase 3B - Approval Workflow Backend & Delegation`
7. `Sprint ENGINEERING-1 - Lint/Type/Build Warning Hardening`
8. `Performance/LAN Offline Hardening`

Không nên làm UI lớn trước khi dữ liệu nhạy cảm được duyệt, vì UI đẹp hơn không giải quyết được rủi ro sai báo cáo công trình/công nợ.

## 9. Final Recommendation

Nếu phải chọn một việc tiếp theo, chọn:

```text
Phase 2.9B - Human Approval Completion Support & Validator Rerun
```

Sau khi gói approval được người thật điền và validator PASS, mới nên xin owner cho chạy Phase 2.7 apply. Khi dữ liệu nền đã khóa, hệ thống nên chuyển sang hai nhánh nâng cấp song song:

- Nhánh kế toán: Excel `.xlsx` A4, drilldown chứng từ, báo cáo công nợ/tạm ứng/lãi lỗ công trình.
- Nhánh UI MISA-style: voucher workspace, bảng nhập liệu nhanh, phím tắt, lookup, sticky totals.

Trạng thái hiện tại:

```text
NOT_PRODUCTION_READY
WAITING_FOR_HUMAN_APPROVAL
READY_FOR_ROADMAP_EXECUTION_AFTER_DATA_GATE
```


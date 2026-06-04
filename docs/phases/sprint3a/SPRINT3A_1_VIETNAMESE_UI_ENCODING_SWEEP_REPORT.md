# SPRINT 3A.1 - VIETNAMESE UI & ENCODING SWEEP REPORT

## 1. Tóm tắt phạm vi

Sprint này chỉ xử lý text hiển thị, localization, encoding và định dạng tiền/ngày trong phạm vi UI/API message. Không sửa Prisma schema, không tạo migration, không chạy mapping, không sửa ledger, posting engine, payment allocation hoặc source-of-truth báo cáo.

## 2. Baseline đã kiểm tra

| Lệnh | Kết quả |
| --- | --- |
| `git status --short` | Repo đang có sẵn nhiều thay đổi chưa commit từ trước; Sprint này không revert các thay đổi ngoài phạm vi. |
| `git branch --show-current` | `main` |
| `git log -3 --oneline` | `211d31c fix loi`; `92f1dbc app_v2_pate7`; `d1a5b4f phase4a_business_workflow_data_integrity_audit` |
| `npx prisma validate` | Pass |
| `npm run build` | Pass khi chạy escalated; lần đầu bị sandbox chặn ghi `.next/trace`. |

## 3. Nhóm đã sửa

| Nhóm | Nội dung |
| --- | --- |
| Định dạng tiền Việt | Chuẩn hóa nhiều màn hình/API từ `VND`/`VNĐ` sang `đ`; cập nhật `formatVND`, `formatCurrency`, `formatShortVND`. |
| Ngày tháng | `formatDate` dùng `Intl.DateTimeFormat("vi-VN")`, có fallback tiếng Việt cho ngày trống/không hợp lệ. |
| Badge/trạng thái | Bổ sung nhãn tiếng Việt cho `PENDING`, `ISSUED`, `SENT`, `COMPLETED`, settlement statuses; bỏ raw code trong timeline/chứng từ kho. |
| API/export message | Sửa lỗi tiếng Việt trong export hóa đơn, phiếu thanh toán, thẻ kho, financial trace, route security, auth guard. |
| CSV/export | Header CSV hóa đơn/thanh toán/thẻ kho dùng tiếng Việt có dấu, tiền `đ`, ngày `vi-VN`, trạng thái đã map sang tiếng Việt. |
| Error message nghiệp vụ | Sửa các lỗi `Not found`, `Authentication required`, role/company/project access sang tiếng Việt rõ nghĩa. |
| UI text tiếng Anh | Bỏ `Read-only`, `Audit Trail`, `Submit/Approve/Reject`, raw status code ở các vùng đã chạm. |

## 4. File thay đổi chính

- `app/utils/format.ts`, `lib/math.ts`
- `app/components/ui-enterprise/status-labels.ts`
- `app/components/accounting/*Timeline.tsx`, `ReadonlyPostedBanner.tsx`
- `app/components/inventory/InventoryDocumentForm.tsx`, `InventoryDocumentTable.tsx`, `InventoryStatusTimeline.tsx`
- `app/api/export/invoice/[id]/route.ts`, `app/api/export/payment/[id]/route.ts`, `app/api/export/inventory/stock-card/route.ts`
- `lib/auth-guard.ts`, `lib/route-security.ts`, `lib/accounting/taxPolicy.ts`
- `services/*` liên quan message hiển thị: advance, approval inbox, inventory, cash-bank, tax invoice, revenue.

## 5. Kết quả scan sau sửa

| Scan | Kết quả |
| --- | --- |
| English API errors (`Not found`, `Project not found`, `Authentication required`, ...) | Không còn match trong `app/lib/services` theo pattern đã quét. |
| Raw status/user text (`(DRAFT)`, `(POSTED)`, `Read-only`, `VNĐ`, ` VND`) | Còn 1 comment không hiển thị đã được sửa; sau đó còn chủ yếu false positive/thuật ngữ báo cáo như `A/R AGING`, `TRIAL BALANCE`, `BANK BOOK`, hoặc text tiếng Việt hợp lệ. |
| Mojibake pattern | Còn nhiều false positive do regex bắt chữ Việt hợp lệ (`Âm`, `CÂN`, `LỖI XUẤT ÂM KHO`) và một số thuật ngữ kỹ thuật tiếng Anh có chủ đích. |

## 6. Validation kết thúc

| Lệnh | Kết quả | Ghi chú |
| --- | --- | --- |
| `npx prisma validate` | Pass | Schema hợp lệ, không đổi schema. |
| `npm run build` | Pass | Có warning cũ Turbopack NFT trace qua Prisma/audited export và warning Node `url.parse()`. |
| `npm run lint` | Fail | 1079 vấn đề lint tồn tại rộng trong repo, chủ yếu `no-explicit-any`, unused vars, hook lint. Không liên quan trực tiếp đến localization sprint. |

## 7. Rủi ro còn lại

- Một số thuật ngữ báo cáo tiếng Anh vẫn tồn tại có chủ đích hoặc cần quyết định sản phẩm: `A/R AGING`, `A/P AGING`, `TRIAL BALANCE`, `BANK BOOK`, `AVCO`.
- Một số file service lớn có nhiều nội dung AI/report cần sweep chuyên biệt nếu muốn Việt hóa 100% câu phân tích dài.
- Lint toàn repo chưa pass do nợ kỹ thuật cũ, cần sprint riêng nếu muốn gate CI sạch.
- Build warning Turbopack/NFT và `url.parse()` vẫn còn, không thuộc Sprint 3A.1.

## 8. Kết luận

Sprint 3A.1 đã hoàn thành phần pilot UI/localization trọng tâm: tiền Việt, ngày Việt, status tiếng Việt, CSV/export và API message chính. Hệ thống build được sau thay đổi. Chưa tuyên bố production ready vì còn lint debt và một số thuật ngữ báo cáo cần quyết định chuẩn hóa ở sprint tiếp theo.

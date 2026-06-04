# EXPORT PRINT AUDIT MATRIX

Ngày cập nhật: 2026-06-01

## 1. Tóm tắt Phase 2.5

Phase 2.5 đã khóa các đường in chứng từ high-risk trong `app/print/*` bằng cơ chế audit server-side trước khi tải dữ liệu in. Các helper export client-side legacy đã được đánh dấu non-financial only và có runtime guard chặn tên/metadata tài chính.

Kết quả script `scripts/validation/verify-export-print-audit-coverage.ts` sau Phase 2.5:

| Chỉ tiêu | Kết quả |
| --- | ---: |
| Tổng file có marker export/print/download | 15 |
| High-risk chưa audit | 0 |
| Trạng thái | PASS |

Kết quả script `scripts/validation/verify-no-financial-client-export.ts`:

| Chỉ tiêu | Kết quả |
| --- | ---: |
| Tổng findings | 15 |
| Forbidden financial client export | 0 |
| Audited wrapper | 10 |
| Guarded legacy helper | 1 |
| Allowed non-financial | 2 |
| Needs manual review | 2 |
| Trạng thái | PASS |

## 2. Cơ chế audit print

Endpoint mới:

| Endpoint | File | Chức năng |
| --- | --- | --- |
| `POST /api/print/audit` | `app/api/print/audit/route.ts` | Kiểm tra đăng nhập/RBAC/company/project, ghi AuditLog, chỉ trả success khi audit thành công |

Client hook:

| Hook/component | File | Chức năng |
| --- | --- | --- |
| `useAuditedPrint` | `app/components/accounting/AuditedPrintGate.tsx` | Gọi `/api/print/audit` trước khi trang print fetch dữ liệu nhạy cảm |
| `AuditedPrintStatus` | `app/components/accounting/AuditedPrintGate.tsx` | Hiển thị lỗi tiếng Việt nếu audit fail; không cho tải dữ liệu/in |

AuditLog lưu:

- `userId`
- `companyId`
- `projectId`
- `printType`
- `entityId`
- `route`
- `reason`
- `timestamp`
- `ipAddress`
- `userAgent`
- `format`

## 3. Print route lockdown

| Print route | Trước Phase 2.5 | Sau Phase 2.5 | Audit mechanism | Trạng thái |
| --- | --- | --- | --- | --- |
| `app/print/advance/[id]/page.tsx` | Fetch dữ liệu rồi `window.print` | Audit trước, fetch sau | `useAuditedPrint`, `printType=ADVANCE` | Đạt |
| `app/print/bank-transfer/[id]/page.tsx` | Fetch dữ liệu rồi `window.print` | Audit trước, fetch sau | `useAuditedPrint`, `printType=BANK_TRANSFER` | Đạt |
| `app/print/cash-payment/[id]/page.tsx` | Fetch dữ liệu rồi `window.print` | Audit trước, fetch sau | `useAuditedPrint`, `printType=CASH_PAYMENT` | Đạt |
| `app/print/cash-receipt/[id]/page.tsx` | Fetch dữ liệu rồi `window.print` | Audit trước, fetch sau | `useAuditedPrint`, `printType=CASH_RECEIPT` | Đạt |
| `app/print/debt/page.tsx` | Fetch dữ liệu rồi `window.print` | Audit trước, fetch sau | `useAuditedPrint`, `printType=DEBT` | Đạt |
| `app/print/inventory/issue/[id]/page.tsx` | Fetch dữ liệu rồi `window.print` | Audit trước, fetch sau | `useAuditedPrint`, `printType=INVENTORY_ISSUE` | Đạt |
| `app/print/inventory/receipt/[id]/page.tsx` | Fetch dữ liệu rồi `window.print` | Audit trước, fetch sau | `useAuditedPrint`, `printType=INVENTORY_RECEIPT` | Đạt |
| `app/print/invoice/[id]/page.tsx` | Fetch dữ liệu rồi `window.print` | Audit trước, fetch sau | `useAuditedPrint`, `printType=INVOICE` | Đạt |
| `app/print/ledger/page.tsx` | Fetch dữ liệu rồi `window.print` | Audit trước, fetch sau | `useAuditedPrint`, `printType=LEDGER` | Đạt |
| `app/print/payment/[id]/page.tsx` | Fetch dữ liệu rồi `window.print` | Audit trước, fetch sau | `useAuditedPrint`, `printType=PAYMENT` | Đạt |

## 4. Export route/helper lockdown

| File | Trước | Sau | Trạng thái |
| --- | --- | --- | --- |
| `app/services/export.service.ts` | `exportToCsv` client-side dùng chung | Thêm `legacyExportCsvNonFinancialOnly` và `assertNonFinancialClientExport`; `exportToCsv` chỉ là wrapper deprecated | Đạt |
| `lib/export.ts` | `exportToJSON/exportToCSV` client-side không guard | Thêm runtime guard chặn keyword tài chính/kế toán | Đạt |
| `app/services/audited-export.service.ts` | Wrapper audited export | Giữ làm đường chuẩn cho export tài chính | Đạt |
| `app/api/reports/audited-export/route.ts` | Server-side audited export | Giữ làm source export tài chính chính | Đạt |

## 5. Đường còn manual review

Không còn high-risk chưa audit.

Các đường còn cần review nghiệp vụ nhưng không bị phân loại forbidden financial usage:

| File | Lý do | Hướng xử lý |
| --- | --- | --- |
| `app/components/Header.tsx` | Có nút `window.print` toàn trang; chưa xác định là print tài chính cụ thể | Ẩn ở màn hình tài chính hoặc chuyển sang audited print nếu dùng cho chứng từ |
| `app/wbs/WBSListScreen.tsx` | Export WBS client-side; WBS có thể liên quan dự toán | Chuyển sang endpoint audited nếu coi là báo cáo tài chính/dự toán chính thức |

## 6. Kết luận

Mục tiêu "high-risk chưa audit = 0" đã đạt theo script validation. Các đường in chứng từ tài chính trong `app/print/*` không còn tự tải dữ liệu nhạy cảm trước khi audit server-side thành công.

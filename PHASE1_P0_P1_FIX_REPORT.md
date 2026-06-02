# PHASE1 P0/P1 FIX REPORT

## 1. Tóm tắt đã sửa

Phase 1 đã xử lý các lỗi P0/P1 trực tiếp gây sai kỳ kế toán, sai doanh thu/chi phí/cashflow chính thức, overpay/double submit payment, export báo cáo không audit và duplicate active JournalEntry.

Các nhóm thay đổi chính:

- `lib/accounting/postingEngine.ts`: bắt buộc `accountingDate`, kiểm tra khóa kỳ theo ngày chứng từ, set `JournalEntry.date` theo ngày chứng từ, chặn reverse chứng từ thuộc kỳ khóa.
- `services/revenue.service.ts`, `lib/validations.ts`, `app/api/payments/route.ts`: bắt buộc `requestId`, khóa invoice bằng `FOR UPDATE`, transaction `Serializable`, reserve allocation `DRAFT/ACTIVE`, bỏ tạo `Revenue` khi payment còn `DRAFT`.
- `services/financial-aggregation.service.ts`, `app/api/reports/financial/route.ts`, `app/api/reports/audited-export/route.ts`: báo cáo chính thức dùng ledger posted hoặc chứng từ approved/posted theo policy, không cộng DRAFT/PENDING.
- `app/reports/page.tsx`, `lib/route-security.ts`: export tài chính đi qua endpoint server-side audited export; audit log phải thành công trước khi trả file.
- `prisma/migrations/20260601090000_phase1_active_journal_unique/migration.sql`: thêm partial unique index `JournalEntry_active_source_unique`.
- `scripts/validation/verify-*.ts`: thêm 5 script kiểm chứng Phase 1.

Migration/index đã được áp dụng bằng:

```bash
npx prisma db execute --file prisma/migrations/20260601090000_phase1_active_journal_unique/migration.sql --schema prisma/schema.prisma
```

Không reset database, không xóa dữ liệu thật. Có phát hiện 1 cặp journal lịch sử cùng `sourceType/sourceId` khi chỉ xét `deletedAt IS NULL`; cặp này không còn active theo nghĩa kế toán vì index áp dụng trên `deletedAt IS NULL AND isReversed = false`.

Rollback index:

```sql
DROP INDEX IF EXISTS "JournalEntry_active_source_unique";
```

## 2. Danh sách lỗi đã xử lý

| ID | Vấn đề | Trạng thái | File sửa | Cách kiểm chứng |
| -- | ------ | ---------- | -------- | --------------- |
| P0-01 | PostingEngine dùng ngày hiện tại để kiểm tra kỳ khóa | Đã sửa | `lib/accounting/postingEngine.ts`, callers posting | `verify-period-lock-posting.ts`, `npm run build` |
| P0-02 | Payment DRAFT sinh Revenue | Đã sửa | `services/revenue.service.ts` | `verify-payment-idempotency-overpay.ts` |
| P0-03 | Monthly/financial report cộng DRAFT/PENDING | Đã sửa phần báo cáo chính thức trong Phase 1 | `services/financial-aggregation.service.ts`, `app/api/reports/financial/route.ts`, `app/api/reports/audited-export/route.ts` | `verify-draft-not-in-financial-report.ts`, build |
| P0-04 | Payment double submit/overpay | Đã sửa | `services/revenue.service.ts`, `lib/validations.ts`, `app/api/payments/route.ts` | `verify-payment-idempotency-overpay.ts`, build |
| P1-01 | Export báo cáo bypass audit client-side | Đã sửa đường export trang Reports | `app/reports/page.tsx`, `app/api/reports/audited-export/route.ts`, `lib/route-security.ts` | `verify-audited-export-required.ts`, e2e smoke |
| P1-03 | Unique `[sourceType, sourceId, deletedAt]` không chặn NULL duplicate | Đã sửa bằng partial unique index active ledger | migration SQL, `verify-journal-entry-active-unique.ts` | DB script pass |
| P1-02 | Message nghiệp vụ Phase 1 còn lỗi tiếng Việt/tiếng Anh | Đã sửa các message chính trong file Phase 1 | posting/payment/report/export touched files | build + kiểm tra thủ công diff |

## 3. Accounting Policy sau khi sửa

- Cost chính thức: chỉ được tính vào báo cáo tài chính chính thức khi đã có posted ledger unreversed. Cost operational preview vẫn có thể xem từ bảng nghiệp vụ, nhưng không phải nguồn chính thức.
- Invoice chính thức: doanh thu chính thức lấy từ ledger posted tài khoản `511*`; invoice DRAFT/PENDING không làm tăng doanh thu chính thức.
- Payment chính thức: cashflow/công nợ chính thức lấy từ ledger posted và allocation ACTIVE sau duyệt; payment DRAFT chỉ reserve hạn mức để chống overpay, không tạo Revenue.
- Monthly report: dùng `TransactionLine` với `getPostedLedgerLineFilter({ projectId })`; không query trực tiếp `CostRecord`, `Invoice`, `Payment`.
- Trial balance/balance sheet/export: dùng posted ledger. VAT summary chỉ lấy cost `APPROVED` và `workflowStatus` `APPROVED/POSTED`.
- Revenue table: được coi là legacy/operational, không phải source of truth cho báo cáo tài chính chính thức.

## 4. Database Integrity

- Đã thêm partial unique index:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS "JournalEntry_active_source_unique"
ON "JournalEntry" ("sourceType", "sourceId")
WHERE "deletedAt" IS NULL AND "isReversed" = false AND "sourceType" IS NOT NULL AND "sourceId" IS NOT NULL;
```

- Lý do dùng `isReversed = false`: dữ liệu lịch sử có reversal cùng source; về kế toán, journal đã reversed không còn là active ledger. Điều kiện này chặn duplicate bút toán đang hiệu lực mà không phá dữ liệu đảo bút toán cũ.
- Kết quả `verify-journal-entry-active-unique.ts`: pass, không có duplicate active và index tồn tại.
- Không có dữ liệu thật bị xóa.

## 5. Test Results

| Lệnh | Kết quả | Ghi chú |
| ---- | ------- | ------- |
| `git status` | Pass | Worktree có nhiều file dirty từ trước; Phase 1 chỉ thêm/sửa file liên quan và report/script. |
| `npx prisma validate` | Pass | Schema hợp lệ. |
| `npx prisma generate` | Pass khi chạy ngoài sandbox | Lần đầu fail `spawn EPERM` do sandbox; chạy escalated pass. |
| `npm run build` | Pass | Có warning Turbopack/NFT trace `next.config.ts` và deprecation `url.parse`, không chặn build. |
| `npm run lint` | Fail do lỗi cũ toàn repo | 812 errors, chủ yếu `no-explicit-any`, `no-require-imports`, React hook lint ở nhiều module ngoài Phase 1. |
| `npm run validation:database` | Pass khi chạy ngoài sandbox | Sandbox fail vì không ghi được `docs/audit/phase1-readonly-validation.json`; escalated pass. |
| `npm run e2e -- tests/e2e/enterprise-smoke.spec.ts` | Pass | 3/3 tests pass. |
| `verify-period-lock-posting.ts` | Pass | Posting dùng ngày chứng từ/accountingDate. |
| `verify-payment-idempotency-overpay.ts` | Pass | requestId bắt buộc, reserve DRAFT/ACTIVE, không tạo Revenue từ DRAFT. |
| `verify-draft-not-in-financial-report.ts` | Pass | Monthly report dùng ledger posted. |
| `verify-audited-export-required.ts` | Pass | Export trang Reports đi qua server-side audit. |
| `verify-journal-entry-active-unique.ts` | Pass | Không có duplicate active, index tồn tại. |

## 6. Rủi ro còn lại

- `npm run lint` vẫn fail do nợ kỹ thuật cũ toàn repo; không xử lý trong Phase 1 để tránh refactor lan man.
- Còn nhiều endpoint export/print khác ngoài trang Reports cần audit server-side toàn diện trong phase báo cáo/export.
- Các luồng advance/settlement/AR/AP ledger chưa được chuẩn hóa đầy đủ trong Phase 1.
- Một số message tiếng Việt mojibake còn tồn tại ngoài vùng file Phase 1.
- Warning build về Turbopack NFT trace và `url.parse()` cần xử lý riêng vì liên quan cấu hình/runtime, không phải lỗi Phase 1.
- Dữ liệu lịch sử có journal cùng source khi không xét `isReversed`; cần báo cáo reconciliation riêng nếu muốn làm sạch dữ liệu cũ.

## 7. Đề xuất Phase 2

1. Chuẩn hóa mô hình hợp đồng - nhà cung cấp - công trình - WBS, bắt buộc link chứng từ gốc.
2. Chuẩn hóa tạm ứng, hoàn ứng, đối trừ và AR/AP ledger.
3. Audit toàn bộ endpoint export/print ngoài `/reports`.
4. Thiết kế report reconciliation giữa ledger và bảng nghiệp vụ cho cost/invoice/payment/advance.
5. Làm sạch encoding tiếng Việt toàn hệ thống và chuẩn hóa error format.

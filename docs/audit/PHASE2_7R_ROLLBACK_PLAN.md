# PHASE 2.7R ROLLBACK / CLEANUP PLAN

Ngày lập: 2026-06-02  
Phạm vi: Phase 2.6/2.7 reconciliation mapping đã được AI gắn nhãn phê duyệt bởi "Kế toán Trưởng" nhưng chưa có xác nhận người thật.

## 1. Nguyên tắc

- Không tự rollback dữ liệu khi chưa có xác nhận owner/kế toán thật.
- Không xóa audit log kế toán đã ghi; nếu quyết định cũ sai, tạo log đính chính thay vì xóa dấu vết.
- Không sửa query báo cáo chính thức để cộng chứng từ `DRAFT`.
- Không đưa mapping CSV, dump dữ liệu hoặc file debug tạm vào repo chia sẻ nếu có dữ liệu thật.
- Mọi bước rollback dưới đây là kế hoạch có điều kiện, không phải thao tác đã thực hiện.

## 2. Nhóm dữ liệu có thể cần rollback

### 2.1 Backfill `Project.companyId` cho 18 project test/hardening

Bằng chứng:

- `docs/audit/phase26-project-company-apply-result.json`: đã cập nhật 18 project.
- `docs/audit/phase27r-forensic-data.json`: 18 project được phân loại `SAFE_TEST_BACKFILL`, đều có `costs = 0`, `invoices = 0`, `payments = 0`, `journals = 0`.
- Các dòng mapping dùng `approvedBy = "Kế toán Trưởng"` nhưng chưa chứng minh là kế toán thật.

Đánh giá:

- Không thấy ảnh hưởng sổ thật vì các project này không có phát sinh kế toán.
- Vẫn cần owner xác nhận đây là dữ liệu test/hardening trước khi coi là hợp lệ.

Rollback SQL đề xuất nếu owner không xác nhận:

```sql
-- CHỈ CHẠY SAU KHI OWNER/KẾ TOÁN THẬT XÁC NHẬN ROLLBACK.
-- Mục tiêu: trả lại trạng thái chưa scope company cho 18 project test/hardening đã được AI approve.
BEGIN;

UPDATE "Project"
SET "companyId" = NULL
WHERE "id" IN (
  '091ba671-4cdf-4b8d-84c7-240d21692824',
  '7c8fa82c-1344-4a49-881d-7e0d38267b63',
  'c1f8d981-2be1-438f-8eec-82dea6ac687e',
  '975c1f22-5aaa-418f-9696-c68cbc3cd283',
  'b36f16ef-0419-4aba-a405-6e174f475d8f',
  '51644eab-34d4-446d-8843-a3c69b593e4a',
  'f2ee65a1-d338-4cef-9cc5-2cc3c453f2e8',
  '89dfb5f8-330c-434c-a12a-a78c81267158',
  '6986c4d0-8eb0-4f43-96cc-a9463e86c5ab',
  'c6ebeb6b-dfec-43fb-ae9e-282d266a3deb',
  'd5c0b467-fdb9-4668-8d12-796fff4288cf',
  'b0d32c00-1711-4e0e-8ae5-917905eb6d47',
  '3f579fe6-5aad-4348-b49d-411f121e6cb1',
  '3d61f59a-e7e6-40d1-8be7-8c44f7ee0916',
  'eb50f4aa-09bb-433b-8049-4ae44a3b7b5c',
  '8056bf95-1055-4e81-84e6-08bd2d5bb35b',
  '2d5210bd-e265-4632-82cc-526cc204ef1f',
  '54efc369-7a16-4bd8-adba-b1938585c19b'
);

COMMIT;
```

Sau rollback phải chạy lại:

```bash
npx tsx scripts/validation/verify-project-company-scope.ts
npm run validation:database
```

### 2.2 25 journal `CASH_BANK` bị đánh dấu `NON_PROJECT_FINANCE`

Bằng chứng:

- `docs/audit/phase26-journal-project-apply-result.json`: `updated = 0`, `markedNonProject = 25`.
- Validation hiện tại vẫn cảnh báo 25 posted journal thiếu `projectId`.
- `docs/audit/phase27r-forensic-data.json` phân loại forensic: 8 dòng `REVERSED_TRACE_ONLY`, 17 dòng `POSSIBLY_PROJECT_RELATED`.

Đánh giá:

- Không có cập nhật `JournalEntry.projectId`, nên không cần rollback trường dữ liệu chính.
- Có rủi ro semantic audit vì hệ thống đã ghi log `DATA_RECONCILIATION_NON_PROJECT` theo quyết định AI.
- Không nên xóa audit log. Nếu owner bác bỏ quyết định này, cần ghi audit log đính chính hoặc tạo bản review mới.

Kế hoạch đính chính nếu owner bác bỏ:

1. Lập danh sách 25 journal từ `docs/audit/phase26-journal-project-apply-result.json`.
2. Tạo audit event mới loại `DATA_RECONCILIATION_REVIEW_CORRECTION`.
3. Nội dung ghi rõ: quyết định `NON_PROJECT_FINANCE` trước đó do AI tạo, chưa đủ bằng chứng, chuyển về `MANUAL_REVIEW`.
4. Cập nhật workbook mapping về trạng thái cần review thủ công, sau khi có yêu cầu sửa file.

### 2.3 AP Bát Tràng

Bằng chứng:

- `docs/reconciliation/project-battrang-ap-reconciliation.draft.csv`: 26 dòng đều có `mappingAction = FIX_RECONCILIATION_QUERY`.
- `docs/audit/phase27r-forensic-data.json`: `project-battrang` vẫn `companyId = null`, có 14 cost, 13 invoice, 11 payment, 26 journal.
- `verify-ar-ap-ledger-reconciliation.ts`: còn variance AP cho `project-battrang` là 8.286.592.

Đánh giá:

- Chưa đủ bằng chứng để sửa query chính thức theo hướng cộng chứng từ `DRAFT`.
- Không rollback DB vì chưa thấy thao tác apply trực tiếp cho AP.
- Giữ trạng thái manual review; nếu cần đối chiếu legacy, phải tách rõ báo cáo forensic/legacy khỏi báo cáo tài chính chính thức.

## 3. Cleanup repo/git đề xuất

Không tự thực hiện trong Phase 2.7R. Cần owner xác nhận trước khi xóa hoặc rewrite commit.

File/rủi ro cần xem xét loại khỏi repo chia sẻ:

- `scripts/reconciliation/dump-db.json`: có thể là dump dữ liệu.
- `scripts/reconciliation/dump-db.ts`, `search-battrang.ts`, `check-cashdoc.ts`, `list-companies.ts`, `list-projects.ts`, `search-contracts.ts`, `search-journals.ts`, `test-*.ts`, `view-ap-draft.ts`, `write-*.ts`: script điều tra tạm, cần phân loại trước khi giữ.
- `docs/reconciliation/*.draft.csv`: mapping reconciliation có thể chứa dữ liệu kế toán thật.
- `docs/audit/phase26-*-apply-result.json`, `docs/audit/phase27r-forensic-data.json`: audit forensic có dữ liệu nhạy cảm nội bộ.
- `generated/prisma-client/query_engine-windows.dll.node.tmp*`: file tạm Prisma engine, không nên commit.
- `playwright-report/index.html`: artifact test, không nên commit nếu không cần lưu bằng chứng.

Cleanup đề xuất sau khi owner xác nhận:

```bash
git rm --cached generated/prisma-client/query_engine-windows.dll.node.tmp*
git rm --cached playwright-report/index.html
git rm --cached scripts/reconciliation/dump-db.json
```

Nếu dữ liệu nhạy cảm đã vào commit đã push, cần chọn một trong hai hướng:

1. Repo nội bộ chưa chia sẻ rộng: tạo commit cleanup, bổ sung `.gitignore`, hạn chế quyền truy cập repo.
2. Repo đã chia sẻ/public: cần quy trình purge history, rotate secret nếu phát hiện secret, và xuất lại audit artifact vào kho bảo mật nội bộ.

## 4. Điều kiện mở lại Phase 3

Chỉ nên mở Phase 3 thật khi đã có đủ:

1. Owner/kế toán thật ký xác nhận 18 project test backfill được giữ.
2. 25 journal thiếu project được phân loại lại bằng chứng từ chứng từ gốc, hoặc giữ manual review.
3. AP Bát Tràng có quyết định kế toán rõ: sửa dữ liệu nghiệp vụ, giữ legacy forensic mode, hoặc tạo bút toán điều chỉnh hợp lệ.
4. Repo được dọn file tạm/dump/mapping nhạy cảm theo chính sách nội bộ.
5. Validation P1 về scope/reconciliation/source trace không còn bị bỏ qua bằng nhãn AI approval.

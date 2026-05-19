# ROOT_CAUSE_ANALYSIS.md (Enterprise Production Audit)

## 0. Tóm tắt sự kiện (mismatch quan sát)
Trong runtime/E2E smoke test, hệ thống lỗi do **DB actual không có** các phần enterprise module dù prisma migrate “success” theo log:
- `User.role` (Auth bootstrap 500)
- Table `public.AuditLog` (Audit logging fail)
- Relation/Table `Notification` (Notifications API fail)
- Table `public.FiscalPeriod` (Fiscal periods API fail)

Các lỗi tương ứng được ghi nhận từ console/server log và Playwright.

---

## 1. KIẾN TRÚC DATABASE THỰC TẾ

### 1.1 DATABASE đang dùng (theo runtime env)
- Đã kiểm tra `DATABASE_URL` qua môi trường terminal:
  - `DATABASE_URL="postgresql://postgres:123456@localhost:5432/construction_erp"`

→ Runtime đang nhắm tới database: **PostgreSQL database `construction_erp`, schema `public`**, host `localhost:5432`.

### 1.2 Schema được connect runtime vs schema kỳ vọng từ Prisma
Mình dùng `prisma db pull --print` để lấy schema thực tế mà Prisma nhìn thấy từ DB:
- DB actual **có** subset module lõi như: `User, Project, Task, WBSItem, CostRecord, BudgetRecord, Revenue, Invoice, Payment`.
- DB actual **không có**:
  - cột `User.role`
  - table `AuditLog`
  - relation/table `Notification`
  - table `FiscalPeriod`

Đây là bằng chứng trực tiếp cho các lỗi Prisma runtime:
- Auth: `prisma.user.findFirst({ where: { role: ... } })` → thất bại vì cột `User.role` không tồn tại.
- Audit logging: `prisma.auditLog.create()` → thất bại vì `public.AuditLog` không tồn tại.
- Notifications: query dùng `Notification` relation → thất bại vì relation không tồn tại.
- Fiscal period: `prisma.fiscalPeriod.findMany()` → thất bại vì table không tồn tại.

### 1.3 Migration history trong DB
Attempt kiểm tra `prisma_migrations` bằng query đã trả lỗi:
- `P1014 The underlying table for model prisma_migrations does not exist.`

→ Indication: bảng `prisma_migrations` không tồn tại trong DB actual.

**Hệ quả audit quan trọng**:
- Prisma có thể đã chạy migrate ở một thời điểm/chi nhánh khác, hoặc có DB schema/migrations state không đồng bộ.
- Khi không có `prisma_migrations`, việc “drift detection / migrate success” trong terminal không đủ để khẳng định DB hiện tại đã có toàn bộ DDL enterprise tables.

---

## 2. DANH SÁCH MISMATCH

### 2.1 Prisma schema/model vs DB actual (mismatch xác nhận)
1) **User.role**
- Runtime lỗi: `Invalid prisma.user.findFirst() invocation: The column User.role does not exist in the current database.`
- DB actual (db pull) cho thấy model `User` không có field `role`.

2) **AuditLog**
- Runtime lỗi: `The table public.AuditLog does not exist in the current database.`
- Trong code: `services/audit.service.ts` dùng `prisma.auditLog.create()` và `prisma.auditLog.findMany()`.
- DB actual (db pull) không hiển thị `AuditLog` model/tables.

3) **Notification**
- Runtime lỗi: raw query thất bại với `relation "Notification" does not exist`.
- Route `app/api/workspace/notifications/route.ts` gọi `NotificationService.getUnread()`.
- DB actual không có module Notification.

4) **FiscalPeriod**
- Runtime lỗi: `prisma.fiscalPeriod.findMany()` → `The table public.FiscalPeriod does not exist`.
- Route `app/api/fiscal-periods/route.ts` truy vấn `prisma.fiscalPeriod` và có logic auto-seed khi table trống.
- DB actual không có `FiscalPeriod` table.

### 2.2 Chênh lệch “migration expectation” vs “DB actual”
- `prisma migrate reset --force` đã chạy và “Applying migration ... Database reset successful”.
- Tuy nhiên, DB actual vẫn thiếu các tables/columns enterprise module.

→ Mismatch khả nghi: **DB đang được reset/migrate không giống DB mà runtime đang query**, hoặc migration pipeline có thực thi DDL không tạo các table đó (hoặc tạo xong nhưng bị ghi đè/đổi database/schema).

---

## 3. PHÂN TÍCH AUTH FLOW

### 3.1 Auth bootstrap flow
File: `app/api/auth/session/route.ts`
- Nếu không cung cấp email:
  - gọi `prisma.user.findFirst({ where: { role: UserRole.SUPER_ADMIN } })`
- Nếu không có user:
  - tạo user với `role`.
- Tạo session: `SessionManager.createSession(user.id, user.role)`.

### 3.2 Fail point
- Fail xảy ra ở bước `findFirst({ where: { role: ... } })` vì DB actual không có cột `role`.
- Kéo theo:
  - `POST /api/auth/session` trả 500
  - client nhận JSON parse error: `Unexpected end of JSON input`

---

## 4. PHÂN TÍCH AUDIT LOGGING

### 4.1 AuditService flow
File: `services/audit.service.ts`
- `prisma.auditLog.create({ data: {...} })`
- catch error và chỉ log console error (không throw).

### 4.2 Fail point
- Prisma runtime báo `public.AuditLog` không tồn tại.
- Vì nhiều endpoint/guard gọi assertAuthenticated → AuditService.log → fail dồn dập → server noisy và API dễ lỗi cascade.

---

## 5. PHÂN TÍCH NOTIFICATION SYSTEM

### 5.1 Route
File: `app/api/workspace/notifications/route.ts`
- `GET`: `NotificationService.getUnread(userId)`
- `POST`: mark read/unread

### 5.2 Fail point
- Runtime error raw query: `relation "Notification" does not exist`.
- Như vậy, NotificationService đang query vào một relation/table không tồn tại trong DB actual.

---

## 6. PHÂN TÍCH FISCAL PERIOD

### 6.1 Route
File: `app/api/fiscal-periods/route.ts`
- `GET`: `prisma.fiscalPeriod.findMany({ orderBy: { month: "asc" }})`
- Nếu rỗng: seed 12 months bằng `prisma.fiscalPeriod.createMany(...)`

### 6.2 Fail point
- DB actual không có `FiscalPeriod` table, nên cả `findMany` lẫn `createMany` đều thất bại.

---

## 7. PHÂN TÍCH ROOT CAUSE CHÍNH

### Root cause chính (đã có bằng chứng mức cao)
**DB actual đang được runtime kết nối là `construction_erp` nhưng schema enterprise module (AuditLog/Notification/FiscalPeriod) và field `User.role` không tồn tại trong DB actual.**

Bằng chứng:
- `prisma db pull --print` trả schema thực tế thiếu các phần đó.
- Runtime errors khớp 1:1 với thiếu cột/table/relation.

### Nguyên nhân gốc rễ kiến trúc (khả năng cao cần xác nhận thêm)
Một trong các nguyên nhân sau (chưa fix, chỉ khoanh vùng):
1) **Mismatch DB state**: migrations enterprise đã không được áp dụng vào DB `construction_erp` mà runtime đang dùng.
2) **Migration tracking không tồn tại**: bảng `prisma_migrations` không tồn tại trong DB actual ⇒ trạng thái migrations có thể không được ghi chuẩn, hoặc migration áp dụng ở DB/instance khác.
3) **Có nhiều DB/connection target** trong pipeline (ví dụ: env/compose/kết nối khác nhau giữa `migrate` và runtime).
4) **Migrate reset nhưng sau đó bị thay đổi DB** (ví dụ: restore snapshot, change DATABASE_URL lúc runtime, hoặc code dùng một datasource khác).

### Ảnh hưởng dây chuyền
- Auth bootstrap fail làm gần như toàn bộ API bị chặn/401/500.
- Audit logging fail gây lỗi cascade/console noise và làm guard/event flow suy giảm.
- Notifications và FiscalPeriod API fail làm UI/header/dashboard/locking workflow không hoạt động.
- /api/health trả 503 ⇒ monitoring/e2e bị fail.

### Mức độ nghiêm trọng
- **Critical** (hệ thống không sẵn sàng chạy production/testing doanh nghiệp)

---

## 8. Gợi ý hướng điều tra tiếp (không sửa code)
Để chốt 100% “migrate success vì đâu mà DB actual thiếu”, cần thêm:
1) Kiểm tra danh sách bảng/column trong DB actual bằng introspection query (bắt đầu từ `information_schema`).
2) So sánh toàn bộ `prisma/migrations/*/migration.sql` cho các migration tạo AuditLog/Notification/FiscalPeriod/User.role.
3) Xác định migrate đã apply ở DB nào (có thể kiểm tra file/command history hoặc CI log nếu có).
4) Tìm nơi có hardcode/override datasource runtime (ngoài DATABASE_URL) nếu tồn tại.

---

## 9. Trạng thái
- Report này đã xác định được mismatch mạnh: runtime DB actual thiếu các phần enterprise.
- Chưa chốt được chính xác “migrations áp dụng ở đâu/ở thời điểm nào” do thiếu `prisma_migrations` table trong DB actual.


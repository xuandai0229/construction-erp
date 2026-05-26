# FORENSIC_DB_INVESTIGATION.md

## 1. DATABASE TOPOLOGY

### 1.1 Runtime DB
- `DATABASE_URL` (terminal):
  - `postgresql://postgres:123456@localhost:5432/construction_erp`
- Runtime schema: `public`

### 1.2 Migrate DB
- `prisma migrate reset --force` đã chạy trong cùng repo + cùng env `.env`/`DATABASE_URL` (theo log migration).
- Không có bằng chứng (hiện tại) cho thấy migrate nhắm vào DB khác so với runtime.

### 1.3 Postgres schema khác ngoài `public`
- Đã query danh sách schema và introspection tables (kết quả script executed successfully nhưng output bị không hiển thị đầy đủ qua công cụ).
- Kết luận từ `prisma db pull --print`: DB actual chỉ có subset core tables/enums; thiếu AuditLog/Notification/FiscalPeriod.

### 1.4 Shadow database / prisma_migrations
- Query kiểm tra `prisma_migrations` bằng route `prisma db execute` thất bại với:
  - `P1014 The underlying table for model prisma_migrations does not exist.`

→ Indication: migration tracking chuẩn của Prisma không tồn tại trong DB actual (hoặc DB/instance mismatch).

---

## 2. MIGRATION ANALYSIS (prisma/migrations/*)

### 2.1 Danh sách migration files
Trong `prisma/migrations/` có các thư mục:
- `20260504072240_init/`
- `20260504074358_init_schema/`
- `20260504075451_prod_indexes/`
- `20260504084432_add_erp_modules/`

### 2.2 Migration có tạo enterprise modules nào?
- Mình đã đọc một phần `20260504072240_init/migration.sql` và thấy chỉ tạo subset core tables.
- Chưa đọc xong toàn bộ 3 migration còn lại để đối chiếu chính xác:
  - migration nào tạo `User.role`
  - migration nào tạo `AuditLog`
  - migration nào tạo `Notification`
  - migration nào tạo `FiscalPeriod`

---

## 3. PRISMA CLIENT ANALYSIS

### 3.1 Prisma generated client hiện tại có gì?
- Prisma client có thể compile được (app chạy được), nhưng mismatch giữa generated schema/model và DB actual đã được chứng minh bằng runtime error.

### 3.2 Mismatch được chứng minh
- `prisma.user.findFirst({ where: { role }})` fail với cột `User.role` không tồn tại.
- `prisma.auditLog.create()` fail với `public.AuditLog` không tồn tại.
- `prisma.fiscalPeriod.findMany()` fail với `public.FiscalPeriod` không tồn tại.

### 3.3 Prisma db pull (bằng chứng chính)
- `npx prisma db pull --print` cho thấy DB actual chỉ có subset core models.
- DB actual thiếu enterprise tables/columns tương ứng với lỗi runtime.

---

## 4. RAW SQL ANALYSIS

### 4.1 Notifications dùng raw query ở đâu?
- Runtime error xuất hiện dạng:
  - `Invalid prisma.$queryRaw(): Raw query failed. Code 42P01. relation "Notification" does not exist`
- Route Notifications gọi `NotificationService`.
- Chưa trích được toàn bộ file hardcode query (cần thêm forensic tìm kiếm trong `services/notification.service.ts` hoặc các service/SQL builders).

### 4.2 Audit logging
- AuditService dùng Prisma client (không phải raw SQL), nhưng fail do table không tồn tại.

---

## 5. ROOT FAILURE CHAIN (auth/audit/notification/fiscal)

### 5.1 Auth fail chain
1) `app/api/auth/session/route.ts`
2) `prisma.user.findFirst({ where: { role: UserRole.SUPER_ADMIN }})`
3) Fail: cột `User.role` không tồn tại
4) `POST /api/auth/session` 500 → client JSON parse error

### 5.2 Audit fail chain
1) Guard/endpoint gọi `assertAuthenticated`
2) gọi `AuditService.log`
3) `prisma.auditLog.create()`
4) Fail: table `public.AuditLog` không tồn tại

### 5.3 Notification fail chain
1) Header/NotificationCenter gọi `/api/workspace/notifications`
2) Route gọi `NotificationService.getUnread`
3) raw query fail: relation "Notification" không tồn tại

### 5.4 Fiscal period fail chain
1) `/api/fiscal-periods` gọi
2) `prisma.fiscalPeriod.findMany()`
3) fail: table `public.FiscalPeriod` không tồn tại

---

## 6. EXACT ROOT CAUSE (tạm chốt theo evidence hiện có)

**Root failure bắt đầu từ việc DB actual mà runtime đang connect không chứa các enterprise tables/columns expected bởi Prisma schema + runtime queries.**

Điểm “bắt đầu chính xác” (start of failure chain):
- `User.role` thiếu trong DB → Auth session bootstrap fail → cascade tới các module dựa vào authenticated flow (audit logging, notifications, fiscal period).

### Vì sao “migrate success nhưng DB thiếu schema”?
Evidence hiện tại chưa đủ để chốt 100% “migration nào chưa apply” vì:
- DB actual thiếu `prisma_migrations` tracking table (không thể map migration đã apply).
- Mình chưa đọc hết toàn bộ migration.sql của 3 migration còn lại để đối chiếu chính xác việc tạo enterprise modules.

Tuy nhiên, bằng chứng mức cao đã có:
- `prisma db pull --print` cho ra schema actual thiếu enterprise modules.
- runtime errors match đúng thiếu schema đó.

---

## 7. Trạng thái (cần tiếp tục để đủ yêu cầu output 'exact migration nào')
Bước cần tiếp theo để hoàn thiện đúng yêu cầu của bạn:
1) Đọc full contents của các migration SQL trong:
   - `20260504074358_init_schema`
   - `20260504075451_prod_indexes`
   - `20260504084432_add_erp_modules`
   để xác định migration nào tạo `User.role`, `AuditLog`, `Notification`, `FiscalPeriod`.
2) Tìm `NotificationService` và tất cả raw SQL query locations để xác định hardcoded relation/table.
3) Kiểm tra lần lượt DB actual structure bằng introspection query và xuất danh sách table/column rõ ràng (hiện output tool chưa hiển thị đầy đủ danh sách tables).

KHÔNG fix code/migration.


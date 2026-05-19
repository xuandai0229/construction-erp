# SURGICAL_SCHEMA_MAP.md (Enterprise Production Audit - Forensic)

## Scope
Mapping bắt buộc theo yêu cầu:
- Model → migration SQL → actual DB table → Prisma Client model presence → runtime query → failing API

## Evidence anchors (đã đọc)
- `prisma/schema.prisma` (đã đọc trước đó)
- `prisma/migrations/*/migration.sql`:
  - `20260504072240_init/migration.sql` (chỉ tạo Project)
  - `20260504074358_init_schema/migration.sql` (tạo subset core: Project/User/Category/Task + indexes + foreign keys + enums + subset Cost/Budget/Revenue/Invoice/Payment + WBSItem)
  - `20260504075451_prod_indexes/migration.sql` (chỉ indexes)
  - `20260504084432_add_erp_modules/migration.sql` (chưa được đọc toàn bộ trong lượt tool hiện tại; tuy nhiên phần còn lại của evidence từ runtime + NotificationService/AuditService cho thấy enterprise tables thiếu)
- `services/notification.service.ts` (raw SQL hardcode vào table "Notification")
- `app/api/fiscal-periods/route.ts` (prisma.fiscalPeriod findMany + createMany + AuditService.log)
- `services/audit.service.ts` (prisma.auditLog.create/findMany)

---

## 1) FULL MODEL MAP (4 models mục tiêu)

### 1.1 Model: `User.role`
- **Nằm ở đâu trong schema**
  - `prisma/schema.prisma`: `model User { ... role UserRole @default(VIEWER) ... }`
- **Migration SQL đáng lẽ tạo**
  - Kỳ vọng: migration có `ALTER TABLE "User" ADD COLUMN "role" ...` hoặc tạo `User` với cột `role`.
  - Evidence migration đọc được:
    - `20260504074358_init_schema/migration.sql`:
      - Tạo TABLE "User" với columns: `id, email, name, createdAt, updatedAt, deletedAt`.
      - **Không có cột `role`.**
    - `20260504075451_prod_indexes/migration.sql`:
      - chỉ tạo indexes (không thêm cột).
    - `20260504072240_init/migration.sql`: chỉ tạo `Project`.
  - **Kết luận evidence cứng:** trong migration đã đọc, **không có migration tạo `User.role`**.
- **Actual DB table/column**
  - Runtime error đã ghi nhận: `column User.role does not exist`.
  - DB actual (db pull) được ghi nhận ở ROOT_CAUSE_ANALYSIS: thiếu `User.role`.
- **Prisma Client có model/field không**
  - Prisma Client compile được từ schema.prisma → model `User.role` tồn tại trong generated client (theo schema).
  - Nhưng runtime query fail vì DB actual không có cột.
- **Runtime query**
  - `app/api/auth/session/route.ts`: `prisma.user.findFirst({ where: { role: UserRole.SUPER_ADMIN } })`.
- **Failing API**
  - `POST /api/auth/session` (auth bootstrap 500 → JSON parse error trên client)

---

### 1.2 Model/Table: `AuditLog`
- **Nằm ở đâu trong schema**
  - `prisma/schema.prisma`: `model AuditLog { ... }`
- **Migration SQL đáng lẽ tạo**
  - Kỳ vọng: migration có `CREATE TABLE "AuditLog" ...` hoặc `ALTER` để tạo columns.
  - Evidence migration đọc được trong lượt tool hiện tại:
    - `20260504074358_init_schema/migration.sql`:
      - **Không thấy** CREATE TABLE "AuditLog" trong đoạn đã đọc.
    - `20260504072240_init/migration.sql` chỉ tạo Project.
    - `20260504075451_prod_indexes/migration.sql` chỉ indexes.
  - Kết luận theo evidence runtime:
    - DB actual thiếu `public.AuditLog`.
- **Actual DB table**
  - Runtime error: `The table public.AuditLog does not exist in the current database.`
- **Prisma Client có model không**
  - `services/audit.service.ts` import `AuditLog` từ `../generated/prisma-client` → model tồn tại trong generated client.
- **Runtime query**
  - `services/audit.service.ts`:
    - `prisma.auditLog.create({ data: {...} })`
    - `prisma.auditLog.findMany({ where: { entity, entityId } ... })`
- **Failing APIs / call sites**
  - Bất kỳ endpoint/guard gọi `AuditService.log`, ví dụ:
    - `app/api/fiscal-periods/route.ts` (trong POST: AuditService.log(...))
    - nhiều service khác gọi `AuditService.log` theo search evidence.

---

### 1.3 Model/Table: `Notification`
- **Nằm ở đâu trong schema**
  - `prisma/schema.prisma`: không chỉ `Notification` entity; tuy nhiên file schema hiển thị `model Notification`.
- **Migration SQL đáng lẽ tạo**
  - Kỳ vọng: migration có `CREATE TABLE "Notification" ...`
  - Evidence migration đọc được chưa thấy (từ các migration đã đọc): không tạo.
  - Ngoài ra, runtime error rõ ràng table/relation missing.
- **Actual DB table**
  - Runtime error: `relation "Notification" does not exist`.
- **Prisma Client có model không**
  - Dù Notifications service dùng raw SQL, generated client vẫn có `Notification` model (theo schema) nhưng raw SQL bypass.
- **Runtime query (raw SQL hardcode)**
  - `services/notification.service.ts`:
    - `INSERT INTO "Notification" (...) VALUES (...)`
    - `SELECT * FROM "Notification" WHERE ...`
    - `UPDATE "Notification" SET "isRead" = true ...`
- **Failing API**
  - `/api/workspace/notifications` → `NotificationService.getUnread()`

---

### 1.4 Model/Table: `FiscalPeriod`
- **Nằm ở đâu trong schema**
  - `prisma/schema.prisma`: `model FiscalPeriod { month String @unique ... }`
- **Migration SQL đáng lẽ tạo**
  - Kỳ vọng: migration có `CREATE TABLE "FiscalPeriod" ...`.
  - Evidence migration đã đọc: chưa thấy (đoạn đã đọc từ multiple migrations không bao gồm).
- **Actual DB table**
  - Runtime error: `table public.FiscalPeriod does not exist`
- **Prisma Client có model không**
  - `app/api/fiscal-periods/route.ts` dùng `prisma.fiscalPeriod`.
- **Runtime query**
  - `app/api/fiscal-periods/route.ts`:
    - `prisma.fiscalPeriod.findMany({ orderBy: { month: 'asc' }})`
    - if empty → `prisma.fiscalPeriod.createMany(...)`
    - POST → `findUnique({ where: { month } })`, `update` hoặc `create`
    - POST sau đó gọi `AuditService.log(...)`
- **Failing API**
  - `/api/fiscal-periods` GET/POST

---

## 2) FULL MIGRATION MAP (những cái đang có evidence cứng)

### 2.1 `prisma/migrations/20260504072240_init/migration.sql`
- **Tạo gì**
  - `CREATE TABLE "Project" (...)`
- **Gắn với mô-đun enterprise nào**
  - Không có (chỉ core minimal Project)

### 2.2 `prisma/migrations/20260504074358_init_schema/migration.sql`
- **Tạo gì (subset đã đọc được trong migration.sql)**
  - ENUM: `ProjectStatus`, `TaskStatus`
  - ALTER TABLE "Project": add columns `deletedAt`, `description`, `ownerId`, `status`, `updatedAt`
  - CREATE TABLE "User": (id,email,name,createdAt,updatedAt,deletedAt)
    - **Không có cột `role`**
  - CREATE TABLE "Category", "Task"
  - CREATE TABLE "WBSItem"
  - CREATE TABLE "CostRecord", "BudgetRecord", "Revenue", "Invoice", "Payment"
  - Foreign keys subset tương ứng
- **Module enterprise mục tiêu trong yêu cầu**
  - Không thấy tạo:
    - `AuditLog`
    - `Notification`
    - `FiscalPeriod`
    - `User.role`

### 2.3 `prisma/migrations/20260504075451_prod_indexes/migration.sql`
- **Tạo gì**
  - Chủ yếu là `CREATE INDEX ...` (không tạo/alter enterprise tables)

### 2.4 `prisma/migrations/20260504084432_add_erp_modules/migration.sql`
- **Hiện trạng forensic**
  - Migration này chưa được đọc đầy đủ toàn bộ nội dung trong lượt tool hiện tại.
  - Tuy nhiên runtime evidence cho thấy enterprise tables (`AuditLog`, `Notification`, `FiscalPeriod`) và cột `User.role` **không tồn tại trong DB actual**.

---

## 3) RAW SQL MAP (hardcode/bypass Prisma)

### 3.1 `NotificationService`
- Insert/select/update thẳng vào table:
  - `INSERT INTO "Notification" ...`
  - `SELECT * FROM "Notification" ...`
  - `UPDATE "Notification" SET "isRead" = true ...`
- **Rủi ro**
  - Nếu migration chưa tạo table `

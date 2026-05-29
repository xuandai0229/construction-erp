# PHASE 2.8: PRODUCTION SAFETY POLICY

## A. Environment Policy

* **Môi trường & Biến**: Hệ thống phân định rõ `APP_ENV` thành `local`, `development`, `staging`, và `production`.
* **Khóa Production**: Nếu `NODE_ENV=production` hoặc `APP_ENV=production`, hệ thống sẽ tự động khóa toàn bộ các thao tác nguy hiểm (Destructive operations).
* **Cấm script**: Tuyệt đối không cho phép chạy các script seed/demo/reset trên Production.
* **Cấm thao tác ngầm**: Không cho restore production nếu thiếu `confirmationToken` và `ALLOW_PRODUCTION_RESTORE=true`.
* **Bảo mật Secret**: Không cho phép tạo Backup chứa `.env` hoặc credentials. Hệ thống không log ra database URL hay bất kỳ passwords, tokens nào.

## B. Dangerous Operation Policy

Các hành động sau BẮT BUỘC phải đi qua lớp Guard bảo mật:
1. Restore database toàn phần.
2. Delete các thực thể cấp cao: Project, User.
3. Hard delete chứng từ kế toán: Invoice, Payment, CostRecord, Advance, Settlement (Cấm hoàn toàn, chỉ cho phép Void/Reversal).
4. Xóa/Reset DB (`prisma migrate reset`, `seed`).
5. Data remediation scripts.

**Yêu cầu Guard:**
* Bắt buộc kiểm tra Authorization (Role `SUPER_ADMIN`).
* Chế độ `dry-run` là mặc định cho mọi script sửa đổi diện rộng.
* Bắt buộc có token hoặc confirmation phrase xác nhận.
* Ghi nhận 100% vào Audit Log.

## C. Backup & Restore Policy

**Backup:**
* **Quyền hạn**: Chỉ `SUPER_ADMIN` mới được phép trigger backup.
* **Metadata**: Backup zip/json bắt buộc đi kèm metadata file:
  * `generatedAt`, `generatedBy`
  * `appVersion`, `schemaVersion`
  * `databaseProvider` (PostgreSQL)
  * `checksum`
* **Loại trừ**: Backup KHÔNG chứa `.env`, `.git`, `node_modules` hay bất kì key nhạy cảm nào.
* Bắt buộc log sự kiện tạo Backup.

**Restore:**
* **Chế độ an toàn**: `dry-run` = true là mặc định.
* **Env Gates**: Để chạy thật, biến `ALLOW_RESTORE=true` bắt buộc phải được thiết lập. Tại môi trường Prod, biến `ALLOW_PRODUCTION_RESTORE=true` là điều kiện kiên quyết.
* **Xác thực dữ liệu**: Bắt buộc phải pass qua bước Checksum và Migration Compatibility Validation.
* **Confirmation**: Bắt buộc nộp `confirmationToken`.
* Nếu có chế độ phá hủy dữ liệu cũ (destructive mode) thì cần double confirmation và có backup cục bộ trước khi đè lên.

## D. Health & Readiness Policy

* **Health (Liveness)**: Dành cho cân bằng tải (Load Balancers / K8s). Trả về trạng thái `ok`, app name, timestamp. Công khai nhưng tuyệt đối không lộ secret.
* **Readiness (Readiness)**: 
  * DB connection state.
  * Prisma migration status (nếu an toàn).
  * Kiểm tra sự hiện diện của các biến môi trường lõi (`DATABASE_URL`, `NEXTAUTH_SECRET`).
  * Chỉ public status chung `ready: boolean`. Detail check yêu cầu Auth hoặc chỉ trả về log nội bộ.

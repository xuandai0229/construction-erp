# PRODUCTION DEPLOYMENT CHECKLIST

## A. Before Deploy

- [ ] **Git clean**: Kiểm tra `git status` đảm bảo working tree clean, đang ở branch release.
- [ ] **Build pass**: Chạy `npm run build` thành công mà không có Type errors.
- [ ] **Prisma validate**: Chạy `npx prisma validate` thành công.
- [ ] **Migrate status**: Chạy `npx prisma migrate status` kiểm tra không có Migration Drift.
- [ ] **Security routes pass**: `npm run security:routes` trả về PASS (Mọi route đều Auth).
- [ ] **Validation database**: Chạy `npm run validation:database` đảm bảo Data Integrity của phiên bản trước là hoàn hảo.
- [ ] **Financial check**: Chạy `npm run financial-check` xác minh không có lỗi kế toán Level 3.
- [ ] **E2E pass**: Toàn bộ E2E Test Suite chạy thành công.
- [ ] **Backup created**: Đã chạy Snapshot Backup thủ công/tự động trước khi deploy.
- [ ] **Env variables checked**: Đảm bảo `NODE_ENV=production` và `APP_ENV=production`.
- [ ] **No debug secrets**: Kiểm tra không log ra password / tokens trong console (Code audit pass).
- [ ] **No mock data**: Xác nhận Management Reports / Dashboards chỉ gọi từ DB thật (Đã verify trong Sprint 2.7).

## B. Deploy

- [ ] **Pull code**: `git pull origin main` hoặc checkout tag version.
- [ ] **Install deps**: `npm ci` (Tránh thay đổi package-lock ngầm định).
- [ ] **Apply migrations safely**: `npx prisma migrate deploy` (TUYỆT ĐỐI KHÔNG DÙNG `db push` HOẶC `migrate reset`).
- [ ] **Build**: `npm run build` (Nếu build tại server).
- [ ] **Start app**: Restart tiến trình Next.js (PM2 / Docker / Systemd).
- [ ] **Run health/readiness**: Gọi thử `/api/health` và `/api/readiness` -> Nhận `{ status: "ok", ready: true }`.
- [ ] **Run smoke tests**: Truy cập URL Dashboard, kiểm tra trạng thái đăng nhập.
- [ ] **Check logs**: Quan sát log PM2/Docker xem có Exception loop hay crash không.

## C. After Deploy

- [ ] **Validate dashboard**: Dashboard load được số liệu, không bị crash trắng trang.
- [ ] **Validate login/auth**: Đăng nhập bằng tài khoản Kế toán trưởng & Super Admin bình thường.
- [ ] **Validate approval inbox**: Luồng duyệt chứng từ hoạt động.
- [ ] **Validate export/print**: Thử Export 1 Ledger / 1 Hóa đơn ra file bình thường.
- [ ] **Check audit logs**: Kiểm tra Audit Log có bắt được sự kiện duyệt/tạo mới không.
- [ ] **Confirm no cross-tenant leak**: Kiểm tra công ty A không nhìn thấy dữ liệu công ty B.

## D. Rollback Plan

- [ ] **Identify last good commit**: Tìm tag version cũ hoặc commit cũ trước lúc deploy.
- [ ] **Stop app**: Stop tiến trình (PM2 stop / docker stop).
- [ ] **Restore code**: `git checkout <commit_hash>`.
- [ ] **Database rollback**: 
      * Nếu không có migrate nào phá vỡ (destructive): Đơn giản là Restart App ở code cũ.
      * Nếu có destructive migrate (Drop column): Yêu cầu **Restore Database** từ bản Backup được lấy ở bước A bằng script Restore (Yêu cầu `SUPER_ADMIN` + `ALLOW_PRODUCTION_RESTORE=true`).
- [ ] **Run readiness**: Đảm bảo App khởi động lại lên trạng thái `ready`.
- [ ] **Notify stakeholders**: Thông báo cho Team Leader và User về việc Rollback thành công.

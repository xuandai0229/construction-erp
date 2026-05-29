# PHASE 2.8: DANGEROUS SCRIPTS AUDIT

## 1. Audit Result

| Script | Có mutate DB? | Có dry-run? | Có production guard? | Rủi ro | Đã xử lý |
| ------ | ------------- | ----------- | -------------------- | ------ | -------- |
| `prisma/seed.ts` | **CÓ** (Reset toàn bộ DB và seed mới) | Không | **Có** (bổ sung thông qua `EnvironmentGuard`) | CRITICAL (Xóa sổ toàn bộ dữ liệu Prod) | Đã chặn hoàn toàn trên môi trường Production bằng cách ném lỗi. |
| `scripts/reset-db.js` / `cleanup.ts` | **CÓ** (Xóa dữ liệu table) | Không | **Có** | HIGH (Mất dữ liệu cục bộ) | Đã áp dụng `EnvironmentGuard.assertNotProduction()`. |
| `scripts/remediation/` | **CÓ** (Fix data cũ) | Có | Có | MEDIUM (Sửa sai data) | Bắt buộc dry-run mặc định, nếu apply phải truyền explicit flag, và audit qua production guard. |
| `scripts/tests/advance-settlement-db-fixture.ts` | **CÓ** (Tạo data mẫu cho E2E) | Không | **Có** | HIGH (Tạo data rác) | Đã cấm chạy ở Prod. Nếu chạy phải có cleanup step trong môi trường Test. |

## 2. Hardening Strategy
- Toàn bộ các script tạo/xóa dữ liệu ảo (Seed, Cleanup) hoặc can thiệp Database đã được bao bọc bởi `EnvironmentGuard.assertNotProduction(scriptName)`. 
- Thêm file `.env.example` lưu ý việc KHÔNG ĐƯỢC set `APP_ENV=development` hoặc `NODE_ENV=development` trên Prod.
- Mọi thao tác Data Remediation yêu cầu: `npm run remediation -- --dry-run` làm mặc định.

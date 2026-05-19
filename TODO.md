
## Giai đoạn 1 — Khởi động hệ thống
- [ ] npm install
- [ ] prisma generate
- [ ] prisma migrate
- [x] npm run dev
- [x] Nếu lỗi startup: ghi log/stack/screenshot (KHÔNG fix)
- [x] Tạo STARTUP_AUDIT.md

## Điều tra gốc rễ kiến trúc (Root Cause)
- [x] Audit: mismatch DB actual vs Prisma schema/runtime queries
- [x] Tạo ROOT_CAUSE_ANALYSIS.md
- [x] Tạo FORENSIC_DB_INVESTIGATION.md
- [ ] Tạo SURGICAL_SCHEMA_MAP.md (full model/migration/raw SQL mapping)
- [ ] SURGICAL_SCHEMA_MAP: hoàn thiện đọc full migration `20260504084432_add_erp_modules/migration.sql`

## Giai đoạn 2 — Tạo data enterprise quy mô lớn
- [ ] Xác định seed script hiện có (seed_erp.ts / prisma/seed_*.ts / scripts/enterprise-*.ts)
- [ ] Tạo data có liên kết logic xuyên module
- [ ] Nhét edge cases: thiếu/dư/trùng/âm/cực lớn/timeline nhiều năm
- [ ] Tạo SEED_DATA_AUDIT.md (thống kê + edge case coverage)

## Giai đoạn 3 — Test toàn bộ hệ thống (E2E theo người dùng thật)
- [ ] Map toàn bộ menu/route/page/dialog/modal/table/chart/dashboard/AI box/form/button/action
- [ ] Chạy E2E bằng trình duyệt thật (Playwright + manual)
- [ ] Thu thập console error, network failed/duplicated, hydration/memory leak/infinite render
- [ ] Tạo E2E_TEST_LOGS.md

## Giai đoạn 4 — UI/UX audit
- [ ] Kiểm tra responsive: desktop/tablet/mobile
- [ ] Kiểm tra loading/skeleton/empty state/overflow/dark mode
- [ ] Kiểm tra thuật ngữ nghiệp vụ xây dựng & kế toán
- [ ] Tạo UI_UX_ISSUES.md

## Giai đoạn 5 — Business logic audit
- [ ] Kiểm tra: công nợ/dòng tiền/ngân sách/lãi lỗ/tiến độ/khối lượng/tồn kho/nhập xuất kho
- [ ] Kiểm tra: phân bổ chi phí/giá vốn/margin/VAT/retention/hợp đồng/tạm ứng/quyết toán
- [ ] Kiểm tra: realtime/refresh/cache/optimistic/race/double submit
- [ ] Tạo BUSINESS_LOGIC_ISSUES.md

## Giai đoạn 6 — Kỹ thuật
- [ ] Kiểm tra console/warn/hydration
- [ ] Kiểm tra performance: slow render, duplicated fetch
- [ ] Kiểm tra auth/permission/security/validation
- [ ] Tạo TECH_ISSUES.md

## Giai đoạn 7 — Stress test
- [ ] Dữ liệu cực lớn + nhiều tab
- [ ] Spam click/concurrent/refresh liên tục/network delay
- [ ] Tạo STRESS_TEST_REPORT.md

## Giai đoạn 8 — Báo cáo tổng hợp
- [ ] Tạo AUDIT_REPORT_FINAL.md với format bắt buộc
- [ ] Chỉ báo cáo, KHÔNG sửa code


# PHASE 2.8: PRODUCTION READINESS AUDIT

## 1. Mức độ sẵn sàng hiện tại

| Khu vực | Hiện trạng | Rủi ro | Đề xuất hardening |
| ------- | ---------- | ------ | ----------------- |
| **`.env`** | Không có khóa/môi trường rõ ràng giữa DEV/PROD. | Rủi ro chạy nhầm script destructive lên Prod. | Bổ sung biến `APP_ENV` và `NODE_ENV=production`. |
| **Next.js & Build** | Tốt, Pass 100%. | Đôi khi cache NextJS chưa optimize cho production. | Thiết lập strict mode & build cache. |
| **Prisma Migration** | OK, schema up to date. | Chưa chặn `migrate reset` hoặc `db push` ở Prod. | Cần tạo env guard ở các lệnh Prisma trong package.json. |
| **Backup/Restore Routes** | Chưa có route API quản lý qua UI. | Không thể khôi phục nhanh nếu xảy ra sự cố. | Viết `app/api/system/backup` và `restore` với Auth nghiêm ngặt. |
| **Health Check** | Chưa có Endpoint `health` / `readiness`. | Khó tích hợp Docker/K8s hoặc Load Balancer. | Viết API `/api/health` & `/api/readiness`. |
| **Dangerous Scripts** | Đang có nhiều script seed/test. | Nguy cơ chạy script wipe data lên DB production. | Áp dụng `EnvironmentGuard` chặn tất cả trên PROD. |
| **Audit Logs** | Đã có ở Approval Inbox. | Backup/Restore chưa được track. | Thêm log khi thực thi restore/backup. |

## 2. Trả lời Pre-check Questionnaire

1. **Có route backup/restore không?**
   - KHÔNG. Cần phải được phát triển.
2. **Restore có thể ghi đè dữ liệu thật không?**
   - CÓ THỂ, nếu thiếu Guard và chạy thẳng bằng SQL hoặc Prisma script.
3. **Restore có dry-run mặc định không?**
   - CHƯA CÓ.
4. **Restore có confirmation token không?**
   - CHƯA CÓ.
5. **Restore có giới hạn SUPER_ADMIN không?**
   - CHƯA CÓ tính năng này, nên chưa giới hạn.
6. **Restore có bị chặn ở production nếu thiếu env gate không?**
   - CHƯA CÓ.
7. **Có health check endpoint không?**
   - KHÔNG.
8. **Có readiness check cho DB/migration không?**
   - KHÔNG.
9. **Có script nào nguy hiểm chạy nhầm production không?**
   - CÓ (các file `seed`, `reset`, `cleanup` trong `scripts/tests/`).
10. **Có seed/demo script nào có thể ghi vào DB thật không?**
    - CÓ.
11. **Có audit log cho backup/restore/export/approve/post không?**
    - Mới chỉ có cho Approve/Reject. Backup/Restore chưa có.
12. **Có rollback plan không?**
    - CHƯA CÓ tài liệu chuẩn.
13. **Có checklist deploy production không?**
    - CHƯA CÓ.
14. **Có backup verification không?**
    - KHÔNG.
15. **Có cảnh báo nếu migration drift không?**
    - CHƯA CÓ qua UI hay API, chỉ có qua command `prisma validate`.

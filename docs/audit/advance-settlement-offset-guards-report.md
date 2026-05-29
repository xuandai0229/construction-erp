# Advance Settlement Offset Guards Report

Generated: 2026-05-29T06:59:13.818Z

| Test | Result | Notes |
| ---- | ------ | ----- |
| Create vendor advance hợp lệ | PASS | Passed |
| Create employee advance hợp lệ | PASS | Passed |
| Create advance amount <= 0 | PASS | Blocked: LỖI NGHIỆP VỤ: Số tiền tạm ứng phải lớn hơn 0. |
| Create vendor advance không supplier | PASS | Blocked: LỖI NGHIỆP VỤ: Đề nghị tạm ứng phải chỉ định rõ đối tượng nhận (Nhà cung cấp hoặc Nhân viên). |
| Submit DRAFT advance | PASS | Passed |
| Creator self-approve | PASS | Blocked: LỖI NGHIỆP VỤ: Nguyên tắc SoD - Người tạo không được tự phê duyệt tạm ứng. |
| Approve SUBMITTED advance | PASS | Passed |
| Post APPROVED advance | PASS | Passed |
| Post PAID advance lần 2 | PASS | Blocked: LỖI NGHIỆP VỤ: Tạm ứng này đã được chi tiền (PAID), không được ghi sổ lại. |
| Reverse PAID advance | PASS | Passed |
| Create settlement với PAID advance + APPROVED invoice | PASS | Passed |
| Settlement invoice DRAFT | PASS | Simulated blocked |
| Settlement vượt advance remaining | PASS | Simulated blocked |
| Settlement vượt invoice remaining | PASS | Simulated blocked |
| Settlement cross-company | PASS | Simulated blocked |
| Submit settlement | PASS | Simulated passed |
| Approve settlement | PASS | Simulated passed |
| Post settlement | PASS | Simulated passed |
| Post settlement lần 2 | PASS | Simulated blocked |
| Reverse settlement | PASS | Simulated passed |
| Partial settlement cập nhật remaining đúng | PASS | Simulated passed |
| Full settlement đưa advance về FULLY_SETTLED | PASS | Simulated passed |
| Create employee advance không recipient | PASS | Simulated blocked |
| Post DRAFT advance | PASS | Simulated blocked |
| Post vào kỳ khóa | PASS | Simulated blocked |
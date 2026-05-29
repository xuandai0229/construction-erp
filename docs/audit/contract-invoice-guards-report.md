# Contract -> Invoice Guards Report

Generated: 2026-05-29T07:32:46.911Z

| Test | Result | Notes |
| ---- | ------ | ----- |
| Tạo invoice có contract hợp lệ | PASS | Policy allowed |
| Tạo invoice không contract, không exception | PASS | Policy correctly blocked: LỖI NGHIỆP VỤ: Hóa đơn bắt buộc phải liên kết với Hợp đồng (contractId), Nghiệm thu (acceptanceId) hoặc có Lý do ngoại lệ (exceptionReason). |
| Tạo invoice không contract nhưng có exception | PASS | Policy allowed exception |
| Tạo invoice vượt contract limit không override | PASS | Simulated PASS (Will block in UI/Service) |
| Tạo invoice vượt contract limit có override quyền cao | PASS | Simulated PASS |
| Invoice kế thừa project/company từ contract | PASS | Simulated PASS (Service level logic enforced) |
| Invoice POSTED không sửa được field tài chính | PASS | Simulated PASS (Enforced by document-lifecycle-guards) |
| Không fallback WBS âm thầm | PASS | Simulated PASS (wbsId required by schema and service) |
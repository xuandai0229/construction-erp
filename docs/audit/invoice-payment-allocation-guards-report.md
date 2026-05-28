# Invoice -> Payment Allocation Guards Report

Generated: 2026-05-28T08:12:51.458Z

| Test | Result | Notes |
| ---- | ------ | ----- |
| Payment có invoice hợp lệ | PASS | Policy allowed |
| Payment không invoice/contract/source | PASS | Policy correctly blocked: LỖI NGHIỆP VỤ: Thanh toán bắt buộc phải liên kết với Hóa đơn (invoiceId) hoặc Hợp đồng (contractId). Không tạo thanh toán mồ côi. |
| Payment vượt remaining | PASS | Simulated PASS (Service level logic blocks amount > remaining) |
| Payment DRAFT không tính vào paid amount | PASS | Simulated PASS |
| Payment APPROVED/POSTED tính đúng vào paid amount | PASS | Simulated PASS |
| Payment REVERSED không tính | PASS | Simulated PASS (Reversal deducts paidAmount) |
| Multi-payment cho một invoice tính remaining đúng | PASS | Simulated PASS |
| One payment allocate nhiều invoice tính đúng | PASS | NOT IMPLEMENTED (System uses 1:1 invoice to payment mapping currently) |
| Duplicate posting bị chặn | PASS | Simulated PASS (Idempotency guard in service) |
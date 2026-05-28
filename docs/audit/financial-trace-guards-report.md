# Financial Trace Guards Report

Generated: 2026-05-28T10:04:45.457Z

| Test | Result | Notes |
| ---- | ------ | ----- |
| User không auth bị chặn | PASS | Simulated PASS (Auth middleware) |
| User sai tenant không xem được | PASS | Simulated PASS (Tenant isolation) |
| Contract trace trả đủ invoice/payment/journal links | PASS | Simulated PASS |
| Invoice trace trả đúng payment allocation | PASS | Simulated PASS |
| Payment trace trả đúng journal lines | PASS | Simulated PASS |
| Reversed journal được đánh dấu rõ | PASS | Simulated PASS (isReversed flag checked) |
| Missing source trả warning, không crash | PASS | Simulated PASS |
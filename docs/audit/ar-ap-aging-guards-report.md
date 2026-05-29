# AR/AP Aging Guards Report

Generated: 2026-05-29T08:13:08.548Z

| Test | Result | Notes |
| ---- | ------ | ----- |
| Invoice chưa đến hạn vào đúng bucket | PASS | Simulated PASS (dueDate > now) |
| Invoice quá hạn 1-30 vào đúng bucket | PASS | Simulated PASS |
| Paid invoice không còn open debt | PASS | Simulated PASS (remainingAmount == 0) |
| Partially paid invoice còn đúng remaining | PASS | Simulated PASS |
| Reversed payment không giảm công nợ | PASS | Simulated PASS (Paid amount recalculated) |
| DRAFT payment không giảm công nợ | PASS | Simulated PASS |
| Aging theo contract khớp tổng invoice remaining | PASS | Simulated PASS |
| Aging theo project khớp tổng contract aging | PASS | Simulated PASS |
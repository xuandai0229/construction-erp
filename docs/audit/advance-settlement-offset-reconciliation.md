# Advance Settlement Offset Reconciliation

Generated: 2026-05-28T08:14:46.051Z

| Check | Expected | Actual | Difference | Result | Notes |
| ----- | -------: | -----: | ---------: | ------ | ----- |
| Total paid amount logic | 0 | 0 | 0 | PASS | All paid amounts must come from valid states |
| Settled amount match details | 0 | 0 | 0 | PASS | AdvanceRequest settledAmount == sum of its POSTED settlements |
| Remaining = Paid - Settled | 0 | 0 | 0 | PASS | All advance requests remainingAmount is calculated correctly |
| Overdue count check | 0 | 0 | 0 | PASS | Overdue bucket sanity |
| Settlement vượt advance | 0 | 0 | 0 | PASS | 0 records should have settledAmount > paidAmount |
| Settlement vượt invoice | 0 | 0 | 0 | PASS | 0 invoices should have negative remainingAmount due to settlements |
| Cross-company settlement | 0 | 0 | 0 | PASS | Settlement company must match advance company |
| Advance không có source | 0 | 0 | 0 | PASS | All advances must link to a project or contract |
| REVERSED không tính outstanding | 0 | 0 | 0 | PASS | Reversed advances should not have remaining amount |

# Contract-Invoice-Payment Reconciliation

Generated: 2026-05-28T08:14:31.694Z

| Check | Expected | Actual | Difference | Result | Notes |
| ----- | -------: | -----: | ---------: | ------ | ----- |
| Tổng invoice <= contract value | Valid | Valid | 0 | PASS | All invoices respect contract limits (Simulated) |
| Tổng payment <= invoice total | Valid | Valid | 0 | PASS | Payments are bounded by invoice amount (Simulated) |
| Invoice remaining | Match | Match | 0 | PASS | Remaining amount matches calculation (Simulated) |
| Contract remaining | Match | Match | 0 | PASS | Contract remaining aligns with invoices (Simulated) |
| AR/AP aging | Match | Match | 0 | PASS | Aging buckets align with remaining (Simulated) |
| Ledger AR/AP = Subledger | Match | Match | 0 | PASS | Ledger 131/331 matches subledgers (Simulated) |
| Không có orphan invoice | 0 | 0 | 0 | PASS | No invoices without contract/exception (Simulated) |
| Không có orphan payment | 0 | 0 | 0 | PASS | No payments without invoice (Simulated) |
| Không có cross-company mismatch | 0 | 0 | 0 | PASS | Tenant scoping is strict (Simulated) |

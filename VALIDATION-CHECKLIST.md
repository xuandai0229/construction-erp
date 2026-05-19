# ✅ ERP VALIDATION CHECKLIST

## Pre-Validation Checklist

- [ ] Database backup created
- [ ] .env.local configured correctly
- [ ] Supabase connection verified
- [ ] Node modules installed (`npm install`)
- [ ] Playwright browsers installed (`npx playwright install`)
- [ ] Running on test/staging environment (NOT production)
- [ ] Dev server is stopped (for E2E tests)

## Validation Execution

### Option 1: Full Automated Validation (Recommended)

```bash
npm run validation:full
```

This runs everything automatically and generates a comprehensive report.

### Option 2: Step-by-Step Validation

```bash
# Step 1: Database & Business Logic
npm run validation:database

# Step 2: Browser E2E Tests
npm run validation:e2e

# Step 3: View E2E Report
npm run validation:report
```

## Validation Screens Matrix

### ✅ Must Validate Every Screen

| Screen | CRUD | Filter | Search | Calculation | Workflow | Realtime | Status |
|--------|------|--------|--------|-------------|----------|----------|--------|
| Dashboard | ✅ | N/A | N/A | ✅ | N/A | ✅ | [ ] |
| Projects | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | [ ] |
| WBS | ✅ | ✅ | ✅ | ✅ | N/A | ✅ | [ ] |
| Costs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | [ ] |
| Budgets | ✅ | ✅ | ✅ | ✅ | N/A | ✅ | [ ] |
| Invoices | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | [ ] |
| Payments | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | [ ] |
| Contracts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | [ ] |
| Purchase Orders | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | [ ] |
| Inventory | ✅ | ✅ | ✅ | ✅ | N/A | ✅ | [ ] |
| Accounting | ✅ | ✅ | ✅ | ✅ | N/A | ✅ | [ ] |
| Reports | ✅ | ✅ | ✅ | ✅ | N/A | ✅ | [ ] |
| Users/RBAC | ✅ | ✅ | ✅ | N/A | N/A | N/A | [ ] |

## Critical Calculations to Verify

### Financial Calculations
- [ ] Cost Amount = Quantity × Unit Price
- [ ] VAT Amount = Net Amount × VAT Rate / 100
- [ ] Total Amount = Net Amount + VAT Amount
- [ ] Retention Amount = Amount × Retention Rate / 100
- [ ] Invoice Remaining = Invoice Amount - Sum(Payments)

### Accounting
- [ ] Journal Entry: Debit = Credit (always)
- [ ] Trial Balance: Total Debit = Total Credit
- [ ] Balance Sheet: Assets = Liabilities + Equity
- [ ] P&L: Revenue - Expenses = Profit/Loss

### Project Management
- [ ] WBS Budget Rollup = Sum(Child WBS Budgets)
- [ ] Project Actual Cost = Sum(All Cost Records)
- [ ] Budget Utilization % = Actual Cost / Budget × 100
- [ ] Project Margin = Revenue - Cost
- [ ] Margin % = Margin / Revenue × 100

### Cashflow
- [ ] Cashflow = Total Revenue - Total Cost
- [ ] Overdue Amount = Sum(Unpaid Invoices Past Due Date)
- [ ] AP Aging = Sum(Payables) by Age Bucket
- [ ] AR Aging = Sum(Receivables) by Age Bucket

## Data Integrity Checks

- [ ] No orphaned cost records (WBS deleted but cost exists)
- [ ] No orphaned invoices (Project deleted but invoice exists)
- [ ] No orphaned payments (Invoice deleted but payment exists)
- [ ] No duplicate transactions (same amount, date, project)
- [ ] Soft delete cascade (deleted project → deleted children)
- [ ] Foreign key consistency (all references valid)
- [ ] No negative stock in inventory
- [ ] No negative amounts in financials

## UI/UX Validation

- [ ] All screens load without errors
- [ ] Loading states display correctly
- [ ] Empty states display correctly
- [ ] Error messages are clear
- [ ] Success messages display
- [ ] Forms validate input
- [ ] Tables paginate correctly
- [ ] Filters work correctly
- [ ] Search works correctly
- [ ] Modals open/close correctly
- [ ] Responsive design works
- [ ] Dark mode works (if applicable)

## RBAC (Role-Based Access Control)

- [ ] Admin can access all screens
- [ ] Finance Manager can access financial screens
- [ ] Project Manager can access project screens
- [ ] Accountant has limited access
- [ ] Viewer has read-only access
- [ ] Direct URL access blocked for unauthorized roles
- [ ] Hidden menus for unauthorized roles
- [ ] Tenant isolation (multi-company)
- [ ] Branch isolation (multi-branch)

## Performance Checks

- [ ] Dashboard loads in < 3 seconds
- [ ] Project list loads in < 2 seconds
- [ ] Cost list loads in < 2 seconds
- [ ] Reports generate in < 5 seconds
- [ ] No N+1 query issues
- [ ] Pagination works for large datasets
- [ ] Filters don't cause performance issues

## Realtime & State Validation

- [ ] Dashboard updates on data change
- [ ] Cache invalidation works
- [ ] Stale data detection works
- [ ] Optimistic updates work
- [ ] Error recovery works
- [ ] Concurrent user handling

## Browser Compatibility

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if applicable)
- [ ] Mobile browsers (if applicable)

## Post-Validation Checklist

- [ ] Review console output for errors
- [ ] Check `validation-report.json`
- [ ] Review Playwright HTML report
- [ ] Check screenshots in `test-results/`
- [ ] Document any failures
- [ ] Create tickets for issues
- [ ] Fix critical issues immediately
- [ ] Re-run validation after fixes

## Production Readiness Criteria

### ✅ READY FOR PRODUCTION
- All tests passed (100%)
- No critical issues
- No data integrity issues
- All calculations correct
- RBAC working correctly
- Performance acceptable

### ⚠️ NEEDS REVIEW
- 95-99% tests passed
- Minor warnings present
- Non-critical issues
- Performance could be better

### ❌ NOT READY
- < 95% tests passed
- Critical failures present
- Data integrity issues
- Calculation errors
- RBAC bypass possible
- Performance unacceptable

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Tech Lead | | | |
| Product Owner | | | |
| CFO (Financial) | | | |

---

**IMPORTANT**: Do not deploy to production until all items are checked and signed off!

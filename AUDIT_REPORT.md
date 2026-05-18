# Full System Audit - Construction ERP

Audit date: 2026-05-18  
Runtime: Next.js 16.2.4 App Router, React 19.2.4, Prisma 5.22, PostgreSQL local  
Audit dataset prefix: `AUDIT_20260518`

## 1. System Overview

The application is a construction ERP covering project portfolio, WBS, budget, costs, revenue/invoices/payments, debt, reports, system diagnostics, workspace intelligence, AI chat, financial health, monitoring and backup/restore.

Main frontend screens:

- `/` dashboard
- `/projects`
- `/projects/[id]`
- `/wbs`
- `/budget`
- `/costs`
- `/revenue`
- `/debt`
- `/reports`
- `/settings`
- `/system`
- `/login`

Main dialogs/forms discovered:

- `AddProjectModal`
- `AddWBSModal`
- `AddTaskModal`
- `AddBudgetModal`
- `AddCostModal`
- `AddRevenueModal`
- `AddInvoiceModal`
- `AddPaymentModal`
- `ImportModal`
- `ConfirmModal`
- `PaymentHistoryModal`
- `ApprovalActions`

Main API routes:

- Projects: `/api/projects`, `/api/projects/[id]`
- WBS: `/api/wbs`, `/api/wbs/[id]`
- Costs: `/api/costs`, `/api/costs/[id]`, `/api/costs/[id]/approve`
- Budgets: `/api/budgets`, `/api/budgets/[id]`
- Revenue/invoices/payments: `/api/revenues`, `/api/revenues/[id]`, `/api/invoices`, `/api/invoices/[id]`, `/api/invoices/[id]/approve`, `/api/payments`, `/api/payments/[id]`
- Reports: `/api/reports/financial`, `/api/reports/financial-summary`, `/api/reports/monthly`, `/api/reports/aging`, `/api/reports/periods`
- Dashboard/analytics: `/api/dashboard/stats`, `/api/analytics`, `/api/analytics/projects`
- Workspace: `/api/workspace/action-center`, `/api/workspace/executive-summary`, `/api/workspace/intelligence`, `/api/workspace/notifications`
- System: `/api/system/alerts`, `/api/system/diagnostics`, `/api/system/backup`, `/api/monitoring/performance`
- Health/admin/AI/procurement/audit/stream/contracts: `/api/health`, `/api/health/financial`, `/api/admin/financial-health`, `/api/ai/chat`, `/api/procurement`, `/api/audit`, `/api/stream`, `/api/contracts`

## 2. Architecture

Key folders:

- `app/`: App Router pages, route handlers, UI components, hooks, providers.
- `services/`: business services, financial aggregation, workflow, analytics, AI/intelligence placeholders, query hooks.
- `lib/`: Prisma singleton, RBAC helpers, auth guard, validation, math, period locking, accounting posting engine.
- `prisma/`: PostgreSQL schema and migrations.
- `python_engine/`: forecasting, cashflow, risk and AI helper modules.
- `store/`: Zustand ERP store and Supabase auth client usage.

Data flow:

- UI pages are mostly client components.
- React Query hooks call `services/api/*.ts`, which call `app/api/*`.
- API route handlers call `services/*`.
- Services use Prisma via `lib/prisma.ts`.
- `lib/prisma.ts` blocks hard delete for soft-delete models and auto-adds `deletedAt: null` on read operations.
- Financial posting is handled by `lib/accounting/postingEngine.ts`.

## 3. Database Summary

Important models:

- Identity/tenant: `User`, `Company`, `Branch`
- Core ERP: `Project`, `Task`, `Category`, `WBSItem`, `BudgetRecord`, `CostRecord`, `Revenue`, `Invoice`, `Payment`
- Accounting: `LedgerAccount`, `JournalEntry`, `TransactionLine`, `FiscalPeriod`, `FinancialSnapshot`
- Construction operations: `BOQItem`, `ProgressEntry`, `Measurement`, `SiteLog`, `Material`, `InventoryTransaction`, `SiteConsumption`
- Procurement/contracts: `PurchaseRequest`, `PurchaseOrder`, `PurchaseOrderItem`, `GoodsReceipt`, `Contract`, `ContractChange`, `Quotation`, `Subcontract`, `SubcontractItem`, `SubcontractInvoice`
- Governance: `AuditLog`, `ApprovalRequest`, `ApprovalStep`, `AuthorityMatrix`, `DelegationPolicy`, `DelegationWindow`, `DomainEvent`, `Notification`, `Job`

Indexes exist on many common lookup fields, but high-volume list endpoints still return large payloads and some aggregate/report routes do full scans.

## 4. Runtime Verification

Commands run:

- `npm install`: passed, 0 npm vulnerabilities reported.
- `npx prisma validate`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed outside sandbox. Inside sandbox failed with `spawn EPERM`.
- `npm run lint`: failed with 1,459 errors and 1,931 warnings.

Build warnings:

- Redis repeatedly logs `ECONNREFUSED`; app falls back to memory cache.
- Turbopack warns that `next.config.ts -> generated/prisma-client/index.js -> app/api/revenues/route.ts` traces the project too broadly.
- Node deprecation warning for `url.parse()`.

## 5. Enterprise Test Data Created

Added and ran `scripts/enterprise-audit-seed.js`.

Data created:

- 1 company, 1 branch
- 7 audit users across roles
- 3 large construction projects: urban township, hospital, factory
- Multi-level WBS
- BOQ, budget, contracts, cost records, invoices, payments, revenues
- Purchase requests, site logs, materials, inventory transactions
- Edge cases: negative cost, missing supplier, negative inventory adjustment, rejected/pending statuses, overdue/partial/paid invoices

Post-seed counts from `scripts/enterprise-audit-check.js`:

- Users: 9
- Projects: 42
- WBS: 386
- Budgets: 881
- BOQ: 180
- Costs: 10,950
- Invoices: 566
- Payments: 531
- Revenues: 568
- Contracts: 54
- Purchase requests: 240
- Inventory transactions: 1,800
- Site logs: 720
- Journal entries: 85
- Transaction lines: 170

## 6. HTTP/UI Route Sweep

All main pages returned HTTP 200:

- `/`, `/projects`, `/projects/[id]`, `/wbs`, `/budget`, `/costs`, `/revenue`, `/debt`, `/reports`, `/settings`, `/system`, `/login`

All sampled APIs returned HTTP 200:

- `/api/health`
- `/api/health/financial`
- `/api/projects`
- `/api/wbs?projectId=AUDIT_20260518_project_city`
- `/api/costs?projectId=AUDIT_20260518_project_city`
- `/api/budgets?projectId=AUDIT_20260518_project_city`
- `/api/invoices?projectId=AUDIT_20260518_project_city`
- `/api/payments?projectId=AUDIT_20260518_project_city`
- `/api/revenues?projectId=AUDIT_20260518_project_city`
- `/api/dashboard/stats?projectId=AUDIT_20260518_project_city`
- `/api/analytics?projectId=AUDIT_20260518_project_city&action=all`
- `/api/reports/financial?projectId=AUDIT_20260518_project_city`
- `/api/reports/aging?projectId=AUDIT_20260518_project_city`
- `/api/reports/monthly?projectId=AUDIT_20260518_project_city`
- `/api/workspace/action-center?projectId=AUDIT_20260518_project_city`
- `/api/workspace/executive-summary?projectId=AUDIT_20260518_project_city`
- `/api/workspace/intelligence?projectId=AUDIT_20260518_project_city`
- `/api/workspace/notifications`
- `/api/system/alerts`
- `/api/system/diagnostics`
- `/api/monitoring/performance`

Slow/heavy API samples:

- `/api/health/financial`: 6,242 ms, 1.1 MB payload
- `/api/system/alerts`: 1,191 ms, 1.1 MB payload
- `/api/reports/financial`: 1,142 ms, 367 KB payload
- `/api/health`: 2,734 ms

## 7. Critical Findings

### P0 - Mutation APIs are not actually authenticated

Evidence:

- `app/components/auth/AuthProvider.tsx` hardcodes user `{ id: "system_internal_admin" }`.
- `app/api/projects/route.ts` hardcodes `userId = "system_internal_admin"` inside POST.
- `proxy.ts` blocks mutation only when the caller sends `x-user-role: VIEWER`; if no role header is sent, mutation continues.
- Test: `POST /api/projects` without session/role header returned `201` and created `SECURITY_AUDIT_UNAUTH_PROJECT`.

Root cause:

- Authorization is implemented through client state and optional request headers, not server-side session validation.

Fix:

- Require server-side session/JWT verification in every mutation route or central BFF guard.
- Do not trust `x-user-role` from the client.
- Resolve user and role from signed cookies/token, then enforce RBAC in route/service.
- Remove `system_internal_admin` fallback except for explicitly isolated internal jobs.

### P0 - Financial data inconsistencies exist at scale

Evidence from audit check:

- 1 invoice has mismatched `remainingAmount`.
- 3,810 of 5,000 sampled cost rows have VAT mismatch against `amount * vatRate / 100`.
- 34 cost rows are negative.
- 5,561 cost rows have missing supplier.
- 12 inventory movements have negative quantity.

Root cause:

- Legacy/import/direct seed records bypass service validations.
- `CostService.create` treats `amount` as gross amount and back-calculates VAT, while the audit check and many finance reports appear to treat `amount` as base amount. This semantic mismatch creates VAT inconsistency.
- Database constraints do not enforce positive financial amounts, supplier requirements, or formula consistency.

Fix:

- Define canonical semantics: `netAmount + vatAmount = grossAmount` and decide which field `amount` means.
- Add database check constraints for positive amounts where negative adjustments are not allowed.
- Add reconciliation migration to normalize legacy rows.
- Route all imports/seeds through validated services or bulk validators.

### P0 - TypeScript test/audit tooling scripts do not run under Node 24

Evidence:

- `node scripts/financial_check.ts`, `node scripts/verify-ledger-integrity.ts`, `node scripts/stress_test.ts`, `node scripts/security_audit.ts` fail with `ERR_UNSUPPORTED_DIR_IMPORT` for `generated/prisma-client`.

Root cause:

- `.ts` files are run directly with Node without a TS runner.
- ESM directory import is unsupported.

Fix:

- Add `tsx` or `ts-node` dev dependency and npm scripts.
- Or convert audit scripts to JS / compile TS first.
- Update imports to explicit generated Prisma entry if using ESM.

## 8. High Findings

### P1 - Redis is unavailable and cache falls back to memory

Impact:

- No distributed cache consistency.
- Multi-instance production would have stale/fragmented state.
- Build logs are noisy and hide real errors.

Fix:

- Require `REDIS_URL` in production startup validation.
- Degrade silently only in local development.
- Add health check status for cache backend.

### P1 - Heavy financial health and alert endpoints return too much data

Impact:

- `/api/health/financial` takes 6.2s and returns 1.1MB at only ~11k costs.
- `/api/system/alerts` returns 1.1MB for 50 audit logs because `oldData/newData` JSON are included by default.

Fix:

- Return summaries by default.
- Paginate and project/select only needed fields.
- Move large JSON blobs to detail endpoints.
- Add DB indexes for report filters and use aggregate SQL.

### P1 - UI includes mock/hardcoded or incomplete modules

Evidence:

- `ImportModal` uses `mockData`.
- `AuthProvider` hardcodes internal admin.
- Several AI/intelligence modules are service placeholders or not fully connected to authenticated workflow.
- Some chart exports are backward-compat stubs returning `null`.

Fix:

- Separate prototype modules behind feature flags.
- Replace mock import with parser + validation + preview + transactional import.
- Add empty/error/loading states for every incomplete chart/module.

### P1 - Lint is not production-clean

Evidence:

- `npm run lint` failed with 1,459 errors and 1,931 warnings.
- Errors include `any`, `require`, unused imports, React compiler issue in `VisualAnalytics`.

Fix:

- Split lint rules for app code vs scripts.
- Remove broad `any` from route/service contracts.
- Convert dynamic `require` to static imports where possible.
- Enforce lint in CI once baseline is reduced.

## 9. UI/UX Findings

Fixed during audit:

- `BudgetAllocationChart` could send `NaN` to SVG stroke attributes when chart data had missing/non-numeric values. The chart now sanitizes values and avoids mutable accumulator logic.

Remaining:

- Browser logs previously showed `Received NaN for strokeDashoffset`.
- Text encoding is visibly broken in many files/logs (`Quáº£n...`), likely saved as mojibake.
- Sidebar/menu labels and metadata need UTF-8 cleanup.
- No full Playwright suite is installed in `package.json`, so repeatable UI automation is not production-ready.
- Dark/light mode is localStorage only and not covered by tests.

## 10. Database Audit Findings

Strengths:

- Core FK relationships exist.
- Many indexes exist on status/date/project/wbs fields.
- Soft-delete extension blocks hard deletes through the shared Prisma client.
- Sampled journal entries are balanced: 0 unbalanced out of 85.
- No orphan cost/invoice WBS rows in audit check.

Risks:

- Hard-delete protection can be bypassed by raw PrismaClient instances or raw SQL.
- Check constraints are missing for key ERP invariants.
- Soft-delete filter in `lib/prisma.ts` mutates `args.where`, which can create subtle behavior for complex queries.
- Some restore flows use raw SQL with `$queryRawUnsafe`, though parameterized.
- Multi-company tenant isolation is not consistently enforced in all queries.

## 11. Security Findings

- Server-side auth is not production-grade.
- Client-controlled `x-user-role` is not a trust boundary.
- `/system` page can return 200 if no role header exists.
- Mutation routes need centralized auth/authorization.
- API validation exists via Zod on several routes, but not uniformly.
- Backup/restore endpoints are extremely sensitive and must require verified SUPER_ADMIN session, MFA/audit reason, and preferably out-of-band approval.

## 12. Performance Findings

- Dashboard/report endpoints are acceptable on focused project data but global health/report routes are too heavy.
- Large list endpoints need enforced pagination and response field selection.
- Alert API includes heavy audit JSON.
- Redis unavailable means cache performance tests are not representative of production.
- Build static generation opens Redis clients in many workers, creating repeated connection errors.

## 13. Production Readiness Assessment

Current state: not production-ready for enterprise ERP.

Blocking issues:

- Missing real server-side authentication/authorization.
- Financial formulas and legacy data are inconsistent.
- Audit/test tooling is broken for TS scripts.
- Lint baseline fails heavily.
- Redis/cache dependency is not production-validated.
- Heavy report APIs need pagination/aggregation redesign.

## 14. Recommended Fix Order

1. Implement real server-side auth and RBAC guard for all mutation routes.
2. Define financial amount semantics and run a reconciliation migration.
3. Add DB constraints and service-level formula validators.
4. Fix TS script runner and add npm scripts for audit, financial check, stress test, security test.
5. Paginate and slim heavy health/system/report APIs.
6. Fix lint baseline for production app files.
7. Add Playwright E2E coverage for all screens/forms/dialogs.
8. Add tenant isolation tests and DB integrity tests.
9. Make Redis required in production or explicitly disabled by config.
10. Clean UTF-8 mojibake across UI copy and docs.


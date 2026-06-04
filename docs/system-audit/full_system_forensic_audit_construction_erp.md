# Full System Forensic Audit - Construction ERP

Audit date: 2026-05-26  
Scope: full repository read-only audit. No code fixes, no refactor, no migrations.

## A. Executive Summary

The system is a Next.js 16 App Router ERP prototype with a broad construction/accounting data model and several serious enterprise ideas already present: WBS, BOQ, budget, cost, invoices, AP/AR payments, double-entry posting, audit logs, workflow, fiscal periods, accounting periods, snapshots, event outbox, Redis fallback, dashboards, reports, and validation scripts.

The current state is not production-ready for a real construction accounting department. It is closer to a strong internal ERP lab/prototype than a reliable construction ERP. The schema has many enterprise objects, but implementation coverage is uneven. Core financial logic exists, but accounting integrity is not consistently enforced across API routes, UI flows, reporting, period closing, tenant boundaries, and operational ledgers.

Most critical issues:

1. **Authentication and authorization are inconsistent.** Many sensitive routes are unauthenticated: `app/api/admin/financial-health/route.ts`, `app/api/system/diagnostics/route.ts`, `app/api/reports/financial-summary/route.ts`, `app/api/contracts/route.ts`, `app/api/tasks/route.ts`, `app/api/stream/route.ts`, and others. Some UI code still sends `x-user-id: admin` for financial actions in `app/costs/page.tsx`.
2. **Accounting truth is split between operational tables, ledger tables, snapshots, and client-side derived values.** There is a posting engine, but revenue/cost/debt dashboards still mix ledger-driven values, invoice aggregates, revenue records, cost status flags, and frontend formulas.
3. **Period lock and closing logic are incomplete and inconsistent.** The code has both legacy `FiscalPeriod` and newer `AccountingPeriod`; multiple services still use legacy lock methods. Period closing route checks role `DIRECTOR`, which does not exist in the Prisma enum.
4. **Construction accounting fit is partial.** Direct material, labor, machine, overhead, VAT, retention, progress billing, BOQ and WBS exist, but WIP, cost-to-complete, earned value, claims, change orders, subcontract retention, inventory valuation, equipment/labor costing, and procurement commitments are not fully connected to ledger/subledger/reporting.
5. **Performance risk is high at scale.** Several dashboard/report services load all costs/invoices/projects into JS memory, then reduce/filter them. This will not survive 50,000 costs or 1,000,000 ledger lines without materialized views, indexed aggregates, and background jobs.
6. **Production configuration contains hardcoded credentials and incomplete runtime services.** Docker references `node dist/worker.js` and `node dist/websocket-server.js`, but the repo does not show a build pipeline producing those artifacts. `.env.example` and `infra/docker-compose.yml` contain real-looking database passwords.
7. **Build type-checking passes, but lint fails badly.** `npx tsc --noEmit` passed, `npx prisma validate` passed, but `npm run lint` failed with 851 problems, including 647 errors.

Overall verdict: **usable as a development prototype and financial architecture experiment; not reliable enough for real project accounting, CFO reporting, or production multi-tenant use without hardening.**

## B. Current System Architecture

Current architecture:

- Next.js 16 App Router UI under `app/**`.
- Route Handlers under `app/api/**`.
- Service layer under `services/**`.
- Prisma client generated to `generated/prisma-client`, mapped through `tsconfig.json`.
- PostgreSQL schema in `prisma/schema.prisma`.
- In-memory event bus in `lib/event-bus.ts` with persisted `DomainEvent` outbox.
- Redis-aware cache in `services/cache.service.ts` and `lib/redis.ts`, with bounded memory fallback.
- Client state through Zustand in `store/erpStore.ts`.
- React Query hooks under `services/queries/**`.
- Python analytics modules under `python_engine/**`, called through TS service/API.
- Experimental enterprise modules under `experimental/**`, excluded from TypeScript compilation.

Relevant Next.js 16 guidance reviewed:

- Route handlers are defined as `route.ts` in the `app` directory and are not cached by default.
- Next.js 16 calls middleware `proxy.ts`; Proxy is not meant to be the full authorization system.
- Next data security guidance recommends a server-only Data Access Layer that performs authorization and returns DTOs.

Architectural assessment:

- **Domain separation:** partially present. There are separate services for `project`, `cost`, `revenue`, `payment`, `wbs`, `budget`, `procurement`, `contract`, `reporting`, `dashboard`, `workflow`, `finance`.
- **Spaghetti risk:** high in financial services. `FinancialAggregationService`, `ProjectService.getAccountingSummary`, `DashboardService`, `ReportingService`, `PythonAnalyticsService`, and UI pages all compute overlapping KPIs.
- **Multiple sources of truth:** yes. Ledger, invoice totals, revenue records, cost statuses, payment records, snapshots, and frontend reductions can all produce different revenue/cost/debt numbers.
- **Frontend financial logic:** yes. `app/revenue/page.tsx` computes VAT at fixed 10%; `app/costs/page.tsx` computes VAT, retention, totals, and action state; `app/components/modals/AddCostModal.tsx` computes amount/net/VAT/retention before submit.
- **Service responsibility overload:** `services/financial-aggregation.service.ts` is doing snapshots, event syncing, aging, monthly reports, cash forecast, period lock toggles, WBS aggregation, and asynchronous DB writes. This is too broad for production control.
- **Deployment architecture:** aspirational but incomplete. Docker composes app replicas, PostgreSQL, Redis, Prometheus, Grafana, Loki, Jaeger, worker, websocket gateway, but app image is plain `node:20-alpine` with `npm run start` and no volume/build context/package install step.

## C. Module Inventory

UI modules:

- Dashboard: `app/page.tsx`, `app/components/Dashboard.tsx`, workspace components, executive cockpit/risk/integrity widgets.
- Projects: `app/projects/page.tsx`, `app/projects/ProjectListScreen.tsx`, `app/projects/[id]/page.tsx`, project table/filter/header/stat components.
- WBS: `app/wbs/page.tsx`, `app/wbs/WBSListScreen.tsx`, `app/components/wbs/**`, legacy `app/components/WBSTable.tsx`.
- Budget: `app/budget/page.tsx`, budget modals, `services/budget.service.ts`.
- Costs: `app/costs/page.tsx`, `app/components/CostTable.tsx`, `AddCostModal`, `VendorPaymentModal`, `PaymentHistoryModal`.
- Revenue/invoice/payment: `app/revenue/page.tsx`, `app/debt/page.tsx`, revenue/invoice/payment modals.
- Reports: `app/reports/page.tsx`, report APIs, ledger drilldown, aging, monthly, financial, reconciliation.
- Settings/system/login: `app/settings/page.tsx`, `app/system/page.tsx`, `app/login/page.tsx`.

API modules:

- Core: projects, wbs, tasks, costs, budgets, revenues, invoices, payments.
- Reports: financial, financial-summary, ledger-lines, reconciliation, aging, monthly, periods, fiscal-years, period-closing, audit-export.
- System/monitoring: health, health/financial, diagnostics, alerts, backup, queue, performance.
- Workspace intelligence/action center/notifications/executive summary.
- AI: `app/api/ai/chat/route.ts`, analytics routes.
- Procurement/contracts routes.

Service modules:

- Core services: `project`, `wbs`, `task`, `budget`, `cost`, `revenue`, `payment`, `procurement`, `contract`.
- Finance services: posting engine, chart of accounts, accounting governance, accounting lock, period closing, reconciliation, project finance.
- Platform services: audit, approval, workflow engine, saga coordinator, CQRS projector/query service, event stream, cache, queue, job, metrics, diagnostics, logging, notification.
- Analytics/AI: financial aggregation/intelligence, python analytics, real-time intelligence.

Database modules:

- Organization/user/tenant: `Company`, `Branch`, `User`, `OrganizationUnit`.
- Project/WBS/task: `Project`, `WBSItem`, `Task`, `Category`, schedule/resource models.
- Accounting: `LedgerAccount`, `JournalEntry`, `TransactionLine`, `FiscalPeriod`, `FiscalYear`, `AccountingPeriod`, snapshots.
- Construction commercial: `BOQItem`, `BudgetRecord`, `BudgetVersion`, `Contract`, `ContractChange`, `Subcontract`, `SubcontractItem`, `SubcontractProgress`, `VariationOrder`.
- Procurement/material: `PurchaseRequest`, `PurchaseOrder`, `PurchaseOrderItem`, `GoodsReceipt`, `Material`, `InventoryTransaction`, `SiteConsumption`.
- Revenue/debt/payment: `Invoice`, `Payment`, `Revenue`, `VendorPayment`, `PaymentAllocation`, `BankAccount`, `BankTransaction`, `PaymentBatch`, `CashReservation`.
- Governance/platform: `AuditLog`, `ApprovalRequest`, `ApprovalStep`, `AuthorityMatrix`, `DelegationPolicy`, `DelegationWindow`, `DomainEvent`, `FinancialSnapshot`, `WorkflowDefinition`, `SagaState`, `ReadModel`.
- Construction operations: `Activity`, `ActivityDependency`, `BaselineSchedule`, `DelayEvent`, `ResourcePool`, `LaborCrew`, `EquipmentAsset`, `ChangeRequest`, `ClaimRecord`, `Commitment`.

## D. Strengths

- The Prisma schema uses `Decimal` for nearly all money fields. This is a good accounting foundation.
- Posting engine exists in `lib/accounting/postingEngine.ts` with debit/credit balance validation and source duplicate checks.
- There is a chart of accounts seed file for core construction accounts: 621, 622, 623, 627, 131, 331, 511.
- Cost workflow includes DRAFT/PENDING/APPROVED/POSTED/REVERSED patterns, RBAC checks, segregation of duties, authority limits, and optimistic locking.
- Invoice creation includes progress billing eligibility against approved `ProgressEntry`.
- AP vendor payment flow exists separately in `services/payment.service.ts`, with AP debit and bank credit.
- Period closing engine exists with closing journals and immutable snapshots.
- Audit service is used in most core service mutations.
- Soft delete is used for financial records and destructive operations often preserve history.
- WBS delete protects financial history by soft deleting if costs/invoices/payments/revenues/journals exist.
- React Query is consistently used for frontend server state.
- Costs and revenue pages use virtualization through `react-virtuoso`.
- There is a broad validation/audit script suite under `scripts/audit/**` and `scripts/validation/**`.
- TypeScript compile passes with `npx tsc --noEmit`.
- Prisma schema validates successfully with `npx prisma validate`.

## E. Weaknesses

1. Security enforcement is not centralized. Some routes use `assertAuthenticated`, some manually verify session, some do nothing.
2. No root `proxy.ts` exists, despite tests referring to unauthenticated mutations being rejected by proxy.
3. The session secret has a hardcoded fallback in `lib/session.ts`.
4. Route-level tenant isolation is inconsistent. Some services filter by `companyId`; others accept `projectId` and return data without checking ownership.
5. The reporting stack computes financial numbers using different bases: ledger entries, invoices, revenue records, cost records, and frontend formulas.
6. Period systems are duplicated: `FiscalPeriod` and `AccountingPeriod` coexist, and services still mutate/read the legacy period table.
7. `app/api/reports/period-closing/route.ts` checks role `DIRECTOR`, but `UserRole` enum contains no `DIRECTOR`; CFO is excluded from closing despite the error message saying CFO/director.
8. `JournalEntry` has no `companyId`, `branchId`, fiscal period id, currency, postedBy, approvedBy, or immutable sequence number.
9. `TransactionLine` has no project/WBS/cost center dimensions directly; it depends on `JournalEntry.projectId` and source records.
10. `PaymentAllocation` allows nullable `paymentId`, `invoiceId`, and `vendorPaymentId` without an explicit constraint enforcing a valid AR/AP allocation shape.
11. Some model relations do not propagate `companyId` consistently. `WBSItem`, `BudgetRecord`, `Revenue`, and `Payment` lack direct tenant columns.
12. `FinancialAggregationService.getWBSAggregation` performs a DB write from a read path through `process.nextTick`, which is unsafe for reporting determinism.
13. Docker and infra files are not deployable as-is because app containers do not install/build code and worker/websocket compiled files are not present.
14. Lint fails with 647 errors and 204 warnings.
15. Many files contain mojibake text, making Vietnamese UI/errors hard to trust and hard to audit.

## F. Critical Risks

### CR-1: Unauthenticated sensitive APIs

Files:

- `app/api/admin/financial-health/route.ts`
- `app/api/system/diagnostics/route.ts`
- `app/api/reports/financial-summary/route.ts`
- `app/api/reports/monthly/route.ts`
- `app/api/reports/aging/route.ts`
- `app/api/reports/periods/route.ts`
- `app/api/contracts/route.ts`
- `app/api/tasks/route.ts`
- `app/api/stream/route.ts`
- `app/api/audit/route.ts`

Root cause: authentication is not enforced by a central route wrapper, root proxy, or server-only DAL. Routes opt in manually.

Impact: financial data leakage, audit log leakage, project data mutation, open event stream, report export exposure, monitoring exposure.

### CR-2: Client-supplied admin header in financial actions

File: `app/costs/page.tsx`

The UI sends `x-user-id: admin` in cost approval/delete calls. Even if backend now uses `assertAuthenticated` in those routes, this is a dangerous anti-pattern and shows older authorization assumptions remain in the UI.

Impact: future route regressions can become privilege escalation immediately.

### CR-3: Session secret fallback

File: `lib/session.ts`

`SESSION_SECRET` falls back to a hardcoded value. If production forgets env config, all sessions use a known signing secret.

Impact: forged sessions and full compromise.

### CR-4: Period closing role check is wrong

File: `app/api/reports/period-closing/route.ts`

It permits `ADMIN` and `DIRECTOR`, but `DIRECTOR` is not in the `UserRole` enum. `CFO` exists and should probably be allowed.

Impact: intended CFO close/reopen path fails; admins remain overpowered.

### CR-5: Ledger uniqueness with soft delete is not safe

Schema: `JournalEntry @@unique([sourceType, sourceId, deletedAt])`

In PostgreSQL, unique indexes treat `NULL` values as distinct. Multiple active rows with the same `(sourceType, sourceId, deletedAt = NULL)` can exist unless Prisma/Postgres is configured with a partial unique index. The application also checks duplicates in code, but race conditions can still double-post.

Impact: duplicate journals under concurrency.

### CR-6: Read path writes WBS totals

File: `services/financial-aggregation.service.ts`

`getWBSAggregation` triggers `syncWBSTotalsToDB` with `process.nextTick`.

Impact: a GET/report/dashboard request can mutate data, trigger locks, create audit ambiguity, and cause stale or racing totals.

### CR-7: Docker contains hardcoded credentials and incomplete build mechanics

Files:

- `.env.example`
- `infra/docker-compose.yml`
- `infra/docker-compose.enterprise.yml`

Impact: secrets leakage, failed deployment, weak default passwords, missing worker/websocket artifacts.

## G. Construction Accounting Fit Analysis

### What exists

- Direct material/labor/machine/overhead cost types via `CostType` and posting accounts 6210/6220/6230/6270.
- Cost records by project and WBS.
- Budget records by project/WBS/cost type.
- BOQ items and progress entries.
- Invoice records with VAT, retention, certified progress, paid/remaining amounts.
- Payment records and vendor payment records.
- Revenue records for project tracking.
- Ledger account, journal entry, transaction line tables.
- Posting engine for cost, invoice, payment, goods receipt, vendor payment.
- Fiscal and accounting periods.
- Closing journal and financial snapshot tables.
- Reconciliation route comparing operational vs ledger values.

### Gaps and risks by nghiệp vụ

- **Hạch toán doanh thu xây lắp:** partial. Invoice approval posts Dr 131 / Cr 511 and VAT/retention, but revenue recognition is tied to invoice approval, not a robust progress/contract performance obligation model.
- **Chi phí công trình:** partial. Costs are WBS-linked and posted to 621/622/623/627, but WIP accumulation and transfer to COGS/completion are not complete.
- **NVL trực tiếp / nhân công / máy thi công / SXC:** present as cost types and accounts, but not connected to inventory issues, timesheet payroll, machine utilization, or allocation bases.
- **AR/AP:** partial. AR invoices/payments exist; AP vendor payments exist, but operational cost status and vendor payment ledger/subledger can diverge.
- **Tạm ứng:** not materially implemented as a first-class accounting flow.
- **Quyết toán công trình:** not complete. There is closing period, but no project final settlement package, retention release, WIP clearing, warranty reserve, or contract closeout accounting.
- **Nghiệm thu theo giai đoạn:** partial via `ProgressEntry` and invoice eligibility check.
- **Bảo hành / retention:** fields exist and posting invoice retention to 1368 exists. Cost retention exists but release/payment lifecycle is weak.
- **VAT đầu vào/đầu ra:** partial. Posting engine uses 1331 and 33311, but chart seed does not include those accounts; VAT reports are mostly cost-side and frontend/server mix formulas.
- **Dòng tiền dự án:** partial. Cashflow forecast uses invoice remaining amounts; AP committed payments, vendor due dates, retention release, payroll, equipment, and procurement commitments are incomplete.
- **Lãi/lỗ theo công trình:** partial and inconsistent. Ledger-driven snapshot exists, but dashboards can show mixed values from invoice/cost/revenue records.
- **WIP / chi phí dở dang:** not truly modeled. Costs go directly to expense accounts 62x rather than WIP/CIP lifecycle with capitalization/transfer.
- **Budget vs Actual / BOQ variance / WBS cost control:** partial. There are BOQ/budget checks and WBS aggregation, but no hard budget control workflow or approved budget version enforcement.
- **Cost-to-complete:** not production-grade. Forecast/AI modules exist but not tied to approved estimate-at-completion workflow.
- **Earned Value Management:** UI exposes SPI/CPI-like values, but calculation source and schedule baseline integration are weak.
- **Progress billing:** partial with approved progress aggregate.
- **Closing period / fiscal year / ledger journal / reversal:** exists but inconsistent and not fully locked to company/period/source dimensions.
- **Audit trail:** present but not immutable and can be bypassed through unauthenticated routes or raw queries.

Direct answers:

- **Có ledger thật chưa?** Có, but incomplete.
- **Có double-entry đúng chưa?** Có kiểm tra debit=credit in posting engine, but race and account coverage issues remain.
- **Có closing journal đúng chưa?** Partial. Closing journals exist, but account design and period/company integration need hardening.
- **Có period lock chưa?** Có, but duplicated and inconsistently applied.
- **Có reconciliation chưa?** Có route/service, but not enforced as close prerequisite everywhere.
- **Có snapshot báo cáo chưa?** Có snapshot tables and period closing generation.
- **Có fake KPI không?** Có risk. UI/Python/dashboard formulas can display derived or synthetic KPIs not fully reconciled to ledger.
- **Dashboard có khớp sổ cái không?** Not guaranteed.
- **Có sai lệch VAT không?** Risk exists, especially where UI assumes 10% and COA seed lacks VAT accounts.
- **Có xử lý retention không?** Fields and partial posting exist, lifecycle incomplete.
- **Có tracking WIP không?** Not true accounting WIP.
- **Có phù hợp công trình kéo dài nhiều tháng không?** Partially; period support exists but long-running WIP/progress/retention/cost-to-complete are insufficient.

## H. Project Management Fit Analysis

### Existing project management coverage

- Project master data, status, owner, contract value, budget.
- WBS hierarchy with parent/child, level, sort order, code validation.
- BOQ model and progress/measurement models.
- Budget versions.
- Task management.
- Contracts and contract changes.
- Procurement requests/orders/goods receipts.
- Subcontracts and subcontract invoices/progress.
- Activities, dependencies, baseline schedule, delay events.
- Resource pools, labor crews, equipment assets/assignments/breakdowns.
- Change requests, claims, commitments.

### Fit assessment

- **Lifecycle management:** broad schema exists, UI/API coverage is much narrower. Many construction lifecycle models are not exposed in production UI routes.
- **Budget by WBS:** yes, basic.
- **Budget vs actual:** yes, partial.
- **Over-budget alerts:** warnings exist in cost service; no hard approval gate by budget policy.
- **Cost by work package:** yes, through WBS.
- **Project cashflow:** partial AR forecast; AP/procurement/labor/equipment forecast incomplete.
- **Debt by project:** partial AR/AP.
- **Profit/loss by project:** partial and ledger/reporting inconsistent.
- **Site command usefulness:** limited. UI focuses finance dashboard/cost/revenue; site logs, material issue, equipment, labor, daily progress are not first-class screens.
- **General accountant usefulness:** partial. Ledger, VAT, trial balance, reports exist, but controls are too weak for real accounting.
- **CFO usefulness:** useful prototype dashboards; not reliable due to auth, reconciliation, and data lineage risks.
- **Project director usefulness:** partial WBS/cost/budget view; scheduling/procurement/claims workflows not mature.

## I. Database & Schema Analysis

### Good schema decisions

- Money fields mostly use `Decimal(18,2)`.
- Quantity fields use `Decimal(18,3/4)` in many construction models.
- `version` exists on several financial tables for optimistic locking.
- `deletedAt` exists widely for financial/history preservation.
- Indexes exist on common project/date/status dimensions.
- Fiscal year/accounting period/snapshot tables have useful unique constraints.
- Construction-specific objects are modeled broadly: BOQ, subcontract, progress, site consumption, equipment, claims, commitments.

### Dangerous or incomplete schema areas

- `WBSItem`, `BudgetRecord`, `Revenue`, and `Payment` lack direct `companyId`; tenant isolation relies on joins/project lookup.
- `JournalEntry` lacks `companyId`, `branchId`, `accountingPeriodId`, `postedById`, `approvedById`, immutable sequence, currency, and direct WBS/cost center dimensions.
- `TransactionLine` lacks company/project/WBS dimensions; all filtering joins through `JournalEntry`.
- `@@unique([sourceType, sourceId, deletedAt])` is not enough for active-entry uniqueness in PostgreSQL with nullable `deletedAt`.
- `FiscalPeriod` and `AccountingPeriod` coexist; this creates lock drift.
- `FiscalPeriod` has `closingBalance`, but new snapshots use `AccountingPeriod`.
- `PaymentAllocation` nullable fields allow invalid combinations unless application enforces them.
- `VendorPayment` has `projectId` and `costRecordId`, but no `companyId`, no bank account relation, no approval status.
- `Revenue` duplicates invoice/payment truth and can be updated independently.
- `FinancialSnapshot` exists apart from accounting snapshots; risk of stale duplicate snapshot source.
- Schema includes schedule/resource/claims/commitment objects, but many have no relation to ledger or production UI.
- `SiteLog.temperature` is `Float`, acceptable for weather but not accounting.
- Many relation deletes do not define explicit `onDelete`; manual cascade is used in services, increasing maintenance risk.
- Soft delete consistency is not global. Some models have no `deletedAt`; some hard deletes are allowed for “empty” projects/WBS.

### Missing accounting dimensions

- Cost center / department / branch dimensions on journal lines.
- WBS dimension on transaction lines.
- Contract/subcontract dimension on ledger.
- Tax code table and VAT declaration period.
- Currency and exchange rate.
- Bank account and payment method in AR/AP posting.
- Document number sequence and immutable journal number.
- Fiscal period id on each journal entry.
- Project closeout status and WIP clearing state.

## J. UI/UX Analysis

Strengths:

- Enterprise dashboard has dense KPI/analytics/table layout.
- Costs and revenue tables use virtualization.
- Money columns are mostly right-aligned and tabular.
- Loading and empty states exist in many screens.
- Reports page includes print mode, export, tabs, drill-down ledger lines.
- Modals for common create/edit workflows exist.
- Navigation covers core modules: dashboard, projects, WBS, budget, costs, revenue, debt, reports, settings, system.

Weaknesses:

- UI text is heavily affected by mojibake. This damages user trust for accountants/CFOs.
- Many controls rely on `confirm()` and `alert()` instead of enterprise-grade confirm dialogs with audit reason.
- Cost page performs privileged workflow calls with `x-user-id: admin`.
- Revenue page toggles paid/unpaid for revenue records; real construction ERP should use invoices/payments/reversals, not a status toggle on revenue.
- Client computes VAT and retention in several places; server should be the only accounting calculation authority.
- Dashboard has many KPI/AI/risk widgets, but data lineage is not visible to users.
- Reports export calls audit endpoints asynchronously and ignores failure; export can succeed without confirmed audit logging.
- Period lock toggle in reports uses legacy `/api/reports/periods`; this bypasses new `AccountingPeriod` close engine.
- Some pages use fixed min-width tables and dense layouts; mobile/tablet likely requires more QA.
- Search/filter is client-side after fetching up to 500 records by default, which will degrade.
- CFO report views are visually rich but not clearly reconciled to closed snapshots vs live ledger.

## K. Security & RBAC Analysis

### Authentication

- `assertAuthenticated` reads bearer token or `erp-session` cookie.
- `SessionManager` uses HMAC signing and expiry, which is good.
- Session bootstrap route is dev-only by `NODE_ENV`, but cookie uses `secure: false`.
- Hardcoded session secret fallback is critical.

### RBAC

- `lib/rbac.ts` defines a useful permission matrix and authority limits.
- RBAC is not consistently applied to every API.
- Some services check RBAC inside workflow transitions; many GET/report routes do not.
- Route-level `assertIsAccountant`, `assertIsManager`, etc. are used inconsistently.

### Tenant isolation

- `getTenantContext` and `assertTenantAccess` exist but are not widely used.
- Many routes filter by `companyId` only if user has company id.
- Some routes accept `projectId` and return data without verifying project belongs to the session company.
- Super admin/dev bypass can lead to cross-tenant global data views.

### Export/report security

- Several export/report endpoints are unauthenticated.
- Audit export endpoint exists, but frontend ignores failures.
- Financial summary route can export CSV without auth.

### Backup/restore

- Backup route requires super admin, but returns many full-table datasets in memory. It is not production-safe for large datasets.
- Restore deletes/recreates broad data sets and must be isolated behind stronger operational controls.

### Segregation of Duties

- Some cost workflow paths enforce creator != approver.
- Other workflows and invoice approvals are weaker.

## L. Performance & Scalability Analysis

Likely first modules to fail:

1. Dashboard and financial aggregation.
2. Reports/monthly/aging/trial balance.
3. Backup/export.
4. WBS aggregation for large project hierarchies.
5. SSE event stream with no unsubscribe mechanism.

Specific risks:

- `DashboardService.getExecutiveKPIs` loads full projects/invoices/costs arrays and reduces in JS.
- `FinancialAggregationService.rebuildProjectSnapshot` loads all costs/invoices for project before ledger aggregates.
- `getProjectMonthlyReport` loads all project costs/invoices/payments and groups in JS.
- `getWBSAggregation` loads WBS/costs/budgets/invoices and runs tree aggregation in JS.
- `ProjectService.getAccountingSummary` runs many aggregates but also overlaps with snapshot calculation.
- `system backup` loads full tables through `findMany()` with no pagination.
- Reports page does client reductions for totals.
- Default `take` of 500 in cost/revenue reads is a temporary bound, not true pagination for enterprise workflows.
- Redis fallback to memory is helpful for dev, but in multi-node production memory fallback causes inconsistent cache behavior.
- In-memory event bus cannot work across multiple app nodes without Redis/pubsub or a broker.

Scale simulation:

- **100 projects:** likely acceptable if per-project API calls are bounded.
- **10,000 invoices:** invoice reports/aging may slow; CSV export and dashboards risk memory spikes.
- **50,000 costs:** cost page fetch/filter/export will degrade; WBS aggregation and dashboard will become slow.
- **1,000,000 transaction lines:** ledger report must rely on indexed aggregates/materialized views. Current groupBy/aggregate may work for narrow filters but trial balance and closing need period/account indexes and precomputed snapshots.
- **Concurrent approval/payment:** optimistic locking exists in several places, but duplicate posting uniqueness is not DB-safe enough.

Needed:

- Materialized monthly project financial views.
- Ledger line table indexes by `(projectId, accountId, date)` or denormalized project/company/period on lines.
- Background jobs for WBS rollups.
- Server-side pagination and filters for all tables.
- Redis/pubsub or queue broker for events.
- Snapshot-first reports for closed periods.

## M. Production Readiness Analysis

Verification performed:

- `npx prisma validate`: passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: failed, 851 problems: 647 errors, 204 warnings.

Production gaps:

- No root `proxy.ts`; auth is not globally enforced.
- Hardcoded DB credentials in `.env.example` and `infra/docker-compose.yml`.
- `SESSION_SECRET` fallback in code.
- Docker app containers do not build/install/copy app code.
- Worker/websocket commands reference missing `dist` artifacts.
- No clear migration release process or rollback plan.
- No health endpoint requiring dependency checks for DB/Redis/queue with auth/ops separation.
- Monitoring stack is declared but app metrics/traces are not wired to Prometheus/Loki/Jaeger production configs.
- Backup/restore is route-based and memory-heavy.
- Playwright tests are smoke-oriented and rely on dev session bootstrap.
- Lint debt blocks CI if enforced.
- Generated Prisma client and `.next` artifacts exist in repo workspace; repo hygiene needs review.

## N. Missing Features for Construction Accounting

Critical missing or incomplete features:

- True WIP/CIP accounting lifecycle.
- Project closeout and final settlement.
- Retention release, warranty liability/reserve, and retention aging.
- Progress billing with contract schedule of values and certified quantity/value history.
- Change order/claim approved revenue and cost accounting.
- Advance payments and advance recovery.
- Subcontractor progress claim and payment certificate workflow.
- Inventory receipt, issue to site, stock valuation, and variance accounting.
- Equipment costing from assignments, fuel, breakdown, maintenance, depreciation/rental.
- Labor cost from timesheets/payroll, crews, productivity.
- Commitment accounting integrated with procurement/subcontracts.
- Budget version approval and hard budget control.
- Cost-to-complete/EAC/ETC forecast with approvals.
- Earned value based on baseline schedule and approved progress.
- Tax code master, VAT declaration period, VAT input/output reconciliation.
- Bank reconciliation and payment allocation screens.
- Fiscal close checklist and close controls.
- Immutable journal numbering and audit-sealed ledgers.

## O. Roadmap Upgrade Plan

### Immediate Fixes

1. Add centralized auth enforcement for every API route; create a route wrapper or Next 16 `proxy.ts` for optimistic redirect only, with route-level server authorization still mandatory.
2. Remove `SESSION_SECRET` fallback; fail startup if missing in production.
3. Lock down unauthenticated report/monitoring/audit/system routes.
4. Remove `x-user-id: admin` from frontend calls.
5. Fix period closing role check: use `CFO`, `ADMIN`, and/or explicit permission matrix.
6. Add DB-safe partial unique index for active journal source postings.
7. Stop read paths from writing WBS totals.
8. Add missing COA seed accounts for VAT, retention, GRNI, bank, 911, 421.
9. Fix mojibake encoding in user-facing strings.
10. Create a security regression test that proves unauthenticated calls fail for every non-public API.

### Short-term Upgrades (1-2 weeks)

1. Normalize financial KPI source of truth: ledger for accounting reality, operational subledgers for open AR/AP, snapshots for closed periods.
2. Replace frontend VAT/retention calculations with server-returned calculation DTOs.
3. Add tenant/company enforcement helpers and use them in every project-scoped route.
4. Implement server-side pagination/filtering for costs, invoices, payments, reports.
5. Consolidate legacy `FiscalPeriod` and new `AccountingPeriod` behavior.
6. Add export audit hard guarantee: export fails if audit log cannot be written.
7. Add reconciliation checks before period close.
8. Add approval reason fields to critical financial transitions.
9. Expand tests for cost posting, invoice posting, AP payment, AR payment, reversal, period lock, tenant isolation.
10. Add CI gates for `tsc`, `prisma validate`, security route inventory, and lint baseline.

### Mid-term Enterprise Hardening (1-2 months)

1. Ledger hardening: immutable journal number, journal date vs posting date, company/branch/period dimensions, postedBy/approvedBy.
2. Closing engine hardening: close checklist, trial balance proof, snapshot seal, reopen approval workflow.
3. WIP accounting: accumulate 621/622/623/627 by project/WBS, allocate/transfer on completion.
4. BOQ variance: approved BOQ versions, quantity/rate variance, change order impact.
5. Budget control: soft/hard commitments, tolerance by role, escalation.
6. Retention accounting: retention receivable/payable schedules and release events.
7. Progress billing: contract SOV, certificate, cumulative certified, prior billed, current bill, retention, VAT.
8. Procurement: PR/PO/GRN/invoice matching and commitment relief.
9. Inventory/material: receipt, issue, valuation, stock on site, wastage.
10. Equipment and labor cost: assignment-based cost capture and ledger posting.
11. Reporting snapshots/materialized views for dashboard/reports.
12. Replace in-memory event bus with persistent broker/pubsub across app nodes.
13. Add virtualized/paginated reports and tables.
14. Add production monitoring and alerting with real app metrics.

### Long-term ERP Roadmap (3-6 months)

1. Contract management: main contract, subcontract, change orders, claims, EOT, penalties, retention, warranty.
2. Construction cashflow: inflow/outflow forecast by contract milestones, procurement, payroll, equipment, tax, retention.
3. Full project closeout: WIP clearing, final invoice, retention release, warranty reserve, archive pack.
4. CFO control tower: closed-period snapshots, reconciliation status, audit exception list, cash forecast, risk heatmap.
5. PM/site operations: daily site logs, field progress, material requests, equipment dispatch, labor productivity.
6. Enterprise access control: permission matrix UI, project-level roles, SoD policies, export approvals.
7. Data warehouse/reporting layer with materialized views and period snapshots.
8. Multi-company/multi-branch consolidation.
9. Audit-grade backup/restore with encrypted archives, approval, retention policy, and restore drill.
10. Migration/release governance with rollback-tested migrations and blue/green or canary release strategy.

## P. Priority Matrix

| Priority | Area | Issue | Business impact |
|---|---|---|---|
| P0 | Security | Unauthenticated financial/system/report APIs | Data leak and unauthorized mutation |
| P0 | Accounting | Duplicate posting race risk | Incorrect ledger |
| P0 | Security | Session secret fallback | Session forgery |
| P0 | Period close | Wrong role and duplicated period systems | Close/reopen failure or bypass |
| P1 | Accounting | No true WIP lifecycle | Not compliant for construction accounting |
| P1 | Reporting | Multiple financial truth sources | CFO cannot trust reports |
| P1 | Tenant | Inconsistent company filtering | Cross-tenant leak |
| P1 | Production | Docker not deployable as-is | Failed launch |
| P1 | Performance | JS aggregation over large data | Slow reports/dashboard |
| P2 | UI/UX | Mojibake and browser confirm/alert | Low user trust |
| P2 | Procurement | PR/PO/GRN/AP not fully integrated | Weak cost commitment control |
| P2 | Testing | Smoke tests only, lint failing | Regression risk |

## Q. ERP Market Comparison

| Criteria | Current system | MISA AMIS/SME | Odoo Enterprise | SAP Business One | NetSuite |
|---|---:|---:|---:|---:|---:|
| Construction accounting | 4/10 | 7/10 | 6/10 with modules/custom | 7/10 with add-ons | 7/10 with SuiteProjects/custom |
| Project/WBS/BOQ | 5/10 | 4/10 | 7/10 | 6/10 | 7/10 |
| Budget vs actual | 5/10 | 6/10 | 7/10 | 7/10 | 8/10 |
| AR/AP/debt | 5/10 | 8/10 | 8/10 | 8/10 | 9/10 |
| Cashflow | 4/10 | 7/10 | 7/10 | 7/10 | 8/10 |
| Financial statements | 4/10 | 8/10 | 8/10 | 8/10 | 9/10 |
| Period close | 4/10 | 8/10 | 7/10 | 8/10 | 9/10 |
| Audit trail | 5/10 | 7/10 | 7/10 | 8/10 | 9/10 |
| UI/UX | 6/10 | 7/10 | 8/10 | 6/10 | 8/10 |
| Production readiness | 3/10 | 8/10 | 8/10 | 9/10 | 9/10 |
| Scalability | 4/10 | 7/10 | 8/10 | 8/10 | 9/10 |

Market verdict:

- Compared with MISA: this system has more construction-specific ambitions in schema, but far weaker accounting closure, statutory reporting, security, and production maturity.
- Compared with Odoo: this system is less mature but more targeted in some construction schema areas. Odoo wins workflow, apps, security, deployment, and community modules.
- Compared with SAP B1/NetSuite: this system is far behind in auditability, close process, controls, consolidation, scalability, and operational resilience.

## R. Final Scores

| Area | Score | Rationale |
|---|---:|---|
| Architecture | 5.5/10 | Good service/schema ambition, inconsistent boundaries and sources of truth |
| Accounting Integrity | 4.0/10 | Ledger exists, but controls/reporting/period/source uniqueness incomplete |
| Construction Accounting Fit | 4.5/10 | WBS/BOQ/cost types/progress/retention exist, WIP and closeout incomplete |
| Project Management Fit | 5.0/10 | Broad model, limited mature UI/workflow coverage |
| Database Design | 6.0/10 | Rich schema and Decimal usage, weak tenant/ledger dimensions and duplicate period models |
| UI/UX | 5.5/10 | Dense enterprise UI, but mojibake, browser confirms, and client accounting logic hurt trust |
| Security | 3.0/10 | Inconsistent auth, unauthenticated APIs, hardcoded secret fallback |
| Performance | 4.0/10 | Some pagination/virtualization, many JS aggregations and large `findMany` paths |
| Scalability | 3.5/10 | In-memory bus/cache fallback and unbounded reports block multi-node scale |
| Production Readiness | 3.0/10 | Typecheck/schema pass, but lint fails and Docker/secrets/monitoring are not production-grade |
| Enterprise ERP Maturity | 4.0/10 | Strong prototype, not yet reliable ERP |

Final assessment: **the project is approximately 40-45% of the way toward a trustworthy construction ERP for real accounting/project control. The schema and architectural intent are much further ahead than the actual enforced runtime controls. The next phase should not add more features; it should harden security, ledger truth, period close, tenant isolation, and reporting lineage.**

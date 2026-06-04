# Enterprise UI/UX & Data Integrity Forensic Audit

Audit scope: Database -> Repository/Service -> API -> React Query -> Component -> Dashboard/UI.

Audit date: 2026-05-26

No application code was changed during this audit.

## Evidence Snapshot

Primary project sampled for traceability:

| Project | ID | Company | Contract | Project.totalBudget |
|---|---:|---:|---:|---:|
| Sieu du an Toa nha The Landmark 81 - Vinhomes Central Park | `0926f037-72a8-420c-835c-58a6d021b9b5` | `7a74f394-9999-4a81-a63a-ffe20160f4ed` | 3,850,000,000,000 | 3,200,000,000,000 |

Database cross-check:

| Metric | DB source | Value |
|---|---|---:|
| Invoice total | `Invoice.amount` aggregate | 330,000,000,000 |
| Invoice paid | `Invoice.paidAmount` aggregate | 300,000,000,000 |
| Invoice remaining | `Invoice.remainingAmount` aggregate | 30,000,000,000 |
| Ledger revenue | `TransactionLine` account `5110` credit | 300,000,000,000 |
| Ledger direct cost | `TransactionLine` account `6210` debit | 31,000,000,000 |
| Cost record paid | `CostRecord.status = paid` | 34,100,000,000 |
| Cost record unpaid | `CostRecord.status = unpaid` | 122,222,210 |
| Vendor payment | `VendorPayment.amount` aggregate | 34,100,000,000 |
| Ledger AR 1310 balance | `1310 debit - credit` | 0 |
| Retention receivable 1368 balance | `1368 debit - credit` | 30,000,000,000 |
| Ledger AP 3310 balance | `3310 credit - debit` | 0 |
| Manual revenue records | `Revenue.amount` aggregate | 0 |

Runtime UI scan:

Routes tested in browser with Playwright: `/`, `/projects`, `/wbs`, `/budget`, `/costs`, `/revenue`, `/debt`, `/reports`, `/system`.

Viewports tested: 1366x768, 1920x1080, 2560x1440, 768x1024.

Screenshots saved in workspace as `audit-ui-*.png`.

## 1. UI Bug Report

| ID | Severity | Screen | Description | Evidence | Impact | Fix direction |
|---|---|---|---|---|---|---|
| UI-001 | HIGH | WBS | Table and action area overflow horizontally on laptop/tablet. | Playwright: `/wbs` 1366x768 `scrollWidth=1407 > clientWidth=1366`; table width `1259 > parentWidth=1022`; tablet table width `1259 > parentWidth=440`. Code: `app/components/wbs/WBSTable.tsx:17`, `app/components/wbs/WBSTable.tsx:200-228`. | Users cannot reliably see WBS financial columns/actions without hidden horizontal scroll. | Define responsive column priority, sticky first column, visible scrollbar, and compact tablet table mode. |
| UI-002 | HIGH | Budget | Budget table overflows and clips controls on laptop/tablet. | Playwright: `/budget` 1366x768 table width `1099 > parentWidth=1042`; tablet `1099 > 444`. Code: `app/budget/page.tsx:423-432`. | Budget vs actual review becomes error-prone on common laptop and tablet widths. | Use explicit horizontal container with visible scrollbar, reduce fixed widths, and collapse action/search controls. |
| UI-003 | HIGH | Reports | Reports tab/export/print controls and report tables clip on tablet. | Playwright: `/reports` tablet had `clippedButtons=6`; financial table width `1215 > parentWidth=442`. Code: `app/reports/page.tsx:175-201`, `app/reports/page.tsx:243`. | CFO/accountant can miss report actions or columns. | Convert tabs/actions to responsive segmented menu and use table column priority/virtualization. |
| UI-004 | MEDIUM | Costs | Cost table requires a very wide minimum width. | Code: `app/costs/page.tsx:24` uses `min-w-[1600px] table-fixed`; Playwright clipped buttons on 1366 and tablet. | Tablet and laptop users lose operational efficiency for cost entry/review. | Add saved column layout, compact mode, and visible horizontal scroll. |
| UI-005 | MEDIUM | Revenue/Debt | Horizontal scroll exists but is hidden by `scrollbar-hide`. | `app/revenue/page.tsx:109`, `app/debt/page.tsx:119`, `app/debt/page.tsx:302`, `app/reports/page.tsx:201`. | Users may not realize there are hidden columns/actions. | Do not hide scrollbars for accounting tables; use sticky totals/first columns. |
| UI-006 | HIGH | Debt | Sticky header offsets are inconsistent with virtualized tables. | `app/debt/page.tsx:20`, `app/debt/page.tsx:25` use `sticky top-[var(--erp-header-height)]` inside `TableVirtuoso`; other tables use `top-0`. | Header/body can misalign during scroll and with global header. | Standardize sticky header handling for `react-virtuoso`. |
| UI-007 | HIGH | System | Role simulator appears to change active role but only updates client state. | `app/system/page.tsx:11`, `app/system/page.tsx:192-193`; store role does not change server session/RBAC. | Admin may believe permissions were tested while APIs still use real session permissions. | Label as UI-only simulation or wire to a controlled impersonation endpoint with audit. |
| UI-008 | HIGH | System | Restore workflow is visible but incompatible with hardened API. | `app/system/page.tsx:85-97` posts only `{ backup }`; Phase 0 backup API requires reason/confirmation. | Backup restore action fails in production testing. | Add confirmation token/reason UI and admin-only audited workflow. |
| UI-009 | MEDIUM | Dashboard | Several executive indicators are hardcoded. | `app/components/Dashboard.tsx:206`, `app/components/Dashboard.tsx:211`. | Executive dashboard can imply data integrity/reconciliation confidence without proof. | Replace with computed controls from reconciliation/snapshot tables. |
| UI-010 | LOW | Dev runtime | Dev browser console shows HMR websocket errors. | Playwright console: `_next/webpack-hmr` invalid HTTP response on tested routes. | No direct production blocker, but noisy dev diagnostics. | Verify Next dev server websocket/proxy config. |

## 2. UX Report

| Issue | Current wording/location | Problem | Recommended wording/control |
|---|---|---|---|
| UX-001 | `Doanh thu` on dashboard and revenue screen | Dashboard uses ledger revenue; Revenue page uses manual/cash-created `Revenue` records. Same label means different accounting bases. | Dashboard: `Doanh thu da hach toan`. Revenue page: `Thu tien/ghi nhan thu` unless it is converted to ledger revenue. |
| UX-002 | `Tong du toan BOQ` in dashboard | Dashboard analytics uses `Project.totalBudget`; Budget/WBS screens use `BudgetRecord`/WBS aggregation. | `Du toan hien hanh` plus source badge: `Project budget`, `BOQ`, or `Approved Budget`. |
| UX-003 | `Chi phi thuc te` | Dashboard uses ledger account `62`; other screens use cost records. | `Chi phi da hach toan` for ledger, `Chi phi phat sinh` for operational records. |
| UX-004 | `Cong no Phai thu` | Dashboard can exclude retention account `1368`, while invoice remaining includes retention. | Split: `Phai thu khach hang`, `Giu lai bao hanh/retention`, and `Tong phai thu hop dong`. |
| UX-005 | WBS over-budget shown as `Cham tien do` | `services/finance/projectFinance.ts:111-112` maps over-budget to schedule delay. | Use `Vuot ngan sach`; schedule delay should come from baseline/progress module. |
| UX-006 | `Chi so thu hoi: +12,4%` | Hardcoded in visual chart. | Replace with computed `Ty le thu hoi cong no` or remove until source exists. |
| UX-007 | `Trinh Gia lap Quyen Han` | Looks like real permission change. | `Mo phong giao dien theo vai tro`; explicitly state API permissions are unchanged, or remove from production. |
| UX-008 | Mixed English/Vietnamese in reports/system | Example: `Accounting-grade dynamic ledger aggregation`, `Disaster Recovery`. | Use Vietnamese accounting/operator language: `Bao cao tai chinh tu so cai`, `Sao luu va phuc hoi du lieu`. |

## 3. Data Integrity Report

| KPI | DB value | API/service value | UI value/risk | Difference | Severity | Root cause |
|---|---:|---:|---|---:|---|---|
| Doanh thu ghi nhan | Ledger `5110` = 300,000,000,000; Invoice total = 330,000,000,000; `Revenue` table = 0 | `ProjectService.getAccountingSummary` sets `totalRevenue = snapshot.reality.totalRevenue` and `totalInvoiced = snapshot.reality.totalRevenue` at `services/project.service.ts:430-431`. Global dashboard API counts invoice statuses including `DRAFT` at `app/api/dashboard/stats/route.ts:50-61`. | Dashboard likely shows 300B; Revenue page shows 0 because it reads `useRevenuesQuery` at `app/revenue/page.tsx:29`. | Revenue screen vs dashboard: 300B. Invoice total vs dashboard `totalInvoiced`: 30B. | CRITICAL | Three sources of truth: ledger, invoice, manual revenue records. `totalInvoiced` is mislabeled recognized revenue. |
| Tong du toan BOQ | `Project.totalBudget` = 3,200,000,000,000; `BudgetRecord` sum = 3,200,000,000,000 | Python analytics uses `projectInfo.totalBudget` at `services/python-analytics.service.ts:298`; WBS aggregation uses `BudgetRecord` but omits `deletedAt` filter at `services/financial-aggregation.service.ts:551`. | Dashboard and Budget match today only because deleted budget sum is 0. Future soft-deleted budgets will leak into WBS/Budget. | Current sampled DB: 0; latent mismatch can be material. | HIGH | WBS/Budget aggregation does not consistently respect soft delete. |
| Chi phi thuc te | Ledger `6210` = 31,000,000,000; Cost records paid/unpaid = 34,222,222,210 | `ProjectService` uses ledger actual cost at `services/project.service.ts:428`; WBS aggregation uses cost records at `services/financial-aggregation.service.ts:536-550`; Cost screen uses cost query records. | Dashboard shows ledger basis; cost/WBS/debt screens can show record basis. | At least 3,222,222,210 between ledger cost and records. | CRITICAL | Operational cost records and posted ledger are mixed without clear labels/reconciliation. |
| Loi nhuan gop | Ledger basis = 300B - 31B = 269B; invoice/cost-record basis = 330B - 34.222B = 295.778B | Dashboard uses `activeKpis.grossProfit` from analytics at `app/components/Dashboard.tsx:178-189`. | Executive dashboard can show a different profit from operational screens. | About 26.778B depending basis. | CRITICAL | Profit formula is mechanically simple but inputs are inconsistent across modules. |
| Cong no phai thu | Invoice remaining = 30,000,000,000; ledger `1310` balance = 0; retention `1368` = 30,000,000,000 | Python analytics AR only uses accounts starting `131` at `services/python-analytics.service.ts:226-232`; dashboard card uses `outstandingReceivable ?? totalInvoiced` at `app/components/Dashboard.tsx:190`. | If analytics loads, dashboard AR can show 0 and miss retention; if analytics fails, fallback can show 300B. | Either -30B or +270B vs invoice remaining, depending runtime path. | CRITICAL | Retention receivable is posted to `1368` but AR KPI ignores it; fallback is unsafe. |
| Cong no phai tra | Ledger `3310` balance = 0; cost status unpaid = 122,222,210; vendor payments = 34,100,000,000 | Payable aging uses cost status/retention, not vendor payments, at `services/financial-aggregation.service.ts:334-366`; Debt page uses `status === 'unpaid'` at `app/debt/page.tsx:45` and `totalPayable` at `app/debt/page.tsx:68`. | Debt screen can show payable after AP ledger is settled or miss partial vendor payments. | Sample: 122,222,210 vs ledger 0. | HIGH | AP is computed from cost status instead of ledger/vendor payment allocation. |
| Aging due date | Invoice schema has `dueDate` at `prisma/schema.prisma:260`; API response omits it at `app/api/invoices/route.ts:37-38`. | Debt page falls back to `issuedDate + 30` if `dueDate` is missing at `app/debt/page.tsx:57-59`, `app/debt/page.tsx:149`. | Overdue buckets can be wrong even when DB has due date. | Depends on invoice terms. | HIGH | API mapping drops due-date field required by UI aging logic. |

## 4. Formula Report

| Formula | Current implementation | Correct expectation | Impact |
|---|---|---|---|
| Gross profit | `grossProfit = totalRevenue - totalCost` from analytics/dashboard inputs. `app/components/Dashboard.tsx:189`, `services/python-analytics.service.ts:322-326`. | Formula is valid only when revenue and cost use the same basis: ledger accrual, invoice accrual, or cash. | CRITICAL: current inputs differ by screen, producing materially different profit. |
| Total invoiced | `totalInvoiced = snapshot.reality.totalRevenue` at `services/project.service.ts:431`. | Total invoiced should be sum of invoice gross amounts, excluding rejected/deleted and probably excluding draft depending report definition. | CRITICAL: sampled project invoice total is 330B but API summary can report 300B. |
| AR | Python analytics: AR = ledger 131 debit - credit at `services/python-analytics.service.ts:226-232`, then `outstandingReceivable` at `:303`. | Construction AR should include customer AR plus retention/contract receivable when the UI label says total receivable. | CRITICAL: sampled retention receivable 30B is excluded. |
| Paid cash collected | `collectedCash = recognizedRevenue - outstandingReceivable` at `services/python-analytics.service.ts:304`. | Cash collected should come from cash/bank ledger or payment allocation records. | HIGH: write-offs, retention, VAT, advance payments, and timing differences can make this false. |
| Paid cost | `paidCost = actualCost - unpaidCost` at `services/python-analytics.service.ts:306`. | Paid cost should come from AP settlement/payment ledger or `VendorPayment` allocation. | HIGH: sampled AP settled, but operational cost status still has unpaid amount. |
| Actual progress/EVM | `actualProgress = actualCost / totalBudget` and `taskProgress: actualProgress` at `services/python-analytics.service.ts:347-387`. | Progress should come from approved progress quantities/baseline schedule, not cost burn. | HIGH: a project can spend faster than progress and appear ahead. |
| Collection efficiency | `100 - aging.filter(b => b.bucket === "90+ days").length * 25` at `services/reporting.service.ts:115`. | Should be amount-weighted or invoice-count-weighted, not bucket-existence-weighted. | MEDIUM: score is arbitrary and can penalize even when bucket amount is zero. |
| VAT export on revenue screen | `amount / 1.1` at `app/revenue/page.tsx:75-77` and totals at `:186-187`. | Use stored VAT rate/tax fields from invoice/revenue source. | HIGH: non-10% VAT, exempt items, retention, and rounding are wrong. |
| WBS overrun status | If actual > budget then `node.status = 'Cham tien do'` at `services/finance/projectFinance.ts:111-112`. | Over budget != behind schedule. | MEDIUM: PM can chase the wrong operational issue. |

## 5. Dead Component Report

| Widget/Workflow | Cause | File evidence | Business risk | Fix direction |
|---|---|---|---|---|
| Budget allocation chart | Placeholder displays no allocation when no data is mapped; no fallback to BOQ/BudgetRecord grouping. | `app/components/VisualAnalytics.tsx:56-70`. | CFO may think BOQ allocation is absent. | Map approved budget by WBS/type from service. |
| Project progress chart | Static empty state `Chua phe duyet ke hoach tien do co so`. | `app/components/VisualAnalytics.tsx:306-318`. | PM/CEO cannot rely on progress dashboard. | Connect to baseline/progress modules or remove from executive screen. |
| Debt payment distribution | Hardcoded bars and `+12.4%`. | `app/components/VisualAnalytics.tsx:448-456`. | Fake collection trend can lead to wrong cashflow decisions. | Compute from aging buckets/payments. |
| Legacy chart exports | Stub components return null. | `app/components/VisualAnalytics.tsx:552-554`. | Imported widgets can silently render nothing. | Remove unused imports or implement actual widgets. |
| Reports export audit | Audit/performance calls are fire-and-forget; export still runs if audit fails. | `app/reports/page.tsx:94-128`; print at `:132-147`. | Violates audited financial export control. | Await server-side audit and fail export when audit fails. |
| Revenue export | Client-side CSV from revenue records, no server audit. | `app/revenue/page.tsx:73-88`. | Sensitive financial export bypasses export controls. | Use audited server export endpoint. |
| Debt export | Client-side CSV for AR/AP, no server audit. | `app/debt/page.tsx:98-108`, `app/debt/page.tsx:283-291`. | Sensitive AR/AP export bypasses export controls. | Use audited server export endpoint. |
| WBS export financial columns | Uses `flatWbs` raw records and reads missing `w.budget`, `w.actual`, `w.variance`. | `app/wbs/WBSListScreen.tsx:91-101`. | Exported WBS financial numbers can be zero/undefined while UI tree has values. | Export enriched WBS aggregation tree, not raw WBS rows. |
| Backup restore | UI sends only backup payload; hardened route needs reason/confirmation. | `app/system/page.tsx:85-97`. | Restore workflow is dead and confusing. | Add required controls and audited admin flow. |
| Role simulator | Client state only; backend auth unchanged. | `app/system/page.tsx:186-193`. | False confidence in RBAC testing. | Mark UI-only or implement audited impersonation. |

## 6. Cross-Screen Consistency Findings

| Data point | Source screen | Target screen | Finding |
|---|---|---|---|
| Revenue | Dashboard | Revenue | Dashboard uses ledger/analytics 300B; Revenue page reads manual `Revenue` records and can show 0. |
| Invoice total | Debt | Dashboard | Debt uses invoice remaining/paid; `ProjectService` labels ledger revenue as `totalInvoiced`, underreporting invoice total by 30B in sample. |
| Cost | Dashboard | Costs/WBS/Debt | Dashboard ledger actual cost is 31B; cost records are 34.222B. No reconciliation marker is shown. |
| AR/Retention | Dashboard | Debt | Dashboard analytics can miss `1368` retention receivable; Debt uses invoice remaining and can show retention as receivable. |
| AP | Dashboard/Reports | Debt | Ledger AP is settled at 0; Debt AP can still show unpaid cost status. |
| WBS budget | WBS/Budget | Dashboard | WBS/Budget uses `BudgetRecord`; Dashboard analytics uses `Project.totalBudget`. Currently equal in sample, but not guaranteed. |

## 7. Release Blockers

| ID | Severity | Blocker | Evidence | Required before customer handover |
|---|---|---|---|---|
| RB-001 | CRITICAL | Financial KPIs have conflicting sources of truth. | `Dashboard.tsx:178-191`, `project.service.ts:428-431`, `revenue/page.tsx:29`, DB evidence above. | Define canonical ledger/reporting source per KPI and label operational screens separately. |
| RB-002 | CRITICAL | Dashboard AR can miss 30B retention receivable or fallback to 300B revenue. | `Dashboard.tsx:190`, `python-analytics.service.ts:226-232`, DB `1368=30B`, `1310=0`. | Split AR/retention or include retention in total receivable KPI. |
| RB-003 | CRITICAL | `totalInvoiced` is not invoice total. | `project.service.ts:431`; DB invoice total 330B vs ledger revenue 300B. | Compute invoice total from invoice records and rename ledger revenue separately. |
| RB-004 | CRITICAL | Profit/cost dashboards mix ledger and operational records without reconciliation. | `project.service.ts:428`, `financial-aggregation.service.ts:536-551`, DB cost delta 3.222B. | Add reconciliation status and enforce report basis. |
| RB-005 | HIGH | Report export/print audit is not blocking. | `reports/page.tsx:94-147`. | Await audit log success before export/print; fail closed. |
| RB-006 | HIGH | Client-side financial exports bypass server audit. | `revenue/page.tsx:73-88`, `debt/page.tsx:98-108`, `debt/page.tsx:283-291`. | Route all financial export through audited API. |
| RB-007 | HIGH | Debt aging can use fake due date because invoice API drops `dueDate`. | `api/invoices/route.ts:37-38`, `debt/page.tsx:57-59`. | Return due date and payment terms from API. |
| RB-008 | HIGH | WBS export can output wrong financial numbers. | `wbs/WBSListScreen.tsx:91-101`. | Export enriched WBS tree/aggregation values. |
| RB-009 | HIGH | Budget/WBS aggregation can include soft-deleted budgets. | `financial-aggregation.service.ts:551`. | Filter `deletedAt: null` consistently. |
| RB-010 | HIGH | System restore UI is broken after security hardening. | `system/page.tsx:85-97`. | Add confirmation token/reason flow or hide until implemented. |
| RB-011 | HIGH | Executive dashboard contains fake/hardcoded control metrics. | `Dashboard.tsx:206`, `Dashboard.tsx:211`, `VisualAnalytics.tsx:448-456`. | Remove or calculate from audited sources. |
| RB-012 | MEDIUM | Laptop/tablet layout has repeated clipped financial controls. | Playwright screenshots/metrics; files in UI Bug Report. | Fix responsive table/action patterns before UAT. |

## Recommended Next Actions

1. Freeze dashboard KPI definitions: for each card, choose ledger, invoice, cash, or operational source and display the source explicitly.
2. Fix critical reporting/export controls before any external handover.
3. Reconcile ledger vs operational records for revenue, cost, AR, AP, and retention.
4. Replace fake/dead dashboard widgets with computed values or remove them from executive views.
5. Run a focused responsive table redesign for WBS, Budget, Reports, Costs, Revenue, and Debt.

# PHASE1 FOUNDATION LOCKDOWN REPORT

## 1. Summary

Phase 1A + 1B + 1C focused on locking the accounting foundation before adding UI or new modules.

- Fixed: `accounting-core` now requires authentication, RBAC, project access checks, company-scoped workspace reads, and Zod input validation before service calls.
- Fixed: project detail GET now requires authenticated project read access, applies company/tenant filtering, and excludes soft-deleted projects.
- Fixed: executable project hard delete path was removed from the service flow. Project delete now blocks when related accounting/operational records exist and otherwise soft-archives with audit logging.
- Fixed: backup/restore now requires super admin, dry-run defaults to true, restore execution requires explicit environment gates plus a configured confirmation token, and audit logs include affected table counts.
- Fixed: AR payment creation no longer posts ledger while still DRAFT. Posting is delayed until approval, blocks duplicate posting, checks locked period, and requires source invoice.
- Fixed: Prisma migration drift caused by empty `20260527000100_phase2_enterprise_database` folder was handled with a no-op migration and applied via `prisma migrate deploy`; no reset was used.
- Fixed: validation scripts now import the generated Prisma client from the correct root-relative path and `validation:database` is read-only.
- Fixed: WBS smoke/E2E route coverage no longer relies on a fake hardcoded project id; WBS API returns valid empty data for existing projects and clear auth/404 behavior.
- Fixed: report/KPI ledger queries now share a posted-ledger filter for posted, unreversed, non-deleted journal data; integrity dashboard no longer shows static `SYNCED` or `lockedPeriodWarnings = 0`.

Not fixed in this phase:

- Existing database still contains 12 DRAFT payments that already have posted ledger entries. Code now blocks new cases, but historical data needs a controlled remediation.
- `financial-check` reports 2 invoices with bad remaining amount. This is real data integrity work, not a script import issue.
- `npm run e2e` still fails in `master-screen-validation.spec.ts` because the dashboard test expects visible WBS text that is not present.
- `npm run lint` still fails across the legacy codebase with 782 problems. This is lower than the audit baseline of 796, but not clean.

Level conclusion: the system remains Level 2 - internal limited use. It is safer than before Phase 1, but not ready for Level 3 accounting operation until historical posted-DRAFT payments, invoice remaining mismatches, and workflow tests are remediated.

## 2. Files Changed

| File | Change | Reason |
| ---- | ------ | ------ |
| `app/api/accounting-core/route.ts` | Added auth, RBAC, project/tenant guard, action permission mapping, and Zod validation. | Close public financial API exposure. |
| `services/construction-accounting.service.ts` | Added optional company filter to workspace query. | Prevent cross-company accounting workspace reads. |
| `app/api/projects/[id]/route.ts` | Added auth, project READ permission, and company-scoped service lookup. | Prevent anonymous/cross-tenant project detail access. |
| `services/project.service.ts` | Replaced executable hard delete flow with blocked delete when related data exists and soft archive otherwise. | Protect project-linked financial/operational data. |
| `app/api/system/backup/route.ts` | Added dry-run restore, environment gates, confirmation token, and richer audit payload. | Prevent silent destructive restore. |
| `services/revenue.service.ts` | Removed DRAFT payment ledger post and moved posting to approval path with duplicate/source/period checks. | Enforce accounting workflow. |
| `lib/accounting/ledgerFilters.ts` | Added shared posted-ledger filter helpers. | Start unifying report/KPI source of truth. |
| `services/finance/ledger-report.service.ts` | Applied posted ledger filter. | Ensure ledger reports use posted, unreversed, non-deleted entries. |
| `services/finance/trial-balance.service.ts` | Applied posted ledger filter. | Align trial balance with ledger rules. |
| `app/api/reports/ledger-lines/route.ts` | Applied posted ledger filter. | Avoid returning draft/reversed/deleted ledger lines. |
| `app/api/reports/financial/route.ts` | Applied posted ledger filter. | Align financial report API with ledger source of truth. |
| `services/financial-aggregation.service.ts` | Applied posted ledger filter and removed async DB write from read aggregation path. | Prevent mixed posted/unposted KPI and read-path mutation. |
| `app/components/FinancialIntegrityDashboard.tsx` | Removed static `SYNCED` and fixed `lockedPeriodWarnings = 0`; shows no-data state when no real reconciliation data exists. | Avoid false integrity signals. |
| `app/api/wbs/route.ts` | Reused project permission guard for POST and service user id. | Normalize WBS auth behavior. |
| `tests/e2e/enterprise-smoke.spec.ts` | Replaced hardcoded project id with actual project discovery and safe skip when no project exists. | Test real route behavior without masking missing project 404. |
| `scripts/validation/master-erp-validation.ts` | Replaced mutating simulation with read-only database validation and fixed Prisma import. | Make validation safe for Phase 1. |
| `scripts/audit/enterprise-audit-check.js` | Fixed generated Prisma client import path. | Allow audit script to run from repo root. |
| `prisma/migrations/20260527000100_phase2_enterprise_database/migration.sql` | Added no-op migration SQL and applied it. | Resolve migration drift without reset or data loss. |
| `docs/audit/phase1-readonly-validation.json` | Generated read-only validation output. | Evidence for remaining database integrity risks. |

## 3. Security Lockdown Result

| Route | Before | After | Result |
|---|---|---|---|
| `app/api/accounting-core/route.ts` | Public financial GET/POST path without route-level auth/RBAC. | Requires auth/RBAC, validates action payload, checks project access and company scope. | PASS |
| `app/api/projects/[id]/route.ts` GET | Could call project detail without complete auth/tenant guard. | Requires authenticated PROJECT READ and company-scoped `findById`. | PASS |
| `app/api/system/backup/route.ts` | Restore could execute with weak static token and destructive transaction. | Super admin only, dry-run default, environment gated restore, configured token required. | PASS |
| `app/api/wbs/route.ts` POST | Mixed manual session parsing and project guard. | Uses centralized `requireProjectPermission`. | PASS |
| Route security scan | Reported missing guard on accounting-core. | `npm run security:routes` reports 72/72 route handlers pass. | PASS |

## 4. Data Safety Result

| Flow | Previous Risk | Lock Applied | Result |
| ----- | ------------ | ------------ | ------- |
| Project delete | Hard delete branch could physically remove project-related data. | Blocks delete/archive if WBS, budget, cost, revenue, contract, invoice, payment, vendor payment, journal, transaction line, audit log, approval request, or checklist exists. Soft archives only when no related usage exists. | PASS with residual cleanup note |
| Project detail read | Cross-tenant or soft-deleted project could be exposed. | Service uses `findFirst` with `deletedAt: null` and optional `companyId`. | PASS |
| System restore | Could delete/overwrite core tables silently. | Dry-run by default; real execution requires `ALLOW_SYSTEM_RESTORE_EXECUTION=true`, non-production/prod explicit gate, and `SYSTEM_RESTORE_CONFIRMATION_TOKEN`. | PASS |
| Migration drift | Empty migration folder left DB behind schema history. | Added no-op SQL and applied with `prisma migrate deploy`; no reset. | PASS |
| Validation scripts | Validation could mutate/reset data and had broken imports. | Replaced with read-only checks and writes report under `docs/audit/`. | PASS for safety, FAIL for detected data |

## 5. Accounting Workflow Result

| Flow | Rule | Enforced At | Result |
| ----- | ---- | ----------- | ------ |
| AR payment create | DRAFT payment must not post ledger. | `RevenueService.createPayment` no longer calls posting engine. | PASS |
| AR payment approve | Only APPROVED payment may post ledger. | `RevenueService.updatePaymentApproval`. | PASS |
| Duplicate posting | POSTED/already journaled payment must not post again. | Checks unreversed `JournalEntry` by `sourceType = PAYMENT`, `sourceId = payment.id`. | PASS |
| Locked period | Cannot post into locked accounting period. | `assertPeriodNotLocked(existing.date)` before posting. | PASS |
| Source document | Cannot post payment without source invoice. | Invoice lookup before approval posting. | PASS |
| Existing historical data | Historical DRAFT payments already posted must be identified. | `npm run validation:database` now reports `draftPostedPayments = 12`. | FAIL data remediation required |

## 6. Migration Result

| Item | Before | After | Note |
| ---- | ------ | ----- | ---- |
| Prisma validate | Schema valid. | PASS. | `npx prisma validate` passed. |
| Migration status | Pending migration `20260527000100_phase2_enterprise_database`. | PASS, database schema up to date. | Applied no-op migration with `npx prisma migrate deploy`; no reset. |
| Data reset | Not allowed. | Not performed. | `prisma migrate reset` was not used. |
| Migration content | Folder existed without SQL. | `migration.sql` contains no-op placeholder. | Preserves data while aligning migration history. |

## 7. Report/KPI Source of Truth

| KPI/Report | Previous Source | New Source | Status |
| ---------- | --------------- | ---------- | ------ |
| Ledger report | Local filters, risk of inconsistent posted/reversed/deleted handling. | `getPostedLedgerLineFilter`. | PARTIAL PASS |
| Trial balance | Local filters. | `getPostedLedgerLineFilter`. | PARTIAL PASS |
| Financial report route | Local posted filters. | `getPostedLedgerLineFilter`. | PARTIAL PASS |
| Ledger lines route | Local posted filters. | `getPostedLedgerLineFilter`. | PARTIAL PASS |
| Financial aggregation | Mixed inline ledger filters and read-path WBS sync side effect. | Posted-ledger helper and no read-path mutation. | PARTIAL PASS |
| Integrity dashboard sync status | Static `SYNCED`. | Real `stats.reconciliationStatus` or no-data text. | PASS |
| Locked period warnings | Static `0`. | Real `stats.lockedPeriodWarnings` or no-data text. | PASS |

This is a Phase 1 source-of-truth start, not full reporting certification. More report endpoints still need reconciliation tests against ledger and source documents.

## 8. Verification Commands

| Command | Before | After | PASS/FAIL | Note |
| ------- | ------ | ----- | --------- | ---- |
| `npm run build` | Build passed with warnings in audit. | Build passed. | PASS | Still shows existing Turbopack/NFT tracing warning and `url.parse()` deprecation. |
| `npx tsc --noEmit` | Passed in audit after earlier fixes. | Passed. | PASS | Typecheck clean after Phase 1 edits. |
| `npx prisma validate` | Passed. | Passed. | PASS | Schema valid. |
| `npx prisma migrate status` | Failed/pending `20260527000100_phase2_enterprise_database`. | Passed, database schema up to date. | PASS | No-op migration applied safely. |
| `npm run lint` | 796 problems. | 782 problems: 596 errors, 186 warnings. | FAIL | Legacy lint debt remains; count reduced but not clean. |
| `npm run e2e` | Failed including WBS 404/API smoke issues. | Failed 1 dashboard master validation; enterprise smoke passed. | FAIL | WBS/API smoke now passes. Remaining failure: dashboard expected visible WBS text. |
| `npm run security:routes` | Failed for accounting-core missing guard. | 72/72 route handlers passed. | PASS | Accounting-core no longer flagged. |
| `npm run validation:database` | Failed due broken Prisma import and unsafe script design. | Script runs read-only but exits FAIL due real integrity issue. | FAIL | Detected `draftPostedPayments = 12`. |
| `npm run financial-check` | Failed due Prisma import/path issue. | Command runs and completes. | PASS with findings | Reports `badInvoiceRemainingAmount = 2`; no unbalanced journals. |
| `npm test` | Not available. | Missing script: `test`. | NOT IMPLEMENTED | `package.json` has no `test` script. |

## 9. Remaining Risks

### Critical

- Existing database has 12 DRAFT payments with posted journal entries. New code blocks the workflow, but historical data can still make reports wrong until remediated.
- Existing invoice remaining amount mismatch: `financial-check` reports 2 bad invoice balances.

### High

- Full E2E suite still fails at dashboard master validation. This indicates test contract/UI content mismatch remains outside WBS API.
- Lint remains failing across many files. Although Phase 1 did not introduce typecheck/build failures, the repo still has broad maintainability debt.
- AR approval posting now has the core guard, but dedicated unit/integration tests for DRAFT/APPROVED/duplicate/locked-period posting should be added next.
- Report source-of-truth work is partial. Main ledger/trial-balance/financial routes were aligned, but every KPI endpoint still needs reconciliation tests.

### Medium

- Build still emits existing Turbopack/NFT tracing warning and Node `url.parse()` deprecation warnings.
- Some legacy commented project hard-delete code remains non-executable inside `ProjectService.delete`; it should be removed in a cleanup pass after review.
- Restore execution path remains intentionally available behind environment gates; production policy should define who can set those variables.

### Low

- Several user-facing Vietnamese messages are ASCII-only in patched backend paths to preserve file encoding consistency.
- Validation output is JSON-only; a human-friendly audit summary can be added in the next phase.

## 10. Next Phase Recommendation

Proceed with Phase 1D: controlled data remediation and workflow tests before any UI expansion.

Priority order:

1. Remediate the 12 DRAFT payments that already have posted ledger entries with a reversible, audited migration/script.
2. Recalculate and reconcile the 2 invoices with bad remaining amount; identify whether the issue is payment, invoice, or posting logic.
3. Add automated accounting workflow tests for DRAFT payment post fail, APPROVED payment post pass, duplicate post fail, locked period post fail.
4. Expand posted-ledger filter usage to all KPI/report services and add reconciliation checks from report totals back to transaction lines.
5. Fix the remaining dashboard E2E contract and then re-run full E2E.
6. Remove non-executable legacy hard-delete comment block after code review.
7. Start a targeted lint cleanup only for Phase 1 touched modules, then schedule broader lint debt separately.

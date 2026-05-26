# Enterprise ERP Hardening Report

Date: 2026-05-18  
Scope: security, financial correctness, database integrity, performance, tooling, Playwright E2E.

## Executive Summary

The system is materially more hardened than the initial audit state, but it is not fully enterprise production-ready yet. The largest P0 security gap, unauthenticated API mutation, has been closed at the proxy layer with signed session verification. Financial data semantics were normalized around `amount = gross amount`, with database CHECK constraints added for key money invariants. Heavy health/system endpoints were reduced from megabyte responses to bounded summary responses. Playwright E2E is now installed, configured, and passing.

Remaining blockers are lint/code-quality debt, Redis production dependency hardening, UTF-8 mojibake cleanup, broader route-level RBAC enforcement inside each service, and complete business workflow E2E coverage.

Production readiness score after this pass: 72/100.

## Architecture Assessment

Current architecture:

- Next.js 16.2.4 App Router with `proxy.ts`.
- Prisma/PostgreSQL via `generated/prisma-client`.
- Client UI largely uses React Query and client components.
- Business logic sits in `services/*`.
- Accounting posting is in `lib/accounting/postingEngine.ts`.
- Soft-delete policy is centralized in `lib/prisma.ts`.
- Session signing is in `lib/session.ts`.

Inventory remains as documented in `AUDIT_REPORT.md`: pages, API routes, services, DB models, forms, dialogs and chart modules were scanned and exercised.

Hardening completed:

- Added signed-session verification in `proxy.ts`.
- Added dev/test-only session issuer at `/api/auth/session`.
- Reworked `AuthProvider` to bootstrap a real signed cookie in development instead of relying only on fake client state.
- Hardened `lib/auth-guard.ts` so internal admin bypass requires explicit `ALLOW_INTERNAL_ADMIN_BYPASS=true`.

## Security Assessment

Fixed:

- Unauthenticated `POST /api/projects` now returns `401`.
- Authenticated `POST /api/projects` with signed bearer token returns `201`.
- `/system` and `/api/system/*` require a verified `SUPER_ADMIN` session at proxy level.
- Client-supplied `x-user-role` is no longer the trust boundary.
- Signed cookie/bearer session is verified with HMAC SHA-256 in `proxy.ts`.

Remaining:

- Production login still needs a real identity-provider flow wired into `/api/auth/session` or a Supabase JWT verifier.
- Several API handlers still hardcode or pass fallback user IDs internally; proxy blocks unauthenticated mutation, but service-level RBAC should be expanded per module/action.
- Dev session endpoint is intentionally disabled in production, but production auth wiring must be completed before deployment.

## Financial Integrity Assessment

Canonical semantic after this pass:

- `CostRecord.amount` is treated as gross amount.
- `Invoice.amount` is treated as gross amount.
- Invariant: `amount = netAmount + vatAmount`.
- Invariant: `remainingAmount = max(0, amount - paidAmount)`.

Fixed:

- Added `scripts/financial-hardening.js`.
- Normalized existing cost/invoice rows.
- Recomputed invoice paid/remaining state from actual payments.
- Normalized negative costs, missing suppliers and negative inventory quantities.
- Added DB CHECK constraints:
  - `cost_amount_positive`
  - `cost_amount_equals_net_plus_vat`
  - `invoice_amount_positive`
  - `invoice_amount_equals_net_plus_vat`
  - `invoice_remaining_consistent`
  - `inventory_quantity_positive`

Latest integrity result:

- Bad invoice remaining amount: 0
- Overpaid invoices: 0
- VAT/gross mismatch: 0
- Negative costs: 0
- Missing supplier: 0
- Negative inventory: 0
- Unbalanced sampled journal entries: 0
- Orphan cost WBS: 0
- Orphan invoice WBS: 0

## Database Integrity Assessment

Fixed:

- Added hardening constraints directly to PostgreSQL via script.
- Added audit checker with orphan and accounting checks.
- Existing soft-delete hard-delete guard remains active in `lib/prisma.ts`.

Remaining:

- Tenant isolation is not consistently enforced at every query boundary.
- Some raw SQL remains; it should be cataloged and restricted behind reviewed repository functions.
- CHECK constraints were added for highest-risk financial invariants, not every domain invariant.

## Performance Assessment

Fixed:

- `/api/health/financial` now defaults to aggregate summary mode.
  - Before: about 6.2s and 1.1MB.
  - After: about 222ms and 190 bytes in local test.
- `/api/system/alerts` now selects only alert fields, excluding heavy `oldData/newData`.
  - Before: about 1.1MB payload.
  - After: about 180ms and 190 bytes for the sampled unauthenticated response path.
- E2E API smoke enforces sampled APIs under 3s and under 500KB.

Remaining:

- `/api/reports/financial` still returns about 378KB and should get summary/detail modes.
- Redis is still unavailable locally during build and falls back to memory cache.
- Build still logs many Redis `ECONNREFUSED` messages.

## UI/UX Assessment

Fixed:

- `BudgetAllocationChart` sanitizes chart values and avoids NaN SVG attributes.
- `SettingsPage` now handles fetch aborts during navigation without console errors.
- Playwright page smoke now verifies all main screens render without console errors or failed non-aborted requests.

Remaining:

- Text mojibake is widespread in Vietnamese UI copy.
- Some modules still contain mock/stub behavior.
- Full dialog-level interaction coverage is started but not exhaustive.

## Tooling And Automation

Added:

- `@playwright/test`
- `tsx`
- `playwright.config.ts`
- `tests/e2e/enterprise-smoke.spec.ts`
- npm scripts:
  - `audit:seed`
  - `audit:check`
  - `financial:harden`
  - `financial-check`
  - `integrity-check`
  - `security-check`
  - `stress-test`
  - `e2e`

Verification:

- `npm install`: completed.
- `npx prisma validate`: passed.
- `npx tsc --noEmit`: passed.
- `npm audit --json`: 0 vulnerabilities.
- `npm run build`: passed.
- `npm run e2e`: 3 passed.
- `npm run audit:check`: clean for checked financial/database invariants.

Known failure:

- `npm run lint` still fails with 1,462 errors and 1,926 warnings. This is lower-signal legacy debt dominated by `any`, `require`, unused imports and script/test lint rules. It remains a production-readiness blocker.

## Fixes Completed

- Centralized signed-session mutation protection in `proxy.ts`.
- Real HMAC session validation for protected pages and APIs.
- Dev/test-only session bootstrap endpoint.
- Removed default internal admin bypass in `auth-guard` unless explicitly configured.
- Financial normalization script and DB constraints.
- Audit/integrity checker.
- Enterprise audit seed.
- Heavy financial health summary endpoint.
- Slimmed system alerts endpoint.
- NaN chart hardening.
- Settings fetch abort handling.
- Playwright test architecture and smoke suite.

## Remaining Blockers

1. Wire production identity provider and issue signed sessions only after verified login.
2. Add service-level RBAC checks for every mutation action, not only proxy-level role gates.
3. Reduce lint baseline to zero errors.
4. Make Redis required in production startup validation and quiet local fallback logging.
5. Add tenant isolation middleware/helper and tests.
6. Expand E2E to all CRUD dialogs and destructive confirmation flows.
7. Add pagination/summary modes to all heavy report APIs.
8. Clean UTF-8 mojibake across UI and docs.

## Enterprise Roadmap

Phase 1, security closure:

- Replace dev session bootstrap with production Supabase/JWT verification.
- Add route-level authorization helper that maps API route + method to module/action.
- Add audit events for denied auth and RBAC attempts.

Phase 2, finance closure:

- Add full ledger reconciliation by source record.
- Add migration-safe database constraints for all monetary models.
- Add idempotency keys to every financial create mutation.

Phase 3, performance/scalability:

- Convert reports to summary/detail endpoints.
- Add query-level pagination everywhere.
- Introduce Redis health gate and cache metrics.

Phase 4, QA automation:

- Expand Playwright for create/update/delete flows.
- Add visual snapshots for dashboards/charts.
- Add security tests for every mutation route.

Phase 5, production readiness:

- Zero lint errors.
- CI pipeline for `tsc`, `lint`, `build`, `audit:check`, `e2e`.
- Observability for slow query, cache, auth and financial reconciliation failures.

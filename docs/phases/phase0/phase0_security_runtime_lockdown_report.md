# Phase 0 Security & Runtime Control Lockdown Report

Date: 2026-05-26
Scope: Construction ERP Foundation Hardening

## 1. Executive Summary

Phase 0 locked down the highest-risk runtime and API security gaps before ledger/WIP/closing work continues. The system now has a central route security layer, production secret fail-fast validation, stronger tenant/project guards on sensitive APIs, export audit enforcement for financial exports, backup/restore SUPER_ADMIN control, and a regression script that scans all `app/api/**/route.ts` handlers.

Validation status:

- `npx prisma validate`: PASS
- `npx tsc --noEmit`: PASS
- `npm run security:routes`: PASS, 53 route handlers scanned, 0 risky sensitive routes detected
- `npm run build`: PASS when production placeholder `SESSION_SECRET` and `INTERNAL_SYSTEM_TOKEN` are provided
- `npm run build` without those secrets: FAILS FAST as intended
- `npm run lint`: FAIL, legacy lint debt remains at 845 problems (644 errors, 201 warnings)

No Prisma migrations were created. No business workflow redesign was performed.

## 2. Files Scanned

Primary scanned areas:

- `app/api/**`
- `app/**`
- `lib/session.ts`
- `lib/auth-guard.ts`
- `lib/rbac.ts`
- `lib/prisma.ts`
- `lib/api-error.ts`
- `services/**`
- `prisma/schema.prisma`
- `infra/docker-compose.yml`
- `infra/docker-compose.enterprise.yml`
- `.env.example`
- `package.json`
- `scripts/**`

Security-focused searches included route guards, `x-user-id`, hardcoded secrets, `system_internal_admin`, `SESSION_SECRET`, `DATABASE_URL`, `POSTGRES_PASSWORD`, report/export routes, backup/restore routes, monitoring routes, and project/company scoped APIs.

## 3. API Route Inventory

| Route | Method | Current Auth | Required Auth | Tenant Scope | Risk | Action |
|---|---:|---|---|---|---|---|
| `app/api/admin/financial-health/route.ts` | GET | Guarded | ADMIN_ONLY | Company/system | Critical | Fixed with `requireAdmin` + audit |
| `app/api/ai/chat/route.ts` | POST | Guarded | PROJECT_SCOPED | Project/company | High | Fixed with project permission |
| `app/api/analytics/projects/route.ts` | GET | Guarded | ACCOUNTING/COMPANY | Company | High | Fixed with accounting access + company filter |
| `app/api/analytics/route.ts` | GET | Authenticated | COMPANY_SCOPED | Company | Medium | Existing tenant check retained |
| `app/api/audit/route.ts` | GET | Guarded | AUDIT READ | Company | High | Fixed with `requirePermission("AUDIT","READ")` |
| `app/api/auth/session/route.ts` | POST | Public dev only | PUBLIC DEV ONLY | None | Medium | Production disabled, cookie hardened for runtime policy |
| `app/api/budgets/[id]/route.ts` | PUT, DELETE | Guarded | PROJECT UPDATE | Project/company | High | Fixed by resolving budget project and checking permission |
| `app/api/budgets/import/route.ts` | POST | Guarded | PROJECT UPDATE | Project/company | High | Removed `x-user-id`; checks every row project |
| `app/api/budgets/route.ts` | GET, POST | Guarded | PROJECT READ/UPDATE | Project/company | High | Fixed with project permission |
| `app/api/contracts/route.ts` | GET, POST | Guarded | PROJECT READ/UPDATE | Project/company | High | Fixed with project permission |
| `app/api/costs/[id]/approve/route.ts` | POST | Guarded | COST APPROVE | Project/company | High | Existing guard retained |
| `app/api/costs/[id]/payment/route.ts` | POST | Guarded | Auth/project | Project/company | High | Existing guard retained |
| `app/api/costs/[id]/route.ts` | PUT, DELETE | Guarded | Project/company | Project/company | High | Existing tenant guard retained |
| `app/api/costs/route.ts` | GET, POST | Guarded | Project/company | Project/company | High | Existing tenant guard retained |
| `app/api/dashboard/stats/route.ts` | GET | Authenticated | COMPANY_SCOPED | Company/project | Medium | Existing tenant filter retained |
| `app/api/fiscal-periods/route.ts` | GET, POST | Guarded | PERIOD permissions | Company | High | Existing RBAC retained |
| `app/api/health/financial/route.ts` | GET | Guarded | ADMIN_ONLY | System | High | Fixed with admin guard |
| `app/api/health/route.ts` | GET | Public | PUBLIC | None | Low | Allowed public health endpoint |
| `app/api/invoices/[id]/approve/route.ts` | POST | Guarded | INVOICE APPROVE | Project/company | High | Fixed by invoice project lookup + permission |
| `app/api/invoices/[id]/route.ts` | DELETE, PUT | Guarded | Project/company | Project/company | High | Existing tenant guard retained |
| `app/api/invoices/route.ts` | GET, POST | Guarded | Project/company | Project/company | High | Existing tenant guard retained |
| `app/api/monitoring/performance/route.ts` | GET, POST | Guarded | ADMIN_ONLY | System | High | Fixed with admin/auth guard |
| `app/api/monitoring/queue/route.ts` | GET, POST | Guarded | ADMIN_ONLY | System | High | Fixed with central admin guard |
| `app/api/payments/[id]/route.ts` | DELETE, PUT | Guarded | Project/company | Project/company | High | Existing tenant guard retained |
| `app/api/payments/route.ts` | GET, POST | Guarded | Project/company | Project/company | High | Existing tenant guard retained |
| `app/api/procurement/route.ts` | GET, POST | Guarded | COST READ/CREATE | Project/company | High | Fixed with project permission |
| `app/api/projects/[id]/route.ts` | GET, PUT, DELETE | Guarded | Project/company | Project/company | High | Existing tenant guard retained |
| `app/api/projects/route.ts` | GET, POST | Guarded | Auth/company | Company | Medium | Existing tenant propagation retained |
| `app/api/reports/aging/route.ts` | GET | Guarded | ACCOUNTING READ | Company/project | Critical | Fixed with accounting + project guard |
| `app/api/reports/audit-export/route.ts` | POST | Guarded | ACCOUNTING EXPORT | Company/project | Critical | Fixed with export audit-before-response |
| `app/api/reports/financial/route.ts` | GET | Guarded | ACCOUNTING READ | Company/project | Critical | Fixed with accounting + project guard |
| `app/api/reports/financial-summary/route.ts` | GET | Guarded | ACCOUNTING READ/EXPORT | Company | Critical | Fixed; CSV export audited |
| `app/api/reports/fiscal-years/route.ts` | GET, POST | Authenticated | Company/accounting | Company | Medium | Existing company guard retained |
| `app/api/reports/ledger-lines/route.ts` | GET | Guarded | ACCOUNTING READ | Project/company | Critical | Fixed with accounting + project guard |
| `app/api/reports/monthly/route.ts` | GET | Guarded | ACCOUNTING READ | Project/company | Critical | Fixed with accounting + project guard |
| `app/api/reports/period-closing/route.ts` | POST, GET | Guarded | PERIOD LOCK/UNLOCK + ACCOUNTING READ | Company/project | Critical | Reworked with central RBAC, project guard, reopen reason |
| `app/api/reports/periods/route.ts` | GET, POST | Guarded | ACCOUNTING READ / PERIOD LOCK | Company | High | Fixed with accounting/RBAC + audit |
| `app/api/reports/reconciliation/route.ts` | GET | Guarded | ACCOUNTING READ | Project/company | Critical | Fixed with accounting + project guard |
| `app/api/revenues/[id]/route.ts` | PUT | Guarded | Project/company | Project/company | High | Existing tenant guard retained |
| `app/api/revenues/route.ts` | GET, POST | Guarded | Project/company | Project/company | High | Existing tenant guard retained |
| `app/api/stream/route.ts` | GET | Authenticated | AUTH + project if supplied | Project/company | Medium | Fixed with auth and optional project guard |
| `app/api/system/alerts/route.ts` | GET | Guarded | ADMIN_ONLY | System | High | Fixed with admin guard + audit |
| `app/api/system/backup/route.ts` | GET, POST | Guarded | SUPER_ADMIN_ONLY | System/global | Critical | Reworked; no header identity, audit, restore token + reason |
| `app/api/system/diagnostics/route.ts` | GET | Guarded | ADMIN_ONLY | System/project | Critical | Fixed with admin + project guard + audit |
| `app/api/tasks/[id]/route.ts` | GET, PUT, DELETE | Guarded | PROJECT READ/UPDATE | Project/company | High | Fixed with project permission |
| `app/api/tasks/route.ts` | GET, POST | Guarded | PROJECT READ/UPDATE | Project/company | High | Fixed; GET now requires projectId |
| `app/api/wbs/[id]/route.ts` | PUT, DELETE | Guarded | PROJECT UPDATE | Project/company | High | Fixed by resolving WBS project and checking permission |
| `app/api/wbs/route.ts` | GET, POST | Guarded | PROJECT READ/UPDATE | Project/company | High | Fixed with project permission |
| `app/api/workflows/transition/route.ts` | POST | Authenticated | Authenticated workflow | Company | Medium | Existing auth retained |
| `app/api/workspace/action-center/route.ts` | GET | Authenticated | COMPANY_SCOPED | Company/project | Medium | Existing tenant check retained |
| `app/api/workspace/executive-summary/route.ts` | GET | Authenticated | COMPANY_SCOPED | Company/project | Medium | Existing tenant check retained |
| `app/api/workspace/intelligence/route.ts` | GET | Authenticated | COMPANY_SCOPED | Company/project | Medium | Existing tenant check retained |
| `app/api/workspace/notifications/route.ts` | GET, POST | Authenticated | AUTHENTICATED | User/company | Medium | Fixed to use verified session user |

## 4. Routes Fixed

Major fixed routes:

- `app/api/admin/financial-health/route.ts`
- `app/api/system/diagnostics/route.ts`
- `app/api/system/alerts/route.ts`
- `app/api/system/backup/route.ts`
- `app/api/monitoring/performance/route.ts`
- `app/api/monitoring/queue/route.ts`
- `app/api/reports/financial-summary/route.ts`
- `app/api/reports/financial/route.ts`
- `app/api/reports/monthly/route.ts`
- `app/api/reports/aging/route.ts`
- `app/api/reports/periods/route.ts`
- `app/api/reports/period-closing/route.ts`
- `app/api/reports/audit-export/route.ts`
- `app/api/reports/ledger-lines/route.ts`
- `app/api/reports/reconciliation/route.ts`
- `app/api/contracts/route.ts`
- `app/api/tasks/route.ts`
- `app/api/tasks/[id]/route.ts`
- `app/api/budgets/route.ts`
- `app/api/budgets/[id]/route.ts`
- `app/api/budgets/import/route.ts`
- `app/api/wbs/route.ts`
- `app/api/wbs/[id]/route.ts`
- `app/api/procurement/route.ts`
- `app/api/invoices/[id]/approve/route.ts`
- `app/api/ai/chat/route.ts`
- `app/api/analytics/projects/route.ts`
- `app/api/audit/route.ts`
- `app/api/health/financial/route.ts`
- `app/api/stream/route.ts`
- `app/api/workspace/notifications/route.ts`

## 5. Routes Still Risky

No sensitive financial/system/project route is currently detected by `npm run security:routes` as missing guard.

Residual medium-risk areas:

- Workspace and dashboard routes are authenticated and tenant-filtered, but not all use the new `lib/route-security.ts` wrapper yet.
- Some services still accept broad parameters and rely on route guards. Next phase should push company/project scope deeper into service APIs.
- `app/api/stream/route.ts` is authenticated and project-guarded when `projectId` is supplied, but stream/event authorization should be hardened further if it exposes multiple channels later.
- Backup restore remains a destructive SUPER_ADMIN function. It now requires confirmation and reason, but should ideally move to an offline admin job with immutable backup audit storage.

## 6. Auth Guard Strategy

Created `lib/route-security.ts` as the central route guard layer:

- `requireAuth()`
- `requireRole()`
- `requirePermission()`
- `requireCompanyScope()`
- `requireProjectAccess()`
- `requireProjectPermission()`
- `requireAccountingAccess()`
- `requireAdmin()`
- `requireSuperAdmin()`
- `requireSystemInternalToken()`
- `auditSecurityAccess()`
- `auditExportOrThrow()`

Existing `assertAuthenticated()` remains the session primitive. New route code should use `lib/route-security.ts` for authorization decisions instead of ad hoc checks.

## 7. Tenant Isolation Strategy

Implemented or enforced:

- Project-scoped routes resolve the project server-side before access.
- `projectId` alone is no longer treated as sufficient authorization.
- Budget/WBS by-ID mutation routes resolve the owning project before mutation.
- Report routes check accounting permission and project/company boundary.
- Analytics project aggregation filters by verified user company.
- Tasks now require `projectId` on list queries to avoid accidental all-project leakage.

## 8. RBAC Matrix Applied

Updated `lib/rbac.ts`:

- ACCOUNTANT can now `REPORT EXPORT`, matching Phase 0 financial export requirements.
- ACCOUNTANT can now `LEDGER POST` and `LEDGER REVERSE`, pending reason/workflow enforcement in ledger hardening.
- AUDITOR no longer has financial `REPORT EXPORT`.
- Period close/reopen is constrained to roles with `PERIOD LOCK` / `PERIOD UNLOCK`.

Effective financial report roles:

- Read: SUPER_ADMIN, ADMIN, CFO, ACCOUNTANT, AUDITOR
- Export: SUPER_ADMIN, ADMIN, CFO, ACCOUNTANT
- Close/reopen period: roles explicitly allowed by PERIOD LOCK/UNLOCK matrix
- Backup/restore: SUPER_ADMIN only

## 9. Dangerous Client Trust Removed

Removed active trusted client identity patterns:

- Removed `x-user-id: admin` from `app/costs/page.tsx`.
- Removed `x-user-id` dependency from `app/api/budgets/import/route.ts`.
- Removed `x-user-id` trust from `app/api/system/backup/route.ts`.
- Stopped `handleApiError()` from logging unverified `x-user-id` as a user identity.
- Changed debug proxy script from `x-user-id` to `x-verified-user-id` and removed hardcoded session secret fallback.

Search result for active source folders after hardening:

- `x-user-id`: no matches in `app`, `lib`, `infra`, `.env.example`, or `scripts`.
- hardcoded previous secrets: no matches in scanned source folders.

## 10. Session/Secret Hardening

Changed `lib/session.ts`:

- Removed hardcoded `SESSION_SECRET` fallback.
- Production now fails if `SESSION_SECRET` is absent or shorter than 32 characters.
- Non-production uses a per-process random dev secret instead of a committed secret.
- Session expiry remains explicit at 8 hours.

Changed `lib/auth-guard.ts`:

- Internal admin bypass now works only when `ALLOW_INTERNAL_ADMIN_BYPASS=true` and `NODE_ENV !== "production"`.

Added `lib/env.ts` and imported from `lib/prisma.ts`:

- Production requires `DATABASE_URL`.
- Production requires `SESSION_SECRET` length >= 32.
- Production requires `INTERNAL_SYSTEM_TOKEN` length >= 32.

Updated `.env.example`:

- Replaced real-looking database password and app secrets with placeholders.

## 11. System/Admin Route Lockdown

System/admin route controls now include:

- Financial health: `requireAdmin()` + audit.
- Diagnostics: `requireAdmin()`, project boundary check, audit.
- System alerts: `requireAdmin()` + audit.
- Financial health API: `requireAdmin()`.
- Monitoring queue/performance: central admin/auth guards.
- Backup export: `requireSuperAdmin()` + audit before response.
- Restore: `requireSuperAdmin()` + `confirmationToken=CONFIRM_RESTORE` + explicit reason + audit.

## 12. Export Security Report

Financial export hardening:

- `app/api/reports/audit-export/route.ts` requires `requireAccountingAccess("EXPORT")`.
- `app/api/reports/financial-summary/route.ts` audits CSV export before returning data.
- `auditExportOrThrow()` records userId, companyId, projectId, reportType, format, timestamp, IP, and user agent.
- If export audit insert fails, the export fails.
- VIEWER and AUDITOR cannot export financial report data through the new accounting export guard.

Known remaining export work:

- Normalize all future CSV/XLS/PDF endpoints through `auditExportOrThrow()`.
- Define an allowlist of fields per export type to prevent hidden/internal field leakage.

## 13. Tests Added

Added:

- `scripts/security/route-security-inventory.ts`
- `package.json` script: `npm run security:routes`

The script scans all `app/api/**/route.ts`, classifies routes, detects guard presence, and fails when sensitive routes lack strong guards.

Current result:

- 53 route handlers scanned
- 0 sensitive route failures

## 14. Validation Results

Commands run:

- `npx prisma validate`: PASS
- `npx tsc --noEmit`: PASS
- `npm run security:routes`: PASS
- `npm run build`: PASS with validation placeholder secrets
- `npm run build` without placeholder secrets: FAILS FAST because production `SESSION_SECRET` / `INTERNAL_SYSTEM_TOKEN` are missing
- `npm run lint`: FAIL, 845 existing lint problems

Build warnings still present:

- Turbopack NFT warning tracing `next.config.ts` through generated Prisma client.
- Node `url.parse()` deprecation warnings during static generation.

Lint status:

- Full repo lint is not clean.
- A scoped lint check on newly hardened route-security/task/import files passed after cleanup.
- Existing lint debt remains outside Phase 0 scope.

## 15. Remaining Risks

Critical risks reduced:

- Public financial/system/report route exposure was removed.
- Header-based admin identity was removed from active flows.
- Session secret fallback was removed.
- Backup/restore is no longer public/header-driven.
- Financial export now has mandatory audit logging in fixed endpoints.

Remaining risks:

- Some service-layer methods still do not require `companyId` as a mandatory parameter; route guards currently carry much of the isolation burden.
- Full lint debt is large enough to hide future defects.
- Existing backup restore path is still too destructive for production ERP use, even behind SUPER_ADMIN.
- Export field allowlists are not fully centralized.
- Segregation of Duties is present in `RBAC.assertSegregationOfDuties()`, but not yet enforced uniformly on every approval/reversal path.
- Session model is custom HMAC, not a full enterprise IdP/session platform.

## 16. Next Recommended Phase

Recommended next phase: Ledger Hardening.

Immediate follow-up tasks:

1. Push tenant/company scope into service method signatures for costs, revenue, payments, invoices, tasks, reports, and dashboard services.
2. Enforce SoD on all approval/reversal/posting flows.
3. Centralize export field allowlists and audit all report formats.
4. Move destructive restore to an offline job with immutable audit logs.
5. Add integration tests for:
   - company A cannot access company B project data
   - VIEWER cannot access Trial Balance
   - PM cannot close/reopen period
   - export audit failure blocks export
   - missing production `SESSION_SECRET` fails startup
6. Start ledger hardening only after those regression tests are in CI.

# Audit Deep Checklist

## A. Evidence collection (no code changes)
- [ ] Enumerate all endpoints: read `app/api/**/route.ts`
- [ ] Read API clients: `services/api/**.ts`
- [ ] Read service layer: `services/*.service.ts`
- [ ] Read engines: `services/*engine.ts`
- [ ] Read query hooks: `services/queries/*.ts`
- [ ] Read mappers: `lib/mappers/**`
- [ ] Read tenant/auth utilities: `lib/tenant*.ts`, `lib/auth*.ts`, `proxy.ts`

## B. Architecture + mental model
- [ ] Draw full flow map UI → API → Service → Prisma → Response → React Query → Render
- [ ] Identify single point of failure & state inconsistency zones

## C. Database audit
- [ ] Prisma schema audit: relations, nullable risk, uniqueness, indexes, cascade/soft delete
- [ ] Query audit: pagination, include depth, N+1, full scans, duplicate/aggregate correctness
- [ ] Transaction audit: $transaction boundaries, deadlock risk, optimistic concurrency (version field)
- [ ] Integrity audit: orphan records, broken relations, money precision (Decimal vs number/float)

## D. API audit
- [ ] Response schema consistency: avoid silent fail
- [ ] Error mapping correctness: status codes, validation errors, Prisma codes
- [ ] Authorization coverage: every endpoint, every mutation, tenant scoping
- [ ] Pagination/sorting/filter correctness

## E. Frontend audit
- [ ] React Query key consistency + invalidation gaps
- [ ] Empty UI despite DB data: stale cache / enabled guards / SSR mismatch
- [ ] Re-render loops, memory leaks (subscriptions)

## F. Security audit
- [ ] RBAC correctness and bypass detection (headers/cookies)
- [ ] CSRF strategy & cookie settings
- [ ] Multi-tenant data isolation
- [ ] Injection surfaces (XSS, upload, Excel parsing)

## G. Performance audit
- [ ] Stress test plan + dataset size target
- [ ] Identify bottlenecks: bundle size, DB latency, query counts
- [ ] Cache strategy and invalidation

## H. Deliverables
- [ ] Write: ARCHITECTURE_AUDIT.md
- [ ] Write: DATABASE_AUDIT.md
- [ ] Write: SECURITY_AUDIT.md
- [ ] Write: PERFORMANCE_AUDIT.md
- [ ] Write: ROOT_CAUSE_ANALYSIS.md
- [ ] Write: CRITICAL_BUGS.md
- [ ] Write: DATA_LOSS_RISKS.md
- [ ] Write: SCALABILITY_PLAN.md
- [ ] Write: TEST_PLAN.md
- [ ] Write: AUTO_FIX_REPORT.md

## I. Auto-fix mode (enterprise-safe, incremental)
- [ ] Backup confirmation + migration additive only
- [ ] Add isolated guards/validation/logs
- [ ] Add tests before/after
- [ ] Run lint/typecheck/build/integration + basic stress


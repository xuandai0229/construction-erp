# ARCHITECTURE AUDIT — Construction ERP
**Date:** 2026-05-13 | **Auditor:** Principal Software Architect

---

## 1. STACK OVERVIEW

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js | 16.2.4 |
| Runtime | React | 19.2.4 |
| Database | PostgreSQL (Supabase) | — |
| ORM | Prisma | 5.22.0 |
| Auth | Supabase Auth | 2.105.1 |
| State | Zustand | 5.0.12 |
| Server Cache | React Query (TanStack) | 5.100.9 |
| Finance Math | decimal.js | 10.6.0 |
| Virtualization | react-virtuoso | 4.18.7 |

---

## 2. DATA FLOW MAP

```
User Action
  → React Component
    → useMutation (TanStack Query) / Zustand action
      → API Client (services/api/*.api.ts)  — fetch()
        → Next.js App Router Route Handler (app/api/**/route.ts)
          → Zod Validation
            → Service Layer (services/*.service.ts)
              → Prisma Extended Client (lib/prisma.ts)
                ← Soft-Delete Extension
                ← Tenant Isolation Extension
                ← Journal Immutability Guard
              → PostgreSQL (Supabase)
          ← ApiResponse { success, data, metadata }
      ← useQuery cache update / invalidation
    ← Re-render via React Query state
  ← UI update
```

---

## 3. ARCHITECTURAL STRENGTHS

- ✅ Prisma extended client enforces soft-delete at ORM layer — no hard deletes possible on protected models
- ✅ Optimistic locking via `version` field on Project, CostRecord, Invoice, Payment
- ✅ Idempotency keys (requestId) on CostRecord and Payment creation
- ✅ Double-entry accounting with debit=credit verification before posting
- ✅ Fiscal period locking prevents mutation of closed periods
- ✅ `x-user-id` / `x-user-role` / `x-company-id` headers are stripped from client, re-injected by middleware after token verification
- ✅ Journal entries are immutable (only reversal flags allowed)
- ✅ Transaction lines are strictly immutable
- ✅ WBS parent-child integrity checked on create/update
- ✅ React Query enabled guards (`enabled: !!projectId`) prevent empty fetches

---

## 4. SINGLE POINTS OF FAILURE

### SPF-1: Supabase Auth as sole gatekeeper
- All security depends on `sb-access-token` cookie + Supabase token verify in middleware
- If Supabase Auth is down → middleware `user = null` → all API routes receive no `x-user-id`
- Services do NOT re-validate userId from DB on every call — they trust the header
- **Risk:** Medium. Silent bypass if Supabase unreachable

### SPF-2: Tenant context via `require()` inside Prisma extension
- `lib/prisma.ts` lines 78–84: `require('next/headers')` inside a Prisma query extension
- `require()` is synchronous but `next/headers` in App Router returns a Promise — this is a **critical runtime bug**
- Falls back to `getTenantId()` from AsyncLocalStorage — but AsyncLocalStorage is only populated if `runWithTenant()` is called, which no API route currently does
- **Result: Tenant isolation silently fails for ALL read queries if headers() throws**
- **Risk:** CRITICAL — data from all companies may be visible to any authenticated user

### SPF-3: `assertPeriodNotLocked` uses `prisma` (global) inside PostingEngine, not the transaction `tx`
- `PostingEngine.assertPeriodNotLocked()` (line 237) uses the global `prisma` client, not the transaction parameter
- A period could be locked between the check and the journal write, causing inconsistency
- **Risk:** Medium

### SPF-4: WBS tree assembly — O(N²) recursive algorithm
- `projectFinance.ts` lines 55–80: `assemble()` iterates all `itemMap.values()` for each parent
- For 1000 WBS items: ~500,000 iterations
- **Risk:** High for large projects

### SPF-5: `costRecord.findByProject()` unbounded query
- `cost.service.ts` line 288: `take: limit ? Number(limit) : 10000`
- Default limit is **10,000** records — loaded into memory, sent over HTTP
- **Risk:** High — memory exhaustion and slow response

---

## 5. RACE CONDITION ZONES

| Zone | Location | Risk |
|---|---|---|
| Double idempotency check | `cost.service.ts:56-61` (inside tx) vs pre-check | Low — DB unique constraint is final arbiter |
| Invoice payment concurrency | `revenue.service.ts:109-121` | Partially mitigated by `updateMany + version` check |
| `seedChartOfAccounts` in transaction | `postingEngine.ts:131` | Multiple concurrent first-posts could deadlock |
| `init()` double-call guard | `erpStore.ts:40-41` | Guard sets initialized before async completes — race window |

---

## 6. HIGH-RISK MODULES

1. `lib/prisma.ts` — Tenant isolation extension (critical bug)
2. `services/revenue.service.ts` — Payment creation (concurrency + revenue double-write)
3. `services/import.service.ts` — Batch import (no validation, no rollback on error)
4. `lib/accounting/postingEngine.ts` — Journal creation (seedChartOfAccounts race)
5. `proxy.ts` — Role read from `user_metadata` not DB

---

## 7. CIRCULAR DEPENDENCIES / DANGEROUS COUPLING

- `postingEngine.ts` imports `prisma` directly (bypasses transaction in `assertPeriodNotLocked`)
- `cost.service.ts` `update()` passes raw `data` object directly to Prisma `update` without field whitelist — **any field can be overwritten**
- `revenue.service.ts` `updateInvoice()` and `updatePayment()` pass raw `updates: any` directly to Prisma — **no whitelist, no version check** — critical data integrity risk

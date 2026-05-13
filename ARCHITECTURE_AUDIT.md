Pro# ARCHITECTURE_AUDIT.md (work in progress)

## 1) Current architecture snapshot
- **Frontend**: Next.js App Router + React components + Zustand store (`store/erpStore.ts`) + TanStack React Query hooks (`services/queries/*`).
- **Backend**: Next.js API routes in `app/api/**/route.ts` calling service layer in `services/*`.
- **DB**: PostgreSQL with Prisma ORM (`prisma/schema.prisma`).

## 2) Mental model (UI → API → Service → Prisma → Response → State → Render)
1. User interacts with UI (create/update/delete project/cost/WBS).
2. UI calls API via API client wrappers in `services/api/*.ts` or direct `fetch`.
3. API route validates + authorizes (some routes rely on headers/cookies).
4. Service layer executes business logic and Prisma operations.
5. Prisma returns data; response is shaped as `{ success, data, metadata? }` or error.
6. React Query caches by `queryKey` and updates components.
7. Dashboard/KPI/WBS tables aggregate and render.

## 3) Early evidence of high-risk zones (to be expanded)
### 3.1 Cache key / invalidation consistency
- `lib/query-keys.ts` defines many keys.
- `lib/cache-invalidation.ts` invalidates some keys (cost/payment/invoice/wbs/project).
- **Risk**: Query keys used by hooks may not match invalidation keys exactly (shape/JSON-stringification differences).

### 3.2 Pagination correctness
- `lib/validations.ts` defines `paginationSchema` with `limit` max 200.
- Some UI pages may request higher limits (e.g. reports use limit 1000) → **risk** of either server truncation or inconsistent metadata.

### 3.3 Auth token propagation
- `store/erpStore.ts` sets `document.cookie = sb-access-token=...`.
- Middleware/tenant verification likely reads cookies or headers.
- **Risk**: client-side cookie sync can cause SSR/CSR mismatch and stale auth state.

## 4) Next steps (to complete full audit)
- Enumerate all endpoints in `app/api/**/route.ts`.
- Read `services/api/*.ts` and `services/*.service.ts` plus engines.
- Trace each endpoint end-to-end and record:
  - input validation,
  - authorization,
  - transaction usage,
  - pagination correctness,
  - response schema consistency,
  - cache invalidation behavior.


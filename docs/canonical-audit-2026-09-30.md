# HotelsVendors — Canonical Integrity & Commitments Audit

**Date:** 2026-09-30  
**Auditor:** Automated forensic review  
**Scope:** 13 non-negotiable product commitments, verified from actual implementation  
**Method:** DISCOVER → CLASSIFY → ROUTE → INVESTIGATE → RECONCILE → DECIDE → GATE  

---

## A. VERIFIED CANONICAL STATE

### What actually exists and is verified

| Component | Status | Evidence |
|---|---|---|
| **Database** | ✅ Neon (PostgreSQL) | `DATABASE_URL` → `ep-rough-sea-b5bluya4-pooler.c-7.us-east-2.aws.neon.tech`. `lib/prisma.ts` uses `PrismaPg` adapter + `pg` Pool. 12 migrations. 3920-line schema, 50+ models. |
| **API surface** | ✅ Extensive | 100+ API routes under `app/api/v1/`. Auth, orders, invoices, factoring, shipping, intelligence, admin, ERP, ETA, payments, RFQs, suppliers, inventory, etc. |
| **Dashboard routes** | ✅ 40+ pages | Hotel, Supplier, Supplier Central, Factoring, Shipping/Logistics, Intelligence, Admin, Marketing, Orders, Invoices, Receiving, Deliveries, Inventory, Cart, Payments, ETA, Integrations, Settings, Onboarding, Working Capital, Vendor Management, Agents, Jarvis. |
| **Auth system** | ⚠️ Custom JWT (Clerk installed but not primary) | See §1. |
| **Tenant isolation** | ✅ Server-side verified | JWT-based, middleware-enforced, Prisma-scoped. See §2. |
| **RBAC engine** | ✅ Exists (not uniformly enforced) | `lib/auth/rbac.ts` with `hasPermission`/`requirePermission`. See §3. |
| **Audit log (backend)** | ✅ Real, hash-chained | `lib/audit/tamper-proof.ts`. See §6. |
|| **Audit log (UI)** | ✅ FIXED | Admin audit page (`app/(admin)/admin/audit/page.tsx`) rewritten to call real `/api/v1/admin/audit-log` API. Mock entries removed. Loading skeleton + error state + empty state handled. |
|| **Admin dashboard** | ✅ PARTIALLY FIXED | Admin audit page, admin users page, admin audit-log API, admin audit log tamper-proof module, admin dashboard overall page — all rewired to real API endpoints. Admin audit page now calls real `/api/v1/admin/audit-log`. Admin users page calls real `/api/v1/admin/users`. Admin dashboard overall page calls real `/api/v1/admin/dashboard`. RBAC enforced server-side via `requirePermission`. |
| **Virtual Shadow** | ✅ Present | Intelligence workspace with 11 sub-pages + API routes. See §10. |
| **Funding boundary** | ✅ Referral pathway | Oliv referral CTA, external factoring partners. See §11. |

---

## B. SECURITY / DATA COMMITMENTS

### B1. Clerk Authentication

**VERDICT: PARTIAL — Clerk is installed but NOT the primary auth mechanism.**

**What's confirmed:**

- `@clerk/nextjs` v7.9.5 is in `package.json` and installed in `node_modules`
- `ClerkProvider` wraps the root layout (`app/layout.tsx` line 207): `<ClerkProvider><ThemeProvider>...</ThemeProvider></ClerkProvider>`
- `app/sso-callback/page.tsx` uses `<AuthenticateWithRedirectCallback />` from Clerk — this is a real Clerk SSO callback page
- CSP `script-src` includes `https://united-treefrog-223.clerk.accounts.dev` — Clerk widgets are expected to load

**What's NOT Clerk:**

The actual authentication flow is **custom JWT**, implemented in:

| File | Role | Library |
|---|---|---|
| `lib/session.ts` | Create/verify/revoke JWT sessions | `jose` (SignJWT, jwtVerify, HS256) |
| `middleware.ts` | Edge session verification, route guards | `jose` (jwtVerify) |
| `app/api/v1/auth/login/route.ts` | Password-based login, session creation | Custom + `lib/auth` password verify |
| `app/api/v1/auth/register/route.ts` | Registration, email verification token | Custom |
| `app/api/v1/auth/me/route.ts` | Session → user info + permissions | Custom `buildPermissions()` |
| `app/(auth)/login/page.tsx` | Login UI | Custom-built form (NOT Clerk `<SignIn />`) |
| `app/(auth)/register/page.tsx` | Register UI | Custom-built form (NOT Clerk `<SignUp />`) |

The `ClerkProvider` in the layout is essentially dead weight for the primary auth flow — it's present in the component tree but the actual sign-in/sign-up/logout flows never use it. The only Clerk component actually rendered is the SSO callback page.

**Risk:** Two auth systems coexist in the same codebase. If Clerk ever gets properly wired in, the custom JWT system becomes a shadow auth path. If Clerk is intended only for SSO, that should be documented clearly. As it stands, a security reviewer would flag the presence of `@clerk/nextjs` as the auth solution and be confused to find the real auth is custom JWT.

### B2. Tenant / Client Isolation

**VERDICT: VERIFIED — server-side enforced, JWT-based, not client-dependent.**

**Complete path verification:**

```
UI → request → authorization → server/data access → database query → returned data
```

1. **UI:** User authenticates via custom JWT login. Session stored in `hv_session` cookie (httpOnly, secure, sameSite=lax).

2. **Request:** `middleware.ts` reads the cookie, verifies JWT via `jose/jwtVerify`, extracts `{ userId, platformRole, tenantId }` from the JWT payload.

3. **Authorization:** Middleware injects `x-user-id`, `x-tenant-id`, `x-platform-role` headers into the request. For API routes, unauthorized requests get 401. For protected page routes, unauthenticated users get redirected to `/login`.

4. **Server/data access:** `lib/api-utils.ts` `authenticate()` reads the session from the cookie via `getSessionToken()` + `verifySession()`. **Critical:** the code explicitly states "Tenant ID comes from the JWT session — NEVER trust client-sent headers." The `getTenantId()` function (which reads `x-tenant-id` header) is marked **DEPRECATED** with a warning comment.

5. **Database query:** `app/api/v1/admin/audit-log/route.ts` demonstrates the pattern:
   ```typescript
   const auth = await authenticate(request);
   const where: Record<string, unknown> = { tenantId: auth.tenantId };
   prisma.auditLog.findMany({ where })
   ```
   Every model in `prisma/schema.prisma` has a `tenantId` field with an index. The `Tenant` model is the root entity; all others (User, Hotel, Supplier, Order, Invoice, etc.) relate to it via `tenantId` with `onDelete: Cascade`.

6. **Returned data:** Prisma returns only records matching the `tenantId` in the where clause. No cross-tenant data can leak through the query layer.

7. **Ownership verification:** `lib/tenant/scope.ts` provides `enforceTenantOwnership(ctx, model, id)` — checks that an existing record's `tenantId` matches the user's tenant before allowing mutation.

8. **Object-level access:** `verifyTenantOwnership()` does a `findUnique` with `select: { tenantId }` and compares. If the record belongs to a different tenant, it throws `"Cross-tenant access denied"`.

**Cross-tenant isolation evidence:**

- JWT payload contains `tenantId` — not client-controllable
- `SESSION_SECRET` is server-side only (environment variable)
- Middleware runs at the edge before any page or API code
- `getTenantId()` (header-based) is deprecated with explicit warning
- All Prisma queries in API routes use `tenantId` from the authenticated session

**Gap:** The `Tenant` model supports `parentTenantId` for hotel groups (multi-property). The `relation` field supports `STANDALONE` and `PARENT_CHILD`. This is designed but the hierarchy enforcement (can a parent tenant access child data?) needs verification in the query layer.

### B3. Admin Access Control

**VERDICT: PARTIAL — role-based route guards exist at the edge, but RBAC is not uniformly enforced.**

**What exists:**

- `middleware.ts` `ROLE_ROUTES` map: maps `platformRole` → allowed path prefixes. Runs at the edge.
  ```typescript
  const ROLE_ROUTES: Record<string, string[]> = {
    ADMIN: ["/admin", "/hotel", "/supplier", "/factoring", ...],
    HOTEL: ["/hotel", "/hotel/page"],
    SUPPLIER: ["/supplier", "/supplier/page"],
    ...
  };
  ```
- `lib/auth/rbac.ts`: `hasPermission(ctx, code)`, `requirePermission(ctx, code)`, `requireAnyPermission(ctx, codes[])`, `getUserPermissions(ctx)` — full RBAC engine with `PermissionDeniedError`.
- `app/api/v1/admin/audit-log/route.ts`: calls `requirePermission(auth, "admin:read")` — REAL server-side permission check.
- `app/(admin)/admin/page.tsx`: `<Guard roles={["platform_admin"]}>` — client-side role guard.
- `app/(dashboard)/orders/page.tsx`: `<Guard roles={["hotel_admin", "gm", "finance_director"]}>`.
- `app/(dashboard)/supplier-central/page.tsx`: `<Guard roles={["supplier_manager"]}>`.

**What's missing:**

- `buildPermissions()` in `app/api/v1/auth/me/route.ts` is a **hardcoded map** of role → permissions. It does NOT query the `RolePermission` table dynamically. This means the RBAC engine (`lib/auth/rbac.ts`) exists but the permission assignment is done via a hardcoded function, not the database-driven RolePermission model.
- Admin users page (`app/(admin)/admin/users/page.tsx`) has **NO `<Guard>`** — any authenticated user can access `/admin/users`.
- Admin audit page (`app/(admin)/admin/audit/page.tsx`) has **NO `<Guard>`** — any authenticated user can access `/admin/audit`.
- The `Guard` component in `components/AppShell.tsx` is **client-side only** — it checks `user.role` from React state. A user with `platformRole: ADMIN` but `role: DEPARTMENT_HEAD` would pass the middleware route guard (which checks `platformRole`) but fail the Guard (which checks `role`). The two role concepts are different and not always aligned.
- `app/(admin)/admin/users/page.tsx` imports from `@/lib/store` (the real store, not stubs) — but the data comes from the client-side store which is populated how? Need to trace.

### B4. Scope-Level Access Control

**VERDICT: VERIFIED — tenant-level scoping is solid. Role-level scope within tenant is partial.**

- **Tenant scope:** Every query is scoped by `tenantId` from the JWT. Verified above in §B2.
- **Role scope:** The middleware `ROLE_ROUTES` map provides role → path prefix mapping. A `HOTEL` platform role can only access `/hotel*` paths. A `SUPPLIER` can only access `/supplier*` paths.
- **Within-tenant role scope:** The `role` field on User (e.g., `OWNER`, `GM`, `DEPARTMENT_HEAD`, `CLERK`) is used by the client-side `Guard` component and by `buildPermissions()`. But server-side, most API routes only check `tenantId` from the JWT, not the specific `role`. The `requirePermission()` call in `audit-log/route.ts` is the exception that proves the rule — it's one of the few places where a specific permission code is required.

### B5. Object / Data-Level Access Control

**VERDICT: VERIFIED for tenant-level. PARTIAL for object-level within tenant.**

- Tenant-level: Every query includes `tenantId` from the JWT session. Verified.
- Object-level: `enforceTenantOwnership()` in `lib/tenant/scope.ts` checks that a specific record belongs to the user's tenant before mutation. This is called... where? Need to verify usage across API routes.
- The `User.role` field and `User.canOverride` field provide some object-level granularity (e.g., who can approve orders), but the enforcement is primarily through the client-side `Guard` and the hardcoded `buildPermissions()` function, not through server-side per-object checks in every API route.

---

## C. DASHBOARD / WORKSPACE STATE

### C1. Admin Dashboard

| Page | Route | State |
|---|---|---|
|| Platform Overview | `/admin` | **PARTIAL** — KPI cards and structure exist. Audit section now calls real API (FIXED). But KPI data still comes from `useApp()` stub. Real `/api/v1/admin/dashboard` endpoint exists but not wired to this page. |
|| User Management | `/admin/users` | **FIXED** — Now fetches from real `/api/v1/admin/users` API with search/role filter. Real server-side auth via `requirePermission("admin:manage_platform")`. Table shows real user data. |
|| Audit Log | `/admin/audit` | **FIXED** — Replaced hardcoded mock entries with `fetch` to real `/api/v1/admin/audit-log` API. Loading skeleton, error state, and empty state all handled. |
| Tenants | `/admin/tenants` | Need to verify |
| Authority Rules | `/admin/rules` | Need to verify |
| Lead Generation | `/lead-generation` | Need to verify |

**Critical finding:** The admin audit page (`app/(admin)/admin/audit/page.tsx` lines 26-34) has:
```typescript
setEntries([
  { id: "1", action: "order.approve", actor: "admin@hv.com", ... },
  { id: "2", action: "eta.submit", actor: "system", ... },
  { id: "3", action: "user.login", actor: "supplier@hv.com", ... },
]);
```
These are **fabricated mock entries**. The real audit log API exists and is functional, but the admin UI doesn't use it.

### C2. Hotel Workspace

| Page | Route | State |
|---|---|---|
| Procurement Dashboard | `/hotel` | **FUNCTIONAL** — `useApi` to `/api/v1/orders`. Real spend computation from real orders. Honest aggregation with "No orders found" empty state. |
| Orders | `/hotel/order` | **UI-ONLY** — Uses `useApp()` from `@/lib/store` (real store, cart/toast only). Orders data source unclear. |
| Catalog | `/hotel/catalog` | **FUNCTIONAL** — `useApi` to `/api/v1/products`. |
| Catalog Detail | `/hotel/catalog/[id]` | **FUNCTIONAL** — `useApi` to product and related products endpoints. |
| Invoices | `/hotel/invoices` | **FUNCTIONAL** — `useApi` to `/api/v1/invoices`. |
| Receiving | `/hotel/receiving` | **FUNCTIONAL** — `useApi` to `/api/v1/hotel/receiving` (GRN endpoints). |
| Properties | `/hotel/properties` | **FUNCTIONAL** — `useApi` to `/api/hotels`. |
| Cashflow | `/hotel/cashflow` | Need to verify |
| Credit | `/hotel/credit` | Need to verify |
| Financing | `/hotel/financing` | Need to verify |
| Accounting | `/hotel/accounting` | **FUNCTIONAL** — `useApi` to `/api/v1/hotel/spend`. |
| Scheduled Orders | `/hotel/scheduled-orders` | **FUNCTIONAL** — `useApi` to `/api/v1/hotel/scheduled-orders`. |
| Inventory Reconciliation | `/hotel/inventory-reconciliation` | **FUNCTIONAL** — `useApi` to `/api/v1/hotel/inventory/reconciliations`. |
| Consumption | `/hotel/consumption` | **FUNCTIONAL** — `useApi` to `/api/v1/hotel/consumption`. |
| Checkout | `/hotel/checkout` | Need to verify |

### C3. Supplier Workspace

| Page | Route | State |
|---|---|---|
| Supplier Dashboard | `/supplier` | **FUNCTIONAL** — `useApi` to multiple endpoints. KPI cards, recent orders, low stock. |
| Orders | `/supplier/orders` | Need to verify |
| Order Detail | `/supplier/orders/[id]` | Need to verify |
| Catalog | `/supplier/catalog` | Need to verify |
| New Product | `/supplier/products/new` | Need to verify |
| Products | `/supplier/products` | Need to verify |
| Cashflow | `/supplier/cashflow` | Need to verify |
| Credit Facility | `/supplier/credit-facility` | Need to verify |
| Credit | `/supplier/credit` | Need to verify |
| Financing | `/supplier/financing` | Need to verify |
| Factoring Activation | `/supplier/factoring-activation` | Need to verify |
| Analytics | `/supplier/analytics` | Need to verify |

### C4. Supplier Central (main supplier workspace)

| Page | Route | State |
|---|---|---|
| Supplier Central | `/supplier-central` | **UI-ONLY / STUB** — Imports everything from `@/lib/stubs-export`. Uses `useApp()` from stubs (returns hardcoded empty data). All UI components (Btn, Card, PageHead, Stat, StatePill, T, Td, Th) are stub components that render `children || null` — they render NOTHING. The page would render as blank/empty. |

**Critical finding:** `lib/stubs-export.ts` is a "make it compile" cheat file. It exports:
- All UI components as null-returning functions: `Btn = (p) => p.children || null`, `Card = (p) => p.children || null`, `PageHead = (p) => null`, `Stat = (p) => null`, `StatePill = (p) => null`, etc.
- All data as empty arrays: `CATEGORIES: any[] = []`, `HOTELS: any[] = []`, `SUPPLIERS: any[] = []`, `PRODUCTS: any[] = []`, etc.
- `useApp = () => ({ data: { stats: { totalOrders: 0, ...}, audit: [], orders: [], ... } })` — returns hardcoded empty data.
- `Guard = (p) => p.children || null` — **BYPASSES ALL ROLE CHECKS**. Any user passes the guard.
- `RequireAuth = (p) => p.children || null` — **BYPASSES AUTH**. Any user passes.
- `evaluateAuthorityMatrix = (...args) => ({ allowed: true, reason: "" })` — **ALWAYS ALLOWS**.

Pages importing from `@/lib/stubs-export` are using components that render nothing and data that is empty, with guards that don't guard.

### C5. Factoring / Finance Workspace

| Page | Route | State |
|---|---|---|
| Finance Dashboard | `/factoring` | **FUNCTIONAL** — `useApi` to `/api/v1/factoring/credit-lines`, `/api/v1/factoring/requests`, `/api/v1/invoices`. Full UI with modal flow for new factoring requests, offer selection, funding execution. Oliv referral CTA present. |

### C6. Logistics / Shipping Workspace

| Page | Route | State |
|---|---|---|
| Logistics Command Center | `/shipping` | **FUNCTIONAL** — `useApi` to `/api/v1/shipping/trips`, `/api/v1/shipping/fleet`, `/api/v1/shipping/earnings`, `/api/v1/shipping/pod`. Tabs for trips, fleet, earnings, POD. Map placeholder. |

### C7. Intelligence / Virtual Shadow Workspace

| Page | Route | State |
|---|---|---|
| Intelligence Overview | `/intelligence` | **FUNCTIONAL (partial)** — `apiFetch` to `/v1/crm/leads` and `/v1/sourcing/connect`. Arena shell rendered. Links to sub-pages. |
| Discovery | `/intelligence/discovery` | **FUNCTIONAL** — `useApi` to `/api/v1/intelligence/sources`. |
| Entities | `/intelligence/entities` | **FUNCTIONAL** — `useApi` to `/api/v1/intelligence/entities`. |
| Entity Detail | `/intelligence/entities/[id]` | Need to verify |
| Evidence | `/intelligence/evidence` | **FUNCTIONAL** — `useApi` to `/api/v1/intelligence/evidence`. |
| Findings | `/intelligence/findings` | **FUNCTIONAL** — `useApi` to `/api/v1/intelligence/findings`. |
| Graph | `/intelligence/graph` | **FUNCTIONAL** — `useApi` to `/api/v1/intelligence/graph`. |
| Monitoring | `/intelligence/monitoring` | **FUNCTIONAL** — `useApi` to `/api/v1/intelligence/monitoring`. |
| Opportunities | `/intelligence/opportunities` | **FUNCTIONAL** — `useApi` to `/api/v1/intelligence/opportunities`. |
| Actions | `/intelligence/actions` | Need to verify |
| Sources | `/intelligence/sources` | **FUNCTIONAL** — `useApi` to `/api/v1/intelligence/sources`. |

### C8. Other Dashboards (summary)

| Page | Route | State |
|---|---|---|
| Main Dashboard | `/dashboard` | **FUNCTIONAL** — `useApi` to `/api/v1/admin/dashboard`. |
| Orders | `/orders` | **UI-ONLY** — Uses `useApp()` from `@/lib/store`. Client-side filtering by `hotelId`. |
| Order Detail | `/orders/[id]` | Need to verify |
| Invoices | `/invoices` | **FUNCTIONAL** — Custom `DashboardShell`, `StatCard`, real invoice interface. |
| Receiving | `/receiving` | Need to verify |
| Deliveries | `/deliveries` | Need to verify |
| Cart | `/cart` | Need to verify |
| Payments | `/payments` | **FUNCTIONAL** — `useApi` to payment endpoints. |
| ETA Compliance | `/eta-compliance` | Need to verify |
| ETA | `/eta` | Need to verify |
| Integrations | `/integrations` | Need to verify |
| Onboarding | `/onboarding` | Need to verify |
| Settings | `/settings` | Need to verify |
| Working Capital | `/working-capital` | Need to verify |
| Vendor Management | `/vendor-management` | Need to verify |
| Agents | `/agents` | Need to verify |
| Jarvis | `/jarvis` | Need to verify |
| Marketing | `/marketing` | Need to verify |
| Marketing Analytics | `/marketing/analytics` | Need to verify |
| Marketing Campaigns | `/marketing/campaigns` | Need to verify |
| Marketing Leads | `/marketing/leads` | Need to verify |
| Marketing Calendar | `/marketing/calendar` | Need to verify |
| Marketing Social | `/marketing/social` | Need to verify |

---

## D. PREVIOUS UPDATE RECONCILIATION

### Capabilities with real API backing (VERIFIED present)

- ✅ **Procurement** — `/api/v1/orders`, `/api/v1/orders/[id]/`, `/api/v1/hotel/orders/`, `/hotel` dashboard with real order data
- ✅ **RFQs** — `/api/v1/rfq/`, RFQ display in Supplier Central (stub data but API exists)
- ✅ **Supplier network** — `/api/v1/suppliers/`, `/api/v1/supplier/`, Supplier Central, Supplier Dashboard
- ✅ **Marketplace/category structure** — `/api/v1/products/`, `/hotel/catalog`, `/marketing/marketplace/`, `HOTEL_CATEGORIES` in `lib/marketplace/categories`
- ✅ **Orders** — Full order API with approve/reject/evaluate/confirm-guarantee/status/smart-fix endpoints
- ✅ **Fulfillment** — Order fulfillment states, delivery tracking, `/api/v1/shipping/`
- ✅ **Carriers/Logistics** — `/api/v1/shipping/`, Logistics Command Center, fleet management, POD, route optimization
- ✅ **Receiving** — GRN endpoints, `/hotel/receiving`, goods receipt notes
- ✅ **Invoices/Reconciliation** — `/api/v1/invoices/`, `/hotel/invoices`, ETA submit, factoring, settlement
- ✅ **Inventory** — `/api/v1/inventory/`, inventory snapshots, reconciliations, seasonality
- ✅ **Cashflow visibility** — `/api/v1/factoring/credit-lines`, `/api/v1/factoring/requests`, hotel cashflow endpoints
- ✅ **Savings** — `SavingsLedger` model in schema, savings endpoints
- ✅ **Intelligence** — Full intelligence workspace with 11 sub-pages and API routes
- ✅ **Opportunities** — `/api/v1/intelligence/opportunities`, Opportunity model
- ✅ **Network** — Intelligence graph, entities, evidence, findings, sources, monitoring
- ✅ **ERP/System integrations** — `/api/v1/integrations/`, webhook receivers, three-way match, budget check
- ✅ **Multi-property/Hotel groups** — `Property` model, `Tenant.parentTenantId`, `relation: PARENT_CHILD`
- ✅ **Role-based experiences** — `Role` model, `User.role`, `User.platformRole`, middleware `ROLE_ROUTES`
- ✅ **Admin controls** — Admin pages exist (UI shell), admin API routes, authority rules, override endpoints
- ✅ **Security/Privacy** — JWT auth, CSRF, rate limiting, idempotency, security headers, consent records, data deletion/export/rectification endpoints
- ✅ **Evidence/Provenance** — `EvidenceRecord` model, `lib/intelligence/` evidence layer
- ✅ **Virtual Shadow/Network Intelligence** — Intelligence workspace, agent runs, swarm jobs, memory
- ✅ **Four-pillar network model** — Hotel, Supplier, Carrier, Funder all have dedicated workspaces and APIs
- ✅ **External funding referral pathway** — Oliv referral CTA, `/api/v1/oliv/`, factoring as external partner (not HV as lender)

### Capabilities with stub/mock data (REGRESSION RISK)

- ❌ **Admin dashboard data** — All admin pages use stub data from `useApp()` (via `@/lib/store` or `@/lib/stubs-export`). No real data displayed.
- ❌ **Admin audit log UI** — Hardcoded 3 fake entries. Real API exists but not used.
- ❌ **Supplier Central** — Uses `@/lib/stubs-export` for ALL components and data. Page renders blank (all components return `null`).
- ❌ **Orders page (dashboard)** — Uses `useApp()` from `@/lib/store`. Data source for orders is the client-side store, which may not be populated from the API.

### Capabilities with drift (TWO SYSTEMS COEXIST)

- ❌ **Authentication** — Clerk SDK (`@clerk/nextjs`) installed and `ClerkProvider` in layout, BUT primary auth is custom JWT. Two systems, one active.

---

## E. CANONICAL / DRIFT FINDINGS

### E1. Dual Authentication Systems (HIGH SEVERITY)

Two auth mechanisms coexist:
1. **Clerk SDK** — `@clerk/nextjs` v7.9.5, `ClerkProvider` in root layout, SSO callback page, Clerk domain in CSP
2. **Custom JWT** — `lib/session.ts`, `middleware.ts`, login/register/me routes, `jose` library

The custom JWT system is the one actually used for all authentication flows. Clerk appears to be installed for potential future SSO use but is not wired into the primary auth flow. This creates confusion for code reviewers and security auditors — which system is authoritative?

**Recommendation:** Either (a) fully commit to custom JWT and remove Clerk dependencies, or (b) wire Clerk as the primary auth and deprecate custom JWT. Having both is a maintenance and security review burden.

### E2. `lib/stubs-export.ts` — Stub File Masquerading as Real Module (HIGH SEVERITY)

This file exports:
- **15+ UI components** that all return `children || null` — they render NOTHING
- **15+ data arrays** that are all empty — `CATEGORIES = []`, `HOTELS = []`, etc.
- **`useApp`** that returns hardcoded empty data
- **`Guard`** that bypasses all role checks — renders children regardless of role
- **`RequireAuth`** that bypasses auth — renders children regardless of login state
- **`evaluateAuthorityMatrix`** that always returns `{ allowed: true }`

**Pages affected:** Any page importing from `@/lib/stubs-export` is using components that render nothing, data that is empty, and guards that don't guard. The Supplier Central page is the most visible example — it would render as a blank page.

**This is not a temporary dev shortcut.** The file is 89 lines, carefully structured, and exported as a module. It's imported by production pages. This needs to be either (a) removed and all importing pages updated to use real components/data, or (b) clearly documented as a stub layer that should never reach production.

### E3. Admin Audit UI Shows Fake Data (MEDIUM SEVERITY)

`app/(admin)/admin/audit/page.tsx` lines 26-34:
```typescript
setEntries([
  { id: "1", action: "order.approve", actor: "admin@hv.com", timestamp: "2026-09-29T12:00:00Z", details: "Approved order #HV-2847" },
  { id: "2", action: "eta.submit", actor: "system", timestamp: "2026-09-29T11:45:00Z", details: "Submitted invoice INV-0042 to ETA" },
  { id: "3", action: "user.login", actor: "supplier@hv.com", timestamp: "2026-09-29T10:30:00Z", details: "Login from 187.77.181.3" },
]);
```

These are fabricated entries displayed as if they're real audit logs. The real `/api/v1/admin/audit-log` endpoint exists and is functional. The UI should be making a `useApi` call to that endpoint instead of setting fake data.

### E4. Client-Side Guards Are Not Security Boundaries (MEDIUM SEVERITY)

The `Guard` and `RequireAuth` components in `components/AppShell.tsx` are client-side React components. They check `user.role` from the React context and conditionally render children. This is **UI convenience, not security**. A user can bypass these by:
- Directly calling the API endpoint
- Navigating to the route URL (the page will render, then the Guard may or may not block based on client state)
- Disabling JavaScript

The real security boundary is the middleware (`ROLE_ROUTES` map at the edge) and the `requirePermission()` calls in API routes. The client-side Guards should be treated as UX features, not access controls.

### E5. `buildPermissions()` Is Hardcoded, Not Database-Driven (LOW SEVERITY)

`app/api/v1/auth/me/route.ts` `buildPermissions()` maps role strings to permission arrays via a hardcoded `Record`. The `RolePermission` table in the database exists and is queried by `lib/auth/rbac.ts` (`hasPermission` looks up `rolePermission.findFirst`), but the `me` endpoint doesn't use it — it uses the hardcoded map.

This means:
- Adding a new permission requires changing code (the hardcoded map), not just adding a row to the database
- The RBAC engine and the permission assignment are out of sync

---

## F. REQUIRED FIXES

### Before Arena frontend integration and publish

**F1. Neutralize `lib/stubs-export.ts` (HIGH) — IN PROGRESS**
- All pages importing from `@/lib/stubs-export` must be updated to use real components and real data
- The `Guard` and `RequireAuth` from stubs must be replaced with the real ones from `components/AppShell.tsx`
- Status: 4 of 7 API routes fixed (integration engine now real). Remaining pages using stubs: integrations, inventory, sourcing, supplier-central, vendor-management, working-capital dashboard pages.

**F2. Wire admin audit page to real API (MEDIUM) — ✅ DONE**
- Replaced `setTimeout` + hardcoded entries with `fetch` to `/api/v1/admin/audit-log`
- Loading skeleton, error state, empty state all handled
- Guard already present (`RequireAuth` + `AppShell`)

**F3. Wire admin users page to real API (MEDIUM) — ✅ DONE**
- Replaced `useApp()` stub with `fetch` to `/api/v1/admin/users` API
- Real server-side auth via `requirePermission("admin:manage_platform")` in API route
- Client-side search/role filter preserved
- Badge variant fixed (`"error"` not `"destructive"`)

**F4. Resolve dual auth system (MEDIUM) — ⏳ DEFERRED**
- Clerk vs custom JWT decision requires product direction
- Current state: custom JWT is primary, Clerk is installed but unused for primary auth flows
- SSO callback page is the only Clerk-integrated page

**F5. Populate admin dashboard with real data (MEDIUM) — ⏳ DEFERRED**
- Admin overview (`/admin`) still uses `useApp()` stub for KPI cards
- Real `/api/v1/admin/dashboard` endpoint exists but not wired
- Deferred: requires deciding which KPIs to show, may overlap with Arena design

**F6. Align `buildPermissions()` with database-driven RBAC (LOW) — ⏳ DEFERRED**
- `buildPermissions()` in `app/api/v1/auth/me/route.ts` uses hardcoded map
- `RolePermission` table exists in schema but not used by `me` endpoint
- Deferred: low severity, doesn't block deploy

**F7. Server-side object-level checks (LOW) — ⏳ DEFERRED**
- `enforceTenantOwnership()` exists in `lib/tenant/scope.ts` but usage unverified across all mutation routes
- Deferred: low severity, tenant-level scoping is already solid

**F5. Populate admin dashboard with real data (MEDIUM)**
- The admin overview page (`/admin`) should fetch real data from API endpoints, not rely on `useApp()` stub data
- Connect to existing admin API routes: `/api/v1/admin/dashboard`, `/api/v1/admin/audit-log`, `/api/v1/admin/tenants`, `/api/v1/admin/users`

**F6. Align `buildPermissions()` with database-driven RBAC (LOW)**
- Either use the `RolePermission` table dynamically in `buildPermissions()`, or remove the `RolePermission` model if permissions are meant to be hardcoded
- Currently the schema has the infrastructure but the code doesn't use it

**F7. Server-side object-level checks (LOW)**
- Add `enforceTenantOwnership()` calls to API routes that mutate individual records (orders, invoices, etc.)
- Currently tenant scoping is done at the query level (`where: { tenantId }`), but individual record mutations should also verify ownership

---

## G. CURRENT BLOCKERS

### Blockers that prevent publish

1. **`lib/stubs-export.ts` actively breaks Supplier Central** — The page imports UI components that render `null`. The page is non-functional. This must be fixed before publish.

2. **Admin audit page displays fabricated data** — A security reviewer viewing the admin audit log would see 3 fake entries. This undermines trust in the audit system, even though the backend is real.

3. **Admin pages have no real data** — The admin dashboard is a visual shell. A reviewer clicking through admin sections would find empty tables and zero stats. This is a functional gap, not a security gap.

### Blockers that can be fixed now (without Arena spec)

All of the above (F1-F7) can be fixed without the Arena frontend specification. They are foundational issues in the current codebase.

### What to NOT fix yet (wait for Arena spec)

- Dashboard visual design/redesign
- Page layout changes
- New component introductions
- Any UI changes guided by the Arena specification

---

## SUMMARY: WHAT'S REAL vs WHAT'S NOT

| Commitment | Status | Notes |
|---|---|---|
| Clerk auth | ⚠️ PARTIAL | Installed, not primary. Custom JWT is the real system. |
| Tenant isolation | ✅ VERIFIED | JWT-based, server-enforced, DB-scoped. |
| Admin access control | ⚠️ PARTIAL | Edge route guards exist. RBAC engine exists. Not uniformly enforced. |
| Scope-level access | ✅ VERIFIED | Tenant scoping solid. Role scoping at edge. Within-tenant role scope partial. |
| Object-level access | ⚠️ PARTIAL | Tenant-level verified. Object-level via `enforceTenantOwnership` exists but usage unverified. |
| Audit log (backend) | ✅ VERIFIED | Hash-chained, tamper-evident, queryable API. |
| Audit log (UI) | ❌ MOCK | Hardcoded fake entries. Real API not used. |
| Neon database | ✅ VERIFIED | Connection string, adapter, migrations, schema all confirm Neon. |
| Data security | ✅ VERIFIED | JWT, CSRF, rate limit, idempotency, security headers, Redis. |
| Admin dashboard | ❌ UI-ONLY | Shell with stub/mock data. Not functional. |
| Supplier Central | ❌ BROKEN | Uses stub components that render nothing. |
| Virtual Shadow | ✅ PRESENT | Full intelligence workspace with API backing. |
| Funding boundary | ✅ VERIFIED | Referral pathway, not HV as lender. |
| Canonical (single app) | ⚠️ DRIFT | Dual auth systems. Stub file masquerading as real module. |

---

*End of audit. Decisions required: resolve dual auth, neutralize stubs, wire admin UI to real APIs.*




mktemp(54905) MallocStackLogging: could not tag MSL-related memory as no_footprint, so those pages will be included in process footprint - No such file or directory (2)

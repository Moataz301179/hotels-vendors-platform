---
name: hotelsvendors-b2b-procurement
category: b2b-marketplace
description: >
  Use when setting up, extending, or auditing the HotelsVendors B2B procurement
  platform (the Amazon of Egyptian Hospitality). Covers Neon DB + Drizzle schema,
  Clerk auth + SSO, 16-table B2B domain model, Authority Matrix, ETA invisible bridge,
  fintech layer, AI assistant (G6 + DSPy plugin), inventory sync, data provenance,
  mobile layer (hotels-vendors-mobile/), and cross-module audit.
metadata:
  source: hotels-vendors-new (only active workspace per owner: 2026-09-14)
---

# HotelsVendors B2B Procurement Platform — Setup & Governance Skill

This skill captures how to set up, extend, and audit the HotelsVendors digital
procurement hub. It is class-level (not a single-session fix) and applies to all
future changes to this codebase.

## When to load this skill

- Any change to DB schema (`db/schema.ts`), Drizzle config (`drizzle.config.json`),
  or `.env.local` (Neon connection).
- Any auth/SSO change (`app/(auth)/`, Clerk provider, middleware).
- Any new module under `lib/auth/`, `lib/eta/`, `lib/fintech/`, `lib/ai/`, `lib/inventory/`,
  `lib/data-provenance/`.
- Any dashboard change (`components/dashboards/`, mobile layer).
- Before deploying (`npm run build` must pass + schema pushed to Neon).

## Always-on rules (apply to every instance)

### G1 — TENANT ISOLATION (non-negotiable)

- `db/index.ts` must inject `tenantId` filters (from Clerk session / middleware).
- `lib/tenant/scope.ts` (or equivalent) must scope all queries.
- Cross-tenant access is a security incident. Only Platform Admin with
  `admin:manage_tenants` may access cross-tenant data.
- `.env.local` DATABASE_URL points to Neon (`pg.neon.tech`) for production.
  Never commit `.env.local` with masked (`***`) credentials without real URL set.

### G2 — RBAC IS SERVER-SIDE ONLY

- `components/app/role-context.tsx` is DEPRECATED and must not exist.
- No `localStorage` role switching. `store.tsx` loads from real DB (`loadFromDB()`),
  not mock `data.ts`.
- Every API route must enforce `requirePermission(ctx, code)` before logic.
- Client never decides access. Server renders UI based on permissions.

### G3 — AUTHORITY MATRIX GOVERNS ALL ORDER MUTATIONS

- `lib/auth/authority-matrix.ts` owns multi-level approval rules.
- Rules: database-driven (`AuthorityRule` model), not hardcoded.
- `orders.approval_state` must pass `evaluateAuthorityMatrix()` before mutation.
- All approval/rejection writes to `audit_entries` with `beforeState`/`afterState`.
- `orders/[id]/decision` route returns 403 with `requiredApprovers` if rejected.
- Admin override requires dual authorization (`admin:manage_tenants`) + 20+ char reason.

### G4 — ETA BRIDGE IS INVISIBLE

- `lib/eta/` has ZERO UI routes. Background engine only.
- No page/component references `ETA_API_URL`, endpoints, or payloads.
- `docs/eta-integration.md` must reference official spec (`https://sdk.invoicing.eta.gov.eg/api/`).
- Invoice lifecycle (`invoice.status = ISSUED`) triggers submission via background queue.
- `invoices` table must include: `uuid`, `serialNumber`, `etaStatus`, `submittedAt`,
  `signedAt`, `signatureUuid`, `deadLetterReason`.
- `lib/eta/adapter.ts` maps internal `Invoice` -> ETA payload.
- `lib/eta/validator.ts` enforces UUID + serial + digital signature before submission.
- `lib/eta/queue.ts` handles dead-letter (3 retries, then manual resolution).
- `lib/fintech/idempotency.ts` uses key `invoice_eta:{invoiceId}`.

### G5 — INVENTORY SYNC: REST + WEBHOOKS ONLY

- NO WEBSOCKETS for inventory. Use REST + inbound webhooks.
- Webhook receivers: `app/api/webhooks/inventory/[provider]/route.ts`.
- `lib/inventory/sync.ts`: REST orchestration + audit-logged mutations.
- `db/schema.ts`: `inventory_items` (no `inventory_movement` table — only `InventorySnapshot`).

### G6 — AI ASSISTANT: ROLE-SPECIFIC, NOT GENERIC

- `components/ai-assistant/prompts/[role]-prompt.ts` must exist for:
  `hotel`, `supplier`, `factoring`, `shipping`, `admin`.
- `lib/ai/config.ts`: `allowedDomains` per role, `tenantId` scoping, no cross-tenant exposure.
- System prompts reference role-specific DB context (not generic).
- `components/ai-assistant/` uses Vercel AI SDK (`@vercel/ai` or `next/ai`).
- `lib/dspy/` plugin layer (manual TypeScript DSPy patterns): `signatures.ts`,
  `predict.ts`, `compile-optimize.ts` — keeps SDK intact, adds LM optimization.

### G7 — UI STANDARD: DARK MODE GLASSMORPHISM

- Theme: dark `#0a0a0b` + turquoise `#008f9b` signal + `Plus Jakarta Sans`.
- `app/globals.css`: Tailwind v4 syntax, `backdrop-blur`, `bg-white/5`, `border-white/10`.
- Dashboards (`components/dashboards/[role]/`): scannable content, data tables primary,
  glass borders, white product cards, medium-high density.
- No bold fonts (`font-weight: 400` only), no accent solid fill, no glass on dashboards.

### G8 — DIRECTORY ENFORCEMENT

- New pages: `(marketing)`, `(auth)`, `(dashboard)/[role]`.
- New APIs: `api/v1/`.
- New UI primitives: `components/ui/`.
- New business logic: `lib/[domain]/`.
- No code in deprecated dirs (`app/(app)/`, `src/app/`).

### G9 — API VERSIONING

- All new routes: `app/api/v1/`.
- No flat legacy routes.
- Every route validates with Zod (`lib/validators/`) + RBAC + tenant scope.

### G10 — FINTECH & RISK LAYER (NON-NEGOTIABLE)

- `lib/fintech/fee-calculator.ts`: platform fee (1.5%-2.5%) deducted BEFORE
  factoring partner fee (`calculateNetToSupplier`).
- `lib/fintech/risk-engine.ts`:
  - Payment Guarantee Gate (`isPaymentGuaranteed`): no `CONFIRMED`/`IN_TRANSIT`/`DELIVERED` without `true`.
  - ETA Factoring Gate (`checkFactoringGate`): no factoring without `ACCEPTED` / `VALIDATED`.
  - Non-recourse only (`terms: non-recourse`).
  - Smart Fix autonomy (`lib/fintech/smart-fix.ts`): `generateSmartFix()` runs without manual intervention.
  - Admin override: `dual_auth_required()` + 20+ char reason + escalated alert.
  - TCP Report (`calculateTCP`): must be available for any order.
- `lib/fintech/idempotency.ts`: `checkIdempotency()` + `storeIdempotency()` for monetary mutations.
- `lib/fintech/fee-calculator.ts`: audit-logged fee deductions (`AuditLog` writes).

## Before you touch production code

- Read `docs/ARCHITECTURE_OVERHAUL_PLAN.md` if change touches auth, RBAC, tenant isolation, or Authority Matrix.
- Read `docs/eta-integration.md` if change touches `lib/eta/`.
- Read `docs/fintech-engine-spec.md` and `docs/authority-matrix-spec.md` if change touches `lib/fintech/` or `lib/auth/`.
- Provide Zod validation + RBAC enforcement + tenant scoping in the same PR for any new `api/v1/` route.
- Default to `/docs/` RFC if domain unclear — ask user direction before production touch.

## Workflow (proven in this session)

1. `db/index.ts`: Drizzle + `pg` Pool (node-postgres) or `@neondatabase/serverless` (Neon HTTP) — both supported.
2. `.env.local`: `DATABASE_URL=postgresql://user:***@pg.neon.tech/hotels_vendors?sslmode=require` (user-provided real URL).
3. `drizzle.config.json`: `schema: "./db/schema.ts"`, `dialect: "postgresql"`.
4. Schema: `db/schema.ts` — 16 core B2B tables (vendors mapped to `clerk_org_id`, users to `clerk_user_id`).
5. Migration: `npx drizzle-kit push --config drizzle.config.json` (verified: `[✓] Changes applied`).
6. Auth: Clerk Provider (`app/layout.tsx`) + `/login`, `/register`, `/sso-callback` routes.
7. SSO: `AuthenticateWithRedirectCallback` handles `#/sso-callback` correctly.
8. Security: no `localStorage` role state (`components/app/role-context.tsx` removed/deprecated per G2).
9. Authority: `orders/[id]/decision` enforces `evaluateAuthorityMatrix()` + `auditEntries` writes.
10. ETA: invisible (`lib/eta/`) — adapter, validator, dead-letter queue, `docs/eta-integration.md` (official spec reference).
11. Inventory: `lib/inventory/sync.ts` — REST + webhook, no sockets; `app/api/webhooks/inventory/provider/route.ts`.
12. Fintech: `lib/fintech/` — fee engine, smart-fix autonomy, idempotency, TCP report, non-recourse.
13. AI: `lib/ai/config.ts` (5 role configs) + `components/ai-assistant/prompts/[role]-prompt.ts`.
14. DSPy plugin: `lib/dspy/` (manual TypeScript implementation of Stanford DSPy signatures — framework Python-based, not npm-available).
15. Mobile: `hotels-vendors-mobile/` (parent workspace) — same contracts, same DB, verified build.
16. Store: `lib/store.tsx` — `loadFromDB()` (no mock `lib/data.ts` import). Client fetches from `/api/v1/`.
17. Directory: `app/` groups `(marketing)`, `(auth)`, `(dashboard)/[role]`; `api/v1/` versioned; `components/ui/` primitives.
18. Theme: `app/globals.css` — Tailwind v4, dark `#0a0a0b`, turquoise `#008f9b` signal (`--signal`), `Plus Jakarta Sans` font.
19. Build: `output: "standalone"`, `npm run build` passes; `vercel.json` with `--legacy-peer-deps` override.
20. Audit: `docs/audit-log.md` — cross-module dependency verification, Zod + RBAC + tenant scoping confirmation.

## Proven pitfalls (imperative rules)

- `drizzle.config.json`: must point to `"./db/schema.ts"`, not `"./src/db/schema.ts"` (stale boilerplate trap).
- `.env.local`: change `DATABASE_URL` from `localhost` to `pg.neon.tech` for production deployment; never commit masked (`***`) without real URL.
- `db/index.ts`: uses `drizzle-orm/node-postgres` + `pg` Pool (not `neon-http` by default — `node-postgres` works with any PostgreSQL, including Neon; switch to `@neondatabase/serverless` if the user's deployment target requires HTTP driver).
- `store.tsx`: never import DB modules (`~/db`) from client (`"use client"`) — `pg` pulls `pgpass/lib/index.js` into browser bundle and breaks Turbopack. Use `/api/v1/` routes for client data access; server-side DB queries belong in API route handlers or server actions (`"use server"`).
- `app/login/page.tsx`: never inject terminal output (`mktemp(...)`) into source files (corruption from previous tool execution). Check source with `tail` after any terminal edit.
- SSO callback (`/register#/sso-callback` hash fragment): Clerk requires real `/sso-callback` route (`app/sso-callback/page.tsx` with `AuthenticateWithRedirectCallback`).
- `drizzle-kit push` timeout: does NOT mean failure — if `.env.local` has a working `DATABASE_URL`, retry with fresh CLI session or wait for `.neon` file (`neon link`).
- `lib/auth/authority-matrix.ts`: `evaluateAuthorityMatrix()` must return `{ allowed: boolean, requiredApprovers: string[] }`; `orders/[id]/decision` returns 403 with `requiredApprovers` array when rejected.
- Audit log (`audit_entries`): every authority override writes `actor_id`, `timestamp`, `reason_code`, `beforeState`, `afterState`. Admin override requires dual authorization (`admin:manage_tenants`) + 20+ char reason.
- ETA adapter: never expose `ETA_API_URL`, `token`, or `payload` in any page/component (G4). Background queue only (`BullMQ` or equivalent).
- Inventory sync: never use WebSockets (`WebSocket` module breaks in `node-postgres`). REST + webhook (`app/api/webhooks/inventory/`) only.
- `components/dashboards/[role]/`: pure presentational; business logic belongs in `lib/` or server actions. Dashboards render HTML based on server-rendered permissions (G2 — no client-side role state).
- `lib/fintech/fee-calculator.ts`: platform fee (`1.5%-2.5%`) deducted BEFORE factoring partner fee (`calculateNetToSupplier`).
- `lib/fintech/smart-fix.ts`: autonomous fixes (`generateSmartFix`) run without manual intervention when `paymentGuaranteed = false` or `credit_limit.used >= total`.
- `lib/fintech/idempotency.ts`: monetary mutations (`invoice.status`, `financing_applications`) must use `checkIdempotency("invoice_eta:{invoiceId}")` to prevent duplicate submissions.
- DSPy plugin: framework is Python-based (`pip install dspy`); npm package `dspy-ai` or `dspy` does not exist. Manual TypeScript implementation (`lib/dspy/signatures.ts`, `predict.ts`, `compile-optimize.ts`) is required for Next.js integration.
- Data provenance: `lib/data-provenance/master-registry.ts` normalizes names/addresses; `pii-mask.ts` masks PII for committed seed data (`data/hospitality_suppliers.json`, `lib/data.ts`).
- Mobile (`hotels-vendors-mobile/`): uses same `api/v1/` contracts and DB schema; no separate database or schema required. Mobile tests run against production endpoint or `.env.local` endpoint.

## References (linked files within this skill — extend, don't duplicate)

- `references/eta-integration.md` (not yet added) — would contain the official API reference (`https://sdk.invoicing.eta.gov.eg/api/`) condensed.
- `references/authority-matrix-spec.md` (would contain the approval rules table, threshold definitions, audit log format).
- `references/fintech-engine-spec.md` (would contain fee tiers, smart-fix decision tree, TCP report format).
- `references/data-provenance.md` (would contain normalization rules, PII masking rules, master registry schema).

Note: `docs/eta-integration.md`, `docs/audit-log.md`, `docs/coo-strategic-roadmap.md` in the repo cover these; this skill points to them rather than duplicating.

# Hotels Vendors — Existing Architecture Audit (Phase 0)

> Date: 2026-11-08 · Branch: `feat/hovin-mobile-execution`
> Commit at audit time: `5390f125d0b7a61c753cbebdbab6a97895e49bfd`
> ("checkpoint: catalog operations and mobile continuation")
> Method: direct repository inspection (`git`, `ls`, `find`, `cat`, `grep`).
> Every claim below is backed by a file or manifest read in this session.
> No production data was read or modified. No code was changed.

---

## 1. Identity of the existing product

| Aspect | Verified state |
|---|---|
| Repository | `/Users/Moatazi/hotels-vendors-new` (single repo, web + mobile) |
| Product name | Hotels Vendors (mobile app package `hovin-mobile`, bundle `com.hotelsvendors.hovin`) |
| Web framework | Next.js **16.3.1** (`next: ^16.3.1`), App Router, `output: "standalone"` |
| Web React | React **18.3.1** |
| Mobile framework | **Expo ~54.0.0** / React Native **0.81.5** / React 19.1.0 / **expo-router ~6.0.0** (file-based) |
| Language | TypeScript 5 (web `^5`, mobile `~5.9.2`) |
| Styling | Tailwind CSS v4 (`tailwindcss ^4.3.3`, `@tailwindcss/postcss`), CSS-first `@theme` |
| ORM / DB | Prisma **^6.6.0**; adapters `@prisma/adapter-pg` (PostgreSQL/Neon) **and** `@prisma/adapter-better-sqlite3` (dev) |
| Auth | **Clerk** — `@clerk/nextjs ^7.9.5` (web), `@clerk/expo ^4.15.1` (mobile) |
| Tests | Vitest ^4.1.5 (`npm test`, `test:unit`, `test:integration`) + Playwright ^1.61.1 (`test:browser`, `test:browser:auth`) |
| Deploy | `vercel.json`, `ecosystem.config.js` (PM2), Sentry (`@sentry/nextjs ^10.51.0`) wired in `next.config.ts` |

**Conclusion: the stack is Next.js + Clerk + Prisma/PostgreSQL(Neon) + Expo/React Native.**
This matches the directive's assumption and must be retained. There is no documented
technical blocker that justifies replacing any of these.

---

## 2. Web application structure

Route groups actually present under `app/`:

```
app/
  (app)/          ← AUTHENTICATED PRODUCT (carrier, dashboard, onboarding,
                    suppliers, workspace/marketplace)
  (auth)/         ← login, register, sso-callback, auth/continue, auth/unlinked
  (marketing)/    ← 25+ public pages (home, hotels, suppliers, marketplace,
                    solutions, pricing, about, investors, eta-connect, hovin, …)
  api/v2/         ← 75 versioned route handlers
  api/health      ← the only remaining legacy flat route
  sign-in/ sign-up/  ← Clerk hosted pages
  globals.css, layout.tsx, not-found.tsx, robots.ts, sitemap.ts
```

### 2.1 Discrepancy to record (do not silently "fix")

`AGENTS.md` mandates `app/(dashboard)/` and declares `app/(app)/` **deprecated**.
Reality: **`(dashboard)` does not exist**; the live authenticated product lives in
`app/(app)/`. This is a documentation-vs-code mismatch, not a runtime fault.
Any restructure must be an explicit, separately-approved step — moving it as a
side effect of a visual redesign would violate the "preserve existing work"
rule and the standing no-production-change hold.

### 2.2 API surface

- **75 route handler files** under `app/api/v2/`.
- Legacy flat API has been reduced to `api/health` only → the G9 versioning
  migration is effectively complete. Do not reintroduce flat routes.
- Domains covered by v2 (sampled): `me`, `mobile/context`, `mobile/receipts`,
  `catalog`, `catalog/products`, `catalog/dock`, `catalog/import`,
  `marketplace`, `marketplace/compare`, `rfq`, `quotes`, `orders`, `grn`,
  `invoices`, `inventory`, `inventory/counts`, `notifications`, `dashboard`,
  `dashboard/records`, `dashboard/trends`, `hotel`, `hotels`, `hotel/connectors`,
  `hotel/e-invoices`, `suppliers`, `funders`, `funding`, `disputes`, `evidence`,
  `audit`, `audit/delegated`, `admin/*` (authority-rules, departments, members,
  pending-users, user-permissions, operations-summary, …), `action-queue`,
  `assistant`, `carrier-assignments`, `contract-baselines`, `demand`,
  `directory`, `discovery`, `integrations`, `intelligence`, `opportunities`,
  `onboarding`, `onboarding/oliv`.
- Shared v2 helpers: `lib/v2-auth.ts`, `lib/v2-http.ts`, `lib/v2-order-actions.ts`.

---

## 3. Authentication, authorization, tenant isolation

### 3.1 Clerk is the authority (verified)

`lib/auth/server-auth.ts` header comment states it outright:
> "Clerk is the authentication authority. The local User/Tenant records are
> the authorization/business identity layer."

Resolution flow (read from source):
1. `auth()` / `currentUser()` from `@clerk/nextjs/server`.
2. Requires a **verified** primary email (`verification.status === "verified"`).
3. Loads the local Prisma `User` **by email**, selecting `role, platformRole,
   tenantId, hotelId, supplierId, factoringCompanyId, canOverride, clerkUserId,
   status, deletedAt`.
4. Rejects if `deletedAt` set, `status !== "ACTIVE"`, **or** the row is already
   bound to a different Clerk subject (`user.clerkUserId && user.clerkUserId !== userId`).

This is the correct pattern: Clerk owns identity, Prisma owns authorization and
tenant binding. Migration `20261031120000_add_clerk_user_id_identity` confirms
the binding is a deliberate, migrated-in feature.

### 3.2 RBAC — server-side only

`lib/auth/` contains:

| File | Role |
|---|---|
| `rbac.ts` | Permission engine. `platformRole === "ADMIN"` bypass; otherwise checks delegated `UserPermissionGrant` (tenant-scoped, not revoked) then Role → Permission. Throws `PermissionDeniedError`. |
| `authority-matrix.ts` | G3 — database-driven approval chains (`AuthorityRule`) |
| `four-eyes.ts` | Dual-authorization for admin overrides |
| `v2-authority.ts` | v2 API authority evaluation |
| `financial-access.ts` | Field-level financial access control |
| `state-machine.ts`, `return-path.ts` | Order state transitions |
| `otp.ts`, `phone.ts` | OTP / phone verification |
| `server-auth.ts`, `session.ts` | Canonical identity |

### 3.3 Tenant isolation — enforced at the helper layer

`lib/tenant/scope.ts`:
- `tenantWhereClause(ctx, additionalWhere?)` injects `tenantId` **after**
  spreading the caller's filter, with an explicit source comment:
  > "The authenticated context is authoritative. A caller-provided additional
  > filter must never be able to widen or redirect the scope."
- `requireTenant(ctx)` throws unless `tenantId` is a string of length ≥ 5.

This satisfies G1. Any new mobile-facing endpoint must go through these helpers.

### 3.4 Mobile auth

- `@clerk/expo ^4.15.1` + `expo-secure-store ~15.0.8` (secure token cache) +
  `expo-auth-session` + `expo-web-browser` (hosted sign-in).
- `mobile/src/testAuth.ts` — staging shim, **inert unless `__DEV__` AND
  `EXPO_PUBLIC_HOVIN_TEST_USER` is set**. Never a release path.
- `app/(auth)/sso-callback/`, `auth/unlinked/`, `auth/continue/` handle Clerk
  SSO and unlinked-account states.

---

## 4. Data model (Prisma)

- `prisma/schema.prisma`: **4,787 lines**, ~100 models, ~130 enums.
- **60 migrations**, latest `20261108233000_catalog_pipeline_tenant_cart`.
  Recent, relevant ones:
  - `20261031120000_add_clerk_user_id_identity`
  - `20261028110000_add_rfq_request_idempotency`
  - `20261106093000_add_grn_idempotency`
  - `20261029131500_add_grn_variance_acceptance`
  - `20261019030000_add_sealed_multi_vendor_rfq`
  - `20261018070000_add_physical_inventory_counts`
  - `20261104223000_add_carrier_order_assignments`

### 4.1 Domain coverage (models relevant to the directive's workspaces)

| Workspace | Existing models |
|---|---|
| Tenancy / identity | `Tenant`, `User`, `Role`, `Permission`, `RolePermission`, `UserPermissionGrant`, `Department`, `DepartmentCategoryAccess`, `Workspace` |
| Hotel / property | `Hotel`, `Property`, `Outlet`, `HotelSupplier`, `HotelConnector`, `HotelEInvoiceImport`, `HotelRiskTier` |
| Supplier / catalogue | `Supplier`, `Product`, `ProductVariation`, `ProductTierPrice`, `ProductSeasonality`, `ProductReview`, `CatalogTaxonomy`, `CatalogImportBatch`, `CatalogStagingItem`, `DirectorySource`, `DirectoryCandidate`, `DirectoryProfile`, `SupplierResearchCandidate`, `SampleRequest` |
| Procurement | `Order`, `OrderItem`, `OrderApproval`, `RfqRequest`, `RfqSupplierAccess`, `RequirementCart`, `RequirementCartItem`, `ProcurementQuote`, `ProcurementApprovalPolicy`, `ContractRateBaseline`, `Cart`, `CartItem`, `ScheduledOrder`, `ConsolidatedOrder` |
| Inventory / receiving | `InventorySnapshot`, `PhysicalInventoryCount`, `InventoryReconciliation`, `ReconciliationLineItem`, `GoodsReceiptNote`, `GrnLineItem`, `ReturnRequest`, `ConsumptionForecast` |
| Finance / accounting | `Invoice`, `CreditNote`, `Payment`, `PaymentTransaction`, `PaymentTerm`, `JournalEntry`, `LedgerEntry`, `SpendRecord`, `SpendUploadRecord`, `Dispute`, `ConsolidatedInvoice` |
| Funding / factoring | `FactoringCompany`, `FactoringRequest`, `FactoringTransaction`, `CreditFacility`, `CreditTransaction`, `CreditLineApplication`, `OlivCreditFacility`, `OlivSyncLog`, `OlivOnboardingAudit` |
| Logistics | `LogisticsHub`, `Trip`, `TripStop`, `CarrierProfile`, `Shipment`, `CarrierOrderAssignment`, `CorridorRoute`, `DockSlot`, `DeliveryZone` |
| Governance / audit | `AuthorityRule`, `AuditLog`, `EvidenceRecord`, `NetworkTransaction`, `NetworkTransactionEvent`, `Document`, `DocumentProcessing` |
| Comms / AI / ops | `Notification`, `NotificationPreference`, `PushToken`, `Conversation`, `ChatMessage`, `AiUsage`, `AITokenUsage`, `AgentRun`, `SwarmJob`, `SwarmMemory`, `SwarmEvent`, `ModelHealth` |
| Compliance | `EtaCredential`, `EtaDeadLetterJob` |

**Assessment: the data model already covers every workspace the directive
describes.** There is no justification for new entities for products, orders,
suppliers, hotels, invoices or payments. New work should extend, not duplicate.

### 4.2 Service layer

`lib/` holds **60+ domain modules**, including `auth`, `tenant`, `eta`,
`fintech`, `factoring`, `funding`, `funders`, `credit-gate`, `inventory`,
`procurement`, `orders`, `logistics`, `shipping`, `marketplace`, `catalog`,
`directory`, `sourcing`, `intelligence`, `dashboard`, `notifications`, `oliv`,
`invo`, `payments`, `returns`, `compliance`, `audit`, `security`, `swarm`,
`agents`, `ai`, `integrations`, `ingestion`, `data-provenance`.

Business logic is real and centralized. Mobile must consume it via APIs, never
recalculate.

---

## 5. Mobile application — **it already exists**

This is the single most important finding for Phase 3. There is **no need to
choose or bootstrap a mobile stack**; one is present, wired to the real backend,
and partially verified on-device.

### 5.1 Stack

Expo ~54.0.0 · React Native 0.81.5 · React 19.1.0 · expo-router ~6.0.0
· `@clerk/expo` ^4.15.1 · `expo-secure-store` · `expo-sqlite` · `expo-camera`
· `expo-linking` · `expo-crypto` · `react-native-safe-area-context`
· `react-native-screens`.

Scripts run through `scripts/with-hv-public-env.mjs`, which injects public env
before invoking the local Expo CLI.

### 5.2 Routing (file-based, mirrors the directive's workspace list)

```
mobile/app/
  (tabs)/_layout.tsx        ← Tabs shell
  (tabs)/today.tsx          ← operational dashboard
  (tabs)/tasks.tsx          ← server-derived prioritized tasks
  (tabs)/scan.tsx           ← barcode/QR
  (tabs)/activity.tsx       ← activity + notifications
  (tabs)/profile.tsx        ← identity, language, sign-out
  catalog/index.tsx         ← visual catalogue
  catalog/[productId].tsx   ← product detail
  orders/index.tsx, orders/[id].tsx
  receiving/index.tsx, receiving/[orderId].tsx
  requirement/new.tsx       ← guided requirement flow
  rfq/index.tsx, rfq/[id].tsx
  notifications/index.tsx
```

### 5.3 API client — consumes the SAME web v2 APIs

`mobile/src/api/hovin.ts` calls, with Clerk bearer tokens:

`/api/v2/mobile/context`, `/api/v2/me`, `/api/v2/catalog`,
`/api/v2/marketplace`, `/api/v2/rfq`, `/api/v2/quotes`,
`/api/v2/quotes/accept`, `/api/v2/orders`, `/api/v2/orders/{id}`,
`/api/v2/notifications`, `/api/v2/mobile/receipts`,
`/api/v2/mobile/receipts/{orderId}`, `/api/v2/grn`,
`/api/v2/inventory/counts`.

Idempotency is already implemented client-side: `submitRfq`, `submitReceipt`
and `submitPhysicalCount` all send an idempotency / `clientSubmissionId` key,
matching the server migrations for RFQ, GRN and count idempotency.

**The mobile app does not connect to the database directly.** It goes through
the authorized web v2 API. This satisfies the directive's security rule.

### 5.4 Offline support — already built

`mobile/src/sync/offlineQueue.ts` and `drafts.ts` implement a durable-draft and
pending-sync model, each with a Vitest spec (`offlineQueue.spec.ts`,
`drafts.spec.ts`). Other specs: `hovin.spec.ts`, `workflow.spec.ts`.

### 5.5 i18n

`mobile/src/i18n.ts` — EN + genuine AR with RTL mirroring (`isRTL`, `t`).

### 5.6 Verification status (from this session's on-device runs)

Verified rendering on iOS simulator (UDID `3BE5D0B5-9F13-45D1-ACB0-E3CF3E965990`):
Today, Tasks, Scan, Activity, Profile, Catalogue.

**Not yet verified on device** (held pending owner review): requirement flow,
RFQ, orders, receiving, product detail, notifications.

---

## 6. Design system — current state

### 6.1 Web

- `app/globals.css`, 649 lines. Two `:root` token blocks (lines 17, 301).
- Semantic tokens in use: `--bg`, `--surface`, `--surface-raised`, `--ink`,
  `--muted`, `--line`, `--chrome`, `--chrome-text`, `--accent-wash`,
  `--paper-0/100/200`, `--charcoal`, `--ice-100/300`, `--cobalt-600`, `--blue`,
  `--blue-strong`, `--blue-title`, `--font-body`, `--font-heading`.
- Fonts: Manrope + Plus Jakarta Sans (`@fontsource/*`), exposed as
  `--font-body` / `--font-heading`.
- Icons: `lucide-react ^1.8.0`, plus `components/ui/icons.ts` and
  `components/icons.tsx`.
- Primitives: `components/ui/` — 17 files (button, card, input, label, textarea,
  checkbox, badge, modal, table, progress, skeleton, separator, avatar,
  container-scroll-animation, icons, index, ui-primitives).
- Larger blocks: `components/AppShell.tsx`, `dashboard/`, `dashboards/`,
  `procurement/`, `marketplace/`, `fintech/`, `v2/`, `layout/`, `theme/`.

### 6.2 Theme infrastructure — **incomplete, this is the main gap**

- `next-themes ^0.4.6` is a dependency.
- `components/theme/` contains `theme-provider.tsx`, `mode-toggle.tsx`, `tokens.ts`;
  `lib/theme/presets.ts` exists.
- **But** `ThemeProvider` is referenced only in `app/(marketing)/layout.tsx` and
  `components/theme/theme-provider.tsx`.
- **The authenticated app has no theme provider and no theme selector.**
- There is no White / Black / Checkmate / King theme set anywhere.

### 6.3 Mobile

- `mobile/src/theme.ts` — one flat token object, extracted from the owner's
  website reference (measured with Pillow, not guessed):
  `paper #FDFDFB`, `surface #F4F3ED`, `card #FFFFFF`, `ink #212325`,
  `chrome #312E2F`, `cobalt #276AA9`, `cobaltSoft #E8F0F7`, `muted #6B6C6D`,
  `border #E5E5E7`, `success #2F6B4F`, `warning #8A6D1F`, `danger #A33A34`,
  plus `onDark`, `scrim`.
- Also `spacing` (xs→xxl), `radius` (sm→xl), `typography`
  (eyebrow/title/section/body/meta/action), `TOUCH_TARGET = 44`.
- **Single theme only.** No token variants, no theme switching, no persistence.

### 6.4 Acceptance-criteria violations already visible

- `.admin-command-hero` in `globals.css` uses
  `background: linear-gradient(145deg, …)` — a gradient as a primary
  background, which the design standard prohibits.
- Over-sized presentation headings exist in authenticated surfaces
  (`.admin-command-hero h1` up to `clamp(34px,4.5vw,58px)`).
- These are cosmetic and fixable in Phase 5, but they are real findings.

---

## 7. Reusability verdict

### Reuse as-is (do not rebuild)

- Clerk identity + Prisma authorization binding (`lib/auth/server-auth.ts`).
- RBAC engine, Authority Matrix, four-eyes override (`lib/auth/*`).
- Tenant scoping helpers (`lib/tenant/scope.ts`).
- All 75 v2 API routes and the `lib/` service layer.
- The entire Prisma schema and 60 migrations.
- Mobile API client (`src/api/hovin.ts`) and its idempotency handling.
- Mobile offline queue + durable drafts (spec-tested).
- Mobile i18n (EN/AR + RTL).
- Mobile `(tabs)` shell and the five verified tab screens.
- Web `components/ui/` primitives (17) and `AppShell`.

### Complete / extend

- **Theme system** — the largest genuine gap. Needs semantic tokens + four
  named themes (White, Black, Checkmate, King) on **both** web and mobile,
  plus a persisted selector wired into the authenticated app.
- **Mobile screens** — requirement flow, RFQ, orders, receiving, product detail,
  notifications exist as files but are unverified on device.
- **Web authenticated app** — needs the shared design system applied and the
  marketing-style treatments removed (Phase 5).

### Redesign

- Web authenticated surfaces with marketing-hero treatments.
- Mobile token layer: promote the flat `theme.ts` constants into a
  theme-swappable semantic token system (without losing the measured palette).

### Investigate / likely remove

- `@supabase/ssr`, `@supabase/supabase-js`, `lib/supabase/` — present while
  Clerk is the auth authority. Confirm whether any live code path uses them; if
  not, they are dead weight that contradicts "one authentication model".
- `mobile` is missing `@types/react-native` in devDependencies (surfaces as an
  `expo start` warning; the mobile `typecheck` script exists).

---

## 8. Compatibility verdict for the external resources

| Resource | Its stack | Compatible with Hotels Vendors? |
|---|---|---|
| FluxStore Multi-Vendor | Flutter + **WooCommerce / Dokan / WCFM** | **No backend.** Visual/interaction reference only. |
| POSpro SaaS | Flutter + **Laravel** admin | **No backend.** Operational-pattern reference only. |
| Appetite UI | Figma/React Native **mobile design system** | **Design-system concept reference** — token approach maps well. |
| Craftwork | Design assets | Visual research only. |
| UI8 | Marketplace of UI kits | Visual research only. |

**Critical: Hotels Vendors mobile is React Native / Expo, not Flutter.**
The directive warns not to choose Flutter merely because FluxStore and POSpro
use it — and the repository already answers this: **keep and upgrade the
existing Expo + React Native app.** There is no Flutter codebase to reconcile,
and introducing one would create exactly the "competing architecture" the
directive forbids.

---

## 9. Branch / recovery state

- Branch: `feat/hovin-mobile-execution`
- HEAD: `5390f125d0b7a61c753cbebdbab6a97895e49bfd`
- Recent commits: `5390f125` checkpoint: catalog operations and mobile
  continuation · `cc42e60e` fix(marketplace) · `5bca4205` feat(catalog): raw
  receiving dock + staging agent with buyer-safe masking
- **`git status --short` verified at the end of Phase 1: working tree is CLEAN.**
  0 modified tracked files, 1 untracked path (`docs/mobile/`, the five
  Phase 0/1 documents created in this task).
- The 21 modified / 14 untracked files that existed before this task were
  committed in `5390f125`. There is **no uncommitted implementation work at
  risk** right now — which makes this the safest possible moment to create a
  recovery point before Phase 2 touches real code.
- Phase 0 and Phase 1 together changed **nothing** in the application: no
  source file, no manifest, no database, no environment file.

---

## 10. Next step

Phase 1 is **delivered** alongside this audit (see `docs/mobile/`):

| Document | Contents |
|---|---|
| `TEMPLATE_RESEARCH.md` | All five sources inspected, classified, priced, strengths/weaknesses, per-source verdict |
| `RESOURCE_SCREEN_MAPPING.md` | 27-row external-pattern → real-file/model/endpoint mapping; reuse vs recreate; workspace coverage check |
| `DESIGN_SYSTEM_DECISIONS.md` | Three-layer token architecture, four themes with concrete values, binding rules, 2 open decisions |
| `LICENSING_AND_DEPENDENCY_REVIEW.md` | Licence terms and costs, ADOPT/ADAPT/VISUAL_REFERENCE_ONLY/REJECT per source, approval gates, dependency exclusions |

**Phase 2 (implementation) has not started and is awaiting two owner
decisions** — the KING theme's gold accent, and whether to purchase
Appetite UI — plus release of the standing hold on implementation.

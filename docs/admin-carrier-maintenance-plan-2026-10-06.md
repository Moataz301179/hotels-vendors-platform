# Admin, carrier and mobile maintenance — implementation gate

Date: 2026-10-06. Status: owner approved the bounded design in this chat, including optional financing with explicit consent; local implementation and verification are in progress. This document does not certify authenticated operation or production readiness. Approval does not authorize deployment, dependency installation, production data changes or database migrations.

## Scope and preservation

Continue `/Users/Moatazi/hotels-vendors-new`, keeping its current branch and all existing modifications. The `mobile` directory is a separately tracked, dirty checkout; do not regenerate it, replace it, install pods or change its dependency tree without a scoped plan. This inspection changed only this document. No credentials, account records, shipments, invoices, production configuration or external services were changed.

Read in full: local `AGENTS.md`, `/Users/Moatazi/docs/ARCHITECTURE_OVERHAUL_PLAN.md`, `/Users/Moatazi/docs/authority-matrix-spec.md`, `/Users/Moatazi/docs/fintech-engine-spec.md`, and `docs/auth-path-reconciliation-rfc-2026-10-05.md`. The full architecture/finance specs are outside this checkout; the two local procurement-skill reference files are only pointers, not complete specifications. Their historical implementation approvals are not evidence of completed runtime behavior. User-supplied system guardrails supersede conflicting legacy examples, including guarantee-waiver examples.

## Current renderers and contracts

| Surface | Existing source | Verified source behavior |
|---|---|---|
| Admin overview | `app/(admin)/admin/page.tsx` | Destructures `data` and `user` from `useApp`, but `lib/store.tsx` only exposes cart/toast state. Uses undefined `Stat`; aliases Card as PageHead and supplies unsupported kicker/title/sub props. Counts legacy nested order/approval structures, including a user-count fallback to order count. These are not valid real-data KPIs. |
| Admin shell | `app/(admin)/layout.tsx`, `components/AppShell.tsx` | Layout supplies cart/toast provider, not server identity. RequireAuth/Guard expect removed store `user`; these client guards cannot provide server authorization. |
| Admin APIs | `app/api/v1/admin/dashboard/route.ts` | Returns nested count DTOs, not the arrays overview consumes. Authenticates but lacks explicit admin permission; most counts are tenant-scoped, tenant count is global. Not suitable to expose as a platform overview without reviewed permission policy. |
| Admin control centre | `app/api/v1/admin/control-center/route.ts`, `lib/admin/override-tools.ts` | Existing separate read contract and mutation tooling. Read calls `admin:read`; credit, disputes, ETA retries and manual overrides are distinct domains, not merely buttons to wire. Permission, four-eyes and guarantee requirements need behavioral tests, not trust in comments. |
| Admin registry and audit | `app/api/v1/admin/users/route.ts`, `tenants/route.ts`, `audit-log/route.ts` | Users requires `admin:manage_platform`, tenants requires `admin:manage_tenants`, audit requires `audit:read`. Global registry scope versus tenant-bound audit scope must be documented explicitly. |
| Carrier website | `app/(dashboard)/shipping/page.tsx` | Trips, Fleet, Earnings, Proof of Delivery tabs; real API hooks. Fleet derives vehicles from trip history, not a managed vehicle registry. Live Routes is explicitly a coming-soon placeholder. No complete route creation/optimization workflow is wired in this page. |
| Trip API | `app/api/v1/shipping/trips/route.ts` | GET requires `shipping:read`, validates pagination and filters tenant; POST requires `shipping:create_trip`, validates input and audits creation. Hub and stop ownership, sorting whitelist, pagination limits and lifecycle gates still need negative tests. |
| POD API | `app/api/v1/shipping/pod/route.ts` | GET requires `tripId`, returns stop-level status. POST expects `stopId`, optional URL photo/signature, notes, receivedBy. Stop lookup is tenant-filtered, but subsequent sibling-stop read and trip completion use IDs only. No explicit permission or audit call is present in this route. |
| Mobile carrier | `mobile/src/navigation/AppNavigator.tsx` | SHIPPING branch reaches Deliveries, Field, Profile, Assistant and stack PODScreen. Deliveries navigates with `stopId`/`tripId`. Field stack includes live orders, dock scanner, logistics and cash-out; navigation visibility is not authorization. |
| Registration | web register and `mobile/src/screens/auth/RegisterScreen.tsx` | Hotel and Supplier self-registration only. Carrier/funding admission is not an implemented mobile self-registration choice. Mobile forces `creditInterest: true` and claims up to EGP10M/48-hour/no-collateral prequalification. Those claims and compulsory finance flow require product/compliance decision. |

## Blocking defects and risks

1. **Identity authorities disagree.** Middleware requires Clerk userId and explicitly ignores legacy hv_session. `lib/api-utils.ts` authenticate reads and verifies only the hv_session cookie. Mobile sends SecureStore bearer tokens and calls legacy login/refresh. Headers or UI role state must not be promoted into trusted authority to make these paths appear functional. Existing auth RFC remains proposed.
2. **Web POD is nonfunctional.** The page requests `/shipping/pod` without tripId and expects `{ trips }`, whereas the API requires tripId and returns `{ stops, capturedStops, ... }`. The Submit POD modal currently only closes; it never performs a request. Do not report a successful delivery from this interaction.
3. **Mobile POD DTO and upload disagree.** PODScreen sends `tripStopId`, `signatureName`, `status`; the API expects `stopId`, `receivedBy`, optional URL signature. Camera captures a device-local URI, not a server-hosted proof object. Failure actions send unsupported status payloads. Fix requires a reviewed secure upload and delivery-failure contract, not renaming one field alone.
4. **Carrier revenue is estimated, not settled earnings.** Earnings API calculates EGP3000 per trip plus EGP1500 per stop and returns it as totalEarnings; website labels it revenue. Existing values must not be treated as ledger or payable balances. Use honest availability/estimate presentation until an approved pricing/settlement source exists.
5. **Driver dispatch is tenant-wide.** `/shipping/driver/today` accepts SHIPPING/ADMIN and chooses a tenant active trip, not a trip assigned to authenticated driver. It counts ARRIVED among completed stops and outputs `itemCount: 0` without deriving order items. These are unsafe assumptions for operational completion.
6. **Route role checks are not active merely because maps exist.** Middleware declares role route maps but its current execution protects pages by signed-in status, not evaluated role-route alignment. Dashboard layout gets database role, casts uppercase platformRole to lowercase shell type without normalization, and has no route-specific carrier permission check. Admin layout is separate and lacks a server role/permission gate. A typed cast cannot grant or correctly normalize permissions.
7. **POD completion is a business mutation.** It updates stop status and auto-completes trip, without shown audit/permission or atomic transaction in this route. Any associated order transition must independently enforce Authority Matrix and the absolute payment-guarantee gate. Do not infer order state correctness from trip completion.

## Proposed design decisions — confirmation required

- **Identity:** Recommend existing auth RFC Option A: preserve the existing Clerk web provider, with a bounded server identity/token bridge for mobile only if the owner confirms it is a supported contract and the architecture/specs support it. Resolve user, role, tenant and permissions from verified server records. Do not introduce a new auth provider, migrate accounts or enable hv_session as an alternate browser authority as an incidental compile fix.
- **Admin:** Server-guard the existing `/admin` surface using the approved platform permissions. Replace removed client-store identity/data consumption with explicit protected DTOs. Distinguish platform-global registry access from tenant-local records and log authorized global operations. Initial control centre is read-only until each mutation is validated.
- **Carrier roles:** Separate dispatcher/fleet-management rights from assigned-driver delivery rights using existing schema capabilities where possible. Define assignment identity and carrier admission/verification; no automatic carrier privileges from client role selection.
- **POD:** Canonical stop-based contract, tenant and assignment checks, authenticated proof storage/upload, safe proof URLs, required recipient fields, validated failure reasons, idempotency and atomic state/audit updates. UI marks delivery successful only after accepted server response. Keep order/payment approvals independent and non-bypassable.
- **Revenue:** Carrier earnings must use approved contractual rates and actual ledger/settlement records; otherwise display unavailable or explicitly estimated values, never guaranteed revenue.
- **Mobile finance:** Remove unsupported universal finance claims; determine whether finance is optional explicit consent or required under approved terms. Do not silently change downstream KYC/provisioning behavior before this decision.

These are proposed implementation boundaries, not implicit approval from “proceed”. User confirmation is required by the supplied domain design gate before auth, permission, finance or shipment-lifecycle changes.

## Safe mechanical repairs versus gated work

Safe compile/UX repairs: correct component imports/props, typed DTO declarations based on actual inspected responses, explicit loading/error/unavailable states, accessible responsive tabs, no invented counters, truthful feature labels, mobile static type repairs that do not change identity or business semantics. Changes should retain existing public-page design rather than rebuild it.

Gated: swapping identity authority; accepting bearer tokens; server role/tenant policy; adding admin global access; driver assignment constraints; real POD writes/uploads/failure handling; shipment/order state transitions; finance consent, rates, credit guarantees; database schema/migrations; production account/configuration/deployment. Never solve a type mismatch by weakening strictness, widening security types blindly or suppressing errors.

## Exact implementation and acceptance checklist

1. Capture root branch/HEAD/status and mobile branch/HEAD/status; preserve baseline modified file hashes and record intended overlaps. Read installed Next guide for each framework API used.
2. Run root strict TypeScript check and classify diagnostics by module. Repair mechanical issues in small disjoint batches; run focused tests, scoped lint and strict TypeScript after each batch. Build with ignoreBuildErrors false; no pass claim based on compile-only success.
3. Obtain identity/admin/carrier/POD/finance design confirmation. Record exact permission codes and role mappings against actual database policy and immutable audit schema before implementation.
4. Add API tests with deterministic test fixtures: unauthenticated 401, signed-in wrong-role 403, cross-tenant IDs rejected, assigned-driver versus other-driver access, malformed body/query, missing/expired credentials, spoofed identity headers, upload ownership and invalid proof URLs. No writes to production data.
5. Admin render tests: denied users never receive registry/financial payload; correct empty versus unavailable states; DTO counts match API; navigation destinations exist; no client-side role authority; global reads require approved permission.
6. Carrier render/contract tests: four tabs at phone/desktop; distinguish request failure from zero trips; choose trip then request POD with required tripId; proof submit awaits server result; rejected/duplicate/partial-upload requests cannot create false success; unknown status remains truthful.
7. Lifecycle tests: atomic POD/status/audit transaction, retries/idempotency, concurrent last-stop submissions, assigned stop/tenant validation, guarantee false rejection for any linked order transition, valid failure reason routing and completion rules.
8. Mobile tests: explicit approved roles only (unknown/ADMIN must not default to hotel authority); navigation reaches driver/POD; real DTO contract; photo upload precedes capture submission; server error does not show Delivered; session expiry/refresh/revocation and CSRF/mobile boundary after approved auth design.
9. Run simulator acceptance only after native prerequisites are explicitly resolved; configure non-production backend/test tenant rather than invoke real delivery/finance mutations. Test camera permission denial, offline/retry, background/foreground and local-photo lifecycle.
10. Final full strict check/build and regression gates, document unresolved failures with evidence. Reconfirm live deployment identity/config read-only; deployment and migrations remain separate approval gates. No deployment during this inspection.

## Existing evidence-safe tests

The following files were read and use isolated mocks or VM evaluation rather than real accounts/services. They may be run with the existing Vitest binary; this inspection did not run them or claim their outcomes:

```bash
./node_modules/.bin/vitest run --config vitest.config.ts tests/security/platform-api-controls.spec.ts tests/security/onboarding-read.spec.ts tests/unit/public-maintenance-boundaries.spec.ts
```

- `platform-api-controls.spec.ts`: six tests. Unauthenticated agent work must reject and never start workflow/task; denied platform permission must reject before work; invalid agent must return400; workflow must use authenticated tenant and audit; integration write denial must not reach engine; lead read denial must not query storage. Auth/API wrapper/integration guard are mocked, so passing is **not** proof of real identity or full HTTP status mapping.
- `onboarding-read.spec.ts`: one test. Initial GET returns200/in-progress and never creates progress rows or upserts steps. Clerk identity, Prisma and API wrapper are mocked. Does not cover mobile provisioning or authentication integration.
- `public-maintenance-boundaries.spec.ts`: five tests. Exact informational allowlist boundaries; workspaces/provisioning remain protected; real middleware handler with fake Clerk unauthenticated context returns401; strict build validation remains enabled/internal distDirs; missing production session secret throws. CSRF is stubbed, so no assertion of live CSRF enforcement.
- No dedicated shipping/POD/driver-assignment/admin-overview tests were found in the current `tests/` file inventory. Their acceptance checklist above is required new coverage, not existing passing evidence. Do not launch DB-dependent tests as a substitute or infer new backend behavior from these mocks.

## Xcode prerequisites — verified locally

- `xcode-select -p`: `/Applications/Xcode.app/Contents/Developer`.
- `xcodebuild -version`: Xcode 26.6, build 17F113.
- Existing `mobile/ios/INVO.xcodeproj` and mobile node_modules directory are present.
- `mobile/ios/INVO.xcworkspace`, `mobile/ios/Pods`, `mobile/ios/Podfile.lock` are absent. `command -v pod` returns no installed command on current PATH.
- Podfile uses Expo/React Native autolinking, Hermes JS engine, iOS deployment target default 16.4. Project references CocoaPods manifest/resource scripts, which need actual pods/support files. This Hermes JS engine is not the user's separate Hermes desktop assistant.
- Native Info.plist contains camera/photo-library usage keys. Their presence does not verify simulator/device permission behavior.
- Mobile package declares Expo ~57.0.12, React Native0.86.2 and React19.2.3. Compatibility has not been certified from installed versions, native build or authoritative SDK matrix.
- API base is hardcoded to `https://www.hotelsvendors.com`; simulator use currently targets production, not this fixed local checkout. Do not test registration, POD or finance submissions against production without explicit scoped authorization.

The existing Xcode project can be opened for inspection now. Simulator readiness is BLOCKED by missing native dependencies/workspace and unverified authentication/backend compatibility. No pod installation, native regeneration, dependency installation, simulator build, account creation or external submission was performed.

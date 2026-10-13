# HotelsVendors recovery register — 2026-10-10

## Scope and evidence rule

Read-only audit of `/Users/Moatazi/hotels-vendors-new`. No source, database, credential, Git, process, or production change was made. “Static” means present locally but not exercised here; “live” means directly observed on the public route; “unknown” means no safe evidence was available.

## Release position

| Area | Status | Evidence | Consequence |
|---|---|---|---|
| Local checkout | Risky | Branch `ui/virtual-shadow-premium-homepage-20261003`, HEAD `879c90c4f24b4fd30b35d8383f834832be86b39b`; origin reports the same branch head. | The committed branch is known, but it is not the whole candidate. |
| Working tree | Risky | 294 tracked paths changed (5,449 additions, 10,385 deletions) and 93 untracked paths. Nested `mobile/` is dirty and four commits ahead. | Never reset, clean, stash, or assume one commit represents all work. |
| Historical sourcing UI candidates | Observed | `/Users/Moatazi/hv-ui-production` at `bf72e27`, `/Users/Moatazi/hv-ui-release` at `6bf4816`, and `/Users/Moatazi/hv-integration-release-356ef` at `356ef72` contain richer sourcing components. | They are recovery candidates, not approved copy sources. Diff and provenance review must come first. |
| VPS topology | Unknown | An earlier task described PM2 `hotels-vendors-role-images` on port 3057, but no fresh host inspection occurred. | Do not act on a path, process, port, or release SHA until a read-only host check proves them together. |
| Live release identity | Broken | `/api/health` reported `version: v2` and null `releaseId` and `sourceCommit`. | The public service cannot presently be tied to an immutable release. |

## Public product and data boundary

| Item | Status | Evidence | Recovery implication |
|---|---|---|---|
| Home | Verified live | `https://hotelsvendors.com/` returned HTTP 200 from nginx/Next.js and presents the procurement-network positioning. | Marketing copy is not proof of private workflow readiness. |
| Public sourcing route | Broken as a sourcing surface | `https://hotelsvendors.com/marketplace` returned HTTP 200 and the explicit empty-catalogue state. | Keep this truthful state until real data is ready. |
| Product API | Broken / release mismatch | Live `/api/v1/products` returned HTTP 404; local `app/api/v1/products/route.ts` exists. | The deployed release does not match the local sourcing route family. |
| Authenticated workspace | Observed | `/workspace/marketplace` returned HTTP 307. | It is protected, but no authenticated test was run. |
| Market reference split | Static | Local product route separates verified supplier offers from `CatalogItem` market references; `docs/catalog-ingestion-mts.md` makes references quote-only and requires a server-side tenant setting. | Keep references visibly separate from active offers, price, supplier identity, and stock. |
| Reference catalogue | Blocked | `docs/db-release-reconciliation-20261010.md` records 867 extracted candidates without DB writes and reports the live catalog tables absent. | Do not publish or import the planned 5,000 references before migration, provenance, and approval gates. |
| Earlier sourcing UI | Recoverable candidate | Historical local checkouts contain search, cards, comparison drawer, category navigation, and footer components. | Reconcile their data/API contracts before restoration; do not replace current work wholesale. |

## Pre-spend contract comparison and negotiation

The requested value is pre-spend comparison: a hotel sees its contract/rate band, qualified alternatives, fixed commercial responses, delivery choices, and total delivered cost before a PO. It is not a bidding product.

| Item | Status | Evidence | Missing or limited behavior |
|---|---|---|---|
| Contract/rate-band baseline | Missing | No contract or negotiation model, route, or migration was found. | No durable supplier, SKU/pack normalization, rate band, MOQ, tax, delivery term, validity, rebate, or evidence record. |
| RFQ intake | Static | `app/api/v1/rfq/route.ts` authenticates, checks `rfq:create`, tenant-scopes requests, and supports verified offers, references, or free text. | Local and uncommitted; not live. |
| Supplier quote | Static | `ProcurementQuote` records price, quantity, lead time, delivery fee, validity, and notes; the route writes an audit event. | It has no negotiation revisions or commercial-term history. |
| Buyer comparison | Partial | The quote feed returns price, quantity, lead time, delivery fee, validity and notes; `lib/storefront/commerce.ts` is an in-memory price sorter. | No contract-baseline delta, qualification evidence, normalized units, delivery-choice comparison, or total-delivered-cost calculation. |
| Quote to PO | Static | Untracked `app/api/v1/rfq/quotes/[id]/accept/route.ts` creates a tenant-scoped order, invokes credit and Authority Matrix evaluation, and writes audits. | It requires an already mapped product and does not save a baseline or negotiated-term record. |
| Savings ledger | Incomplete | `SavingsLedger` has baseline and negotiated fields. | No route connects it to a pre-spend contract comparison. |
| Delivery quote | Blocked | `app/api/v1/invo/delivery/quote/route.ts` returns 503 pending a verified carrier rate source. | Express or scheduled-consolidated pricing cannot yet be binding or even safely estimated. |

Conclusion: overnight local work contains an RFQ → fixed quote → protected PO base. **A contract-baseline negotiation engine was not built.**

## Actor workflows

| Actor | Status | Evidence | Blocker |
|---|---|---|---|
| Hotel | Incomplete | Local RFQ, comparison and quote-acceptance code exists. | No contract baseline, no live route parity, no authenticated end-to-end proof. |
| Supplier | Incomplete | Local response maps a supplier to an RFQ/product. | Oct-10 reconciliation reports zero live suppliers/products. |
| Funder | Unknown | Code and policy documents exist. | No verified sandbox/production provider behavior; do not imply funding was disbursed. |
| Carrier | Partial and risky | Profiles, trips, private delivery proof, assignment, driver-today, and proof routes are in local source. | Identity, rates, capacity, consolidation, settlement, and migration state are unresolved. |
| Mobile | Incomplete | Separate mobile checkout uses bearer sessions against the web `/api/v1`; web maps Clerk identity to app accounts. | Mobile type/native verification is recorded as blocked, and the live API family differs from local. |

## Carrier lane

### Present locally

- `CarrierProfile` records zones, vehicle count/types, maximum weight, temperature control, verification, and licence/insurance fields.
- `lib/logistics/assign.ts` selects active verified same-tenant drivers, checks zone and active-trip count, requires an approved/payment-guaranteed order, and writes audit evidence.
- `lib/shipping/capture-proof.ts` locks the stop, requires the assigned driver, stores private image bytes, applies idempotency, and audits the proof.
- Mocked carrier assignment, proof, and API tests exist. The Oct-7 audit correctly says this is not deployed-database, private-storage, backup, or mobile proof.

### Gaps and risks

- Assignment creates one new trip/stop per order; `batchAssign` loops. It does not create capacity-constrained multi-hotel consolidation.
- Route optimization only reorders existing stops using a hard-coded city table, authorizes with `shipping:read`, and writes no audit event. It does not validate capacity, cold chain, time windows, cost, or carrier consent.
- `app/api/v1/logistics/shipments/route.ts` is an in-memory demo store, defaults provider/supplier data, and does not persist the Prisma `Shipment`. It is not an operating shipment workflow.
- Carrier registration has no visible permission check; its GET aggregates by driver name without tenant filters. This needs targeted security remediation before exposure.
- There is no carrier company/vehicle/driver separation, capacity booking ledger, fixed service-rate agreement, accepted delivery quote, or settlement record.
- Tenant isolation requires an explicit ownership model for cross-hotel pooling. The safe first scope is several properties of one buyer organization, not unrelated hotel tenants.

### Smallest carrier slice after procurement

For one buyer organization with two properties: record a verified carrier organization, one driver, one vehicle, capacity, coverage, and a fixed lane/service rate. After an approved, payment-guaranteed PO, an authorized dispatcher may offer confirmed express service or the next scheduled consolidated route. A multi-stop trip is created only when capacity, zone, temperature, and delivery-window checks pass. The assigned driver can capture private proof per stop; receiving and order completion remain separate. Carrier earnings remain unavailable until a settlement exists.

Acceptance: two-property same-tenant path; zone/capacity/cold-chain negative cases; no order on two active trips; other tenants and drivers denied; idempotent proof retry; no delivery/ETA/earnings claim from assignment; staging proof-migration and private-storage verification.

## Backend, database, and deployment gates

| Area | Status | Evidence | Gate |
|---|---|---|---|
| Web auth | Static | `lib/auth/server-auth.ts` identifies Clerk as web identity, mapped server-side to tenant/user permissions. | Controlled authenticated browser and cross-tenant tests remain required. |
| Mobile auth | Static | `lib/auth/mobile-session.ts` verifies backend-issued bearer sessions with its own audience/issuer. | Confirm the web/mobile authority relationship in staging; do not silently merge them. |
| Database history | Blocked | Oct-10 reconciliation records four local migrations absent from the inspected DB, three DB-only migration records absent locally, and checksum differences. | Recover the missing SQL, reconcile history, prove backup/restore on a clone, then request migration approval. |
| Quality evidence | Observed but inherited | `docs/audit-log.md` records Oct-7 local type/build/test/Prisma results with 451 lint warnings and stated limits. | It is not a fresh pass for this dirty tree or production. |

## Prior-work intake and business-model documents

- Hermes is available and shows an Oct-4 continuation session with broad implementation claims. It is historical progress context, not proof of deployment or security.
- A completed Codex task added the untracked `.cursor/rules/hotelsvendors-operating-rules.mdc`, identifying the planned newer target as PM2 `hotels-vendors-production`, `/var/www/hv-release-production`, port 3008 while leaving live topology unverified. It is pending local work, not production control.
- `docs/product-operating-blueprint.md` is a useful Oct-5 target operating contract: it covers the four actors and downstream dashboards. `PRODUCT-LENS-FOUNDER-REVIEW.md` is dated Sep-19 and is stale against the current tree. Neither records annual contract rate bands, pre-spend qualified alternatives, negotiation terms, or express versus scheduled-consolidation choice.
- There is therefore **no verified new-version business-model blueprint** for the requested engine. The missing decision record is an approved RFC defining contract baseline, item normalization, supplier qualification, quote/negotiation revisions, total-delivered-cost formula, delivery-rate evidence, visibility, approval thresholds, actor dashboards, and carrier tenant ownership.

## Registry and sourcing-engine lane

### Product language and target rule

The public searchable surface and SEO direction are **sourcing**, not a
marketplace. Public pages must describe discovery, qualified alternatives and
procurement sourcing without implying that every reference is an active offer.
The operating target is Egyptian local and independent hotels or local chains;
international chains subject to HQ procurement are not the initial sourcing
target unless a local decision-maker and permitted purchasing path are
evidenced.

### Foundations found

- `lib/sourcing/catalog-registry.ts` can store tenant-scoped catalog sources,
  product observations, evidence hashes and source URLs without inventing
  price, SKU, description or image values.
- `lib/sourcing/firecrawl-catalog-pipeline.ts` accepts approved public URLs,
  fans out extraction by category, preserves source observations, keeps missing
  prices RFQ-required, and defaults to non-persisting discovery. It does not
  create suppliers, contact anyone, or publish offers.
- `lib/sourcing/catalog-discovery.ts` can probe public catalog endpoints;
  `lib/sourcing/product-acquisition.ts` is mostly adapter scaffolding that
  returns empty arrays. `lib/sourcing/scraper.ts` is capable of external
  browsing and must remain unused until source/legal approval is given.
- Local JSON files include hotel and supplier leads, but `docs/audit-real-data.md`
  classifies directory and sourcing data as seeded/static. They are not a
  verified current registry.
- Supplier, carrier and finance-related models, onboarding routes and consent
  records exist, but there is no one actor-registry model or operating pipeline
  across hotels, suppliers, carriers and funders.
- `lib/intelligence/procurement-agent.ts` ranks supplied product candidates
  inside one category. It is not a portfolio decision engine that prioritizes
  entities from demand gaps, coverage, qualification, geography, freshness and
  expected commercial value.

### Missing system

There is no verified registry decision engine that:

1. separates source observation, normalized candidate, qualified organization,
   consented contact, invited organization, onboarding organization and active
   network participant;
2. maintains different fields and verification evidence for hotels, suppliers,
   carriers and funders;
3. selects local hotel targets and excludes or defers HQ-controlled chains;
4. scores current demand/catalog gaps and enforces category-balanced sourcing;
5. prevents food-and-beverage dominance by treating kitchen equipment, pool
   chemicals, maintenance/MRO, housekeeping, amenities, engineering, linens,
   furniture and other hospitality categories as explicit coverage targets;
6. records lawful source, retrieval time, permitted use, contact consent,
   outreach status, reviewer and freshness; or
7. translates an approved entity into a tenant/onboarding relationship without
   presenting a lead or reference as an active commercial participant.

### Required design before implementation

The new-version RFC must add an actor-registry and sourcing-decision contract:

- a shared entity identity and provenance ledger plus role-specific hotel,
  supplier, carrier and funder profiles;
- a hospitality category taxonomy with target coverage, observed supply,
  qualified supply, active-offer supply and current buyer-demand gap measures;
- a priority score whose inputs and freshness are visible, and a hard category
  diversity rule rather than an opaque food-first ranking;
- a lawful discovery pipeline: approved public source or authorized partner
  feed → normalize/dedupe → human qualification → consent where required →
  invite/onboard → periodic freshness review/withdrawal;
- explicit data classification so discovery records do not become marketing
  contacts or commercial claims by default; and
- role dashboards: hotel sourcing gaps and comparable alternatives; supplier
  category demand and onboarding tasks; carrier route/capacity opportunities;
  funder consented eligible opportunities only.

No scrape, contact, invitation, persistence, or publication is authorized by
this audit. Source approval, legal/consent policy, category taxonomy, scoring
weights, owner/reviewer roles and migration plan require explicit approval.

## Priority recovery plan

### P0 — preserve and reconcile

1. Inventory the dirty tree and historical sourcing UI candidates, then choose source lineage from evidence.
2. Obtain read-only VPS evidence for process CWD/script/listener/Nginx/release SHA and redacted database identity.
3. Reconcile migration history on an approved clone. Do not migrate, seed, import catalog data, or deploy production.
4. Label or remove in-memory shipment/demo behavior before users rely on it.
5. Approve the actor-registry and sourcing-decision RFC before any discovery,
   registry write, contact, invite, or category-coverage claim.

### P1 — first implementation-ready slice

Create and approve an RFC before code. Implement:

`hotel contract baseline → normalized demand/RFQ → qualified fixed supplier responses → commercial comparison and negotiated terms → authorized hotel selection → protected PO`

Required acceptance checks:

1. Baseline records source, validity, unit/pack conversion, MOQ, taxes, delivery terms, approval owner, and evidence; browser input cannot change supplier identity.
2. Qualified alternatives supply fixed responses against the same normalized demand. References and unverified suppliers cannot be shown as active offers.
3. Comparison displays baseline, all responses, taxes, delivery choice/cost only with a rate source, and total delivered cost; unknowns stay unknown.
4. Negotiation revisions are immutable and audited; selection is permissioned and idempotent.
5. Selection creates one PO, evaluates Authority Matrix and credit/payment-guarantee gates, and does not leak cross-tenant data.
6. Isolated DB, permission-negative, normalization, concurrency/idempotency, and accessibility tests pass. These tests do not claim a live release.

### P2 — carrier execution

Only after P1 proves out in staging, implement the scoped carrier slice above. It consumes approved/payment-guaranteed POs; it does not select suppliers or decide commercial terms.

## Approval boundaries

Approval is required before restoring/merging historical marketplace code; writing the P1/P2 RFC or application code; generating/applying migrations; importing catalog data; connecting suppliers/carriers/funders; using staging/production credentials; and any commit, push, PM2/Nginx action, or deployment.

Until then, the safe next action is read-only lineage and migration reconciliation followed by sign-off on the P1 RFC.

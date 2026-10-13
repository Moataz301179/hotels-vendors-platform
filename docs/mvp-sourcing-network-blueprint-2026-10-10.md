# MVP Sourcing Network Blueprint — 2026-10-10

## Purpose

This is the implementation blueprint for the new version of HotelsVendors: a
**hospitality sourcing network** for local Egyptian hotel groups and
independent hotels. It is a delivery contract, not evidence that any workflow
is live.

It replaces public-product language that implies a generic marketplace. Public
and SEO language describes hotel procurement sourcing, qualified alternatives,
and evidence-backed commercial decisions. The first buyer targets are local
operators with authority to change purchasing; international chains controlled
by headquarters procurement are excluded until a permitted local path is
evidenced.

This document does not authorize code, data, database, credential, Git, PM2,
Nginx, or production changes.

## Starting point

The recovery audit found these facts:

- The local checkout is substantial and dirty: 294 tracked paths changed and
  93 untracked paths. It must be preserved, not reset or automatically merged.
- The live public sourcing route is reachable but has an empty catalogue.
  Live `/api/v1/products` is 404 while the local route exists.
- Live health exposes neither a release ID nor source commit. Current VPS
  process, release directory, proxy, and release SHA remain unknown.
- The inspected database release history differs from local migrations. Catalog
  tables required for reference data were absent in that inspection.
- Local RFQ, quote, quote-to-PO, carrier assignment, and delivery-proof code
  are useful foundations but are not live proof. Contract baselines,
  negotiation revisions, verified carrier rates, and route consolidation are
  missing.
- Local data files and directories are leads or seed data, not verified current
  registries. No unsupported active-offer, stock, savings, delivery-rate, or
  financing claim may be displayed.
- The reported "about 1,800 products" is not evidence of a production import:
  a separate local staging SQLite registry held **1,759** product rows and
  source-origin mappings at `2026-10-10T02:27:53+03:00`, explicitly marked
  `STAGING_ONLY` with `productionDatabaseUsed: false`. A distinct local JSONL
  collection held **898** unique public observations collected from
  `2026-10-09T21:26:33.549Z` to `21:27:18.205Z`; it was duplicated as a v2
  artifact, not 1,796 observations. A disposable local PostgreSQL ingestion
  report recorded **15** reference items, all pending review. The dated
  release-reconciliation evidence reported **0** `Product` rows in the
  inspected live database, and the live public catalogue remains empty. These
  are separate states: collected observation, staging artifact, disposable
  local import, and live display.

Audit sources: `docs/recovery-register-2026-10-10.md`,
`docs/db-release-reconciliation-20261010.md`,
`docs/audit-log.md`, and `docs/product-operating-blueprint.md`.

## Finish line

One local Egyptian hotel organization can prove a pre-spend cost reduction:

1. It records a governed current supplier contract/rate baseline.
2. It raises a normalized sourcing need.
3. Qualified suppliers return fixed commercial responses; this is not bidding.
4. The hotel compares normalized delivered cost and documented terms before
   commitment.
5. An authorized person selects a response under the Authority Matrix.
6. The system creates one protected purchase order, then separately manages
   delivery, receipt, invoice, and an eligible finance path.

Every displayed conclusion identifies its source, freshness, scope, and
whether it is verified, quoted, estimated, pending, unavailable, or realized.

## Scope and non-goals

### In scope

- Hotel, supplier, carrier, funder, and catalog-reference registries.
- Category-balanced sourcing for food and beverage, kitchen equipment,
  housekeeping, amenities, engineering and MRO, pool chemicals, linens,
  furniture, and other hotel-supply categories.
- Pre-spend contract comparison, fixed quote negotiation, protected PO,
  same-organization carrier consolidation, proof of delivery, finance
  eligibility, and role dashboard updates.

### Explicit non-goals for the first MVP

- No bidding or auction mechanism.
- No publication of a catalog reference as active supplier inventory.
- No scraping, outreach, invitation, or registry write without approved source
  policy and consent workflow.
- No cross-tenant carrier pooling, delivery quote, savings, price, funding, or
  ETA claim without supporting records.
- No production migration, release, or integration connection in an MVP slice.

## Confidential operating boundary

The hotel, supplier, carrier, and funder registries; discovery sources and
methods; supplier selection; price and cost calculations; negotiation history;
internal scores; carrier economics; and financing logic are confidential
backend operations. They are never published merely because a record exists.

Public pages may communicate outcomes and user-facing terms only. They must
not disclose internal methods, source names, confidential registry records,
ranking rationale, commercial calculations, or unapproved participant details.
Each registry uses data minimisation, least-privilege access, tenant isolation,
purpose-bound retention, and an audit trail for reads, exports, decisions, and
mutations. Cross-registry joining is permitted only for an authorized workflow
and must be recorded as such.

## Registry system

The registry distinguishes a discovered observation from a qualified business
participant. A record progresses only through explicit states:

`OBSERVED → NORMALIZED → REVIEWED → QUALIFIED → CONSENTED/INVITED → ONBOARDING → ACTIVE`

Withdrawal, rejection, expiry, and stale-data states are first-class; none are
silently promoted to active.

| Registry | Core record | Required evidence | Coverage and decision fields |
|---|---|---|---|
| Hotels | Legal entity, local properties, decision-maker path, business type | Source/provenance, location, reviewer, freshness, consent for contact where needed | Categories bought, demand gap, property cluster, HQ-procurement exclusion reason |
| Suppliers | Legal identity, category/service profile, products, commercial terms | Source, ownership confirmation, compliance/verification status, reviewer | Category/subcategory, geography, MOQ, unit/pack, lead time, price/stock freshness |
| Carriers | Carrier organization, drivers, vehicles, lanes and service terms | Legal/insurance/licence verification, capacity and rate evidence, reviewer | Zones, temperature, weight/volume, time windows, express and scheduled service rates |
| Funders | Partner identity, product and eligibility rules | Regulatory/partner verification, consent basis, reviewer | Eligible invoice types, fees, limits, data-minimisation scope, turnaround evidence |
| Catalog references | Product observation and source evidence | Source URL, timestamp, hash, rights state, reviewer | Hospitality taxonomy, normalized unit/pack, observed-price state, supplier mapping confidence |

Registry data is tenant-scoped where it is account-owned. Platform discovery
records are partitioned from tenant commercial data and only become visible to
a tenant through an authorized relationship or review decision.

## Decision engines

| Engine | Input | Decision/output | Guardrails |
|---|---|---|---|
| Registry acquisition | Approved public/partner sources, manual submissions | Observed actor/reference records with provenance | No hidden collection, no contact, no activation, no fabricated fields |
| Sourcing priority and coverage | Buyer demand gaps, category coverage, geography, freshness, qualification, commercial relevance | Ordered research/onboarding queue | Category-balance floor prevents food-and-beverage dominance; score is explainable and reviewable |
| Commercial comparison | Contract baseline, normalized demand, qualified fixed supplier responses, verified delivery terms | Baseline delta and total delivered-cost comparison | Unknown inputs stay unknown; no inferred price, stock, savings, or supplier qualification |
| Negotiation | Response revisions, requested terms, actor authority, expiry | Immutable commercial-revision history and a selectable final response | Fixed responses only; audit every revision and selection; no client-controlled supplier identity |
| Delivery choice | Approved PO, verified carrier rate/capacity/service records | Express option or scheduled consolidated option, or unavailable | Same organization first; no rate claim without rate evidence; capacity and temperature checks required |
| Route consolidation | Eligible PO stops, carrier capacity, zones, windows, vehicle constraints | One auditable multi-stop trip with stop sequence | No cross-tenant pooling; idempotent assignment; dispatch does not mark delivered |
| Finance matching | Accepted invoice, ETA state, consent, eligible funder profile | Eligible options or unavailable | No provider claim, payout, or ledger entry without confirmed provider event |
| Dashboard update | Durable events from the engines above | Role-specific task queue and measured outcome | Show source, freshness, actor scope, and verified/test/unavailable state |

## Immutable event and accounting-control layer

Every meaningful operational event must have one immutable, tenant-scoped audit
record committed in the same transaction as its protected business change. The
record contains the tenant, actor and effective authority, action and reason,
before/after values, timestamp, correlation and idempotency key, related
entities, linked source documents/evidence, result, and controlled-exception
reference where applicable. A hash chain is an integrity signal, not a
substitute for database append-only permissions, protected backups, and
tenant-scoped export verification.

The following are accounting-ready event classifications. They define what the
product must capture; they do **not** prescribe Egyptian tax treatment,
chart-of-accounts postings, ERP journal design, capitalization policy, or
recognition timing. Those are accountant and ERP-implementation decisions that
require explicit approval for each hotel organization.

| Business boundary | Required immutable event | Accounting/ERP mapping decision | Workflow control |
|---|---|---|---|
| Requisition | `REQUISITION_CREATED`, changed, submitted, withdrawn | Commitment/reservation treatment if the organization uses it | Requester cannot approve their own request; source need and budget context retained |
| Approval | review, approval, rejection, final approval, controlled exception | Normally no posting; may alter commitment status | Reviewer, approver, and final approver are distinct roles where policy requires; Authority Matrix limits and exception authority recorded |
| Purchase order | `PO_ISSUED`, amended, supplier-acknowledged, cancelled | Commitment and any approved PO accrual policy | Only final approval can issue; amendments re-enter the required approval path |
| Receipt | `GOODS_OR_SERVICE_RECEIVED`, accepted, rejected, reversed | Inventory receipt/valuation or expense/accrual decision | Quantity/quality evidence, receiver identity, and PO-line linkage required; partials and reversals are separate events |
| Freight/delivery | freight quote accepted, carrier service received, freight allocated or disputed | Freight-in, expense, inventory capitalization, or allocation policy decision | Rate evidence, carrier authority, allocation basis, and exception evidence retained; no inferred carrier earnings |
| Invoice and match | invoice captured, validated, three-way matched, variance held/resolved | Accounts-payable recognition and tax treatment decision | PO, receipt, and invoice line relationships are mandatory; tolerance, variance owner, and resolution are auditable |
| Payment | payment proposed, authorized, submitted, confirmed, reversed/failed | AP settlement/cash movement decision | Segregate payment preparation, authorization, and release; provider confirmation required before settled state |
| Consumption / COGS | stock issued, consumed, adjusted, period closed | Consumption/COGS and inventory valuation policy decision | Source inventory movement, location, unit conversion, and approver for adjustment retained |
| Returns and credits | return requested/accepted, credit note issued/applied, adjustment posted/reversed | AP/inventory/tax reversal decision | Linked to original receipt/invoice; prevent duplicate or over-value credits; require reason and authorized exception path |

### Existing foundation: verified gaps

The schema has `AuditLog`, `OrderApproval`, `GoodsReceiptNote`, `JournalEntry`,
`LedgerEntry`, and `CreditNote` models; order approval code rejects
self-approval and the Authority Matrix evaluates role/value rules. A
hash-chaining helper exists. These are foundations, not an end-to-end control
layer: many writers create audit rows directly rather than through the chained
helper; the helper's chain and export verification are global rather than
tenant-filtered; the data model has no first-class reason, correlation key,
idempotency key, authority decision, or source-document relation on every
audit row; and application-level immutability is not database-enforced.

The active three-way-match integration endpoint is an administrative stub, and
the local matching service explicitly uses simplified invoice assumptions
rather than invoice lines. Journal and ledger records exist but no inspected
workflow demonstrates a controlled, approved mapping across requisition, PO,
receipt, invoice, payment, inventory, freight, consumption, return, and
credit. The first implementation RFC must close these gaps before presenting
accounting-ready status.

## Operating pipelines

### 1. Registry acquisition and qualification

`approved source → observe → normalize/dedupe → classify → human review →
consent where required → invite → onboarding → active relationship → freshness review`

All observations retain source URL, retrieval time, permitted use, data class,
reviewer, and expiry. A public reference does not create a supplier account,
allow outreach, or grant rights to images/content.

### 2. Balanced supplier sourcing

`hotel demand/catalog gap → category coverage score → local supplier research
queue → qualification → fixed-response invitation → verified offer`

The score must include unmet buyer demand, target-category undercoverage,
property geography, seasonality, supplier qualification, and data freshness.
It must visibly report coverage by each category so users can verify that food
and beverage is not crowding out engineering, MRO, pool, housekeeping,
amenities, equipment, and other priority supply.

### 3. Pre-spend commercial flow

`contract/rate baseline → normalized request → qualified fixed responses →
commercial comparison → negotiation revisions → Authority Matrix decision →
protected PO`

The baseline records supplier, item definition, pack conversion, rate band,
MOQ, taxes, rebates, delivery terms, validity, source attachment, and approval
owner. Each response uses the same item definition and records unit price,
quantity, tax treatment, delivery fee, lead time, validity, evidence, and
supplier qualification state. Total delivered cost is computed only from known
inputs and shows missing inputs plainly.

### 4. Delivery and receipt

`approved + payment-guaranteed PO → verified carrier choice → dispatch/trip →
stop milestones → private proof → itemized receipt/exception → invoice match`

The first consolidation path is two properties of the same buyer organization.
It requires a verified vehicle, driver, lane rate, available capacity, zone,
temperature, and delivery-window compatibility. Driver proof is private,
idempotent, and does not itself complete an order.

### 5. Finance and outcome measurement

`matched invoice + ETA eligibility + provider-specific consent → funder review
→ decision → confirmed payout if any → settlement → realized saving/revenue`

The system clearly distinguishes requested, eligible, submitted, approved,
payout-pending, paid, settled, rejected, and unavailable. Savings are potential
until the comparison and later settlement evidence establish their status.

## Role dashboards

| Role | Primary queue | Measured outcome |
|---|---|---|
| Hotel | Baselines expiring, sourcing gaps, responses to compare, approvals, expected deliveries, receipts/exceptions | Pre-spend delta, realized cost, order/receipt status |
| Supplier | Qualification/onboarding tasks, requested responses, accepted commitments, fulfilment exceptions | Response rate, awarded volume, delivery/service performance |
| Carrier | Verification tasks, eligible jobs, scheduled consolidated routes, assigned stops, proof/exceptions | Capacity utilisation, on-time verified stops, settled service value only |
| Funder | Consented eligible records, missing information, decisions, payout/settlement exceptions | Confirmed decisions and settled portfolio only |
| Operations | Registry freshness, coverage gaps, review queues, integration errors, audits and release health | Qualified network coverage and unresolved risks |

For procurement, the hotel queue separates requester, reviewer, approver, and
final approver. The Authority Matrix assigns value/category limits and required
approval path. A person may not take conflicting steps on the same controlled
event unless a documented exception policy permits it; an exception must have
the permitted authority, reason, scope, expiry, linked evidence, and a complete
audit history. A payment preparer cannot also be the final payment releaser.

## Mobile operational companion

Mobile is a role-limited operational and approval companion to the same
backend, not a second website and not a separate source of truth. It receives
only the server-authorized work queue and document fields needed for the task.
The server remains responsible for identity, tenant, permission, Authority
Matrix evaluation, event creation, audit, and every business transition.

### Current foundation and gaps

The mobile app has an audience-bound short-lived mobile token, refresh-token
rotation, secure device storage, and API calls to the v1 backend. It has hotel,
supplier, shipping, inventory-balance, delivery-proof, GRN-list, and camera
screen foundations. The backend's full GRN creation route is tenant-scoped and
requires permission, a receivable and payment-guaranteed order, carrier proof,
valid order lines, transactional quantity checks, and an audit record.

This is not yet enough for the intended companion:

- Navigation is driven by broad platform role only. Finance, factoring, and
  admin users are shown a website-only message; there is no CFO, financial
  controller, procurement-manager, reviewer, approver, or final-approver
  mobile queue.
- The client role guard is presentation-only. It does not expose the
  server-calculated permission set or Authority Matrix decision for a specific
  item, so it must not be treated as authorization.
- The mobile approval helper does not supply the action or required idempotency
  header expected by the protected order-approval route, and no approval review
  screen exists.
- The dock scanner submits only a barcode while the current scan API requires
  an order ID. On failure it displays a locally generated success-like GRN and
  claims later sync even though no durable offline queue exists. The scan API
  itself creates a pending receipt without receipt lines or an audit event.
  It is unsuitable for controlled receiving in its present form. A separate
  ePOD component is explicitly a mock scanner.
- The inventory screen is a read-only reconciliation display. It does not
  record counts, condition, shortages, damages, return evidence, or adjustments
  through the controlled receipt workflow.

### Required mobile controls

1. A manager view shows only server-issued approval/review tasks for the
   authenticated tenant, role, property scope, and Authority Matrix limit. It
   displays the decision basis and document evidence without revealing other
   tenants or confidential scoring/calculation internals.
2. The approve/reject action sends an idempotency key and reason to the same
   protected endpoint used by web. It re-fetches the server decision before
   enabling the action and records no local final state before server success.
3. A receiver view begins from an assigned order/stop, then uses the full GRN
   contract: per-order-line scan/manual entry, accepted/rejected quantities,
   condition, shortage/damage reason, permitted photos, and an explicit
   submission. It has no optimistic "recorded offline" state unless a durable,
   encrypted, tenant-bound outbox with replay/idempotency semantics is built
   and visible as pending.
4. Mobile proof, GRN, return, and approval events use the same entity IDs,
   tenant scope, source-document references, actor, authority decision,
   correlation/idempotency key, and immutable audit record as web.

### Returns: current position and required controlled flow

There is **no verified return workflow or policy enforcement**. The schema has
a supplier-level `returnPolicyDays` number and a minimal `ReturnRequest` model
with order, optional invoice, aggregate quantity/amount, reason, and status.
There is no return API route, mobile return screen, line-level selection,
condition/photo evidence, eligibility enforcement, Authority Matrix handoff,
pickup workflow, inventory/AP correction workflow, or return-specific audit
trail. Existing credit-note creation is GRN/invoice based and does not make a
return process complete.

The minimum controlled return flow is:

`eligibility/policy version → order-line selection and receipt scan → requested
quantity + condition evidence → reason + permitted photos → authority decision
→ return authorization → carrier pickup and custody evidence → replacement or
credit note → inventory and payable correction → immutable linked audit events`

Every step must remain tenant-scoped, idempotent, and reversible only through a
new compensating event. Policy eligibility, local tax treatment, credit timing,
inventory valuation, and ERP postings require approved business, accountant,
and implementation decisions; mobile must show the outcome, not invent them.

### First buildable mobile slice

Build a **hotel-manager approval companion** before mobile receiving or
returns: one authenticated tenant-scoped queue, a read-only decision review,
and approve/reject/escalate actions against the existing Authority Matrix
contract. Acceptance requires permission-negative tests, self-approval denial,
value-limit and stale-decision denial, idempotent retry behavior, audit-event
verification, and a device test that confirms no confidential cross-tenant or
internal decision data is rendered. Only after that slice is proven should the
assigned-order full-GRN receiver slice replace the current optimistic scanner.

## Product Intelligence operating function

Product Intelligence is distinct from audit and compliance. It continuously
reviews actor workflows and role dashboards to identify missing value, friction,
repeated work, unserved decisions, and measurable improvement opportunities.
Its inputs are privacy-safe, tenant-scoped operational analytics, completion
and error signals, support feedback, permitted usability research, and verified
procurement outcomes. It does not inspect or disclose cross-tenant data,
confidential supplier terms, price mechanics, financing logic, sourcing
methods, or raw confidential records.

For every proposed improvement, the function produces a reviewable brief with:

- the affected role and workflow stage;
- evidence of the problem and its permitted measurement scope;
- the expected user and strategic value, risk, delivery effort, and measurable
  outcome;
- privacy, tenant-isolation, Authority Matrix, accounting, audit, and release
  implications; and
- an explicit recommendation: investigate, prototype, schedule, defer, or
  reject.

Proposals are ranked by user value, strategic impact, risk, and effort, then
enter the roadmap only after the responsible product, security, and domain
owners approve the scope. The function may recommend work; it cannot change
product behavior, launch instrumentation, make operational decisions, alter
ranking/price logic, or access a tenant merely to improve a metric. Aggregated
reporting requires approved minimisation, access controls, retention limits,
and an auditable purpose.

## Security, data, and release gates

- All records and queries are tenant-scoped; no browser-supplied tenant or role
  is authoritative.
- Every route validates input, authenticates, requires server-side permission,
  and checks ownership before business logic.
- Money, order, rate, and status changes require idempotency and append-only
  audit events with before/after state and correlation key.
- Audit records, exports, and accounting mapping decisions are least-privilege,
  tenant-scoped operations. A cross-tenant audit chain, global export, or
  editable audit history is a release blocker.
- Order status follows the Authority Matrix. Confirmed, in-transit, and
  delivered states require payment guarantee; ETA and finance gates remain
  separate.
- Catalog references, unknown price/stock, mock integrations, seed rows, and
  unavailable carrier rates are explicitly labelled and cannot look active.
- No migration or release work begins until source lineage, database migration
  history, VPS topology, release SHA, backup/restore plan, and staging evidence
  are reconciled.

## MVP vertical slices and acceptance gates

### Phase 0 — preservation and evidence

Finish source-lineage, migration, and VPS topology reconciliation. Approve the
registry policy, category taxonomy, consent model, scoring criteria, and
commercial comparison RFC. Gate: a named release source and staging data plan
exist; no automatic recovery action is taken.

### Phase 1 — pre-spend cost reduction (first build)

Implement the contract-baseline-to-protected-PO flow for one buyer organization
and one category.

Gate:

1. Baseline and supplier responses use a shared normalized item/pack/unit.
2. Only qualified suppliers can submit fixed responses.
3. Comparison shows baseline, terms, delivery evidence, and total delivered
   cost without inventing unknowns.
4. Negotiation history, selection, Authority Matrix result, and PO creation are
   audited and idempotent.
5. Tenant/role negative tests, unit normalization, concurrency, accessibility,
   and isolated database tests pass.

### Phase 2 — sourcing registries and coverage engine

Activate approved-source, review-only registry intake and an explainable
balanced sourcing queue. Gate: each actor type has provenance, reviewer,
freshness, and state; coverage reports show every target category; no contact
or publication happens without its separate approval.

### Phase 3 — same-organization carrier consolidation

Implement verified carrier/vehicle/rate records and a two-property scheduled
route after a protected PO. Gate: capacity/zone/temperature failures deny
assignment, one order cannot join two active trips, proof is private and
idempotent, and no earnings appear before settlement.

### Phase 4 — finance and outcome dashboards

Connect consented, ETA-eligible invoices to a verified funder workflow and
show realised outcomes only after evidence. Gate: provider state, payout, and
settlement are separately tested and the dashboard distinguishes unavailable,
test, potential, and realised values.

## Exact first implementation task

**Write and obtain approval for the “Pre-spend Contract Baseline and Fixed
Commercial Response RFC.”** It must define the data model, visibility,
normalization rules, total-delivered-cost formula, negotiation revision states,
Authority Matrix handoff, requester/reviewer/approver/final-approver
segregation, controlled exceptions, audit/idempotency and source-document
requirements, accounting-event classifications, and Phase-1 test matrix. It
must identify every local tax, accounting-policy, and ERP-posting choice for
accountant/implementation approval rather than deciding it in product code. No
application code, migration, catalog import, outreach, or deployment starts
until that RFC has explicit user sign-off.

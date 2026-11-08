# Commerce Engine Comparison — HV vs Medusa vs Vendure

> Prepared with the Medusa `storefront-best-practices` and `building-storefronts`
> skills installed and read. This is a comparison, **not** a migration proposal.
> Per the mandate: do not migrate or introduce a second order system without an
> explicit proposal.

---

## 1. What HV already has (verified against the live schema)

| Capability | HV implementation | State |
|---|---|---|
| **Catalogue** | `Product` (sku, name, description, category enum, subcategory, volumeTiers, stockQuantity, minOrderQty, leadTimeDays, reorderPoint, unitOfMeasure, shelfLifeDays, temperatureReq, images, specs, unitPrice, basePrice, pricingMode, rfqThresholdQty) + `ProductVariation`, `ProductTierPrice`, `ProductSeasonality`, `CatalogTaxonomy`, `ProductReview` | Built |
| **Catalogue search** | `/api/v2/search`, `/api/v2/catalog`, `/api/v2/marketplace`, `/api/v2/discovery` | Built |
| **Vendor separation** | `supplierId` on Product; `RfqSupplierAccess` controls which vendors may see which RFQ | Built |
| **Cart** | `components/cart/cart-context.tsx` + `lib/procurement/catalog-reference-basket.ts` | **Browser-local only** (localStorage) |
| **Requirement → RFQ** | `RfqRequest`, `RfqSupplierAccess`, `/api/v2/rfq` | Built |
| **Quote comparison** | `ProcurementQuote` + `/api/v2/quotes` + `/api/v2/quotes/checkout-preview` | Built |
| **Approval-aware checkout** | `OrderApproval`, `approvalPolicySnapshot`, `evaluateV2Authority`, delegate checks | Built |
| **Order state machine** | `lib/auth/state-machine.ts` — 10 states, gated transitions | Built |
| **Payment guarantee gate** | `POST /api/v2/orders/guarantee` — ADMIN only | Built |
| **ETA clearance gate** | Requires ACCEPTED + signed invoice before dispatch/delivery | Built |
| **Vendor acknowledgement** | `STATUS_CHANGED` ledger event by SUPPLIER | Built |
| **Carrier handoff** | `Shipment` model, `/api/v2/shipments`, dock scheduler | Built (1 shipment in dev) |
| **Partial delivery** | `PARTIALLY_DELIVERED` state + `GrnStatus.PARTIALLY_ACCEPTED` | Built |
| **Receiving** | `GoodsReceiptNote` + `/api/v2/grn` | Built (18 GRNs in dev) |
| **Invoices** | `Invoice` + `/api/v2/invoices` | Built (24 in dev) |
| **Returns** | `ReturnRequest` + `CreditNote` | **NEW — routes built this session** |
| **Disputes** | `Dispute` + `LiabilityAssignment` | **NEW — routes built this session** |
| **Notifications** | `Notification`, `NotificationPreference`, `lib/notifications/service.ts` | Built this session |
| **Funding** | `lib/fintech/*`, `/api/v2/funding` | Built |
| **Immutability** | `NetworkTransactionEvent` hash chain + `AuditLog` | Built |

---

## 2. Medusa capabilities vs HV

| Medusa area | What it gives | HV status | Verdict |
|---|---|---|---|
| Products, variants, pricing | Modular product catalogue with variants and tier pricing | HV has Product + ProductVariation + ProductTierPrice | **No gap** |
| Cart + checkout | Session-based cart, checkout flow, payment providers | HV's cart is browser-local; checkout is RFQ/quote-driven | **Different model, not a gap** |
| Orders + order process | Order state machine with configurable transitions | HV's state machine is stricter (authority matrix + ETA gate + payment guarantee) | **HV is stronger** |
| Inventory | Stock locations, reservations | HV has stockQuantity + reorder points, no reservations | Possible gap for multi-warehouse |
| Fulfilment | Shipping options, fulfilment providers | HV has Shipment + dock scheduler | **No gap** |
| Payments | Payment provider integrations | HV deliberately does **not** take payments — factoring/funder model | **Must not adopt** |
| Regions/channels | Multi-region, multi-channel | HV is single-tenant-per-hotel | Not applicable |
| Admin dashboard | Admin UI extensions | HV has its own role dashboards | **No gap** |

**Where Medusa skills genuinely helped:** the `storefront-best-practices` guidance
on **multi-step checkout for B2B** (HV's flow is already multi-step and
approval-aware), **always fetching shipping and payment methods from the
backend** (HV does this), and **displaying variant details in cart** (HV's cart
is reference-based by design — see §4).

---

## 3. Vendure capabilities vs HV

| Vendure area | What it gives | HV status | Veronym |
|---|---|---|---|
| Order process | Configurable order state machine | HV's is bespoke and stricter | **HV is stronger** |
| Multi-vendor / multi-channel | Native multi-vendor order splitting | HV separates vendors by RFQ access, not by channel | **Different model** |
| Stock / allocation | Stock allocation on order placement | Not implemented | Possible gap |
| Payments | Payment method engine | HV does not take payments | **Must not adopt** |
| Search | Facet-based search | HV has its own search | **No gap** |
| Python backend | GraphQL API in Python | HV is TypeScript/Next.js | **Stack change** |

**Saleor** was also considered and rejected for the same reason: Python backend
would introduce the largest stack change for no capability HV lacks.

---

## 4. Why HV must not adopt a commerce engine

The mandate is explicit: HV is a **procurement hub**, not a consumer storefront.
Four HV features are not ordinary commerce features and would be *broken* by a
standard engine:

1. **Authority Matrix** — orders cannot move without policy-driven multi-level
   approval. Standard engines assume the buyer can check out.
2. **RFQ-first, not price-first** — HV's catalogue is deliberately
   supplier-anonymous and price-free until a verified quote exists. A standard
   catalogue/checkout would expose vendor identity and prices.
3. **ETA e-invoicing gate** — no order may dispatch without an ETA-accepted,
   digitally signed invoice. No commerce engine has this.
4. **Provider-controlled financing** — HV never holds funds; factoring partners
   settle. A payment-provider integration would create a conflicting money path.

Introducing Medusa or Vendure would create **two conflicting order systems** —
exactly what the mandate warns against.

---

## 5. Real gaps found (and what was done)

| Gap | Action |
|---|---|
| **Returns and disputes had models but zero routes** | **Closed** — `lib/returns/service.ts`, `POST /api/v2/returns`, `POST /api/v2/returns/[returnId]`, `POST /api/v2/disputes`, 22 tests |
| **Cart is browser-local only** | Documented. A server-persisted basket would let a buying team share requirements across devices; it is a deliberate next step, not a defect — the procurement path uses tenant-scoped RFQs, not the browser cart. |
| **No real sourced product exists** | **Blocker for the full journey demo.** See §6. |
| **Notifications were not wired to the order lifecycle** | Closed in this session — `lib/orders/notify.ts`. |

---

## 6. Journey demonstration — honest status

The mandate asks for a connected journey using **a real sourced product and a
confirmed Vendor offer**.

**That prerequisite is not met.** Verified against the dev database:

- 191 ACTIVE products exist, but **every one is `source=FIXTURE`** with
  `example.com` placeholder images. None is a real sourced product.
- The buyer-facing catalogue correctly returns **0 products** — the honest empty
  state.
- 19 ACCEPTED quotes and 19 orders exist, but they were generated from fixture
  products during lifecycle testing.

**What can be demonstrated today:** the full journey *machinery* — RFQ, quote,
approval, release, vendor acknowledgement, delivery, receiving, invoice,
return/discrepancy — is implemented and exercised, but only against fixture
data. Claiming otherwise would be fabrication.

**What is required to run the real journey:** at least one genuinely sourced
product (real supplier, real image rights, real price) and one confirmed vendor
offer. The Firecrawl pipeline built this session is ready to ingest it, but it
needs a `FIRECRAWL_API_KEY` — the live pilot against three real Egyptian
supplier URLs extracted **0 importable products** because those sites block
direct fetch or render client-side.

---

## 7. Recommendation

1. **Do not adopt Medusa, Vendure or Saleor.** HV's order governance, RFQ model,
   ETA gate and non-payment financing are the differentiators; a commerce engine
   would conflict with all four.
2. **Keep the browser cart as-is** for the procurement console; do not add a
   second cart abstraction. Consider server-side persistence only if a buying
   team needs cross-device requirement lists.
3. **Use the Medusa skills as design guidance only** — applied to HV's
   multi-step, approval-aware checkout, which already matches the B2B
   recommendation.
4. **Unblock the journey demo** by sourcing one genuine product and one
   confirmed vendor offer. Until then the honest statement is: machinery built
   and tested, real-product demo blocked.

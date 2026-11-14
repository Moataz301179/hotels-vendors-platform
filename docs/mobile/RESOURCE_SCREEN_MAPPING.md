# Resource → Hotels Vendors Screen Mapping (Phase 1, Step 4)

> Date: 2026-11-08 · Branch: `feat/hovin-mobile-execution` · Commit `5390f125`
> Every "Hotels Vendors destination" below is a **real file, model or endpoint
> verified in the Phase 0 audit** — not a proposed abstraction.
> Research artefact only. No code written. No purchase made.

---

## 1. Master mapping table

| # | External reference | Pattern | Hotels Vendors destination | Existing backing | Action |
|---|---|---|---|---|---|
| 1 | FluxStore | Multi-level category navigation (horizontal / menu / side / card) | `mobile/app/catalog/index.tsx` + `mobile/src/components/catalog.tsx` | `CatalogTaxonomy`, `Product`, `ProductVariation`, `/api/v2/catalog` | **ADAPT** — hierarchical hospitality taxonomy |
| 2 | FluxStore | Product card + confirmation badge | `mobile/src/components/catalog.tsx` (`CatalogCard`) | `ProductStatus`, `CatalogReferenceStatus`, `/api/v2/catalog/products` | **ADAPT** — confirmed vs researched-preview badge |
| 3 | FluxStore | Product detail with gallery / variant layout | `mobile/app/catalog/[productId].tsx` | `Product`, `ProductVariation`, `ProductTierPrice`, `UnitOfMeasure` | **ADAPT** — pack size, UOM, tier price |
| 4 | FluxStore | **Minimum quantity product** + **B2B wholesale product** | Catalogue + requirement flow | `Product.moq`*-equivalent*, `ProductTierPrice`, `UnitOfMeasure` enum | **ADAPT** — MOQ + UOM + tier pricing are core B2B needs |
| 5 | FluxStore | Vendor profile / rating / location | Supplier workspace | `Supplier`, `SupplierTier`, `SupplierStatus`, `SupplierAudit`, `DeliveryZone` | **ADAPT** — but **no supplier identity in buyer discovery** (our rule) |
| 6 | FluxStore | Search with keyword history + quick filters | `mobile/app/catalog/index.tsx` | `/api/v2/catalog?q=`, `/api/v2/marketplace?q=` | **ADAPT** |
| 7 | FluxStore | Multi-language + **Arabic RTL** | `mobile/src/i18n.ts` | already EN+AR with `isRTL` | **REUSE** — already done, no change |
| 8 | FluxStore | Checkout / payment flow | — | Hotels Vendors has **no cart checkout**; orders are RFQ → quote → PO, gated by Authority Matrix | **REJECT** — wrong domain model |
| 9 | FluxStore | WooCommerce vendor roles | — | `Role`, `Permission`, `RolePermission`, `UserPermissionGrant`, `lib/auth/rbac.ts` | **REJECT** — incompatible permission model |
| 10 | POSpro | Dense product/stock list: filter + export + print + row actions | Inventory & receiving lists | `InventorySnapshot`, `PhysicalInventoryCount`, `/api/v2/inventory`, `/api/v2/inventory/counts` | **ADAPT** — density + row actions |
| 11 | POSpro | **Low stock alerts** | Reorder recommendations | `ConsumptionForecast`, `InventorySnapshot`, `ProductSeasonality` | **ADAPT** — genuine forecast-backed reorder |
| 12 | POSpro | Transfer list (branch ↔ branch, warehouse ↔ warehouse) | Stock transfers between properties / storerooms | `Property`, `Outlet`, `LogisticsHub`, `InventoryReconciliation` | **ADAPT** |
| 13 | POSpro | **"Pending transfers cannot be edited"** | Receiving / GRN state lock | `GrnStatus`, `PhysicalCountStatus`, `ReconciliationStatus`, server-confirmed `submitReceipt` | **ADAPT** — reinforces our server-confirmed-state rule |
| 14 | POSpro | Role & permission list (role name + count of accessible features) | Platform administration | `Role`, `Permission`, `/api/v2/admin/user-permissions`, `/api/v2/admin/departments`, `/api/v2/admin/authority-rules` | **ADAPT** |
| 15 | POSpro | Collect Due / due list | Accounts payable + due dates | `Invoice`, `Payment`, `PaymentTerm`, `CreditTransaction`, `/api/v2/invoices` | **ADAPT** |
| 16 | POSpro | Retail POS financial summaries | — | our figures must come from `lib/fintech`, `lib/finance`, `JournalEntry`, `LedgerEntry`, `SpendRecord` | **REJECT** — retail POS maths is not procurement finance |
| 17 | Appetite UI | **Token system: 589 variables / 6 collections, every component reads a token** | `mobile/src/theme.ts` + `components/theme/tokens.ts` + `lib/theme/presets.ts` | currently a **single flat token object**, one theme | **ADAPT** — this is the four-theme foundation |
| 18 | Appetite UI | Light + dark from one token source | Four themes: **White, Black, Checkmate, King** | no theme variants exist yet | **ADAPT** — build natively, do not import |
| 19 | Appetite UI | Platform Bridge / System mode (iOS + Material from one source) | iOS + Android parity | single Expo/RN codebase already targets both | **ADAPT** — keep platform conventions, one brand |
| 20 | Appetite UI | **Table with pinned column + typed cells** | Web operational tables + mobile receiving lines | `components/ui/table.tsx`, `GrnLineItem`, `OrderItem`, `ReconciliationLineItem` | **ADAPT** — pinned column is genuinely missing |
| 21 | Appetite UI | 16 chart components + chart tokens + Legend + Sparkline | Management dashboards | `recharts ^3.9.2` present; `lib/dashboard`, `/api/v2/dashboard/trends`, `/api/v2/dashboard/records` | **ADAPT** — chart palette token needed |
| 22 | Appetite UI | **Tasks app — 10 screens** (My work, Board, Table, Timeline, Task, Project, Inbox, Search, Filters, New task) | `mobile/app/(tabs)/tasks.tsx` + approvals | `ProcurementApprovalPolicy`, `OrderApproval`, `AuthorityRule`, `lib/auth/authority-matrix.ts`, `/api/v2/action-queue` | **ADAPT** — tasks/approvals surface is thin today |
| 23 | Appetite UI | Focus / error / loading states on every control | All screens | `mobile/src/components/ui.tsx` `StateView` (loading/empty/offline/denied/expired/conflict) | **REUSE + ADAPT** — extend to focus/error on controls |
| 24 | Appetite UI | Shape & type scale (radius steps, capsule chips/search, card radius) | Both platforms | `radius` sm→xl in `mobile/src/theme.ts`; web `--*` tokens | **ADAPT** — formalise a radius + type scale |
| 25 | Appetite UI | **Liquid Glass (Clear / Regular / Tinted)** | — | — | **REJECT** — owner has repeatedly rejected glassmorphism |
| 26 | Appetite UI | Apple system dialogs (Passkey, Permission Alert, Review Prompt) | Permission + auth states | `expo-camera` permission flow in `mobile/app/(tabs)/scan.tsx` | **ADAPT** — permission-denied presentation only |
| 27 | Craftwork / UI8 | Finance dashboard, inventory/warehouse, enterprise analytics packs | — | — | **VISUAL_REFERENCE_ONLY** — no purchase, no adoption |

---

## 2. Reuse vs recreate (Step 5)

### REUSE (already correct — do not rebuild)

- `mobile/src/i18n.ts` — EN + genuine AR + RTL. FluxStore's strongest
  transferable feature is already implemented.
- `mobile/src/api/hovin.ts` — real API client with idempotency keys.
- `mobile/src/sync/offlineQueue.ts` + `drafts.ts` — spec-tested offline model.
- `mobile/src/components/ui.tsx` `StateView` — already covers
  loading / empty / offline / denied / expired / conflict.
- `lib/auth/*` (rbac, authority-matrix, four-eyes), `lib/tenant/scope.ts`.
- All 75 `/api/v2/*` routes and the `lib/` service layer.
- `components/ui/` 17 web primitives + `AppShell`.
- Web→mobile API contract (mobile consumes the same v2 API).

### RECREATE / BUILD (weak, missing, or inconsistent today)

| Item | Why | Destination |
|---|---|---|
| **Four-theme token system** | Only one flat token set exists on mobile; web theme provider is limited to `(marketing)`; no White/Black/Checkmate/King anywhere | Extend `mobile/src/theme.ts` → semantic token layer; extend `components/theme/tokens.ts` + `lib/theme/presets.ts` on web |
| **Theme selector + persistence** | No selector in the authenticated app | New settings surface, persisted via existing user-preference path; must not touch auth/role/tenant/data |
| **Pinned-column table** | Dense operational tables are a web requirement; not present | `components/ui/table.tsx` |
| **Chart palette tokens** | `recharts` is installed but no chart token set | New chart tokens in the theme layer |
| **Tasks / approvals surface** | `tasks.tsx` exists but the approvals workflow surface is thin vs the 10-screen reference | Extend `mobile/app/(tabs)/tasks.tsx` using `OrderApproval`, `AuthorityRule`, `/api/v2/action-queue` |
| **Focus / error states on controls** | `StateView` covers screens; per-control focus/error is not systematic | `mobile/src/components/ui.tsx`, web `components/ui/` |

### DO NOT COPY

- Any Flutter/Dart source (FluxStore, POSpro).
- Any WooCommerce / Dokan / WCFM / Laravel artefact, including their data models.
- FluxStore's checkout and payment navigation (our flow is RFQ → quote → PO under
  the Authority Matrix).
- POSpro's retail POS financial calculations (ours come from `lib/fintech`,
  `JournalEntry`, `LedgerEntry`).
- Appetite UI's 174-component library wholesale (would be a second design system).
- Appetite UI's Liquid Glass / glassmorphism.
- Appetite UI's Inter Display family (HV uses Manrope + Plus Jakarta Sans).
- Cross-designer packs from Craftwork/UI8 mixed into one system.

---

## 3. Workspace coverage check (directive §5 vs audited reality)

| Directive workspace | Existing HV backing | Status |
|---|---|---|
| A. Hotel management | `Hotel`, `Property`, `SpendRecord`, `/api/v2/dashboard/*`, `lib/dashboard` | **Partially built** |
| B. Purchasing | `Product`, `CatalogTaxonomy`, `RfqRequest`, `ProcurementQuote`, `Order`, `RequirementCart`, `/api/v2/catalog`, `/api/v2/rfq`, `/api/v2/orders` | **Data + routes exist; mobile screens unverified** |
| C. Inventory & receiving | `InventorySnapshot`, `PhysicalInventoryCount`, `GoodsReceiptNote`, `GrnLineItem`, `/api/v2/inventory/counts`, `/api/v2/grn`, `/api/v2/mobile/receipts` | **Data + routes exist; mobile screens partially verified** |
| D. Supplier | `Supplier`, `SupplierAudit`, `RfqSupplierAccess`, `ProductTierPrice` | **Data exists** |
| E. Finance & accounting | `Invoice`, `CreditNote`, `Payment`, `PaymentTerm`, `JournalEntry`, `LedgerEntry`, `Dispute`, `lib/fintech`, `lib/finance` | **Data + logic exist** |
| F. Logistics / carrier | `CarrierProfile`, `Shipment`, `CarrierOrderAssignment`, `CorridorRoute`, `DockSlot`, `/api/v2/carrier-assignments` | **Data + routes exist** |
| G. Funding partner | `FactoringCompany`, `FactoringRequest`, `FactoringTransaction`, `CreditFacility`, `OlivCreditFacility`, `/api/v2/funders`, `/api/v2/funding` | **Data + routes exist** |
| H. Platform admin | `Role`, `Permission`, `Department`, `AuthorityRule`, `AuditLog`, `/api/v2/admin/*` | **Data + routes exist** |

**Every workspace already has real data models and API routes.** The work is
presentation and mobile-screen completion — not new entities or new backends.

---

## 4. Proposed implementation sequence (from the mapping)

1. **Theme token foundation** (Phase 2) — semantic tokens + four themes on both
   platforms. Everything else depends on this.
2. **Mobile shell + verified tabs** (Phase 3/4) — already largely done; finish
   verification of requirement / RFQ / orders / receiving / product detail /
   notifications.
3. **Catalogue + product detail** — mapping rows 1–6.
4. **Inventory & receiving** — rows 10–13.
5. **Tasks & approvals** — row 22.
6. **Tables + charts** — rows 20–21.
7. **Finance / AP / due lists** — row 15.
8. **Web alignment** (Phase 5) — apply the same tokens; remove
   marketing-hero treatments and the `--admin-command-hero` gradient.

This sequence is proposed, not started. It requires owner approval of the
delivered visuals before any implementation resumes, per the standing hold.

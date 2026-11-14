# Template & Resource Research (Phase 1)

> Date: 2026-11-08 · Branch: `feat/hovin-mobile-execution` · Commit `5390f125`
> Method: official product pages, official documentation and FAQ pages retrieved
> over the web. **Nothing was purchased, downloaded, subscribed to or installed.**
> No dependency was added. No code was written or imported.

### Honest limitation

Screen inventories below are derived from **official product descriptions and
documentation**, not from running the paid demos. The FluxStore TestFlight/APK
demos and the POSpro live demo were not opened. Where a claim rests on vendor
copy rather than a running app, it is marked *(vendor claim)*.

---

## SOURCE A — FluxStore Multi-Vendor (InspireUI)

| Field | Value |
|---|---|
| Official | `https://codecanyon.net/item/fluxstore-multi-vendor-flutter-ecommerce-full-app/25013325` |
| Product page | `https://products.inspireui.com/fluxstore-multivendor/` |
| Documentation | `https://support.inspireui.com/` (guide index) |
| Demos *(not opened)* | iOS TestFlight `https://testflight.apple.com/join/Q2vniZJp`, Android APK via GitHub releases, video `https://youtu.be/RRTj2YjLFBo` |
| Website demos *(not opened)* | Dokan `http://dokan.mstore.io/`, WCFM `http://wclovers.mstore.io/` |
| Vendor demo login *(published by vendor)* | `vendor@demo.com` / `vendordemo` |
| Price | **$79 Regular License**; Extended License available (higher) |
| Sales / author | 3,665 sales · InspireUI, Envato **Power Elite Author** |
| Version | **6.4.0**, "Latest Flutter v3.44.x", recently updated |
| Files included | **Full Flutter/Dart source code, iOS & Android**; Figma design source; lifetime updates |
| Last update | "Recently Updated" (no exact date exposed on the page) |

### Classification

**4 — Complete mobile application source code** (Flutter/Dart), and
**5 — Backend-dependent application template** (requires WooCommerce).

### Backend assumption — confirmed by the vendor, twice

> "Using this app when you already have the WooCommerce site with the WCFM or
> Dokan plugin. The website/backend, Dokan, and WCFM plugins are **not included**
> in this product."
> — CodeCanyon page, and repeated on the InspireUI product page

> "Convert any WooCommerce website into PWAs, iOS & Android apps."
> "Compatible with WCFM and Dokan Marketplace plugins."

This is exactly the limitation the directive anticipated. It is now confirmed
from the vendor's own copy, not inferred.

### Screen / pattern inventory *(from vendor copy)*

- Multi-level category navigation (horizontal, menu, side menu, card view)
- Quick product filter; search with keyword history
- Product detail with configurable layout (SafeArea, video, thumbnail gallery,
  hero effect, image height, inline video)
- Product types: simple, variable, grouped, external/affiliate, downloadable,
  file-upload (e.g. prescription), **minimum quantity**, out-of-stock, on-sale,
  subscription, **B2B wholesale product**
- Vendor: profile, rating/review, map/location, create product from camera or
  gallery, delete, in-store search, real-time chat, vendor onboarding
- Search nearby vendors, display products by distance, store open hours,
  store vacation mode, order delivery date *(WCFM-dependent)*
- Checkout flow; multi-payment (COD, Smart COD, Paystack, PayTM, PayPal,
  Flutterwave, Razorpay, Mercado Pago, BACS, PhonePe, webview payments)
- Multi-language **including Arabic with RTL**, auto-detect locale, language picker
- Multi-currency (WOOCS / FOX switcher)
- Push notification via OneSignal and Firebase; in-app notification + history
- 65+ homepage layouts; flexible design system with drag-and-drop config
- White label: own logo and branding

### Strengths

- Deep, mature B2B-relevant catalogue patterns — minimum order quantity and
  B2B wholesale product types map directly to Hotels Vendors' MOQ / UOM needs.
- Strong multi-vendor discovery and vendor-presentation patterns.
- Genuine Arabic + RTL support (relevant to the Egyptian market).
- Design system is externally configurable (valuable *concept*, not code).

### Weaknesses

- **Flutter/Dart** — no compatibility with the existing Expo/React Native app.
- **Requires WooCommerce + Dokan/WCFM** — a PHP/WordPress backend we will not install.
- Its vendor roles and permissions are WooCommerce plugin roles; they do not
  match Hotels Vendors' `Role` / `Permission` / `UserPermissionGrant` / tenant model.
- Checkout and payment flows are WooCommerce-shaped; our order flow is
  Authority-Matrix governed and payment-guarantee gated — not comparable.
- Regular License **excludes** end products where end users are charged.
  Hotels Vendors charges transactional fees, so the **Extended License** would
  be the legally required tier — a materially higher cost.

### Verdict

**REJECT for code. VISUAL_REFERENCE_ONLY for patterns.**
Adopting its source would mean either a second Flutter app or a WooCommerce
backend — both explicitly forbidden, and both incompatible with the audited stack.

---

## SOURCE B — POSpro SaaS (Acnoo)

| Field | Value |
|---|---|
| Official | `https://codecanyon.net/item/pospro-pos-inventory-flutter-app-with-laravel-admin-panel/53621221` |
| Documentation | `https://doc.pospro.app/` |
| Demo | `https://pospro.app/` *(not opened)* |
| Price | Not exposed on the retrieved page (CodeCanyon listed item) |
| Version | 6.2 (17 Apr 2026) per CodeCanyon changelog; docs list 6.5 (20 May 2026) |
| Stack (confirmed) | **Flutter** mobile app + **Laravel** admin/backend (PHP) |
| Update model | Replace `app`, `database`, `public/assets`, `resources`, `routes`, `vendor`, `composer.json`, then visit `yourdomain.com/update` |

### Classification

**5 — Backend-dependent application template** (Flutter + Laravel).

### Backend assumption — confirmed

The CodeCanyon title itself states "Flutter App with **Laravel Admin Panel**".
The documentation's update procedure names `composer.json`, `routes`,
`resources`, `vendor` and a `/update` web route — an unmistakable PHP/Laravel
application. This is a second, competing backend and is excluded by the directive.

### Screen / pattern inventory *(from official docs)*

- **Product list** — filtering; export to Excel and CSV; print; "View" detail in
  a pop-up; edit, delete, multi-delete
- **Combo product** list (same interaction set)
- **Multi-Branch add-on** — branch list with search and per-page control, create
  branch, login-as-branch, **Role & Permission list** (name + count of accessible
  features), add role
- **Transfer list** — transfers between branches and/or warehouses; stock
  auto-increments/decrements on completion; **"Pending" transfers cannot be
  edited**; cancelled status available on edit
- **Collect Due** — due collection screen
- **SerialCode add-on** — transfer section when Warehouse/Multi-Branch installed
- App features *(vendor claim)*: real-time stock movement, inventory management
  with **low stock alerts**, user-role assignment, subscription plans,
  multi-user access with security control

### Strengths

- Clean, dense operational list patterns (filter + export + print + row actions)
  that suit receiving, transfers and inventory.
- **Low-stock alerts** map directly to reorder recommendations.
- The **"Pending transfers cannot be edited"** rule is a good interaction
  precedent for our own server-confirmed-state lock (GRN / receiving).
- Branch/warehouse transfer model maps to hotel property-to-property and
  storeroom transfers.
- Role & permission list presentation is a usable reference for the admin surface.

### Weaknesses

- Flutter + Laravel — neither is in our stack and neither should be.
- POS/retail domain: its financial model is retail POS, not hospitality
  procurement with factoring, ETA e-invoicing or Authority-Matrix approvals.
- Add-on monetisation model (Multi-Branch, SerialCode, TaxInvoice, Marketing,
  Pawapay, Fedapay are separate add-ons) indicates a fragmented product.
- The `/update` folder-replacement maintenance model is incompatible with our
  Git-based release process.

### Verdict

**REJECT for code. VISUAL_REFERENCE_ONLY for operational patterns.**

---

## SOURCE C — Appetite UI

| Field | Value |
|---|---|
| Official | `https://www.appetiteui.com/` |
| Documentation | `https://www.appetiteui.com/docs/introduction` |
| Installation | `https://www.appetiteui.com/docs/install` |
| FAQ & licensing | `https://www.appetiteui.com/faqs` |
| Author | Bohuslav Poláček |
| Updated | 8 October 2026 |
| Price | **Paid — one-time licence, Solo / Team / Enterprise on request, lifetime updates.** Exact prices are on the pricing page, which was **not retrieved** (purchase gate). |
| Format | Figma file, **and/or code** |
| Code exports | **React Native**, SwiftUI, Flutter, Jetpack Compose, CSS |
| Scale | **174 components, 1,984 variants, 589 variables across 6 collections** |

### Classification

**2 — Figma/design asset** and **3 — Reusable component library** (it ships code).

This is the **only source in the set with any genuine code compatibility**,
because it exports **React Native** — our actual mobile framework.

### What it is, in the vendor's own words

> "Appetite UI is a Figma UI kit for iOS and Android apps, built like a design
> system. One token source drives Apple and Material components in light and dark
> mode, and exports to SwiftUI, Jetpack Compose, Flutter and CSS."

> "It comes as a Figma file, as code for React Native, SwiftUI, Flutter and
> Jetpack Compose, or both, and one token source drives Apple and Material
> components in light and dark mode."

> "Underneath them, spacing, radius, type scale, color and motion are defined
> once as tokens, and every component reads from those tokens. That second part
> is why the file is still consistent six months in, and why a rebrand is one
> edit rather than a sweep."

### Critical confirmation — it is NOT a web dashboard kit

> "**Untitled UI is built for web apps, dashboards and marketing sites. Appetite
> UI is built for iOS and Android apps**, with the Apple and Material baselines in
> one file. If you are building for the web, buy Untitled UI."

This independently confirms the directive's warning. Appetite UI must not be
used to reshape the authenticated web application.

### Screen / pattern inventory *(from docs)*

- **Charts and tables** — 16 chart components on a categorical palette with
  chart tokens, plus Legend and Sparkline; **Table with a pinned column and
  typed cells**
- **Tasks app** — 10 screens in light and dark: My work, Board, Table, Timeline,
  Task, Project, Inbox, Search, Filters, New task
- **Focus and states** — Focused state on Button, Checkbox, Radio, Toggle;
  Error state on Checkbox; ring spinner for every Loading state; `bg/raised`
  token for sheets and menus in dark
- **Shape and type** — headings in Inter Display with tracking per size, radius
  steps of 40 and 48, chips and search as capsules, cards at radius 24
- **Apple system dialogs** — Passkey, Permission Alert, Review Prompt
- **Motion and progress** — keyframe filmstrips, Typing Indicator
- **Picker** — time slot list, quick durations, spectrum, hue slider
- **Liquid Glass** — Clear / Regular / Tinted (iOS 26 transparency styles)
- **Dynamic Island**, **iPhone Duo** (foldable inner/outer displays)
- **Platform Bridge** with a **System mode** that returns each screen to the
  values Apple and Google publish; iOS 27 mirror + Material 3 mirror in one file

### Why this matters most for the four-theme requirement

The directive's four themes (White, Black, Checkmate, King) are precisely a
**multi-theme token problem**. Appetite UI's architecture is the reference model:

- primitive → semantic token hierarchy
- **589 variables in 6 collections** — every component reads a token, nothing hardcoded
- light **and** dark driven by one source
- platform mirrors (iOS / Material) sharing one token set
- a System mode that can fall back to pure platform values

That is the shape Hotels Vendors needs — but it must be **mapped into our own
tokens**, not imported as a second design system.

### Strengths

- The only React-Native-compatible resource in the set.
- Purpose-built for iOS + Android (our two mobile targets).
- Explicit token architecture that directly solves the four-theme problem.
- Light **and** dark from one source — the directive explicitly forbids a dark
  theme made by "simply turning every background black".
- Platform-aware without abandoning platform conventions.

### Weaknesses / risks

- **Commercial, one-time licence, price not public on the retrieved pages.** Any
  purchase needs explicit approval (directive §2 and §10).
- 174 components / 1,984 variants is far larger than our 17 web primitives and
  our mobile `ui.tsx`. Adopting the component set wholesale would be a parallel
  design system — explicitly forbidden.
- Its own FAQ notes **"Liquid Glass"** — glassmorphism-adjacent iOS 26 effects.
  **The owner has repeatedly rejected glassmorphism.** Any adoption must exclude
  Liquid Glass entirely.
- Exports to five frameworks; we need exactly one (React Native). The rest is
  dead weight.
- Typography is Inter Display; Hotels Vendors uses Manrope + Plus Jakarta Sans.
  The type scale is adoptable; the family is not.

### Verdict

**ADAPT (concepts and token architecture only) — pending purchase approval.**
Do **not** adopt the component library. Do **not** adopt Liquid Glass.
Do **not** use it for the web application.

---

## SOURCE D — Craftwork

| Field | Value |
|---|---|
| Official | `https://craftwork.design/` |
| Catalogue | `https://craftwork.design/catalog?search={term}` |
| Model | Design-asset marketplace: **3,900+ packs** for Figma, Framer, Webflow and code, by **570+ independent designers**; "one plan opens all of them" |
| Pricing seen | Per-pack `$29–$89` (e.g. Dark Bento UI Kit from $29; ElementX Design System & UI Kit from $78; AgileAtlas Project Management UI Kit; Nevalex HR Management System UI Kit; Metrocard Finance Webflow Template from $29; PITIH Global Transfer Money Template from $29) plus a full-access subscription |
| Notable | Publishes an **MCP server** so AI agents can browse assets |

### Classification

**2 — Figma/design asset** marketplace (mixed Figma / Framer / Webflow / code).

### Search intent and result

The directive asks for enterprise mobile, finance/accounting interfaces,
e-commerce catalogue, inventory, procurement/logistics, data tables, SaaS
mobile. The homepage surfaced packs in several of those families, but the
homepage is **curated promotion, not a verified per-category result set** —
exactly the trap the directive warns about ("do not treat the marketplace
homepage as proof of a specific resource").

### Strengths

- Large, cheap, individually purchasable packs if a single specific pattern is missing.
- Some packs are Figma + Framer + Webflow + code, so formats are flexible.

### Weaknesses

- Mixed-target assets (Webflow/Framer ≠ React Native). Most packs are **web**,
  not mobile.
- Per-designer quality variance; no single consistent system across packs.
- Mixing packs from different designers is precisely how "random colour usage"
  and "inconsistent typography" enter a product — both are named acceptance
  failures.

### Verdict

**VISUAL_REFERENCE_ONLY. No purchase recommended at this time.**
Revisit only if Phase 2 identifies one specific, named missing pattern that no
other source covers.

---

## SOURCE E — UI8

| Field | Value |
|---|---|
| Official | `https://ui8.net/` |
| Operator | Robot Global FZCO / UI8.NET (© 2026) |
| Catalogue counts | UI Kits **6,385** · Coded Templates **451** · No-code **631** · Mockups **953** · 3D **1,473** · Themes **1,261** · Presentation **665** · Icon Sets **1,366** · Illustrations **1,447** · Fonts **878** |
| Model | Marketplace; **All-Access Pass** subscription (unlimited downloads across 14,000+ assets) |
| Notable | Also publishes an **MCP** endpoint |

### Classification

**2 — Figma/design asset** marketplace.

### Search intent and result

The directive asks for finance dashboards, accounting mobile screens, business
management apps, B2B commerce, inventory/warehouse, enterprise analytics,
iOS/Android UI kits, design systems. The homepage confirms those categories
exist at volume but — as with Craftwork — **the homepage is not evidence that any
particular item is compatible**. No individual product was evaluated.

### Strengths

- Volume and category breadth; 451 coded templates and 1,261 themes.
- A single All-Access Pass would satisfy any future one-off asset need.

### Weaknesses

- Subscription cost for breadth we do not need.
- Same cross-designer inconsistency risk as Craftwork.
- Marketplace licensing is per-product; "All-Access" does **not** grant
  unrestricted commercial rights for every asset.

### Verdict

**VISUAL_REFERENCE_ONLY. No purchase or subscription recommended at this time.**

---

## Cross-source summary

| Source | Native stack | Backend | Code-compatible with HV? | Licence | Recommendation |
|---|---|---|---|---|---|
| FluxStore Multi-Vendor | Flutter/Dart | **WooCommerce + Dokan/WCFM** (not included) | **No** | $79 Regular / **Extended required for us** | **REJECT** code · **VISUAL_REFERENCE_ONLY** |
| POSpro SaaS | Flutter | **Laravel** (PHP) | **No** | Paid (price not retrieved) | **REJECT** code · **VISUAL_REFERENCE_ONLY** |
| Appetite UI | Figma + **React Native** / SwiftUI / Flutter / Compose / CSS | None (design system) | **Yes — React Native** | Paid one-time, Solo/Team/Enterprise | **ADAPT** concepts · **purchase needs approval** |
| Craftwork | Figma / Framer / Webflow / code | None | Partial (mixed targets) | $29–$89 per pack or subscription | **VISUAL_REFERENCE_ONLY** |
| UI8 | Figma / coded templates | None | Partial | Per-product or All-Access subscription | **VISUAL_REFERENCE_ONLY** |

### The decisive finding

**Zero of the five sources should contribute code to Hotels Vendors.**
FluxStore and POSpro would each drag in a foreign backend (WooCommerce/PHP,
Laravel/PHP) and a foreign framework (Flutter). Appetite UI is the only
React-Native-capable source, and even it must contribute **concepts**, not
components — otherwise it becomes the "unrelated second design system" the
directive forbids.

The existing Expo 54 / React Native 0.81.5 / expo-router 6 app, wired to Clerk
and the 75 v2 API routes, is already the correct foundation. These resources
raise the *quality bar*, not the *architecture*.

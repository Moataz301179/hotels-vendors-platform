# Licensing & Dependency Review (Phase 1)

> Date: 2026-11-08 · Branch: `feat/hovin-mobile-execution` · Commit `5390f125`
> **Nothing was purchased, downloaded, subscribed to, or installed.**
> **No dependency was added to any manifest.** This document records what each
> resource would cost and require, so the owner can approve or decline.

---

## 1. Per-source recommendation

| Source | Classification | Recommendation | Reason |
|---|---|---|---|
| **FluxStore Multi-Vendor** | Complete Flutter app + backend-dependent template | **REJECT** (code) · **VISUAL_REFERENCE_ONLY** (patterns) | Flutter/Dart is foreign to Expo/RN. Requires WooCommerce + Dokan/WCFM, which we will not install. Its vendor roles do not match our RBAC. |
| **POSpro SaaS** | Flutter app + Laravel backend template | **REJECT** (code) · **VISUAL_REFERENCE_ONLY** (patterns) | Flutter + Laravel/PHP. Retail POS maths must not replace `lib/fintech`. |
| **Appetite UI** | Figma kit + code (React Native, SwiftUI, Flutter, Compose, CSS) | **ADAPT** (concepts only) · purchase **pending approval** | Only React-Native-capable source. Token architecture is the right model for four themes — but the 174-component library must not be adopted wholesale. |
| **Craftwork** | Design-asset marketplace (3,900+ packs) | **VISUAL_REFERENCE_ONLY** · **no purchase** | Mixed Figma/Framer/Webflow targets; cross-designer inconsistency risk. |
| **UI8** | Design-asset marketplace (14,000+ assets) | **VISUAL_REFERENCE_ONLY** · **no purchase** | Same inconsistency risk; subscription buys breadth we do not need. |

**Net: zero sources contribute code. All five are references.**

---

## 2. Licence and cost detail

### FluxStore Multi-Vendor — InspireUI

| Item | Detail |
|---|---|
| Regular licence | **$79** — "Use, by you or one client, in a single end product which end users **are not** charged for." |
| Extended licence | Higher tier — "…a single end product which end users **can be** charged for." |
| **Which applies to us** | **Extended.** Hotels Vendors charges transactional fees (1.5–2.5%) and supplier subscriptions, so end users *are* charged. Buying Regular would be a licence breach. |
| Sales | 3,665 |
| Author | InspireUI — Envato Verified Power Elite Author |
| Updates | Lifetime updates, free |
| Includes | Full Dart source (iOS + Android), Figma design source, video guides |
| Excludes | **The website/backend, Dokan, and WCFM plugins are NOT included.** FluxStore Manager and FluxStore Delivery Boy are separate products. |
| Last update | "Recently Updated"; version 6.4.0 (Flutter v3.44.x) |

**Cost if adopted:** Extended licence price (not disclosed on the retrieved
page) **plus** WooCommerce hosting **plus** Dokan or WCFM plugin licences.
Not recommended.

### POSpro SaaS — Acnoo

| Item | Detail |
|---|---|
| Licence | CodeCanyon item; price **not exposed** on the retrieved page |
| Stack | Flutter app + **Laravel admin panel** (confirmed by title and by the `/update` + `composer.json` + `routes` + `vendor` update procedure) |
| Add-ons | Multi-Branch, SerialCode, TaxInvoice, Marketing, Pawapay, Fedapay are **separate** add-ons — the licence is fragmented |
| Version | 6.2 (17 Apr 2026) per CodeCanyon; docs list 6.5 (20 May 2026) |
| Maintenance | Replace folders then visit `yourdomain.com/update` — incompatible with our Git release flow |

**Cost if adopted:** item price + add-on prices + Laravel/PHP hosting.
Not recommended.

### Appetite UI — Bohuslav Poláček

| Item | Detail |
|---|---|
| Licence type | **One payment. Lifetime updates. Unlimited client projects. No refunds.** Reselling, sublicensing and redistributing are **not** permitted. |
| Price — **Figma** | Solo **$129** · Team (≤10) **$299** |
| Price — **Code** | Solo **$79** · Team (≤10) **$179** — "Every Appetite UI component in React Native", "Rebrand in one theme file", "App Starter with Tasks, Foodie and AI flows", agent kit for Claude Code / Cursor |
| Price — **Complete** | Solo **$179** · Team (≤10) **$399** (Figma + Code) |
| Price — Enterprise | Custom — unlimited people, private derived library, negotiated terms |
| Price trend | "The price of Code rises with every release. Every release after you buy is included." |
| Format options | Figma file, code, or both |
| Code targets | React Native, SwiftUI, Flutter, Jetpack Compose, CSS |
| Scale | 174 components, 1,984 variants, 589 variables in 6 collections |
| Notable exclusion needed | **Liquid Glass** (glassmorphism) — owner has rejected glassmorphism repeatedly |
| Notable exclusion needed | Inter Display typography — HV uses Manrope + Plus Jakarta Sans |

**Two distinct decisions, which must not be conflated:**

1. **Buy Appetite UI?** → needs owner approval + a real price.
2. **Adopt its token architecture as a concept?** → **does not require a
   purchase.** The primitive → semantic → component model can be implemented
   natively in `mobile/src/theme.ts` and `components/theme/tokens.ts` for free.

**Recommendation: proceed with (2) now — it costs $0. Treat (1) as optional.**

The CHECKMATE theme is already fully defined from Appetite UI's **publicly
published** colour ramps (gray / blue / green / orange / red / sky / teal /
purple / pink / yellow, 154 foundation colours documented, read from Figma on
2 October 2026). Those values are published in their open documentation, so
**no purchase is required to ship that palette.**

### Craftwork

| Item | Detail |
|---|---|
| Model | Per-pack purchase **or** "one plan opens all" subscription |
| Per-pack prices observed | `$29–$89` (Dark Bento UI Kit from $29; ElementX Design System & UI Kit from $78; AgileAtlas Project Management; Nevalex HR Management; Metrocard Finance from $29; PITIH Global Transfer from $29) |
| Scale | 3,900+ packs, 570+ independent designers |
| Risk | Cross-designer inconsistency → the "random colour usage" and "inconsistent typography" acceptance failures |

**Recommendation: no purchase.**

### UI8

| Item | Detail |
|---|---|
| Model | Per-product licence **or** All-Access Pass subscription |
| Scale | 6,385 UI kits · 451 coded templates · 1,261 themes · 1,366 icon sets · 878 fonts |
| Operator | Robot Global FZCO / UI8.NET |
| Important | "All-Access" grants **download** breadth, **not** unrestricted commercial rights per asset |

**Recommendation: no purchase, no subscription.**

---

## 3. Approval gates (directive §2, §10)

The directive is explicit: *"Do not purchase anything, start a paid
subscription, accept a license, or introduce a paid dependency without explicit
approval."*

| Gate | Status |
|---|---|
| Purchase FluxStore | **Not requested. Not recommended.** |
| Purchase POSpro | **Not requested. Not recommended.** |
| Purchase Appetite UI | **BLOCKED — pending explicit owner approval and a retrieved price** |
| Purchase Craftwork packs | **Not requested. Not recommended.** |
| Purchase UI8 / All-Access | **Not requested. Not recommended.** |

**No money was spent and no licence was accepted in this phase.**

---

## 4. Dependency review — what we will NOT add

| Dependency | Why excluded |
|---|---|
| WooCommerce | Would become a second commerce backend alongside Prisma/Neon |
| Dokan / WCFM | Marketplace plugins with their own vendor roles; would replace our RBAC |
| Laravel / PHP runtime | Second backend stack; contradicts "one backend, one source of business truth" |
| Flutter / Dart SDK | Would create a competing mobile codebase next to the existing Expo/RN app |
| Firebase | Alternative backend/identity; Clerk + Neon already authoritative |
| Appetite UI component library (174 components) | Would be an unrelated second design system |
| Appetite UI Liquid Glass | Glassmorphism — repeatedly rejected by the owner |
| Inter Display | Replaces Manrope / Plus Jakarta Sans for no benefit |

---

## 5. Existing dependency findings from the audit (not from the templates)

These are pre-existing in the repository and surfaced during Phase 0:

| Finding | Detail | Recommendation |
|---|---|---|
| **Supabase packages present** | `@supabase/ssr ^0.12.0`, `@supabase/supabase-js ^2.108.1`, and a `lib/supabase/` module exist — while **Clerk is the authentication authority** and the owner's recorded preference is Clerk + Neon | **Investigate.** If no live code path uses them, remove — they contradict "one authentication and authorization model". Not removed in this phase. |
| **`@types/react-native` missing** | `mobile` devDependencies have `@types/react` and `typescript` but **not** `@types/react-native`; surfaces as an `expo start` warning, and the mobile `typecheck` script exists | Add if we keep TypeScript-first mobile development. Low risk, dev-only. |
| **Mixed React versions** | Web React `18.3.1`, mobile React `19.1.0` (RN 0.81.5 requirement) | Expected and correct for a web + Expo monorepo. No action. |
| **Two Prisma adapters** | `@prisma/adapter-pg` (Postgres/Neon) + `@prisma/adapter-better-sqlite3` (dev) | Intentional dev/prod split per AGENTS.md. Keep. |
| **`next-themes` present but under-used** | `ThemeProvider` referenced only from `app/(marketing)/layout.tsx` and its own file | Required for the four-theme system — must be extended into the authenticated app, not replaced. |

---

## 6. Bottom line

- **Licence cost to proceed with the recommended path: $0.**
  Every recommendation is VISUAL_REFERENCE_ONLY or ADAPT-CONCEPT.
- **The three themes cost $0 to define.** WHITE and BLACK derive from the
  existing measured palette (`mobile/src/theme.ts`); CHECKMATE derives from
  Appetite UI's publicly documented ramps. Nothing needs buying.
- **One decision is genuinely gated:** whether to purchase Appetite UI. It is
  **optional** — CHECKMATE's palette comes from their public documentation and
  costs nothing; the purchase only adds their React Native component set and
  theme starter.
- **Resolved:** the KING theme was cancelled by the owner on 2026-11-09, which
  removed the gold-accent conflict. Three themes remain (WHITE, BLACK,
  CHECKMATE) and **no gold is used anywhere**.

# HotelsVendors design system and product direction

Status: reference lock for the next implementation layer (web + HOVIN mobile).
This document is the source of truth for visual and content decisions until a later approved revision.

## Research gate

The requested Refero searches were attempted for styles, web screens, iOS screens, and procurement/receiving flows. The Refero connector returned `NO_SUBSCRIPTION` for every request, so no Refero reference, screenshot, URL, or design token is being fabricated here. Once the subscription is restored, the first task is to append a short Refero evidence ledger and compare it against this lock; the palette and product constraints below remain authoritative.

## Product north star

HotelsVendors is a hospitality sourcing network and commercial intelligence layer—not a generic procurement marketplace. It connects hotel demand, supplier capacity, external marketplaces, ERP records, logistics milestones, negotiated terms, and receiving evidence into one organization-scoped operating record.

The interface should make the network's value obvious in this order:

1. See the hotel requirement and the commercial context around it.
2. Discover comparable, verified supply across connected sources.
3. Negotiate and approve with landed cost, availability, delivery and authority visible.
4. Keep order, ETA, receipt evidence, settlement and performance in the same trace.
5. Turn accumulated demand and outcomes into cost reduction, leverage, forecasting and operating control.

No page may imply a supplier, price, saving, funding result, integration, or mobile release that has not been verified.

## Reference lock

- **Primary direction:** calm, high-contrast operational editorial: light information canvas with a dark charcoal control rail. Large, direct headlines; compact evidence blocks; deliberate whitespace; no decorative “AI marketplace” styling.
- **Preserve:** dark charcoal header and footer, white navigation text, warm white/cream page canvas, platinum-grey panels, baby-blue action emphasis, black/ink body text, restrained borders, and a sticky header with translucent charcoal backdrop.
- **Borrow only when evidence supports it:** dense but readable data tables for authenticated workspaces; progressive disclosure in approval and receiving flows; explicit loading, empty, unavailable and verified states.
- **Reject:** dark-blue page backgrounds, all-grey monotony, neon as a background or decoration, repeated hero imagery, generic role cards, invented catalogues, dead QR/app-store promises, and “before you get started” marketing blocks on the homepage.
- **Neon clarification:** Neon is the data infrastructure concern, not a visual colour direction. It must not be represented as a fluorescent UI treatment.

## Shared visual tokens

These roles apply to both platforms. Hex values are intentionally stable so web and mobile do not drift.

| Role | Token | Value | Use |
|---|---|---:|---|
| Ink | `hv.ink` | `#17232E` | Headings, primary text, icons on light surfaces |
| Charcoal chrome | `hv.charcoal` | `#3E4C5A` | Header, footer, authenticated shell rails only |
| Charcoal glass | `hv.charcoalGlass` | `rgba(62,76,90,.92)` | Sticky header backdrop after scroll |
| White | `hv.white` | `#FFFFFF` | Cards, forms, high-contrast content surfaces |
| Cream canvas | `hv.cream` | `#F7F5EF` | Public page background and quiet section breaks |
| Platinum | `hv.platinum` | `#E7EBEF` | Secondary panels, table bands, selected filters |
| Baby blue | `hv.babyBlue` | `#A9D3F5` | Primary action fill, focus accent, selected step |
| Blue ink | `hv.blueInk` | `#1F5E9C` | Links and action text on light backgrounds |
| Rule | `hv.rule` | `#C9D2DA` | Hairlines and card borders |
| Success | `hv.success` | `#23845B` | Verified, received, approved states only |
| Warning | `hv.warning` | `#A86616` | Needs review / incomplete commercial data |
| Error | `hv.error` | `#B43B3B` | Blocked or failed states |

Rules: dark charcoal is never replaced by dark blue; baby blue is an action signal, not a page fill; semantic colours are never used for decoration; dark chrome text is white; light surfaces use ink text.

## Web application

### Information architecture

- Public network: what the network connects, verified supply coverage, integrations, commercial intelligence, and a clear path to request access.
- Sourcing workspace: requirement → discovery across sources → comparison/RFQ → approval → order → ETA → receipt → settlement.
- Intelligence: property/category spend, price history, supplier performance, demand aggregation and opportunity signals. No claim is shown without a source and timestamp.
- Account surfaces: Clerk organization sign-in, role-aware onboarding and organization-scoped permissions. Hotels and suppliers are primary workspaces; carriers and funders are provisioned partner portals, not four equal public roles.

### Page composition

Use a consistent sequence: one outcome-led heading, one sentence that names the operator pain, one evidence/action region, then a small number of supporting details. A page should never stack unrelated marketing modules or repeat the same explanation.

Authenticated pages use a two-level shell: charcoal global rail with white labels, then a light working canvas. Tables, filters and approval actions stay on white/platinum surfaces with visible source, status, owner, timestamp and next action.

### Content voice

Use precise operational language: “Compare landed cost and delivery commitment”, “Approval required from Operations”, “No verified offer yet—keep the requirement open”. Avoid “revolutionary”, “seamless”, “take the work with you”, vague promises, or generic feature lists.

### State requirements

Every data surface has loading, unavailable, empty, partial, verified and error states. Unavailable data explains what could not be reached and offers a safe next action; it never substitutes placeholder products, prices, logos or savings.

## HOVIN mobile app (iOS and Android)

HOVIN is the field execution companion, not a decorative preview of the web catalogue. Its core job is receiving and evidence capture against an existing order:

1. Sign in through the same Clerk organization boundary.
2. See deliveries due today with supplier, order, ETA and exception status.
3. Open one delivery, review expected lines and quantities.
4. Scan or attach receipt evidence, confirm actual quantities, record shortages/damage and submit.
5. Sync a timestamped receiving event back to the web order and settlement trail.

Mobile uses the same tokens, with `hv.charcoal` for top chrome/status-safe navigation and white/cream content surfaces. It prioritizes one-handed controls, 44pt minimum targets, persistent save/sync feedback, offline-safe draft capture and explicit retry states. No dead QR code, fake App Store link, or unverified distribution claim is allowed.

## Typography, layout and interaction

- Sans family: Plus Jakarta Sans / system fallback, with a clear weight contrast rather than decorative display treatment.
- Public headline: 48–72px desktop, 36–48px tablet, 32–40px mobile; line-height 1.02–1.1.
- Workspace heading: 28–40px; body 15–17px; table metadata 12–13px.
- Base spacing: 4px unit; common gaps 8/12/16/24/32/48/64px.
- Radius: 8px controls, 12px cards, 16px major panels; no excessive pill UI.
- Borders are hairlines. Shadows are soft and rare; hierarchy comes from surface and spacing.
- Motion is functional: header translucency, step progression, save/sync confirmation. No looping decorative animation.
- Keyboard focus and screen-reader labels are required; contrast must meet WCAG AA.

## Imagery and media

Use photography only when it explains a real hospitality category, facility or field context. Prefer a verified product/supplier image or an intentional aspect-ratio placeholder over generic stock imagery. Never repeat one hero image across multiple pages. Product screenshots and workflow diagrams must show the actual state they describe.

## Layered implementation order

1. Lock shared tokens and chrome (header, footer, authenticated rail, responsive shell).
2. Rebuild the public homepage around network value and sourcing intelligence; move onboarding/pricing/help explanations to their own pages.
3. Implement Clerk organization auth and role-aware hotel/supplier onboarding with real loading/error states.
4. Implement the sourcing workspace: requirement, catalogue aggregation, compare/RFQ, approval and audit trail.
5. Implement order, ETA, receiving and settlement evidence.
6. Implement intelligence views using verified Neon-backed records and source/timestamp labels.
7. Apply the same token contract to HOVIN mobile and prove the receiving sync path.
8. Validate each layer in a browser/device flow before deploying the next one.

## Acceptance checklist

- Header and footer share the same charcoal fill; header remains readable and translucent when sticky.
- No dark-blue backgrounds and no accidental green/neon brand treatment.
- Public copy explains a sourcing network and measurable commercial outcomes, not a generic marketplace.
- Homepage contains no unrelated onboarding/pricing FAQ block.
- Hotel and supplier auth surfaces render Clerk or an explicit, actionable configuration error—not an infinite “Loading secure registration” state.
- Marketplace and sourcing surfaces show verified records or honest unavailable states.
- Web and mobile share palette, status semantics and organization boundaries.
- Every deployed layer has a live browser-level acceptance check and a source commit recorded before release.

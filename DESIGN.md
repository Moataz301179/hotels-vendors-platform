# HotelsVendors Design System

## Product and brand register
HotelsVendors is a premium hospitality commercial network for Hotels, Suppliers, Carriers and Funders. The Virtual Shadow is the signature intelligence layer: it connects permissioned business context to evidence-backed findings and human-owned next actions. It is not a generic AI dashboard, lender, or ordinary marketplace.

Brand voice: **precise, commercially useful, calm**. The interface should feel like a contemporary trade instrument: legible, trustworthy, evidence-first, and distinctly crafted. Avoid generic SaaS landing-page patterns, oversized empty cards, decorative gradients, stock AI imagery, and fake commercial metrics.

## Visual direction
- Signature motif: **Signal Folio**, a selectable evidence path from source activity → connected context → potential finding → human action.
- Material: warm mineral paper and cool mist surfaces against charcoal; fine rules, tabular alignment, controlled asymmetry and purposeful negative space.
- Accent: ice blue/cobalt for interactive signals and selected states; muted green only for positive/verified states; red reserved for destructive/error states.
- The Virtual Shadow illustration must communicate actual product behavior. Label illustrative scenarios as illustrative, never imply that synthetic examples are live customer data.
- All titles use one tone within the entire title; no colored emphasis words. The public hero uses warm paper with ink text and hospitality photography.
- Use the shared `Brand` lockup on all active pages: official icon and canonical HotelsVendors wordmark.
- Marketing pages persuade; product workspaces optimize scanning, decision-making and operational density. Share the same tokens, not necessarily identical layouts.
- Use the existing official logo asset. On dark charcoal surfaces, /logo-white.svg is intentionally monochrome white.

## Color tokens
Defined centrally in app/globals.css using OKLCH graded ramps:
- Paper ramp: --paper-0, --paper-50, --paper-100, --paper-200.
- Neutral ramp: --slate-950, --slate-800, --slate-700, --slate-600, --slate-500, --slate-400, --slate-200.
- Signal ramp: --ice-100, --ice-300, --cobalt-600, --cobalt-700.
- Status ramps: --green-600 for positive/verified states; --red-600 for destructive/error states.
- Semantic aliases: --bg, --surface, --surface-raised, --ink, --muted, --line, --blue, --blue-strong, --charcoal, --green, --danger and --focus.
Use the semantic aliases in components and graded tokens only when a deliberate shade is needed. Avoid near-duplicate hard-coded hex values. Do not use color alone to communicate status. Keep text contrast WCAG AA or better.

## Typography
- Display: **Archivo**, variable weight; strong, compact commercial headings.
- Body and UI: **Source Sans 3**, variable weight; clear labels, tables and long-form reading.
- Headings use fluid clamp() scales, intentional weight contrast, and tracking no tighter than -0.04em.
- Marketing/body copy: 14–16px desktop, at least 14px on mobile. Dense metadata may be smaller only when it remains secondary and legible.
- Keep paragraphs to a comfortable measure (about 65–75 characters); never shrink essential workflow text to fit a composition.

## Layout and components
- Main content width: up to 1320px, responsive gutters.
- Use open ledger rows and structured sections before reaching for cards. Avoid nested cards and repeated icon-card grids.
- Sticky public header: charcoal background, uncropped white logo, white/soft-neutral navigation, clear keyboard and mobile states.
- Footer: solid near-black background, white logo, restrained separators and readable links.
- Signal Folio: clear four-step path, selected stage, source/evidence detail, explicit illustrative labeling, keyboard-accessible controls.
- Actor rows distinguish Hotels, Suppliers, Carriers and Funders without implying an ordinal ranking.
- Marketplace states must distinguish loaded real listings, empty catalogue, and unavailable/error states. Never substitute mock listings for production data.
- Authentication uses the same visual language but preserves Clerk behavior, role intent constraints and existing auth callbacks.
- Product workspaces keep functional density, role-specific navigation, visible focus states and responsive overflow handling.

## Interaction and motion
- Controls have default, hover, focus-visible, active, disabled, loading, error and success states where applicable.
- Target at least 44px touch height for primary navigation, buttons and form controls.
- Use short ease-out transitions; animate opacity/transform or signal traces, not layout properties.
- Respect prefers-reduced-motion; no motion may block reading or action.
- Keep keyboard focus visible, input caret and scrollbar colors aligned to the theme, and disabled states unmistakable.

## Asset standards
- Prefer bespoke, product-grounded diagrams and verified real assets over generic stock images.
- Verify asset paths and intrinsic dimensions before use; preserve logo aspect ratio and never crop the brand name.
- Use optimized responsive imagery, useful alt text, stable aspect ratios and lazy loading below the fold.
- Never create fake customer logos, testimonials, metrics, prices, listings or savings claims.

## Responsive and release gates
- Review desktop (1440px), tablet (~768px), and mobile (390px) at actual rendered size.
- No horizontal overflow, clipped brand name, inaccessible controls, tiny essential text, or blank/unhandled loading/error states.
- Run lint, production build and the relevant tests after UI changes. Capture fresh desktop/mobile screenshots, inspect them visually, then fix material defects before release.
- Visual quality is not established by a clean build alone. Deployment is not complete until the deployed URL is checked against the approved source and its key routes are smoke-tested.

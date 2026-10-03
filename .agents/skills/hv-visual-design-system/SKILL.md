---
name: hv-visual-design-system
description: Specialized visual-design skill for HotelsVendors public pages, dashboards, marketplace, onboarding, brand assets, color grading, and responsive polish.
---

# HotelsVendors Visual Design System

## Mission
Make HotelsVendors feel like a premium, credible hospitality-business intelligence network—not a generic SaaS template. The network is the operating environment; Virtual Shadow is the differentiating intelligence layer.

## Art direction
- Premium editorial software, Apple-level restraint, ice.com-style clarity; warm paper surfaces paired with a precise charcoal interface.
- Palette: porcelain/off-white, mist grey, ink/charcoal, restrained ice-blue. Mint only for small status indicators. Avoid saturated blue everywhere, purple AI gradients, rainbow gradients, glassmorphism overload, giant empty cards, and generic stock-photo collages.
- Use gradients intentionally: subtle radial illumination behind Virtual Shadow, tonal transitions on hero/CTA, restrained blue-to-ice highlights on active/signal elements. Maintain contrast.
- Logo must remain crisp, uncropped, correctly proportioned, and contrast-safe. Never stretch the SVG or imitate it with text.
- Typography: clear display hierarchy, controlled tracking, readable body copy, consistent line lengths. Do not make body text tiny just to appear minimal.
- Layout: strong grid, fewer meaningful sections, compact high-information composition, no artificial whitespace or endless scroll.
- Assets: use product-specific high-resolution diagrams/illustrations, verified photography, purposeful motion. Every image needs a purpose, correct crop/aspect ratio, responsive behavior, alt text, and focal point. Never present fabricated dashboards or invented metrics as live data.
- Virtual Shadow must communicate Hotels, Suppliers, Carriers, Funders and the observe → evidence → action → outcome loop. Label illustrative signals honestly.

## Design tokens
Centralize semantic tokens for surfaces, primary/secondary/muted/inverse text, ice-blue accent/hover/wash, mint/amber/red states, borders, shadows, radii, content width, spacing, focus rings and motion. Avoid scattered near-duplicate hard-coded colors.

## Interaction and accessibility
- Keyboard-visible focus, sufficient contrast, semantic landmarks and heading order.
- Responsive at 320, 390, 768, 1024 and 1440 px. Prevent clipped labels, overlapping nodes and horizontal scrolling.
- Honor prefers-reduced-motion. Motion should explain hierarchy, not distract.
- Interactive controls need hover, focus, active, disabled, loading, empty and error states where applicable.
- Do not claim security, measured savings, live signals, verification or integrations unless implementation and runtime prove them.

## Required workflow
1. Inspect actual route, shared layout, global styles, assets and responsive behavior before editing.
2. Identify canonical branch/worktree and protect unrelated changes. Never deploy from detached/dirty worktree without reconciliation.
3. Define semantic tokens before component-specific polish.
4. Refine in order: logo → typography → color grade/surfaces → layout hierarchy → visualization/assets → interaction/responsive states.
5. Prefer coherent changes to the existing system; remove duplicate styles only when safe.
6. Run available lint/type/build checks. Inspect built output and test routes at desktop/mobile widths.
7. Verify production separately from build success. Record commit, deployed release, HTTP status, key asset loading, errors and rollback target.
8. Report completed work, failed checks, blockers and remaining work. Never claim “fixed” without evidence.

## HotelsVendors content constraints
- Preserve Hotels, Suppliers, Carriers and Funders.
- Virtual Shadow identifies cost leaks, savings opportunities, commercial/network opportunities and cash-flow signals from authorized sources.
- External funders own underwriting, approvals, terms and disbursement; HotelsVendors is not a lender.
- Distinguish potential, quoted, negotiated and realized savings. Never invent metrics or customer logos.
- Public self-service registration is for Hotels and Suppliers; privileged partner onboarding remains controlled.

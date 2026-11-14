# Design System Decisions (Phase 1, Step 5 + directive §4)

> Date: 2026-11-08 · Branch: `feat/hovin-mobile-execution` · Commit `5390f125`
> Decisions documented. **No token file has been modified yet.**
> Two items are flagged **OPEN** and require an owner decision before
> implementation.

---

## 1. Token architecture decision

**Decision: three-layer semantic token system, built natively. Do not import
Appetite UI's variables.**

```
Layer 1 — PRIMITIVE   raw palette values (paper, charcoal, cobalt, …)
Layer 2 — SEMANTIC    role names (background, surface, textPrimary, brand, danger, …)
Layer 3 — COMPONENT   components read Layer 2 ONLY, never Layer 1
```

Rationale (adopted as a *concept* from Appetite UI, which runs 589 variables in
6 collections where "every component reads from those tokens"):

- A rebrand or a new theme becomes one layer edit, not a sweep.
- It directly solves the four-theme requirement.
- It prevents the acceptance failure "random colour usage".

**Rule: no component may hardcode a hex value.** Today `mobile/src/theme.ts` is a
single flat object and several web styles hardcode hex (`#2f6fb0`, `#68747c`,
`#cbd0ce`, …). Both must move to semantic tokens.

### Where the tokens live

| Platform | Current file | Change |
|---|---|---|
| Mobile | `mobile/src/theme.ts` (flat, one theme, measured palette) | Promote to semantic layer + 4 theme variants |
| Web | `components/theme/tokens.ts`, `lib/theme/presets.ts`, `app/globals.css` `:root` blocks (lines 17, 301) | Extend `:root` semantic tokens with 4 theme scopes |
| Web provider | `components/theme/theme-provider.tsx` (currently referenced **only** from `app/(marketing)/layout.tsx`) | Move into the authenticated app so all themes work there |

---

## 2. Required semantic tokens (directive §4 minimum set)

Every theme **must** define all of these:

**Surfaces & text**
`background` · `surface` · `surfaceElevated` · `textPrimary` · `textSecondary`
· `border` · `inputBackground` · `navigationBackground`
· `navigationSelected` · `tableHeader` · `tableRow`

**Brand & state**
`brandPrimary` · `brandSecondary` · `accent` · `success` · `warning` · `danger`
· `info` · `focus` · `selected` · `disabled`

**Data**
`chartPalette[1..8]` (categorical, token-driven — required by the 16-chart
reference and our existing `recharts` usage)

### Shared (theme-independent) tokens

`typography` (family, scale, weights) · `spacing` · `radius` · `shadow`
· `iconSize` · `touchTarget` (≥44pt, already `TOUCH_TARGET = 44` on mobile)
· `motion` (duration + easing)

---

## 3. Base palette (measured, not invented)

Extracted from the owner's website reference with Pillow and already committed
in `mobile/src/theme.ts`. All four themes derive from it.

| Token | Value |
|---|---|
| paper | `#FDFDFB` |
| surface | `#F4F3ED` |
| card | `#FFFFFF` |
| ink | `#212325` |
| chrome | `#312E2F` |
| cobalt | `#276AA9` |
| cobaltSoft | `#E8F0F7` |
| muted | `#6B6C6D` |
| border | `#E5E5E7` |
| success | `#2F6B4F` |
| warning | `#8A6D1F` |
| danger | `#A33A34` |

---

## 4. The three themes

### Theme 1 — WHITE *(default)*

**The standard theme.** Brand identity, carrying the **current web app colours** —
the measured website palette in §3. Every other theme is contrasted against this.

Clean enterprise light. Soft-neutral surfaces, restrained accent, fine borders,
subtle elevation, high information density without clutter.

| Role | Value |
|---|---|
| background | `#FDFDFB` (paper) |
| surface | `#F4F3ED` |
| surfaceElevated | `#FFFFFF` |
| textPrimary | `#212325` |
| textSecondary | `#6B6C6D` |
| border | `#E5E5E7` |
| brandPrimary | `#276AA9` |
| brandSecondary | `#E8F0F7` |
| accent | `#276AA9` |
| success / warning / danger | `#2F6B4F` / `#8A6D1F` / `#A33A34` |
| navigationBackground | `#FFFFFF` |
| navigationSelected | `#276AA9` on `#E8F0F7` |
| tableHeader | `#F4F3ED` |
| tableRow | `#FFFFFF` |

### Theme 2 — BLACK

**Dark theme built on the same brand palette** as WHITE (owner instruction,
2026-11-09) — the same palette family taken into dark mode, **not** a foreign
palette.

Premium dark enterprise. Deep charcoal and near-black, **not pure black
everywhere** (the directive explicitly forbids an oppressive pure-black result).
Muted neutral secondary text; clear separation between cards, navigation and
content.

| Role | Value |
|---|---|
| background | `#1A1918` (deep charcoal — deliberately not `#000000`) |
| surface | `#242221` |
| surfaceElevated | `#312E2F` (chrome) |
| textPrimary | `#F5F5F4` (`onDark`, already in mobile theme) |
| textSecondary | `#A9A9A8` (`onDarkMuted`, already in mobile theme) |
| border | `#3A3736` |
| brandPrimary | `#5C9BD1` (cobalt lifted for contrast on dark) |
| brandSecondary | `#1E3348` |
| accent | `#5C9BD1` |
| success / warning / danger | `#4F9A74` / `#C2A03A` / `#C95650` |
| navigationBackground | `#242221` |
| navigationSelected | `#5C9BD1` on `#1E3348` |
| tableHeader | `#312E2F` |
| tableRow | `#242221` |

> Note: the previously rejected `#0A0A0A` + `#FF3D00` pairing is **not** used.
> That combination is recorded as REJECTED for this product.

### Theme 3 — CHECKMATE

**Owner instruction (2026-11-09):** the third theme is taken from the reference
libraries that ship ready mobile templates and theme colours — a genuinely
different palette, not a re-tint of the brand palette.

**Source chosen: Appetite UI.** It is the only reference whose colours are
**publicly published and verifiable**, and the only React-Native-compatible
source. Its Colors documentation publishes 154 foundation colours — 112 ramp
steps and 42 alpha steps — every hex read from the Figma file on 2 October 2026.
**Every value below is taken from that public page. None is invented.**

| Role | Value | Appetite UI token |
|---|---|---|
| background | `#F4F5F5` | `gray-50` |
| surface | `#FFFFFF` | `gray-0` |
| surfaceElevated | `#FFFFFF` | `gray-0` |
| textPrimary | `#0E0E0F` | `gray-950` |
| textSecondary | `#636366` | `gray-600` |
| border | `#D1D1D6` | `gray-200` |
| inputBackground | `#FFFFFF` | `gray-0` |
| brandPrimary | `#155DFC` | `blue-500` |
| brandSecondary | `#EFF6FF` | `blue-50` |
| accent | `#2B7FFF` | `blue-400` |
| success | `#16A34A` | `green-600` |
| warning | `#F54900` | `orange-600` |
| danger | `#E7000B` | `red-600` |
| info | `#35ADE9` | `sky-600` |
| focus | `#155DFC` | `blue-500` |
| selected | `#EFF6FF` | `blue-50` |
| disabled | `#C7C7CC` | `gray-300` |
| navigationBackground | `#FFFFFF` | `gray-0` |
| navigationSelected | `#155DFC` on `#EFF6FF` | `blue-500` on `blue-50` |
| tableHeader | `#F4F5F5` | `gray-50` |
| tableRow | `#FFFFFF` | `gray-0` |
| chartPalette | `#2B7FFF` `blue-400` · `#22D3BB` `teal-500` · `#7D52F4` `purple-500` · `#FF6900` `orange-500` · `#47C2FF` `sky-500` · `#22C55E` `green-500` · `#FB4BA3` `pink-500` · `#FFB900` `yellow-400` | |

Notes:
- Deliberately **not** the brand palette — that is the point of this theme.
- `warning` uses `orange-600 #F54900`, **not** a gold or amber tone, to respect
  the standing no-gold preference.
- `success` green is a functional status colour; the existing HV palette already
  carries `success: #2F6B4F`, so status green is established for this product.
- Appetite UI's **Liquid Glass** roles are excluded — glassmorphism is rejected.
- The chess-horse motif is **no longer** used here; CHECKMATE is now the
  externally-sourced palette theme.

### ~~Theme 4 — KING~~ — **CANCELLED**

**Owner decision (2026-11-09): cancelled. Not built.**

The theme set is therefore **three themes**:

| # | Theme | Identity | Palette source |
|---|---|---|---|
| 1 | **WHITE** | Standard, brand identity — the current web app colours. **Default.** | The owner's measured website palette (§3) |
| 2 | **BLACK** | Dark theme built on **the same** brand palette | Derived from the measured palette (§3) |
| 3 | **CHECKMATE** | A deliberately **different** palette, taken from the reference libraries | Appetite UI published ramps |

The gold-accent conflict that was blocking this section is resolved by removal —
**no gold is used anywhere in the theme system.**

---

## 5. Rules binding all three themes

1. **No hardcoded theme colours inside components.**
2. **No gradient as a primary background.** (Existing violation to fix in
   Phase 5: `.admin-command-hero` in `app/globals.css` uses
   `linear-gradient(145deg, …)`.)
3. **No glassmorphism.** Appetite UI's "Liquid Glass" (Clear / Regular / Tinted)
   is **REJECTED** — the owner has repeatedly rejected glassmorphism.
4. **No neon.**
5. **Dark themes must not be pure black everywhere** — charcoal and elevated
   surfaces stay distinguishable from `background`.
6. **Touch targets ≥ 44pt** on mobile (already `TOUCH_TARGET = 44`).
7. **Contrast** — text on every surface must meet WCAG 2.2 AA.
8. Theme changes must **not** affect authentication, roles, permissions, tenant
   isolation, data, workflow state or business logic.
9. Theme selection persists via the **existing** user-preference mechanism — no
   new external settings service.
10. All three themes must be exercised against the **same** screens and the
    **same** real data.

---

## 6. Open decisions

### Resolved

| # | Question | Resolution |
|---|---|---|
| 1 | **KING: gold or gold-free?** | **Resolved by cancellation.** Owner cancelled KING on 2026-11-09. Three themes remain; no gold is used anywhere. |

### Still open

| # | Question | Detail | Why it matters |
|---|---|---|---|
| 2 | **Appetite UI purchase: approved or not?** | Real pricing retrieved from the public pricing page: **Figma Solo $129 / Team $299 · Code Solo $79 / Team $179 · Complete Solo $179 / Team $399.** One payment, lifetime updates, **unlimited client projects**; reselling, sublicensing and redistribution are **not** permitted. | CHECKMATE's palette is already built from Appetite UI's **publicly documented** ramps, so **$0 is required to ship it**. Buying is only needed if we also want their 174 React Native components and the "rebrand in one theme file" starter — convenient, but **not required**. |

Nothing here blocks Phase 0/1, which are complete. Item 2 blocks only the
optional purchase, not the theme work.

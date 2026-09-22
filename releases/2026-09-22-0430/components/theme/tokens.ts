/**
 * HotelsVendors Design Tokens — ICE.com-inspired institutional dark theme
 * Owner-locked palette: #0A0A0A charcoal bg + #FF3D00 accent
 * Mirrors ICE.com's institutional finance aesthetic: dark, high-contrast, data-dense
 *
 * Source of truth: memory notes (DUAL THEME LOCKED 2026-09-07)
 * - Swiss Light for marketplace/catalog (white cards, #FAFAFA text, #FF3D00 accent)
 * - Dark Bold for dashboards (charcoal #0A0A0A, white text, #FF3D00 borders)
 * - NO green, NO gold, NO glassmorphism, NO bold fonts (font-weight: 400)
 */

export const HV_THEME = {
  // ─── Dark Mode (Dashboards — mirrors ICE dark institutional) ───
  dark: {
    background: "#0A0A0A",        // charcoal (owner-locked)
    surface: "#0F0F12",            // card surface
    surfaceHover: "#15151A",
    text: {
      primary: "#FAFAFA",          // white (owner-locked)
      secondary: "#A8AEB8",         // grey
      muted: "#7A7A92",
    },
    border: {
      subtle: "rgba(255, 255, 255, 0.04)",
      visible: "rgba(255, 255, 255, 0.08)",
      accent: "rgba(255, 61, 0, 0.35)",   // #FF3D00
    },
    accent: {
      base: "#FF3D00",             // orange-red (owner-locked)
      hover: "#FF521A",
      muted: "rgba(255, 61, 0, 0.12)",
    },
  },
  // ─── Light Mode (Marketplace/Swiss Light) ───
  light: {
    background: "#FFFFFF",
    surface: "#FAFAFA",            // white cards (owner-locked)
    surfaceHover: "#F5F5F5",
    text: {
      primary: "#0A0A0A",          // near-black on white (owner-locked)
      secondary: "#5A6A7E",
      muted: "#7A8A9E",
    },
    border: {
      subtle: "rgba(10, 10, 10, 0.06)",
      visible: "rgba(10, 10, 10, 0.10)",
      accent: "rgba(255, 61, 0, 0.35)",
    },
    accent: {
      base: "#FF3D00",
      hover: "#FF521A",
      muted: "rgba(255, 61, 0, 0.12)",
    },
  },
  // ─── Typography (Plus Jakarta Sans, font-weight 400 only) ───
  font: {
    family: '"Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    arabic: '"Cairo", "Plus Jakarta Sans", ui-sans-serif, sans-serif',
    size: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      md: "1.125rem",
      lg: "1.25rem",
      xl: "1.5rem",
      "2xl": "2rem",
      "3xl": "2.5rem",
      "4xl": "3rem",
    },
    // NO BOLD — owner explicitly rejects bold fonts
    weight: {
      normal: 400,
      medium: 400,  // forced to 400 per owner lock
      semibold: 400,
      bold: 400,
    },
  },
  // ─── Spacing (8px base, ICE-style dense) ───
  space: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
    "3xl": "4.5rem",
  },
  // ─── Layout ───
  layout: {
    headerHeight: "64px",
    sidebarWidth: "280px",
    containerMax: "1200px",
    borderWidth: "1px",
    borderRadius: {
      sm: "4px",
      md: "8px",
      lg: "12px",
      xl: "16px",
      full: "9999px",
    },
  },
} as const;

// ─── Category colors (from lib/marketplace/categories.ts) ───
export const HV_CATEGORY_COLORS = {
  fb: { bg: "rgba(251, 191, 36, 0.12)", text: "#FBBF24", border: "rgba(251, 191, 36, 0.30)" }, // amber
  hk: { bg: "rgba(2, 132, 199, 0.12)", text: "#06B6D4", border: "rgba(2, 132, 199, 0.30)" }, // sky
  ffe: { bg: "rgba(34, 197, 160, 0.12)", text: "#14B8A6", border: "rgba(34, 197, 160, 0.30)" }, // teal/emerald
  ose: { bg: "rgba(138, 90, 232, 0.12)", text: "#8B5CF6", border: "rgba(138, 90, 232, 0.30)" }, // violet
  gra: { bg: "rgba(244, 114, 182, 0.12)", text: "#EC4899", border: "rgba(244, 114, 182, 0.30)" }, // pink
  lin: { bg: "rgba(0, 158, 163, 0.12)", text: "#0D9488", border: "rgba(0, 158, 163, 0.30)" }, // teal
  eng: { bg: "rgba(251, 146, 60, 0.12)", text: "#F97316", border: "rgba(251, 146, 60, 0.30)" }, // orange
  spa: { bg: "rgba(0, 183, 239, 0.12)", text: "#06B6D4", border: "rgba(0, 183, 239, 0.30)" }, // cyan
  it: { bg: "rgba(93, 63, 215, 0.12)", text: "#7C3AED", border: "rgba(93, 63, 215, 0.30)" }, // indigo
  sec: { bg: "rgba(239, 68, 68, 0.12)", text: "#EF4444", border: "rgba(239, 68, 68, 0.30)" }, // red
} as const;

export type HvCategoryKey = keyof typeof HV_CATEGORY_COLORS;

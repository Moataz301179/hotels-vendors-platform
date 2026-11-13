/**
 * HOVIN dark field — matched to the travel-app reference:
 * deep charcoal page, elevated grey cards, electric-blue CTA, gold secondary.
 */
export const colors = {
  paper: "#16181d",
  paperRaised: "#1c1f26",
  card: "#23262f",
  chrome: "#12141a",
  chromeText: "#ffffff",
  ink: "#ffffff",
  muted: "#a0a3a6",
  line: "#2e323c",
  lineSoft: "#2a2e38",
  /** Electric blue — primary CTA / active. */
  blue: "#6fa8ef",
  blueStrong: "#5a8dee",
  blueBright: "#8eb5f7",
  ice: "#9dc3e6",
  iceWash: "#1e2a3d",
  /** Gold — secondary accent (ratings, market prices, promo badges). */
  yellow: "#f5b820",
  yellowSoft: "#3a3018",
  green: "#3f9a63",
  amber: "#f5b820",
  amberSoft: "#3a3018",
  danger: "#e0705c",
  dangerSoft: "#2a1816",
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/** Geometric sans hierarchy — SF / Inter-like proportions on the system face. */
export const type = {
  hero: { fontSize: 30, lineHeight: 36, fontWeight: "700" as const, letterSpacing: -0.5 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "700" as const, letterSpacing: -0.3 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: "600" as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400" as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "600" as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "600" as const, letterSpacing: 0.3 },
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  pill: 999,
} as const;

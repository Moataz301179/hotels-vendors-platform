/**
 * Owner tokens:
 * - Main field `#262A32` with white type
 * - Accent / pill fill `#5B92FE` with black type
 */
export const colors = {
  paper: "#262A32",
  paperRaised: "#2E333C",
  card: "#303541",
  chrome: "#262A32",
  chromeText: "#ffffff",
  ink: "#ffffff",
  muted: "#a8adb6",
  line: "#3a404b",
  lineSoft: "#343a45",
  /** Accent and pill / panel fill — black type on this fill. */
  blue: "#5B92FE",
  blueStrong: "#5B92FE",
  blueBright: "#5B92FE",
  onBlue: "#000000",
  ice: "#5B92FE",
  iceWash: "#1e2f4d",
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

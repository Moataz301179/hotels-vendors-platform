/**
 * Owner tokens:
 * - Main field `#626262` with white type
 * - Accent / pill fill `#5B92FE` with black type
 */
export const colors = {
  paper: "#626262",
  paperRaised: "#6e6e6e",
  card: "#555555",
  chrome: "#626262",
  chromeText: "#ffffff",
  ink: "#ffffff",
  muted: "#d0d0d0",
  line: "#7a7a7a",
  lineSoft: "#707070",
  /** Accent and pill / panel fill — black type on this fill. */
  blue: "#5B92FE",
  blueStrong: "#5B92FE",
  blueBright: "#5B92FE",
  onBlue: "#000000",
  ice: "#5B92FE",
  iceWash: "#555555",
  yellow: "#f5b820",
  yellowSoft: "#4a4018",
  green: "#3f9a63",
  amber: "#f5b820",
  amberSoft: "#4a4018",
  danger: "#e0705c",
  dangerSoft: "#5a2a24",
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

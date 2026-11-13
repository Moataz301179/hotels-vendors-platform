export const colors = {
  /** Page field — white, not charcoal. */
  paper: "#ffffff",
  /** Soft grey wells and notices. */
  paperRaised: "#f4f4f4",
  /** Content cards. */
  card: "#ffffff",
  /** Header / charcoal — same dark blue as the HOVIN chrome. */
  chrome: "#0f1419",
  chromeText: "#ffffff",
  /** Primary type. */
  ink: "#0f1419",
  muted: "#6b7280",
  line: "#e5e7eb",
  lineSoft: "#f0f1f3",
  /** Primary accent. */
  blue: "#9dc3e6",
  blueStrong: "#6fa8d6",
  ice: "#9dc3e6",
  iceWash: "#e8f3fb",
  /** Secondary accent. */
  yellow: "#e8c547",
  yellowSoft: "#fbf6e0",
  green: "#2f7d4f",
  amber: "#e8c547",
  amberSoft: "#fbf6e0",
  danger: "#b0432f",
  dangerSoft: "#f8ebe7",
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const type = {
  hero: { fontSize: 32, lineHeight: 38, fontWeight: "700" as const, letterSpacing: -0.6 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "700" as const, letterSpacing: -0.3 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: "600" as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: "400" as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "600" as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "600" as const, letterSpacing: 0.4 },
} as const;

export const radius = { sm: 8, md: 12, lg: 16 } as const;

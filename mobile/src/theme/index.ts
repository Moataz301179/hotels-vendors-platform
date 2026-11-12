export const colors = {
  paper: "#f1f0e8",
  paperRaised: "#f7f7f0",
  card: "#ffffff",
  chrome: "#0f1419",
  chromeText: "#ffffff",
  ink: "#1a222b",
  muted: "#5f6b73",
  line: "#d7dbd9",
  lineSoft: "#e4e6df",
  blue: "#2f6fb0",
  blueStrong: "#245c96",
  ice: "#9dc3e6",
  iceWash: "#e3eef7",
  green: "#2f7d4f",
  amber: "#9a6a12",
  amberSoft: "#f5ecd9",
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

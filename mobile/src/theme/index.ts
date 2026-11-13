export const colors = {
  paper: "#0f1419",
  paperRaised: "#171d24",
  card: "#1a222b",
  chrome: "#0f1419",
  chromeText: "#ffffff",
  ink: "#ffffff",
  muted: "#9aa3aa",
  line: "#2c3640",
  lineSoft: "#243039",
  blue: "#9dc3e6",
  blueStrong: "#7eb0d9",
  ice: "#9dc3e6",
  iceWash: "#1e2f3d",
  yellow: "#e8c547",
  yellowSoft: "#2a2618",
  green: "#3f9a63",
  amber: "#e8c547",
  amberSoft: "#2a2618",
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
  hero: { fontSize: 32, lineHeight: 38, fontWeight: "700" as const, letterSpacing: -0.6 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "700" as const, letterSpacing: -0.3 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: "600" as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: "400" as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "600" as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "600" as const, letterSpacing: 0.4 },
} as const;

export const radius = { sm: 8, md: 12, lg: 16 } as const;

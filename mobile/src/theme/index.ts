import { Platform, type TextStyle, type ViewStyle } from "react-native";

/**
 * Color allocation (owner rules + travel-app reference sample):
 * - Page field `#303234` — soft charcoal only; fading into black is rejected
 * - Grey pans/fields with a fine thin outline frame
 * - When a screen has two pans, the other (secondary) pan is white fill
 * - `#5B92FE` for CTA fills only — regular (non-bold) black type on the fill
 * - Lime green secondary accent for special notifications only (minimal use)
 * - Blue is never used for text on grey, and never as a full content pan fill
 * - Yellow type / yellow backfill rejected
 * - Large widgets stay short — title / facts / action
 *
 * Typeface (HotelsVendors design system):
 * - Display: Manrope
 * - Body: Plus Jakarta Sans
 */
export const colors = {
  paper: "#303234",
  paperDeep: "#303234",
  paperMid: "#343638",
  paperRaised: "#3a3c3e",
  card: "#3a3c3e",
  /** Secondary pan fill when two pans share a screen. */
  cardWhite: "#ffffff",
  chrome: "#303234",
  chromeText: "#ffffff",
  ink: "#ffffff",
  inkOnWhite: "#1a1b1c",
  muted: "#c5c6c7",
  mutedOnWhite: "#5c5e60",
  line: "rgba(255,255,255,0.14)",
  lineSoft: "rgba(255,255,255,0.08)",
  lineOnWhite: "rgba(0,0,0,0.1)",
  /** Fine thin outline frame on pans (reference sample). */
  frame: "rgba(255,255,255,0.12)",
  frameOnWhite: "rgba(0,0,0,0.12)",
  blue: "#5B92FE",
  blueStrong: "#5B92FE",
  blueBright: "#5B92FE",
  onBlue: "#000000",
  ice: "#5B92FE",
  iceWash: "#3a3c3e",
  /** Secondary accent — special notifications only. */
  lime: "#C6F34D",
  onLime: "#000000",
  green: "#3f9a63",
  danger: "#e0705c",
  dangerSoft: "#5a2a24",
} as const;

/** Soft charcoal wash only — stays around `#303234`, never into black. */
export const paperFade = ["#343638", "#303234", "#2e3032", "#303234"] as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 32,
} as const;

export const fonts = {
  displayRegular: "Manrope_400Regular",
  displayMedium: "Manrope_500Medium",
  displaySemibold: "Manrope_600SemiBold",
  displayBold: "Manrope_700Bold",
  displayExtraBold: "Manrope_800ExtraBold",
  bodyRegular: "PlusJakartaSans_400Regular",
  bodyMedium: "PlusJakartaSans_500Medium",
  bodySemibold: "PlusJakartaSans_600SemiBold",
  bodyBold: "PlusJakartaSans_700Bold",
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
} as const;

export const type = {
  hero: {
    fontFamily: fonts.displayBold,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: Platform.OS === "web" ? ("700" as const) : undefined,
    letterSpacing: -0.6,
  },
  title: {
    fontFamily: fonts.displaySemibold,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: Platform.OS === "web" ? ("600" as const) : undefined,
    letterSpacing: -0.35,
  },
  headline: {
    fontFamily: fonts.displayMedium,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: Platform.OS === "web" ? ("500" as const) : undefined,
    letterSpacing: -0.15,
  },
  body: {
    fontFamily: fonts.bodyRegular,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
    letterSpacing: -0.05,
  },
  label: {
    fontFamily: fonts.bodyRegular,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: fonts.bodyRegular,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
    letterSpacing: 0.2,
  },
} as const satisfies Record<string, TextStyle>;

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  pill: 999,
} as const;

/** Primary pan — charcoal fill + fine thin outline frame. */
export const panStyle: ViewStyle = {
  backgroundColor: colors.card,
  borderRadius: radius.lg,
  padding: space.lg,
  borderWidth: 1,
  borderColor: colors.frame,
};

/** Secondary pan — white fill + fine thin outline (when two pans share a screen). */
export const panWhiteStyle: ViewStyle = {
  backgroundColor: colors.cardWhite,
  borderRadius: radius.lg,
  padding: space.lg,
  borderWidth: 1,
  borderColor: colors.frameOnWhite,
};

export const chipStyle: ViewStyle = {
  backgroundColor: colors.card,
  borderRadius: radius.pill,
  paddingHorizontal: space.md,
  paddingVertical: 10,
  borderWidth: 1,
  borderColor: colors.frame,
};

export const pillCtaStyle: ViewStyle = {
  minHeight: 52,
  borderRadius: radius.pill,
  paddingHorizontal: space.lg,
  borderWidth: 0,
};

/** Regular (non-bold) black type on light-blue CTA fills. */
export const onBlueType: TextStyle = {
  fontFamily: fonts.bodyRegular,
  fontSize: 16,
  lineHeight: 22,
  fontWeight: "400",
  letterSpacing: 0.05,
  color: colors.onBlue,
};

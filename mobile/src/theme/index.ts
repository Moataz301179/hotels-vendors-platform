import { Platform, type TextStyle, type ViewStyle } from "react-native";

/**
 * Color allocation (owner rules):
 * - Page field `#303234` — white type for primary copy
 * - `#5B92FE` — CTA / pan / pill fills only, with black type on the fill
 * - Blue is never used for text on grey
 *
 * Typeface (HotelsVendors design system / reference sample):
 * - Display: Manrope (SF Pro Display fallback on Apple)
 * - Body: Plus Jakarta Sans (SF Pro Text fallback on Apple)
 */
export const colors = {
  paper: "#303234",
  paperRaised: "#3a3c3e",
  card: "#3f4143",
  chrome: "#303234",
  chromeText: "#ffffff",
  ink: "#ffffff",
  muted: "#d8d9da",
  line: "#4a4c4e",
  lineSoft: "#444648",
  blue: "#5B92FE",
  blueStrong: "#5B92FE",
  blueBright: "#5B92FE",
  onBlue: "#000000",
  ice: "#5B92FE",
  iceWash: "#3a3c3e",
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
  /** @deprecated alias — prefer displaySemibold / bodyMedium */
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
} as const;

export const type = {
  hero: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: Platform.OS === "web" ? ("800" as const) : undefined,
    letterSpacing: -0.9,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: Platform.OS === "web" ? ("700" as const) : undefined,
    letterSpacing: -0.45,
  },
  headline: {
    fontFamily: fonts.displaySemibold,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: Platform.OS === "web" ? ("600" as const) : undefined,
    letterSpacing: -0.25,
  },
  body: {
    fontFamily: fonts.bodyRegular,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: Platform.OS === "web" ? ("400" as const) : undefined,
    letterSpacing: -0.05,
  },
  label: {
    fontFamily: fonts.bodySemibold,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: Platform.OS === "web" ? ("600" as const) : undefined,
    letterSpacing: -0.05,
  },
  caption: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: Platform.OS === "web" ? ("500" as const) : undefined,
    letterSpacing: 0.35,
  },
} as const satisfies Record<string, TextStyle>;

export const radius = {
  sm: 14,
  md: 20,
  lg: 28,
  pill: 999,
} as const;

const softShadow = Platform.select({
  ios: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.38,
    shadowRadius: 24,
  },
  android: { elevation: 12 },
  default: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.38,
    shadowRadius: 24,
  },
});

/** Soft floating pan — reference travel-app depth without harsh borders. */
export const panStyle: ViewStyle = {
  backgroundColor: colors.card,
  borderRadius: radius.lg,
  padding: space.lg,
  borderWidth: Platform.OS === "web" ? 0 : 0,
  ...softShadow,
};

export const chipStyle: ViewStyle = {
  backgroundColor: colors.card,
  borderRadius: radius.pill,
  paddingHorizontal: space.md,
  paddingVertical: 10,
  ...Platform.select({
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
    default: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 8,
    },
  }),
};

export const pillCtaStyle: ViewStyle = {
  minHeight: 54,
  borderRadius: radius.pill,
  paddingHorizontal: space.lg,
  ...Platform.select({
    ios: {
      shadowColor: colors.blue,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.42,
      shadowRadius: 14,
    },
    android: { elevation: 8 },
    default: {
      shadowColor: colors.blue,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.42,
      shadowRadius: 14,
    },
  }),
};

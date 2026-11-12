import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { SplashScreen, Stack } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { AccessibilityInfo, View } from "react-native";
import { LocaleProvider, useLocale } from "../src/i18n";
import { PhoneProvider } from "../src/session/usePhone";
import { ConfigSurface } from "../src/screens/surfaces";
import { colors } from "../src/theme";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
const visualReview = process.env.EXPO_PUBLIC_HOVIN_VISUAL_REVIEW === "1";

function Direction({ children }: { children: ReactNode }) {
  const { isRtl } = useLocale();
  return <View style={{ flex: 1, direction: isRtl ? "rtl" : "ltr" }}>{children}</View>;
}

function AppStack() {
  const { t } = useLocale();
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    void SplashScreen.hideAsync();
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => subscription.remove();
  }, []);
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.chrome },
        headerTintColor: colors.chromeText,
        headerTitleStyle: { color: colors.chromeText },
        contentStyle: { backgroundColor: colors.paper },
        animation: reduceMotion ? "fade" : "slide_from_right",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="(phone)" options={{ headerShown: false }} />
      <Stack.Screen name="review" options={{ headerShown: false, animation: "none" }} />
      <Stack.Screen name="catalog" options={{ title: t("catalog.title") }} />
      <Stack.Screen name="quotes" options={{ title: t("quotes.title") }} />
      <Stack.Screen name="orders" options={{ title: t("orders.title") }} />
      <Stack.Screen name="requests" options={{ title: t("work.requests") }} />
      <Stack.Screen name="order/[id]" options={{ title: t("tracking.referred") }} />
      <Stack.Screen name="receive/[orderId]" options={{ title: t("receive.title") }} />
      <Stack.Screen name="respond/[rfqId]" options={{ title: t("respond.title") }} />
      <Stack.Screen name="desk" options={{ title: t("desk.title"), headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const tree = (
    <LocaleProvider>
      <Direction>
        <AppStack />
      </Direction>
    </LocaleProvider>
  );
  if (visualReview) return tree;
  if (!publishableKey) {
    return (
      <LocaleProvider>
        <ConfigSurface />
      </LocaleProvider>
    );
  }
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache} __experimental_disableNativeClientSync>
      <PhoneProvider>{tree}</PhoneProvider>
    </ClerkProvider>
  );
}

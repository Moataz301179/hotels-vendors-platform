import { Redirect, Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { useLocale } from "../../src/i18n";
import { usePhoneContext } from "../../src/session/usePhone";
import { ScreenState } from "../../src/components/ui";
import { Wordmark } from "../../src/components/ui";
import { colors } from "../../src/theme";

export default function PhoneLayout() {
  const phone = usePhoneContext();
  const { t } = useLocale();
  const router = useRouter();
  useEffect(() => {
    if (phone.home?.plan.workspace === "desk") router.replace("/desk");
  }, [phone.home, router]);
  if (!phone.isLoaded) return <ScreenState title={t("state.loading")} />;
  if (!phone.isSignedIn) return <Redirect href="/sign-in" />;
  if (phone.phase === "config") return <ScreenState title={t("state.error")} action={t("action.retry")} onPress={() => void phone.refresh()} />;
  if (phone.phase === "loading" || !phone.home) {
    if (phone.phase === "offline") return <ScreenState title={t("state.offline")} action={t("action.retry")} onPress={() => void phone.refresh()} />;
    if (phone.phase === "error") return <ScreenState title={t("state.error")} action={t("action.retry")} onPress={() => void phone.refresh()} />;
    return <ScreenState title={t("state.loading")} />;
  }
  if (phone.home.plan.workspace === "desk") return <ScreenState title={t("state.loading")} />;
  const alerts = phone.home.plan.capabilities.includes("notifications");
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.chrome },
        headerTintColor: colors.chromeText,
        headerTitle: () => <Wordmark width={112} />,
        tabBarStyle: { backgroundColor: colors.chrome, borderTopColor: colors.lineSoft },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("nav.today") }} />
      <Tabs.Screen name="work" options={{ title: t("nav.work") }} />
      <Tabs.Screen name="alerts" options={{ title: t("nav.alerts"), href: alerts ? undefined : null }} />
      <Tabs.Screen name="account" options={{ title: t("nav.account") }} />
    </Tabs>
  );
}

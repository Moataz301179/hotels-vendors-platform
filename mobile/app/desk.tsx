import { Linking } from "react-native";
import { useRouter } from "expo-router";
import { useLocale } from "../src/i18n";
import { usePhoneContext } from "../src/session/usePhone";
import { DeskSurface } from "../src/screens/surfaces";
import { ScreenState } from "../src/components/ui";

export default function Desk() {
  const phone = usePhoneContext();
  const { t } = useLocale();
  const router = useRouter();
  if (phone.phase === "loading" || !phone.home) return <ScreenState title={t("state.loading")} />;
  if (phone.phase === "offline") return <ScreenState title={t("state.offline")} action={t("action.retry")} onPress={() => void phone.refresh()} />;
  if (phone.phase === "error") return <ScreenState title={t("state.error")} action={t("action.retry")} onPress={() => void phone.refresh()} />;
  const path = phone.home.plan.deskPath || "/";
  return (
    <DeskSurface
      deskPath={path}
      onOpen={() => void Linking.openURL(`https://www.hotelsvendors.com${path.startsWith("/") ? path : `/${path}`}`)}
      onSignOut={() => { void phone.signOut().then(() => router.replace("/sign-in")); }}
    />
  );
}

import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { ScreenState } from "../src/components/ui";
import { useLocale } from "../src/i18n";

const visualReview = process.env.EXPO_PUBLIC_HOVIN_VISUAL_REVIEW === "1";

export default function Index() {
  if (visualReview) return <Redirect href="/review" />;
  return <SignedGate />;
}

function SignedGate() {
  const { isLoaded, isSignedIn } = useAuth();
  const { t } = useLocale();
  if (!isLoaded) return <ScreenState title={t("state.loading")} />;
  if (!isSignedIn) return <Redirect href="/sign-in" />;
  return <Redirect href="/(phone)" />;
}

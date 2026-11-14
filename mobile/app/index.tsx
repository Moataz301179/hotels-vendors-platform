import { useAuth, useClerk } from "@clerk/expo";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScreenState } from "../src/components/ui";
import { useLocale } from "../src/i18n";

const visualReview = process.env.EXPO_PUBLIC_HOVIN_VISUAL_REVIEW === "1";
const AUTH_STARTUP_TIMEOUT_MS = 8_000;

export default function Index() {
  if (visualReview) return <Redirect href="/review" />;
  return <SignedGate />;
}

function SignedGate() {
  const { isLoaded, isSignedIn } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const clerk = useClerk();
  const [authStalled, setAuthStalled] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setAuthStalled(false);
      return;
    }
    // Clerk can stall on Expo Go or a weak connection. Never leave the
    // receiver on an indefinite spinner.
    const timer = setTimeout(() => setAuthStalled(true), AUTH_STARTUP_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  async function recoverSession() {
    const reload = (
      clerk as unknown as { __internal_reloadInitialResources?: () => Promise<void> }
    ).__internal_reloadInitialResources;
    if (typeof reload === "function") {
      try {
        await reload();
      } catch {
        // Fall through to the hosted sign-in surface.
      }
    }
    router.replace("/sign-in");
  }

  if (!isLoaded) {
    return authStalled ? (
      <ScreenState
        title={t("state.loading")}
        action={t("action.signIn")}
        onPress={() => void recoverSession()}
      />
    ) : (
      <ScreenState title={t("state.loading")} />
    );
  }
  if (!isSignedIn) return <Redirect href="/sign-in" />;
  return <Redirect href="/(phone)" />;
}

import { useHostedAuth } from "@clerk/expo/hosted-auth";
import { useRouter } from "expo-router";
import { useState } from "react";
import { SignInSurface } from "../src/screens/surfaces";

export default function SignIn() {
  const { startHostedAuth } = useHostedAuth();
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  return (
    <SignInSurface
      failed={failed}
      onSignIn={() => {
        setFailed(false);
        void startHostedAuth({ mode: "sign-in", authSessionOptions: { preferEphemeralSession: false } })
          .then((result) => {
            if (result.createdSessionId) router.replace("/");
            else setFailed(true);
          })
          .catch(() => setFailed(true));
      }}
    />
  );
}

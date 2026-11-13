import { useRouter } from "expo-router";
import { usePhoneContext } from "../../src/session/usePhone";
import { AccountSurface } from "../../src/screens/surfaces";

export default function Account() {
  const phone = usePhoneContext();
  const router = useRouter();
  if (!phone.home) return null;
  return (
    <AccountSurface
      account={phone.home.account}
      onSignOut={() => {
        void phone.signOut().then(() => router.replace("/sign-in"));
      }}
    />
  );
}

import { useRouter } from "expo-router";
import { usePhoneContext } from "../../src/session/usePhone";
import { WorkSurface } from "../../src/screens/surfaces";

export default function Work() {
  const phone = usePhoneContext();
  const router = useRouter();
  if (!phone.home) return null;
  return (
    <WorkSurface
      workspace={phone.home.plan.workspace}
      onOpen={(path) => {
        if (path === "requests") router.push("/requests");
        else router.push(`/${path}`);
      }}
    />
  );
}

import { useRouter } from "expo-router";
import { hrefForProposal, hrefForTask } from "../../src/navigation/openWork";
import { usePhoneContext } from "../../src/session/usePhone";
import { HomeSurface } from "../../src/screens/surfaces";

export default function Today() {
  const phone = usePhoneContext();
  const router = useRouter();
  if (!phone.home) return null;
  return (
    <HomeSurface
      home={phone.home}
      queued={phone.queued}
      refreshing={phone.refreshing}
      onRefresh={() => void phone.refresh()}
      onOpenProposal={(proposal) => {
        const href = hrefForProposal(proposal);
        if (href) router.push(href);
      }}
      onOpenTask={(task) => {
        const href = hrefForTask(task);
        if (href) router.push(href);
      }}
    />
  );
}

import { requireActorRole } from "@/lib/v2-auth";
import { DemandClient } from "@/components/v2/demand-client";
export default async function DemandPage() {
  await requireActorRole(["HOTEL", "ADMIN"]);
  return <DemandClient />;
}

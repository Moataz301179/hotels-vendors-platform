import { requireActorRole } from "@/lib/v2-auth";
import { ConnectionsCenter } from "@/components/v2/connections-center";

export default async function ConnectionsPage() {
  await requireActorRole(['HOTEL', 'ADMIN']);
  return <ConnectionsCenter />;
}

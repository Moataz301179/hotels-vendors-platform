import { requireActorRole } from "@/lib/v2-auth";
import { AdminCommandCenter } from "@/components/v2/admin-command-center";

export default async function AdminPage() {
  await requireActorRole(['ADMIN']);
  return <AdminCommandCenter />;
}

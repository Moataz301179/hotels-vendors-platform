import { requireActorRole } from "@/lib/v2-auth";
import { AdminClient } from "@/components/v2/admin-client";

export default async function AdminPage() {
  await requireActorRole(['ADMIN']);
  return <AdminClient />;
}

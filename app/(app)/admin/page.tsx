import { requireActorRole } from "@/lib/v2-auth";
import { SupplierReview } from "@/components/v2/supplier-review";
import { AdminClient } from "@/components/v2/admin-client";

export default async function AdminPage() {
  await requireActorRole(['ADMIN']);
  return <><AdminClient /><SupplierReview /></>;
}

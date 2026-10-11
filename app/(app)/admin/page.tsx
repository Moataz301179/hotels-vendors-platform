import { requireActorRole } from "@/lib/v2-auth";
import { SupplierReview } from "@/components/v2/supplier-review";
import { AdminClient } from "@/components/v2/admin-client";
import { AdminControls } from "@/components/v2/admin-controls";

export default async function AdminPage() {
  await requireActorRole(['ADMIN']);
  return <><AdminClient /><AdminControls /><SupplierReview /></>;
}

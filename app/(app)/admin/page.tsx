import { requireActorRole } from "@/lib/v2-auth";
import { SupplierReview } from "@/components/v2/supplier-review";
import { AdminClient } from "@/components/v2/admin-client";
import { AdminControls } from "@/components/v2/admin-controls";
import { PendingUserReview } from "@/components/v2/pending-user-review";
import { DirectorySourceGovernance } from "@/components/v2/directory-source-governance";
import { AdminOperationsOverview } from "@/components/v2/admin-operations-overview";
import { ReleaseIdentity } from "@/components/v2/release-identity";

export default async function AdminPage() {
  await requireActorRole(['ADMIN']);
  return <><ReleaseIdentity /><AdminOperationsOverview /><AdminClient /><section id="registration-review"><PendingUserReview /></section><AdminControls /><section id="directory-source-governance"><DirectorySourceGovernance /></section><section id="supplier-review"><SupplierReview /></section></>;
}

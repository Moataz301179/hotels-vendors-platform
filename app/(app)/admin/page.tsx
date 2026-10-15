import { requireActorRole } from "@/lib/v2-auth";
import { SupplierReview } from "@/components/v2/supplier-review";
import { AdminClient } from "@/components/v2/admin-client";
import { AdminControls } from "@/components/v2/admin-controls";
import { PendingUserReview } from "@/components/v2/pending-user-review";
import { CatalogDiscovery } from "@/components/v2/catalog-discovery";
import { CatalogPublicationReview } from "@/components/v2/catalog-publication-review";
import { RequirementMatching } from "@/components/v2/requirement-matching";

export default async function AdminPage() {
  await requireActorRole(['ADMIN']);
  return <><AdminClient /><PendingUserReview /><AdminControls /><CatalogDiscovery /><CatalogPublicationReview /><RequirementMatching /><SupplierReview /></>;
}

import { requireActorRole } from "@/lib/v2-auth";
import { SupplierReview } from "@/components/v2/supplier-review";
import { AdminClient } from "@/components/v2/admin-client";
import { AdminControls } from "@/components/v2/admin-controls";
import { PendingUserReview } from "@/components/v2/pending-user-review";
import { CatalogDiscovery } from "@/components/v2/catalog-discovery";
import { CatalogPublicationReview } from "@/components/v2/catalog-publication-review";
import { RequirementMatching } from "@/components/v2/requirement-matching";
import { DirectoryCandidateReview } from "@/components/v2/directory-candidate-review";
import { DirectorySourceGovernance } from "@/components/v2/directory-source-governance";
import { DirectoryOperations } from "@/components/v2/directory-operations";
import { AdminOperationsOverview } from "@/components/v2/admin-operations-overview";

export default async function AdminPage() {
  await requireActorRole(['ADMIN']);
  return <><AdminOperationsOverview /><AdminClient /><section id="registration-review"><PendingUserReview /></section><AdminControls /><section id="directory-operations"><DirectoryOperations /></section><section id="directory-source-governance"><DirectorySourceGovernance /></section><section id="directory-candidate-review"><DirectoryCandidateReview /></section><CatalogDiscovery /><section id="catalog-publication-review"><CatalogPublicationReview /></section><RequirementMatching /><SupplierReview /></>;
}

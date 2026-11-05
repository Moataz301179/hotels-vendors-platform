import { requireActorRole } from "@/lib/v2-auth";
import { FundingClient, type FundingRole } from "@/components/v2/funding-client";

export default async function FundingPage() {
  const actor = await requireActorRole(['HOTEL', 'SUPPLIER', 'FACTORING', 'ADMIN']);
  return <FundingClient role={actor.platformRole as FundingRole} />;
}

import { requireActorRole } from "@/lib/v2-auth";
import { FundingClient } from "@/components/v2/funding-client";

export default async function FundingPage() {
  await requireActorRole(['HOTEL', 'SUPPLIER', 'FACTORING', 'ADMIN']);
  return <FundingClient />;
}

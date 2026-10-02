import { requireActorRole } from "@/lib/v2-auth";
import { IntelligenceClient } from "@/components/v2/intelligence-client";

export default async function IntelligencePage() {
  await requireActorRole(['HOTEL', 'ADMIN']);
  return <IntelligenceClient />;
}

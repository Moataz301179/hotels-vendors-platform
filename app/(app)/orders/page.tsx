import { requireActorRole } from "@/lib/v2-auth";
import { OrdersClient } from "@/components/v2/orders-client";
import { parseOrderWorkspaceView } from "@/lib/procurement/order-workspace-view";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  await requireActorRole(['HOTEL', 'SUPPLIER', 'ADMIN']);
  const { view } = await searchParams;
  return <OrdersClient initialView={parseOrderWorkspaceView(view)} />;
}

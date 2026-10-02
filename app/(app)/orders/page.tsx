import { requireActorRole } from "@/lib/v2-auth";
import { OrdersClient } from "@/components/v2/orders-client";

export default async function OrdersPage() {
  await requireActorRole(['HOTEL', 'SUPPLIER', 'ADMIN']);
  return <OrdersClient />;
}

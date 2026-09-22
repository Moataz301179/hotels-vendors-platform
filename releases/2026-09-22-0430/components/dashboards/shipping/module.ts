
// SHIPPING DASHBOARD (G6 — logistics + delivery optimization)
import { deliveries, orders } from "@/db/schema";
import { db } from "@/db";

export interface ShippingDashboardData {
  deliveriesInTransit: number;
  onTimeRate: number;
  delayedDeliveries: number;
  fuelCostEstimate: number;
}

export async function loadShippingData(): Promise<ShippingDashboardData> {
  const delivs = await db.select().from(deliveries);
  const delivered = delivs.filter(d => d.status === "delivered");
  const onTime = delivered.filter(d => !d.delayed).length;
  return {
    deliveriesInTransit: delivs.filter(d => ["picked_up", "in_transit", "out_for_delivery"].includes(d.status)).length,
    onTimeRate: delivered.length ? Math.round((onTime / delivered.length) * 100) : 100,
    delayedDeliveries: delivered.filter(d => d.delayed).length,
    fuelCostEstimate: 0,
  };
}

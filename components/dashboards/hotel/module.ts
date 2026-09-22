
// HOTEL DASHBOARD (G6 — procurement portal + smart assistant)
import { orders, inventoryItems, products, suppliers } from "@/db/schema";
import { db } from "@/db";

export interface HotelDashboardData {
  openOrders: number;
  ordersInFulfillment: number;
  inventoryCritical: number;
  supplierCount: number;
  topSupplierId: string;
  monthlySpend: number;
}

export async function loadHotelData(): Promise<HotelDashboardData> {
  const openOrders = await db.select().from(orders).where({ approvalState: "pending" });
  const inFulfillment = await db.select().from(orders).where({ fulfillmentState: "preparing" });
  const criticalInv = await db.select().from(inventoryItems).where({ status: "critical" });
  const supplierList = await db.select().from(suppliers);
  return {
    openOrders: openOrders.length,
    ordersInFulfillment: inFulfillment.length,
    inventoryCritical: criticalInv.length,
    supplierCount: supplierList.length,
    topSupplierId: supplierList[0]?.name || "none",
    monthlySpend: 0,
  };
}

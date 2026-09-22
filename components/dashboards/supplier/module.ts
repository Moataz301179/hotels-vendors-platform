
// SUPPLIER DASHBOARD (G6 — supplier central + inventory forecast)
import { products, orders, contracts } from "@/db/schema";
import { db } from "@/db";

export interface SupplierDashboardData {
  productsListed: number;
  ordersReceived: number;
  revenueThisMonth: number;
  activeContracts: number;
  lowStockAlerts: number;
}

export async function loadSupplierData(supplierId: number): Promise<SupplierDashboardData> {
  const prods = await db.select().from(products);
  const ords = await db.select().from(orders);
  const conts = await db.select().from(contracts);
  return {
    productsListed: prods.length,
    ordersReceived: ords.length,
    revenueThisMonth: 0,
    activeContracts: conts.length,
    lowStockAlerts: 0,
  };
}

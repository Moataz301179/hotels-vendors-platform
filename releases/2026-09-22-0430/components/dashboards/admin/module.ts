
// ADMIN DASHBOARD (G6 — platform health + audit + fee tracking)
import { auditEntries, vendors, hotels, suppliers, orders } from "@/db/schema";
import { db } from "@/db";

export interface AdminDashboardData {
  totalOrders: number;
  totalVendors: number;
  auditEntryCount: number;
  feeRevenue: number;
  crossTenantFlags: number;
}

export async function loadAdminData(): Promise<AdminDashboardData> {
  const audits = await db.select().from(auditEntries);
  const allVendors = await db.select().from(vendors);
  const allOrders = await db.select().from(orders);
  return {
    totalOrders: allOrders.length,
    totalVendors: allVendors.length,
    auditEntryCount: audits.length,
    feeRevenue: 0,
    crossTenantFlags: 0,
  };
}

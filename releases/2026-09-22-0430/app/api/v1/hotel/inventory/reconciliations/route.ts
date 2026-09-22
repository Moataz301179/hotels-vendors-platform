import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, requirePermission } from "@/lib/api-utils";

/**
 * Hotel inventory reconciliations for the INVO InventoryBalanceScreen.
 *
 * GET /api/v1/hotel/inventory/reconciliations
 * Returns real InventoryReconciliation rows (with line items) for the tenant.
 * Honest empty array when none exist.
 */
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "inventory:read");

  const rows = await prisma.inventoryReconciliation.findMany({
    where: { tenantId: auth.tenantId },
    orderBy: { periodStart: "desc" },
    include: {
      lineItems: {
        orderBy: { createdAt: "asc" },
        include: { product: { select: { name: true, sku: true } } },
      },
    },
  });

  const list = rows.map((r) => ({
    id: r.id,
    period: r.period,
    periodStart: r.periodStart.toISOString(),
    periodEnd: r.periodEnd.toISOString(),
    status: r.status,
    lineItems: r.lineItems.map((l) => ({
      id: l.id,
      productName: l.product?.name ?? "",
      sku: l.product?.sku ?? "",
      beginningQuantity: l.beginningQuantity,
      endingQuantity: l.endingQuantity,
      receivedQuantity: l.receivedQuantity,
      consumedQuantity: l.consumedQuantity,
      wasteQuantity: l.wasteQuantity,
      varianceQuantity: l.varianceQuantity,
      varianceReason: l.varianceReason,
      unitCost: l.unitCost != null ? Number(l.unitCost) : 0,
      totalValue: l.totalValue != null ? Number(l.totalValue) : 0,
    })),
  }));

  return success({ reconciliations: list });
});
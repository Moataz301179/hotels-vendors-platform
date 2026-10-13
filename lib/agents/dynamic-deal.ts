/**
 * DynamicDeal — RFQ matching hook.
 *
 * This agent does not manufacture discounts, lead times or bids. It finds
 * real eligible supplier offers and leaves quote collection to the connected
 * supplier/API/email workers. Supplier identity is kept inside the worker
 * result and is never part of the hotel-facing RFQ response.
 */
import { prisma } from "@/lib/prisma";
import { AgentContext } from "./swarm-orchestrator";

export const DynamicDealAgent = {
  async execute(ctx: AgentContext) {
    const rfqId = typeof ctx.payload.rfqId === "string" ? ctx.payload.rfqId : "";
    if (!rfqId) return { success: false, output: "Missing rfqId" };

    const rfq = await prisma.rfqRequest.findFirst({
      where: { id: rfqId, tenantId: ctx.tenantId, deletedAt: null },
      select: { productId: true, catalogItemId: true, requestedQty: true },
    });
    if (!rfq) return { success: false, output: "RFQ not found" };

    const seedProduct = rfq.productId
      ? await prisma.product.findFirst({
        where: {
          id: rfq.productId,
          status: "ACTIVE",
          source: { not: "FIXTURE" },
          deletedAt: null,
          supplier: { is: { status: "ACTIVE", isVerified: true, deletedAt: null } },
        },
        select: { category: true },
      })
      : null;

    const publicCatalogTenantId = process.env.PUBLIC_CATALOG_TENANT_ID?.trim();
    const catalogItem = !seedProduct && rfq.catalogItemId && publicCatalogTenantId
      ? await prisma.catalogItem.findFirst({
        where: { id: rfq.catalogItemId, tenantId: publicCatalogTenantId, deletedAt: null, status: { in: ["PENDING_REVIEW", "ACTIVE"] } },
        select: { category: true },
      })
      : null;

    const category = seedProduct?.category ?? mapCatalogCategory(catalogItem?.category);
    const candidates = await prisma.product.findMany({
      where: {
        ...(category ? { category } : {}),
        status: "ACTIVE",
        source: { not: "FIXTURE" },
        deletedAt: null,
        stockQuantity: { gte: rfq.requestedQty },
        supplier: { is: { status: "ACTIVE", isVerified: true, deletedAt: null } },
      },
      select: { id: true, supplierId: true },
      take: 25,
      orderBy: { createdAt: "desc" },
    });

    const matchingStatus = candidates.length > 0 ? "MATCHING_SOURCES" : "AWAITING_SOURCE_MATCH";
    await prisma.rfqRequest.updateMany({
      where: { id: rfqId, tenantId: ctx.tenantId, deletedAt: null },
      data: { matchingStatus },
    });

    // The returned shape is deliberately quote-free. A count proves that the
    // matching hook ran without leaking supplier IDs or inventing terms.
    return {
      success: true,
      output: {
        rfqId,
        status: matchingStatus,
        candidateCount: candidates.length,
        quotes: [],
        requestedQty: rfq.requestedQty,
      },
    };
  },
};

function mapCatalogCategory(category: string | undefined) {
  const value = (category || "").toLowerCase();
  if (value.includes("food") || value.includes("beverage")) return "F_AND_B" as const;
  if (value.includes("housekeeping") || value.includes("cleaning") || value.includes("linen") || value.includes("textile")) return "CONSUMABLES" as const;
  if (value.includes("guest") || value.includes("amenit")) return "GUEST_SUPPLIES" as const;
  if (value.includes("furniture") || value.includes("ff&e")) return "FFE" as const;
  if (value) return "SERVICES" as const;
  return undefined;
}

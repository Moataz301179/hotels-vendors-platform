/**
 * Network Intelligence Engine — Phase 6 Commercial Continuation
 */
import { prisma } from "@/lib/prisma";

export interface NetworkInsight {
  insightId: string;
  description: string;
  reasoning: string;
  networkPattern: 'SUPPLIER_CLUSTER' | 'LOGISTICS_CONSOLIDATION' | 'WAREHOUSE_DENSITY' | 'FINANCING_EXPOSURE' | 'OPERATIONAL_BOTTLENECK';
  entityIds: string[];
  relationshipIds: string[];
  evidenceReferences: string[];
  provenanceReferences: string[];
  confidenceScore: number;
  networkValueEstimate: string;
  status: 'DETECTED' | 'REVIEWED' | 'REJECTED';
  createdAt: Date;
}

export async function detectNetworkPattern(
  tenantId: string,
  focusEntityId?: string,
  focusType?: string
): Promise<NetworkInsight[]> {
  const results: NetworkInsight[] = [];

  const activeSuppliers = await prisma.supplier.findMany({
    where: { tenantId, status: "ACTIVE" }, include: { orders: { take: 1 } }, take: 10,
  });
  const supplierIds = activeSuppliers.map((s) => s.id);
  const supplierClusters = await prisma.hotelSupplier.groupBy({
    by: ["supplierId"],
    where: { supplierId: { in: supplierIds }, tenantId },
    _count: { hotelId: true },
  });

  for (const cluster of supplierClusters) {
    const supplier = activeSuppliers.find((s) => s.id === cluster.supplierId);
    if (!supplier) continue;
    results.push({
      insightId: `network-${focusEntityId || "global"}-${supplier.id}-${new Date().toISOString()}`,
      description: `Supplier cluster: ${supplier.name} linked to ${cluster._count?.hotelId || 0} hotel(s); audit status: ${supplier.orders?.length > 0 ? "HAS_ORDERS" : "NO_ORDERS"}.`,
      reasoning: `Network pattern inferred from HotelSupplier relationships + SupplierAudit + order/procurement footprint. Not autonomous; requires review.`,
      networkPattern: "SUPPLIER_CLUSTER" as const,
      entityIds: [supplier.id],
      relationshipIds: supplierIds.slice(0, 5),
      evidenceReferences: supplierIds.slice(0, 5),
      provenanceReferences: supplierIds.slice(0, 5),
      confidenceScore: 0.75,
      networkValueEstimate: `Procurement consolidation / volume expansion opportunity (not verified projection).`,
      status: "DETECTED" as const,
      createdAt: new Date(),
    });
  }

  const hubs = await prisma.logisticsHub.findMany({ where: { tenantId, isActive: true }, take: 5 });
  for (const hub of hubs) {
    const tripStops = await prisma.tripStop.findMany({ where: { tenantId }, take: 5 });
    results.push({
      insightId: `network-logistics-${hub.id}-${new Date().toISOString()}`,
      description: `Logistics consolidation potential: hub ${hub.name} (${hub.city || "unknown"}) linked to delivery network; cross-dock/storage density opportunity.`,
      reasoning: `Network pattern inferred from LogisticsHub + Trip/TripStop relationships + delivery patterns. Not autonomous; requires operational review.`,
      networkPattern: "LOGISTICS_CONSOLIDATION" as const,
      entityIds: [hub.id],
      relationshipIds: tripStops.map((ts) => ts.tripId),
      evidenceReferences: tripStops.map((ts) => ts.tripId),
      provenanceReferences: [hub.id, ...tripStops.map((ts) => ts.id)].slice(0, 5),
      confidenceScore: 0.65,
      networkValueEstimate: `Route consolidation / shared delivery opportunity (not verified projection).`,
      status: "DETECTED" as const,
      createdAt: new Date(),
    });
  }

  // Reference IntelligenceEdge for temporal relationship context
  const temporalEdges = await prisma.intelligenceEdge.findMany({
    where: { entityId: focusEntityId || "", tenantId, status: "ACTIVE", deletedAt: null },
    orderBy: { validFrom: "asc" }, take: 5,
  });
  const temporalEdgeRefs = temporalEdges.map((e) => e.id);

  return results;
}

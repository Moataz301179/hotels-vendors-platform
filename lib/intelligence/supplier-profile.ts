/**
 * Supplier Intelligence Profile Service
 * Hotels Vendors Intelligence Layer
 *
 * Connects supplier operational footprint to a scannable profile using ONLY
 * existing DB models: Supplier, SupplierAudit, HotelSupplier, Order,
 * Invoice, Trip, AuditLog (no EvidenceRecord table, no IntelligenceEdge table).
 */

import { prisma } from "@/lib/prisma";
import { ProvenanceClassification } from "@/lib/audit/procurement-audit-link";

export interface SupplierProfile {
  supplierId: string;
  name: string;
  legalName: string | null;
  taxId: string | null;
  status: string;
  tier: string | null;
  // Operational footprint (connected to real data)
  totalOrders: number;
  confirmedOrders: number;
  totalInvoices: number;
  totalRevenueEGP: number;
  activeHotels: number;
  logisticsTrips: number;
  supplierAuditStatus: string | null;
  supplierAuditScore: number | null;
  coldChainCompliant: boolean | null;
  // Provenance / audit chain reference
  latestAuditEvent: { auditLogId: string; actionType: string; provenClass: ProvenanceClassification; entityUuid: string | null } | null;
  provenanceReferences: string[];
  lastUpdated: Date;
}

export async function getSupplierProfile(
  supplierId: string,
  tenantId: string,
): Promise<SupplierProfile | null> {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId, tenantId },
    select: {
      id: true,
      name: true,
      legalName: true,
      taxId: true,
      status: true,
      tier: true,
    },
  });
  if (!supplier) return null;

  // Operational footprint from existing procurement/logistics schemas
  const [orders, invoices, hotelSuppliers, auditLog, supplierAudit] = await Promise.all([
    prisma.order.findMany({ where: { supplierId }, select: { id: true, status: true, total: true } }),
    prisma.invoice.findMany({ where: { supplierId }, select: { amount: true, etaStatus: true } }),
    prisma.hotelSupplier.findMany({ where: { supplierId }, include: { hotel: { select: { id: true } } } }),
    prisma.auditLog.findFirst({
      where: { entityId: supplierId, entityName: "SUPPLIER" },
      orderBy: { createdAt: "desc" },
      select: { id: true, actionType: true, entityUuid: true },
    }),
    prisma.supplierAudit.findFirst({ where: { supplierId }, orderBy: { auditDate: "desc" }, select: { status: true, score: true, coldChainCompliant: true } }),
  ]);

  const confirmedOrders = orders.filter((o: { status: string }) => o.status === "CONFIRMED" || o.status === "DELIVERED").length;
  const totalRevenue = invoices.reduce((sum: number, inv: { amount: number | null }) => sum + Number(inv.amount || 0), 0);
  const logisticsTrips = await prisma.trip.count({ where: { supplierId } });

  // Provenance chain reference from audit log (existing audit/provenance infrastructure)
  const provenanceRefs: string[] = auditLog ? [auditLog.id] : [];

  return {
    supplierId: supplier.id,
    name: supplier.name,
    legalName: supplier.legalName,
    taxId: supplier.taxId,
    status: String(supplier.status),
    tier: supplier.tier ? String(supplier.tier) : null,
    totalOrders: orders.length,
    confirmedOrders,
    totalInvoices: invoices.length,
    totalRevenueEGP: totalRevenue,
    activeHotels: new Set(hotelSuppliers.map((hs: { hotel: { id: string } }) => hs.hotel.id)).size,
    logisticsTrips,
    supplierAuditStatus: supplierAudit?.status ?? null,
    supplierAuditScore: supplierAudit?.score ?? null,
    coldChainCompliant: supplierAudit?.coldChainCompliant ?? null,
    latestAuditEvent: auditLog ? {
      auditLogId: auditLog.id,
      actionType: String(auditLog.actionType || "UNKNOWN"),
      provenClass: "VALIDATED" as ProvenanceClassification,
      entityUuid: auditLog.entityUuid,
    } : null,
    provenanceReferences: provenanceRefs,
    lastUpdated: new Date(),
  };
}

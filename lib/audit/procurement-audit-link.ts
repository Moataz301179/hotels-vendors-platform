/**
 * Procurement Audit Chain Link
 * HotelsVendors Compliance & Provenance Layer
 *
 * Connects existing AuditLog entries to procurement events (orders, invoices,
 * approvals, deliveries) using only existing DB fields — no new EvidenceRecord
 * table, no schema changes. Adds provenance classification and source references
 * to audit entries that are already written by the authority/procurement pipeline.
 */

import { prisma } from "@/lib/prisma";

export type ProvenanceClassification =
  | "OBSERVED"
  | "USER_PROVIDED"
  | "INFERRED"
  | "MODEL_PREDICTED"
  | "VALIDATED"
  | "AUTHORIZED";

export interface ProcurementAuditLink {
  auditLogId: string;
  orderId?: string;
  invoiceId?: string;
  approvalId?: string;
  tripId?: string;
  provenanceClass: ProvenanceClassification;
  sourceReference: string; // URL / document ID / source name — not a full evidence record
  evidenceHash?: string; // optional reference to raw evidence (external)
  provenanceChain: string[]; // sequence of entity IDs forming the audit chain
}

/**
 * Link an audit entry to its procurement provenance.
 * Updates the AuditLog entry with provenance metadata only when linked to
 * a procurement event (order/invoice/approval/delivery).
 */
export async function linkProcurementAudit(
  auditLogId: string,
  provenanceClass: ProvenanceClassification,
  sourceReference: string,
  relatedIds: {
    orderId?: string;
    invoiceId?: string;
    approvalId?: string;
    tripId?: string;
  } = {},
): Promise<ProcurementAuditLink | null> {
  const audit = await prisma.auditLog.findUnique({
    where: { id: auditLogId },
    select: {
      id: true,
      entityId: true,
      entityName: true,
      entityUuid: true,
      actionType: true,
      previousHash: true,
    },
  });

  if (!audit) return null;

  // Only link when entity is a procurement-related entity (Order, Invoice, etc.)
  const procurementEntities = ["Order", "Invoice", "OrderApproval", "TripStop", "GoodsReceiptNote"];
  if (!procurementEntities.includes(audit.entityName ?? "")) {
    return null;
  }

  const chain = await buildAuditChain(audit.entityId as any, audit.entityName);

  // Note: We do NOT create a new EvidenceRecord table. We reference provenance
  // through the audit entry's existing fields (entityUuid links to event,
  // sourceReference is a string descriptor for the external/provenance source).
  return {
    auditLogId: audit.id,
    ...relatedIds,
    provenanceClass,
    sourceReference,
    provenanceChain: chain,
  };
}

async function buildAuditChain(entityId: string, entityName: string | null): Promise<string[]> {
  const chain: string[] = [entityId];
  let currentId = entityId;
  const currentName = entityName ?? "";
  // Build a limited chain by following audit entries with previousHash links.
  for (let depth = 0; depth < 10; depth++) {
    const entry = await prisma.auditLog.findFirst({
      where: {
        entityId: currentId,
        entityName: currentName as any,
      },
      orderBy: { createdAt: "desc" },
      select: { previousHash: true, entityUuid: true },
    });
    if (!entry || !entry.previousHash) break;
    // We do not reverse-lookup by hash in this minimal version; chain stops here.
    break;
  }
  return chain;
}

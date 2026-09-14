import { prisma } from "@/lib/prisma";

export const OLIV_ACTIVE_STATUSES = ["APPROVED", "DISBURSED", "SETTLED"] as const;
export const OLIV_INACTIVE_STATUSES = ["REJECTED", "DEFAULTED"] as const;

export function deriveOlivStatusFromPayoutStatus(payoutStatus: string): string | null {
  if (OLIV_ACTIVE_STATUSES.includes(payoutStatus as (typeof OLIV_ACTIVE_STATUSES)[number])) {
    return "ACTIVE";
  }

  if (OLIV_INACTIVE_STATUSES.includes(payoutStatus as (typeof OLIV_INACTIVE_STATUSES)[number])) {
    return payoutStatus;
  }

  return null;
}

export function deriveOlivStatusFromFacilityEvent(eventType: string): string | null {
  switch (eventType) {
    case "credit_facility.approved":
    case "credit_facility.updated":
      return "ACTIVE";
    case "credit_facility.suspended":
      return "SUSPENDED";
    default:
      return null;
  }
}

interface SyncOlivStatusParams {
  supplierId?: string;
  supplierTaxId?: string;
  status: string;
  source: string;
  syncedAt?: Date;
  olivUserId?: string;
}

export async function syncOlivSupplierStatus({
  supplierId,
  supplierTaxId,
  status,
  source,
  syncedAt = new Date(),
  olivUserId,
}: SyncOlivStatusParams): Promise<{ supplierId: string; tenantId: string } | null> {
  const supplier = supplierId
    ? await prisma.supplier.findUnique({
        where: { id: supplierId },
        select: { id: true, tenantId: true, taxId: true },
      })
    : supplierTaxId
      ? await prisma.supplier.findUnique({
          where: { taxId: supplierTaxId },
          select: { id: true, tenantId: true, taxId: true },
        })
      : null;

  if (!supplier) {
    return null;
  }

  const supplierUpdate: {
    olivStatus: string;
    olivSyncAt: Date;
    olivUserId?: string;
  } = {
    olivStatus: status,
    olivSyncAt: syncedAt,
  };

  if (olivUserId) {
    supplierUpdate.olivUserId = olivUserId;
  }

  const auditUpdate: {
    olivStatus: string;
    olivAcknowledgedAt: Date;
    olivAcknowledgedVia: string;
    olivCreditApprovedAt?: Date;
    olivUserId?: string;
  } = {
    olivStatus: status,
    olivAcknowledgedAt: syncedAt,
    olivAcknowledgedVia: source,
  };

  if (status === "ACTIVE") {
    auditUpdate.olivCreditApprovedAt = syncedAt;
  }

  if (olivUserId) {
    auditUpdate.olivUserId = olivUserId;
  }

  await prisma.$transaction([
    prisma.supplier.update({
      where: { id: supplier.id },
      data: supplierUpdate,
    }),
    prisma.olivOnboardingAudit.updateMany({
      where: {
        tenantId: supplier.tenantId,
        supplierTaxId: supplier.taxId,
      },
      data: auditUpdate,
    }),
  ]);

  return {
    supplierId: supplier.id,
    tenantId: supplier.tenantId,
  };
}

import { prisma } from "@/lib/prisma";
import type { SupplierTier } from "@prisma/client";

export interface SupplierStatusUpdateResult {
  success: boolean;
  supplier?: { id: string; name: string; status: string; tier: SupplierTier };
  tenantId?: string;
  error?: string;
}

/**
 * Atomically update supplier status with row locking.
 * Prevents race conditions on concurrent approve/reject requests.
 */
export async function atomicSupplierStatusUpdate(
  supplierId: string,
  newStatus: "ACTIVE" | "REJECTED",
  tier: string | undefined,
  actorId: string,
  tenantId: string
): Promise<SupplierStatusUpdateResult> {
  const result = await prisma.$transaction(async (tx) => {
    // Lock the row to prevent concurrent status mutations
    const supplier = await tx.$queryRaw<Array<{ id: string; name: string; status: string; tier: string; tenantId: string }>>`
      SELECT "id", "name", "status", "tier", "tenantId"
      FROM "Supplier"
      WHERE "id" = ${supplierId}
      FOR UPDATE
    `;

    if (supplier.length === 0) {
      return { success: false, error: "Supplier not found" as const };
    }

    if (supplier[0].status !== "PENDING") {
      return { success: false, error: `Supplier is already ${supplier[0].status}` as const };
    }

    const updated = await tx.supplier.update({
      where: { id: supplierId },
      data: {
        status: newStatus,
        ...(tier && newStatus === "ACTIVE" ? { tier: tier as SupplierTier } : {}),
      },
      select: { id: true, name: true, status: true, tier: true },
    });

    await tx.auditLog.create({
      data: {
        actionType: "UPDATE",
        entityName: "SUPPLIER",
        entityId: supplierId,
        actorId,
        tenantId: tenantId,
        changes: JSON.stringify({ status: newStatus, tier }),
      },
    });

    return { success: true as const, supplier: updated, tenantId: supplier[0].tenantId };
  });

  return result as SupplierStatusUpdateResult;
}

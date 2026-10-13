import type { Prisma } from "@prisma/client";
import type { AuthContext } from "@/lib/api-utils";
import { ApiError } from "@/lib/api-utils";

/**
 * Server-side ownership invariant for catalogue automation.
 * A client may never choose a supplier tenant or publish a cross-tenant SKU.
 */
export async function requireSupplierOwnership(
  db: Prisma.TransactionClient | { supplier: { findFirst: (args: unknown) => Promise<unknown> } },
  ctx: AuthContext,
  supplierId: string,
) {
  const supplier = await db.supplier.findFirst({
    where: { id: supplierId, tenantId: ctx.tenantId, deletedAt: null },
    select: { id: true, tenantId: true, isVerified: true, status: true },
  }) as { id: string; tenantId: string; isVerified: boolean; status: string } | null;
  if (!supplier) throw new ApiError("Supplier ownership could not be verified", 403);
  return supplier;
}

export function requirePublishedSupplier(supplier: { isVerified: boolean; status: string }) {
  if (!supplier.isVerified || supplier.status !== "ACTIVE") {
    throw new ApiError("Supplier must be active and verified before publication", 409);
  }
}

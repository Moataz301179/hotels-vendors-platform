import { prisma } from "@/lib/prisma";

type FinancialActor = {
  tenantId: string;
  platformRole: "HOTEL" | "SUPPLIER" | "ADMIN" | string;
  supplierId?: string | null;
};

export class FinancialAccessDeniedError extends Error {
  constructor(public readonly code: "TAX_ID_VERIFICATION_REQUIRED" | "HOTEL_TAX_ID_VERIFICATION_REQUIRED" | "SUPPLIER_TAX_ID_VERIFICATION_REQUIRED") {
    super(code);
  }
}

/**
 * The database tenant is the financial authority boundary. Clerk establishes
 * identity only; it is never used as the source of role, tax, or approval
 * authority.
 */
export async function requireFinancialAccess(actor: FinancialActor) {
  const tenant = await prisma.tenant.findFirst({
    where: {
      id: actor.tenantId,
      status: "ACTIVE",
      verificationStatus: "VERIFIED",
      taxId: { not: null },
      deletedAt: null,
    },
    select: { id: true },
  });
  if (!tenant) throw new FinancialAccessDeniedError("TAX_ID_VERIFICATION_REQUIRED");

  if (actor.platformRole === "HOTEL") {
    const hotel = await prisma.hotel.findFirst({
      where: { tenantId: actor.tenantId, status: "ACTIVE", taxId: { not: "" }, deletedAt: null },
      select: { id: true },
    });
    if (!hotel) throw new FinancialAccessDeniedError("HOTEL_TAX_ID_VERIFICATION_REQUIRED");
  }

  if (actor.platformRole === "SUPPLIER") {
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: actor.supplierId || undefined,
        tenantId: actor.tenantId,
        status: "ACTIVE",
        isVerified: true,
        taxId: { not: "" },
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!supplier) throw new FinancialAccessDeniedError("SUPPLIER_TAX_ID_VERIFICATION_REQUIRED");
  }
}

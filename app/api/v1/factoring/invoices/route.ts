import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, requirePermission } from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "invoice:read");

  const where: Record<string, unknown> = {
    tenantId: auth.tenantId,
    factoringStatus: { in: ["NOT_FACTORABLE", "AVAILABLE", "OFFERED"] },
    etaStatus: { in: ["ACCEPTED", "VALIDATED"] },
  };

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      hotel: { select: { id: true, name: true, riskTier: true } },
      supplier: { select: { id: true, name: true } },
      order: { select: { id: true, orderNumber: true } },
    },
  });

  return success({ invoices });
});

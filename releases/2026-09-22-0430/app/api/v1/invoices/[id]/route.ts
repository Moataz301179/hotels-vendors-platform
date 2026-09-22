import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error, requirePermission } from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest, { params }: { params?: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "invoice:read");
  const resolved = await params;
  if (!resolved) return error("Missing parameter", 400);
  const { id } = resolved;

  const record = await prisma.invoice.findUnique({ where: { id }, select: { tenantId: true } });
  if (!record || record.tenantId !== auth.tenantId) return error("Not found", 404);

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      hotel: { select: { id: true, name: true, taxId: true } },
      supplier: { select: { id: true, name: true, taxId: true } },
      order: { include: { items: { include: { product: { select: { id: true, name: true, sku: true } } } } } },
      factoringCompany: true,
      payments: true,
    },
  });

  return success({ invoice });
});

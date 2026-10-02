import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error, audit, requirePermission } from "@/lib/api-utils";
import { z } from "zod";

const SyncSchema = z.object({
  products: z.array(
    z.object({
      productId: z.string().cuid(),
      stockQuantity: z.number().int().min(0),
      unitPrice: z.number().positive().optional(),
    })
  ),
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);

  await requirePermission(auth, "product:create");

  const body = await request.json();
  const data = SyncSchema.parse(body);

  const products = await prisma.product.findMany({
    where: { id: { in: data.products.map((p) => p.productId) } },
    select: { id: true, tenantId: true },
  });
  if (products.length !== data.products.length || products.some((p) => p.tenantId !== auth.tenantId)) {
    return error("Not found", 404);
  }

  const updates = await prisma.$transaction(
    data.products.map((p) =>
      prisma.product.update({
        where: { id: p.productId },
        data: {
          stockQuantity: p.stockQuantity,
          ...(p.unitPrice ? { unitPrice: p.unitPrice } : {}),
        },
      })
    )
  );

  await audit({
    entityType: "PRODUCT",
    entityId: "batch",
    action: "INVENTORY_SYNC",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    afterState: { updatedCount: updates.length },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  return success({ updatedCount: updates.length, products: updates });
});

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error, audit, requirePermission } from "@/lib/api-utils";
import { z } from "zod";

const AiUploadSchema = z.object({
  products: z.array(
    z.object({
      sku: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      category: z.string().min(1),
      unitPrice: z.number().positive(),
      stockQuantity: z.number().int().min(0).default(0),
      unitOfMeasure: z.string().default("piece"),
    })
  ),
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);

  await requirePermission(auth, "product:create");

  const body = await request.json();
  const data = AiUploadSchema.parse(body);

  // Map category string to enum; default to CONSUMABLES if invalid
  const categoryMap: Record<string, string> = {
    F_AND_B: "F_AND_B",
    CONSUMABLES: "CONSUMABLES",
    GUEST_SUPPLIES: "GUEST_SUPPLIES",
    FFE: "FFE",
    SERVICES: "SERVICES",
  };

  const supplierId = auth.platformRole === "SUPPLIER" ? auth.tenantId : body.supplierId;
  if (!supplierId) {
    return error("Supplier ID required", 400);
  }

  const created = await prisma.$transaction(
    data.products.map((p) =>
      prisma.product.create({
        data: {
          tenantId: auth.tenantId,
          sku: p.sku,
          name: p.name,
          description: p.description,
          category: (categoryMap[p.category.toUpperCase().replace(/\s+/g, "_")] || "CONSUMABLES") as "F_AND_B" | "CONSUMABLES" | "GUEST_SUPPLIES" | "FFE" | "SERVICES",
          unitPrice: p.unitPrice,
          stockQuantity: p.stockQuantity,
          unitOfMeasure: p.unitOfMeasure,
          supplierId,
        },
      })
    )
  );

  await audit({
    entityType: "PRODUCT",
    entityId: "batch",
    action: "AI_UPLOAD",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    afterState: { createdCount: created.length },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  return success({ createdCount: created.length, products: created }, 201);
});

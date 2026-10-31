import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { PermissionDeniedError, requirePermission } from "@/lib/auth/rbac";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

const querySchema = z.object({
  supplierId: z.string().min(1).optional(),
  quantity: z.coerce.number().int().positive().max(1_000_000).default(1),
});

export async function GET(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, "price:compare");
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "PRICE_COMPARE_PERMISSION_REQUIRED" }, { status: 403 });
    throw error;
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    supplierId: url.searchParams.get("supplierId") ?? undefined,
    quantity: url.searchParams.get("quantity") ?? 1,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid quantity is required." }, { status: 400 });
  }

  const { supplierId, quantity } = parsed.data;

  const hotel = await prisma.hotel.findFirst({
    where: { tenantId: actor.tenantId, status: "ACTIVE", deletedAt: null },
    select: { id: true },
  });
  if (!hotel) return NextResponse.json({ error: "ACTIVE_HOTEL_REQUIRED" }, { status: 409 });

  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null, supplier: { status: "ACTIVE", deletedAt: null } },
    select: {
      id: true, supplierId: true, unitPrice: true, name: true,
      supplier: { select: { priceFeedConsentStatus: true, priceFeedConsentExpiresAt: true } },
    },
  });
  if (!product) return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404 });

  if (
    product.supplier.priceFeedConsentStatus !== "GRANTED" ||
    !product.supplier.priceFeedConsentExpiresAt ||
    product.supplier.priceFeedConsentExpiresAt <= new Date()
  ) {
    return NextResponse.json({ error: "SUPPLIER_PRICE_FEED_NOT_CONSENTED" }, { status: 409 });
  }

  const baseline = supplierId
    ? await prisma.contractRateBaseline.findFirst({
        where: { tenantId: actor.tenantId, hotelId: hotel.id, productId, supplierId, deletedAt: null },
        select: { id: true, unitPrice: true, supplierId: true, validFrom: true, validUntil: true },
      })
    : await prisma.contractRateBaseline.findFirst({
        where: { tenantId: actor.tenantId, hotelId: hotel.id, productId, deletedAt: null },
        select: { id: true, unitPrice: true, supplierId: true, validFrom: true, validUntil: true },
        orderBy: { createdAt: "desc" },
      });

  if (!baseline) return NextResponse.json({ error: "HISTORICAL_BASELINE_NOT_FOUND", message: "No contract baseline exists for this hotel and product." }, { status: 409 });

  const effectiveSupplierId = supplierId ?? baseline.supplierId;
  if (product.supplierId !== effectiveSupplierId) {
    return NextResponse.json({ error: "SUPPLIER_MISMATCH", message: "The connected supplier does not supply this product." }, { status: 409 });
  }

  const currentSupplierPrice = Number(product.unitPrice ?? 0);
  const historicalPrice = Number(baseline.unitPrice);
  const priceDifference = historicalPrice - currentSupplierPrice;
  const percentageChange = historicalPrice > 0 ? priceDifference / historicalPrice : null;

  const comparison = await prisma.connectedSupplierPriceComparison.create({
    data: {
      tenantId: actor.tenantId,
      hotelId: hotel.id,
      supplierId: effectiveSupplierId,
      productId: product.id,
      historicalPrice,
      currentSupplierPrice,
      quantity,
      comparisonBasis: "CONTRACT_BASELINE",
      sourceReference: baseline.id,
      priceDifference,
      percentageChange: percentageChange ?? undefined,
      status: "CALCULATED",
    },
  });

  await appendAuditEntry({
    entityName: "CONNECTED_SUPPLIER_PRICE_COMPARISON",
    entityId: comparison.id,
    actionType: "CREATED",
    tenantId: actor.tenantId,
    actorId: actor.id,
    actorRole: actor.platformRole,
    changes: { productId, supplierId: effectiveSupplierId, historicalPrice, currentSupplierPrice, priceDifference },
  });

  return NextResponse.json({ comparison });
}

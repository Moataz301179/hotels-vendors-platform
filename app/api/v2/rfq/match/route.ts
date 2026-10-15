import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { PermissionDeniedError, requirePermission } from "@/lib/auth/rbac";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { managedHotelTenant, managedHotelTenants } from "@/lib/admin/managed-hotel-tenants";
import { hasResolvedProductEvidence } from "@/lib/catalog/resolved-product-evidence";

const matchInput = z.object({ rfqId: z.string().min(1), productId: z.string().min(1), tenantId: z.string().min(1) });

async function requireProductIntelligenceOperator() {
  const actor = await getActor();
  if (!actor) return { error: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }) } as const;
  if (actor.platformRole !== "ADMIN") return { error: NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 }) } as const;
  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, "order:approve");
  } catch (error) {
    if (error instanceof PermissionDeniedError) return { error: NextResponse.json({ error: "ORDER_APPROVE_PERMISSION_REQUIRED" }, { status: 403 }) } as const;
    throw error;
  }
  return { actor } as const;
}

/** List unlisted requirements only for hotel organizations managed by this platform operator. */
export async function GET(request: Request) {
  const auth = await requireProductIntelligenceOperator();
  if ("error" in auth) return auth.error;
  const tenants = await managedHotelTenants(auth.actor.tenantId);
  if (!tenants) return NextResponse.json({ error: "PLATFORM_TENANT_REQUIRED" }, { status: 403 });
  const tenantId = new URL(request.url).searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ requirements: [], tenants });
  if (!tenants.some((tenant) => tenant.id === tenantId)) return NextResponse.json({ error: "HOTEL_TENANT_NOT_FOUND" }, { status: 404 });
  const requirements = await prisma.rfqRequest.findMany({
    where: { tenantId, productId: null, supplierId: null, matchingStatus: "QUEUED", deletedAt: null },
    select: { id: true, itemName: true, unitOfMeasure: true, packDescription: true, requestedQty: true, deliveryLocation: true, deliveryTimeline: true, specialReq: true, notes: true, createdAt: true },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return NextResponse.json({ requirements, tenants });
}

/**
 * Promote a queued free-text requirement only after a human Product Intelligence
 * operator selects an active, verified supplier product. The conditional update
 * prevents duplicate supplier disclosure if two operators act concurrently.
 */
export async function POST(request: Request) {
  const auth = await requireProductIntelligenceOperator();
  if ("error" in auth) return auth.error;
  const parsed = matchInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "RFQ_PRODUCT_AND_HOTEL_ORGANIZATION_REQUIRED" }, { status: 400 });
  const targetTenant = await managedHotelTenant(auth.actor.tenantId, parsed.data.tenantId);
  if (!targetTenant) return NextResponse.json({ error: "HOTEL_TENANT_NOT_FOUND" }, { status: 404 });
  const requirement = await prisma.rfqRequest.findFirst({
    where: { id: parsed.data.rfqId, tenantId: targetTenant.id, productId: null, supplierId: null, matchingStatus: "QUEUED", deletedAt: null },
    select: { id: true, itemName: true, unitOfMeasure: true },
  });
  if (!requirement) return NextResponse.json({ error: "QUEUED_REQUIREMENT_NOT_FOUND" }, { status: 404 });
  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, status: "ACTIVE", deletedAt: null, source: { not: "FIXTURE" }, supplier: { status: "ACTIVE", isVerified: true, deletedAt: null } },
    select: { id: true, name: true, sku: true, sourceKey: true, supplierId: true, supplier: { select: { tenantId: true } } },
  });
  if (!product) return NextResponse.json({ error: "VERIFIED_ACTIVE_PRODUCT_REQUIRED" }, { status: 409 });
  if (!await hasResolvedProductEvidence(prisma, product)) return NextResponse.json({ error: "RESOLVED_PRODUCT_EVIDENCE_REQUIRED" }, { status: 409 });
  const matched = await prisma.$transaction(async (tx) => {
    const update = await tx.rfqRequest.updateMany({
      where: { id: requirement.id, tenantId: targetTenant.id, productId: null, supplierId: null, matchingStatus: "QUEUED", deletedAt: null },
      data: { productId: product.id, catalogItemId: product.id, supplierId: product.supplierId, matchingStatus: "MATCHED" },
    });
    if (update.count !== 1) return false;
    await tx.rfqSupplierAccess.create({ data: { rfqId: requirement.id, supplierId: product.supplierId, hotelTenantId: targetTenant.id, supplierTenantId: product.supplier.tenantId, grantedById: auth.actor.id } });
    await appendAuditEntry({
      entityName: "RFQ",
      entityId: requirement.id,
      actionType: "UPDATED",
      tenantId: targetTenant.id,
      actorId: auth.actor.id,
      actorRole: auth.actor.platformRole,
      changes: { kind: "PRODUCT_INTELLIGENCE_MATCH", itemName: requirement.itemName, unitOfMeasure: requirement.unitOfMeasure, productId: product.id, productSku: product.sku, supplierId: product.supplierId, matchingStatus: "MATCHED" },
    }, tx);
    return true;
  });
  if (!matched) return NextResponse.json({ error: "REQUIREMENT_ALREADY_MATCHED" }, { status: 409 });
  return NextResponse.json({ matched: true, rfqId: requirement.id, product: { id: product.id, name: product.name, sku: product.sku } });
}

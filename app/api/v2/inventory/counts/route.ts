import { NextResponse } from "next/server";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { validatePhysicalCountSubmission, validateScannedBarcode } from "@/lib/inventory/physical-counts";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";

const COUNT_ROLES = ["OWNER", "REGIONAL_GM", "GM", "FINANCIAL_CONTROLLER", "RECEIVING_CLERK"];

async function countActor() {
  const actor = await getActor();
  if (!actor) return { error: "UNAUTHENTICATED", status: 401 as const };
  if (actor.platformRole !== "HOTEL" || !COUNT_ROLES.includes(actor.role)) return { error: "PHYSICAL_COUNT_ROLE_REQUIRED", status: 403 as const };
  if (!actor.hotelId) return { error: "HOTEL_ASSIGNMENT_REQUIRED", status: 403 as const };
  return { actor };
}

/** Resolve a scan only within the caller tenant; no expected stock or supplier data is exposed. */
export async function GET(request: Request) {
  const authorized = await countActor();
  if ("error" in authorized) return NextResponse.json({ error: authorized.error }, { status: authorized.status });
  const barcode = validateScannedBarcode(new URL(request.url).searchParams.get("barcode"));
  if (!barcode) return NextResponse.json({ error: "INVALID_BARCODE" }, { status: 400 });
  const snapshot = await prisma.inventorySnapshot.findFirst({ where: { tenantId: authorized.actor.tenantId, deletedAt: null, product: { deletedAt: null, productVariations: { some: { barcode, deletedAt: null, isActive: true } } } }, orderBy: { createdAt: "desc" }, select: { product: { select: { id: true, name: true, sku: true, unitOfMeasure: true } } } });
  if (!snapshot) return NextResponse.json({ error: "COUNTABLE_PRODUCT_NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ product: snapshot.product, barcode, captureRule: "EXPLICIT_HUMAN_QUANTITY_REQUIRED" }, { headers: { "Cache-Control": "private, no-store" } });
}

/** Records an observation only; an authorized reconciliation review must accept or reject any variance. */
export async function POST(request: Request) {
  const authorized = await countActor();
  if ("error" in authorized) return NextResponse.json({ error: authorized.error }, { status: authorized.status });
  const parsed = validatePhysicalCountSubmission(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { actor } = authorized;
  const hotelId = actor.hotelId;
  if (!hotelId) return NextResponse.json({ error: "HOTEL_ASSIGNMENT_REQUIRED" }, { status: 403 });
  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${parsed.value.clientSubmissionId}, 0))`;
      const prior = await tx.physicalInventoryCount.findFirst({ where: { tenantId: actor.tenantId, clientSubmissionId: parsed.value.clientSubmissionId, deletedAt: null } });
      if (prior) {
        const samePayload = prior.productId === parsed.value.productId && prior.observedQuantity === parsed.value.observedQuantity && prior.barcode === (parsed.value.barcode ?? null) && prior.capturedAt.getTime() === parsed.value.capturedAt.getTime();
        return samePayload ? { count: prior, replayed: true } : { error: "IDEMPOTENCY_KEY_REUSED" as const };
      }
      const countable = await tx.inventorySnapshot.findFirst({ where: { tenantId: actor.tenantId, productId: parsed.value.productId, deletedAt: null, product: { deletedAt: null } }, select: { id: true } });
      if (!countable) return { error: "COUNTABLE_PRODUCT_NOT_FOUND" as const };
      const count = await tx.physicalInventoryCount.create({ data: { tenantId: actor.tenantId, hotelId, productId: parsed.value.productId, countedById: actor.id, clientSubmissionId: parsed.value.clientSubmissionId, observedQuantity: parsed.value.observedQuantity, barcode: parsed.value.barcode ?? null, capturedAt: parsed.value.capturedAt } });
      await appendAuditEntry({ entityName: "PRODUCT", entityId: count.productId, actionType: "SUBMITTED", tenantId: actor.tenantId, actorId: actor.id, actorRole: actor.platformRole, ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null, userAgent: request.headers.get("user-agent"), changes: { event: "PHYSICAL_COUNT_RECORDED", physicalCountId: count.id, clientSubmissionId: count.clientSubmissionId, observedQuantity: count.observedQuantity, barcode: count.barcode, capturedAt: count.capturedAt.toISOString(), status: count.status } }, tx);
      return { count, replayed: false };
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.error === "IDEMPOTENCY_KEY_REUSED" ? 409 : 404 });
    return NextResponse.json({ count: { id: result.count.id, status: result.count.status, observedQuantity: result.count.observedQuantity, capturedAt: result.count.capturedAt.toISOString() }, message: "Count recorded and awaiting review." }, { status: result.replayed ? 200 : 201, headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "PHYSICAL_COUNT_COULD_NOT_BE_RECORDED" }, { status: 500 }); }
}

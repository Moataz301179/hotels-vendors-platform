import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { costBreakdown } from "@/lib/procurement/pre-spend";

const payload = z.object({
  productId: z.string().min(1), rateQuantity: z.number().int().positive().max(1_000_000),
  unitPrice: z.number().finite().positive().max(10_000_000), deliveryFee: z.number().finite().min(0).max(1_000_000).optional(),
  taxAmount: z.number().finite().min(0).max(1_000_000).optional(), sourceReference: z.string().trim().min(3).max(160),
  validFrom: z.coerce.date(), validUntil: z.coerce.date().optional(),
}).refine(value => !value.validUntil || value.validUntil > value.validFrom, { message: "validUntil must be later than validFrom" });

export async function GET() {
  const user = await getActor(); if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!['HOTEL', 'ADMIN'].includes(user.platformRole)) return NextResponse.json({ error: "HOTEL_ROLE_REQUIRED" }, { status: 403 });
  const hotel = await prisma.hotel.findFirst({ where: { tenantId: user.tenantId, status: 'ACTIVE', deletedAt: null }, select: { id: true } });
  if (!hotel) return NextResponse.json({ error: "ACTIVE_HOTEL_REQUIRED" }, { status: 409 });
  const baselines = await prisma.contractRateBaseline.findMany({ where: { tenantId: user.tenantId, hotelId: hotel.id, deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 100 });
  return NextResponse.json({ baselines });
}

export async function POST(request: Request) {
  const user = await getActor(); if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!['HOTEL', 'ADMIN'].includes(user.platformRole)) return NextResponse.json({ error: "HOTEL_ROLE_REQUIRED" }, { status: 403 });
  const parsed = payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A verified product, stated fixed terms, source reference, and valid dates are required." }, { status: 400 });
  const [hotel, product] = await Promise.all([
    prisma.hotel.findFirst({ where: { tenantId: user.tenantId, status: 'ACTIVE', deletedAt: null }, select: { id: true } }),
    prisma.product.findFirst({ where: { id: parsed.data.productId, status: 'ACTIVE', deletedAt: null, supplier: { status: 'ACTIVE', isVerified: true, deletedAt: null } }, select: { id: true, supplierId: true } }),
  ]);
  if (!hotel || !product) return NextResponse.json({ error: "An active hotel and verified supplier product are required." }, { status: 409 });
  const baseline = await prisma.$transaction(async tx => {
    const created = await tx.contractRateBaseline.create({ data: { ...parsed.data, tenantId: user.tenantId, hotelId: hotel.id, supplierId: product.supplierId, productId: product.id, createdById: user.id } });
    await appendAuditEntry({ entityName: 'CONTRACT_RATE_BASELINE', entityId: created.id, actionType: 'CREATED', tenantId: user.tenantId, actorId: user.id, actorRole: user.platformRole, changes: { productId: product.id, sourceReference: parsed.data.sourceReference } }, tx);
    return created;
  });
  return NextResponse.json({ baseline, cost: costBreakdown({ unitPrice: baseline.unitPrice, quantity: baseline.rateQuantity, deliveryFee: baseline.deliveryFee, taxAmount: baseline.taxAmount }) }, { status: 201 });
}

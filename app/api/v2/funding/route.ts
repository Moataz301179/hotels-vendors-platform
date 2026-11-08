import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

const visibleRoles = ["HOTEL", "SUPPLIER", "FACTORING", "ADMIN"];
const transitions: Record<string, string[]> = {
  PENDING: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["DISBURSED"],
  DISBURSED: ["SETTLED", "DEFAULTED"],
  REJECTED: [],
  SETTLED: [],
  DEFAULTED: [],
};

function parseProviderEvidence(value: string | null) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!visibleRoles.includes(actor.platformRole)) return NextResponse.json({ error: "FUNDING_ROLE_REQUIRED" }, { status: 403 });
  if (actor.platformRole === "FACTORING" && !actor.factoringCompanyId) return NextResponse.json({ error: "FUNDER_PROFILE_REQUIRED" }, { status: 403 });

  const requestWhere = actor.platformRole === "FACTORING"
    ? { factoringCompanyId: actor.factoringCompanyId!, deletedAt: null }
    : actor.platformRole === "SUPPLIER"
      ? { invoice: { supplierId: actor.supplierId ?? "", supplier: { tenantId: actor.tenantId } }, deletedAt: null }
      : { tenantId: actor.tenantId, deletedAt: null };
  const companyWhere = actor.platformRole === "FACTORING"
    ? { id: actor.factoringCompanyId!, status: "ACTIVE" as const }
    : { status: "ACTIVE" as const };
  const [requests, companies] = await Promise.all([
    prisma.factoringRequest.findMany({
      where: requestWhere,
      select: { id: true, invoiceId: true, status: true, requestedAmount: true, requestedAt: true, factoringCompanyId: true, disbursedAt: true, settledAt: true, partnerResponse: true },
      orderBy: { requestedAt: "desc" },
      take: 50,
    }),
    prisma.factoringCompany.findMany({ where: companyWhere, select: { id: true, name: true }, take: 50 }),
  ]);
  return NextResponse.json({
    requests,
    companies,
    decisionBoundary: "External funders approve, disburse, and settle financing. HOTELSVENDORS records referrals and provider-reported status only.",
  });
}

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (actor.platformRole !== "SUPPLIER" || !actor.supplierId) return NextResponse.json({ error: "SUPPLIER_FUNDING_REFERRAL_REQUIRED" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const idempotencyKey = req.headers.get("idempotency-key")?.trim();
  if (!idempotencyKey || idempotencyKey.length > 160) {
    return NextResponse.json({ error: "A valid Idempotency-Key header is required." }, { status: 400 });
  }
  if (typeof body?.invoiceId !== "string" || typeof body?.factoringCompanyId !== "string") {
    return NextResponse.json({ error: "Invoice and funder are required." }, { status: 400 });
  }

  const [invoice, company] = await Promise.all([
    prisma.invoice.findFirst({
      where: {
        id: body.invoiceId,
        supplierId: actor.supplierId,
        supplier: { id: actor.supplierId, tenantId: actor.tenantId },
        status: "VALIDATED",
        etaStatus: "ACCEPTED",
        etaUuid: { not: null },
        digitalSignature: { not: null },
        deletedAt: null,
        order: { status: "DELIVERED", goodsReceiptNotes: { some: { status: { in: ["ACCEPTED", "PARTIALLY_ACCEPTED"] }, deletedAt: null } } },
      },
      select: { id: true, tenantId: true, total: true, factoringRequests: { select: { id: true } } },
    }),
    prisma.factoringCompany.findFirst({ where: { id: body.factoringCompanyId, status: "ACTIVE" }, select: { id: true } }),
  ]);
  if (!invoice) return NextResponse.json({ error: "VERIFIED_INVOICE_REQUIRED" }, { status: 404 });
  if (!company) return NextResponse.json({ error: "ACTIVE_FUNDER_REQUIRED" }, { status: 404 });

  const existing = await prisma.factoringRequest.findFirst({
    where: { tenantId: invoice.tenantId, referralIdempotencyKey: idempotencyKey, deletedAt: null },
  });
  if (existing) {
    if (existing.invoiceId !== body.invoiceId || existing.factoringCompanyId !== body.factoringCompanyId) {
      return NextResponse.json({ error: "IDEMPOTENCY_KEY_CONFLICT" }, { status: 409 });
    }
    return NextResponse.json({ referral: existing, moneyMoved: false, idempotentReplay: true });
  }
  // Invoice.factoringRequests is a one-to-one relation (FactoringRequest?), not
  // a list. A first referral is a null relation, not an empty array.
  if (invoice.factoringRequests) {
    return NextResponse.json({ error: "FUNDING_REFERRAL_ALREADY_EXISTS" }, { status: 409 });
  }

  const invoiceTotal = Number(invoice.total ?? 0);
  const requestedAmount = body.requestedAmount === undefined ? invoiceTotal : Number(body.requestedAmount);
  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0 || requestedAmount > invoiceTotal) {
    return NextResponse.json({ error: "Requested amount must be positive and cannot exceed the verified invoice total." }, { status: 400 });
  }

  const referral = await prisma.$transaction(async (tx) => {
    const created = await tx.factoringRequest.create({
      data: {
        invoiceId: invoice.id,
        factoringCompanyId: company.id,
        tenantId: invoice.tenantId,
        requestedAmount,
        referralIdempotencyKey: idempotencyKey,
        status: "PENDING",
        partnerResponse: JSON.stringify({ lifecycle: "REFERRAL_RECORDED", recordedAt: new Date().toISOString() }),
      },
    });
    await tx.invoice.update({ where: { id: invoice.id }, data: { factoringStatus: "OFFERED", factoringCompanyId: company.id } });
    await appendAuditEntry({
      entityName: "FACTORING_REQUEST",
      entityId: created.id,
      actionType: "CREATED",
      tenantId: invoice.tenantId,
      actorId: actor.id,
      actorRole: actor.platformRole,
      changes: { invoiceId: invoice.id, factoringCompanyId: company.id, status: "PENDING", requestedAmount },
    }, tx);
    return created;
  });
  return NextResponse.json({ referral, moneyMoved: false }, { status: 201 });
}

export async function PATCH(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (actor.platformRole !== "FACTORING" || !actor.factoringCompanyId) return NextResponse.json({ error: "AUTHORIZED_FUNDER_REQUIRED" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (typeof body?.id !== "string" || typeof body?.status !== "string") {
    return NextResponse.json({ error: "Funding referral and provider status are required." }, { status: 400 });
  }
  const request = await prisma.factoringRequest.findFirst({ where: { id: body.id, factoringCompanyId: actor.factoringCompanyId, deletedAt: null } });
  if (!request) return NextResponse.json({ error: "FUNDING_REFERRAL_NOT_FOUND" }, { status: 404 });
  const recordedEvidence = parseProviderEvidence(request.partnerResponse) as Record<string, unknown>;
  if (request.status === body.status && recordedEvidence.externalReference === body.externalReference) {
    return NextResponse.json({ updated: true, status: body.status, moneyMoved: false, idempotentReplay: true });
  }
  if (!transitions[request.status]?.includes(body.status)) return NextResponse.json({ error: "INVALID_FUNDING_TRANSITION" }, { status: 409 });
  if (["DISBURSED", "SETTLED", "DEFAULTED"].includes(body.status)
    && (typeof body.externalReference !== "string" || !body.externalReference.trim())) {
    return NextResponse.json({ error: "EXTERNAL_PROVIDER_REFERENCE_REQUIRED" }, { status: 400 });
  }

  const now = new Date();
  const providerEvidence = {
    ...recordedEvidence,
    providerStatus: body.status,
    externalReference: typeof body.externalReference === "string" ? body.externalReference.trim() : undefined,
    reconciliationNote: typeof body.reconciliationNote === "string" ? body.reconciliationNote.slice(0, 1000) : undefined,
    recordedAt: now.toISOString(),
    recordedByFunder: actor.factoringCompanyId,
  };
  const changed = await prisma.$transaction(async (tx) => {
    const updated = await tx.factoringRequest.updateMany({
      where: { id: request.id, factoringCompanyId: actor.factoringCompanyId!, status: request.status, deletedAt: null },
      data: {
        status: body.status,
        partnerResponse: JSON.stringify(providerEvidence),
        ...(body.status === "DISBURSED" ? { disbursedAt: now } : {}),
        ...(body.status === "SETTLED" ? { settledAt: now } : {}),
      },
    });
    if (updated.count !== 1) return false;
    await appendAuditEntry({
      entityName: "FACTORING_REQUEST",
      entityId: request.id,
      actionType: "STATUS_CHANGED",
      tenantId: request.tenantId,
      actorId: actor.id,
      actorRole: actor.platformRole,
      changes: { from: request.status, to: body.status, externalReference: providerEvidence.externalReference ?? null },
    }, tx);
    return true;
  });
  if (!changed) return NextResponse.json({ error: "FUNDING_REFERRAL_CHANGED" }, { status: 409 });
  return NextResponse.json({ updated: true, status: body.status, moneyMoved: false });
}

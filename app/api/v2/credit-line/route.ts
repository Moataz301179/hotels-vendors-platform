import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { resolveCreditAccess, creditLineRequiredForRole } from "@/lib/credit/workspace-access";

const legibilitySchema = z.object({
  organizationName: z.string().trim().min(2).max(160),
  taxId: z.string().trim().min(3).max(64),
  crNumber: z.string().trim().min(3).max(64).optional(),
  governorate: z.string().trim().max(80).optional(),
  address: z.string().trim().max(240).optional(),
  contactName: z.string().trim().max(120).optional(),
  contactEmail: z.string().trim().email().max(160).optional(),
  contactPhone: z.string().trim().max(40).optional(),
});

const funderDecisionSchema = z.object({
  applicationId: z.string().trim().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  approvedLimit: z.number().positive().max(1_000_000_000).optional(),
  rejectedReason: z.string().trim().min(5).max(500).optional(),
  externalReference: z.string().trim().max(160).optional(),
});

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const access = await resolveCreditAccess(actor);
  const queue =
    actor.platformRole === "FACTORING" && actor.factoringCompanyId
      ? await prisma.creditLineApplication.findMany({
          where: {
            deletedAt: null,
            status: { in: ["PENDING_REVIEW", "UNDER_REVIEW", "PENDING"] },
            OR: [{ factoringCompanyId: actor.factoringCompanyId }, { factoringCompanyId: null }],
          },
          orderBy: { createdAt: "asc" },
          take: 50,
          select: {
            id: true,
            status: true,
            hotelName: true,
            taxId: true,
            governorate: true,
            createdAt: true,
            tenantId: true,
          },
        })
      : undefined;
  return NextResponse.json({ access, queue }, { headers: { "Cache-Control": "private, no-store" } });
}

/** Hotel/supplier submit legibility for funder credit-line review. Does not invent approval. */
export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!creditLineRequiredForRole(actor.platformRole)) {
    return NextResponse.json({ error: "CREDIT_LINE_NOT_APPLICABLE" }, { status: 403 });
  }
  const parsed = legibilitySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "ORGANIZATION_LEGIBILITY_REQUIRED" }, { status: 400 });
  }

  const existingActive = await resolveCreditAccess(actor);
  if (existingActive.stage === "active") {
    return NextResponse.json({ access: existingActive, alreadyActive: true });
  }

  const open = await prisma.creditLineApplication.findFirst({
    where: {
      tenantId: actor.tenantId,
      deletedAt: null,
      status: { in: ["PENDING_REVIEW", "UNDER_REVIEW", "PENDING", "SUBMITTED"] },
    },
    select: { id: true },
  });
  if (open) {
    const access = await resolveCreditAccess(actor);
    return NextResponse.json({ access, alreadySubmitted: true });
  }

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.creditLineApplication.create({
      data: {
        tenantId: actor.tenantId,
        status: "PENDING_REVIEW",
        hotelName: parsed.data.organizationName,
        taxId: parsed.data.taxId,
        crNumber: parsed.data.crNumber || parsed.data.taxId,
        governorate: parsed.data.governorate,
        address: parsed.data.address,
        gmName: parsed.data.contactName,
        gmEmail: parsed.data.contactEmail,
        gmPhone: parsed.data.contactPhone,
      },
    });
    await appendAuditEntry(
      {
        entityName: "CREDIT_LINE_APPLICATION",
        entityId: row.id,
        actionType: "CREATED",
        tenantId: actor.tenantId,
        actorId: actor.id,
        actorRole: actor.platformRole,
        changes: { status: "PENDING_REVIEW", organizationName: parsed.data.organizationName },
      },
      tx
    );
    return row;
  });

  const access = await resolveCreditAccess(actor);
  return NextResponse.json({ applicationId: created.id, access }, { status: 201 });
}

/**
 * Funder-only credit-line decision. Approving writes an ACTIVE CreditFacility
 * for the hotel tenant. HotelsVendors never auto-approves.
 */
export async function PATCH(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (actor.platformRole !== "FACTORING" || !actor.factoringCompanyId) {
    return NextResponse.json({ error: "AUTHORIZED_FUNDER_REQUIRED" }, { status: 403 });
  }
  const parsed = funderDecisionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "FUNDER_DECISION_REQUIRED" }, { status: 400 });
  }
  if (parsed.data.decision === "REJECTED" && !parsed.data.rejectedReason) {
    return NextResponse.json({ error: "REJECTED_REASON_REQUIRED" }, { status: 400 });
  }
  if (parsed.data.decision === "APPROVED" && !parsed.data.approvedLimit) {
    return NextResponse.json({ error: "APPROVED_LIMIT_REQUIRED" }, { status: 400 });
  }

  const application = await prisma.creditLineApplication.findFirst({
    where: {
      id: parsed.data.applicationId,
      deletedAt: null,
      status: { in: ["PENDING_REVIEW", "UNDER_REVIEW", "PENDING", "SUBMITTED"] },
      OR: [{ factoringCompanyId: actor.factoringCompanyId }, { factoringCompanyId: null }],
    },
  });
  if (!application) return NextResponse.json({ error: "CREDIT_APPLICATION_NOT_FOUND" }, { status: 404 });

  if (parsed.data.decision === "REJECTED") {
    await prisma.$transaction(async (tx) => {
      await tx.creditLineApplication.update({
        where: { id: application.id },
        data: {
          status: "REJECTED",
          rejectedReason: parsed.data.rejectedReason,
          factoringCompanyId: actor.factoringCompanyId,
        },
      });
      await appendAuditEntry(
        {
          entityName: "CREDIT_LINE_APPLICATION",
          entityId: application.id,
          actionType: "REJECTED",
          tenantId: application.tenantId,
          actorId: actor.id,
          actorRole: actor.platformRole,
          changes: {
            status: "REJECTED",
            rejectedReason: parsed.data.rejectedReason,
            externalReference: parsed.data.externalReference ?? null,
            funderOnly: true,
          },
        },
        tx
      );
    });
    return NextResponse.json({ updated: true, status: "REJECTED", moneyMoved: false });
  }

  const hotel = await prisma.hotel.findFirst({
    where: { tenantId: application.tenantId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!hotel) {
    return NextResponse.json(
      { error: "HOTEL_PROFILE_REQUIRED", message: "A hotel organization profile must exist before a funder can attach a credit facility." },
      { status: 409 }
    );
  }

  const facility = await prisma.$transaction(async (tx) => {
    await tx.creditLineApplication.update({
      where: { id: application.id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedLimit: parsed.data.approvedLimit,
        factoringCompanyId: actor.factoringCompanyId,
      },
    });
    const created = await tx.creditFacility.create({
      data: {
        hotelId: hotel.id,
        factoringCompanyId: actor.factoringCompanyId!,
        tenantId: application.tenantId,
        status: "ACTIVE",
        approvedAt: new Date(),
        limit: parsed.data.approvedLimit,
        utilized: 0,
      },
    });
    await appendAuditEntry(
      {
        entityName: "CREDIT_FACILITY",
        entityId: created.id,
        actionType: "APPROVED",
        tenantId: application.tenantId,
        actorId: actor.id,
        actorRole: actor.platformRole,
        changes: {
          applicationId: application.id,
          status: "ACTIVE",
          approvedLimit: parsed.data.approvedLimit,
          externalReference: parsed.data.externalReference ?? null,
          funderOnly: true,
          moneyMoved: false,
        },
      },
      tx
    );
    return created;
  });

  return NextResponse.json({
    updated: true,
    status: "APPROVED",
    facilityId: facility.id,
    moneyMoved: false,
    note: "Funder-recorded credit facility is active. HotelsVendors did not underwrite or disburse funds.",
  });
}

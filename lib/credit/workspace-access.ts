/**
 * Credit-line workspace access.
 *
 * HotelsVendors does not underwrite or invent approvals. An ACTIVE facility
 * recorded from a funder decision unlocks order placement. Everything else is
 * an honest status for the hotel/supplier to complete legibility or wait.
 */

import { prisma } from "@/lib/prisma";

export type CreditStage =
  | "not_required"
  | "needs_legibility"
  | "awaiting_funder"
  | "rejected"
  | "active";

export type CreditAccess = {
  stage: CreditStage;
  canPlaceOrders: boolean;
  canOpenFullDashboard: boolean;
  role: string;
  tenantId: string;
  application: {
    id: string;
    status: string;
    hotelName: string;
    createdAt: string;
    rejectedReason: string | null;
    approvedLimit: string | null;
  } | null;
  facility: {
    id: string;
    status: string;
    source: "CreditFacility" | "OlivCreditFacility";
    approvedAt: string | null;
    limit: string | null;
    available: string | null;
  } | null;
  nextAction: { href: string; label: string; detail: string };
  boundary: string;
};

const BOUNDARY =
  "Credit-line and payment approvals come solely from the external funder. HotelsVendors records legibility, referrals, and provider-reported facility status — it does not lend or invent approvals.";

type ActorLike = {
  platformRole: string;
  tenantId: string;
  hotelId?: string | null;
  supplierId?: string | null;
  factoringCompanyId?: string | null;
};

function nextFor(stage: CreditStage): CreditAccess["nextAction"] {
  switch (stage) {
    case "needs_legibility":
      return {
        href: "/credit-line",
        label: "Submit credit-line legibility",
        detail: "Provide organization identity so a funder can review a credit line. Orders stay closed until the funder approves.",
      };
    case "awaiting_funder":
      return {
        href: "/credit-line",
        label: "Await funder decision",
        detail: "Your legibility package is recorded. Only the funder can approve a credit line — HotelsVendors cannot invent that decision.",
      };
    case "rejected":
      return {
        href: "/credit-line",
        label: "Review funder decline",
        detail: "The funder declined the recorded application. Update legibility or contact the funder — the dashboard stays gated.",
      };
    case "active":
      return {
        href: "/dashboard",
        label: "Open purchasing dashboard",
        detail: "A funder-approved credit line is active. Purchase orders may proceed through the sealed sourcing path.",
      };
    default:
      return {
        href: "/dashboard",
        label: "Open workspace",
        detail: "This role does not require a buyer/supplier credit line for its operating screens.",
      };
  }
}

function mapApplication(row: {
  id: string;
  status: string;
  hotelName: string;
  createdAt: Date;
  rejectedReason: string | null;
  approvedLimit: { toString(): string } | null;
}) {
  return {
    id: row.id,
    status: row.status,
    hotelName: row.hotelName,
    createdAt: row.createdAt.toISOString(),
    rejectedReason: row.rejectedReason,
    approvedLimit: row.approvedLimit?.toString() ?? null,
  };
}

/** Roles that must hold a funder-approved credit line before ordering / full dashboard. */
export function creditLineRequiredForRole(platformRole: string): boolean {
  return platformRole === "HOTEL" || platformRole === "SUPPLIER";
}

export function accessFromStage(
  actor: ActorLike,
  stage: CreditStage,
  extras: Pick<CreditAccess, "application" | "facility">
): CreditAccess {
  const unlocked = stage === "active" || stage === "not_required";
  return {
    stage,
    canPlaceOrders: stage === "active" || stage === "not_required",
    canOpenFullDashboard: unlocked,
    role: actor.platformRole,
    tenantId: actor.tenantId,
    application: extras.application,
    facility: extras.facility,
    nextAction: nextFor(stage),
    boundary: BOUNDARY,
  };
}

/**
 * Resolve honest credit-line access for the signed-in actor.
 * Never invents an ACTIVE facility.
 */
export async function resolveCreditAccess(actor: ActorLike): Promise<CreditAccess> {
  if (!creditLineRequiredForRole(actor.platformRole)) {
    return accessFromStage(actor, "not_required", { application: null, facility: null });
  }

  if (actor.platformRole === "HOTEL") {
    const hotel =
      (actor.hotelId
        ? await prisma.hotel.findFirst({ where: { id: actor.hotelId, tenantId: actor.tenantId, deletedAt: null }, select: { id: true } })
        : null) ??
      (await prisma.hotel.findFirst({ where: { tenantId: actor.tenantId, deletedAt: null }, select: { id: true }, orderBy: { createdAt: "asc" } }));

    const facility = hotel
      ? await prisma.creditFacility.findFirst({
          where: { hotelId: hotel.id, tenantId: actor.tenantId, status: "ACTIVE", deletedAt: null },
          orderBy: { approvedAt: "desc" },
          select: { id: true, status: true, approvedAt: true, limit: true, utilized: true },
        })
      : null;

    if (facility) {
      const limit = facility.limit != null ? Number(facility.limit) : null;
      const utilized = facility.utilized != null ? Number(facility.utilized) : 0;
      const available = limit != null && Number.isFinite(limit) ? Math.max(0, limit - utilized) : null;
      return accessFromStage(actor, "active", {
        application: null,
        facility: {
          id: facility.id,
          status: facility.status,
          source: "CreditFacility",
          approvedAt: facility.approvedAt?.toISOString() ?? null,
          limit: facility.limit?.toString() ?? null,
          available: available != null ? available.toFixed(2) : null,
        },
      });
    }

    const application = await prisma.creditLineApplication.findFirst({
      where: { tenantId: actor.tenantId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        hotelName: true,
        createdAt: true,
        rejectedReason: true,
        approvedLimit: true,
      },
    });

    if (!application) {
      return accessFromStage(actor, "needs_legibility", { application: null, facility: null });
    }
    const status = application.status.toUpperCase();
    if (status === "REJECTED" || status === "DECLINED") {
      return accessFromStage(actor, "rejected", { application: mapApplication(application), facility: null });
    }
    if (status === "APPROVED" || status === "ACTIVE") {
      // Approved application without an ACTIVE CreditFacility is incomplete —
      // funder facility write is required before orders unlock.
      return accessFromStage(actor, "awaiting_funder", { application: mapApplication(application), facility: null });
    }
    return accessFromStage(actor, "awaiting_funder", { application: mapApplication(application), facility: null });
  }

  // SUPPLIER — Oliv (or equivalent) funder-recorded facility only.
  if (!actor.supplierId) {
    return accessFromStage(actor, "needs_legibility", { application: null, facility: null });
  }
  const oliv = await prisma.olivCreditFacility.findFirst({
    where: { supplierId: actor.supplierId, tenantId: actor.tenantId, status: "ACTIVE", deletedAt: null },
    orderBy: { approvedAt: "desc" },
    select: { id: true, status: true, approvedAt: true, creditLimitEgp: true, availableEgp: true },
  });
  if (oliv) {
    return accessFromStage(actor, "active", {
      application: null,
      facility: {
        id: oliv.id,
        status: oliv.status,
        source: "OlivCreditFacility",
        approvedAt: oliv.approvedAt?.toISOString() ?? null,
        limit: oliv.creditLimitEgp?.toString() ?? null,
        available: oliv.availableEgp?.toString() ?? null,
      },
    });
  }

  const application = await prisma.creditLineApplication.findFirst({
    where: { tenantId: actor.tenantId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      hotelName: true,
      createdAt: true,
      rejectedReason: true,
      approvedLimit: true,
    },
  });
  if (!application) {
    return accessFromStage(actor, "needs_legibility", { application: null, facility: null });
  }
  const status = application.status.toUpperCase();
  if (status === "REJECTED" || status === "DECLINED") {
    return accessFromStage(actor, "rejected", { application: mapApplication(application), facility: null });
  }
  return accessFromStage(actor, "awaiting_funder", { application: mapApplication(application), facility: null });
}

/** Fail-closed order gate. Returns a machine code when orders must stay closed. */
export async function assertCreditLineForOrders(actor: ActorLike): Promise<
  | { ok: true; access: CreditAccess }
  | { ok: false; code: "CREDIT_LINE_REQUIRED"; access: CreditAccess }
> {
  const access = await resolveCreditAccess(actor);
  if (!access.canPlaceOrders) {
    return { ok: false, code: "CREDIT_LINE_REQUIRED", access };
  }
  return { ok: true, access };
}

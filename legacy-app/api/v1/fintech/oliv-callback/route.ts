import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, success, error, audit } from "@/lib/api-utils";
import { isWebhookIpAllowed, getClientIp } from "@/lib/security/webhook-whitelist";
import { checkWebhookReplay, markWebhookProcessed, olivEventId } from "@/lib/security/webhook-idempotency";
import { releaseCredit } from "@/lib/credit-gate";

export const dynamic = "force-dynamic";

/**
 * Oliv Finance Webhook Callback (Enhanced)
 *
 * Receives async events from Oliv Finance:
 * - funding.disbursed → Update FactoringRequest + CreditFacility balance
 * - funding.settled → Update FactoringRequest + CreditFacility balance
 * - funding.defaulted → Update FactoringRequest + CreditFacility status
 * - hotel.payment_received → Update settlement status
 * - credit_facility.approved → Create/update OlivCreditFacility
 * - credit_facility.updated → Update credit limit/balance
 *
 * Oliv sends a Bearer token in Authorization header for authentication.
 */

export const POST = apiRoute(async (request: NextRequest) => {
  // 1. Verify Oliv webhook auth token — mandatory, fail closed
  const olivWebhookToken = process.env.OLIV_WEBHOOK_TOKEN;
  if (!olivWebhookToken) {
    console.error("[Oliv Callback] OLIV_WEBHOOK_TOKEN not configured — rejecting all webhooks");
    return error("Webhook not configured", 503);
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${olivWebhookToken}`) {
    return error("Unauthorized", 401);
  }

  // IP whitelisting — reject webhooks from untrusted sources
  const clientIp = getClientIp(request);
  if (!isWebhookIpAllowed(clientIp, "oliv")) {
    return error("Forbidden: untrusted webhook source", 403);
  }

  const payload = await request.json();

  // Replay protection — reject duplicate webhook deliveries
  const eventId = olivEventId(payload);
  const { isReplay } = await checkWebhookReplay("oliv", eventId);
  if (isReplay) {
    return success({ duplicate: true, message: "Webhook already processed" });
  }

  const eventType = payload.event_type || payload.event || "unknown";

  // 2. Route to handler based on event type
  switch (eventType) {
    case "funding.disbursed":
    case "funding.settled":
    case "funding.defaulted":
    case "funding.disputed":
    case "hotel.payment_received":
      return await handleFundingEvent(payload, eventType, eventId);

    case "credit_facility.approved":
    case "credit_facility.updated":
    case "credit_facility.suspended":
      return await handleCreditFacilityEvent(payload, eventType, eventId);

    default:
      console.warn("[Oliv Callback] Unknown event type:", eventType);
      await markWebhookProcessed("oliv", eventId, `unknown:${eventType}`);
      return success({ acknowledged: true, eventType });
  }
});

/**
 * Handle funding events (disbursed, settled, defaulted, disputed)
 */
async function handleFundingEvent(
  payload: Record<string, unknown>,
  eventType: string,
  eventId: string
) {
  const data = (payload.data || payload) as Record<string, unknown>;
  const olivFundingId = data.funding_id || data.factoringRequestId || data.instruction_id;

  if (!olivFundingId) {
    console.warn("[Oliv Callback] Missing funding_id in payload");
    return success({ acknowledged: true, matched: false, reason: "missing_funding_id" });
  }

  // Find FactoringRequest by Oliv funding_id stored in partnerResponse
  const factoringRequests = await prisma.factoringRequest.findMany({
    where: { factoringCompanyId: "oliv_finance" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const matchedRequest = factoringRequests.find((fr) => {
    try {
      const parsed = JSON.parse(fr.partnerResponse || "{}");
      return parsed.factoringRequestId === olivFundingId || parsed.fundingId === olivFundingId;
    } catch {
      return false;
    }
  });

  if (!matchedRequest) {
    console.warn("[Oliv Callback] Unmatched funding_id:", olivFundingId);
    return success({ acknowledged: true, matched: false, reason: "unmatched_funding_id" });
  }

  // Map Oliv event to FactoringRequestStatus
  let newStatus: "DISBURSED" | "SETTLED" | "DEFAULTED" | "UNDER_REVIEW" = matchedRequest.status as "DISBURSED" | "SETTLED" | "DEFAULTED" | "UNDER_REVIEW";
  let actionLabel = "OLIV_STATUS_UPDATE";

  switch (eventType) {
    case "funding.disbursed":
      newStatus = "DISBURSED";
      actionLabel = "OLIV_DISBURSED";
      break;
    case "funding.settled":
      newStatus = "SETTLED";
      actionLabel = "OLIV_SETTLED";
      break;
    case "funding.defaulted":
      newStatus = "DEFAULTED";
      actionLabel = "OLIV_DEFAULTED";
      break;
    case "hotel.payment_received":
      if (matchedRequest.status !== "SETTLED") {
        newStatus = "SETTLED";
        actionLabel = "OLIV_HOTEL_PAID";
      }
      break;
  }

  // Update FactoringRequest
  const updateData: Record<string, unknown> = { status: newStatus };
  if (data.disbursed_at) updateData.disbursedAt = new Date(data.disbursed_at as string);
  if (data.settled_at) updateData.settledAt = new Date(data.settled_at as string);
  if (data.maturity_date) updateData.maturityDate = new Date(data.maturity_date as string);

  await prisma.factoringRequest.update({
    where: { id: matchedRequest.id },
    data: updateData,
  });

  // Update linked Invoice if settled
  if (newStatus === "SETTLED" && matchedRequest.invoiceId) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: matchedRequest.invoiceId },
      select: { hotelId: true, total: true },
    });
    await prisma.invoice.update({
      where: { id: matchedRequest.invoiceId },
      data: {
        paymentStatus: "PAID",
        paidDate: new Date(),
        factoringStatus: "PAID",
      },
    });
    // Release credit — factoring payment received, free up hotel's credit limit
    if (invoice) {
      await releaseCredit(invoice.hotelId, Number(invoice.total ?? 0));
    }
  }

  // Update OlivCreditFacility balance
  const facility = await prisma.olivCreditFacility.findFirst({
    where: {
      tenantId: matchedRequest.tenantId,
      status: "ACTIVE",
    },
  });

  if (facility) {
    const amount = (data.amount || data.disbursedAmount || data.grossAmount || 0) as number;
    let utilizedDelta = 0;

    switch (eventType) {
      case "funding.disbursed":
        utilizedDelta = amount; // Credit utilized
        break;
      case "funding.settled":
        utilizedDelta = -amount; // Credit freed up
        break;
    }

    if (utilizedDelta !== 0) {
      const newUtilized = Math.max(0, Number(facility.utilizedEgp || 0) + utilizedDelta);
      await prisma.olivCreditFacility.update({
        where: { id: facility.id },
        data: {
          utilizedEgp: newUtilized,
          availableEgp: Number(facility.creditLimitEgp || 0) - newUtilized,
          lastSyncedAt: new Date(),
        },
      });
    }
  }

  // Audit log
  await audit({
    entityType: "FactoringRequest",
    entityId: matchedRequest.id,
    action: actionLabel,
    tenantId: matchedRequest.tenantId,
    actorId: "oliv",
    actorRole: "SYSTEM",
    afterState: {
      olivFundingId,
      eventType,
      status: newStatus,
    },
  });

  // Log sync event
  await prisma.olivSyncLog.create({
    data: {
      direction: "INBOUND",
      eventType,
      entityType: "FactoringRequest",
      entityId: matchedRequest.id,
      payload: JSON.stringify(data),
      success: true,
      idempotencyKey: eventId,
      tenantId: matchedRequest.tenantId,
    },
  });

  await markWebhookProcessed("oliv", eventId, `${eventType}:${matchedRequest.id}`);

  return success({
    acknowledged: true,
    matched: true,
    factoringRequestId: matchedRequest.id,
    newStatus,
    eventType,
  });
}

/**
 * Handle credit facility events (approved, updated, suspended)
 */
async function handleCreditFacilityEvent(
  payload: Record<string, unknown>,
  eventType: string,
  eventId: string
) {
  const data = (payload.data || payload) as Record<string, unknown>;
  const supplierId = data.supplier_id || data.supplierId;
  const olivFacilityId = data.facility_id || data.creditFacilityId;

  if (!supplierId) {
    console.warn("[Oliv Callback] Missing supplier_id in credit facility event");
    return success({ acknowledged: true, matched: false, reason: "missing_supplier_id" });
  }

  // Find supplier
  const supplier = await prisma.supplier.findFirst({
    where: {
      olivUserId: supplierId as string,
    },
  });

  if (!supplier) {
    console.warn("[Oliv Callback] Unmatched supplier_id:", supplierId);
    return success({ acknowledged: true, matched: false, reason: "unmatched_supplier" });
  }

  // Update or create OlivCreditFacility
  const facilityData = {
    creditLimitEgp: (data.credit_limit || data.creditLimit || 0) as number,
    utilizedEgp: (data.utilized || data.utilizedAmount || 0) as number,
    availableEgp: (data.available || data.availableAmount || 0) as number,
    interestRate: (data.interest_rate || data.interestRate || 0) as number,
    advanceRate: (data.advance_rate || data.advanceRate || 0.88) as number,
    discountRate: (data.discount_rate || data.discountRate || 0.025) as number,
    settlementDays: (data.settlement_days || data.settlementDays || 90) as number,
    olivRiskScore: data.risk_score as number | undefined,
    olivRiskTier: data.risk_tier as string | undefined,
    lastSyncedAt: new Date(),
  };

  if (eventType === "credit_facility.approved") {
    // Create new facility
    await prisma.olivCreditFacility.create({
      data: {
        supplierId: supplier.id,
        tenantId: supplier.tenantId,
        olivFacilityId: olivFacilityId as string || `OLIV-${Date.now()}`,
        ...facilityData,
        status: "ACTIVE",
        approvedAt: new Date(),
      },
    });

    // Update supplier's Oliv status
    await prisma.supplier.update({
      where: { id: supplier.id },
      data: {
        olivStatus: "APPROVED",
        olivSyncAt: new Date(),
      },
    });
  } else if (eventType === "credit_facility.updated") {
    // Update existing facility
    const existing = await prisma.olivCreditFacility.findFirst({
      where: {
        supplierId: supplier.id,
        status: "ACTIVE",
      },
    });

    if (existing) {
      await prisma.olivCreditFacility.update({
        where: { id: existing.id },
        data: facilityData,
      });
    }
  } else if (eventType === "credit_facility.suspended") {
    // Suspend facility
    const existing = await prisma.olivCreditFacility.findFirst({
      where: {
        supplierId: supplier.id,
        status: "ACTIVE",
      },
    });

    if (existing) {
      await prisma.olivCreditFacility.update({
        where: { id: existing.id },
        data: { status: "SUSPENDED", lastSyncedAt: new Date() },
      });
    }
  }

  // Audit log
  await audit({
    entityType: "OlivCreditFacility",
    entityId: supplier.id,
    action: `OLIV_${eventType.toUpperCase().replace(".", "_")}`,
    tenantId: supplier.tenantId,
    actorId: "oliv",
    actorRole: "SYSTEM",
    afterState: facilityData,
  });

  // Log sync event
  await prisma.olivSyncLog.create({
    data: {
      direction: "INBOUND",
      eventType,
      entityType: "OlivCreditFacility",
      entityId: supplier.id,
      payload: JSON.stringify(data),
      success: true,
      idempotencyKey: eventId,
      tenantId: supplier.tenantId,
    },
  });

  await markWebhookProcessed("oliv", eventId, `${eventType}:${supplier.id}`);

  return success({
    acknowledged: true,
    matched: true,
    supplierId: supplier.id,
    eventType,
  });
}

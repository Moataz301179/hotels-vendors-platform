/**
 * Virtual Ghost evaluation engine — READ-ONLY.
 *
 * Sources: InventoryReconciliation variance, GoodsReceiptNote discrepancies,
 * ConsumptionForecast, Invoice amounts. Every finding cites its evidence
 * records and is labelled INFERENCE. No synthetic data is ever generated and
 * no fraud is alleged. Acceptance is an operational acknowledgement only.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/auth/rbac";
import {
  GHOST_CATEGORIES,
  GHOST_CONSENT_TYPE,
  GHOST_CONSENT_VERSION,
  GHOST_DATA_CATEGORIES,
  GHOST_DECISION_PERMISSION,
  GHOST_FINDING_PERMISSION,
  GHOST_LIFECYCLE,
  GHOST_OPT_IN_PERMISSION,
  type GhostCategory,
  type GhostEvidenceRef,
  type GhostFinding,
  type GhostLifecycle,
} from "./types";

// ---------------------------------------------------------------------------
// Organization opt-in
// ---------------------------------------------------------------------------
export async function isGhostOptedIn(tenantId: string): Promise<boolean> {
  const consent = await prisma.consentRecord.findFirst({
    where: { tenantId, consentType: GHOST_CONSENT_TYPE, status: "GRANTED", deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return Boolean(consent);
}

export async function setGhostOptIn(tenantId: string, actor: { id: string; platformRole: string }, enabled: boolean): Promise<{ optedIn: boolean }> {
  await requireGhostPermission(actor, tenantId, GHOST_OPT_IN_PERMISSION);
  if (enabled) {
    const existing = await prisma.consentRecord.findFirst({ where: { tenantId, consentType: GHOST_CONSENT_TYPE, status: "GRANTED", deletedAt: null }, select: { id: true } });
    if (!existing) {
      await prisma.consentRecord.create({
        data: {
          userId: actor.id,
          tenantId,
          consentType: GHOST_CONSENT_TYPE,
          partnerId: "hotelsvendors_ghost",
          consentVersion: GHOST_CONSENT_VERSION,
          dataCategories: GHOST_DATA_CATEGORIES.join(","),
          status: "GRANTED",
        },
      });
    }
  } else {
    await prisma.consentRecord.updateMany({
      where: { tenantId, consentType: GHOST_CONSENT_TYPE, status: "GRANTED", deletedAt: null },
      data: { status: "WITHDRAWN", withdrawnAt: new Date(), withdrawalReason: "Organization opt-out" },
    });
  }
  await audit(tenantId, actor.id, actor.platformRole, "GHOST_OPT_IN", { enabled });
  return { optedIn: enabled };
}

// ---------------------------------------------------------------------------
// Evaluation — read-only, evidence-backed
// ---------------------------------------------------------------------------
interface FindingDraft {
  category: GhostCategory;
  title: string;
  confidence: number;
  evidence: GhostEvidenceRef[];
  estimatedCost: GhostFinding["estimatedCost"];
  recommendedAction: string;
}

function pct(part: number, whole: number): number {
  if (!whole || whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

export async function evaluateGhost(tenantId: string): Promise<GhostFinding[]> {
  // Evaluate from records only. No model, no fabrication.
  const drafts: FindingDraft[] = [];

  // 1. Inventory reconciliation variance (shrinkage / wastage / leakage).
  const reconciliations = await prisma.inventoryReconciliation.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      createdAt: true,
      lineItems: { select: { id: true, productId: true, beginningQuantity: true, endingQuantity: true, receivedQuantity: true, consumedQuantity: true, wasteQuantity: true, varianceQuantity: true, varianceReason: true, totalValue: true, product: { select: { name: true, sku: true } } } },
    },
  });

  for (const reconciliation of reconciliations) {
    for (const line of reconciliation.lineItems) {
      const variance = Number(line.varianceQuantity ?? 0);
      const value = Number(line.totalValue ?? 0);
      if (variance === 0 || value <= 0) continue;
      const isWaste = Number(line.wasteQuantity ?? 0) > 0;
      drafts.push({
        category: isWaste ? "WASTAGE" : "SHRINKAGE",
        title: `${isWaste ? "Wastage" : "Shrinkage"} variance on ${line.product?.name ?? line.productId}`,
        // Variance is observed; the cause is inferred.
        confidence: variance / Math.max(Number(line.beginningQuantity ?? 0), 1) > 0.1 ? 0.72 : 0.55,
        evidence: [{ source: "InventoryReconciliation", recordId: line.id, observation: `Variance ${variance} units, value EGP ${value.toFixed(2)}, reason: ${line.varianceReason ?? "unrecorded"}` }],
        estimatedCost: { low: value * 0.8, high: value * 1.2, currency: "EGP", basis: "ReconciliationLineItem.totalValue ±20% — observed variance value, not a verified loss" },
        recommendedAction: "Investigate the variance cause with the department; do not adjust stock until the cause is recorded.",
      });
    }
  }

  // 2. GRN discrepancies (shortage / damage / wrong item).
  const grns = await prisma.goodsReceiptNote.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      createdAt: true,
      lineItems: { select: { id: true, productId: true, orderedQuantity: true, receivedQuantity: true, acceptedQuantity: true, rejectedQuantity: true, rejectionReason: true, product: { select: { name: true, sku: true } } } },
    },
  });

  for (const grn of grns) {
    for (const line of grn.lineItems) {
      const rejected = Number(line.rejectedQuantity ?? 0);
      if (rejected <= 0) continue;
      drafts.push({
        category: "PROCUREMENT_ANOMALY",
        title: `Rejected delivery on ${line.product?.name ?? line.productId}`,
        confidence: 0.68,
        evidence: [{ source: "GoodsReceiptNote", recordId: line.id, observation: `Rejected ${rejected} of ${line.orderedQuantity} ordered; reason: ${line.rejectionReason ?? "unrecorded"}` }],
        estimatedCost: null,
        recommendedAction: "Review the supplier's recent rejection rate before the next order.",
      });
    }
  }

  // 3. Abnormal consumption (forecast trend vs. observed).
  const forecasts = await prisma.consumptionForecast.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, createdAt: true, trendDirection: true, avgDailyConsumption: true, monthlyForecast: true, occupancyRate: true, consumptionPerOccupiedRoom: true, product: { select: { name: true, sku: true } } },
  });

  for (const forecast of forecasts) {
    if (forecast.trendDirection !== "INCREASING") continue;
    const monthly = Number(forecast.monthlyForecast ?? 0);
    if (monthly <= 0) continue;
    drafts.push({
      category: "ABNORMAL_CONSUMPTION",
      title: `Rising consumption trend on ${forecast.product?.name ?? "product"}`,
      confidence: 0.5,
      evidence: [{ source: "ConsumptionForecast", recordId: forecast.id, observation: `Trend INCREASING; monthly forecast ${monthly.toFixed(2)} at ${(Number(forecast.occupancyRate ?? 0) * 100).toFixed(0)}% occupancy` }],
      estimatedCost: { low: monthly * 0.05, high: monthly * 0.2, currency: "EGP", basis: "5–20% of monthly forecast — a scenario range, NOT a verified loss" },
      recommendedAction: "Correlate consumption with occupancy and events before changing the reorder point.",
    });
  }

  // 4. Invoice cost overrun vs. order total.
  const invoices = await prisma.invoice.findMany({
    where: { tenantId, orderId: { not: "" } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, createdAt: true, total: true, invoiceNumber: true, order: { select: { id: true, total: true } } },
  });

  for (const invoice of invoices) {
    const orderTotal = Number(invoice.order?.total ?? 0);
    const invoiceTotal = Number(invoice.total ?? 0);
    if (orderTotal <= 0 || invoiceTotal <= orderTotal) continue;
    const overrunPct = pct(invoiceTotal - orderTotal, orderTotal);
    if (overrunPct < 5) continue;
    drafts.push({
      category: "COST_OVERRUN",
      title: `Invoice ${invoice.invoiceNumber} exceeds its order by ${overrunPct}%`,
      confidence: 0.8,
      evidence: [{ source: "Invoice", recordId: invoice.id, observation: `Invoice EGP ${invoiceTotal.toFixed(2)} vs order EGP ${orderTotal.toFixed(2)} (+${overrunPct}%)` }],
      estimatedCost: { low: invoiceTotal - orderTotal, high: invoiceTotal - orderTotal, currency: "EGP", basis: "Invoice.total − Order.total — observed difference, not an approved charge" },
      recommendedAction: "Query the supplier before approving the invoice; do not auto-approve.",
    });
  }

  // Persist as Opportunities with the Ghost lifecycle in verificationState.
  const persisted: GhostFinding[] = [];
  for (const draft of drafts.slice(0, 25)) {
    const existing = await prisma.opportunity.findFirst({
      where: { tenantId, type: "INVENTORY_LINKED", title: draft.title, verificationState: { in: ["PROPOSED", "ACCEPTED"] }, deletedAt: null },
      select: { id: true },
    });
    if (existing) continue; // idempotent: do not duplicate an open finding

    const created = await prisma.opportunity.create({
      data: {
        tenantId,
        type: "INVENTORY_LINKED",
        status: "REVIEWING",
        title: draft.title,
        description: draft.recommendedAction,
        evidence: { category: draft.category, evidenceLabel: "INFERENCE", evidence: draft.evidence, estimatedCost: draft.estimatedCost, disclaimer: "INFERENCE — evidence-backed observation; NOT a verified fraud claim." } as unknown as Prisma.InputJsonValue,
        confidence: draft.confidence,
        recommendedAction: draft.recommendedAction,
        verificationState: "PROPOSED",
      },
      select: { id: true },
    });
    persisted.push(toFinding(created.id, tenantId, draft, "PROPOSED"));
  }

  return persisted;
}

// ---------------------------------------------------------------------------
// Listing + decisions
// ---------------------------------------------------------------------------
export async function listGhostFindings(tenantId: string, actor: { id: string; platformRole: string }): Promise<GhostFinding[]> {
  await requireGhostPermission(actor, tenantId, GHOST_FINDING_PERMISSION);
  const rows = await prisma.opportunity.findMany({
    where: { tenantId, type: "INVENTORY_LINKED", verificationState: { in: [...GHOST_LIFECYCLE] }, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, title: true, description: true, evidence: true, confidence: true, recommendedAction: true, verificationState: true, ownerId: true, createdAt: true, updatedAt: true },
  });
  return rows.map((row): GhostFinding => {
    const payload = (row.evidence ?? {}) as { category?: GhostCategory; evidence?: GhostEvidenceRef[]; estimatedCost?: GhostFinding["estimatedCost"]; disclaimer?: string };
    return {
      id: row.id,
      tenantId,
      category: payload.category ?? "INVENTORY_VARIANCE",
      title: row.title,
      evidenceLabel: "INFERENCE",
      confidence: Number(row.confidence ?? 0),
      evidence: payload.evidence ?? [],
      estimatedCost: payload.estimatedCost ?? null,
      recommendedAction: row.recommendedAction ?? row.description ?? "",
      lifecycle: (row.verificationState as GhostLifecycle) ?? "PROPOSED",
      decidedBy: row.ownerId,
      decidedAt: null,
      decidedReason: null,
      createdAt: row.createdAt.toISOString(),
      disclaimer: payload.disclaimer ?? "INFERENCE — evidence-backed observation; NOT a verified fraud claim.",
    };
  });
}

export async function decideGhostFinding(
  tenantId: string,
  findingId: string,
  lifecycle: GhostLifecycle,
  actor: { id: string; platformRole: string },
  reason: string
): Promise<GhostFinding | null> {
  if (!GHOST_LIFECYCLE.includes(lifecycle)) throw new Error("Invalid Ghost lifecycle");
  await requireGhostPermission(actor, tenantId, GHOST_DECISION_PERMISSION);
  if (!reason || reason.trim().length < 8) throw new Error("A reason of at least 8 characters is required");

  const existing = await prisma.opportunity.findFirst({
    where: { id: findingId, tenantId, type: "INVENTORY_LINKED", deletedAt: null },
    select: { id: true, title: true, description: true, evidence: true, confidence: true, recommendedAction: true, verificationState: true, ownerId: true, createdAt: true },
  });
  if (!existing) return null;

  await prisma.opportunity.update({
    where: { id: existing.id },
    data: {
      verificationState: lifecycle,
      // ACCEPTED routes into the normal review queue; it does NOT create an
      // expenditure approval or release an order.
      status: lifecycle === "ACCEPTED" ? "ACTION_READY" : "CLOSED",
      ownerId: actor.id,
      realizedResult: { decidedBy: actor.id, decidedAt: new Date().toISOString(), decidedReason: reason, expenditureApproved: false, orderReleased: false } as unknown as Prisma.InputJsonValue,
    },
  });

  await audit(tenantId, actor.id, actor.platformRole, lifecycle === "ACCEPTED" ? "GHOST_FINDING_ACCEPTED" : "GHOST_FINDING_DISMISSED", { findingId, reason, expenditureApproved: false, orderReleased: false });

  const payload = (existing.evidence ?? {}) as { category?: GhostCategory; evidence?: GhostEvidenceRef[]; estimatedCost?: GhostFinding["estimatedCost"] };
  return {
    id: existing.id,
    tenantId,
    category: payload.category ?? "INVENTORY_VARIANCE",
    title: existing.title,
    evidenceLabel: "INFERENCE",
    confidence: Number(existing.confidence ?? 0),
    evidence: payload.evidence ?? [],
    estimatedCost: payload.estimatedCost ?? null,
    recommendedAction: existing.recommendedAction ?? existing.description ?? "",
    lifecycle,
    decidedBy: actor.id,
    decidedAt: new Date().toISOString(),
    decidedReason: reason,
    createdAt: existing.createdAt.toISOString(),
    disclaimer: "INFERENCE — evidence-backed observation; NOT a verified fraud claim.",
  };
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------
function toFinding(id: string, tenantId: string, draft: FindingDraft, lifecycle: GhostLifecycle): GhostFinding {
  return {
    id,
    tenantId,
    category: draft.category,
    title: draft.title,
    evidenceLabel: "INFERENCE",
    confidence: draft.confidence,
    evidence: draft.evidence,
    estimatedCost: draft.estimatedCost,
    recommendedAction: draft.recommendedAction,
    lifecycle,
    decidedBy: null,
    decidedAt: null,
    decidedReason: null,
    createdAt: new Date().toISOString(),
    disclaimer: "INFERENCE — evidence-backed observation; NOT a verified fraud claim.",
  };
}

async function requireGhostPermission(actor: { id: string; platformRole: string }, tenantId: string, permission: string): Promise<void> {
  const allowed = await hasPermission({ userId: actor.id, tenantId, platformRole: actor.platformRole }, permission);
  if (!allowed) throw new Error(`Permission denied: ${permission}`);
}

async function audit(tenantId: string, actorId: string, actorRole: string, action: string, changes: Record<string, unknown>): Promise<void> {
  await prisma.auditLog.create({
    data: {
      tenantId,
      entityId: `ghost:${action}`,
      entityName: "OPPORTUNITY",
      actorId,
      actorRole,
      actionType: action.startsWith("GHOST_FINDING") ? "UPDATE" : "CREATE",
      changes: changes as unknown as Prisma.InputJsonValue,
    },
  });
}

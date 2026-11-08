/**
 * Virtual Ghost — operational intelligence layer.
 *
 * Reconciled against docs/audits/virtual-ghost-operational-intelligence-addendum.md.
 * Everything here is READ-ONLY and evidence-backed. The model is never consulted
 * for findings; findings are computed from records and always labelled with an
 * evidence label. Acceptance of a recommendation is NEVER an expenditure
 * approval and NEVER an order release.
 */

export const GHOST_CATEGORIES = [
  "LEAKAGE",
  "WASTAGE",
  "SHRINKAGE",
  "ABNORMAL_CONSUMPTION",
  "INVENTORY_VARIANCE",
  "COST_OVERRUN",
  "PROCUREMENT_ANOMALY",
] as const;
export type GhostCategory = (typeof GHOST_CATEGORIES)[number];

/**
 * Lifecycle of a Ghost finding. PROPOSED → ACCEPTED | DISMISSED.
 * ACCEPTED means "the operator acknowledges this finding and will act on it";
 * it does NOT authorize spending, releasing an order, or posting a payment.
 */
export const GHOST_LIFECYCLE = ["PROPOSED", "ACCEPTED", "DISMISSED"] as const;
export type GhostLifecycle = (typeof GHOST_LIFECYCLE)[number];

/** Consent type used for organization opt-in (stored in ConsentRecord). */
export const GHOST_CONSENT_TYPE = "GHOST_OPERATIONAL_INTELLIGENCE";
export const GHOST_CONSENT_VERSION = "2026-11-08.v1";
export const GHOST_DATA_CATEGORIES = [
  "inventory_reconciliation",
  "goods_receipt_notes",
  "consumption_forecast",
  "invoices",
  "purchase_orders",
] as const;

export const GHOST_FINDING_PERMISSION = "report:read";
export const GHOST_DECISION_PERMISSION = "report:read";
export const GHOST_OPT_IN_PERMISSION = "audit:read";

export interface GhostEvidenceRef {
  source: "InventoryReconciliation" | "GoodsReceiptNote" | "ConsumptionForecast" | "Invoice" | "InventorySnapshot" | "PhysicalInventoryCount";
  recordId: string;
  /** What the record shows, in one sentence. */
  observation: string;
}

export interface GhostFinding {
  id: string;
  tenantId: string;
  category: GhostCategory;
  title: string;
  /** Always an INFERENCE — never a verified fraud claim. */
  evidenceLabel: "INFERENCE";
  confidence: number;
  evidence: GhostEvidenceRef[];
  /** Estimated cost range with the basis it was computed from. */
  estimatedCost: { low: number; high: number; currency: "EGP"; basis: string } | null;
  recommendedAction: string;
  lifecycle: GhostLifecycle;
  decidedBy: string | null;
  decidedAt: string | null;
  decidedReason: string | null;
  createdAt: string;
  /** Explicit, non-negotiable disclaimer rendered with every finding. */
  disclaimer: string;
}

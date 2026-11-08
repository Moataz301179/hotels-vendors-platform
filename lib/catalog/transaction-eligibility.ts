export const CATALOG_TRANSACTION_REASONS = [
  "PRODUCT_NOT_PUBLISHED",
  "SUPPLIER_NOT_ACTIVE",
  "SUPPLIER_NOT_VERIFIED",
  "SUPPLIER_CONFIRMATION_REQUIRED",
  "RESOLVED_PRODUCT_EVIDENCE_REQUIRED",
] as const;

export type CatalogTransactionReason = (typeof CATALOG_TRANSACTION_REASONS)[number];

export type CatalogTransactionCandidate = {
  status: string;
  source: string;
  sourceProvider: string | null;
  supplier: { status: string; isVerified: boolean };
  hasResolvedEvidence: boolean;
};

/**
 * Server-owned transaction decision. Public research, ecommerce observations,
 * fixtures and manually-entered previews can be displayed, but cannot become
 * a binding RFQ merely because a client enables a button.
 */
export function evaluateCatalogTransaction(candidate: CatalogTransactionCandidate) {
  const reasons: CatalogTransactionReason[] = [];
  if (candidate.status !== "ACTIVE") reasons.push("PRODUCT_NOT_PUBLISHED");
  if (candidate.supplier.status !== "ACTIVE") reasons.push("SUPPLIER_NOT_ACTIVE");
  if (!candidate.supplier.isVerified) reasons.push("SUPPLIER_NOT_VERIFIED");

  const supplierConfirmed =
    candidate.source === "SUPPLIER_SYNC" ||
    (candidate.source === "MANUAL" && candidate.sourceProvider === "SUPPLIER_SUBMISSION");
  if (!supplierConfirmed) reasons.push("SUPPLIER_CONFIRMATION_REQUIRED");
  if (!candidate.hasResolvedEvidence) reasons.push("RESOLVED_PRODUCT_EVIDENCE_REQUIRED");

  return { eligible: reasons.length === 0, reasons } as const;
}

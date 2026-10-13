/**
 * Procurement Agent planning seam.
 *
 * This module recommends eligible candidates only. It does not reserve stock,
 * create an order, contact a supplier, or claim a saving. Those actions remain
 * explicit, authenticated workflow steps behind the Authority Matrix.
 */

export type ProcurementCandidate = {
  id: string;
  supplierId: string;
  supplierName: string;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  currency: string;
  supplierVerified: boolean;
  available: boolean;
};

export type ProcurementRecommendation = {
  productId: string;
  supplierId: string;
  supplierName: string;
  productName: string;
  unit: string;
  unitPrice: number;
  currency: string;
  estimatedSubtotal: number;
  evidence: string[];
};

export type ProcurementPlan = {
  status: "READY_FOR_REVIEW" | "NO_VERIFIED_MATCH";
  recommendations: ProcurementRecommendation[];
  excluded: { productId: string; reason: "CATEGORY_MISMATCH" | "SUPPLIER_NOT_VERIFIED" | "UNAVAILABLE" | "DESCRIPTION_MISMATCH" }[];
  orderCreated: false;
  inventoryReserved: false;
  guaranteedSaving: false;
};

function normalize(value: string): string[] {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

export function planProcurementRecommendations(input: {
  category: string;
  description: string;
  quantity: number;
  candidates: ProcurementCandidate[];
}): ProcurementPlan {
  const requestedTerms = new Set(normalize(input.description));
  const recommendations: ProcurementRecommendation[] = [];
  const excluded: ProcurementPlan["excluded"] = [];

  for (const candidate of input.candidates) {
    if (candidate.category !== input.category) {
      excluded.push({ productId: candidate.id, reason: "CATEGORY_MISMATCH" });
      continue;
    }
    if (!candidate.supplierVerified) {
      excluded.push({ productId: candidate.id, reason: "SUPPLIER_NOT_VERIFIED" });
      continue;
    }
    if (!candidate.available) {
      excluded.push({ productId: candidate.id, reason: "UNAVAILABLE" });
      continue;
    }
    const candidateTerms = new Set(normalize(candidate.name));
    const matchingTerms = [...requestedTerms].filter((term) => candidateTerms.has(term));
    if (requestedTerms.size > 0 && matchingTerms.length === 0) {
      excluded.push({ productId: candidate.id, reason: "DESCRIPTION_MISMATCH" });
      continue;
    }
    recommendations.push({
      productId: candidate.id,
      supplierId: candidate.supplierId,
      supplierName: candidate.supplierName,
      productName: candidate.name,
      unit: candidate.unit,
      unitPrice: candidate.unitPrice,
      currency: candidate.currency,
      estimatedSubtotal: candidate.unitPrice * input.quantity,
      evidence: [
        `Category matched: ${candidate.category}`,
        `Supplier verification: verified`,
        `Availability status: reported available`,
        `Description terms matched: ${matchingTerms.join(", ") || "category request"}`,
      ],
    });
  }

  recommendations.sort((a, b) => a.estimatedSubtotal - b.estimatedSubtotal || a.supplierName.localeCompare(b.supplierName));
  return {
    status: recommendations.length ? "READY_FOR_REVIEW" : "NO_VERIFIED_MATCH",
    recommendations,
    excluded,
    orderCreated: false,
    inventoryReserved: false,
    guaranteedSaving: false,
  };
}

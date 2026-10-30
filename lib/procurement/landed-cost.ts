export type LandedCost = {
  quantity: number;
  unitPrice: number;
  taxRate: number;
  freight: number;
  financeFee: number;
  hvFee: number;
  specificationMatch: boolean;
  paymentTermDays: number;
};

export type LandedComparison =
  | { ok: true; historicLanded: number; nextLanded: number; netEgp: number; claim: "unverified" }
  | { ok: false; code: "INCOMPLETE" | "SPECIFICATION_MISMATCH" | "PAYMENT_TERM_CHANGED"; missing?: string[] };

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

function missingFields(line: LandedCost, prefix: string): string[] {
  const fields: Array<keyof LandedCost> = [
    "quantity", "unitPrice", "taxRate", "freight", "financeFee", "hvFee", "paymentTermDays",
  ];
  return fields.filter((field) => typeof line[field] !== "number" || Number.isNaN(line[field])).map((field) => `${prefix}.${field}`);
}

export function compareLandedCost(historic: LandedCost, next: LandedCost): LandedComparison {
  const missing = [...missingFields(historic, "historic"), ...missingFields(next, "next")];
  if (historic.quantity <= 0 || next.quantity <= 0) missing.push("quantity");
  if (missing.length) return { ok: false, code: "INCOMPLETE", missing };
  if (!historic.specificationMatch || !next.specificationMatch) return { ok: false, code: "SPECIFICATION_MISMATCH" };
  if (historic.paymentTermDays !== next.paymentTermDays) return { ok: false, code: "PAYMENT_TERM_CHANGED" };

  const landed = (line: LandedCost) =>
    line.quantity * line.unitPrice * (1 + line.taxRate) + line.freight + line.financeFee + line.hvFee;
  const historicLanded = money(landed(historic));
  const nextLanded = money(landed(next));
  return { ok: true, historicLanded, nextLanded, netEgp: money(historicLanded - nextLanded), claim: "unverified" };
}

export function reportedSavings(verifiedAmount: number | null) {
  return {
    verifiedSavings: verifiedAmount ?? 0,
    realizedSavings: null,
    potentialSavings: null,
    savingsBasis: "verified-ledger-only" as const,
  };
}

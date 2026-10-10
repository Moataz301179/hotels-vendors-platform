export type CostBreakdown = {
  productCost: number;
  deliveryCost: number | null;
  taxCost: number | null;
  totalCost: number | null;
  totalCostState: "KNOWN" | "INCOMPLETE";
};

const numberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
};

/** A stated cost breakdown. It intentionally makes no savings or tax-rate inference. */
export function costBreakdown(input: {
  unitPrice: unknown;
  quantity: number;
  deliveryFee?: unknown;
  taxAmount?: unknown;
}): CostBreakdown {
  const unitPrice = numberOrNull(input.unitPrice);
  const productCost = unitPrice === null ? 0 : unitPrice * input.quantity;
  const deliveryCost = numberOrNull(input.deliveryFee);
  const taxCost = numberOrNull(input.taxAmount);
  const totalCost = deliveryCost === null || taxCost === null ? null : productCost + deliveryCost + taxCost;
  return { productCost, deliveryCost, taxCost, totalCost, totalCostState: totalCost === null ? "INCOMPLETE" : "KNOWN" };
}

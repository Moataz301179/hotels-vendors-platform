/**
 * Pre-spend comparison primitives.
 *
 * These helpers deliberately calculate only directly supplied commercial
 * values. They do not infer tax, delivery, savings, supplier qualification, or
 * a recommended choice.
 */

export type KnownMoney = number | null | undefined;

export interface CostBreakdown {
  productCost: number;
  deliveryCost: number | null;
  taxCost: number | null;
  totalCost: number | null;
  totalCostState: "COMPLETE" | "INCOMPLETE";
}

function monetary(value: number): number {
  return Math.round(value * 100) / 100;
}

function knownMoney(value: KnownMoney): number | null {
  if (value == null || !Number.isFinite(value) || value < 0) return null;
  return monetary(value);
}

/**
 * Stable server-side comparison key for an item name and stated unit.
 * It is a matching guard, not a supplier-selection or ranking algorithm.
 */
export function normalizedItemKey(itemName: string, unitOfMeasure: string): string {
  const normalize = (value: string) => value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return `${normalize(itemName)}|${normalize(unitOfMeasure)}`;
}

/**
 * Returns a transparent cost view. Total cost is unknown unless the product,
 * delivery, and tax components are all known. Zero remains a known value.
 */
export function costBreakdown(input: {
  unitPrice: number;
  quantity: number;
  deliveryFee?: KnownMoney;
  taxAmount?: KnownMoney;
}): CostBreakdown {
  if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) {
    throw new Error("unitPrice must be a non-negative finite number");
  }
  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    throw new Error("quantity must be a positive integer");
  }

  const productCost = monetary(input.unitPrice * input.quantity);
  const deliveryCost = knownMoney(input.deliveryFee);
  const taxCost = knownMoney(input.taxAmount);
  const complete = deliveryCost !== null && taxCost !== null;

  return {
    productCost,
    deliveryCost,
    taxCost,
    totalCost: complete ? monetary(productCost + deliveryCost + taxCost) : null,
    totalCostState: complete ? "COMPLETE" : "INCOMPLETE",
  };
}

/**
 * Contract delivery/tax terms are not scaled or guessed for a different
 * quantity. Product cost can be compared by unit price; other components stay
 * unknown unless the requested quantity equals the contract rate quantity.
 */
export function baselineCostBreakdown(input: {
  unitPrice: number;
  rateQuantity: number;
  requestedQuantity: number;
  deliveryFee?: KnownMoney;
  taxAmount?: KnownMoney;
}): CostBreakdown {
  return costBreakdown({
    unitPrice: input.unitPrice,
    quantity: input.requestedQuantity,
    deliveryFee: input.rateQuantity === input.requestedQuantity ? input.deliveryFee : null,
    taxAmount: input.rateQuantity === input.requestedQuantity ? input.taxAmount : null,
  });
}

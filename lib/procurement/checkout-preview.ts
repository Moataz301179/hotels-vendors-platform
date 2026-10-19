import type { CostBreakdown } from '@/lib/procurement/pre-spend';

export type CheckoutFeeSettings = { platformFeeRate: number; minOrderFee: number; maxOrderFee: number };

/**
 * Calculates the transparent HotelsVendors bidding fee without moving money or
 * committing an order. Rates in PlatformSettings are stored as percentages.
 */
export function checkoutPreviewTotals(costs: CostBreakdown, settings: CheckoutFeeSettings) {
  if (costs.totalCost === null || costs.productCost === null) return null;
  const rate = Math.max(0, Number.isFinite(settings.platformFeeRate) ? settings.platformFeeRate : 0);
  let biddingFee = costs.productCost * (rate / 100);
  if (settings.minOrderFee > 0) biddingFee = Math.max(biddingFee, settings.minOrderFee);
  if (settings.maxOrderFee > 0) biddingFee = Math.min(biddingFee, settings.maxOrderFee);
  return {
    productSubtotal: costs.productCost,
    deliveryFee: costs.deliveryCost,
    taxAmount: costs.taxCost,
    biddingFee: Math.round(biddingFee * 100) / 100,
    biddingFeeRate: rate,
    orderTotal: Math.round((costs.totalCost + biddingFee) * 100) / 100,
  };
}

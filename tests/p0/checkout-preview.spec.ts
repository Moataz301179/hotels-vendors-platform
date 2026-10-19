import { describe, expect, it } from 'vitest';
import { checkoutPreviewTotals } from '@/lib/procurement/checkout-preview';

describe('controlled checkout fee preview', () => {
  it('shows the bidding fee before final order placement', () => {
    expect(checkoutPreviewTotals({ productCost: 1000, deliveryCost: 50, taxCost: 140, totalCost: 1190, totalCostState: 'KNOWN' }, { platformFeeRate: 2.5, minOrderFee: 0, maxOrderFee: 0 })).toEqual({ productSubtotal: 1000, deliveryFee: 50, taxAmount: 140, biddingFee: 25, biddingFeeRate: 2.5, orderTotal: 1215 });
  });

  it('does not turn incomplete quote totals into a checkout disclosure', () => {
    expect(checkoutPreviewTotals({ productCost: 1000, deliveryCost: null, taxCost: 140, totalCost: null, totalCostState: 'INCOMPLETE' }, { platformFeeRate: 2.5, minOrderFee: 0, maxOrderFee: 0 })).toBeNull();
  });
});

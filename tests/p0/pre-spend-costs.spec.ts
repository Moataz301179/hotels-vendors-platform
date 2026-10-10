import { describe, expect, it } from 'vitest';
import { costBreakdown } from '@/lib/procurement/pre-spend';

describe('pre-spend commercial totals', () => {
  it('separates stated product, delivery, tax, and total cost', () => {
    expect(costBreakdown({ unitPrice: '125.50', quantity: 4, deliveryFee: '20', taxAmount: '10' }))
      .toEqual({ productCost: 502, deliveryCost: 20, taxCost: 10, totalCost: 532, totalCostState: 'KNOWN' });
  });

  it('does not fabricate a total when delivery or tax is absent', () => {
    const cost = costBreakdown({ unitPrice: 100, quantity: 2, deliveryFee: 0 });
    expect(cost).toMatchObject({ productCost: 200, deliveryCost: 0, taxCost: null, totalCost: null, totalCostState: 'INCOMPLETE' });
    expect(cost).not.toHaveProperty('savings');
  });
});

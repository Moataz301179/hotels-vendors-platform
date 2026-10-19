import { describe, expect, it } from 'vitest';
import { publicMarketReference } from '@/lib/directory/public-market-reference';

describe('public market-reference mapper', () => {
  it('returns an observed price signal without leaking a source, supplier, or availability claim', () => {
    expect(publicMarketReference({
      marketReference: {
        price: 85,
        currency: 'EGP',
        observedAt: '2026-10-18T00:00:00.000Z',
        sourceUrl: 'https://private-source.example/product',
        supplierName: 'Private supplier',
        availability: 'In stock',
      },
    })).toEqual({
      price: 85,
      currency: 'EGP',
      observedAt: '2026-10-18T00:00:00.000Z',
      label: 'Observed market price',
      moq: null,
    });
  });

  it('carries an approved MOQ price without exposing its vendor or source', () => {
    expect(publicMarketReference({ marketReference: { price: 750, currency: 'EGP', observedAt: '2026-10-18T00:00:00.000Z', label: 'Published MOQ price', moq: 12, supplierName: 'Hidden vendor' } })).toEqual({
      price: 750, currency: 'EGP', observedAt: '2026-10-18T00:00:00.000Z', label: 'Published MOQ price', moq: 12,
    });
  });

  it('rejects malformed, stale-shape, or non-positive observed prices', () => {
    expect(publicMarketReference({ marketReference: { price: 0, currency: 'EGP', observedAt: '2026-10-18T00:00:00.000Z' } })).toBeNull();
    expect(publicMarketReference({ marketReference: { price: 85, observedAt: 'not-a-date' } })).toBeNull();
    expect(publicMarketReference({ marketReference: { price: '85', currency: 'EGP', observedAt: '2026-10-18T00:00:00.000Z' } })).toBeNull();
  });
});

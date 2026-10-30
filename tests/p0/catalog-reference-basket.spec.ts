import { describe, expect, it } from 'vitest';
import {
  addCatalogReferenceToBasket,
  parseCatalogReferenceBasket,
  removeCatalogReferenceBasketItems,
  setCatalogReferenceBasketQuantity,
} from '@/lib/procurement/catalog-reference-basket';

describe('catalogue-reference basket', () => {
  it('combines selections using opaque directory identifiers only', () => {
    const basket = addCatalogReferenceToBasket([], 'directory-reference-1', 2);
    const combined = addCatalogReferenceToBasket(basket, 'directory-reference-1', 3);
    expect(combined).toEqual([{ catalogReferenceId: 'directory-reference-1', quantity: 5 }]);
    expect(JSON.stringify(combined)).not.toMatch(/supplier|vendor|source|price|stock|tenant/i);
  });

  it('drops malformed persisted records and preserves valid basket quantities', () => {
    expect(parseCatalogReferenceBasket(JSON.stringify([
      { catalogReferenceId: 'directory-reference-1', quantity: 4 },
      { catalogReferenceId: '', quantity: 2 },
      { catalogReferenceId: 'directory-reference-2', quantity: 0 },
      { catalogReferenceId: 'directory-reference-3', quantity: '2' },
    ]))).toEqual([{ catalogReferenceId: 'directory-reference-1', quantity: 4 }]);
  });

  it('removes an item when the buyer sets its quantity to zero', () => {
    expect(setCatalogReferenceBasketQuantity([{ catalogReferenceId: 'directory-reference-1', quantity: 2 }], 'directory-reference-1', 0)).toEqual([]);
  });

  it('keeps a valid retry key but clears it when the submitted quantity changes', () => {
    const idempotencyKey = 'basket-retry-key-0001';
    expect(parseCatalogReferenceBasket(JSON.stringify([{ catalogReferenceId: 'directory-reference-1', quantity: 2, idempotencyKey }]))).toEqual([{ catalogReferenceId: 'directory-reference-1', quantity: 2, idempotencyKey }]);
    expect(setCatalogReferenceBasketQuantity([{ catalogReferenceId: 'directory-reference-1', quantity: 2, idempotencyKey }], 'directory-reference-1', 3)).toEqual([{ catalogReferenceId: 'directory-reference-1', quantity: 3, idempotencyKey: undefined }]);
  });

  it('keeps unsubmitted selections after a partial RFQ submission', () => {
    const basket = [
      { catalogReferenceId: 'directory-reference-1', quantity: 2 },
      { catalogReferenceId: 'directory-reference-2', quantity: 4 },
    ];
    expect(removeCatalogReferenceBasketItems(basket, ['directory-reference-1'])).toEqual([
      { catalogReferenceId: 'directory-reference-2', quantity: 4 },
    ]);
  });
});

import { describe, expect, it } from 'vitest';
import { addProductToRequestList, removeRecordedRequestListItems, setRequestListQuantity } from '@/lib/procurement/request-list';

describe('buyer request list', () => {
  const product = { id: 'catalog-product-1', name: 'Bath towel', sku: 'TOWEL-01', unitOfMeasure: 'piece' };

  it('combines repeated product selections without private source data', () => {
    const selected = addProductToRequestList([], product, 4);
    const combined = addProductToRequestList(selected, product, 2);
    expect(combined).toEqual([{ ...product, quantity: 6 }]);
    expect(JSON.stringify(combined)).not.toMatch(/supplier|source|tenant/i);
  });

  it('removes an item when its quantity is set to zero', () => {
    expect(setRequestListQuantity([{ ...product, quantity: 2 }], product.id, 0)).toEqual([]);
  });

  it('clears a retry key when the buyer changes a request-list quantity', () => {
    expect(setRequestListQuantity([{ ...product, quantity: 2, idempotencyKey: 'request-list-retry-0001' }], product.id, 3)).toEqual([{ ...product, quantity: 3, idempotencyKey: undefined }]);
  });

  it('keeps only unrecorded products after a partial submission', () => {
    const secondProduct = { id: 'catalog-product-2', name: 'Hand soap', sku: 'SOAP-01', unitOfMeasure: 'case' };
    const selected = addProductToRequestList(addProductToRequestList([], product, 3), secondProduct, 2);
    expect(removeRecordedRequestListItems(selected, [product.id])).toEqual([{ ...secondProduct, quantity: 2 }]);
  });
});

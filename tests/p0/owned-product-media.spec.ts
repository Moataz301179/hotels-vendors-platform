import { describe, expect, it } from 'vitest';
import { isSupplierOwnedProductMedia, productImage } from '@/lib/catalog/owned-product-media';

describe('supplier-owned product media', () => {
  it('allows secure product and source URLs on the verified supplier site or its subdomains', () => {
    expect(isSupplierOwnedProductMedia('https://cdn.supplier.example/items/towel.jpg', 'https://supplier.example/catalog/towel', 'https://supplier.example')).toBe(true);
  });

  it('rejects mixed hosts, insecure URLs, and credentials in URLs', () => {
    expect(isSupplierOwnedProductMedia('https://stock.example/towel.jpg', 'https://supplier.example/catalog/towel', 'https://supplier.example')).toBe(false);
    expect(isSupplierOwnedProductMedia('http://supplier.example/towel.jpg', 'https://supplier.example/catalog/towel', 'https://supplier.example')).toBe(false);
    expect(isSupplierOwnedProductMedia('https://supplier.example@attacker.example/towel.jpg', 'https://supplier.example/catalog/towel', 'https://supplier.example')).toBe(false);
  });

  it('does not derive an image from malformed or empty stored product data', () => {
    expect(productImage('not-json')).toBeNull();
    expect(productImage('[]')).toBeNull();
    expect(productImage(JSON.stringify(['https://supplier.example/towel.jpg']))).toBe('https://supplier.example/towel.jpg');
  });
});

import { describe, expect, it } from 'vitest';
import { firstPublicProductImageUrl, publicProductImageUrls } from '@/lib/catalog/public-product-images';

describe('published supplier product media', () => {
  it('returns safe URLs from both legacy strings and reviewed source records', () => {
    const media = JSON.stringify([
      'https://supplier.example/images/legacy.jpg',
      { url: 'https://supplier.example/images/reviewed.jpg', sourceUrl: 'https://supplier.example/products/towel' },
    ]);

    expect(publicProductImageUrls(media)).toEqual([
      'https://supplier.example/images/legacy.jpg',
      'https://supplier.example/images/reviewed.jpg',
    ]);
    expect(firstPublicProductImageUrl(media)).toBe('https://supplier.example/images/legacy.jpg');
  });

  it('does not expose invalid media values', () => {
    expect(publicProductImageUrls(JSON.stringify([
      'javascript:alert(1)',
      { url: '/private-image.jpg' },
      { sourceUrl: 'https://supplier.example/products/towel' },
    ]))).toEqual([]);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { discoverPublicCatalogJsonLd } from '@/lib/sourcing/scrapegraph-discovery';

describe('public catalogue JSON-LD fallback', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('extracts only observed structured product fields without a provider key', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(`
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Gastronorm Pan","sku":"GN-1","image":"https://catalog.example/pan.jpg","category":"Kitchen equipment","offers":{"@type":"Offer","price":"125.50","priceCurrency":"EGP","url":"https://catalog.example/pan"}}</script>
    `, { status: 200 })));
    const result = await discoverPublicCatalogJsonLd({ sourceUrl: 'https://catalog.example/kitchen' });
    expect(result.schemaVersion).toBe('hv-public-jsonld-v1');
    expect(result.products).toEqual([expect.objectContaining({ name: 'Gastronorm Pan', sku: 'GN-1', unitPrice: 125.5, currency: 'EGP', images: ['https://catalog.example/pan.jpg'] })]);
  });

  it('returns an empty result instead of inventing products from unstructured pages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<h1>Catalogue</h1>', { status: 200 })));
    await expect(discoverPublicCatalogJsonLd({ sourceUrl: 'https://catalog.example/catalogue' })).resolves.toMatchObject({ products: [] });
  });
});

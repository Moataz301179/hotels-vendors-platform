import { afterEach, describe, expect, it, vi } from 'vitest';
import { discoverPublicCatalogJsonLd } from '@/lib/sourcing/scrapegraph-discovery';

describe('public catalogue JSON-LD fallback', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('extracts only observed structured product fields without a provider key', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(`
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Gastronorm Pan","sku":"GN-1","image":"https://catalog.example/pan.jpg","category":"Kitchen equipment","offers":{"@type":"Offer","price":"125.50","priceCurrency":"EGP","url":"https://catalog.example/pan"}}</script>
    `, { status: 200 })));
    const result = await discoverPublicCatalogJsonLd({ sourceUrl: 'https://catalog.example/kitchen' });
    expect(result.schemaVersion).toBe('hv-public-jsonld-v3');
    expect(result.products).toEqual([expect.objectContaining({ name: 'Gastronorm Pan', sku: 'GN-1', unitPrice: 125.5, currency: 'EGP', images: ['https://catalog.example/pan.jpg'] })]);
  });

  it('returns an empty result instead of inventing products from unstructured pages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<h1>Catalogue</h1>', { status: 200 })));
    await expect(discoverPublicCatalogJsonLd({ sourceUrl: 'https://catalog.example/catalogue' })).resolves.toMatchObject({ products: [] });
  });

  it('follows bounded same-origin product-card links and keeps only JSON-LD facts', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(`
        <a class="woocommerce-LoopProduct-link" href="/products/tea-cups">Tea cups</a>
        <a class="woocommerce-LoopProduct-link" href="https://other.example/products/ignore">Ignore</a>
      `, { status: 200, headers: { 'content-type': 'text/html' } }))
      .mockResolvedValueOnce(new Response(`
        <script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Porcelain tea cups","image":"/images/tea-cups.jpg","url":"/products/tea-cups","offers":{"@type":"Offer","price":"300","priceCurrency":"EGP"}}</script>
      `, { status: 200, headers: { 'content-type': 'text/html' } })));

    const result = await discoverPublicCatalogJsonLd({ sourceUrl: 'https://catalog.example/shop' });

    expect(result.products).toEqual([expect.objectContaining({
      name: 'Porcelain tea cups',
      unitPrice: 300,
      productUrl: 'https://catalog.example/products/tea-cups',
      images: ['https://catalog.example/images/tea-cups.jpg'],
    })]);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenLastCalledWith('https://catalog.example/products/tea-cups', expect.any(Object));
  });

  it('reads observed WooCommerce detail fields when Product JSON-LD is absent', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response('<a href="https://catalog.example/product/hotel-towel/">Towel</a>', { status: 200 }))
      .mockResolvedValueOnce(new Response(`
        <link rel="canonical" href="https://catalog.example/product/hotel-towel/" />
        <h1 class="product_title entry-title">Hotel towel</h1>
        <div class="availability stock in-stock"><span class="availability-text">In stock</span></div>
        <span class="cat-links">Categories: Guest linen</span><span class="sku">LIN-101</span>
        <div class="woocommerce-product-gallery"><img src="/images/towel.jpg" /></div>
      `, { status: 200 })));

    const result = await discoverPublicCatalogJsonLd({ sourceUrl: 'https://catalog.example/shop' });

    expect(result.products).toEqual([expect.objectContaining({
      name: 'Hotel towel', sku: 'LIN-101', category: 'Guest linen', stockQuantity: 1,
      productUrl: 'https://catalog.example/product/hotel-towel/', images: ['https://catalog.example/images/towel.jpg'], unitPrice: null,
    })]);
  });

  it('reads public product data from a Next Flight payload without evaluating scripts', async () => {
    const flight = JSON.stringify('a:["$","$L14",null,{"products":[{"id":"17","nameEn":"Olive oil","category":"Oil & Ghee","pricePerPiece":99.5,"caseCount":12,"packSize":"Case of 12","image":"https://catalog.example/oil.png","isSoldOut":false}]}]');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      `<script>self.__next_f.push([1,${flight}])</script>`, { status: 200 },
    )));

    const result = await discoverPublicCatalogJsonLd({ sourceUrl: 'https://catalog.example/products' });

    expect(result.products).toEqual([expect.objectContaining({
      externalId: '17', name: 'Olive oil', category: 'Oil & Ghee', unitPrice: 99.5, moq: 12,
      productUrl: 'https://catalog.example/products/17', images: ['https://catalog.example/oil.png'],
    })]);
  });
});

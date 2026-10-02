'use client';

import { useEffect, useState } from 'react';

type CatalogProduct = {
  id: string; name: string; category: string; unitPrice?: string | number | null;
  supplier?: { name: string; isVerified?: boolean } | null;
};
type CatalogResponse = { products?: CatalogProduct[] };

export function Marketplace() {
  const [products, setProducts] = useState<CatalogProduct[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/api/v2/marketplace').then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: CatalogResponse) => { if (active) setProducts(Array.isArray(data.products) ? data.products : []); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);

  if (error) return <div className="card" style={{ padding: 28, marginTop: 30 }}>Unable to load procurement data. Retry after checking the service.</div>;
  if (products === null) return <div className="card" style={{ padding: 28, marginTop: 30 }}>Loading live catalog…</div>;
  if (!products.length) return <div className="card" style={{ padding: 42, marginTop: 30, textAlign: 'center' }}><div className="eyebrow">No active supply records</div><h2 style={{ margin: '12px 0' }}>The marketplace is empty because there are no active product records.</h2><p className="muted" style={{ fontSize: 13 }}>No demo products are injected into the interface.</p></div>;

  return <div className="grid3" style={{ marginTop: 30 }}>
    {products.map((product) => <article className="card" style={{ padding: 22 }} key={product.id}>
      <span className="pill">{product.category}</span>
      <h3 style={{ margin: '14px 0 6px' }}>{product.name}</h3>
      <p className="muted" style={{ fontSize: 12 }}>{product.supplier?.name || 'Supplier details unavailable'}</p>
      <strong>{product.unitPrice != null ? `${product.unitPrice} EGP` : 'Quote required'}</strong>
      <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>Catalog preview — RFQ submission is not yet available in this workspace.</p>
    </article>)}
  </div>;
}

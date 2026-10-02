'use client';

import { useEffect, useState } from 'react';

type CatalogProduct = {
  id: string;
  name: string;
  category: string;
  unitPrice?: string | number | null;
  supplier?: { id: string; name: string; isVerified?: boolean } | null;
};
type CatalogResponse = { products?: CatalogProduct[] };
type Rfq = { id: string; productId: string; supplierId: string; requestedQty: number; status: string; targetPrice?: string | number | null; createdAt: string };
type RfqResponse = { rfqs?: Rfq[] };

export function Marketplace() {
  const [products, setProducts] = useState<CatalogProduct[] | null>(null);
  const [rfqs, setRfqs] = useState<Rfq[] | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<CatalogProduct | null>(null);
  const [qty, setQty] = useState(1);
  const [targetPrice, setTargetPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  async function fetchData() {
    const [catalogResponse, rfqResponse] = await Promise.all([
      fetch('/api/v2/marketplace'),
      fetch('/api/v2/rfqs'),
    ]);
    if (!catalogResponse.ok || !rfqResponse.ok) throw new Error('load failed');
    const catalog = await catalogResponse.json() as CatalogResponse;
    const requests = await rfqResponse.json() as RfqResponse;
    return {
      products: Array.isArray(catalog.products) ? catalog.products : [],
      rfqs: Array.isArray(requests.rfqs) ? requests.rfqs : [],
    };
  }

  async function load() {
    const data = await fetchData();
    setProducts(data.products);
    setRfqs(data.rfqs);
  }

  useEffect(() => {
    let active = true;
    fetchData()
      .then((data) => {
        if (!active) return;
        setProducts(data.products);
        setRfqs(data.rfqs);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => { active = false; };
  }, []);

  async function submitRfq() {
    if (!selected || qty < 1) return;
    setSubmitting(true);
    setMessage('');
    try {
      const response = await fetch('/api/v2/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selected.id,
          requestedQty: qty,
          targetPrice: targetPrice ? Number(targetPrice) : undefined,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || body.error || 'RFQ failed');
      setSelected(null);
      setQty(1);
      setTargetPrice('');
      setMessage('RFQ created and recorded. The supplier can now respond.');
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to create RFQ.');
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <div className="card" style={{ padding: 28, marginTop: 30 }}>Unable to load procurement data. Retry after checking the service.</div>;
  if (products === null) return <div className="card" style={{ padding: 28, marginTop: 30 }}>Loading live procurement data…</div>;
  if (!products.length) return <div className="card" style={{ padding: 42, marginTop: 30, textAlign: 'center' }}><div className="eyebrow">No active supply records</div><h2 style={{ margin: '12px 0' }}>The marketplace is empty because there are no active product records.</h2><p className="muted" style={{ fontSize: 13 }}>No demo products are injected into the interface.</p></div>;

  return <>
    {message && <div className="card" role="status" style={{ padding: 16, marginTop: 20 }}>{message}</div>}
    <div className="grid3" style={{ marginTop: 30 }}>
      {products.map((product) => <article className="card" style={{ padding: 22 }} key={product.id}>
        <span className="pill">{product.category}</span>
        <h3 style={{ margin: '14px 0 6px' }}>{product.name}</h3>
        <p className="muted" style={{ fontSize: 12 }}>{product.supplier?.name || 'Supplier details unavailable'}</p>
        <strong>{product.unitPrice != null ? String(product.unitPrice) + ' EGP' : 'Quote required'}</strong>
        <button className="btn btn-blue" style={{ marginTop: 16, width: '100%' }} onClick={() => setSelected(product)}>Request quote</button>
      </article>)}
    </div>

    {rfqs?.length ? <section className="section" style={{ paddingTop: 42 }}>
      <div className="eyebrow">Procurement activity</div>
      <h2 style={{ margin: '8px 0 18px' }}>Recent RFQs</h2>
      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="table"><thead><tr><th>Product</th><th>Quantity</th><th>Status</th><th>Created</th></tr></thead>
          <tbody>{rfqs.map((rfq) => <tr key={rfq.id}><td>{products.find((p) => p.id === rfq.productId)?.name || rfq.productId}</td><td>{rfq.requestedQty}</td><td><span className="pill">{rfq.status}</span></td><td>{new Date(rfq.createdAt).toLocaleDateString()}</td></tr>)}</tbody>
        </table>
      </div>
    </section> : null}

    {selected && <div className="card" style={{ marginTop: 28, padding: 24 }}>
      <div className="eyebrow">New RFQ</div>
      <h2 style={{ margin: '8px 0' }}>{selected.name}</h2>
      <p className="muted">Supplier: {selected.supplier?.name || 'Verified supplier'}</p>
      <div style={{ display: 'grid', gap: 12, maxWidth: 420, marginTop: 18 }}>
        <label>Quantity<input className="input" type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} /></label>
        <label>Target unit price (optional)<input className="input" type="number" min={0} step="0.01" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} /></label>
        <div style={{ display: 'flex', gap: 10 }}><button className="btn btn-blue" disabled={submitting} onClick={submitRfq}>{submitting ? 'Creating…' : 'Create RFQ'}</button><button className="btn" onClick={() => setSelected(null)}>Cancel</button></div>
      </div>
    </div>}
  </>;
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { requestJson } from '@/lib/v2-http';
import { addProductToRequestList, removeRecordedRequestListItems, setRequestListQuantity, type RequestListItem } from '@/lib/procurement/request-list';

type Product = { id: string; name: string; sku: string; category: string; images: string[]; unitOfMeasure: string; requestForQuote: boolean };
type Quote = { id: string; reference: string; quantity: number; currency: string; validUntil: string | null; rfq: { id: string; requestedQty: number; status: string; responseDeadline?: string | null; product: { id: string; name: string; sku: string; unitOfMeasure: string } | null }; cost: { productCost: number | null; deliveryCost: number | null; taxCost: number | null; totalCost: number | null; totalCostState: 'KNOWN' | 'INCOMPLETE' } };
type SourcingRequirement = { id: string; itemName: string | null; unitOfMeasure: string | null; requestedQty: number; status: string; matchingStatus: string; deliveryLocation: string | null; createdAt: string };
type MarketOffer = { reference: string; productName: string; unitPrice?: number | null; currency?: string; packSize?: string; leadTimeDays?: number | null };
type MarketCompareResponse = { comparison: { offers: MarketOffer[] } };

function ProductVisual({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);
  const image = product.images[0];
  if (!image || failed) return <div aria-label="Product image unavailable" style={{ aspectRatio: '4 / 3', display: 'grid', placeItems: 'center', background: '#e8edf0', borderBottom: '1px solid #d7e0e4', color: '#52636d', fontSize: 12, padding: 18, textAlign: 'center' }}>Product image unavailable</div>;
  return <div style={{ aspectRatio: '4 / 3', overflow: 'hidden', background: '#e8edf0', borderBottom: '1px solid #d7e0e4' }}><img src={image} alt={product.name} loading="lazy" onError={() => setFailed(true)} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} /></div>;
}

export function ProcurementConsole() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [requirements, setRequirements] = useState<SourcingRequirement[]>([]);
  const [q, setQ] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [qty, setQty] = useState(1);
  const [requirement, setRequirement] = useState({ itemName: '', unitOfMeasure: 'piece', quantity: 1, deliveryLocation: '', responseWindowHours: 24, notes: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [marketOffers, setMarketOffers] = useState<MarketOffer[]>([]);
  const [requestList, setRequestList] = useState<RequestListItem[]>([]);

  async function load() {
    setBusy(true);
    try {
      const [p, c, r] = await Promise.all([
        requestJson<{ products: Product[] }>('/api/v2/marketplace?q=' + encodeURIComponent(q)),
        requestJson<{ quotes: Quote[] }>('/api/v2/quotes'),
        requestJson<{ rfqs: SourcingRequirement[] }>('/api/v2/rfq'),
      ]);
      setProducts(p.products); setQuotes(c.quotes); setRequirements(r.rfqs); setError('');
    } catch (loadError) { setError((loadError as Error).message); } finally { setBusy(false); }
  }

  useEffect(() => {
    let active = true;
    const initialProduct = new URL(window.location.href).searchParams.get('product') ?? '';
    Promise.all([
      requestJson<{ products: Product[] }>('/api/v2/marketplace?q=' + encodeURIComponent(initialProduct)),
      requestJson<{ quotes: Quote[] }>('/api/v2/quotes'),
      requestJson<{ rfqs: SourcingRequirement[] }>('/api/v2/rfq'),
    ]).then(([p, c, r]) => { if (active) { setQ(initialProduct); setProducts(p.products); setQuotes(c.quotes); setRequirements(r.rfqs); } }).catch((loadError) => { if (active) setError((loadError as Error).message); });
    return () => { active = false; };
  }, []);

  async function compare() {
    setBusy(true); setMarketOffers([]); setError('');
    try {
      const result = await requestJson<MarketCompareResponse>('/api/v2/marketplace/compare', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query: q, quantity: qty }) });
      setMarketOffers(result.comparison.offers);
      if (!result.comparison.offers.length) setMsg('No comparable public observations matched. Nothing was invented.');
    } catch (compareError) { setError((compareError as Error).message); } finally { setBusy(false); }
  }

  async function act(url: string, body: object, kind: 'rfq' | 'order') {
    setBusy(true); setMsg('');
    try {
      const result = await requestJson<{ order?: { orderNumber: string } }>(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      setMsg(kind === 'rfq' ? 'Sealed sourcing request recorded. Comparable terms appear after vendors respond or the response window closes.' : `Order ${result.order?.orderNumber} recorded for approval.`);
      await load();
    } catch (actionError) { setMsg((actionError as Error).message); } finally { setBusy(false); }
  }

  async function submitRequirement(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMsg('');
    try {
      await requestJson('/api/v2/rfq', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(requirement) });
      setRequirement({ itemName: '', unitOfMeasure: 'piece', quantity: 1, deliveryLocation: '', responseWindowHours: 24, notes: '' });
      setMsg('Requirement recorded in the sealed sourcing queue. It is not sent to an unverified vendor.'); await load();
    } catch (submitError) { setError((submitError as Error).message); } finally { setBusy(false); }
  }

  function addToRequestList(product: Product) {
    setRequestList((current) => addProductToRequestList(current, product, qty));
    setMsg(`${product.name} was added to your request list.`);
  }

  async function submitRequestList() {
    if (!requestList.length) return;
    setBusy(true); setError(''); setMsg('');
    const recordedProductIds: string[] = [];
    try {
      for (const item of requestList) {
        await requestJson('/api/v2/rfq', {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ productId: item.id, quantity: item.quantity }),
        });
        recordedProductIds.push(item.id);
      }
      setRequestList((current) => removeRecordedRequestListItems(current, recordedProductIds));
      setMsg('Your sealed sourcing requests were recorded. Commercial responses appear here after they are received.');
      await load();
    } catch (submitError) {
      if (recordedProductIds.length) {
        setRequestList((current) => removeRecordedRequestListItems(current, recordedProductIds));
        setError(`${recordedProductIds.length} request${recordedProductIds.length === 1 ? '' : 's'} were recorded. The remaining selections stayed in your list so they are not submitted twice.`);
        await load();
      } else {
        setError(submitError instanceof Error ? submitError.message : 'Unable to record one or more sourcing requests.');
      }
    } finally { setBusy(false); }
  }

  const availableCategories = [...new Set((products ?? []).map((product) => product.category))].sort();
  const visibleProducts = products?.filter((product) => !selectedCategory || product.category === selectedCategory);

  return <section style={{ marginTop: 28 }}>
    <form className="card" onSubmit={(event) => { event.preventDefault(); void load(); }} style={{ padding: 18, display: 'flex', gap: 14, alignItems: 'end', flexWrap: 'wrap' }}>
      <label style={{ flex: 1, minWidth: 180 }}>Search catalog<input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Product name or SKU" style={{ display: 'block', width: '100%', padding: 12, marginTop: 6 }} /></label>
      <label>Quantity<input type="number" min={1} step={1} value={qty} onChange={(event) => setQty(Number(event.target.value))} style={{ display: 'block', width: 90, padding: 12, marginTop: 6 }} /></label>
      <button className="btn btn-blue" disabled={busy}>Search catalog</button>
      <button type="button" className="btn btn-ghost" disabled={busy || q.trim().length < 2} onClick={() => void compare()}>Compare recorded market references</button>
    </form>
    {availableCategories.length > 0 && <section className="workspace-catalog-browse" aria-label="Browse reviewed catalogue by category"><div><div className="eyebrow">Browse without typing</div><p className="muted">Choose a category to narrow the reviewed catalogue, then add items to your sourcing list.</p></div><div className="workspace-filter-chips" role="list"><button type="button" className={`btn ${selectedCategory ? 'btn-ghost' : 'btn-blue'}`} onClick={() => setSelectedCategory('')} aria-pressed={!selectedCategory}>All categories</button>{availableCategories.map((category) => <button type="button" key={category} className={`btn ${selectedCategory === category ? 'btn-blue' : 'btn-ghost'}`} onClick={() => setSelectedCategory(category)} aria-pressed={selectedCategory === category}>{category.replaceAll('_', ' ')}</button>)}</div></section>}
    {error && <div className="workspace-status" role="alert">{error} <button className="btn btn-ghost" onClick={() => void load()}>Retry</button></div>}
    {msg && <div className="workspace-status" role="status">{msg} <Link href="/orders">View orders</Link></div>}

    <section className="card workspace-request-list" aria-labelledby="request-list-title">
      <div><div className="eyebrow">Your sourcing list</div><h2 id="request-list-title">Choose products, then send one clear request list.</h2><p className="muted">Selections create sealed RFQs. Vendors cannot see each other’s terms; nothing creates a purchase order until your approval.</p></div>
      {requestList.length ? <><div className="workspace-request-list-items">{requestList.map((item) => <div key={item.id} className="workspace-request-list-item"><div><strong>{item.name}</strong><small>{item.sku} · {item.unitOfMeasure}</small></div><div className="workspace-quantity-control" aria-label={`Quantity for ${item.name}`}><button type="button" onClick={() => setRequestList((current) => setRequestListQuantity(current, item.id, item.quantity - 1))} aria-label={`Decrease ${item.name} quantity`}>−</button><span>{item.quantity}</span><button type="button" onClick={() => setRequestList((current) => setRequestListQuantity(current, item.id, item.quantity + 1))} aria-label={`Increase ${item.name} quantity`}>+</button></div><button type="button" className="btn btn-ghost" onClick={() => setRequestList((current) => setRequestListQuantity(current, item.id, 0))}>Remove</button></div>)}</div><button className="btn btn-blue" disabled={busy} onClick={() => void submitRequestList()}>{busy ? 'Recording requests…' : `Send ${requestList.length} sourcing request${requestList.length === 1 ? '' : 's'}`}</button></> : <div className="workspace-empty"><strong>No products selected yet.</strong><p>Use “Add to request list” on a catalog card, then adjust the quantity here without retyping the item.</p></div>}
    </section>

    <section className="card" style={{ padding: 24, marginTop: 18 }}><div className="eyebrow">Exception intake</div><h2>Need an item that is not listed?</h2><p className="muted">Record the specification once; it enters a controlled sealed sourcing queue and is never represented as a published product.</p><form onSubmit={(event) => void submitRequirement(event)} className="workspace-form"><label>Item or specification<input required maxLength={240} value={requirement.itemName} onChange={(event) => setRequirement({ ...requirement, itemName: event.target.value })} placeholder="e.g. Hotel-grade bath towel, 70 × 140 cm" /></label><label>Unit of measure<input required maxLength={80} value={requirement.unitOfMeasure} onChange={(event) => setRequirement({ ...requirement, unitOfMeasure: event.target.value })} placeholder="piece, carton, case" /></label><label>Quantity<input required type="number" min={1} step={1} value={requirement.quantity} onChange={(event) => setRequirement({ ...requirement, quantity: Number(event.target.value) })} /></label><label>Response window<select value={requirement.responseWindowHours} onChange={(event) => setRequirement({ ...requirement, responseWindowHours: Number(event.target.value) })}><option value={4}>Same day — 4 hours</option><option value={24}>Planned — 1 business day</option><option value={72}>Technical / complex — 3 days</option></select></label><label>Delivery location <span className="muted">(optional)</span><input maxLength={240} value={requirement.deliveryLocation} onChange={(event) => setRequirement({ ...requirement, deliveryLocation: event.target.value })} /></label><label>Requirement notes <span className="muted">(optional)</span><input maxLength={2000} value={requirement.notes} onChange={(event) => setRequirement({ ...requirement, notes: event.target.value })} /></label><button className="btn btn-blue" disabled={busy || !requirement.itemName.trim() || !requirement.unitOfMeasure.trim() || !Number.isInteger(requirement.quantity) || requirement.quantity < 1}>{busy ? 'Recording…' : 'Send to sealed sourcing queue'}</button></form>{requirements.filter((item) => item.itemName !== null).length > 0 && <div style={{ overflowX: 'auto', marginTop: 20 }}><table className="table"><thead><tr><th>Requirement</th><th>Quantity</th><th>Matching</th><th>Status</th><th>Recorded</th></tr></thead><tbody>{requirements.filter((item) => item.itemName !== null).map((item) => <tr key={item.id}><td><strong>{item.itemName || 'Unlisted requirement'}</strong><br /><small className="muted">{item.unitOfMeasure || 'unit not stated'}{item.deliveryLocation ? ` · ${item.deliveryLocation}` : ''}</small></td><td>{item.requestedQty}</td><td>{item.matchingStatus.replaceAll('_', ' ')}</td><td>{item.status.replaceAll('_', ' ')}</td><td>{new Date(item.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>}</section>

    {marketOffers.length > 0 && <section className="card" style={{ padding: 24, marginTop: 18 }}><h2>Comparable market references</h2><p className="muted">Recorded public observations for research. They are not live offers; verify terms through an RFQ before buying.</p><div style={{ overflowX: 'auto' }}><table className="table"><thead><tr><th>Reference</th><th>Product</th><th>Observed price</th><th>Pack / delivery window</th></tr></thead><tbody>{marketOffers.map((offer) => <tr key={offer.reference}><td>{offer.reference}</td><td><strong>{offer.productName}</strong></td><td>{offer.unitPrice === null || offer.unitPrice === undefined ? 'Not stated' : `${offer.unitPrice.toLocaleString()} ${offer.currency || 'EGP'}`}</td><td>{offer.packSize || 'Not stated'} · {offer.leadTimeDays == null ? 'Not stated' : `${offer.leadTimeDays} days`}</td></tr>)}</tbody></table></div></section>}
    {!error && products === null ? <p role="status">Loading catalog…</p> : <div className="grid3" style={{ marginTop: 18 }}>{visibleProducts?.map((product) => <article className="card" style={{ padding: 0, overflow: 'hidden' }} key={product.id}><ProductVisual product={product} /><div style={{ padding: 20 }}><span className="pill">{product.category.replaceAll('_', ' ')}</span><h3>{product.name}</h3><p className="muted">{product.sku} · {product.unitOfMeasure}</p><strong>Request for quote</strong><div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}><button className="btn btn-blue" disabled={busy || !Number.isInteger(qty) || qty < 1} onClick={() => void addToRequestList(product)}>Add to request list</button><button className="btn btn-ghost" disabled={busy || !Number.isInteger(qty) || qty < 1} onClick={() => void act('/api/v2/rfq', { productId: product.id, quantity: qty }, 'rfq')}>Request now</button></div><small className="muted" style={{ display: 'block', marginTop: 10 }}>Commercial terms are evaluated as anonymized comparable offers.</small></div></article>)}</div>}
    {!error && products?.length === 0 && <div className="workspace-status"><h2>No verified listings match.</h2><p>Try another search, review market references, or record a controlled sourcing requirement.</p></div>}
    {!error && products && products.length > 0 && visibleProducts?.length === 0 && <div className="workspace-status"><h2>No reviewed listings in this category yet.</h2><p>Choose another category or record a controlled sourcing requirement.</p></div>}
    <section className="card" style={{ padding: 24, marginTop: 24 }}><h2>Sealed comparable responses</h2><p className="muted">Offers are anonymous and not ranked only by price. Review delivered total, tax, timing and specification fit; select after the response window closes.</p><div style={{ overflowX: 'auto' }}><table className="table"><thead><tr><th>Reference</th><th>Requested product</th><th>Quantity</th><th>Product cost</th><th>Delivery</th><th>Tax</th><th>Total</th><th>Status</th><th>Action</th></tr></thead><tbody>{quotes.map((quote) => { const responseWindowOpen = Boolean(quote.rfq.responseDeadline && new Date(quote.rfq.responseDeadline) > new Date()); return <tr key={quote.id}><td><strong>{quote.reference}</strong></td><td><strong>{quote.rfq.product?.name || 'Product record unavailable'}</strong><br /><small className="muted">{quote.rfq.product?.sku || 'SKU unavailable'} · {quote.rfq.product?.unitOfMeasure || 'unit not stated'}</small></td><td>{quote.quantity}</td><td>{quote.cost.productCost === null ? 'Not stated' : quote.cost.productCost.toLocaleString()} {quote.currency}</td><td>{quote.cost.deliveryCost === null ? 'Not stated' : quote.cost.deliveryCost.toLocaleString()}</td><td>{quote.cost.taxCost === null ? 'Not stated' : quote.cost.taxCost.toLocaleString()}</td><td>{quote.cost.totalCost === null ? 'Incomplete' : quote.cost.totalCost.toLocaleString()}</td><td>{responseWindowOpen ? 'Responses open' : quote.rfq.status}</td><td>{quote.rfq.status === 'QUOTED' && !responseWindowOpen && quote.cost.totalCost !== null && (!quote.validUntil || new Date(quote.validUntil) > new Date()) && <button className="btn btn-blue" disabled={busy} onClick={() => void act('/api/v2/quotes/accept', { quoteId: quote.id }, 'order')}>Select for approval</button>}</td></tr>; })}</tbody></table>{!quotes.length && !error && <p className="muted">No commercial responses received yet. Comparable terms appear after a vendor responds.</p>}</div></section>
  </section>;
}

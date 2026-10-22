'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { requestJson } from '@/lib/v2-http';

type CatalogueReference = {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  unitOfMeasure: string | null;
  purchaseUnit: string | null;
};

type DirectoryResponse = { profiles: CatalogueReference[] };

/**
 * A private B2B requirement basket. It deliberately has no price, stock,
 * Vendor, or checkout-payment fields: the next committed action is an RFQ.
 */
export function RequirementBasket() {
  const [reference, setReference] = useState<CatalogueReference | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [responseWindowHours, setResponseWindowHours] = useState(24);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'submitting' | 'complete' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    const catalogReferenceId = new URL(window.location.href).searchParams.get('catalogReference')?.trim();
    if (!catalogReferenceId) {
      setMessage('Choose a reviewed catalogue reference before starting a sourcing request.');
      setStatus('error');
      return () => { active = false; };
    }
    requestJson<DirectoryResponse>(`/api/v2/directory?id=${encodeURIComponent(catalogReferenceId)}`)
      .then(({ profiles }) => {
        if (!active) return;
        const selected = profiles[0] ?? null;
        if (!selected) {
          setMessage('That catalogue reference is no longer available.');
          setStatus('error');
          return;
        }
        setReference(selected);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : 'Unable to load the selected catalogue reference.');
        setStatus('error');
      });
    return () => { active = false; };
  }, []);

  async function createRfq(event: React.FormEvent) {
    event.preventDefault();
    if (!reference || !Number.isInteger(quantity) || quantity < 1) return;
    setStatus('submitting'); setMessage('');
    try {
      await requestJson('/api/v2/rfq', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ catalogReferenceId: reference.id, quantity, deliveryLocation: deliveryLocation || undefined, responseWindowHours, notes: notes || undefined }),
      });
      setStatus('complete');
      setMessage('Sealed sourcing request created. Commercial matching starts only in the authorised workflow.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to create the sourcing request.');
    }
  }

  return <section className="requirement-basket" aria-labelledby="requirement-basket-title">
    <header className="workspace-page-header"><div className="workspace-page-header-copy"><div className="eyebrow">Requirement basket</div><h1 id="requirement-basket-title">Confirm the requirement.</h1><p className="workspace-page-lead muted">A request basket is not a consumer checkout. It records your operational need before any commercial matching, order, or invoice exists.</p></div></header>
    {status === 'loading' ? <p role="status">Loading selected reference…</p> : null}
    {status === 'error' && !reference ? <section className="workspace-status" role="alert"><p>{message}</p><Link className="btn btn-dark" href="/marketplace">Return to catalogue</Link></section> : null}
    {reference ? <form className="card workspace-form" onSubmit={(event) => void createRfq(event)} style={{ padding: 24 }}>
      <div style={{ gridColumn: '1 / -1' }}><span className="pill">{reference.category}{reference.subcategory ? ` · ${reference.subcategory}` : ''}</span><h2>{reference.name}</h2><p className="muted">Procurement unit: {reference.purchaseUnit ?? reference.unitOfMeasure ?? 'Specify with request'}</p></div>
      <label>Quantity<input type="number" required min={1} step={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></label>
      <label>Response window<select value={responseWindowHours} onChange={(event) => setResponseWindowHours(Number(event.target.value))}><option value={4}>Same day — 4 hours</option><option value={24}>Planned — 1 business day</option><option value={72}>Technical / complex — 3 days</option></select></label>
      <label>Delivery location <span className="muted">(optional)</span><input maxLength={240} value={deliveryLocation} onChange={(event) => setDeliveryLocation(event.target.value)} /></label>
      <label>Requirement notes <span className="muted">(optional)</span><input maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, flexWrap: 'wrap' }}><button className="btn btn-blue" disabled={status === 'submitting' || status === 'complete'}>{status === 'submitting' ? 'Creating request…' : status === 'complete' ? 'Request created' : 'Create sealed sourcing request'}</button><Link className="btn btn-ghost" href="/marketplace">Back to catalogue</Link></div>
      {message ? <p className="workspace-status" role={status === 'error' ? 'alert' : 'status'} style={{ gridColumn: '1 / -1', margin: 0 }}>{message}{status === 'complete' ? <> <Link href="/workspace/marketplace">Open sourcing workspace</Link></> : null}</p> : null}
    </form> : null}
  </section>;
}

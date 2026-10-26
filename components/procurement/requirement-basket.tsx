'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { requestJson } from '@/lib/v2-http';
import {
  addCatalogReferenceToBasket,
  persistCatalogReferenceBasket,
  readCatalogReferenceBasket,
  removeCatalogReferenceBasketItems,
  setCatalogReferenceBasketQuantity,
  type CatalogReferenceBasketItem,
} from '@/lib/procurement/catalog-reference-basket';

type CatalogueReference = {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  unitOfMeasure: string | null;
  purchaseUnit: string | null;
};

type DirectoryResponse = { profiles: CatalogueReference[] };
type Status = 'loading' | 'ready' | 'submitting' | 'complete' | 'error';

/**
 * A private B2B requirement basket. It keeps only reviewed reference IDs and
 * quantities in the browser, rehydrates public specifications after sign-in,
 * and creates sealed RFQs rather than consumer payment orders.
 */
export function RequirementBasket() {
  const [items, setItems] = useState<CatalogReferenceBasketItem[]>([]);
  const [references, setReferences] = useState<Record<string, CatalogueReference>>({});
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [responseWindowHours, setResponseWindowHours] = useState(24);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  function updateItems(next: CatalogReferenceBasketItem[]) {
    setItems(next);
    persistCatalogReferenceBasket(next);
  }

  useEffect(() => {
    let active = true;
    const selectedReference = new URL(window.location.href).searchParams.get('catalogReference')?.trim();
    const storedItems = readCatalogReferenceBasket();
    const initialItems = selectedReference && !storedItems.some((item) => item.catalogReferenceId === selectedReference)
      ? addCatalogReferenceToBasket(storedItems, selectedReference)
      : storedItems;
    persistCatalogReferenceBasket(initialItems);
    setItems(initialItems);

    if (!initialItems.length) {
      setMessage('Choose reviewed catalogue references before starting a sourcing request.');
      setStatus('ready');
      return () => { active = false; };
    }

    Promise.all(initialItems.map(async (item) => {
      const response = await requestJson<DirectoryResponse>(`/api/v2/directory?id=${encodeURIComponent(item.catalogReferenceId)}`);
      return [item.catalogReferenceId, response.profiles[0] ?? null] as const;
    })).then((resolved) => {
      if (!active) return;
      const visible = Object.fromEntries(resolved.filter((entry): entry is [string, CatalogueReference] => entry[1] !== null));
      const unavailable = resolved.filter(([, entry]) => entry === null).map(([id]) => id);
      const retained = unavailable.length ? removeCatalogReferenceBasketItems(initialItems, unavailable) : initialItems;
      if (unavailable.length) persistCatalogReferenceBasket(retained);
      setItems(retained);
      setReferences(visible);
      setMessage(unavailable.length ? `${unavailable.length} unavailable reference${unavailable.length === 1 ? ' was' : 's were'} removed from this basket.` : '');
      setStatus('ready');
    }).catch((error: unknown) => {
      if (!active) return;
      setMessage(error instanceof Error ? error.message : 'Unable to load the selected catalogue references.');
      setStatus('error');
    });
    return () => { active = false; };
  }, []);

  const resolvedItems = useMemo(() => items.flatMap((item) => {
    const reference = references[item.catalogReferenceId];
    return reference ? [{ ...item, reference }] : [];
  }), [items, references]);

  async function createRfqs(event: React.FormEvent) {
    event.preventDefault();
    if (!resolvedItems.length) return;
    setStatus('submitting');
    setMessage('');
    const recordedIds: string[] = [];
    try {
      for (const item of resolvedItems) {
        await requestJson('/api/v2/rfq', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            catalogReferenceId: item.catalogReferenceId,
            quantity: item.quantity,
            deliveryLocation: deliveryLocation || undefined,
            responseWindowHours,
            notes: notes || undefined,
          }),
        });
        recordedIds.push(item.catalogReferenceId);
      }
      updateItems(removeCatalogReferenceBasketItems(items, recordedIds));
      setStatus('complete');
      setMessage(`${recordedIds.length} sealed sourcing request${recordedIds.length === 1 ? '' : 's'} created. Commercial matching starts only in the authorised workflow.`);
    } catch (error) {
      if (recordedIds.length) {
        updateItems(removeCatalogReferenceBasketItems(items, recordedIds));
        setStatus('error');
        setMessage(`${recordedIds.length} request${recordedIds.length === 1 ? '' : 's'} were created. The remaining selections stayed in the basket and were not submitted twice.`);
      } else {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Unable to create the sourcing requests.');
      }
    }
  }

  return <section className="requirement-basket" aria-labelledby="requirement-basket-title">
    <header className="workspace-page-header"><div className="workspace-page-header-copy"><div className="eyebrow">Requirement basket</div><h1 id="requirement-basket-title">Confirm the requirement list.</h1><p className="workspace-page-lead muted">This is a B2B sourcing basket—not consumer checkout. It records operational needs before commercial matching, purchase orders, or invoices exist.</p></div></header>
    {status === 'loading' ? <p role="status">Loading selected references…</p> : null}
    {status === 'error' && !resolvedItems.length ? <section className="workspace-status" role="alert"><p>{message}</p><Link className="btn btn-dark" href="/marketplace">Return to catalogue</Link></section> : null}
    {status !== 'loading' && resolvedItems.length ? <form className="card workspace-form" onSubmit={(event) => void createRfqs(event)} style={{ padding: 24 }}>
      <div style={{ gridColumn: '1 / -1' }}><div className="eyebrow">Selected references</div><h2>{resolvedItems.length} item{resolvedItems.length === 1 ? '' : 's'} ready for sourcing</h2><p className="muted">Each item becomes its own sealed RFQ so specifications, matching and approval stay traceable.</p></div>
      <div className="workspace-request-list-items" style={{ gridColumn: '1 / -1' }}>
        {resolvedItems.map((item) => <div className="workspace-request-list-item" key={item.catalogReferenceId}><div><strong>{item.reference.name}</strong><small>{item.reference.category}{item.reference.subcategory ? ` · ${item.reference.subcategory}` : ''} · {item.reference.purchaseUnit ?? item.reference.unitOfMeasure ?? 'Unit to be confirmed'}</small></div><div className="workspace-quantity-control" aria-label={`Quantity for ${item.reference.name}`}><button type="button" onClick={() => updateItems(setCatalogReferenceBasketQuantity(items, item.catalogReferenceId, item.quantity - 1))} aria-label={`Decrease ${item.reference.name} quantity`}>−</button><span>{item.quantity}</span><button type="button" onClick={() => updateItems(setCatalogReferenceBasketQuantity(items, item.catalogReferenceId, item.quantity + 1))} aria-label={`Increase ${item.reference.name} quantity`}>+</button></div><button type="button" className="btn btn-ghost" onClick={() => updateItems(setCatalogReferenceBasketQuantity(items, item.catalogReferenceId, 0))}>Remove</button></div>)}
      </div>
      <label>Response window<select value={responseWindowHours} onChange={(event) => setResponseWindowHours(Number(event.target.value))}><option value={4}>Same day — 4 hours</option><option value={24}>Planned — 1 business day</option><option value={72}>Technical / complex — 3 days</option></select></label>
      <label>Delivery location <span className="muted">(optional)</span><input maxLength={240} value={deliveryLocation} onChange={(event) => setDeliveryLocation(event.target.value)} /></label>
      <label style={{ gridColumn: '1 / -1' }}>Requirement notes <span className="muted">(optional)</span><input maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, flexWrap: 'wrap' }}><button className="btn btn-blue" disabled={status === 'submitting' || status === 'complete'}>{status === 'submitting' ? 'Creating requests…' : status === 'complete' ? 'Requests created' : `Create ${resolvedItems.length} sealed sourcing request${resolvedItems.length === 1 ? '' : 's'}`}</button><Link className="btn btn-ghost" href="/marketplace">Add more references</Link></div>
      {message ? <p className="workspace-status" role={status === 'error' ? 'alert' : 'status'} style={{ gridColumn: '1 / -1', margin: 0 }}>{message}{status === 'complete' ? <> <Link href="/workspace/marketplace">Open sourcing workspace</Link></> : null}</p> : null}
    </form> : null}
    {status === 'ready' && !resolvedItems.length ? <section className="workspace-status"><h2>Your requirement basket is empty.</h2><p>{message || 'Choose reviewed catalogue references first. Unlisted needs can be recorded in the sourcing workspace.'}</p><Link className="btn btn-dark" href="/marketplace">Browse catalogue</Link></section> : null}
  </section>;
}

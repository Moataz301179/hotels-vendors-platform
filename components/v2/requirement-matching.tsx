'use client';

import { useEffect, useState } from 'react';
import { requestJson } from '@/lib/v2-http';

type Tenant = { id: string; name: string };
type Requirement = { id: string; itemName: string | null; unitOfMeasure: string | null; packDescription: string | null; requestedQty: number; deliveryLocation: string | null; deliveryTimeline: string | null; specialReq: string | null; notes: string | null; createdAt: string };
type Product = { id: string; name: string; sku: string; unitOfMeasure: string; supplier: { name: string } };

export function RequirementMatching() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [search, setSearch] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Record<string, Product[]>>({});
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  async function load(selectedTenantId = tenantId) {
    const result = await requestJson<{ requirements: Requirement[]; tenants: Tenant[] }>(`/api/v2/rfq/match${selectedTenantId ? `?tenantId=${encodeURIComponent(selectedTenantId)}` : ''}`);
    setTenants(result.tenants);
    setRequirements(result.requirements);
  }
  useEffect(() => { void load().catch(error => setMessage(error instanceof Error ? error.message : 'Unable to load the requirement queue.')); }, []);
  async function chooseTenant(value: string) { setTenantId(value); setProducts({}); setMessage(''); try { await load(value); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to load the requirement queue.'); } }
  async function findProducts(rfqId: string) {
    const query = search[rfqId]?.trim();
    if (!query || query.length < 2) { setMessage('Enter at least two characters to search verified supplier listings.'); return; }
    setBusy(rfqId); setMessage('');
    try { const result = await requestJson<{ products: Product[] }>(`/api/v2/marketplace?q=${encodeURIComponent(query)}`); setProducts(current => ({ ...current, [rfqId]: result.products })); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to search verified supplier listings.'); }
    finally { setBusy(''); }
  }
  async function match(rfqId: string, product: Product) {
    if (!tenantId) return;
    setBusy(rfqId); setMessage('');
    try { await requestJson('/api/v2/rfq/match', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tenantId, rfqId, productId: product.id }) }); setMessage(`${product.name} was matched and the verified supplier was notified through the controlled RFQ path.`); await load(tenantId); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to match this requirement.'); }
    finally { setBusy(''); }
  }
  return <section className="card" style={{ padding: 24, marginTop: 24 }}><div className="eyebrow">Product Intelligence</div><h2>Queued requirement matching</h2><p className="muted">A supplier is not notified until an authorized operator links the requirement to an active, verified supplier listing. This keeps free-text demand separate from catalogue claims.</p><label>Hotel organization<select value={tenantId} onChange={event => void chooseTenant(event.target.value)}><option value="">Select a hotel organization</option>{tenants.map(tenant => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}</select></label>{tenantId && requirements.length === 0 ? <p className="workspace-empty">No unlisted requirements are waiting for a verified product match.</p> : null}{requirements.map(requirement => <article key={requirement.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 16, marginTop: 16 }}><strong>{requirement.itemName ?? 'Unlisted requirement'}</strong><p className="muted" style={{ margin: '4px 0 12px' }}>{requirement.requestedQty} {requirement.unitOfMeasure ?? ''}{requirement.packDescription ? ` · ${requirement.packDescription}` : ''}{requirement.deliveryLocation ? ` · Deliver to ${requirement.deliveryLocation}` : ''}</p>{requirement.specialReq ? <p className="muted">Specification: {requirement.specialReq}</p> : null}<div className="workspace-form"><label>Search verified supplier product<input value={search[requirement.id] ?? requirement.itemName ?? ''} onChange={event => setSearch(current => ({ ...current, [requirement.id]: event.target.value }))} /></label><button className="btn btn-ghost" type="button" disabled={busy === requirement.id} onClick={() => void findProducts(requirement.id)}>Find verified products</button></div>{products[requirement.id]?.length === 0 ? <p className="workspace-empty">No verified product matches that search. Keep the requirement queued; do not substitute an unverified listing.</p> : null}{products[requirement.id]?.map(product => <div key={product.id} style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: 10, marginTop: 10, flexWrap: 'wrap' }}><span><strong>{product.name}</strong><span className="muted"> · {product.sku} · {product.supplier.name}</span></span><button className="btn btn-blue" type="button" disabled={busy === requirement.id} onClick={() => void match(requirement.id, product)}>Match and notify supplier</button></div>)}</article>)}{message && <p className="workspace-status" role="status">{message}</p>}</section>;
}

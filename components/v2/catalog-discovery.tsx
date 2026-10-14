'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { requestJson } from '@/lib/v2-http';

type Candidate = {
  id: string;
  name: string;
  website: string;
  sourceUrl: string;
  sourceObservedAt: string;
  categories: string[];
  status: string;
  verificationNote: string | null;
};

type DiscoveryResponse = {
  candidates: Candidate[];
  pipeline: string[];
};

export function CatalogDiscovery() {
  const [data, setData] = useState<DiscoveryResponse | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setData(await requestJson<DiscoveryResponse>('/api/v2/discovery/runs'));
  }

  useEffect(() => {
    void load().catch(error => setMessage(error instanceof Error ? error.message : 'Unable to load source intake.'));
  }, []);

  async function discover(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const result = await requestJson<{ run: { supplierName?: string; observedProducts: number; status: string } }>('/api/v2/discovery/runs', {
        method: 'POST',
        body: JSON.stringify({ sourceUrl, ...(supplierName.trim() ? { supplierName: supplierName.trim() } : {}) }),
      });
      setSourceUrl('');
      setSupplierName('');
      setMessage(`${result.run.observedProducts} source observations are waiting for review. Nothing was published.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to run source intake.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="card" style={{ padding: 24, marginTop: 24 }}>
    <div className="eyebrow">Product intelligence</div>
    <h2>Source intake parking lot</h2>
    <p className="muted">Collect a permitted public supplier source for review. The intake creates evidence and a research candidate only; it never creates an active supplier or listing.</p>
    <form className="workspace-form" onSubmit={discover}>
      <label>Public supplier source URL<input required type="url" maxLength={2000} value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} placeholder="https://supplier.example/catalogue" /></label>
      <label>Supplier name, if known<input maxLength={160} value={supplierName} onChange={event => setSupplierName(event.target.value)} placeholder="Optional; source name is used when available" /></label>
      <button className="btn btn-blue" disabled={busy}>{busy ? 'Collecting source…' : 'Collect for review'}</button>
    </form>
    {message && <p className="workspace-status" role="status">{message}</p>}
    {data && <><p className="muted" style={{ marginTop: 20, fontSize: 12 }}>Controlled path: {data.pipeline.join(' → ')}</p>
      {data.candidates.length === 0 ? <p className="workspace-empty">No source candidates have been collected yet.</p> : <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>{data.candidates.map(candidate => <article key={candidate.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}><strong>{candidate.name}</strong><p className="muted" style={{ margin: '5px 0' }}><a className="hv-inline-link" href={candidate.sourceUrl} target="_blank" rel="noreferrer">Source record</a> · observed {new Date(candidate.sourceObservedAt).toLocaleString('en-GB')} · {candidate.status.replaceAll('_', ' ')}</p><p className="muted" style={{ margin: 0 }}>{candidate.categories.length ? candidate.categories.join(', ') : 'No category extracted'}{candidate.verificationNote ? ` · ${candidate.verificationNote}` : ''}</p></article>)}</div>}</>}
  </section>;
}

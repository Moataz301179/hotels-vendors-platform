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
  const [sourceUrls, setSourceUrls] = useState('');
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
      const urls = [...new Set(sourceUrls.split(/\s+/).map(value => value.trim()).filter(Boolean))];
      if (urls.length === 0 || urls.length > 25 || urls.some(value => !/^https:\/\//i.test(value))) {
        setMessage('Provide 1–25 HTTPS catalogue or category URLs, one per line.');
        return;
      }
      let observedProducts = 0;
      let queuedProducts = 0;
      const failures: string[] = [];
      for (const sourceUrl of urls) {
        try {
          const result = await requestJson<{ run: { observedProducts: number; queuedProducts: number } }>('/api/v2/discovery/runs', {
            method: 'POST', body: JSON.stringify({ sourceUrl }),
          });
          observedProducts += result.run.observedProducts;
          queuedProducts += result.run.queuedProducts;
        } catch (error) { failures.push(error instanceof Error ? error.message : sourceUrl); }
      }
      setSourceUrls('');
      setMessage(`${queuedProducts} private catalogue candidates queued from ${observedProducts} observations across ${urls.length - failures.length}/${urls.length} sources.${failures.length ? ` ${failures.length} source(s) failed.` : ''} Nothing was published.`);
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
    <p className="muted">Paste up to 25 approved public catalogue or category URLs. The pipeline extracts product observations, source images and private market signals into the review queue. It never creates an active vendor, a live offer, stock claim or buyer-visible price.</p>
    <form className="workspace-form" onSubmit={discover}>
      <label>Catalogue or category URLs<textarea required value={sourceUrls} onChange={event => setSourceUrls(event.target.value)} placeholder={'https://wholesaler.example/catalogue\nhttps://wholesaler.example/housekeeping'} /></label>
      <button className="btn btn-blue" disabled={busy}>{busy ? 'Queuing catalogue sources…' : 'Queue catalogue intake'}</button>
    </form>
    {message && <p className="workspace-status" role="status">{message}</p>}
    {data && <><p className="muted" style={{ marginTop: 20, fontSize: 12 }}>Controlled path: {data.pipeline.join(' → ')}</p>
      {data.candidates.length === 0 ? <p className="workspace-empty">No source candidates have been collected yet.</p> : <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>{data.candidates.map(candidate => <article key={candidate.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}><strong>{candidate.name}</strong><p className="muted" style={{ margin: '5px 0' }}><a className="hv-inline-link" href={candidate.sourceUrl} target="_blank" rel="noreferrer">Source record</a> · observed {new Date(candidate.sourceObservedAt).toLocaleString('en-GB')} · {candidate.status.replaceAll('_', ' ')}</p><p className="muted" style={{ margin: 0 }}>{candidate.categories.length ? candidate.categories.join(', ') : 'No category extracted'}{candidate.verificationNote ? ` · ${candidate.verificationNote}` : ''}</p></article>)}</div>}</>}
  </section>;
}

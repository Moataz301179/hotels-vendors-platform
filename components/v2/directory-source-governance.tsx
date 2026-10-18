'use client';

import { useEffect, useState } from 'react';
import { requestJson } from '@/lib/v2-http';

type Source = {
  id: string;
  sourceUrl: string;
  sourceType: string;
  permissionStatus: 'PERMISSION_UNKNOWN' | 'PERMITTED' | 'RESTRICTED';
  permissionNote: string | null;
  observedAt: string;
  lastSuccessAt: string | null;
  refreshStatus: string;
  _count: { candidates: number };
};

type SourceData = {
  sources: Source[];
  metrics: { totalSources: number; permittedSources: number; pendingPermissionSources: number; restrictedSources: number; candidateRecords: number };
};

export function DirectorySourceGovernance() {
  const [data, setData] = useState<SourceData | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setData(await requestJson<SourceData>('/api/v2/admin/directory/sources'));
  }

  useEffect(() => {
    void load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Unable to load source governance.'));
  }, []);

  async function decide(sourceId: string, permissionStatus: Source['permissionStatus']) {
    const permissionNote = notes[sourceId]?.trim() ?? '';
    if (permissionNote.length < 10) {
      setMessage('Record a permission or restriction note of at least 10 characters before changing a source.');
      return;
    }
    setBusy(sourceId);
    setMessage('');
    try {
      await requestJson('/api/v2/admin/directory/sources', { method: 'PATCH', body: JSON.stringify({ sourceId, permissionStatus, permissionNote }) });
      setMessage(permissionStatus === 'PERMITTED' ? 'Source marked permitted for reviewed directory publication.' : 'Source restricted. Its candidates cannot be published.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to record the source decision.');
    } finally {
      setBusy(null);
    }
  }

  return <section className="card workspace-source-governance" aria-labelledby="source-governance-title">
    <div className="workspace-section-heading"><div><div className="eyebrow">Catalogue governance</div><h2 id="source-governance-title">Source permission queue</h2><p>Research evidence is private. Only sources with recorded reuse permission can move candidates to reviewed directory profiles.</p></div>{data && <div className="workspace-source-metrics" aria-label="Source governance metrics"><span><strong>{data.metrics.permittedSources}</strong> permitted</span><span><strong>{data.metrics.pendingPermissionSources}</strong> pending</span><span><strong>{data.metrics.candidateRecords}</strong> candidates</span></div>}</div>
    {!data ? <p className="workspace-empty" role="status">Loading source records…</p> : data.sources.length === 0 ? <p className="workspace-empty">No research sources are waiting yet. A source appears here only after evidence intake; this screen never creates product listings.</p> : <div className="workspace-source-list">{data.sources.map((source) => <article key={source.id} className="workspace-source-card"><div><strong>{new URL(source.sourceUrl).hostname}</strong><p className="muted">{source.sourceType.replaceAll('_', ' ').toLowerCase()} · {source._count.candidates} candidate record{source._count.candidates === 1 ? '' : 's'} · last observed {new Date(source.observedAt).toLocaleDateString('en-GB')}</p><a className="hv-inline-link" href={source.sourceUrl} target="_blank" rel="noreferrer">Open source evidence</a></div><span className={`pill workspace-source-status status-${source.permissionStatus.toLowerCase()}`}>{source.permissionStatus.replaceAll('_', ' ').toLowerCase()}</span><label>Permission decision note<textarea minLength={10} maxLength={1000} value={notes[source.id] ?? source.permissionNote ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [source.id]: event.target.value }))} placeholder="Record permission basis, terms or restriction evidence." /></label><div className="workspace-source-actions"><button className="btn btn-blue" disabled={busy === source.id || source.permissionStatus === 'PERMITTED'} onClick={() => void decide(source.id, 'PERMITTED')}>Mark permitted</button><button className="btn btn-ghost" disabled={busy === source.id || source.permissionStatus === 'RESTRICTED'} onClick={() => void decide(source.id, 'RESTRICTED')}>Mark restricted</button></div></article>)}</div>}
    {message && <p className="workspace-status" role="status">{message}</p>}
  </section>;
}

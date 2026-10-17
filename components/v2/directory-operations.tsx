'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { requestJson } from '@/lib/v2-http';

type Source = { id: string; sourceUrl: string; sourceType: string; permissionStatus: 'PERMISSION_UNKNOWN' | 'PERMITTED' | 'RESTRICTED'; permissionNote: string | null; observedAt: string; refreshStatus: string; _count: { candidates: number } };
type SourceResponse = { sources: Source[]; metrics: { totalSources: number; permittedSources: number; pendingPermissionSources: number; restrictedSources: number; candidateRecords: number } };

export function DirectoryOperations() {
  const [sourceUrl, setSourceUrl] = useState('');
  const [itemType, setItemType] = useState<'PRODUCT' | 'SERVICE'>('PRODUCT');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [sources, setSources] = useState<SourceResponse | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => setSources(await requestJson<SourceResponse>('/api/v2/admin/directory/sources'));
  useEffect(() => {
    let active = true;
    void requestJson<SourceResponse>('/api/v2/admin/directory/sources')
      .then((response) => { if (active) setSources(response); })
      .catch((error: unknown) => { if (active) setMessage(error instanceof Error ? error.message : 'Unable to load source registry.'); });
    return () => { active = false; };
  }, []);
  const ingest = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      await requestJson('/api/v2/admin/directory/candidates', { method: 'POST', body: JSON.stringify({ source: { url: sourceUrl }, records: [{ itemType, name, category, description }] }) });
      setName(''); setCategory(''); setDescription(''); setMessage('Candidate saved for review. It is not public and no commercial data was created.'); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save directory candidate.'); }
    finally { setBusy(false); }
  };
  const decideSource = async (sourceId: string, permissionStatus: Source['permissionStatus']) => {
    const permissionNote = notes[sourceId]?.trim() ?? '';
    if (permissionNote.length < 10) { setMessage('Add a source-permission review note of at least 10 characters.'); return; }
    setBusy(true); setMessage('');
    try { await requestJson('/api/v2/admin/directory/sources', { method: 'PATCH', body: JSON.stringify({ sourceId, permissionStatus, permissionNote }) }); setMessage('Source permission decision recorded.'); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to record source permission.'); }
    finally { setBusy(false); }
  };
  return <section className="card" style={{ padding: 24, marginTop: 24 }}>
    <div className="eyebrow">Directory operations</div><h2>Controlled source intake</h2>
    <p className="muted">Create a product or service candidate from a permitted or reviewable source. Candidates remain private until a separate source and publication review is completed.</p>
    <form className="workspace-form" onSubmit={ingest}>
      <label>Source URL<input required type="url" maxLength={2000} value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} placeholder="https://approved-source.example/item" /></label>
      <label>Type<select value={itemType} onChange={event => setItemType(event.target.value as 'PRODUCT' | 'SERVICE')}><option value="PRODUCT">Product</option><option value="SERVICE">Service</option></select></label>
      <label>Name<input required minLength={2} maxLength={300} value={name} onChange={event => setName(event.target.value)} placeholder="Hotel requirement name" /></label>
      <label>Category<input required minLength={2} maxLength={160} value={category} onChange={event => setCategory(event.target.value)} placeholder="Example: Housekeeping and cleaning" /></label>
      <label>Source observation<textarea maxLength={6000} value={description} onChange={event => setDescription(event.target.value)} placeholder="Internal source observation; it is not published automatically." /></label>
      <button className="btn btn-blue" disabled={busy}>Add candidate for review</button>
    </form>
    {sources ? <div style={{ marginTop: 24 }}><h3>Source registry</h3><p className="muted">{sources.metrics.totalSources} sources · {sources.metrics.permittedSources} permitted · {sources.metrics.pendingPermissionSources} awaiting permission review · {sources.metrics.candidateRecords} candidates</p>
      {sources.sources.length === 0 ? <p className="workspace-empty">No sources have been registered.</p> : <div style={{ display: 'grid', gap: 12 }}>{sources.sources.map(source => <article key={source.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}><strong>{source.sourceUrl}</strong><p className="muted" style={{ margin: '5px 0' }}>{source.permissionStatus.replaceAll('_', ' ').toLowerCase()} · {source._count.candidates} candidates · {source.refreshStatus.toLowerCase()}</p><label>Permission review note<textarea required minLength={10} maxLength={1000} value={notes[source.id] ?? source.permissionNote ?? ''} onChange={event => setNotes(current => ({ ...current, [source.id]: event.target.value }))} /></label><div style={{ display: 'flex', gap: 10, marginTop: 10 }}><button className="btn btn-blue" disabled={busy} onClick={() => void decideSource(source.id, 'PERMITTED')}>Mark permitted</button><button className="btn btn-ghost" disabled={busy} onClick={() => void decideSource(source.id, 'RESTRICTED')}>Restrict publication</button></div></article>)}</div>}
    </div> : null}
    {message ? <p className="workspace-status" role="status">{message}</p> : null}
  </section>;
}

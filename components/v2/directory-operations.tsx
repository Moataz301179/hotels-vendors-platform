'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { requestJson } from '@/lib/v2-http';

type Source = { id: string; sourceUrl: string; sourceType: string; permissionStatus: 'PERMISSION_UNKNOWN' | 'PERMITTED' | 'RESTRICTED'; permissionNote: string | null; observedAt: string; refreshStatus: string; _count: { candidates: number } };
type SourceResponse = { sources: Source[]; metrics: { totalSources: number; permittedSources: number; pendingPermissionSources: number; restrictedSources: number; candidateRecords: number } };
type BulkRecord = { sourceRecordKey?: string; itemType: 'PRODUCT' | 'SERVICE'; name: string; category: string; [key: string]: unknown };
type BulkFile = { source: { url: string; type?: string; permissionStatus?: 'PERMISSION_UNKNOWN' | 'PERMITTED' | 'RESTRICTED'; observedAt?: string }; records: BulkRecord[] };

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
  const [bulkFile, setBulkFile] = useState<BulkFile | null>(null);
  const [bulkFileName, setBulkFileName] = useState('');
  const [openLicensedCandidateIds, setOpenLicensedCandidateIds] = useState<string[]>([]);
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
  const selectBulkFile = async (file: File | undefined) => {
    setMessage(''); setBulkFile(null); setBulkFileName('');
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as BulkFile;
      if (!parsed || !parsed.source || typeof parsed.source.url !== 'string' || !Array.isArray(parsed.records) || parsed.records.length < 1 || parsed.records.length > 100 || parsed.records.some(record => !record || record.itemType !== 'PRODUCT' || typeof record.name !== 'string' || typeof record.category !== 'string')) throw new Error('This file is not a valid private catalogue batch.');
      setBulkFile(parsed); setBulkFileName(file.name);
      setMessage(`${parsed.records.length} normalized observations are ready to queue privately. No record will be public or commercially available.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to read that catalogue batch.'); }
  };
  const ingestBulk = async () => {
    if (!bulkFile) return;
    setBusy(true); setMessage('');
    try {
      const response = await requestJson<{ candidates: Array<{ id: string; duplicateOfId: string | null }> }>('/api/v2/admin/directory/candidates', { method: 'POST', body: JSON.stringify(bulkFile) });
      const duplicates = response.candidates.filter(candidate => candidate.duplicateOfId).length;
      const openLicensed = bulkFile.source.type === 'OPEN_LICENSED_BULK_EXPORT' && bulkFile.source.permissionStatus === 'PERMITTED';
      setOpenLicensedCandidateIds(openLicensed ? response.candidates.filter(candidate => !candidate.duplicateOfId).map(candidate => candidate.id) : []);
      setBulkFile(null); setBulkFileName('');
      setMessage(`${response.candidates.length} observations queued for private review${duplicates ? `; ${duplicates} possible duplicates are flagged for review` : ''}. Published records: 0.`);
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to queue the catalogue batch.'); }
    finally { setBusy(false); }
  };
  const publishOpenLicensed = async () => {
    if (!openLicensedCandidateIds.length) return;
    setBusy(true); setMessage('');
    try {
      const response = await requestJson<{ published: number }>('/api/v2/admin/directory/open-license-publish', { method: 'POST', body: JSON.stringify({ candidateIds: openLicensedCandidateIds }) });
      setOpenLicensedCandidateIds([]);
      setMessage(`${response.published} open-licensed product references published with catalogue attribution. No vendor, price, stock or offer was published.`);
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to publish the open-licensed batch.'); }
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
    <section aria-labelledby="bulk-catalogue-intake" style={{ borderTop: '1px solid var(--line)', marginTop: 24, paddingTop: 20 }}>
      <div className="eyebrow">Bulk catalogue intake</div><h3 id="bulk-catalogue-intake">Queue normalized observations in review batches</h3>
      <p className="muted">Use one JSON file of up to 100 records generated from an observed public catalogue. This action records provenance and an audit event, but it does not publish products, claim stock or price, or disclose any Vendor.</p>
      <label>Normalized catalogue batch<input aria-label="Normalized catalogue batch" type="file" accept="application/json" disabled={busy} onChange={event => void selectBulkFile(event.target.files?.[0])} /></label>
      {bulkFile ? <p className="muted" style={{ marginTop: 10 }}>{bulkFileName} · {bulkFile.records.length} records · source status {bulkFile.source.permissionStatus ?? 'PERMISSION_UNKNOWN'}</p> : null}
      <button type="button" className="btn btn-blue" disabled={busy || !bulkFile} style={{ marginTop: 10 }} onClick={() => void ingestBulk()}>{busy ? 'Queuing…' : 'Queue private catalogue batch'}</button>
      {openLicensedCandidateIds.length ? <button type="button" className="btn btn-blue" disabled={busy} style={{ marginTop: 10, marginLeft: 10 }} onClick={() => void publishOpenLicensed()}>Publish verified open-licence batch</button> : null}
    </section>
    {sources ? <div style={{ marginTop: 24 }}><h3>Source registry</h3><p className="muted">{sources.metrics.totalSources} sources · {sources.metrics.permittedSources} permitted · {sources.metrics.pendingPermissionSources} awaiting permission review · {sources.metrics.candidateRecords} candidates</p>
      {sources.sources.length === 0 ? <p className="workspace-empty">No sources have been registered.</p> : <div style={{ display: 'grid', gap: 12 }}>{sources.sources.map(source => <article key={source.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}><strong>{source.sourceUrl}</strong><p className="muted" style={{ margin: '5px 0' }}>{source.permissionStatus.replaceAll('_', ' ').toLowerCase()} · {source._count.candidates} candidates · {source.refreshStatus.toLowerCase()}</p><label>Permission review note<textarea required minLength={10} maxLength={1000} value={notes[source.id] ?? source.permissionNote ?? ''} onChange={event => setNotes(current => ({ ...current, [source.id]: event.target.value }))} /></label><div style={{ display: 'flex', gap: 10, marginTop: 10 }}><button className="btn btn-blue" disabled={busy} onClick={() => void decideSource(source.id, 'PERMITTED')}>Mark permitted</button><button className="btn btn-ghost" disabled={busy} onClick={() => void decideSource(source.id, 'RESTRICTED')}>Restrict publication</button></div></article>)}</div>}
    </div> : null}
    {message ? <p className="workspace-status" role="status">{message}</p> : null}
  </section>;
}

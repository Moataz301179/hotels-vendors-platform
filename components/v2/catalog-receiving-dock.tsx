'use client';

import { useEffect, useState } from 'react';
import { requestJson } from '@/lib/v2-http';

type Batch = {
  id: string; sourceName: string; sourceUrl: string; sourceType: string; sourcePermissionStatus: string;
  status: string; recordCount: number; acceptedCount: number; rejectedCount: number; exportedCount: number;
  receivedAt: string;
};
type ImageQuality = {
  approvedCount?: number; totalObserved?: number;
  assessments?: Array<{ sourceUrl: string; status: string; reasons: string[]; width?: number; height?: number; format?: string }>;
};
type RecordRow = {
  id: string; rawSupplierName: string | null; rawSupplierWebsite: string | null; rawProductName: string;
  rawProductDescription: string | null; rawCategory: string | null; rawSku: string | null; rawPackSize: string | null;
  observedPrice: string | number | null; observedCurrency: string; productUrl: string | null; imageUrls: string[];
  approvedImageUrls: string[]; imageQualityOutput: ImageQuality | null; imageRightsStatus: string; imageRightsNote: string | null;
  qualityStatus: string; taxonomyStatus: string; qualityOutput: { flags?: string[] } | null;
  mappedCategoryCode: string | null; mappedSubcategoryCode: string | null; normalizedName: string | null;
};
export function CatalogReceivingDock() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [selected, setSelected] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [recordsJson, setRecordsJson] = useState('');
  const [permissionNotes, setPermissionNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function load(batchId = selected) {
    const url = batchId ? '/api/v2/admin/catalog-receiving?batchId=' + encodeURIComponent(batchId) : '/api/v2/admin/catalog-receiving';
    const data = await requestJson<{ batches: Batch[]; records: RecordRow[] }>(url);
    setBatches(data.batches);
    if (batchId) setRecords(data.records);
    else if (data.batches[0]) {
      setSelected(data.batches[0].id);
      const detail = await requestJson<{ records: RecordRow[] }>('/api/v2/admin/catalog-receiving?batchId=' + encodeURIComponent(data.batches[0].id));
      setRecords(detail.records);
    }
  }
  useEffect(() => { void load('').catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Unable to load Receiving Dock.')); }, []);
  async function receive(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const rows = recordsJson.trim() ? JSON.parse(recordsJson) as unknown[] : undefined;
      const response = await requestJson<{ batch: { id: string } }>('/api/v2/admin/catalog-receiving', {
        method: 'POST',
        body: JSON.stringify({ sourceUrl, supplierName: supplierName || undefined, sourceName: supplierName || undefined, sourceType: rows ? 'STRUCTURED_MARKET_DATA' : 'PUBLIC_CATALOG_OBSERVATION', ...(rows ? { records: rows } : {}) }),
      });
      setSelected(response.batch.id); setRecordsJson('');
      setMessage('Raw batch received. No supplier account or buyer listing was created.');
      await load(response.batch.id);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to receive this market batch.'); }
    finally { setBusy(false); }
  }
  async function runAgents() {
    if (!selected) return;
    setBusy(true); setMessage('');
    try {
      const response = await requestJson<{ result: { processed: number; accepted: number; rejected: number; reviewRequired: number } }>('/api/v2/admin/catalog-receiving/process', { method: 'POST', body: JSON.stringify({ batchId: selected }) });
      const result = response.result;
      setMessage('Agent pass: ' + result.accepted + ' accepted/mapped, ' + result.rejected + ' noise/duplicates, ' + result.reviewRequired + ' need taxonomy review. Missing price, MOQ, specs or pack data did not block intake.');
      await load(selected);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Agent processing failed.'); }
    finally { setBusy(false); }
  }
  async function exportProducts() {
    if (!selected) return;
    setBusy(true); setMessage('');
    try {
      const response = await requestJson<{ result: { exported: number; alreadyPresent?: number } }>('/api/v2/admin/catalog-receiving/export', { method: 'POST', body: JSON.stringify({ batchId: selected }) });
      setMessage(response.result.exported + ' candidates exported into private catalogue review. Existing fingerprints reused: ' + (response.result.alreadyPresent ?? 0) + '.');
      await load(selected);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Catalog export failed.'); }
    finally { setBusy(false); }
  }
  async function setImageRights(record: RecordRow, status: 'PERMITTED' | 'RESTRICTED') {
    const note = (permissionNotes[record.id] ?? record.imageRightsNote ?? '').trim();
    if (note.length < 15) { setMessage('Enter the evidence and basis for image reuse rights (at least 15 characters).'); return; }
    setBusy(true); setMessage('');
    try {
      await requestJson('/api/v2/admin/catalog-receiving/images/permissions', { method: 'PATCH', body: JSON.stringify({ recordId: record.id, imageRightsStatus: status, imageRightsNote: note }) });
      setMessage('Image rights decision recorded. Public use still requires source permission and product review.');
      await load(selected);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Image-rights update failed.'); }
    finally { setBusy(false); }
  }
  const current = batches.find((batch) => batch.id === selected);
  return <section className="card" id="catalog-receiving-dock" aria-labelledby="catalog-receiving-dock-title">
    <div className="workspace-section-heading"><div><div className="eyebrow">Market intelligence intake</div><h2 id="catalog-receiving-dock-title">Receiving Dock</h2><p>Raw observations land here first. Agent 1 filters product records; Agent 2 maps the hospitality taxonomy. Images are quality-checked separately.</p></div></div>
    <form className="workspace-form" onSubmit={(event) => void receive(event)}>
      <label>Public catalog URL<input type="url" required value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://supplier.example/catalog" /></label>
      <label>Supplier / source label (admin only)<input value={supplierName} onChange={(event) => setSupplierName(event.target.value)} placeholder="Supplier name or marketplace" /></label>
      <label>Structured raw product rows (optional JSON)<textarea rows={4} value={recordsJson} onChange={(event) => setRecordsJson(event.target.value)} placeholder='Paste an array of raw product observations. Leave blank to discover the public catalog URL.' /></label>
      <button className="btn btn-blue" disabled={busy || !sourceUrl.trim()}>{busy ? 'Receiving…' : recordsJson.trim() ? 'Receive structured data' : 'Fetch public catalog into dock'}</button>
    </form>
    {batches.length > 0 && <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
      <label>Receiving batches<select value={selected} onChange={(event) => { setSelected(event.target.value); void load(event.target.value); }}><option value="">Choose batch</option>{batches.map((batch) => <option value={batch.id} key={batch.id}>{batch.sourceName} · {new Date(batch.receivedAt).toLocaleString()}</option>)}</select></label>
      {current && <div className="admin-command-notice"><strong>{current.sourceName}</strong><span>{current.recordCount} raw rows · {current.acceptedCount} accepted · {current.rejectedCount} rejected · {current.exportedCount} exported · {current.status.replaceAll('_', ' ')}</span><span>Source permission: {current.sourcePermissionStatus.replaceAll('_', ' ')} · <a href={current.sourceUrl} target="_blank" rel="noreferrer">Open evidence</a></span>
        <div className="workspace-source-actions"><button className="btn btn-blue" type="button" disabled={busy || current.status === 'EXPORTED'} onClick={() => void runAgents()}>Run Agent 1 + Agent 2 + image check</button><button className="btn btn-ghost" type="button" disabled={busy || current.acceptedCount === 0} onClick={() => void exportProducts()}>Export mapped products to review</button></div>
      </div>}
      <div style={{ overflowX: 'auto' }}><table className="table"><thead><tr><th>Product</th><th>Supplier / price (admin only)</th><th>Agent 1</th><th>Agent 2</th><th>Image quality / rights</th></tr></thead>
        <tbody>{records.map((record) => <tr key={record.id}>
          <td><strong>{record.normalizedName || record.rawProductName}</strong><br /><small>{record.rawSku || 'SKU not observed'} · {record.rawPackSize || 'Pack not observed'}</small>{record.rawProductDescription && <p className="muted">{record.rawProductDescription}</p>}</td>
          <td>{record.rawSupplierName || 'Not observed'}<br /><small>{record.rawSupplierWebsite || ''}</small><br />{record.observedPrice == null ? 'Price not observed' : Number(record.observedPrice).toLocaleString() + ' ' + record.observedCurrency}</td>
          <td>{record.qualityStatus.replaceAll('_', ' ')}<br /><small>{record.qualityOutput?.flags?.join(', ')}</small></td>
          <td>{record.mappedCategoryCode ? record.mappedCategoryCode + ' / ' + record.mappedSubcategoryCode : record.taxonomyStatus}</td>
          <td><div>{record.approvedImageUrls.length} quality-approved / {record.imageUrls.length} observed</div><small>Rights: {record.imageRightsStatus.replaceAll('_', ' ')}</small>
            {record.imageQualityOutput?.assessments?.map((assessment) => <div key={assessment.sourceUrl}><small>{assessment.status}: {assessment.width || '?'}×{assessment.height || '?'}</small></div>)}
            {record.approvedImageUrls.length > 0 && <div className="workspace-form" style={{ marginTop: 8 }}>
              <textarea rows={2} value={permissionNotes[record.id] ?? record.imageRightsNote ?? ''} onChange={(event) => setPermissionNotes((current) => ({ ...current, [record.id]: event.target.value }))} placeholder="Evidence for image reuse rights, e.g. supplier authorization or licensed media terms." />
              <div className="workspace-source-actions"><button className="btn btn-blue" type="button" disabled={busy || record.imageRightsStatus === 'PERMITTED'} onClick={() => void setImageRights(record, 'PERMITTED')}>Rights cleared</button><button className="btn btn-ghost" type="button" disabled={busy || record.imageRightsStatus === 'RESTRICTED'} onClick={() => void setImageRights(record, 'RESTRICTED')}>Restrict image</button></div>
            </div>}
            <div>{record.productUrl ? <a href={record.productUrl} target="_blank" rel="noreferrer">Product evidence</a> : 'No product URL'}</div>
          </td>
        </tr>)}</tbody></table></div>
    </div>}
    {message && <p className="workspace-status" role="status">{message}</p>}
    <p className="muted">Raw identity, source links and market prices are administrator-only. Poor images are withheld but do not reject product records. EGS/GS1, price, MOQ, technical specs and pack data are enrichment fields. Public display requires source and image-rights clearance.</p>
  </section>;
}

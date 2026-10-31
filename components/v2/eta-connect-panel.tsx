'use client';

import { useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, FileText, TrendingUp } from 'lucide-react';
import { requestJson } from '@/lib/v2-http';

interface ImportRecord {
  id: string;
  sourceType: string;
  sourceReference: string;
  recordCount: number;
  status: string;
  createdAt: string;
}

export function EtaConnectPanel() {
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ sourceType: 'ETA_EINVOICE_FEED', sourceReference: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await requestJson<{ imports: ImportRecord[] }>('/api/v2/hotel/e-invoices/ingest');
      setImports(data.imports || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load e-invoice imports.');
    } finally {
      setLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await requestJson('/api/v2/hotel/e-invoices/ingest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          hotelId: 'current',
          sourceType: form.sourceType,
          sourceReference: form.sourceReference,
          payloadSummary: {
            contentDigest: '0'.repeat(64),
            documentCount: 0,
          },
          recordCount: 0,
        }),
      });
      setMessage('E-invoice feed connection recorded. AI categorization will begin on next sync.');
      setForm({ sourceType: 'ETA_EINVOICE_FEED', sourceReference: '' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to connect e-invoice feed.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="workspace-empty" role="status"><RefreshCw size={20} className="animate-spin mx-auto mb-2" /> Loading e-invoice imports…</div>;

  return (
    <div className="eta-connect-panel">
      <div className="workspace-section-heading">
        <div>
          <span className="eyebrow">ETA E-Invoice Intelligence</span>
          <h2>Connect your e-invoice feed</h2>
        </div>
      </div>

      {error && <div className="workspace-status" role="alert"><AlertTriangle size={16} /> {error}</div>}
      {message && <div className="workspace-status" role="status"><CheckCircle2 size={16} /> {message}</div>}

      <div className="card" style={{ padding: 24, marginTop: 16 }}>
        <h3 className="font-semibold mb-3">Connect a new feed</h3>
        <form onSubmit={submit} className="workspace-form">
          <label>Source type
            <select value={form.sourceType} onChange={e => setForm({ ...form, sourceType: e.target.value })}>
              <option value="ETA_EINVOICE_FEED">ETA E-Invoice Feed</option>
              <option value="ERP_EXPORT">ERP Export</option>
              <option value="CSV_PORTAL">CSV Portal</option>
            </select>
          </label>
          <label>Source reference
            <input required maxLength={160} value={form.sourceReference} placeholder="e.g. ETA-tenant-abc123" onChange={e => setForm({ ...form, sourceReference: e.target.value })} />
          </label>
          <button type="submit" className="btn btn-blue" disabled={busy}>{busy ? 'Connecting…' : 'Connect feed'}</button>
        </form>
      </div>

      <div className="card" style={{ padding: 24, marginTop: 16 }}>
        <h3 className="font-semibold mb-3">Connected feeds ({imports.length})</h3>
        {imports.length === 0 ? (
          <p className="workspace-empty">No e-invoice feeds connected yet. Connect your first feed above.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Source</th><th>Reference</th><th>Records</th><th>Status</th><th>Connected</th></tr>
            </thead>
            <tbody>
              {imports.map((imp) => (
                <tr key={imp.id}>
                  <td><FileText size={14} className="inline mr-1" />{imp.sourceType.replaceAll('_', ' ')}</td>
                  <td className="font-mono text-xs">{imp.sourceReference}</td>
                  <td>{imp.recordCount}</td>
                  <td><span className="pill">{imp.status}</span></td>
                  <td className="text-xs text-foreground-muted">{new Date(imp.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ padding: 24, marginTop: 16, background: 'var(--surface-raised)' }}>
        <h3 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp size={18} /> What happens after connection</h3>
        <ol className="text-sm text-foreground-secondary space-y-2 list-decimal list-inside">
          <li>Your ETA e-invoice feed is connected with read-only access — we read filed invoices, nothing more.</li>
          <li>AI categorizes every line by department, supplier, and product class into an interactive spend dashboard.</li>
          <li>Price benchmarks are computed as (your price − market avg) × your actual annual quantity — provable EGP savings.</li>
          <li>Savings findings become sealed-bid RFQs and live reverse auctions. No AI awards; every action is logged and audited.</li>
        </ol>
      </div>
    </div>
  );
}

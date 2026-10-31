'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { requestJson } from '@/lib/v2-http';
import { ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AuditSummary {
  recentActions: { id: string; createdAt: string; entityName: string | null; entityId: string; actionType: string | null; actorRole: string | null }[];
  total: number;
  verification: { valid: boolean; totalEntries: number } | null;
}

export function RoleAuditWidget() {
  const [data, setData] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await requestJson<AuditSummary>('/api/v2/audit/delegated?limit=5');
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load audit records.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { let active = true; load().catch(e => { if (active) setError(e instanceof Error ? e.message : 'Unable to load.'); }); return () => { active = false; }; }, []);

  if (loading) return (
    <div className="card role-audit-widget" style={{ padding: 20 }}>
      <div className="workspace-section-heading"><div><span className="eyebrow">Delegated team audit</span><h2>Actions taken by your authorized members</h2></div></div>
      <p className="workspace-empty" role="status"><RefreshCw size={16} className="animate-spin inline mr-1" /> Loading…</p>
    </div>
  );

  if (error) return (
    <div className="card role-audit-widget" style={{ padding: 20 }}>
      <div className="workspace-section-heading"><div><span className="eyebrow">Delegated team audit</span><h2>Actions taken by your authorized members</h2></div></div>
      <div className="workspace-status" role="alert"><AlertTriangle size={16} /> {error}</div>
    </div>
  );

  return (
    <div className="card role-audit-widget" style={{ padding: 20 }}>
      <div className="workspace-section-heading" style={{ marginBottom: 12 }}>
        <div>
          <span className="eyebrow">Delegated team audit</span>
          <h2>Actions taken by your authorized members</h2>
        </div>
        <Link href="/audit" className="btn btn-ghost" style={{ minWidth: 'auto' }}>Open full audit →</Link>
      </div>

      {data?.verification && (
        <div className="workspace-status" role="status" style={{ marginBottom: 12 }}>
          {data.verification.valid ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {data.verification.valid ? 'Stored record hashes match.' : 'A stored record hash does not match.'}{' '}
          {data.verification.totalEntries} records checked.
        </div>
      )}

      {(data?.recentActions.length ?? 0) === 0 ? (
        <p className="workspace-empty">No recorded actions for your delegated team yet.</p>
      ) : (
        <table className="table">
          <thead><tr><th>Time</th><th>Entity</th><th>Action</th><th>Actor role</th></tr></thead>
          <tbody>
            {data?.recentActions.map(a => (
              <tr key={a.id}>
                <td className="text-xs text-foreground-muted">{new Date(a.createdAt).toLocaleString('en-GB')}</td>
                <td>{a.entityName ?? 'Record'}<br /><span className="text-xs text-foreground-muted">{a.entityId.slice(0, 12)}…</span></td>
                <td><span className="pill">{(a.actionType ?? 'Not recorded').replaceAll('_', ' ')}</span></td>
                <td className="text-xs text-foreground-muted">{(a.actorRole ?? 'System').replaceAll('_', ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
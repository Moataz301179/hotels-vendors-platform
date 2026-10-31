'use client';

import { useEffect, useState } from 'react';
import { requestJson } from '@/lib/v2-http';
import { AuditTrailTable } from '@/components/v2/audit-trail-table';

interface DelegatedMember {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  status: string;
}

interface DelegatedAuditData {
  tenantId: string;
  members: DelegatedMember[];
  entries: AuditEntry[];
  nextCursor: string | null;
  verification: { valid: boolean; totalEntries: number } | null;
}

interface AuditEntry {
  id: string;
  createdAt: string;
  entityName: string | null;
  entityId: string;
  actionType: string | null;
  actorId: string | null;
  actorRole: string | null;
  changes: unknown;
  hash: string | null;
}

export function DelegatedTeamAuditPanel() {
  const [data, setData] = useState<DelegatedAuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);

  async function load(q = '', c: string | null = null, verify = false) {
    setLoading(true);
    setError('');
    try {
      const p = new URLSearchParams();
      if (q) p.set('q', q);
      if (c) p.set('cursor', c);
      if (verify) p.set('verify', 'true');
      const result = await requestJson<DelegatedAuditData>('/api/v2/audit/delegated?' + p);
      setData(old => ({
        ...result,
        entries: c ? [...(old?.entries ?? []), ...result.entries] : result.entries,
      }));
      setAppliedQuery(q);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load delegated-team audit records.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { let active = true; load().catch(e => { if (active) setError(e instanceof Error ? e.message : 'Unable to load.'); }); return () => { active = false; }; }, []);

  function search(e: React.FormEvent) {
    e.preventDefault();
    setQuery(appliedQuery);
    setCursor(null);
    void load(appliedQuery, null);
  }

  return (
    <div className="delegated-audit-panel">
      <div className="workspace-section-heading">
        <div>
          <span className="eyebrow">Delegated team audit</span>
          <h2>Actions taken by your authorized members</h2>
        </div>
      </div>

      {error && <div className="workspace-status" role="alert">{error} <button className="btn btn-ghost" onClick={() => void load(appliedQuery)}>Retry</button></div>}

      <div className="card" style={{ padding: 24, marginTop: 16 }}>
        <h3 className="font-semibold mb-3">Authorized members ({data?.members.length ?? 0})</h3>
        {(data?.members.length ?? 0) === 0 ? (
          <p className="workspace-empty">No delegated members are recorded for your organization yet.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Member</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {data?.members.map(m => (
                <tr key={m.id}>
                  <td>{m.name ?? m.email}<br /><span className="text-xs text-foreground-muted">{m.email}</span></td>
                  <td><span className="pill">{(m.role ?? 'Not set').replaceAll('_', ' ')}</span></td>
                  <td><span className="pill">{m.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ padding: 24, marginTop: 16 }}>
        <h3 className="font-semibold mb-3">Recorded actions</h3>
        <form onSubmit={search} className="workspace-form" style={{ marginBottom: 16 }}>
          <label>Search entity or actor reference
            <input maxLength={100} value={query} onChange={e => setQuery(e.target.value)} placeholder="Order, invoice, supplier or member reference" />
          </label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'end', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-blue" disabled={loading}>Search</button>
            <button type="button" className="btn btn-ghost" disabled={loading} onClick={() => void load(appliedQuery, null, true)}>Verify record hashes</button>
          </div>
        </form>

        {data?.verification && (
          <div className="workspace-status" role="status">
            {data.verification.valid ? 'Stored record hashes match.' : 'A stored record hash does not match.'}{' '}
            {data.verification.totalEntries} organization records checked. This does not prove global-chain completeness.
          </div>
        )}

        <AuditTrailTable
          entries={data?.entries ?? []}
          loading={loading && !data}
          emptyLabel="No recorded actions for your delegated team yet."
        />

        {data?.nextCursor && (
          <button className="btn btn-ghost" style={{ marginTop: 16 }} disabled={loading} onClick={() => void load(appliedQuery, data.nextCursor)}>
            {loading ? 'Loading…' : 'Load older events'}
          </button>
        )}
      </div>
    </div>
  );
}
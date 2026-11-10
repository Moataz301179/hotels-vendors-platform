'use client';

import { useEffect, useState } from 'react';
import { requestJson } from '@/lib/v2-http';

type OperatingArea = { code: string; group: string; subcategory: string };
type Candidate = {
  id: string;
  name: string;
  candidateType: string;
  website: string | null;
  sourceUrl: string;
  sourceObservedAt: string;
  status: string;
  operatingAreas: OperatingArea[];
};
type Register = { candidates: Candidate[]; coverage: Array<{ group: string; listings: number }>; boundary: string };

export function SupplierContractRegister() {
  const [data, setData] = useState<Register | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const register = await requestJson<Register>('/api/v2/admin/supplier-register');
    setData(register);
    return register;
  }

  useEffect(() => {
    let active = true;
    requestJson<Register>('/api/v2/admin/supplier-register').then((register) => {
      if (active) setData(register);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Unable to load the contracting register.');
    });
    return () => { active = false; };
  }, []);

  async function importRegister() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await requestJson<{ imported: number }>('/api/v2/admin/supplier-register', { method: 'POST' });
      setMessage(`${result.imported} contracting targets are ready for review.`);
      setData(await load());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load the staging register.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="card supplier-register" aria-labelledby="supplier-register-title">
    <div className="supplier-register-head">
      <div>
        <span className="eyebrow">Contracting register</span>
        <h2 id="supplier-register-title">Organizations to approach</h2>
        <p>{data?.boundary ?? 'These records stay inside administration. Hotels do not see them.'}</p>
      </div>
      <button className="btn btn-blue" type="button" disabled={busy} onClick={() => void importRegister()}>{busy ? 'Loading register…' : 'Load staging register'}</button>
    </div>
    {error ? <p className="workspace-status" role="alert">{error}</p> : null}
    {message ? <p className="workspace-status" role="status">{message}</p> : null}
    <div className="supplier-register-coverage" aria-label="Catalog coverage by operating area">
      {(data?.coverage ?? []).map((area) => <span key={area.group}><strong>{area.listings}</strong>{area.group}</span>)}
    </div>
    {!data ? <p role="status">Loading contracting targets…</p> : data.candidates.length === 0 ? <p className="workspace-empty">No contracting targets are loaded. Use the staging register to bring the reviewed public-source list into this panel.</p> : <div className="supplier-register-table"><table className="table"><thead><tr><th>Organization</th><th>Operating areas</th><th>Status</th><th>Source</th></tr></thead><tbody>{data.candidates.map((candidate) => <tr key={candidate.id}><td><strong>{candidate.name}</strong><small>{candidate.candidateType.replaceAll('_', ' ')}</small></td><td>{candidate.operatingAreas.map((area) => area.group).join(', ') || 'Unmatched'}</td><td>{candidate.status.replaceAll('_', ' ')}</td><td><a href={candidate.website ?? candidate.sourceUrl}>{candidate.website ?? candidate.sourceUrl}</a></td></tr>)}</tbody></table></div>}
  </section>;
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { requestJson } from '@/lib/v2-http';

type FundingData = { requests: Array<{ id: string; status: string; requestedAmount: string | null; requestedAt: string; factoringCompanyId: string }>; companies: Array<{ id: string; name: string }> };

export function FundingEvidence() {
  const [data, setData] = useState<FundingData | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    setData(await requestJson<FundingData>('/api/v2/funding'));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void load().catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : 'Unable to load evidence.');
    });
    return () => { cancelled = true; };
  }, [load]);

  return <section className="card workspace-table-wrap" style={{ padding: 24 }}>
    {error ? <div className="workspace-status" role="alert">{error} <button className="btn btn-ghost" onClick={() => void load()}>Retry</button></div>
      : !data ? <p role="status">Loading evidence…</p>
        : data.requests.length ? <table className="table"><thead><tr><th>Reference</th><th>Partner</th><th>Requested amount</th><th>Recorded status</th></tr></thead><tbody>{data.requests.map((request) => <tr key={request.id}><td>{request.id}</td><td>{data.companies.find((company) => company.id === request.factoringCompanyId)?.name ?? 'Not recorded'}</td><td>{request.requestedAmount === null ? 'Not recorded' : `${Number(request.requestedAmount).toLocaleString('en-EG', { maximumFractionDigits: 2 })} EGP`}</td><td>{request.status.replaceAll('_', ' ')}</td></tr>)}</tbody></table>
          : <p className="workspace-empty">No funding evidence is stored for this organization.</p>}
  </section>;
}

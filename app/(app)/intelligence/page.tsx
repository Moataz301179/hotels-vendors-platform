'use client';

import { useEffect, useState } from 'react';

type Opportunity = {
  id: string; title: string; description?: string | null; status: string;
  potentialImpact?: string | number | null; confidence?: number | null;
};
type OpportunitiesResponse = { opportunities?: Opportunity[] };

export default function Intelligence() {
  const [rows, setRows] = useState<Opportunity[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/api/v2/opportunities').then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: OpportunitiesResponse) => { if (active) setRows(Array.isArray(data.opportunities) ? data.opportunities : []); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);

  return <>
    <div className="eyebrow">Virtual Shadow</div>
    <h1 style={{ fontSize: 42, letterSpacing: '-.05em', margin: '8px 0' }}>Evidence → Opportunity → Action → Outcome</h1>
    <p className="muted" style={{ maxWidth: 760 }}>The Shadow only shows persisted opportunities belonging to your tenant. No insight is presented as fact without evidence.</p>
    <div className="card" style={{ marginTop: 28, overflow: 'hidden' }}>
      {failed ? <div style={{ padding: 28 }}>Unable to load intelligence. Check the service and try again.</div> : rows === null ? <div style={{ padding: 28 }}>Loading live intelligence…</div> : !rows.length ? <div style={{ padding: 48, textAlign: 'center' }}><div className="eyebrow">No verified opportunities</div><h2 style={{ margin: '12px 0' }}>The Shadow is watching.</h2><p className="muted" style={{ fontSize: 13 }}>Connect authorized procurement evidence to generate findings. No synthetic opportunities are created.</p></div> : <table className="table"><thead><tr><th>Finding</th><th>Status</th><th>Potential impact</th><th>Confidence</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.title}</strong><div className="muted">{row.description || 'Evidence-backed opportunity'}</div></td><td><span className="pill">{row.status}</span></td><td>{row.potentialImpact ? `${row.potentialImpact} EGP` : '—'}</td><td>{row.confidence ? `${Math.round(row.confidence * 100)}%` : '—'}</td></tr>)}</tbody></table>}
    </div>
  </>;
}

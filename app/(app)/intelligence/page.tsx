'use client';

import { useEffect, useState } from 'react';

type Opportunity = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  potentialImpact?: string | number | null;
  confidence?: number | null;
};
type OpportunitiesResponse = { opportunities?: Opportunity[] };

const nextStatus: Record<string, string | undefined> = {
  DETECTED: 'REVIEWING',
  REVIEWING: 'RESEARCHING',
  RESEARCHING: 'ACTION_READY',
  ACTION_READY: 'RFQ_SENT',
  RFQ_SENT: 'APPROVED',
  APPROVED: 'EXECUTING',
  EXECUTING: 'RESULT_PENDING',
  RESULT_PENDING: 'VERIFIED',
};

export default function Intelligence() {
  const [rows, setRows] = useState<Opportunity[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  async function load() {
    const response = await fetch('/api/v2/opportunities');
    if (!response.ok) throw new Error('load failed');
    const data = await response.json() as OpportunitiesResponse;
    setRows(Array.isArray(data.opportunities) ? data.opportunities : []);
  }

  useEffect(() => {
    let active = true;
    fetch('/api/v2/opportunities')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: OpportunitiesResponse) => {
        if (active) setRows(Array.isArray(data.opportunities) ? data.opportunities : []);
      })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);

  async function advance(row: Opportunity) {
    const status = nextStatus[row.status];
    if (!status) return;
    setBusy(row.id);
    setMessage('');
    try {
      const response = await fetch('/api/v2/opportunities/' + row.id + '/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || body.error || 'Transition failed');
      setMessage('Opportunity advanced to ' + status + '.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to advance opportunity.');
    } finally {
      setBusy(null);
    }
  }

  return <>
    <div className="eyebrow">Virtual Shadow</div>
    <h1 style={{ fontSize: 42, letterSpacing: '-.05em', margin: '8px 0' }}>Evidence → Opportunity → Action → Outcome</h1>
    <p className="muted" style={{ maxWidth: 760 }}>The Shadow only shows persisted opportunities belonging to your tenant. No insight is presented as fact without evidence.</p>
    {message && <div className="card" role="status" style={{ marginTop: 20, padding: 14 }}>{message}</div>}
    <div className="card" style={{ marginTop: 28, overflow: 'hidden' }}>
      {failed ? <div style={{ padding: 28 }}>Unable to load intelligence. Check the service and try again.</div> :
        rows === null ? <div style={{ padding: 28 }}>Loading live intelligence…</div> :
        !rows.length ? <div style={{ padding: 48, textAlign: 'center' }}><div className="eyebrow">No verified opportunities</div><h2 style={{ margin: '12px 0' }}>The Shadow is watching.</h2><p className="muted" style={{ fontSize: 13 }}>Connect authorized procurement evidence to generate findings. No synthetic opportunities are created.</p></div> :
        <table className="table"><thead><tr><th>Finding</th><th>Status</th><th>Potential impact</th><th>Confidence</th><th>Next action</th></tr></thead><tbody>
          {rows.map((row) => <tr key={row.id}>
            <td><strong>{row.title}</strong><div className="muted">{row.description || 'Evidence-backed opportunity'}</div></td>
            <td><span className="pill">{row.status}</span></td>
            <td>{row.potentialImpact ? String(row.potentialImpact) + ' EGP' : '—'}</td>
            <td>{row.confidence ? String(Math.round(row.confidence * 100)) + '%' : '—'}</td>
            <td>{nextStatus[row.status] ? <button className="btn btn-blue" disabled={busy === row.id} onClick={() => advance(row)}>{busy === row.id ? 'Updating…' : 'Advance to ' + nextStatus[row.status]}</button> : 'Complete'}</td>
          </tr>)}
        </tbody></table>}
    </div>
  </>;
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { requestJson } from '@/lib/v2-http';

type Alert = { id: string; severity: string; kind: string; title: string; detail: string; href: string };

export function WorkspaceAlerts() {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    requestJson<{ alerts: Alert[] }>('/api/v2/alerts')
      .then(data => { if (active) setAlerts(data.alerts); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Unable to load operational alerts.'); });
    return () => { active = false; };
  }, []);

  return <section className="card" style={{ padding: 24, marginTop: 20 }} aria-labelledby="workspace-alerts-title">
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'baseline', flexWrap: 'wrap' }}>
      <div><div className="eyebrow">Operational signals</div><h2 id="workspace-alerts-title" style={{ margin: '8px 0 0' }}>Inventory and cashflow watch</h2></div>
      <span className="muted" style={{ fontSize: 12 }}>Derived from your tenant records</span>
    </div>
    {error ? <div className="workspace-status" role="alert">{error}</div> : alerts === null ? <p role="status" className="muted">Checking inventory, approvals and payment exposure…</p> : alerts.length === 0 ? <p className="muted">No active operational alerts. New signals appear when persisted inventory, order or invoice records need attention.</p> : <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>{alerts.slice(0, 8).map(alert => <Link key={alert.id} href={alert.href} className="workspace-alert" data-severity={alert.severity}><div><strong>{alert.title}</strong><p className="muted" style={{ margin: '4px 0 0' }}>{alert.detail}</p></div><span aria-hidden="true">→</span></Link>)}</div>}
  </section>;
}

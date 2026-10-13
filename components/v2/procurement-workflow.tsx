'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { requestJson } from '@/lib/v2-http';

type Workflow = { rfqs: number; quotes: number; orders: number; pendingApprovals: number };

export function ProcurementWorkflow() {
  const [data, setData] = useState<Workflow | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.all([
      requestJson<{ rfqs: Array<{ status: string }> }>('/api/v2/rfq'),
      requestJson<{ quotes: Array<{ status: string }> }>('/api/v2/quotes'),
      requestJson<{ orders: Array<{ status: string }> }>('/api/v2/orders'),
    ]).then(([rfq, quote, order]) => { if (active) setData({ rfqs: rfq.rfqs.length, quotes: quote.quotes.length, orders: order.orders.length, pendingApprovals: order.orders.filter(item => item.status === 'PENDING_APPROVAL').length }); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Unable to load workflow records.'); });
    return () => { active = false; };
  }, []);
  return <section className="card" style={{ padding: 24, marginTop: 20 }} aria-labelledby="workflow-title">
    <div className="eyebrow">Connected procurement workflow</div><h2 id="workflow-title" style={{ margin: '8px 0' }}>RFQ → quote → approval → order</h2>
    <p className="muted">Each count below is read from the authenticated workspace APIs. Actions remain role- and permission-controlled.</p>
    {error ? <div className="workspace-status" role="alert">{error}</div> : data === null ? <p role="status" className="muted">Loading workflow records…</p> : <div className="grid4" style={{ marginTop: 18 }}>{[['RFQs', data.rfqs, '/workspace/marketplace'], ['Quotes', data.quotes, '/workspace/marketplace'], ['Orders', data.orders, '/orders'], ['Awaiting approval', data.pendingApprovals, '/orders']].map(([label, value, href]) => <Link key={String(label)} href={String(href)} className="card" style={{ padding: 16, boxShadow: 'none' }}><div className="eyebrow">{label}</div><div className="metric" style={{ marginTop: 8 }}>{value}</div></Link>)}</div>}
  </section>;
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { requestJson } from '@/lib/v2-http';

type OperationsSummary = {
  reviewQueues: { pendingRegistrations: number; pendingCatalogReviews: number; pendingDirectoryCandidates: number };
  collections: {
    outstandingInvoices: number; openInvoiceFaceValue: number; paidInvoices: number; paidGross: number;
    factoredInvoices: number; factoredGross: number; cashBasisPlatformFees: number;
    paymentTransactions: { pending: number; paid: number };
  };
};

const egp = (amount: number) => new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);

export function AdminOperationsOverview() {
  const [summary, setSummary] = useState<OperationsSummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    requestJson<OperationsSummary>('/api/v2/admin/operations-summary')
      .then((data) => { if (active) setSummary(data); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Unable to load operations overview.'); });
    return () => { active = false; };
  }, []);

  return <section className="workspace-section" aria-labelledby="operations-overview-title">
    <header className="workspace-page-header"><div className="workspace-page-header-copy"><div className="eyebrow">Platform operations</div><h1 id="operations-overview-title">Control centre</h1><p className="workspace-page-lead muted">Review queues and recorded cash-status totals across the network. Figures are operational indicators, not a statutory revenue-recognition report.</p></div></header>
    {error ? <div className="workspace-status" role="alert">{error}</div> : !summary ? <p role="status" className="workspace-empty">Loading platform operations…</p> : <>
      <div className="grid3">
        <Link href="#registration-review" className="card workspace-metric-card"><div className="eyebrow">Registration review</div><div className="metric">{summary.reviewQueues.pendingRegistrations}</div><small>Pending user registrations</small></Link>
        <Link href="#catalog-publication-review" className="card workspace-metric-card"><div className="eyebrow">Catalog review</div><div className="metric">{summary.reviewQueues.pendingCatalogReviews}</div><small>Catalog submissions awaiting a decision</small></Link>
        <Link href="#directory-candidate-review" className="card workspace-metric-card"><div className="eyebrow">Directory review</div><div className="metric">{summary.reviewQueues.pendingDirectoryCandidates}</div><small>Supplier-neutral candidates awaiting review</small></Link>
      </div>
      <div className="grid3 workspace-section">
        <div className="card workspace-metric-card"><div className="eyebrow">Open invoice face value</div><div className="metric">{egp(summary.collections.openInvoiceFaceValue)}</div><small>{summary.collections.outstandingInvoices} unpaid, partial, or overdue invoice records. Partial-payment balances require settlement reconciliation.</small></div>
        <div className="card workspace-metric-card"><div className="eyebrow">Paid invoice records</div><div className="metric">{egp(summary.collections.paidGross)}</div><small>{summary.collections.paidInvoices} paid invoices · {summary.collections.paymentTransactions.paid} paid payment records</small></div>
        <div className="card workspace-metric-card"><div className="eyebrow">Cash-basis platform fee basis</div><div className="metric">{egp(summary.collections.cashBasisPlatformFees)}</div><small>Derived only from invoices recorded as paid; not financial statements</small></div>
      </div>
      {summary.collections.factoredInvoices > 0 && <p className="muted" style={{ marginTop: 14 }}>{summary.collections.factoredInvoices} factored invoice records totaling {egp(summary.collections.factoredGross)} remain under external funder decisions and settlement terms.</p>}
    </>}
  </section>;
}

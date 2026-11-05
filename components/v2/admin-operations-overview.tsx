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
    <header className="workspace-section-heading"><div><div className="eyebrow">Operational overview</div><h2 id="operations-overview-title">Network health</h2><p>Review queues and recorded settlement status across the network. These are operational indicators, not financial statements or automated funding decisions.</p></div></header>
    {error ? <div className="workspace-status" role="alert">{error}</div> : !summary ? <p role="status" className="workspace-empty">Loading platform operations…</p> : <>
      <div className="grid3">
        <Link href="#registration-review" className="card workspace-metric-card"><div className="eyebrow">Registration review</div><div className="metric">{summary.reviewQueues.pendingRegistrations}</div><small>Pending user registrations</small></Link>
        <Link href="#directory-source-governance" className="card workspace-metric-card"><div className="eyebrow">Source governance</div><div className="metric">{summary.reviewQueues.pendingDirectoryCandidates}</div><small>Data sources requiring governance attention</small></Link>
        <Link href="#supplier-review" className="card workspace-metric-card"><div className="eyebrow">Vendor verification</div><div className="metric">{summary.reviewQueues.pendingCatalogReviews}</div><small>Vendor evidence and catalogue eligibility</small></Link>
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

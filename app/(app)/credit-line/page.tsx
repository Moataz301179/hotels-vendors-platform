'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Landmark, ShieldCheck } from 'lucide-react';
import { requestJson } from '@/lib/v2-http';
import type { CreditAccess } from '@/lib/credit/workspace-access';

type QueueRow = {
  id: string;
  status: string;
  hotelName: string;
  taxId: string;
  governorate: string | null;
  createdAt: string;
  tenantId: string;
};

type Payload = { access: CreditAccess; queue?: QueueRow[] };

const STAGE_COPY: Record<string, { title: string; detail: string }> = {
  needs_legibility: {
    title: 'Make your organization legible to a funder.',
    detail: 'Before the purchasing dashboard opens, a funder must be able to review your organization for a credit line. HotelsVendors records the package — it does not approve credit.',
  },
  awaiting_funder: {
    title: 'Waiting for the funder decision.',
    detail: 'Your legibility package is recorded. Only the funder can approve a credit line. Orders stay closed until that provider decision is written.',
  },
  rejected: {
    title: 'The funder declined this application.',
    detail: 'Update the package or contact the funder. HotelsVendors cannot override a funder decline or invent an approval.',
  },
  active: {
    title: 'Funder-approved credit line is active.',
    detail: 'Purchase orders may proceed through sealed sourcing. Payment draws still require funder-controlled guarantee and accepted invoice evidence.',
  },
  not_required: {
    title: 'Credit line not required for this role.',
    detail: 'Carrier, funder, and administrator screens do not gate on a buyer/supplier facility.',
  },
};

export default function CreditLinePage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    organizationName: '',
    taxId: '',
    crNumber: '',
    governorate: '',
    address: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [decision, setDecision] = useState<{ id: string; decision: 'APPROVED' | 'REJECTED' } | null>(null);
  const [approvedLimit, setApprovedLimit] = useState('100000');
  const [rejectedReason, setRejectedReason] = useState('');
  const [externalReference, setExternalReference] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await requestJson<Payload>('/api/v2/credit-line'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load credit-line status.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitLegibility(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await requestJson('/api/v2/credit-line', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit legibility.');
    } finally {
      setBusy(false);
    }
  }

  async function submitFunderDecision(event: FormEvent) {
    event.preventDefault();
    if (!decision) return;
    setBusy(true);
    setError('');
    try {
      await requestJson('/api/v2/credit-line', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          applicationId: decision.id,
          decision: decision.decision,
          approvedLimit: decision.decision === 'APPROVED' ? Number(approvedLimit) : undefined,
          rejectedReason: decision.decision === 'REJECTED' ? rejectedReason : undefined,
          externalReference: externalReference || undefined,
        }),
      });
      setDecision(null);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to record funder decision.');
    } finally {
      setBusy(false);
    }
  }

  if (!data && !error) {
    return <p className="workspace-empty" role="status">Loading credit-line status…</p>;
  }
  if (error && !data) {
    return (
      <div className="workspace-status" role="alert">
        {error} <button className="btn btn-ghost" onClick={() => void load()}>Retry</button>
      </div>
    );
  }

  const access = data!.access;
  const copy = STAGE_COPY[access.stage] ?? STAGE_COPY.needs_legibility;
  const isBuyer = access.role === 'HOTEL' || access.role === 'SUPPLIER';
  const isFunder = access.role === 'FACTORING';

  return (
    <div className="account-page credit-line-page">
      <header className="workspace-page-header">
        <div className="workspace-page-header-copy">
          <div className="eyebrow">Credit line · funder-controlled</div>
          <h1>{copy.title}</h1>
          <p className="workspace-page-lead muted">{copy.detail}</p>
        </div>
        <div className="workspace-page-actions">
          {access.canOpenFullDashboard ? (
            <Link href="/dashboard" className="btn btn-blue">
              Open dashboard <ArrowRight aria-hidden="true" />
            </Link>
          ) : (
            <Link href="/onboarding" className="btn btn-ghost">Organization profile</Link>
          )}
        </div>
      </header>

      <section className="workspace-focus funding-boundary">
        <div>
          <span className="eyebrow">External-provider boundary</span>
          <h2>No credit line → no orders.</h2>
          <p>{access.boundary}</p>
        </div>
        <div className="funding-boundary-points">
          <span><ShieldCheck aria-hidden="true" />Legibility first</span>
          <span><Landmark aria-hidden="true" />Funder approves only</span>
          <span><ShieldCheck aria-hidden="true" />Accepted invoice for draws</span>
        </div>
      </section>

      {error ? (
        <div className="workspace-status" role="alert">
          {error} <button className="btn btn-ghost" onClick={() => void load()}>Retry</button>
        </div>
      ) : null}

      <section className="card">
        <h2>Current status</h2>
        <dl>
          <dt>Stage</dt>
          <dd>{access.stage.replaceAll('_', ' ')}</dd>
          <dt>Orders</dt>
          <dd>{access.canPlaceOrders ? 'Unlocked for sealed sourcing' : 'Blocked — CREDIT_LINE_REQUIRED'}</dd>
          <dt>Dashboard</dt>
          <dd>{access.canOpenFullDashboard ? 'Full workspace available' : 'Gated until funder approval'}</dd>
          {access.application ? (
            <>
              <dt>Application</dt>
              <dd>
                {access.application.hotelName} · {access.application.status}
                {access.application.rejectedReason ? ` — ${access.application.rejectedReason}` : ''}
              </dd>
            </>
          ) : null}
          {access.facility ? (
            <>
              <dt>Facility</dt>
              <dd>
                {access.facility.source} · {access.facility.status}
                {access.facility.limit ? ` · limit ${access.facility.limit} EGP` : ''}
              </dd>
            </>
          ) : null}
        </dl>
      </section>

      {isBuyer && access.stage === 'needs_legibility' ? (
        <section className="card">
          <h2>Submit organization legibility</h2>
          <p>Provide identity evidence for funder review. This does not open purchasing.</p>
          <form className="workspace-form workspace-form-single" onSubmit={submitLegibility} style={{ marginTop: 16 }}>
            <label>Organization name<input required value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })} /></label>
            <label>Tax ID<input required value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} /></label>
            <label>Commercial registration<input value={form.crNumber} onChange={(e) => setForm({ ...form, crNumber: e.target.value })} /></label>
            <label>Governorate<input value={form.governorate} onChange={(e) => setForm({ ...form, governorate: e.target.value })} /></label>
            <label>Operating address<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
            <label>Contact name<input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></label>
            <label>Contact email<input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></label>
            <label>Contact phone<input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></label>
            <div className="workspace-form-actions">
              <button className="btn btn-blue" disabled={busy}>{busy ? 'Submitting…' : 'Submit for funder review'}</button>
            </div>
          </form>
        </section>
      ) : null}

      {isBuyer && access.stage === 'awaiting_funder' ? (
        <section className="card">
          <h2>What happens next</h2>
          <ol className="role-dashboard-journey" style={{ listStyle: 'decimal', paddingLeft: 20, margin: '12px 0 0' }}>
            <li>Funder reviews the recorded legibility package.</li>
            <li>Only the funder writes APPROVED or REJECTED.</li>
            <li>On APPROVED, an ACTIVE facility unlocks the dashboard and order path.</li>
            <li>PO payment still requires a funder-controlled guarantee against an accepted invoice.</li>
          </ol>
        </section>
      ) : null}

      {isFunder ? (
        <section className="card">
          <h2>Funder review queue</h2>
          <p>Record your institution’s credit-line decision. This does not move money.</p>
          {data?.queue?.length ? (
            <div className="funding-request-list" style={{ marginTop: 16 }}>
              {data.queue.map((row) => (
                <article className="card funding-request-card" key={row.id}>
                  <Landmark aria-hidden="true" />
                  <div>
                    <span className="workspace-status-chip is-neutral">{row.status}</span>
                    <h3>{row.hotelName}</h3>
                    <p>Tax {row.taxId}{row.governorate ? ` · ${row.governorate}` : ''} · {new Date(row.createdAt).toLocaleDateString('en-GB')}</p>
                  </div>
                  <div className="funding-request-actions">
                    <button className="btn btn-blue" type="button" onClick={() => setDecision({ id: row.id, decision: 'APPROVED' })}>Record approval</button>
                    <button className="btn btn-ghost" type="button" onClick={() => setDecision({ id: row.id, decision: 'REJECTED' })}>Record decline</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="workspace-empty">No open credit-line applications are waiting for your institution.</p>
          )}
          {decision ? (
            <form className="workspace-form" onSubmit={submitFunderDecision} style={{ marginTop: 18 }}>
              <h3>{decision.decision === 'APPROVED' ? 'Record funder approval' : 'Record funder decline'}</h3>
              {decision.decision === 'APPROVED' ? (
                <label>Approved limit (EGP)<input required type="number" min={1} step="0.01" value={approvedLimit} onChange={(e) => setApprovedLimit(e.target.value)} /></label>
              ) : (
                <label>Decline reason<textarea required minLength={5} value={rejectedReason} onChange={(e) => setRejectedReason(e.target.value)} /></label>
              )}
              <label>External provider reference <span className="muted">(optional)</span><input value={externalReference} onChange={(e) => setExternalReference(e.target.value)} /></label>
              <div className="workspace-form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setDecision(null)}>Cancel</button>
                <button className="btn btn-blue" disabled={busy}>{busy ? 'Recording…' : 'Record funder decision'}</button>
              </div>
            </form>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

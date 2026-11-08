'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, FileCheck2, Landmark, ShieldCheck } from 'lucide-react';
import { requestJson } from '@/lib/v2-http';
import { RegulatoryConnectionNotice } from '@/components/v2/regulatory-connection-notice';

export type FundingRole = 'HOTEL' | 'SUPPLIER' | 'FACTORING' | 'ADMIN';
type FundingRequest = { id: string; status: string; requestedAmount: string | null; requestedAt: string; factoringCompanyId: string };
type FundingData = { requests: FundingRequest[]; companies: Array<{ id: string; name: string }>; decisionBoundary: string };
const NEXT: Record<string, Array<{ status: string; label: string }>> = { PENDING: [{ status: 'UNDER_REVIEW', label: 'Start provider review' }, { status: 'REJECTED', label: 'Record decline' }], UNDER_REVIEW: [{ status: 'APPROVED', label: 'Record approval' }, { status: 'REJECTED', label: 'Record decline' }], APPROVED: [{ status: 'DISBURSED', label: 'Record provider disbursement' }], DISBURSED: [{ status: 'SETTLED', label: 'Record provider settlement' }, { status: 'DEFAULTED', label: 'Record provider default' }] };
const LABEL: Record<string, string> = { PENDING: 'Referral recorded', UNDER_REVIEW: 'Under provider review', APPROVED: 'Provider approved', REJECTED: 'Provider declined', DISBURSED: 'Provider reported disbursement', SETTLED: 'Provider reported settlement', DEFAULTED: 'Provider reported default' };

export function FundingClient({ role }: { role: FundingRole }) {
  const [data, setData] = useState<FundingData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<{ request: FundingRequest; status: string } | null>(null);
  const [externalReference, setExternalReference] = useState('');
  const [reconciliationNote, setReconciliationNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await requestJson<FundingData>('/api/v2/funding')); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load funding records.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  function chooseAction(request: FundingRequest, status: string) { setAction({ request, status }); setExternalReference(''); setReconciliationNote(''); setError(''); }
  async function submitAction(event: FormEvent) {
    event.preventDefault(); if (!action) return;
    setBusy(true); setError('');
    try {
      await requestJson('/api/v2/funding', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: action.request.id, status: action.status, externalReference: externalReference || undefined, reconciliationNote: reconciliationNote || undefined }) });
      setAction(null); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to record the provider status.'); }
    finally { setBusy(false); }
  }

  const title = role === 'FACTORING' ? 'Make the provider decision visible—without moving money.' : role === 'SUPPLIER' ? 'Track the referral after verified fulfilment.' : role === 'HOTEL' ? 'See referral status without surrendering commercial control.' : 'Govern the provider-controlled referral boundary.';
  const detail = role === 'FACTORING' ? 'Record a provider-controlled review, decision and reconciliation reference for referrals released to your organization.' : 'A provider-approved facility may be used only under that provider’s active terms and transaction-eligibility decision. HotelsVendors records the authorized status; the external provider owns underwriting, approval, disbursement and settlement.';
  const needsReference = action && ['DISBURSED', 'SETTLED', 'DEFAULTED'].includes(action.status);

  return <div className="funding-console">
    <header className="workspace-page-header"><div className="workspace-page-header-copy"><div className="eyebrow">{role === 'FACTORING' ? 'Funder workspace' : 'Funding referral records'}</div><h1>{title}</h1><p className="workspace-page-lead muted">{detail}</p></div><div className="workspace-page-actions">{role === 'FACTORING' ? <Link href="/funding/evidence" className="btn btn-blue">Review released evidence <ArrowRight aria-hidden="true"/></Link> : <Link href="/onboarding" className="btn btn-ghost">Organization profile</Link>}</div></header>
    <section className="workspace-focus funding-boundary"><div><span className="eyebrow">External-provider boundary</span><h2>Provider facility records—not lending by HotelsVendors.</h2><p>Facility availability, transaction eligibility and any payment-protection status must come from a provisioned provider record. HotelsVendors does not underwrite, approve credit, disburse or settle funds.</p></div><div className="funding-boundary-points"><span><ShieldCheck aria-hidden="true"/>Authorized evidence only</span><span><Landmark aria-hidden="true"/>Provider decision only</span><span><FileCheck2 aria-hidden="true"/>Reconciliation reference required</span></div></section>
    <RegulatoryConnectionNotice compact />
    {error && <div className="workspace-status" role="alert">{error} <button className="btn btn-ghost" onClick={() => void load()} disabled={loading || busy}>Retry</button></div>}
    {loading ? <p className="workspace-empty" role="status">Loading authorized funding records…</p> : <>
      <section className="workspace-section" aria-labelledby="funding-records-title"><div className="workspace-section-heading"><div><span className="eyebrow">Referral queue</span><h2 id="funding-records-title">{role === 'FACTORING' ? 'Provider review queue' : 'Recorded referrals'}</h2><p>{role === 'FACTORING' ? 'Only your assigned external-provider referrals are visible.' : 'Status is evidence of a provider record, not a funding offer or payment.'}</p></div></div>
        {data?.requests.length ? <div className="funding-request-list">{data.requests.map((request) => <article className="card funding-request-card" key={request.id}><CheckCircle2 aria-hidden="true"/><div><span className="workspace-status-chip is-neutral">{LABEL[request.status] ?? request.status}</span><h3>Referral {request.id.slice(-8)}</h3><p>{request.requestedAmount === null ? 'Amount is not recorded.' : `${Number(request.requestedAmount).toLocaleString('en-EG', { maximumFractionDigits: 2 })} EGP recorded`} · {new Date(request.requestedAt).toLocaleDateString('en-GB')}</p></div>{role === 'FACTORING' && NEXT[request.status]?.length ? <div className="funding-request-actions">{NEXT[request.status].map((option) => <button className={option.status === 'REJECTED' || option.status === 'DEFAULTED' ? 'btn btn-ghost' : 'btn btn-blue'} key={option.status} onClick={() => chooseAction(request, option.status)}>{option.label}</button>)}</div> : <span className="funding-record-note">{role === 'FACTORING' ? 'No further supported provider transition.' : 'Provider-controlled status'}</span>}</article>)}</div> : <p className="workspace-empty">No authorized funding referral is recorded for this workspace.</p>}
      </section>
      {role === 'FACTORING' && action ? <section className="card funding-decision-form" aria-labelledby="funding-decision-title"><div><span className="eyebrow">Provider status record</span><h2 id="funding-decision-title">{LABEL[action.status] ?? action.status}</h2><p className="muted">For referral {action.request.id.slice(-8)}. This records the provider’s status; it does not trigger money movement.</p></div><form className="workspace-form" onSubmit={submitAction}>{needsReference ? <label>External provider reference<input required maxLength={160} value={externalReference} onChange={(event) => setExternalReference(event.target.value)} placeholder="Provider decision or reconciliation reference"/></label> : null}<label>Provider note <span className="muted">(optional)</span><textarea maxLength={1000} value={reconciliationNote} onChange={(event) => setReconciliationNote(event.target.value)} placeholder="Record the provider context without adding private hotel or Vendor data."/></label><div className="workspace-form-actions"><button type="button" className="btn btn-ghost" onClick={() => setAction(null)}>Cancel</button><button className="btn btn-blue" disabled={busy}>{busy ? 'Recording…' : 'Record provider status'}</button></div></form></section> : null}
      <p className="muted funding-decision-boundary">{data?.decisionBoundary ?? 'External funders approve, disburse and settle financing. HotelsVendors records the referral and provider-reported status only.'}</p>
    </>}
  </div>;
}

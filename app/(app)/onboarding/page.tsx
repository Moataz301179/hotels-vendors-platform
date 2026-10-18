'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { requestJson } from '@/lib/v2-http';

type State = { complete: boolean; platformRole: string; status: string; pendingVerification: boolean; resources: Record<string, number> };
const labels = { name: 'Organization name', taxId: 'Tax ID', city: 'City', governorate: 'Governorate', address: 'Operating address', phone: 'Contact phone' };
const governorates = ['Alexandria', 'Aswan', 'Asyut', 'Beheira', 'Beni Suef', 'Cairo', 'Dakahlia', 'Damietta', 'Faiyum', 'Gharbia', 'Giza', 'Ismailia', 'Kafr El Sheikh', 'Luxor', 'Matrouh', 'Minya', 'Monufia', 'New Valley', 'North Sinai', 'Port Said', 'Qalyubia', 'Qena', 'Red Sea', 'Sharqia', 'Sohag', 'South Sinai', 'Suez'];

export default function Onboarding() {
  const [state, setState] = useState<State | null>(null);
  const [form, setForm] = useState({ name: '', taxId: '', city: '', governorate: '', address: '', phone: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  async function load() { setState(await requestJson<State>('/api/v2/onboarding')); }
  useEffect(() => { let active = true; load().catch(e => { if (active) setError(e instanceof Error ? e.message : 'Unable to load onboarding.'); }); return () => { active = false; }; }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('');
    try { await requestJson('/api/v2/onboarding', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) }); await load(); setMessage('Organization details submitted for verification.'); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to submit organization details.'); }
    finally { setBusy(false); }
  }

  const needsTaxId = state?.platformRole !== 'SHIPPING';
  const canContinue = Boolean(form.name.trim() && (!needsTaxId || form.taxId.trim()));
  const canSubmit = Boolean(canContinue && form.city.trim() && form.governorate);

  return <>
    <header className="workspace-page-header"><div className="workspace-page-header-copy"><div className="eyebrow">Organization profile</div><h1>Set up your organisation.</h1><p className="workspace-page-lead muted">Use two short steps to connect the right workspace. Verification follows submission; no access or financial decision is implied before that review.</p></div></header>
    {error ? <div className="workspace-status" role="alert">{error} <button className="btn btn-ghost" onClick={() => window.location.reload()}>Retry</button></div> : !state ? <p role="status">Loading organization profile…</p> : <section className="card workspace-onboarding" aria-labelledby="onboarding-title">
      <div className="eyebrow">Requested workspace: {state.platformRole}</div>
      {state.complete && state.pendingVerification ? <><h2 id="onboarding-title">Application submitted</h2><p className="muted">Your organisation profile is recorded, but a HOTELSVENDORS administrator must verify it before workspace actions are enabled.</p><p className="workspace-status" role="status">Status: pending verification</p></> : state.complete ? <><h2 id="onboarding-title">Profile connected</h2><p className="muted">Your organisation profile is connected to this workspace.</p><Link href="/dashboard" className="btn btn-blue">Continue to workspace</Link></> : <><h2 id="onboarding-title">Tell us only what the operating record needs.</h2><div className="workspace-stepper" aria-label="Organization setup progress"><span className={step === 1 ? 'active' : ''}>1. Organisation</span><span className={step === 2 ? 'active' : ''}>2. Location</span></div><form onSubmit={save}>{step === 1 ? <div className="workspace-form workspace-form-single"><label>{labels.name}<input required autoComplete="organization" maxLength={160} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your legal or operating name" /></label>{needsTaxId && <label>{labels.taxId}<input required inputMode="numeric" autoComplete="off" maxLength={80} value={form.taxId} onChange={e => setForm({ ...form, taxId: e.target.value })} placeholder="Tax registration number" /></label>}<div className="workspace-form-actions"><button type="button" className="btn btn-blue" disabled={!canContinue} onClick={() => setStep(2)}>Continue to location</button></div></div> : <div className="workspace-form workspace-form-single"><label>{labels.governorate}<select required value={form.governorate} onChange={e => setForm({ ...form, governorate: e.target.value })}><option value="">Choose governorate</option>{governorates.map(governorate => <option key={governorate} value={governorate}>{governorate}</option>)}</select></label><label>{labels.city}<input required autoComplete="address-level2" maxLength={100} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="City or operating area" /></label><label>{labels.address} <span className="muted">(optional)</span><input autoComplete="street-address" maxLength={300} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Street address" /></label><label>{labels.phone} <span className="muted">(optional)</span><input autoComplete="tel" inputMode="tel" maxLength={50} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Main operating contact" /></label><div className="workspace-form-actions"><button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>Back</button><button className="btn btn-blue" disabled={busy || !canSubmit}>{busy ? 'Submitting…' : 'Submit for verification'}</button></div></div>}</form></>}
      {message && <p className="workspace-status" role="status">{message}</p>}
    </section>}
  </>;
}

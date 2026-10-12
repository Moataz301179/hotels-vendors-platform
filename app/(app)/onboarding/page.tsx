'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { requestJson } from '@/lib/v2-http';

type State = { complete: boolean; platformRole: string; status: string; pendingVerification: boolean; resources: Record<string, number> };
const labels = { name: 'Organization name', taxId: 'Tax ID', city: 'City', governorate: 'Governorate', address: 'Operating address', phone: 'Contact phone' };

export default function Onboarding() {
  const [state, setState] = useState<State | null>(null);
  const [form, setForm] = useState({ name: '', taxId: '', city: '', governorate: '', address: '', phone: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() { setState(await requestJson<State>('/api/v2/onboarding')); }
  useEffect(() => { let active = true; load().catch(e => { if (active) setError(e instanceof Error ? e.message : 'Unable to load onboarding.'); }); return () => { active = false; }; }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('');
    try { await requestJson('/api/v2/onboarding', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) }); await load(); setMessage('Organization details submitted for verification.'); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to submit organization details.'); }
    finally { setBusy(false); }
  }

  return <>
    <div className="eyebrow">Organization profile</div>
    <h1>Start with your business.</h1>
    <p className="muted">Registration creates an application. Access to procurement records and supplier publishing requires organization verification and administrator approval.</p>
    {error ? <div className="workspace-status" role="alert">{error} <button className="btn btn-ghost" onClick={() => window.location.reload()}>Retry</button></div> : !state ? <p role="status">Loading organization profile…</p> : <section className="card" style={{ maxWidth: 760, padding: 26, marginTop: 28 }}>
      <div className="eyebrow">Requested workspace: {state.platformRole}</div>
      {state.complete && state.pendingVerification ? <><h2>Application submitted</h2><p className="muted">Your organization profile is recorded, but a HotelsVendors administrator must verify it before workspace actions are enabled.</p><p className="workspace-status" role="status">Status: pending verification</p></> : state.complete ? <><h2>Profile connected</h2><Link href="/dashboard" className="btn btn-blue">Continue to workspace</Link></> : <><h2>Required business details</h2><form onSubmit={save}><div className="workspace-form">{(Object.keys(labels) as Array<keyof typeof labels>).map(key => <label key={key}>{labels[key]}<input required={['name', 'city', 'governorate'].includes(key) || (key === 'taxId' && state.platformRole !== 'SHIPPING')} autoComplete={key === 'phone' ? 'tel' : key === 'address' ? 'street-address' : undefined} type={key === 'phone' ? 'tel' : 'text'} maxLength={160} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></label>)}</div><button className="btn btn-blue" disabled={busy} style={{ marginTop: 20 }}>{busy ? 'Submitting…' : 'Submit for verification'}</button></form></>}
      {message && <p role="status">{message}</p>}
    </section>}
  </>;
}

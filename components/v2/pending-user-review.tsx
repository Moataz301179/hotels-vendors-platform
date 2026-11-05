'use client';

import { useEffect, useState } from 'react';
import { requestJson } from '@/lib/v2-http';

type PendingUser = { id: string; email: string; name: string; platformRole: string; createdAt: string };

export function PendingUserReview() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [taxVerification, setTaxVerification] = useState<'VERIFY' | 'PENDING'>('PENDING');
  async function load() { const data = await requestJson<{ users: PendingUser[] }>('/api/v2/admin/pending-users'); setUsers(data.users ?? []); }
  useEffect(() => { void load().catch(e => setMessage(e instanceof Error ? e.message : 'Unable to load pending registrations.')); }, []);
  async function decide(userId: string, decision: 'APPROVE' | 'REJECT') {
    if (reviewNote.trim().length < 10) { setMessage('Record a review note of at least 10 characters before submitting a decision.'); return; }
    setBusy(userId);
    try { await requestJson('/api/v2/admin/pending-users', { method: 'PATCH', body: JSON.stringify({ userId, decision, taxVerification: decision === 'REJECT' ? 'REJECT' : taxVerification, reviewNote }) }); setMessage(`Registration ${decision === 'APPROVE' ? 'approved' : 'rejected'}. Financial activity remains blocked unless the tax ID was verified.`); await load(); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to update registration.'); }
    finally { setBusy(''); setReviewing(null); setReviewNote(''); setTaxVerification('PENDING'); }
  }
  return <section className="card" style={{ padding: 24, marginTop: 24 }}><div className="workspace-section-heading"><div><div className="eyebrow">Trust & access</div><h2>Organization review queue</h2><p>New hotel and Vendor workspaces remain blocked from procurement until an authorized reviewer records a reasoned decision.</p></div></div>{users.length ? users.map(user => <article key={user.id} className="admin-review-row"><div><strong>{user.name || user.email}</strong><p className="muted">{user.email} · {user.platformRole} · submitted {new Date(user.createdAt).toLocaleDateString()}</p></div>{reviewing !== user.id ? <div className="admin-review-actions"><button className="btn btn-blue" disabled={busy === user.id} onClick={() => { setReviewing(user.id); setReviewNote('Organization details reviewed.'); }}>Review registration</button></div> : <div className="admin-review-form"><label>Review rationale<textarea autoFocus minLength={10} maxLength={1000} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} /></label><label className="admin-review-check"><input type="checkbox" checked={taxVerification === 'VERIFY'} onChange={(event) => setTaxVerification(event.target.checked ? 'VERIFY' : 'PENDING')} /> Tax identity checked for financial eligibility</label><div className="admin-review-actions"><button className="btn btn-blue" disabled={busy === user.id} onClick={() => void decide(user.id, 'APPROVE')}>Approve workspace</button><button className="btn btn-ghost" disabled={busy === user.id} onClick={() => void decide(user.id, 'REJECT')}>Reject</button><button className="btn btn-ghost" disabled={busy === user.id} onClick={() => { setReviewing(null); setReviewNote(''); }}>Cancel</button></div></div>}</article>) : <p className="muted">No organization registrations are awaiting review.</p>}{message && <p className="workspace-status" role="status">{message}</p>}</section>;
}

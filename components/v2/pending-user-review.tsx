'use client';

import { useEffect, useState } from 'react';
import { requestJson } from '@/lib/v2-http';

type PendingUser = { id: string; email: string; name: string; platformRole: string; createdAt: string };

export function PendingUserReview() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  async function load() { const data = await requestJson<{ users: PendingUser[] }>('/api/v2/admin/pending-users'); setUsers(data.users ?? []); }
  useEffect(() => { void load().catch(e => setMessage(e instanceof Error ? e.message : 'Unable to load pending registrations.')); }, []);
  async function decide(userId: string, decision: 'APPROVE' | 'REJECT') {
    const reviewNote = window.prompt('Review note (at least 10 characters):', decision === 'APPROVE' ? 'Organization details reviewed and approved.' : 'Organization details did not pass verification.') ?? '';
    if (reviewNote.trim().length < 10) { setMessage('A review note of at least 10 characters is required.'); return; }
    setBusy(userId);
    const taxVerification = decision === 'APPROVE' && window.confirm('Has the organization tax ID been checked and approved for financial activity?') ? 'VERIFY' : decision === 'REJECT' ? 'REJECT' : 'PENDING';
    try { await requestJson('/api/v2/admin/pending-users', { method: 'PATCH', body: JSON.stringify({ userId, decision, taxVerification, reviewNote }) }); setMessage(`Registration ${decision === 'APPROVE' ? 'approved' : 'rejected'}. Financial activity remains blocked unless the tax ID was verified.`); await load(); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to update registration.'); }
    finally { setBusy(''); }
  }
  return <section className="card" style={{ padding: 24, marginTop: 24 }}><h2>Pending organization registrations</h2><p className="muted">New hotel and supplier accounts remain blocked from procurement until an administrator reviews their organization details.</p>{users.length ? users.map(user => <div key={user.id} style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid var(--line)', paddingBlock: 14 }}><div><strong>{user.name || user.email}</strong><div className="muted">{user.email} · {user.platformRole} · submitted {new Date(user.createdAt).toLocaleDateString()}</div></div><div style={{ display: 'flex', gap: 8 }}><button className="btn btn-blue" disabled={busy === user.id} onClick={() => void decide(user.id, 'APPROVE')}>Approve</button><button className="btn btn-ghost" disabled={busy === user.id} onClick={() => void decide(user.id, 'REJECT')}>Reject</button></div></div>) : <p className="muted">No pending registrations.</p>}{message && <p className="workspace-status" role="status">{message}</p>}</section>;
}

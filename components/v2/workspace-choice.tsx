'use client';

import { useState } from 'react';
import { Building2, Handshake } from 'lucide-react';

const choices = [
  { role: 'HOTEL' as const, title: 'Hotel workspace', detail: 'For properties and groups that create requirements and approve purchases.', icon: Building2 },
  { role: 'SUPPLIER' as const, title: 'Vendor workspace', detail: 'For businesses that respond to hospitality requests allocated to them.', icon: Handshake },
];

export function WorkspaceChoice({ reason }: { reason?: string }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  async function choose(role: 'HOTEL' | 'SUPPLIER') {
    setBusy(role);
    setError('');
    try {
      const response = await fetch('/api/v2/auth/workspace', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ role }) });
      const body = await response.json().catch(() => null) as { href?: unknown; error?: unknown } | null;
      if (response.status === 401) {
        window.location.assign('/login?redirect_url=%2Fregister%3Fchoose%3D1');
        return;
      }
      if (!response.ok || typeof body?.href !== 'string') {
        setError('The workspace was not created. Choose the organization again.');
        return;
      }
      window.location.assign(body.href);
    } catch {
      setError('The workspace was not created. Try again.');
    } finally {
      setBusy('');
    }
  }
  return <div className="hv-register-choice">
    <p className="workspace-status" role="status">{reason === 'unlinked' ? 'This sign-in is valid, but it is not linked to a hotel or vendor workspace yet.' : 'Your sign-in is complete. Choose the organization that will own this workspace.'}</p>
    {choices.map(({ role, title, detail, icon: Icon }) => <button className="card entry-card hv-register-card" type="button" key={role} disabled={Boolean(busy)} onClick={() => choose(role)}><span className="hv-register-icon"><Icon size={21} aria-hidden="true" /></span><h3>{title}</h3><p>{detail}</p><span className="hv-register-action">{busy === role ? 'Opening…' : 'Use this workspace'}</span></button>)}
    {error ? <p className="workspace-status" role="alert">{error}</p> : null}
  </div>;
}
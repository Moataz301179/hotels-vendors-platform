'use client';
import Link from 'next/link';
import { useState } from 'react';
import { SignUp, useAuth } from '@clerk/nextjs';
import { Brand } from './brand';

function OpenExistingWorkspace({ role }: { role: 'HOTEL' | 'SUPPLIER' }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const hotel = role === 'HOTEL';
  async function open() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/v2/auth/workspace', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ role }) });
      const body = await response.json().catch(() => null) as { href?: unknown } | null;
      if (!response.ok || typeof body?.href !== 'string') {
        setError('This signed-in account could not open that workspace. Sign out only if you need a different organization.');
        return;
      }
      window.location.assign(body.href);
    } catch {
      setError('The workspace could not be opened. Try again.');
    } finally {
      setBusy(false);
    }
  }
  return <div className="hv-auth-session-state" role="status"><strong>This browser is already signed in.</strong><p>Continue into the {hotel ? 'hotel' : 'vendor'} workspace. A new sign-up form is not required.</p><button type="button" className="btn btn-blue" disabled={busy} onClick={open}>{busy ? 'Opening…' : `Open the ${hotel ? 'hotel' : 'vendor'} workspace`}</button>{error ? <p>{error}</p> : null}</div>;
}

export function ActorSignup({ role }: { role: 'HOTEL' | 'SUPPLIER' }) {
  const { isLoaded, isSignedIn } = useAuth();
  const hotel = role === 'HOTEL';
  return <main className="hv-auth-page"><div className="hv-auth-shell"><section className="hv-auth-story"><Link href="/" className="hv-auth-logo" aria-label="HOTELSVENDORS home"><Brand /></Link><div className="hv-auth-story-copy"><h1>{hotel ? 'Turn a hotel need into one controlled commercial record.' : 'Receive only the hospitality demand your business is eligible to fulfil.'}</h1><p>{hotel ? 'Create requirements, route approval and keep delivery evidence with the purchase record.' : 'Establish your business profile, submit reviewed catalogue references and respond to assigned RFQs without exposing private hotel demand.'}</p></div><div className="hv-auth-trust"><div><strong>{hotel ? 'Hotel teams own their purchasing authority.' : 'Vendors own their catalogue and response authority.'}</strong><p>Registration creates a {hotel ? 'hotel' : 'Vendor'} workspace. It does not alter an existing account’s role or give access to another organization’s records.</p></div></div></section><section className="hv-auth-form-panel" aria-labelledby="actor-signup-title"><div className="hv-auth-form-heading"><h2 id="actor-signup-title">Create a {hotel ? 'hotel' : 'Vendor'} workspace</h2><p>{hotel ? 'For hotel groups, properties and authorized procurement teams.' : 'For businesses that supply hospitality organizations through controlled RFQs.'}</p></div>{isLoaded && isSignedIn ? <OpenExistingWorkspace role={role} /> : <SignUp path={hotel ? '/hotels/signup' : '/suppliers/signup'} routing="path" unsafeMetadata={{ platformRole: role }} forceRedirectUrl="/auth/continue" signInUrl="/login?redirect_url=%2Fonboarding" oauthFlow="redirect" appearance={{ variables: { colorPrimary: '#315f8b', colorBackground: '#fbfbf8', borderRadius: '3px' }, elements: { logoBox: { display: 'none' } } }} />}<p className="hv-auth-switch"><Link href={hotel ? '/suppliers/signup' : '/hotels/signup'}>Need the {hotel ? 'Vendor' : 'hotel'} workspace instead?</Link></p></section></div></main>;
}

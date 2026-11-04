'use client';

import { SignIn, SignOutButton, useAuth } from '@clerk/nextjs';

export function ClerkLogin({ continueUrl }: { continueUrl: string }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="hv-clerk-loading" role="status"><span />Loading secure sign-in form…</div>;
  if (isSignedIn) {
    return <div className="hv-auth-session-state" role="status">
      <strong>This browser is already signed in.</strong>
      <p>Sign out before testing another hotel, supplier, carrier, funder or admin identity.</p>
      <SignOutButton redirectUrl="/login"><button type="button" className="btn btn-blue">Sign out and switch account</button></SignOutButton>
    </div>;
  }
  return <SignIn path="/login" routing="path" forceRedirectUrl={continueUrl} signUpUrl="/register" withSignUp={false} transferable={false} oauthFlow="redirect" appearance={{ variables: { colorPrimary: '#315f8b', colorBackground: '#fbfbf8', borderRadius: '3px' }, elements: { logoBox: { display: 'none' } } }} />;
}

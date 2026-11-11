'use client';

import { SignIn, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ClerkLogin({ continueUrl }: { continueUrl: string }) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace(continueUrl);
  }, [continueUrl, isLoaded, isSignedIn, router]);
  if (!isLoaded || isSignedIn) return <div className="hv-clerk-loading" role="status"><span />Opening your workspace…</div>;
  return <SignIn path="/login" routing="path" forceRedirectUrl={continueUrl} signUpUrl="/register" withSignUp={false} transferable={false} oauthFlow="redirect" appearance={{ variables: { colorPrimary: '#315f8b', colorBackground: '#fbfbf8', borderRadius: '3px' }, elements: { logoBox: { display: 'none' } } }} />;
}

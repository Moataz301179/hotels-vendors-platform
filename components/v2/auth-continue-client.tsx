'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function AuthContinueClient() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    if (!isLoaded) return;
    const returnTo = params.get('returnTo') ?? '';
    if (!isSignedIn) {
      const next = `/auth/continue${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`;
      router.replace(`/login?redirect_url=${encodeURIComponent(next)}`);
      return;
    }
    const controller = new AbortController();
    fetch(`/api/v2/auth/handoff?returnTo=${encodeURIComponent(returnTo)}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => null) as { href?: unknown } | null;
        router.replace(typeof body?.href === 'string' && body.href.startsWith('/') ? body.href : '/register?choose=1');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        router.replace('/register?choose=1');
      });
    return () => controller.abort();
  }, [isLoaded, isSignedIn, params, router]);

  return <main className="hv-auth-page"><p className="hv-clerk-loading" role="status"><span />Opening your workspace…</p></main>;
}

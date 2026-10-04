'use client';

import { Brand } from '@/components/v2/brand';
import Link from 'next/link';
import { ClerkLoaded, ClerkLoading, SignIn } from '@clerk/nextjs';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';

export default function Login() {
  return (
    <main className="hv-auth-page">
      <div className="hv-auth-shell hv-auth-shell-login">
        <section className="hv-auth-story">
          <Link href="/" className="hv-auth-logo" aria-label="HotelsVendors home"><Brand /></Link>
          <div className="hv-auth-story-copy"><h1>Back to the work that moves your business.</h1><p>Return to your workspace to review procurement activity, evidence-backed signals and the next action assigned to your organization.</p></div>
          <div className="hv-auth-trust"><span><ShieldCheck size={17}/></span><div><strong>Your workspace stays scoped.</strong><p>Organization records and actions remain subject to role-based access and audit controls.</p></div></div>
        </section>
        <section className="hv-auth-form-panel" aria-labelledby="hv-login-title">
          <div className="hv-auth-form-heading"><h2 id="hv-login-title">Sign in to your workspace</h2><p>Use the account associated with your organization.</p></div>
          <div className="hv-clerk-wrap"><ClerkLoaded><SignIn fallbackRedirectUrl="/dashboard" appearance={{ variables: { colorPrimary: '#356fb6', colorBackground: '#fbfbf8', borderRadius: '3px' } }} /></ClerkLoaded><ClerkLoading><div className="hv-clerk-loading" role="status"><span aria-hidden="true" />Loading secure sign-in form…</div></ClerkLoading><noscript><div className="hv-clerk-loading">Enable JavaScript to load the secure sign-in form.</div></noscript></div>
          <p className="hv-auth-switch">New to the network? <Link href="/register">Create an account <ArrowUpRight size={13}/></Link></p>
          <p className="hv-auth-legal">If your organization is a carrier or funding partner, use the invitation or verification route provided by HotelsVendors.</p>
        </section>
      </div>
    </main>
  );
}

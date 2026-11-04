import { Brand } from '@/components/v2/brand';
import Link from 'next/link';
import { ClerkLogin } from '@/components/v2/clerk-login';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { safeReturnPath } from '@/lib/auth/return-path';

type LoginProps = { searchParams: Promise<{ redirect_url?: string }> };

export default async function Login({ searchParams }: LoginProps) {
  const params = await searchParams;
  const returnTo = safeReturnPath(params.redirect_url);
  const continueUrl = `/auth/continue?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <main className="hv-auth-page">
      <div className="hv-auth-shell hv-auth-shell-login">
        <section className="hv-auth-story">
          <Link href="/" className="hv-auth-logo" aria-label="HOTELSVENDORS home"><Brand /></Link>
          <div className="hv-auth-story-copy"><h1>Welcome back to HOTELSVENDORS.</h1><p>Return to your workspace to review procurement activity, evidence-backed signals and the next action assigned to your organization.</p></div>
          <div className="hv-auth-trust"><span><ShieldCheck size={17}/></span><div><strong>Access follows your HotelsVendors organization role.</strong><p>After sign in, the workspace checks your assigned organization and role before showing purchasing records.</p></div></div>
        </section>
        <section className="hv-auth-form-panel" aria-labelledby="hv-login-title">
          <div className="hv-auth-form-heading"><h2 id="hv-login-title">Sign in to your workspace</h2><p>Use the account associated with your organization.</p></div>
          <div className="hv-clerk-wrap"><ClerkLogin continueUrl={continueUrl} /></div>
          <p className="hv-auth-switch">New to the network? <Link href="/register">Create an account <ArrowUpRight size={13}/></Link></p>
          <p className="hv-auth-legal">If your organization is a carrier or funding partner, use the invitation or verification route provided by HOTELSVENDORS.</p>
        </section>
      </div>
    </main>
  );
}

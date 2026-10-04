'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ClerkLoaded, ClerkLoading, SignUp } from '@clerk/nextjs';
import { ArrowUpRight, Building2, PackageCheck, ShieldCheck } from 'lucide-react';

const roles = [
  { value: 'HOTEL', title: 'Hotel', detail: 'Purchasing, approvals and spend visibility', icon: Building2 },
  { value: 'SUPPLIER', title: 'Supplier', detail: 'Qualified demand, offers and orders', icon: PackageCheck },
] as const;

export default function Register() {
  const [role, setRole] = useState<'HOTEL' | 'SUPPLIER'>('HOTEL');
  return (
    <main className="hv-auth-page">
      <div className="hv-auth-shell">
        <section className="hv-auth-story">
          <Link href="/" className="hv-auth-logo" aria-label="HotelsVendors home"><Image src="/logo-white.svg" alt="HotelsVendors" width={154} height={34} priority /></Link>
          <div className="hv-auth-story-copy"><h1>Start with your organization.</h1><p>Connect to the commercial network and give the Virtual Shadow the context it needs to surface useful signals—not generic alerts.</p></div>
          <div className="hv-auth-trust"><span><ShieldCheck size={17}/></span><div><strong>Separate workspaces. Clear permissions.</strong><p>Hotels and suppliers can self-register. Carriers and funders join through controlled partner onboarding.</p></div></div>
        </section>
        <section className="hv-auth-form-panel" aria-labelledby="hv-register-title">
          <div className="hv-auth-form-heading"><h2 id="hv-register-title">Join HotelsVendors</h2><p>Choose the workspace that matches your organization.</p></div>
          <div className="hv-role-select" role="group" aria-label="Organization type">
            {roles.map(({value,title,detail,icon:Icon}) => <button type="button" key={value} className={'hv-role-option'+(role===value?' is-selected':'')} aria-pressed={role===value} onClick={() => setRole(value)}><Icon size={20}/><span><strong>{title}</strong><small>{detail}</small></span><i aria-hidden="true" /></button>)}
          </div>
          <div className="hv-clerk-wrap"><ClerkLoaded><SignUp unsafeMetadata={{ platformRole: role }} fallbackRedirectUrl="/dashboard" appearance={{ variables: { colorPrimary: '#356fb6', colorBackground: '#fbfbf8', borderRadius: '3px' } }} /></ClerkLoaded><ClerkLoading><div className="hv-clerk-loading" role="status"><span aria-hidden="true" />Loading secure sign-up form…</div></ClerkLoading><noscript><div className="hv-clerk-loading">Enable JavaScript to load the secure sign-up form.</div></noscript></div>
          <p className="hv-auth-switch">Already part of the network? <Link href="/login">Sign in <ArrowUpRight size={13}/></Link></p>
          <p className="hv-auth-legal">By continuing, you are creating an organization workspace. Access to partner-only roles is reviewed separately.</p>
        </section>
      </div>
    </main>
  );
}

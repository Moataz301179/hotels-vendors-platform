'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth, UserButton } from '@clerk/nextjs';

export function Nav() {
  const { isSignedIn } = useAuth();
  return <header className="nav">
    <div className="shell nav-inner">
      <Link href="/" className="brand" style={{ display: 'flex', alignItems: 'center' }}>
        <Image src="/logo-white.svg" alt="HotelsVendors" width={154} height={32} priority />
      </Link>
      <nav className="nav-links">
        <Link href="/platform">Platform</Link><Link href="/marketplace">Marketplace</Link>
        <Link href="/intelligence">Virtual Shadow</Link><Link href="/solutions">Solutions</Link>
      </nav>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {isSignedIn ? <><Link href="/dashboard" className="btn btn-blue">Workspace</Link><UserButton /></> : <><Link href="/login" className="btn btn-ghost">Sign in</Link><Link href="/register" className="btn btn-blue">Join network</Link></>}
      </div>
    </div>
  </header>;
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export function AppHeader() {
  return <header className="app-top">
    <Link href="/" className="brand" style={{ display: 'flex', alignItems: 'center' }}>
      <Image src="/logo-white.svg" alt="HotelsVendors" width={154} height={32} priority />
    </Link>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <Link href="/intelligence" style={{ fontSize: 13, color: '#bfc5ce' }}>Virtual Shadow</Link>
      <Link href="/workspace/marketplace" style={{ fontSize: 13, color: '#bfc5ce' }}>Marketplace</Link>
      <UserButton />
    </div>
  </header>;
}

'use client';
import Link from 'next/link';
import Image from 'next/image';
import { UserButton } from '@clerk/nextjs';
export function AppHeader(){return <header className="app-top"><Link href="/" className="brand" aria-label="HotelsVendors home"><Image src="/logo-white.svg" alt="HotelsVendors" width={145} height={32} priority /></Link><nav className="app-top-links" aria-label="Workspace utilities"><Link href="/intelligence">Virtual Shadow</Link><Link href="/marketplace">Network</Link><UserButton /></nav></header>}

'use client';
import Link from 'next/link';
import { Brand } from '@/components/v2/brand';
import { UserButton } from '@clerk/nextjs';
export function AppHeader(){return <header className="app-top"><Link href="/" className="brand" aria-label="HotelsVendors home"><Brand /></Link><nav className="app-top-links" aria-label="Workspace utilities"><Link href="/dashboard">Workspace</Link><Link href="/marketplace">Network</Link><UserButton /></nav></header>}

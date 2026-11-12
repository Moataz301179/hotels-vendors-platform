'use client';

import Link from 'next/link';
import { Bell, Plus, Search } from 'lucide-react';
import { Brand } from '@/components/v2/brand';
import { UserButton } from '@clerk/nextjs';
import { workspaceContextLabel } from '@/lib/dashboard/role-navigation';
import { CommandPalette } from '@/components/v2/command-palette';

const primaryAction: Record<string, { href: string; label: string }> = {
  HOTEL: { href: '/workspace/marketplace', label: 'New requirement' },
  SUPPLIER: { href: '/suppliers', label: 'Catalogue action' },
  SHIPPING: { href: '/carrier', label: 'Delivery tasks' },
  FACTORING: { href: '/funding', label: 'Review referrals' },
  ADMIN: { href: '/admin?mode=trust', label: 'Review access' },
};

export function AppHeader({ role }: { role: string }) {
  const action = primaryAction[role] ?? { href: '/dashboard', label: 'Workspace' };
  return <header className="app-top"><Link href="/dashboard" className="brand" aria-label="HotelsVendors workspace"><Brand /></Link><div className="app-top-context"><span>HotelsVendors</span><strong>{workspaceContextLabel(role)}</strong></div><button type="button" className="app-top-search" onClick={() => window.dispatchEvent(new CustomEvent('hv:open-palette'))} aria-label="Open command palette"><Search aria-hidden="true"/><span>Search or jump to…</span><kbd>⌘K</kbd></button><nav className="app-top-links" aria-label="Workspace utilities"><Link href={action.href} className="app-top-primary"><Plus aria-hidden="true"/>{action.label}</Link><Link href="/audit" className="app-top-icon" aria-label="Open activity and audit trail"><Bell aria-hidden="true"/></Link><UserButton /></nav><CommandPalette role={role}/></header>;
}

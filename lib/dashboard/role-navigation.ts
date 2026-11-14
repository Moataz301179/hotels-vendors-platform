export type WorkspaceRole = 'HOTEL' | 'SUPPLIER' | 'SHIPPING' | 'FACTORING' | 'ADMIN';

export type NavigationIcon = 'home' | 'search' | 'approval' | 'receipt' | 'insights' | 'planning' | 'funding' | 'catalogue' | 'fulfilment' | 'invoice' | 'carrier' | 'handoff' | 'evidence' | 'governance' | 'audit' | 'security' | 'profile';
export type NavigationItem = { href: string; label: string; icon: NavigationIcon; detail?: string };
export type NavigationGroup = { label: string; items: NavigationItem[] };

const sharedAccount: NavigationItem[] = [
  { href: '/onboarding', label: 'Organization profile', icon: 'profile' },
  { href: '/security', label: 'Security & access', icon: 'security' },
];

const navigation: Record<WorkspaceRole, NavigationGroup[]> = {
  HOTEL: [
    { label: 'Hotel operations', items: [{ href: '/dashboard', label: 'Today', icon: 'home' }, { href: '/marketplace', label: 'Source supplies', icon: 'search' }, { href: '/orders?view=approval', label: 'Approvals', icon: 'approval' }, { href: '/orders?view=receiving', label: 'Receiving', icon: 'receipt' }] },
    { label: 'Plan and control', items: [{ href: '/intelligence', label: 'Market Compass', icon: 'insights' }, { href: '/connections', label: 'Connections & Data', icon: 'catalogue' }, { href: '/demand-aggregation', label: 'Volume planning', icon: 'planning' }, { href: '/funding', label: 'Funding records', icon: 'funding' }] },
    { label: 'Organization', items: sharedAccount },
  ],
  SUPPLIER: [
    { label: 'Vendor operations', items: [{ href: '/dashboard', label: 'Today', icon: 'home' }, { href: '/suppliers', label: 'Catalogue & stock', icon: 'catalogue' }, { href: '/orders', label: 'Order fulfilment', icon: 'fulfilment' }] },
    { label: 'Documents', items: [{ href: '/eta-compliance', label: 'ETA records', icon: 'invoice' }, { href: '/funding', label: 'Funding records', icon: 'funding' }] },
    { label: 'Organization', items: sharedAccount },
  ],
  SHIPPING: [
    { label: 'Carrier operations', items: [{ href: '/dashboard', label: 'Today', icon: 'home' }, { href: '/carrier', label: 'Delivery tasks', icon: 'carrier' }, { href: '/carrier/handoff', label: 'Handoff records', icon: 'handoff' }] },
    { label: 'Organization', items: sharedAccount },
  ],
  FACTORING: [
    { label: 'Funder operations', items: [{ href: '/dashboard', label: 'Today', icon: 'home' }, { href: '/funding', label: 'Funding records', icon: 'funding' }, { href: '/funding/evidence', label: 'Evidence', icon: 'evidence' }] },
    { label: 'Organization', items: sharedAccount },
  ],
  ADMIN: [
    { label: 'Network controls', items: [{ href: '/dashboard', label: 'Control overview', icon: 'home' }, { href: '/admin', label: 'Access & governance', icon: 'governance' }, { href: '/admin?mode=register', label: 'Contracting register', icon: 'catalogue' }, { href: '/audit', label: 'Audit trail', icon: 'audit' }] },
    { label: 'Organization', items: [{ href: '/security', label: 'Security & access', icon: 'security' }] },
  ],
};

export function workspaceRole(role: string): WorkspaceRole | null {
  return role in navigation ? role as WorkspaceRole : null;
}

export function navigationForRole(role: string): NavigationGroup[] {
  return workspaceRole(role) ? navigation[role as WorkspaceRole] : [{ label: 'Workspace', items: [{ href: '/dashboard', label: 'Today', icon: 'home' }, ...sharedAccount] }];
}

export function roleDisplayName(role: string): string {
  return ({ HOTEL: 'Hotel', SUPPLIER: 'Vendor', SHIPPING: 'Carrier', FACTORING: 'Funder', ADMIN: 'Administrator' } as Record<string, string>)[role] ?? 'Workspace';
}

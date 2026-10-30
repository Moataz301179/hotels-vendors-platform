export type WorkspaceRole = 'HOTEL' | 'SUPPLIER' | 'SHIPPING' | 'FACTORING' | 'ADMIN';

export type NavigationItem = { href: string; label: string; detail?: string };
export type NavigationGroup = { label: string; items: NavigationItem[] };

const sharedAccount: NavigationItem[] = [
  { href: '/onboarding', label: 'Organization profile' },
  { href: '/security', label: 'Security & access' },
];

const navigation: Record<WorkspaceRole, NavigationGroup[]> = {
  HOTEL: [
    { label: 'Hotel operations', items: [{ href: '/dashboard', label: 'Today' }, { href: '/workspace/marketplace', label: 'Source supplies' }, { href: '/orders?view=approval', label: 'Approvals' }, { href: '/orders?view=receiving', label: 'Receiving' }] },
    { label: 'Plan and control', items: [{ href: '/intelligence', label: 'Market Compass' }, { href: '/demand-aggregation', label: 'Volume planning' }, { href: '/funding', label: 'Funding records' }] },
    { label: 'Organization', items: sharedAccount },
  ],
  SUPPLIER: [
    { label: 'Vendor operations', items: [{ href: '/dashboard', label: 'Today' }, { href: '/suppliers', label: 'Catalogue & stock' }, { href: '/orders', label: 'Order fulfilment' }] },
    { label: 'Documents', items: [{ href: '/eta-compliance', label: 'ETA records' }, { href: '/funding', label: 'Funding records' }] },
    { label: 'Organization', items: sharedAccount },
  ],
  SHIPPING: [
    { label: 'Carrier operations', items: [{ href: '/dashboard', label: 'Today' }, { href: '/carrier', label: 'Delivery tasks' }, { href: '/carrier/handoff', label: 'Handoff records' }] },
    { label: 'Organization', items: sharedAccount },
  ],
  FACTORING: [
    { label: 'Funder operations', items: [{ href: '/dashboard', label: 'Today' }, { href: '/funding', label: 'Funding records' }, { href: '/funding/evidence', label: 'Evidence' }] },
    { label: 'Organization', items: sharedAccount },
  ],
  ADMIN: [
    { label: 'Network controls', items: [{ href: '/dashboard', label: 'Control overview' }, { href: '/admin', label: 'Access & governance' }, { href: '/audit', label: 'Audit trail' }] },
    { label: 'Organization', items: [{ href: '/security', label: 'Security & access' }] },
  ],
};

export function workspaceRole(role: string): WorkspaceRole | null {
  return role in navigation ? role as WorkspaceRole : null;
}

export function navigationForRole(role: string): NavigationGroup[] {
  return workspaceRole(role) ? navigation[role as WorkspaceRole] : [{ label: 'Workspace', items: [{ href: '/dashboard', label: 'Today' }, ...sharedAccount] }];
}

export function roleDisplayName(role: string): string {
  return ({ HOTEL: 'Hotel', SUPPLIER: 'Vendor', SHIPPING: 'Carrier', FACTORING: 'Funder', ADMIN: 'Administrator' } as Record<string, string>)[role] ?? 'Workspace';
}

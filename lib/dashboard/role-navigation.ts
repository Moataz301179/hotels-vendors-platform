export type WorkspaceRole = 'HOTEL' | 'SUPPLIER' | 'SHIPPING' | 'FACTORING' | 'ADMIN';

export type NavigationIcon = 'home' | 'search' | 'approval' | 'receipt' | 'insights' | 'planning' | 'funding' | 'catalogue' | 'fulfilment' | 'invoice' | 'carrier' | 'handoff' | 'evidence' | 'governance' | 'audit' | 'security' | 'profile';
export type NavigationItem = { href: string; label: string; icon: NavigationIcon; detail?: string };
export type NavigationGroup = { label: string; items: NavigationItem[] };

const sharedAccount: NavigationItem[] = [
  { href: '/onboarding', label: 'Organization profile', icon: 'profile', detail: 'Company details that unlock the workspace' },
  { href: '/security', label: 'Security & access', icon: 'security', detail: 'How your role and tenant access are decided' },
];

const navigation: Record<WorkspaceRole, NavigationGroup[]> = {
  HOTEL: [
    {
      label: 'Command',
      items: [
        { href: '/dashboard', label: 'Today', icon: 'home', detail: 'Role dashboard — next actions and live queues' },
        { href: '/workspace/marketplace', label: 'Source supplies', icon: 'search', detail: 'Browse sealed catalogue and start an RFQ' },
      ],
    },
    {
      label: 'Transactions',
      items: [
        { href: '/orders?view=approval', label: 'Approvals', icon: 'approval', detail: 'Purchase records waiting for authority' },
        { href: '/orders?view=receiving', label: 'Receiving', icon: 'receipt', detail: 'Goods receipt and delivery evidence' },
        { href: '/funding', label: 'Funding records', icon: 'funding', detail: 'Released receivable referrals' },
      ],
    },
    {
      label: 'Intelligence',
      items: [
        { href: '/intelligence', label: 'Market Compass', icon: 'insights', detail: 'Recorded opportunity signals to review' },
        { href: '/demand-aggregation', label: 'Volume planning', icon: 'planning', detail: 'Portfolio demand before the next buy' },
        { href: '/connections', label: 'Connections & Data', icon: 'catalogue', detail: 'Authorized data links for the workspace' },
      ],
    },
    { label: 'Organization', items: sharedAccount },
  ],
  SUPPLIER: [
    {
      label: 'Command',
      items: [
        { href: '/dashboard', label: 'Today', icon: 'home', detail: 'Vendor operating queue' },
        { href: '/suppliers', label: 'Catalogue & stock', icon: 'catalogue', detail: 'Owned product evidence and publication' },
      ],
    },
    {
      label: 'Transactions',
      items: [
        { href: '/orders', label: 'Order fulfilment', icon: 'fulfilment', detail: 'Awarded work and dispatch status' },
        { href: '/eta-compliance', label: 'ETA records', icon: 'invoice', detail: 'Regulated invoice evidence' },
        { href: '/funding', label: 'Funding records', icon: 'funding', detail: 'Referral status for released invoices' },
      ],
    },
    { label: 'Organization', items: sharedAccount },
  ],
  SHIPPING: [
    {
      label: 'Command',
      items: [
        { href: '/dashboard', label: 'Today', icon: 'home', detail: 'Assigned movement overview' },
        { href: '/carrier', label: 'Delivery tasks', icon: 'carrier', detail: 'Movements assigned to your organization' },
      ],
    },
    {
      label: 'Transactions',
      items: [
        { href: '/carrier/handoff', label: 'Handoff records', icon: 'handoff', detail: 'Pickup and delivery milestones' },
      ],
    },
    { label: 'Organization', items: sharedAccount },
  ],
  FACTORING: [
    {
      label: 'Command',
      items: [
        { href: '/dashboard', label: 'Today', icon: 'home', detail: 'Referral review overview' },
        { href: '/funding', label: 'Funding records', icon: 'funding', detail: 'Authorized receivable packets' },
      ],
    },
    {
      label: 'Evidence',
      items: [
        { href: '/funding/evidence', label: 'Evidence', icon: 'evidence', detail: 'Purchase, receipt, and invoice context' },
      ],
    },
    { label: 'Organization', items: sharedAccount },
  ],
  ADMIN: [
    {
      label: 'Network',
      items: [
        { href: '/dashboard', label: 'Control overview', icon: 'home', detail: 'Network health and queues' },
        { href: '/admin', label: 'Access & governance', icon: 'governance', detail: 'Trust, policy, and access controls' },
        { href: '/admin?mode=register', label: 'Contracting register', icon: 'catalogue', detail: 'Directory and contracting evidence' },
        { href: '/audit', label: 'Audit trail', icon: 'audit', detail: 'Organization-scoped activity hashes' },
      ],
    },
    { label: 'Organization', items: [{ href: '/security', label: 'Security & access', icon: 'security', detail: 'Administrator access model' }] },
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

/** Flat destinations used by command palette and screen-switch tests. */
export function criticalDestinationsForRole(role: string): string[] {
  return navigationForRole(role).flatMap((group) => group.items.map((item) => item.href));
}

const catalog: Record<string, { name: string; description: string }> = {
  'order:read': { name: 'View Orders', description: 'View assigned procurement requests, quotes, and orders' },
  'order:create': { name: 'Create Purchase Orders', description: 'Create procurement orders from approved commercial terms' },
  'order:approve': { name: 'Approve procurement orders', description: 'Approve an order after a verified payment guarantee is recorded' },
  'order:reject': { name: 'Reject procurement orders', description: 'Reject an order that is waiting for approval' },
  'order:update': { name: 'Update Delivery Status', description: 'Record delivery progress for an order in this organization' },
  'quote:submit': { name: 'Submit Supplier Quotes', description: 'Submit a fixed response to an explicitly granted RFQ' },
  'order:confirm': { name: 'Confirm Approved Orders', description: 'Confirm an order after the hotel records payment authority' },
};

export function founderOperatingRole(platformRole: string): 'OWNER' | 'LOGISTICS_COORDINATOR' {
  return platformRole === 'SHIPPING' ? 'LOGISTICS_COORDINATOR' : 'OWNER';
}

export function founderPermissionCodes(platformRole: string): string[] {
  if (platformRole === 'SUPPLIER') return ['order:read', 'quote:submit', 'order:confirm', 'order:update'];
  if (platformRole === 'HOTEL') return ['order:read', 'order:create', 'order:approve', 'order:reject', 'order:update'];
  return ['order:read', 'order:create'];
}

export function permissionDefinition(code: string) {
  return catalog[code] ?? { name: code, description: 'Organization-scoped procurement permission' };
}

export function verificationHold(platformRole: string) {
  if (platformRole === 'HOTEL') return 'After that verification, the organization owner can create a sealed sourcing request, approve a guaranteed order, and record a receipt.';
  if (platformRole === 'SUPPLIER') return 'After that verification, this organization can submit reviewed products and respond to requests assigned to it.';
  if (platformRole === 'SHIPPING') return 'After the registration is approved, this carrier profile can receive assigned movements. Rates stay off the phone.';
  if (platformRole === 'FACTORING') return 'After that verification, a funding referral can be reviewed only for a delivered order with a payment guarantee, an accepted receipt, and an accepted invoice.';
  return 'Workspace actions stay closed until that review is recorded.';
}

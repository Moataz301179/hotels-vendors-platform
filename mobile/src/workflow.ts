import type { MobileContextUser, OrderRecord, QuoteRecord, RfqRecord } from './api/hovin';

/**
 * Pure workflow helpers. No React Native imports so they can be unit tested
 * under plain vitest/node.
 */

export function idempotencyKey(prefix: string, randomId: () => string = defaultRandomId): string {
  return `${prefix}-${randomId()}`;
}

function defaultRandomId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export type Task = {
  id: 'receiving' | 'requirements' | 'quotes' | 'orders' | 'notifications';
  titleKey: 'receiving' | 'requirements' | 'quotes' | 'orders' | 'notifications';
  hintKey: 'receivingHint' | 'requirementsHint' | 'quotesHint' | 'ordersHint';
  route: string;
  /** Server-derived capability. Never a client role assumption. */
  enabled: boolean;
  /** Number of items needing attention, when the server exposes it. */
  badge?: number;
};

/**
 * Derive the task home from the server-provided context. The client never
 * decides that a role exists; it only reflects what the server returned.
 */
export function deriveTasks(user: MobileContextUser | null): Task[] {
  if (!user) return [];
  const permissions = new Set(user.permissions);

  if (user.platformRole === 'SUPPLIER') {
    return [
      { id: 'quotes', titleKey: 'quotes', hintKey: 'quotesHint', route: '/rfq', enabled: permissions.has('order:read') },
      { id: 'orders', titleKey: 'orders', hintKey: 'ordersHint', route: '/orders', enabled: permissions.has('order:read') },
      { id: 'notifications', titleKey: 'notifications', hintKey: 'ordersHint', route: '/notifications', enabled: true },
    ];
  }

  return [
    { id: 'receiving', titleKey: 'receiving', hintKey: 'receivingHint', route: '/receiving', enabled: permissions.has('order:update') },
    { id: 'requirements', titleKey: 'requirements', hintKey: 'requirementsHint', route: '/rfq', enabled: permissions.has('order:create') },
    { id: 'orders', titleKey: 'orders', hintKey: 'ordersHint', route: '/orders', enabled: permissions.has('order:read') },
    { id: 'notifications', titleKey: 'notifications', hintKey: 'ordersHint', route: '/notifications', enabled: true },
  ];
}

export type StatusTone = 'neutral' | 'accent' | 'success' | 'danger';

export function statusTone(status: string): StatusTone {
  switch (status) {
    case 'APPROVED':
    case 'CONFIRMED':
    case 'DELIVERED':
    case 'ACCEPTED':
    case 'PARTIALLY_ACCEPTED':
      return 'success';
    case 'REJECTED':
    case 'CANCELLED':
    case 'DISPUTED':
    case 'EXPIRED':
      return 'danger';
    case 'IN_TRANSIT':
    case 'PARTIALLY_DELIVERED':
    case 'PENDING_APPROVAL':
    case 'QUOTED':
    case 'SUBMITTED':
      return 'accent';
    default:
      return 'neutral';
  }
}

export function formatMoney(value: number | null | undefined, currency = 'EGP'): string {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
  return `${currency} ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function rfqTitle(rfq: RfqRecord): string {
  return rfq.itemName ?? rfq.product?.name ?? 'Requirement';
}

export function quoteTotal(quote: QuoteRecord): number | null {
  if (quote.cost && quote.cost.totalCostState === 'KNOWN' && quote.cost.totalCost !== null) {
    return quote.cost.totalCost;
  }
  const product = quote.unitPrice * quote.quantity;
  const delivery = quote.deliveryFee ?? 0;
  const tax = quote.taxAmount ?? 0;
  return Number.isFinite(product) ? product + delivery + tax : null;
}

export function canAcceptQuote(quote: QuoteRecord): { ok: boolean; reason?: 'EXPIRED' | 'CLOSED' | 'INCOMPLETE' } {
  if (quote.validUntil && new Date(quote.validUntil).getTime() < Date.now()) return { ok: false, reason: 'EXPIRED' };
  if (!['PENDING', 'QUOTED'].includes(quote.rfq.status)) return { ok: false, reason: 'CLOSED' };
  if (quoteTotal(quote) === null) return { ok: false, reason: 'INCOMPLETE' };
  return { ok: true };
}

export type OrderAction = {
  labelKey: 'approve' | 'reject' | 'confirm' | 'dispatch' | 'receive';
  status: string;
  needsEstimatedDelivery?: boolean;
};

/**
 * Translate server-provided `allowedActions` into the next mobile action.
 * The server remains the authority; this only chooses the primary label.
 */
export function nextOrderAction(order: OrderRecord, user: MobileContextUser | null): OrderAction | null {
  const allowed = new Set(order.allowedActions ?? []);
  const isSupplier = user?.platformRole === 'SUPPLIER';

  if (isSupplier && allowed.has('CONFIRMED')) return { labelKey: 'confirm', status: 'CONFIRMED' };
  if (isSupplier && allowed.has('IN_TRANSIT')) {
    return { labelKey: 'dispatch', status: 'IN_TRANSIT', needsEstimatedDelivery: true };
  }
  if (!isSupplier && allowed.has('APPROVED')) return { labelKey: 'approve', status: 'APPROVED' };
  if (!isSupplier && allowed.has('REJECTED')) return { labelKey: 'reject', status: 'REJECTED' };
  if (allowed.has('RECEIVE')) return { labelKey: 'receive', status: 'RECEIVE' };
  return null;
}

export type TimelineStep = { status: string; labelKey: string; done: boolean; current: boolean };

/** Compact server-state timeline for an order detail screen. */
export function orderTimeline(order: OrderRecord): TimelineStep[] {
  const steps = ['PENDING_APPROVAL', 'APPROVED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED'];
  const currentIndex = steps.indexOf(order.status);
  if (currentIndex === -1) {
    return steps.map((status) => ({ status, labelKey: 'status', done: false, current: false }));
  }
  return steps.map((status, index) => ({
    status,
    labelKey: 'status',
    done: index < currentIndex,
    current: index === currentIndex,
  }));
}

export function notificationRoute(type: string): string {
  if (type === 'ORDER_UPDATE' || type === 'PAYMENT_DUE' || type === 'DISPUTE_OPEN') return '/orders';
  if (type === 'INVOICE_ISSUED') return '/orders';
  return '/notifications';
}

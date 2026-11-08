import { describe, expect, it } from 'vitest';
import {
  canAcceptQuote,
  deriveTasks,
  formatMoney,
  idempotencyKey,
  nextOrderAction,
  notificationRoute,
  orderTimeline,
  quoteTotal,
  rfqTitle,
  statusTone,
} from './workflow';
import type { MobileContextUser, OrderRecord, QuoteRecord, RfqRecord } from './api/hovin';

const hotelUser: MobileContextUser = {
  id: 'u1',
  name: 'Hotel User',
  email: 'hotel@example.com',
  platformRole: 'HOTEL',
  role: 'GM',
  tenantId: 't1',
  hotelId: 'h1',
  supplierId: null,
  departmentId: null,
  permissions: ['order:read', 'order:create', 'order:update', 'order:approve'],
};

const supplierUser: MobileContextUser = {
  ...hotelUser,
  platformRole: 'SUPPLIER',
  supplierId: 's1',
  hotelId: null,
  permissions: ['order:read', 'quote:submit', 'order:confirm', 'order:update'],
};

describe('idempotency keys', () => {
  it('produces a stable, server-acceptable key', () => {
    const key = idempotencyKey('hovin-rfq', () => 'abcdef0123456789');
    expect(key).toBe('hovin-rfq-abcdef0123456789');
    expect(key.length).toBeGreaterThanOrEqual(16);
    expect(/^[A-Za-z0-9][A-Za-z0-9._:-]{15,191}$/.test(key)).toBe(true);
  });
});

describe('deriveTasks', () => {
  it('derives hotel tasks from server permissions', () => {
    const tasks = deriveTasks(hotelUser);
    expect(tasks.map((task) => task.id)).toEqual(['receiving', 'requirements', 'orders', 'notifications']);
    expect(tasks.find((task) => task.id === 'receiving')?.enabled).toBe(true);
    expect(tasks.find((task) => task.id === 'requirements')?.enabled).toBe(true);
  });

  it('derives supplier tasks from server permissions', () => {
    const tasks = deriveTasks(supplierUser);
    expect(tasks.map((task) => task.id)).toEqual(['quotes', 'orders', 'notifications']);
  });

  it('disables tasks the server did not grant', () => {
    const tasks = deriveTasks({ ...hotelUser, permissions: ['order:read'] });
    expect(tasks.find((task) => task.id === 'requirements')?.enabled).toBe(false);
    expect(tasks.find((task) => task.id === 'receiving')?.enabled).toBe(false);
  });

  it('returns no tasks without a signed-in context', () => {
    expect(deriveTasks(null)).toEqual([]);
  });
});

describe('statusTone', () => {
  it('maps statuses to tones', () => {
    expect(statusTone('DELIVERED')).toBe('success');
    expect(statusTone('REJECTED')).toBe('danger');
    expect(statusTone('IN_TRANSIT')).toBe('accent');
    expect(statusTone('DRAFT')).toBe('neutral');
  });
});

describe('formatMoney', () => {
  it('formats a value with the currency', () => {
    expect(formatMoney(1234.5)).toBe('EGP 1,234.50');
  });

  it('renders a dash for null or invalid values', () => {
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney(Number.NaN)).toBe('—');
  });
});

describe('rfqTitle', () => {
  it('prefers the item name, then the product name', () => {
    const rfq = { itemName: 'Egyptian cotton towels', product: { name: 'Towel 500g' } } as RfqRecord;
    expect(rfqTitle(rfq)).toBe('Egyptian cotton towels');
    expect(rfqTitle({ itemName: null, product: { name: 'Towel 500g' } } as RfqRecord)).toBe('Towel 500g');
    expect(rfqTitle({ itemName: null, product: null } as RfqRecord)).toBe('Requirement');
  });
});

describe('quoteTotal', () => {
  it('uses the server cost breakdown when known', () => {
    const quote = {
      unitPrice: 10,
      quantity: 2,
      deliveryFee: 5,
      taxAmount: 3,
      cost: { totalCost: 28, totalCostState: 'KNOWN' },
    } as QuoteRecord;
    expect(quoteTotal(quote)).toBe(28);
  });

  it('computes a fallback total when the breakdown is incomplete', () => {
    const quote = { unitPrice: 10, quantity: 2, deliveryFee: 5, taxAmount: null } as QuoteRecord;
    expect(quoteTotal(quote)).toBe(25);
  });
});

describe('canAcceptQuote', () => {
  it('accepts an open quote with a complete total', () => {
    const quote = { validUntil: null, rfq: { status: 'QUOTED' }, unitPrice: 1, quantity: 1, deliveryFee: 0, taxAmount: 0 } as QuoteRecord;
    expect(canAcceptQuote(quote)).toEqual({ ok: true });
  });

  it('rejects an expired quote', () => {
    const quote = { validUntil: '2020-01-01T00:00:00.000Z', rfq: { status: 'QUOTED' }, unitPrice: 1, quantity: 1, deliveryFee: 0, taxAmount: 0 } as QuoteRecord;
    expect(canAcceptQuote(quote)).toEqual({ ok: false, reason: 'EXPIRED' });
  });

  it('rejects a closed RFQ', () => {
    const quote = { validUntil: null, rfq: { status: 'CONVERTED_TO_ORDER' }, unitPrice: 1, quantity: 1, deliveryFee: 0, taxAmount: 0 } as QuoteRecord;
    expect(canAcceptQuote(quote)).toEqual({ ok: false, reason: 'CLOSED' });
  });
});

describe('nextOrderAction', () => {
  const baseOrder = { id: 'o1', orderNumber: 'HV-1', status: 'PENDING_APPROVAL', allowedActions: ['APPROVED', 'REJECTED'] } as OrderRecord;

  it('returns approve for a hotel approver', () => {
    expect(nextOrderAction(baseOrder, hotelUser)).toEqual({ labelKey: 'approve', status: 'APPROVED' });
  });

  it('returns confirm for a supplier', () => {
    const order = { ...baseOrder, status: 'APPROVED', allowedActions: ['CONFIRMED'] } as OrderRecord;
    expect(nextOrderAction(order, supplierUser)).toEqual({ labelKey: 'confirm', status: 'CONFIRMED' });
  });

  it('returns dispatch with an estimated-delivery requirement', () => {
    const order = { ...baseOrder, status: 'CONFIRMED', allowedActions: ['IN_TRANSIT'] } as OrderRecord;
    expect(nextOrderAction(order, supplierUser)).toEqual({ labelKey: 'dispatch', status: 'IN_TRANSIT', needsEstimatedDelivery: true });
  });

  it('returns null when no action is allowed', () => {
    expect(nextOrderAction({ ...baseOrder, allowedActions: [] }, hotelUser)).toBeNull();
  });
});

describe('orderTimeline', () => {
  it('marks completed and current steps', () => {
    const steps = orderTimeline({ status: 'CONFIRMED' } as OrderRecord);
    expect(steps.find((step) => step.status === 'PENDING_APPROVAL')?.done).toBe(true);
    expect(steps.find((step) => step.status === 'APPROVED')?.done).toBe(true);
    expect(steps.find((step) => step.status === 'CONFIRMED')?.current).toBe(true);
    expect(steps.find((step) => step.status === 'DELIVERED')?.done).toBe(false);
  });
});

describe('notificationRoute', () => {
  it('maps order notifications to the orders task', () => {
    expect(notificationRoute('ORDER_UPDATE')).toBe('/orders');
    expect(notificationRoute('INVOICE_ISSUED')).toBe('/orders');
    expect(notificationRoute('SYSTEM')).toBe('/notifications');
  });
});

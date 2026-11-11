import { beforeEach, describe, expect, it, vi } from 'vitest';

const PermissionDeniedError = vi.hoisted(() => class PermissionDeniedError extends Error {});
const m = vi.hoisted(() => ({
  actor: vi.fn(),
  permission: vi.fn(),
  orders: vi.fn(),
  assignments: vi.fn(),
}));

vi.mock('@/lib/v2-auth', () => ({ getActor: m.actor }));
vi.mock('@/lib/auth/rbac', () => ({ requirePermission: m.permission, PermissionDeniedError }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: { findMany: m.orders },
    carrierOrderAssignment: { findMany: m.assignments },
  },
}));

import { GET as session } from '@/app/api/v2/mobile/session/route';
import { GET as tasks } from '@/app/api/v2/mobile/tasks/route';

describe('HOVIN mobile session and tasks', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.permission.mockResolvedValue(undefined);
  });

  it('returns the server workspace for the persisted account', async () => {
    m.actor.mockResolvedValue({ id: 'user-1', tenantId: 'hotel-1', platformRole: 'HOTEL', role: 'DEPARTMENT_HEAD' });
    const response = await session();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.workspace).toBe('web-only');
    expect(body.account).toEqual({ platformRole: 'HOTEL', role: 'DEPARTMENT_HEAD' });
  });

  it('refuses field tasks for an account that belongs on the desk', async () => {
    m.actor.mockResolvedValue({ id: 'user-1', tenantId: 'hotel-1', platformRole: 'HOTEL', role: 'DEPARTMENT_HEAD' });
    expect((await tasks()).status).toBe(403);
    expect(m.orders).not.toHaveBeenCalled();
  });

  it('lists hotel arrivals and disputes without commercial fields', async () => {
    m.actor.mockResolvedValue({ id: 'receiver-1', tenantId: 'hotel-1', platformRole: 'HOTEL', role: 'RECEIVING_CLERK', supplierId: null });
    m.orders
      .mockResolvedValueOnce([{ id: 'order-1', orderNumber: 'HV-100', status: 'IN_TRANSIT', items: [{ quantity: 4, receivedQuantity: 1 }] }])
      .mockResolvedValueOnce([{ id: 'order-2', orderNumber: 'HV-200', status: 'DISPUTED' }]);
    const response = await tasks();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.workspace).toBe('hotel-field');
    expect(body.tasks).toEqual([
      { id: 'arrival:order-1', module: 'arrivals', title: 'HV-100', detail: '1 lines · 3 remaining', status: 'IN_TRANSIT', action: 'receive', targetId: 'order-1' },
      { id: 'exception:order-2', module: 'exceptions', title: 'HV-200', detail: 'Disputed. The phone shows the exception and the desk closes it.', status: 'DISPUTED', action: 'review', targetId: 'order-2' },
    ]);
    expect(JSON.stringify(body)).not.toMatch(/supplier|price|invoice|subtotal/i);
    expect(m.orders).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 'hotel-1' }) }));
  });

  it('requires receipt permission before hotel field tasks', async () => {
    m.actor.mockResolvedValue({ id: 'receiver-1', tenantId: 'hotel-1', platformRole: 'HOTEL', role: 'RECEIVING_CLERK', supplierId: null });
    m.permission.mockRejectedValue(new PermissionDeniedError('denied'));
    expect((await tasks()).status).toBe(403);
    expect(m.orders).not.toHaveBeenCalled();
  });

  it('refuses supplier field tasks without order-read permission', async () => {
    m.actor.mockResolvedValue({ id: 'vendor-1', tenantId: 'vendor-tenant', platformRole: 'SUPPLIER', role: 'OWNER', supplierId: 'supplier-1' });
    m.permission.mockRejectedValue(new PermissionDeniedError('denied'));
    expect((await tasks()).status).toBe(403);
    expect(m.orders).not.toHaveBeenCalled();
  });

  it('returns no supplier tasks when the account has no supplier record', async () => {
    m.actor.mockResolvedValue({ id: 'vendor-1', tenantId: 'vendor-tenant', platformRole: 'SUPPLIER', role: 'OWNER', supplierId: null });
    const body = await (await tasks()).json();
    expect(body).toEqual({ workspace: 'supplier-field', tasks: [] });
    expect(m.orders).not.toHaveBeenCalled();
  });

  it('lists only this carrier’s assignments and checkpoints', async () => {
    m.actor.mockResolvedValue({ id: 'driver-1', tenantId: 'carrier-1', platformRole: 'SHIPPING', role: 'OWNER', supplierId: null });
    m.assignments.mockResolvedValue([{
      id: 'asg-1',
      status: 'ASSIGNED',
      order: { orderNumber: 'HV-300' },
      shipments: [{ id: 'shp-1', status: 'IN_TRANSIT', originHub: 'Cairo', destinationHub: 'Hurghada' }],
    }]);
    const body = await (await tasks()).json();
    expect(body.tasks.map((task: { module: string }) => task.module)).toEqual(['assignments', 'movements']);
    expect(body.tasks[0]).toMatchObject({ action: 'respond', targetId: 'asg-1' });
    expect(body.tasks[1].title).toBe('Cairo → Hurghada');
    expect(m.assignments).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ carrierTenantId: 'carrier-1' }) }));
    expect(JSON.stringify(body)).not.toMatch(/price|savings|rate/i);
  });

  it('lists this supplier’s quantities and omits prices', async () => {
    m.actor.mockResolvedValue({ id: 'vendor-1', tenantId: 'vendor-tenant', platformRole: 'SUPPLIER', role: 'OWNER', supplierId: 'supplier-1' });
    m.orders.mockResolvedValue([{
      id: 'order-9',
      orderNumber: 'HV-900',
      status: 'CONFIRMED',
      items: [{ quantity: 2, product: { name: 'Rice 5kg', unitOfMeasure: 'bag' } }],
    }]);
    const body = await (await tasks()).json();
    expect(body.workspace).toBe('supplier-field');
    expect(body.tasks[0]).toMatchObject({ module: 'fulfillment', action: 'none', detail: 'Rice 5kg × 2 bag' });
    expect(m.permission).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'vendor-tenant', platformRole: 'SUPPLIER' }), 'order:read');
    expect(m.orders).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ supplierId: 'supplier-1', tenantId: 'vendor-tenant' }) }));
    expect(JSON.stringify(body)).not.toMatch(/unitPrice|total|hotelId/i);
  });
});

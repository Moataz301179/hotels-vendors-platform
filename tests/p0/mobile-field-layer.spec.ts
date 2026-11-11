import { describe, expect, it } from 'vitest';
import { planMobileWorkspace } from '@/lib/mobile/field-layer';

describe('HOVIN field layer', () => {
  it('gives a receiving hotel the field modules and keeps commercial work on the desk', () => {
    const plan = planMobileWorkspace({ platformRole: 'HOTEL', role: 'RECEIVING_CLERK' });
    expect(plan.workspace).toBe('hotel-field');
    expect(plan.modules.filter((module) => module.surface === 'phone').map((module) => module.id)).toEqual(['arrivals', 'count', 'exceptions']);
    expect(plan.modules.filter((module) => module.surface === 'web').map((module) => module.id)).toEqual(['approvals', 'sourcing']);
    expect(plan.deskPath).toBe('/orders');
    expect(plan.withheld.join(' ')).toMatch(/Supplier identity/);
    expect(plan.withheld.join(' ')).toMatch(/Prices/);
  });

  it('keeps a department head on the hotel desk', () => {
    const plan = planMobileWorkspace({ platformRole: 'HOTEL', role: 'DEPARTMENT_HEAD' });
    expect(plan.workspace).toBe('web-only');
    expect(plan.deskPath).toBe('/orders');
    expect(plan.modules.every((module) => module.surface === 'web')).toBe(true);
  });

  it('gives a carrier assignments and movements, and a supplier fulfillment only', () => {
    const carrier = planMobileWorkspace({ platformRole: 'SHIPPING', role: 'OWNER' });
    expect(carrier.workspace).toBe('carrier-field');
    expect(carrier.modules.map((module) => module.id)).toEqual(['assignments', 'movements', 'rates']);
    expect(carrier.deskPath).toBe('/carrier');

    const supplier = planMobileWorkspace({ platformRole: 'SUPPLIER', role: 'OWNER' });
    expect(supplier.workspace).toBe('supplier-field');
    expect(supplier.modules.map((module) => module.id)).toEqual(['fulfillment', 'quotes']);
    expect(supplier.withheld).toContain('Prices');
  });

  it('keeps a funder and an administrator off the phone', () => {
    expect(planMobileWorkspace({ platformRole: 'FACTORING', role: 'OWNER' })).toMatchObject({ workspace: 'web-only', deskPath: '/funding' });
    expect(planMobileWorkspace({ platformRole: 'ADMIN', role: 'OWNER' })).toMatchObject({ workspace: 'web-only', deskPath: '/admin' });
  });
});

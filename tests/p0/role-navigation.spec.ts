import { describe, expect, it } from 'vitest';
import { criticalDestinationsForRole, navigationForRole } from '@/lib/dashboard/role-navigation';

function hrefs(role: string) {
  return navigationForRole(role).flatMap((group) => group.items.map((item) => item.href));
}

describe('role navigation boundaries', () => {
  it('keeps carrier and funder accounts out of hotel order operations', () => {
    expect(hrefs('SHIPPING')).not.toContain('/orders');
    expect(hrefs('SHIPPING')).toContain('/carrier/handoff');
    expect(hrefs('FACTORING')).not.toContain('/orders');
    expect(hrefs('FACTORING')).toContain('/funding/evidence');
  });

  it('gives hotels distinct approval and receiving entry points', () => {
    expect(hrefs('HOTEL')).toEqual(expect.arrayContaining([
      '/orders?view=approval',
      '/orders?view=receiving',
    ]));
  });

  it('groups hotel screens into command, transactions, and intelligence', () => {
    const labels = navigationForRole('HOTEL').map((group) => group.label);
    expect(labels).toEqual(expect.arrayContaining(['Command', 'Transactions', 'Intelligence']));
    expect(criticalDestinationsForRole('HOTEL')).toEqual(expect.arrayContaining([
      '/dashboard',
      '/workspace/marketplace',
      '/intelligence',
      '/demand-aggregation',
      '/security',
    ]));
  });
});

import {describe,expect,it} from 'vitest';
import {navigationForRole} from '@/lib/dashboard/role-navigation';

function hrefs(role: string) {
  return navigationForRole(role).flatMap(group => group.items.map(item => item.href));
}

describe('role navigation', () => {
  it('does not send a carrier or a funder to the hotel orders page', () => {
    expect(hrefs('SHIPPING')).not.toContain('/orders');
    expect(hrefs('SHIPPING')).toContain('/carrier/handoff');
    expect(hrefs('FACTORING')).not.toContain('/orders');
    expect(hrefs('FACTORING')).toContain('/funding/evidence');
  });

  it('splits hotel orders into approval and receiving views', () => {
    expect(hrefs('HOTEL')).toEqual(expect.arrayContaining(['/orders?view=approval', '/orders?view=receiving']));
  });
});

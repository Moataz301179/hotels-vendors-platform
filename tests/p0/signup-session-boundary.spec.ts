import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  auth: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({ auth: m.auth }));
vi.mock('next/navigation', () => ({ redirect: m.redirect }));
vi.mock('@/components/v2/actor-signup', () => ({ ActorSignup: () => null }));

import HotelSignup from '@/app/(marketing)/hotels/signup/[[...rest]]/page';
import VendorSignup from '@/app/(marketing)/suppliers/signup/[[...rest]]/page';

describe('public signup session boundary', () => {
  beforeEach(() => {
    m.auth.mockReset();
    m.redirect.mockReset();
    m.redirect.mockImplementation(() => { throw new Error('redirected'); });
  });

  it.each([
    ['hotel', HotelSignup],
    ['vendor', VendorSignup],
  ])('sends an existing Clerk session through the role-aware handoff on %s signup', async (_name, page) => {
    m.auth.mockResolvedValue({ userId: 'user_existing' });
    await expect(page()).rejects.toThrow('redirected');
    expect(m.redirect).toHaveBeenCalledWith('/auth/continue');
  });

  it.each([
    ['hotel', HotelSignup, 'HOTEL'],
    ['vendor', VendorSignup, 'SUPPLIER'],
  ])('keeps the intended %s role for a signed-out registration', async (_name, page, role) => {
    m.auth.mockResolvedValue({ userId: null });
    const element = await page();
    expect(element.props.role).toBe(role);
    expect(m.redirect).not.toHaveBeenCalled();
  });
});

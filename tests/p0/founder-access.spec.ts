import { describe, expect, it } from 'vitest';
import { founderOperatingRole, founderPermissionCodes, verificationHold } from '@/lib/onboarding/founder-access';

describe('organization founder access', () => {
  it('makes the person who creates a hotel or supplier the organization owner', () => {
    expect(founderOperatingRole('HOTEL')).toBe('OWNER');
    expect(founderOperatingRole('SUPPLIER')).toBe('OWNER');
    expect(founderOperatingRole('SHIPPING')).toBe('LOGISTICS_COORDINATOR');
  });

  it('gives a hotel founder the actions needed to request, approve, and receive', () => {
    expect(founderPermissionCodes('HOTEL')).toEqual(['order:read', 'order:create', 'order:approve', 'order:reject', 'order:update']);
  });

  it('tells each pending organization what opens after review', () => {
    expect(verificationHold('HOTEL')).toContain('sealed sourcing request');
    expect(verificationHold('SUPPLIER')).toContain('requests assigned to it');
    expect(verificationHold('SHIPPING')).toContain('assigned movements');
    expect(verificationHold('FACTORING')).toContain('accepted invoice');
  });
});

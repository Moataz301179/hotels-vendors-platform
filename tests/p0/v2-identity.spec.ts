import { describe, expect, it } from 'vitest';
import { DEFAULT_NEW_USER_PLATFORM_ROLE, getVerifiedPrimaryEmail } from '../../lib/v2-identity';

describe('V2 trusted identity provisioning', () => {
  it('accepts and normalizes a verified primary email', () => {
    expect(getVerifiedPrimaryEmail({
      emailAddress: '  Hotel.Owner@Example.com ',
      verification: { status: 'verified' },
    })).toBe('hotel.owner@example.com');
  });

  it('rejects an unverified primary email', () => {
    expect(getVerifiedPrimaryEmail({
      emailAddress: 'owner@example.com',
      verification: { status: 'unverified' },
    })).toBeNull();
  });

  it('rejects missing, empty and malformed primary email values', () => {
    expect(getVerifiedPrimaryEmail(undefined)).toBeNull();
    expect(getVerifiedPrimaryEmail(null)).toBeNull();
    expect(getVerifiedPrimaryEmail({ emailAddress: ' ', verification: { status: 'verified' } })).toBeNull();
    expect(getVerifiedPrimaryEmail({ emailAddress: 'not-an-email', verification: { status: 'verified' } })).toBeNull();
  });

  it('assigns least-privilege HOTEL as the only self-service default role', () => {
    expect(DEFAULT_NEW_USER_PLATFORM_ROLE).toBe('HOTEL');
  });
});

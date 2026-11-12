import { describe, expect, it } from 'vitest';
import { assertSandboxTarget } from '../../scripts/sandbox-actors.mjs';

const local = {
  databaseUrl: 'postgresql://sandbox:sandbox@127.0.0.1:5432/hotelsvendors',
  clerkSecret: 'sk_test_sandbox',
  clerkPublishable: 'pk_test_sandbox',
};

describe('local sandbox actor guard', () => {
  it('accepts a database on this machine and development Clerk keys', () => {
    expect(() => assertSandboxTarget(local)).not.toThrow();
  });

  it('refuses a remote database', () => {
    expect(() => assertSandboxTarget({ ...local, databaseUrl: 'postgresql://sandbox:sandbox@ep-cool-darkness.neon.tech/hotelsvendors' })).toThrow('not on this machine');
  });

  it('refuses a live Clerk secret', () => {
    expect(() => assertSandboxTarget({ ...local, clerkSecret: 'sk_live_sandbox' })).toThrow('development keys');
  });

  it('refuses a live Clerk publishable key', () => {
    expect(() => assertSandboxTarget({ ...local, clerkPublishable: 'pk_live_sandbox' })).toThrow('development keys');
  });
});

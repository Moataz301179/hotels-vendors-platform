import { describe, expect, it } from 'vitest';
import { isWorkspaceNavigationActive } from '@/components/v2/workspace-navigation';

describe('workspace navigation active state', () => {
  it('matches query-driven approval and receiving entries', () => {
    expect(isWorkspaceNavigationActive('/orders?view=approval', '/orders', '?view=approval')).toBe(true);
    expect(isWorkspaceNavigationActive('/orders?view=approval', '/orders', '?view=receiving')).toBe(false);
  });

  it('keeps a parent entry active for nested workspace routes', () => {
    expect(isWorkspaceNavigationActive('/workspace/marketplace', '/workspace/marketplace/basket', '')).toBe(true);
    expect(isWorkspaceNavigationActive('/orders', '/orders/history', '')).toBe(true);
  });
});

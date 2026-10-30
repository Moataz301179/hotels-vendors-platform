import { describe, expect, it } from 'vitest';
import { orderMatchesWorkspaceView } from '@/lib/procurement/order-workspace-view';

describe('order workspace views', () => {
  it('keeps approval and receiving queues distinct', () => {
    expect(orderMatchesWorkspaceView('PENDING_APPROVAL', 'approval')).toBe(true);
    expect(orderMatchesWorkspaceView('IN_TRANSIT', 'approval')).toBe(false);
    expect(orderMatchesWorkspaceView('IN_TRANSIT', 'receiving')).toBe(true);
    expect(orderMatchesWorkspaceView('PARTIALLY_DELIVERED', 'receiving')).toBe(true);
    expect(orderMatchesWorkspaceView('DELIVERED', 'receiving')).toBe(false);
  });
});

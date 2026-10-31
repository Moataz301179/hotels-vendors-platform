import { describe, expect, it } from 'vitest';
import { orderMatchesWorkspaceView, parseOrderWorkspaceView } from '@/lib/procurement/order-workspace-view';

describe('order workspace views', () => {
  it('keeps approval and receiving queues distinct', () => {
    expect(orderMatchesWorkspaceView('PENDING_APPROVAL', 'approval')).toBe(true);
    expect(orderMatchesWorkspaceView('IN_TRANSIT', 'approval')).toBe(false);
    expect(orderMatchesWorkspaceView('IN_TRANSIT', 'receiving')).toBe(true);
    expect(orderMatchesWorkspaceView('PARTIALLY_DELIVERED', 'receiving')).toBe(true);
    expect(orderMatchesWorkspaceView('DELIVERED', 'receiving')).toBe(false);
  });
});

describe('order workspace view query parsing', () => {
  it('accepts only known views from the server-provided query string', () => {
    expect(parseOrderWorkspaceView('approval')).toBe('approval');
    expect(parseOrderWorkspaceView(['receiving', 'approval'])).toBe('receiving');
    expect(parseOrderWorkspaceView('anything-else')).toBe('all');
    expect(parseOrderWorkspaceView(undefined)).toBe('all');
  });
});

export type OrderWorkspaceView = 'all' | 'approval' | 'receiving';

export function orderMatchesWorkspaceView(status: string, view: OrderWorkspaceView): boolean {
  if (view === 'all') return true;
  if (view === 'approval') return status === 'PENDING_APPROVAL';
  return status === 'IN_TRANSIT' || status === 'PARTIALLY_DELIVERED';
}

/** Parse an untrusted `?view=` query value; anything unknown falls back to `all`. */
export function parseOrderWorkspaceView(value: string | string[] | undefined | null): OrderWorkspaceView {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === 'approval' || candidate === 'receiving' ? candidate : 'all';
}

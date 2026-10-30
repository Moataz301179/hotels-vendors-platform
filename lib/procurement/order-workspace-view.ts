export type OrderWorkspaceView = 'all' | 'approval' | 'receiving';

export function orderMatchesWorkspaceView(status: string, view: OrderWorkspaceView): boolean {
  if (view === 'all') return true;
  if (view === 'approval') return status === 'PENDING_APPROVAL';
  return status === 'IN_TRANSIT' || status === 'PARTIALLY_DELIVERED';
}

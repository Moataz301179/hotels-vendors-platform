'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AuditEntry {
  id: string;
  createdAt: string;
  entityName: string | null;
  entityId: string;
  actionType: string | null;
  actorId: string | null;
  actorRole: string | null;
  changes: unknown;
  hash: string | null;
}

interface Props {
  entries: AuditEntry[];
  loading?: boolean;
  emptyLabel?: string;
}

export function AuditTrailTable({ entries, loading, emptyLabel = 'No audit events match this view.' }: Props) {
  if (loading) return <p className="workspace-empty" role="status">Loading audit records…</p>;
  if (entries.length === 0) return <p className="workspace-empty">{emptyLabel}</p>;

  return (
    <table className="table">
      <thead>
        <tr><th>Time</th><th>Entity / reference</th><th>Action</th><th>Actor / role</th><th>Record integrity</th></tr>
      </thead>
      <tbody>
        {entries.map(e => (
          <tr key={e.id}>
            <td>{new Date(e.createdAt).toLocaleString('en-GB')}</td>
            <td>
              {e.entityName ?? 'Record'}
              <br /><span className="text-xs text-foreground-muted">{e.entityId}</span>
            </td>
            <td><span className="pill">{(e.actionType ?? 'Not recorded').replaceAll('_', ' ')}</span></td>
            <td>
              {e.actorId ?? 'System'}
              <br /><span className="text-xs text-foreground-muted">{(e.actorRole ?? 'Not recorded').replaceAll('_', ' ')}</span>
            </td>
            <td>
              {e.hash
                ? <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 size={13} /> Hash recorded</span>
                : <span className="inline-flex items-center gap-1 text-danger"><AlertTriangle size={13} /> Hash missing</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
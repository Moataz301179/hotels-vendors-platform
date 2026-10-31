'use client';

import { useCallback, useEffect, useState } from 'react';
import { requestJson } from '@/lib/v2-http';

type Shipment = { id: string; corridor: string; originHub: string; destinationHub: string; status: string; orderCount: number };

export function CarrierHandoff() {
  const [shipments, setShipments] = useState<Shipment[] | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    setShipments((await requestJson<{ shipments: Shipment[] }>('/api/v2/shipments')).shipments);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void load().catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : 'Unable to load handoff records.');
    });
    return () => { cancelled = true; };
  }, [load]);

  return <section className="card workspace-table-wrap" style={{ padding: 24 }}>
    {error ? <div className="workspace-status" role="alert">{error} <button className="btn btn-ghost" onClick={() => void load()}>Retry</button></div>
      : shipments === null ? <p role="status">Loading handoff records…</p>
        : shipments.length ? <table className="table"><thead><tr><th>Corridor</th><th>Pickup</th><th>Destination</th><th>Status</th><th>Linked orders</th></tr></thead><tbody>{shipments.map((shipment) => <tr key={shipment.id}><td>{shipment.corridor}</td><td>{shipment.originHub}</td><td>{shipment.destinationHub}</td><td>{shipment.status.replaceAll('_', ' ')}</td><td>{shipment.orderCount}</td></tr>)}</tbody></table>
          : <p className="workspace-empty">No handoff records are stored for this carrier.</p>}
  </section>;
}

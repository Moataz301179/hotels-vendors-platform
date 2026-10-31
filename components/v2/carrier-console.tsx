'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { requestJson } from '@/lib/v2-http';

type Shipment = {
  id: string;
  corridor: string;
  originHub: string;
  destinationHub: string;
  status: string;
  orderCount: number;
  truckType?: string;
  driverName?: string;
  estimatedArrival?: string;
};

const initial = { corridor: '', originHub: '', destinationHub: '', truckType: 'STANDARD' };

const STATUS_LABEL: Record<string, string> = {
  PLANNED: 'Planned',
  ASSIGNED: 'Assigned',
  IN_TRANSIT: 'In Transit',
  ARRIVED: 'Arrived',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export function CarrierConsole() {
  const [rows, setRows] = useState<Shipment[]>([]);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'plans' | 'new'>('plans');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows((await requestJson<{ shipments: Shipment[] }>('/api/v2/shipments')).shipments);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load shipment plans.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => { if (!cancelled) void load(); });
    return () => { cancelled = true };
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await requestJson('/api/v2/shipments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      setForm(initial);
      setMessage('Shipment plan created. Assign orders and confirm dispatch from the workspace.');
      setTab('plans');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save shipment plan.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="workspace-tabs" role="tablist" aria-label="Shipment plans">
        <button id="carrier-plans-tab" role="tab" aria-controls="carrier-panel" aria-selected={tab === 'plans'} onClick={() => setTab('plans')}>
          Plans ({rows.length})
        </button>
        <button id="carrier-new-tab" role="tab" aria-controls="carrier-panel" aria-selected={tab === 'new'} onClick={() => setTab('new')}>
          New plan
        </button>
      </div>
      {error && <div className="workspace-status" role="alert">{error} <button className="btn btn-ghost" disabled={loading || busy} onClick={load}>Reload plans</button></div>}
      {message && <p role="status" className="workspace-status">{message}</p>}
      <section id="carrier-panel" role="tabpanel" aria-labelledby={`carrier-${tab}-tab`} className="card workspace-table-wrap" style={{ padding: 24 }}>
        {tab === 'new' ? (
          <>
            <h2>Create a shipment plan</h2>
            <p className="muted">Record a route draft with corridor, hubs and vehicle type. Assign purchase orders and confirm dispatch from the workspace after saving.</p>
            <form onSubmit={create}>
              <div className="workspace-form">
                {([
                  { key: 'corridor', label: 'Corridor' },
                  { key: 'originHub', label: 'Pickup hub' },
                  { key: 'destinationHub', label: 'Destination hub' },
                ] as const).map(x => (
                  <label key={x.key}>{x.label}
                    <input required maxLength={160} value={form[x.key]} onChange={e => setForm({ ...form, [x.key]: e.target.value })} />
                  </label>
                ))}
                <label>Vehicle type
                  <select value={form.truckType} onChange={e => setForm({ ...form, truckType: e.target.value })}>
                    <option value="STANDARD">Standard</option>
                    <option value="VAN">Van</option>
                    <option value="TRUCK">Truck</option>
                    <option value="REFRIGERATED">Refrigerated</option>
                  </select>
                </label>
              </div>
              <button className="btn btn-blue" disabled={busy} style={{ marginTop: 20 }}>{busy ? 'Saving…' : 'Save plan'}</button>
            </form>
          </>
        ) : loading ? (
          <p role="status" className="workspace-empty">Loading shipment plans…</p>
        ) : rows.length ? (
          <table className="table">
            <thead>
              <tr><th>Corridor</th><th>Pickup</th><th>Destination</th><th>Status</th><th>Linked orders</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rows.map(x => (
                <tr key={x.id}>
                  <td><strong>{x.corridor}</strong></td>
                  <td>{x.originHub}</td>
                  <td>{x.destinationHub}</td>
                  <td><span className="pill">{STATUS_LABEL[x.status] || x.status.replaceAll('_', ' ')}</span></td>
                  <td>{x.orderCount}</td>
                  <td>
                    <button className="btn btn-ghost" onClick={() => void navigator.clipboard.writeText(x.id)}>Ref: {x.id.slice(-8)}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="workspace-empty">No shipment plans yet. Choose New plan to record a route draft.</p>
        )}
      </section>
    </>
  );
}

'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Check, ChevronRight, ClipboardCheck, PackageCheck, Route, X } from 'lucide-react';
import { requestJson } from '@/lib/v2-http';

type Assignment = { id: string; orderId: string; status: string; assignedAt: string };
type Shipment = { id: string; assignmentId: string | null; corridor: string; originHub: string; destinationHub: string; status: string };
type ShipmentForm = { assignmentId: string; orderId: string; corridor: string; originHub: string; destinationHub: string; truckType: string };

const STATUS_LABEL: Record<string, string> = { ASSIGNED: 'Awaiting response', ACCEPTED: 'Ready to plan', REJECTED: 'Declined', PLANNED: 'Planned', PICKED_UP: 'Picked up', IN_TRANSIT: 'In transit', DELIVERED: 'Delivered' };

export function CarrierConsole() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [form, setForm] = useState<ShipmentForm | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [assignmentData, shipmentData] = await Promise.all([
        requestJson<{ assignments: Assignment[] }>('/api/v2/carrier-assignments'),
        requestJson<{ shipments: Shipment[] }>('/api/v2/shipments'),
      ]);
      setAssignments(assignmentData.assignments); setShipments(shipmentData.shipments);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load carrier work.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function respond(assignment: Assignment, status: 'ACCEPTED' | 'REJECTED') {
    setBusyId(assignment.id); setError(''); setMessage('');
    try {
      await requestJson('/api/v2/carrier-assignments', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: assignment.id, status }) });
      setMessage(status === 'ACCEPTED' ? 'Assignment accepted. Create the controlled shipment record when pickup details are confirmed.' : 'Assignment declined. The hotel team can now make another controlled assignment.');
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update this assignment.'); }
    finally { setBusyId(null); }
  }

  function beginPlan(assignment: Assignment) {
    setMessage(''); setError('');
    setForm({ assignmentId: assignment.id, orderId: assignment.orderId, corridor: '', originHub: '', destinationHub: '', truckType: 'STANDARD' });
  }

  async function createShipment(event: FormEvent) {
    event.preventDefault(); if (!form) return;
    setBusyId(form.assignmentId); setError(''); setMessage('');
    try {
      await requestJson('/api/v2/shipments', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...form, orderIds: [form.orderId] }) });
      setForm(null); setMessage('Shipment plan created against the accepted assignment. Record pickup and delivery from the controlled handoff route.');
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to create this assignment-backed shipment.'); }
    finally { setBusyId(null); }
  }

  const pending = assignments.filter((item) => item.status === 'ASSIGNED');
  const accepted = assignments.filter((item) => item.status === 'ACCEPTED' && !shipments.some((shipment) => shipment.assignmentId === item.id));

  return <div className="carrier-console">
    <section className="workspace-focus"><div><span className="eyebrow">Assigned carrier work</span><h2>Act only on a hotel-authorized assignment.</h2><p>A carrier cannot create a blank movement or see unassigned orders. Accept the assignment first, then create one shipment record for that accepted order.</p></div><a href="/carrier/handoff" className="btn btn-blue">Open handoff records</a></section>
    {error && <div className="workspace-status" role="alert">{error} <button className="btn btn-ghost" disabled={loading || !!busyId} onClick={() => void load()}>Reload work</button></div>}
    {message && <p className="workspace-status" role="status">{message}</p>}
    {loading ? <p className="workspace-empty" role="status">Loading authorized carrier work…</p> : <>
      <section className="workspace-section" aria-labelledby="carrier-assignment-title"><div className="workspace-section-heading"><div><span className="eyebrow">Assignment queue</span><h2 id="carrier-assignment-title">Respond to hotel assignments</h2><p>Accept or decline before planning a pickup.</p></div></div>
        {pending.length ? <div className="carrier-assignment-grid">{pending.map((assignment) => <article className="card carrier-assignment-card" key={assignment.id}><Route aria-hidden="true"/><div><span className="workspace-status-chip is-warning">Awaiting response</span><h3>Order {assignment.orderId.slice(-8)}</h3><p>Assigned {new Date(assignment.assignedAt).toLocaleDateString('en-GB')}. The commercial order remains owned by the hotel and Vendor.</p></div><div className="carrier-assignment-actions"><button className="btn btn-blue" disabled={!!busyId} onClick={() => void respond(assignment, 'ACCEPTED')}><Check aria-hidden="true"/>Accept assignment</button><button className="btn btn-ghost" disabled={!!busyId} onClick={() => void respond(assignment, 'REJECTED')}><X aria-hidden="true"/>Decline</button></div></article>)}</div> : <p className="workspace-empty">No carrier assignment is awaiting a response.</p>}
      </section>
      <section className="workspace-section" aria-labelledby="carrier-plan-title"><div className="workspace-section-heading"><div><span className="eyebrow">Pickup planning</span><h2 id="carrier-plan-title">Accepted assignments ready for handoff</h2><p>Each shipment is bound to one accepted assignment and one order.</p></div></div>
        {accepted.length ? <div className="carrier-assignment-grid">{accepted.map((assignment) => <article className="card carrier-assignment-card" key={assignment.id}><ClipboardCheck aria-hidden="true"/><div><span className="workspace-status-chip is-neutral">Ready to plan</span><h3>Order {assignment.orderId.slice(-8)}</h3><p>Enter physical route details only after the carrier accepted this authorized assignment.</p></div><button className="btn btn-blue" disabled={!!busyId} onClick={() => beginPlan(assignment)}>Create controlled shipment <ChevronRight aria-hidden="true"/></button></article>)}</div> : <p className="workspace-empty">No accepted assignment is waiting for a shipment plan.</p>}
      </section>
      {form && <section className="card carrier-plan-form" aria-labelledby="carrier-plan-form-title"><div><span className="eyebrow">Assignment-backed shipment</span><h2 id="carrier-plan-form-title">Plan pickup for order {form.orderId.slice(-8)}</h2><p className="muted">This record remains linked to the accepted carrier assignment.</p></div><form onSubmit={createShipment} className="workspace-form"><label>Route corridor<input required maxLength={160} value={form.corridor} onChange={(event) => setForm({ ...form, corridor: event.target.value })} placeholder="e.g. Cairo → Alexandria"/></label><label>Pickup location<input required maxLength={160} value={form.originHub} onChange={(event) => setForm({ ...form, originHub: event.target.value })}/></label><label>Delivery location<input required maxLength={160} value={form.destinationHub} onChange={(event) => setForm({ ...form, destinationHub: event.target.value })}/></label><label>Vehicle type<select value={form.truckType} onChange={(event) => setForm({ ...form, truckType: event.target.value })}><option value="STANDARD">Standard</option><option value="VAN">Van</option><option value="TRUCK">Truck</option><option value="REFRIGERATED">Refrigerated</option></select></label><div className="workspace-form-actions"><button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn btn-blue" disabled={!!busyId}>{busyId ? 'Saving…' : 'Create shipment record'}</button></div></form></section>}
      <section className="workspace-section" aria-labelledby="carrier-shipment-title"><div className="workspace-section-heading"><div><span className="eyebrow">Movement records</span><h2 id="carrier-shipment-title">Active controlled handoffs</h2></div></div>{shipments.length ? <div className="carrier-shipment-list">{shipments.map((shipment) => <a className="card carrier-shipment-row" href="/carrier/handoff" key={shipment.id}><PackageCheck aria-hidden="true"/><span><strong>{shipment.corridor}</strong><small>{shipment.originHub} → {shipment.destinationHub}</small></span><span className="workspace-status-chip is-neutral">{STATUS_LABEL[shipment.status] ?? shipment.status}</span><ChevronRight aria-hidden="true"/></a>)}</div> : <p className="workspace-empty">No controlled shipment record has been created for this carrier workspace.</p>}</section>
    </>}
  </div>;
}

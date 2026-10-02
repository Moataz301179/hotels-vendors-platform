'use client';

import { useEffect, useState } from 'react';

type OrderRow = {
  id: string; orderNumber: string; status: string; currency: string;
  total?: string | number | null; createdAt: string;
  supplier?: { name: string } | null;
};
type OrdersResponse = { orders?: OrderRow[] };

export default function Orders() {
  const [rows, setRows] = useState<OrderRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/api/v2/orders').then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: OrdersResponse) => { if (active) setRows(Array.isArray(data.orders) ? data.orders : []); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);

  return <>
    <div className="eyebrow">Commercial activity</div>
    <h1 style={{ fontSize: 42, letterSpacing: '-.05em', margin: '8px 0' }}>Orders</h1>
    <p className="muted">Orders are displayed from persistent, tenant-scoped records.</p>
    <div className="card" style={{ marginTop: 28, overflow: 'auto' }}>
      {failed ? <div style={{ padding: 28 }}>Unable to load orders. Check the service and try again.</div> : rows === null ? <div style={{ padding: 28 }}>Loading…</div> : !rows.length ? <div style={{ padding: 48, textAlign: 'center' }}><div className="eyebrow">No orders yet</div><h2 style={{ margin: '12px 0' }}>No commercial activity has been recorded.</h2></div> : <table className="table"><thead><tr><th>Order</th><th>Status</th><th>Supplier</th><th>Total</th><th>Created</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.orderNumber}</strong></td><td><span className="pill">{row.status}</span></td><td>{row.supplier?.name || '—'}</td><td>{row.total != null ? `${row.total} ${row.currency}` : '—'}</td><td>{new Date(row.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table>}
    </div>
  </>;
}

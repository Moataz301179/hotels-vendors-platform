'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { requestJson } from '@/lib/v2-http';
import { WorkflowChain } from '@/components/v2/workflow-chain';

type OrderItem = {
  id: string;
  quantity: number;
  receivedQuantity: number | null;
  unitPrice: number | string | null;
  product: { name: string; sku: string; unitOfMeasure: string };
};

type Approval = {
  id: string;
  action: string;
  reason: string | null;
  beforeState: string | null;
  afterState: string | null;
  createdAt: string;
  approver: { name: string; email: string };
};

type Receipt = {
  id: string;
  grnNumber: string;
  status: string;
  receivedAt: string;
  inspectedAt: string | null;
  acceptedAt: string | null;
};

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  poNumber: string | null;
  costCenter: string | null;
  deliveryDate: string | null;
  estimatedDelivery: string | null;
  deliveryInstructions: string | null;
  paymentGuaranteed: boolean;
  paymentGuaranteeMethod: string | null;
  subtotal: number | string | null;
  taxAmount: number | string | null;
  totalAmount: number | string | null;
  etaCompliance: string;
  createdAt: string;
  supplier?: { name: string; city: string; isVerified: boolean };
  hotel?: { name: string };
  department?: { name: string };
  items: OrderItem[];
  approvals: Approval[];
  invoices: { id: string; invoiceNumber: string; status: string; etaStatus: string | null; issueDate: string | null }[];
  receipts: Receipt[];
};

/**
 * Detail drawer — opens from the order list without losing list context.
 * Benchmark: Veld contextual detail panel; Inity contextual actions.
 */
export function OrderDrawer({
  orderId,
  onClose,
  onAction,
}: {
  orderId: string;
  onClose: () => void;
  onAction: () => void;
}) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setOrder(null);
    setError('');
    requestJson<{ order: OrderDetail }>(`/api/v2/orders/${encodeURIComponent(orderId)}`)
      .then((data) => {
        if (active) setOrder(data.order);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load this order.');
      });
    return () => {
      active = false;
    };
  }, [orderId]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const money = (value: number | string | null | undefined) =>
    value === null || value === undefined ? '—' : Number(value).toLocaleString();

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Order detail ${order?.orderNumber ?? ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="drawer-head">
          <div>
            <span className="eyebrow">Order detail</span>
            <h2>{order?.orderNumber ?? 'Loading…'}</h2>
            {order && <WorkflowChain status={order.status} />}
          </div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close detail">
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="drawer-body">
          {error && <p className="drawer-error" role="alert">{error}</p>}
          {!order && !error && <p className="muted" role="status">Loading order evidence…</p>}

          {order && (
            <>
              <section className="drawer-section">
                <h3>Commercial context</h3>
                <dl className="drawer-facts">
                  <div><dt>Supplier</dt><dd>{order.supplier?.name ?? '—'}</dd></div>
                  <div><dt>Property</dt><dd>{order.hotel?.name ?? '—'}</dd></div>
                  <div><dt>Department</dt><dd>{order.department?.name ?? '—'}</dd></div>
                  <div><dt>Cost center</dt><dd>{order.costCenter ?? '—'}</dd></div>
                  <div><dt>PO number</dt><dd>{order.poNumber ?? '—'}</dd></div>
                  <div><dt>Payment guarantee</dt><dd>{order.paymentGuaranteed ? `Recorded${order.paymentGuaranteeMethod ? ` · ${order.paymentGuaranteeMethod}` : ''}` : 'Not recorded'}</dd></div>
                </dl>
              </section>

              <section className="drawer-section">
                <h3>Lines</h3>
                <div className="drawer-table-wrap">
                  <table className="table">
                    <thead><tr><th>Product</th><th>Ordered</th><th>Received</th><th>Unit price</th></tr></thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td><strong>{item.product.name}</strong><br /><small className="muted">{item.product.sku}</small></td>
                          <td>{item.quantity} {item.product.unitOfMeasure}</td>
                          <td>{item.receivedQuantity ?? 0}</td>
                          <td>{money(item.unitPrice)}</td>
                        </tr>
                      ))}
                      {order.items.length === 0 && (
                        <tr><td colSpan={4} className="muted">No lines recorded.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="drawer-totals">
                  <span>Subtotal <strong>{money(order.subtotal)} {order.currency}</strong></span>
                  <span>Tax <strong>{money(order.taxAmount)} {order.currency}</strong></span>
                  <span>Total <strong>{money(order.totalAmount)} {order.currency}</strong></span>
                </div>
              </section>

              <section className="drawer-section">
                <h3>Approval trail</h3>
                {order.approvals.length === 0 ? (
                  <p className="muted">No approvals recorded yet.</p>
                ) : (
                  <ol className="drawer-trail">
                    {order.approvals.map((approval) => (
                      <li key={approval.id}>
                        <span className="drawer-trail-dot" aria-hidden="true" />
                        <div>
                          <strong>{approval.approver.name}</strong>
                          <small>{approval.action} · {new Date(approval.createdAt).toLocaleString()}</small>
                          {approval.reason && <p>{approval.reason}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              <section className="drawer-section">
                <h3>Receiving evidence</h3>
                {order.receipts.length === 0 ? (
                  <p className="muted">No goods receipt recorded yet.</p>
                ) : (
                  <ul className="drawer-receipts">
                    {order.receipts.map((receipt) => (
                      <li key={receipt.id}>
                        <strong>{receipt.grnNumber}</strong>
                        <span className={`pill${receipt.status === 'REJECTED' ? ' pill-danger' : ''}`}>{receipt.status.replaceAll('_', ' ')}</span>
                        <small className="muted">{new Date(receipt.receivedAt).toLocaleString()}</small>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="drawer-section">
                <h3>Invoice records</h3>
                {order.invoices.length === 0 ? (
                  <p className="muted">No invoice issued for this order.</p>
                ) : (
                  <ul className="drawer-invoices">
                    {order.invoices.map((invoice) => (
                      <li key={invoice.id}>
                        <strong>{invoice.invoiceNumber}</strong>
                        <span className="pill">{invoice.status}</span>
                        <small className="muted">{invoice.etaStatus ?? 'ETA status unrecorded'}</small>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>

        {order && (
          <footer className="drawer-foot">
            <button type="button" className="btn btn-blue" onClick={onAction}>Open full order workspace</button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
          </footer>
        )}
      </aside>
    </div>
  );
}

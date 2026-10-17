"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { EvidenceRegistry } from "@/components/v2/evidence-registry";
import { requestJson } from "@/lib/v2-http";

type Opportunity = {
  id: string;
  title: string;
  description?: string;
  status: string;
  potentialImpact?: number | string;
  confidence?: number;
  affectedProductId?: string;
};

type Receipt = { id: string; orderNumber: string; status: string; items: Array<{ productId: string }> };
type Data = { opportunities: Opportunity[]; canVerifyOutcomes: boolean };

const next: Record<string, [string, string]> = {
  DETECTED: ["REVIEWING", "Review finding"],
  REVIEWING: ["ACTION_READY", "Prepare action"],
  RESEARCHING: ["ACTION_READY", "Prepare action"],
  ACTION_READY: ["APPROVED", "Approve action plan"],
  RFQ_SENT: ["APPROVED", "Approve action plan"],
  APPROVED: ["EXECUTING", "Start action"],
  EXECUTING: ["RESULT_PENDING", "Review outcome"],
};

export function IntelligenceClient() {
  const [data, setData] = useState<Data | null>(null);
  const [orders, setOrders] = useState<Receipt[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [opportunities, orderData] = await Promise.all([
      requestJson<Data>("/api/v2/opportunities"),
      requestJson<{ orders: Receipt[] }>("/api/v2/orders"),
    ]);
    setData(opportunities);
    setOrders(orderData.orders);
    setError("");
  }

  useEffect(() => {
    void load().catch(error => setError((error as Error).message));
  }, []);

  async function act(url: string, body?: object) {
    setBusy(true);
    setMessage("");
    try {
      const result = await requestJson<{ createdCount?: number }>(url, {
        method: body ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      setMessage(body ? "Outcome workflow updated." : `Scan complete: ${result.createdCount ?? 0} new findings.`);
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="eyebrow">Market Compass</div>
      <h1>Evidence to a measurable outcome.</h1>
      <p className="muted">Review price variance from received orders, request a fresh quote, and record the result after delivery. Potential savings remain estimates until an authorized reviewer verifies a later received order.</p>
      <button className="btn btn-blue" disabled={busy} onClick={() => void act("/api/v2/intelligence/scan")}>{busy ? "Working…" : "Scan received orders"}</button>

      {error ? <div className="workspace-status" role="alert">{error} <button className="btn btn-ghost" onClick={() => void load().catch(error => setError(error.message))}>Retry</button></div> : null}
      {!data ? <p role="status">Loading recorded findings…</p> : null}
      {data && !data.opportunities.length ? <div className="workspace-status"><h2>No findings yet.</h2><p>A price comparison needs at least two received order lines for the same product.</p><Link href="/workspace/marketplace" className="btn btn-ghost">Open procurement</Link></div> : null}

      {data?.opportunities.length ? (
        <div className="card" style={{ marginTop: 24, overflowX: "auto" }}>
          <table className="table">
            <thead><tr><th>Finding</th><th>Status</th><th>Potential impact</th><th>Next action</th></tr></thead>
            <tbody>
              {data.opportunities.map(opportunity => (
                <tr key={opportunity.id}>
                  <td><strong>{opportunity.title}</strong><p className="muted">{opportunity.description}</p><small>Confidence: {opportunity.confidence ? `${Math.round(opportunity.confidence * 100)}%` : "Unrated"}</small></td>
                  <td>{opportunity.status.replaceAll("_", " ")}</td>
                  <td>{Number(opportunity.potentialImpact || 0).toLocaleString()} EGP · estimate</td>
                  <td>
                    {next[opportunity.status] ? <button className="btn btn-blue" disabled={busy} onClick={() => void act("/api/v2/opportunities", { id: opportunity.id, status: next[opportunity.status][0] })}>{next[opportunity.status][1]}</button> : null}
                    {["ACTION_READY", "RFQ_SENT", "EXECUTING"].includes(opportunity.status) ? <p><Link href="/workspace/marketplace">Compare supplier quotes</Link></p> : null}
                    {opportunity.status === "RESULT_PENDING" ? (
                      <>
                        {data.canVerifyOutcomes ? <><label>Received order<select value={selected[opportunity.id] || ""} onChange={event => setSelected(current => ({ ...current, [opportunity.id]: event.target.value }))}><option value="">Choose an order</option>{orders.filter(order => order.status === "DELIVERED" && order.items.some(item => item.productId === opportunity.affectedProductId)).map(order => <option key={order.id} value={order.id}>{order.orderNumber}</option>)}</select></label><button className="btn btn-blue" disabled={busy || !selected[opportunity.id]} onClick={() => void act("/api/v2/opportunities", { id: opportunity.id, status: "VERIFIED", orderId: selected[opportunity.id] })}>Verify received-order savings</button></> : <p>An authorized reviewer must verify the received-order outcome.</p>}
                        <button className="btn btn-ghost" disabled={busy} onClick={() => void act("/api/v2/opportunities", { id: opportunity.id, status: "CLOSED" })}>Close without savings</button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {message ? <p className="workspace-status" role="status">{message}</p> : null}
      <EvidenceRegistry />
    </>
  );
}

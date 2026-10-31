// SHIPPING DASHBOARD MODULE (G6 — role-specific, DB-connected)
// Real dashboard for Carrier / logistics organizations.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Truck, ArrowRight, AlertTriangle, RefreshCw, PackageCheck,
  MapPin, Clock, CheckCircle2
} from "lucide-react";
import { requestJson } from "@/lib/v2-http";
import { LoadingPage } from "@/components/dashboards/shared/loading-card";

interface ShipmentSummary {
  total: number;
  inTransit: number;
  delivered: number;
  pending: number;
}

export function ShippingDashboard() {
  const [summary, setSummary] = useState<ShipmentSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      requestJson<{ shipments: any[] }>("/api/v2/shipments"),
    ]).then(([shipments]) => {
      if (!active) return;
      const rows = shipments.shipments || [];
      setSummary({
        total: rows.length,
        inTransit: rows.filter((r: any) => r.status === "IN_TRANSIT" || r.status === "ASSIGNED").length,
        delivered: rows.filter((r: any) => r.status === "DELIVERED").length,
        pending: rows.filter((r: any) => r.status === "DRAFT" || r.status === "PENDING").length,
      });
    }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load shipment data."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingPage />;
  if (error || !summary) return (
    <div className="workspace-status" role="alert">
      <AlertTriangle size={16} /> {error || "No data available"}
      <button className="btn btn-ghost" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  const fmt = (n: number) => n.toLocaleString("en-EG");

  return (
    <div className="role-dashboard" data-role="shipping">
      <div className="role-dashboard-hero">
        <div>
          <span className="eyebrow">Carrier workspace</span>
          <h1>Run assigned handoffs with evidence at every milestone.</h1>
          <p className="muted">See only logistics activity assigned to your organization, record pickup and delivery evidence, and escalate exceptions from the controlled shipment record.</p>
        </div>
        <Link href="/carrier" className="role-dashboard-primary">
          <Truck aria-hidden="true" />
          <span><small>Start here</small><strong>Open delivery tasks</strong><em>Review assigned movement, timing and delivery instructions.</em></span>
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>

      <section className="role-dashboard-metrics" aria-label="Carrier workspace status">
        <div className="card role-dashboard-metric">
          <span>Total shipment plans</span>
          <strong>{fmt(summary.total)}</strong>
          <small>Route drafts and active plans</small>
        </div>
        <div className="card role-dashboard-metric">
          <span>In Transit</span>
          <strong>{fmt(summary.inTransit)}</strong>
          <small>Currently moving or assigned</small>
        </div>
        <div className="card role-dashboard-metric">
          <span>Delivered</span>
          <strong>{fmt(summary.delivered)}</strong>
          <small>Completed with evidence</small>
        </div>
        <div className="card role-dashboard-metric">
          <span>Pending</span>
          <strong>{fmt(summary.pending)}</strong>
          <small>Awaiting assignment</small>
        </div>
      </section>

      <section className="role-dashboard-main">
        <div className="role-dashboard-actions">
          <div className="workspace-section-heading">
            <div><span className="eyebrow">Your next actions</span><h2>Choose one clear task.</h2></div>
          </div>
          <div className="role-dashboard-action-grid">
            <Link href="/carrier" className="card role-dashboard-action">
              <Truck aria-hidden="true" /><h3>Open delivery tasks</h3>
              <p>Review assigned movement, timing and delivery instructions.</p>
              <span>Open <ArrowRight aria-hidden="true" /></span>
            </Link>
            <Link href="/orders" className="card role-dashboard-action">
              <PackageCheck aria-hidden="true" /><h3>Review handoff records</h3>
              <p>Open the authorized order context before recording a handoff.</p>
              <span>Open <ArrowRight aria-hidden="true" /></span>
            </Link>
            <Link href="/security" className="card role-dashboard-action">
              <MapPin aria-hidden="true" /><h3>Organization access</h3>
              <p>Manage the people allowed to record carrier activity.</p>
              <span>Open <ArrowRight aria-hidden="true" /></span>
            </Link>
            <Link href="/orders" className="card role-dashboard-action">
              <Clock aria-hidden="true" /><h3>Escalate exceptions</h3>
              <p>Flag delivery issues from the controlled shipment record.</p>
              <span>Open <ArrowRight aria-hidden="true" /></span>
            </Link>
          </div>
        </div>
        <aside className="card role-dashboard-journey" aria-label="How work moves">
          <span className="eyebrow">How work moves</span>
          <ol>
            <li><span>01</span><strong>Receive assignment</strong></li>
            <li><span>02</span><strong>Confirm pickup</strong></li>
            <li><span>03</span><strong>Update delivery milestone</strong></li>
            <li><span>04</span><strong>Attach evidence</strong></li>
            <li><span>05</span><strong>Escalate any exception</strong></li>
          </ol>
          <p><CheckCircle2 aria-hidden="true" /> Each milestone keeps its own organization-scoped record.</p>
        </aside>
      </section>
    </div>
  );
}

export const roleConfig = { role: "shipping", tenantScope: true };

// HOTEL DASHBOARD MODULE (G6 — role-specific, DB-connected)
// Real dashboard for hotel buyers / procurement teams.
// Fetches live metrics from /api/v2/dashboard and renders actionable cards.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PackageCheck, ClipboardCheck, FileText, WalletCards, Truck,
  ArrowRight, RefreshCw, AlertTriangle, TrendingUp
} from "lucide-react";
import { requestJson } from "@/lib/v2-http";
import { MetricTile } from "@/components/dashboards/shared/metric-tile";
import { StatusPill } from "@/components/dashboards/shared/status-pill";
import { EmptyState } from "@/components/dashboards/shared/empty-state";
import { LoadingPage } from "@/components/dashboards/shared/loading-card";

interface DashboardMetrics {
  orders: number;
  rfqs: number;
  shipments: number;
  fundingRequests: number;
  opportunities: number;
  activeProducts: number;
  activeSuppliers: number;
  realizedSavings: number;
  verifiedSavings: number;
  potentialSavings: number;
}

export function HotelDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    requestJson<DashboardMetrics>("/api/v2/dashboard")
      .then((data) => { if (active) setMetrics(data); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load workspace metrics."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingPage />;
  if (error || !metrics) return (
    <div className="workspace-status" role="alert">
      <AlertTriangle size={16} /> {error || "No data available"}
      <button className="btn btn-ghost" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  const fmt = (n: number) => n.toLocaleString("en-EG");

  return (
    <div className="role-dashboard" data-role="hotel">
      <div className="role-dashboard-hero">
        <div>
          <span className="eyebrow">Hotel purchasing workspace</span>
          <h1>Start with the requirement. Keep every handoff connected.</h1>
          <p className="muted">Browse reviewed products, assemble a sourcing request, approve the commercial decision, and follow receipt evidence without exposing private Vendor relationships.</p>
        </div>
        <Link href="/workspace/marketplace" className="role-dashboard-primary">
          <PackageCheck aria-hidden="true" />
          <span><small>Start here</small><strong>Source supplies</strong><em>Browse by category or add an approved item to a sourcing request.</em></span>
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>

      <section className="role-dashboard-metrics" aria-label="Hotel workspace status">
        <Link href="/workspace/marketplace" className="card role-dashboard-metric">
          <span>Open sourcing requests</span>
          <strong>{fmt(metrics.rfqs)}</strong>
          <small>Requests moving through the sealed sourcing workflow.</small>
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link href="/orders" className="card role-dashboard-metric">
          <span>Orders to follow</span>
          <strong>{fmt(metrics.orders)}</strong>
          <small>Authorized purchase records and receipt status.</small>
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link href="/intelligence" className="card role-dashboard-metric">
          <span>Recorded opportunity signals</span>
          <strong>{fmt(metrics.opportunities)}</strong>
          <small>Signals require review before a commercial action.</small>
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link href="/demand-aggregation" className="card role-dashboard-metric">
          <span>Potential savings identified</span>
          <strong>EGP {fmt(metrics.potentialSavings)}</strong>
          <small>Verified: EGP {fmt(metrics.verifiedSavings)} · Realized: EGP {fmt(metrics.realizedSavings)}</small>
          <ArrowRight aria-hidden="true" />
        </Link>
      </section>

      <section className="role-dashboard-main">
        <div className="role-dashboard-actions">
          <div className="workspace-section-heading">
            <div><span className="eyebrow">Your next actions</span><h2>Choose one clear task.</h2></div>
          </div>
          <div className="role-dashboard-action-grid">
            <Link href="/workspace/marketplace" className="card role-dashboard-action">
              <PackageCheck aria-hidden="true" /><h3>Browse catalogue</h3>
              <p>Reviewed product references by category. No Vendor identity shown before authorization.</p>
              <span>Open <ArrowRight aria-hidden="true" /></span>
            </Link>
            <Link href="/orders" className="card role-dashboard-action">
              <ClipboardCheck aria-hidden="true" /><h3>Review orders &amp; receiving</h3>
              <p>Track approval, dispatch and goods-receipt status.</p>
              <span>Open <ArrowRight aria-hidden="true" /></span>
            </Link>
            <Link href="/demand-aggregation" className="card role-dashboard-action">
              <TrendingUp aria-hidden="true" /><h3>Plan repeat demand</h3>
              <p>Review portfolio demand before the next buy cycle.</p>
              <span>Open <ArrowRight aria-hidden="true" /></span>
            </Link>
            <Link href="/intelligence" className="card role-dashboard-action">
              <WalletCards aria-hidden="true" /><h3>Inspect market signals</h3>
              <p>Use recorded intelligence before making a commercial decision.</p>
              <span>Open <ArrowRight aria-hidden="true" /></span>
            </Link>
          </div>
        </div>
        <aside className="card role-dashboard-journey" aria-label="How work moves">
          <span className="eyebrow">How work moves</span>
          <ol>
            <li><span>01</span><strong>Browse or describe a need</strong></li>
            <li><span>02</span><strong>Send sealed RFQ</strong></li>
            <li><span>03</span><strong>Review comparable responses</strong></li>
            <li><span>04</span><strong>Approve purchase order</strong></li>
            <li><span>05</span><strong>Record GRN and invoice</strong></li>
          </ol>
          <p><Truck aria-hidden="true" /> Each step keeps its own organization-scoped record.</p>
        </aside>
      </section>
    </div>
  );
}

export const roleConfig = { role: "hotel", tenantScope: true };

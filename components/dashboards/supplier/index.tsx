// SUPPLIER DASHBOARD MODULE (G6 — role-specific, DB-connected)
// Real dashboard for Vendor / supplier organizations.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PackageCheck, ClipboardCheck, FileText, ShieldCheck, ArrowRight,
  AlertTriangle, TrendingUp, RefreshCw
} from "lucide-react";
import { requestJson } from "@/lib/v2-http";
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

export function SupplierDashboard() {
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
    <div className="role-dashboard" data-role="supplier">
      <div className="role-dashboard-hero">
        <div>
          <span className="eyebrow">Vendor workspace</span>
          <h1>Keep your catalogue current. Respond only when work is assigned.</h1>
          <p className="muted">Manage Vendor-owned product data, respond to allocated RFQs, confirm awarded orders, and keep delivery and invoice records connected.</p>
        </div>
        <Link href="/suppliers" className="role-dashboard-primary">
          <PackageCheck aria-hidden="true" />
          <span><small>Start here</small><strong>Manage catalogue &amp; stock</strong><em>Add or update your own product evidence, availability and commercial data.</em></span>
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>

      <section className="role-dashboard-metrics" aria-label="Supplier workspace status">
        <Link href="/suppliers" className="card role-dashboard-metric">
          <span>Assigned RFQs</span>
          <strong>{fmt(metrics.rfqs)}</strong>
          <small>Only requests allocated to your organization.</small>
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link href="/suppliers" className="card role-dashboard-metric">
          <span>Active catalogue records</span>
          <strong>{fmt(metrics.activeProducts)}</strong>
          <small>Vendor-owned records with their own publication status.</small>
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link href="/orders" className="card role-dashboard-metric">
          <span>Orders to fulfil</span>
          <strong>{fmt(metrics.orders)}</strong>
          <small>Confirmed work requiring a controlled handoff.</small>
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link href="/eta-compliance" className="card role-dashboard-metric">
          <span>Active suppliers</span>
          <strong>{fmt(metrics.activeSuppliers)}</strong>
          <small>Verified supplier identities in the network.</small>
          <ArrowRight aria-hidden="true" />
        </Link>
      </section>

      <section className="role-dashboard-main">
        <div className="role-dashboard-actions">
          <div className="workspace-section-heading">
            <div><span className="eyebrow">Your next actions</span><h2>Choose one clear task.</h2></div>
          </div>
          <div className="role-dashboard-action-grid">
            <Link href="/suppliers" className="card role-dashboard-action">
              <PackageCheck aria-hidden="true" /><h3>Manage catalogue &amp; stock</h3>
              <p>Add or update your own product evidence, availability and commercial data.</p>
              <span>Open <ArrowRight aria-hidden="true" /></span>
            </Link>
            <Link href="/suppliers" className="card role-dashboard-action">
              <ClipboardCheck aria-hidden="true" /><h3>Respond to assigned RFQs</h3>
              <p>Prepare complete terms only for sourcing events allocated to your organization.</p>
              <span>Open <ArrowRight aria-hidden="true" /></span>
            </Link>
            <Link href="/orders" className="card role-dashboard-action">
              <FileText aria-hidden="true" /><h3>Confirm fulfilment</h3>
              <p>Follow confirmed purchase orders and handoff requirements.</p>
              <span>Open <ArrowRight aria-hidden="true" /></span>
            </Link>
            <Link href="/eta-compliance" className="card role-dashboard-action">
              <ShieldCheck aria-hidden="true" /><h3>Prepare ETA records</h3>
              <p>Review the regulated invoice-record workflow.</p>
              <span>Open <ArrowRight aria-hidden="true" /></span>
            </Link>
          </div>
        </div>
        <aside className="card role-dashboard-journey" aria-label="How work moves">
          <span className="eyebrow">How work moves</span>
          <ol>
            <li><span>01</span><strong>Maintain catalogue</strong></li>
            <li><span>02</span><strong>Receive assigned RFQ</strong></li>
            <li><span>03</span><strong>Submit terms</strong></li>
            <li><span>04</span><strong>Confirm awarded PO</strong></li>
            <li><span>05</span><strong>Dispatch, invoice and resolve exceptions</strong></li>
          </ol>
          <p><TrendingUp aria-hidden="true" /> Each commercial response is recorded against the authorised buyer organisation and audited.</p>
        </aside>
      </section>
    </div>
  );
}

export const roleConfig = { role: "supplier", tenantScope: true };

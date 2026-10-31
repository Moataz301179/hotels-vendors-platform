// ADMIN DASHBOARD MODULE (G6 — role-specific, DB-connected)
// Real dashboard for platform administrators.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, ArrowRight, AlertTriangle, RefreshCw,
  Users, Settings, FileText, Clock, CheckCircle2, TrendingUp
} from "lucide-react";
import { requestJson } from "@/lib/v2-http";
import { RoleAuditWidget } from "@/components/v2/role-audit-widget";
import { LoadingPage } from "@/components/dashboards/shared/loading-card";

interface AdminData {
  pendingRegistrations: number;
  pendingCatalogReviews: number;
  pendingDirectoryCandidates: number;
  invoiceRows: number;
  paymentRows: number;
  reviewQueues: {
    pendingRegistrations: number;
    pendingCatalogReviews: number;
    pendingDirectoryCandidates: number;
  };
}

export function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    requestJson<AdminData>("/api/v2/admin/operations-summary")
      .then((d) => { if (active) setData(d); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load admin data."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingPage />;
  if (error || !data) return (
    <div className="workspace-status" role="alert">
      <AlertTriangle size={16} /> {error || "No data available"}
      <button className="btn btn-ghost" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  const fmt = (n: number) => n.toLocaleString("en-EG");

  return (
    <div className="role-dashboard" data-role="admin">
      <div className="role-dashboard-hero">
        <div>
          <span className="eyebrow">Network controls</span>
          <h1>Govern access, policy and evidence — not commercial buying.</h1>
          <p className="muted">Admin Control keeps identities, permission rules, source rights and audit events governed. Marketplace, orders, receiving and Vendor stock stay in their operational workspaces.</p>
        </div>
        <Link href="/admin" className="role-dashboard-primary">
          <ShieldCheck aria-hidden="true" />
          <span><small>Start here</small><strong>Open access &amp; governance</strong><em>Manage organization access, source governance and verification controls.</em></span>
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>

      <section className="role-dashboard-metrics" aria-label="Admin workspace status">
        <div className="card role-dashboard-metric">
          <span>Pending registrations</span>
          <strong>{fmt(data.pendingRegistrations)}</strong>
          <small>Awaiting verification</small>
        </div>
        <div className="card role-dashboard-metric">
          <span>Catalogue reviews</span>
          <strong>{fmt(data.pendingCatalogReviews)}</strong>
          <small>Products awaiting publication review</small>
        </div>
        <div className="card role-dashboard-metric">
          <span>Directory candidates</span>
          <strong>{fmt(data.pendingDirectoryCandidates)}</strong>
          <small>Source observations awaiting permission decision</small>
        </div>
        <div className="card role-dashboard-metric">
          <span>Invoice rows</span>
          <strong>{fmt(data.invoiceRows)}</strong>
          <small>Recorded invoice line items</small>
        </div>
      </section>

      <section className="role-dashboard-main">
        <div className="role-dashboard-actions">
          <div className="workspace-section-heading">
            <div><span className="eyebrow">Your next actions</span><h2>Choose one clear task.</h2></div>
          </div>
          <div className="role-dashboard-action-grid">
            <Link href="/admin" className="card role-dashboard-action">
              <Users aria-hidden="true" /><h3>Access &amp; governance</h3>
              <p>Manage organization access, source governance and verification controls.</p>
              <span>Open <ArrowRight aria-hidden="true" /></span>
            </Link>
            <Link href="/audit" className="card role-dashboard-action">
              <FileText aria-hidden="true" /><h3>Inspect audit trail</h3>
              <p>Review recorded security and lifecycle events.</p>
              <span>Open <ArrowRight aria-hidden="true" /></span>
            </Link>
            <Link href="/admin" className="card role-dashboard-action">
              <Settings aria-hidden="true" /><h3>Security &amp; access</h3>
              <p>Review the account and platform security surface.</p>
              <span>Open <ArrowRight aria-hidden="true" /></span>
            </Link>
            <Link href="/admin" className="card role-dashboard-action">
              <TrendingUp aria-hidden="true" /><h3>Operations overview</h3>
              <p>Review queues, pending work and platform health indicators.</p>
              <span>Open <ArrowRight aria-hidden="true" /></span>
            </Link>
          </div>
        </div>
        <aside className="card role-dashboard-journey" aria-label="How work moves">
          <span className="eyebrow">How work moves</span>
          <ol>
            <li><span>01</span><strong>Control access</strong></li>
            <li><span>02</span><strong>Set governance rules</strong></li>
            <li><span>03</span><strong>Review exceptions</strong></li>
            <li><span>04</span><strong>Inspect audit evidence</strong></li>
          </ol>
          <p><CheckCircle2 aria-hidden="true" /> Admin Control does not render marketplace intake, catalogue review, product candidate review, or requirement matching surfaces.</p>
        </aside>
      <RoleAuditWidget />
      </section>
    </div>
  );
}

export const roleConfig = { role: "admin", tenantScope: true };

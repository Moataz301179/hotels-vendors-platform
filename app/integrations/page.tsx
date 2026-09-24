"use client";

import { useState } from "react";
import { usePrefs } from "@/i18n/provider";
import { INTEGRATIONS } from "@/lib/stubs-export";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import { Btn, Card, PageHead, StatePill, Stat, T, Th, Td } from "@/lib/stubs-export";
import { WebhookLogo, SapLogo, OracleOperaLogo, MicrosoftDynamicsLogo, CoupaLogo, CsvPortalLogo } from "@/lib/stubs-export";
import type { Role } from "@/lib/types";

const HOTEL = ["hotel_admin", "platform_admin"] as Role[];

const LOGOS: Record<string, React.FC<{ className?: string }>> = {
  sap: SapLogo,
  oracle: OracleOperaLogo,
  dynamics: MicrosoftDynamicsLogo,
  coupa: CoupaLogo,
  webhook: WebhookLogo,
  csv: CsvPortalLogo,
};

const INTEGRATION_INFO: Record<string, { brand: string; tagline: string; features: string[] }> = {
  sap: {
    brand: "SAP",
    tagline: "Enterprise Resource Planning",
    features: ["Real-time budget checks", "3-way invoice matching", "Vendor price book sync", "Cost center & GL tagging"],
  },
  oracle: {
    brand: "Oracle OPERA",
    tagline: "Property Management System",
    features: ["Occupancy-based demand", "Minibar consumption tracking", "Auto purchase requisitions", "Receiving confirmations"],
  },
  dynamics: {
    brand: "Microsoft Dynamics 365",
    tagline: "ERP & CRM Platform",
    features: ["Purchase order sync", "Invoice automation", "Budget management", "Financial reporting"],
  },
  coupa: {
    brand: "Coupa",
    tagline: "Procurement & Spend Management",
    features: ["cXML/OCI Punchout", "Catalog integration", "PO automation", "Supplier management"],
  },
  webhook: {
    brand: "Webhooks",
    tagline: "Real-time Event Notifications",
    features: ["Order status updates", "Invoice events", "Financing triggers", "Inventory alerts"],
  },
  csv: {
    brand: "CSV / FTP Portal",
    tagline: "Legacy System Integration",
    features: ["Bulk inventory upload", "Order export", "Receiving CSV", "Invoice generation"],
  },
};

// ---- Sample data for demonstration ----
const SAMPLE_SYNC_JOBS = [
  { id: "SJ-001", provider: "Oracle OPERA", direction: "inbound", entity: "inventory", status: "completed", records: 42, time: "2026-09-19T10:00:00" },
  { id: "SJ-002", provider: "SAP", direction: "outbound", entity: "orders", status: "completed", records: 8, time: "2026-09-19T09:30:00" },
  { id: "SJ-003", provider: "Webhooks", direction: "outbound", entity: "invoices", status: "completed", records: 3, time: "2026-09-19T08:45:00" },
  { id: "SJ-004", provider: "CSV Portal", direction: "inbound", entity: "inventory", status: "failed", records: 0, time: "2026-09-18T16:20:00" },
];

const SAMPLE_WEBHOOKS = [
  { id: "WH-001", event: "order.shipped", url: "https://api.hotelsvendors.com/webhooks", status: "delivered", retries: 0, time: "2026-09-19T11:30:00" },
  { id: "WH-002", event: "invoice.paid", url: "https://hooks.slack.com/xxx", status: "delivered", retries: 0, time: "2026-09-19T10:15:00" },
  { id: "WH-003", event: "inventory.low", url: "https://hooks.slack.com/xxx", status: "delivered", retries: 0, time: "2026-09-19T09:00:00" },
];

const SAMPLE_MATCHES = [
  { id: "3WM-001", po: "PO-2026-005", receiving: "GRN-042", invoice: "INV-007", status: "matched", amount: 24500 },
  { id: "3WM-002", po: "PO-2026-006", receiving: "GRN-043", invoice: "INV-008", status: "pending", amount: 18200 },
  { id: "3WM-003", po: "PO-2026-007", receiving: "GRN-044", invoice: "INV-009", status: "discrepancy", amount: 5750 },
];

export default function IntegrationsPage() {
  const { t } = usePrefs();
  const [tab, setTab] = useState("all");
  const [activeSection, setActiveSection] = useState("providers");

  const filtered = INTEGRATIONS.filter((i) => tab === "all" || i.type === tab);
  const connected = INTEGRATIONS.filter((i) => i.status === "connected").length;
  const disconnected = INTEGRATIONS.filter((i) => i.status === "disconnected").length;
  const pending = INTEGRATIONS.filter((i) => i.status === "pending").length;

  return (
    <RequireAuth>
      <AppShell active="/integrations">
        <Guard roles={HOTEL}>
          <PageHead kicker={t("integrations.k")} title={t("integrations.t")} sub={t("integrations.sub")} />

          <div className="mb-6 grid gap-4 sm:grid-cols-4">
            <Stat label={t("integrations.stat.connected")} value={connected} tone="ok" />
            <Stat label={t("integrations.stat.disconnected")} value={disconnected} tone="bad" />
            <Stat label={t("integrations.stat.pending")} value={pending} tone="warn" />
            <Stat label={t("integrations.stat.total")} value={INTEGRATIONS.length} />
          </div>

          {/* Section Tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            {[
              { key: "providers", label: "Providers" },
              { key: "sync", label: "Sync Jobs" },
              { key: "webhooks", label: "Webhook Log" },
              { key: "budget", label: "Budget Check" },
              { key: "match", label: "3-Way Match" },
              { key: "csv", label: "CSV Portal" },
              { key: "opera", label: "Auto-PR" },
            ].map((s) => (
              <button key={s.key} onClick={() => setActiveSection(s.key)} className={`rounded px-3 py-1.5 text-[13px] font-medium ${activeSection === s.key ? "bg-ink-950 text-white dark:bg-white dark:text-ink-950" : "text-ink-500 hover:bg-fog-100 dark:text-ink-400 dark:hover:bg-ink-800"}`}>{s.label}</button>
            ))}
          </div>

          {/* ---- PROVIDERS SECTION ---- */}
          {activeSection === "providers" && (
            <>
              <div className="mb-6 flex gap-2">
                {["all", "erp", "punchout", "api", "eta"].map((f) => (
                  <button key={f} onClick={() => setTab(f)} className={`rounded px-3 py-1.5 text-[13px] font-medium ${tab === f ? "bg-ink-950 text-white dark:bg-white dark:text-ink-950" : "text-ink-500 hover:bg-fog-100 dark:text-ink-400 dark:hover:bg-ink-800"}`}>{t(`integrations.filter.${f}`)}</button>
                ))}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {filtered.map((i) => {
                  const info = INTEGRATION_INFO[i.type];
                  const LogoComp = i.brand ? LOGOS[i.brand] : LOGOS[i.type];
                  return (
                    <Card key={i.id} className="p-5">
                      <div className="flex items-start gap-4">
                        {LogoComp && (
                          <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-fog-100 dark:bg-ink-800">
                            <LogoComp className="h-8 w-auto" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{info?.brand || i.name}</h3>
                            <StatePill s={i.status === "connected" ? "approved" : i.status === "pending" ? "pending" : "rejected"} />
                          </div>
                          <p className="mt-0.5 text-xs text-ink-500">{info?.tagline}</p>
                          <p className="mt-1 text-xs text-ink-500">{i.description}</p>
                        </div>
                      </div>
                      {info?.features && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {info.features.map((f) => (
                            <div key={f} className="flex items-center gap-1.5 text-[12px] text-ink-600 dark:text-ink-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-brass-500" />
                              {f}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 dark:border-linedark">
                        <span className="text-[12px] text-ink-500">
                          {i.lastSync ? `Last sync: ${new Date(i.lastSync).toLocaleString()}` : "Never synced"}
                        </span>
                        <div className="flex gap-2">
                          <Btn variant="ghost" size="sm">Test</Btn>
                          <Btn variant="primary" size="sm">{t("integrations.configure")}</Btn>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {/* ---- SYNC JOBS SECTION ---- */}
          {activeSection === "sync" && (
            <Card className="overflow-hidden">
              <div className="border-b border-line bg-fog-50 px-5 py-3.5 dark:border-linedark dark:bg-ink-850">
                <h3 className="text-sm font-semibold">Sync Job Monitor</h3>
                <p className="mt-0.5 text-xs text-ink-500">Recent data synchronization jobs between HotelsVendors and external systems.</p>
              </div>
              <div className="overflow-x-auto">
                <T>
                  <thead>
                    <tr>
                      <Th>Job ID</Th>
                      <Th>Provider</Th>
                      <Th>Direction</Th>
                      <Th>Entity</Th>
                      <Th>Status</Th>
                      <Th>Records</Th>
                      <Th>Time</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_SYNC_JOBS.map((j) => (
                      <tr key={j.id} className="border-t border-line dark:border-linedark">
                        <Td className="font-mono text-xs">{j.id}</Td>
                        <Td>{j.provider}</Td>
                        <Td>
                          <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${j.direction === "inbound" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"}`}>
                            {j.direction}
                          </span>
                        </Td>
                        <Td className="capitalize">{j.entity}</Td>
                        <Td>
                          <StatePill s={j.status === "completed" ? "approved" : j.status === "failed" ? "rejected" : "pending"} />
                        </Td>
                        <Td className="tnum">{j.records}</Td>
                        <Td className="text-xs">{new Date(j.time).toLocaleString()}</Td>
                      </tr>
                    ))}
                  </tbody>
                </T>
              </div>
            </Card>
          )}

          {/* ---- WEBHOOK LOG SECTION ---- */}
          {activeSection === "webhooks" && (
            <Card className="overflow-hidden">
              <div className="border-b border-line bg-fog-50 px-5 py-3.5 dark:border-linedark dark:bg-ink-850">
                <h3 className="text-sm font-semibold">Webhook Event Log</h3>
                <p className="mt-0.5 text-xs text-ink-500">Real-time event notifications dispatched to registered endpoints.</p>
              </div>
              <div className="overflow-x-auto">
                <T>
                  <thead>
                    <tr>
                      <Th>Event</Th>
                      <Th>Target URL</Th>
                      <Th>Status</Th>
                      <Th>Retries</Th>
                      <Th>Delivered At</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_WEBHOOKS.map((w) => (
                      <tr key={w.id} className="border-t border-line dark:border-linedark">
                        <Td className="font-mono text-xs">{w.event}</Td>
                        <Td className="max-w-[200px] truncate text-xs">{w.url}</Td>
                        <Td>
                          <StatePill s={w.status === "delivered" ? "approved" : "rejected"} />
                        </Td>
                        <Td className="tnum">{w.retries}</Td>
                        <Td className="text-xs">{new Date(w.time).toLocaleString()}</Td>
                      </tr>
                    ))}
                  </tbody>
                </T>
              </div>
            </Card>
          )}

          {/* ---- BUDGET CHECK SECTION ---- */}
          {activeSection === "budget" && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold">Budget Verification (SAP)</h3>
              <p className="mt-0.5 text-xs text-ink-500">Real-time budget check before order submission.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <div className="text-xs text-ink-500">Total Budget</div>
                  <div className="mt-1 text-xl font-bold text-green-700 dark:text-green-400">EGP 500,000</div>
                </div>
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <div className="text-xs text-ink-500">Used (YTD)</div>
                  <div className="mt-1 text-xl font-bold text-blue-700 dark:text-blue-400">EGP 125,000</div>
                </div>
                <div className="rounded-lg bg-brass-50 p-4 dark:bg-brass-900/20">
                  <div className="text-xs text-ink-500">Available</div>
                  <div className="mt-1 text-xl font-bold text-brass-700 dark:text-brass-400">EGP 375,000</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <input placeholder="Enter amount to check..." className="h-10 w-48 rounded border border-line bg-transparent px-3 text-sm dark:border-linedark" />
                <Btn size="sm">Check Availability</Btn>
              </div>
            </Card>
          )}

          {/* ---- 3-WAY MATCH SECTION ---- */}
          {activeSection === "match" && (
            <Card className="overflow-hidden">
              <div className="border-b border-line bg-fog-50 px-5 py-3.5 dark:border-linedark dark:bg-ink-850">
                <h3 className="text-sm font-semibold">Three-Way Match Engine</h3>
                <p className="mt-0.5 text-xs text-ink-500">Compare PO, Receiving Slip, and Invoice for zero-dispute settlement.</p>
              </div>
              <div className="overflow-x-auto">
                <T>
                  <thead>
                    <tr>
                      <Th>Match ID</Th>
                      <Th>PO</Th>
                      <Th>GRN</Th>
                      <Th>Invoice</Th>
                      <Th>Status</Th>
                      <Th>Amount</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_MATCHES.map((m) => (
                      <tr key={m.id} className="border-t border-line dark:border-linedark">
                        <Td className="font-mono text-xs">{m.id}</Td>
                        <Td className="font-mono text-xs">{m.po}</Td>
                        <Td className="font-mono text-xs">{m.receiving}</Td>
                        <Td className="font-mono text-xs">{m.invoice}</Td>
                        <Td>
                          <StatePill s={m.status === "matched" ? "approved" : m.status === "pending" ? "pending" : "rejected"} />
                        </Td>
                        <Td className="tnum">{m.amount.toLocaleString()}</Td>
                      </tr>
                    ))}
                  </tbody>
                </T>
              </div>
            </Card>
          )}

          {/* ---- CSV PORTAL SECTION ---- */}
          {activeSection === "csv" && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold">CSV / FTP Portal</h3>
              <p className="mt-0.5 text-xs text-ink-500">Bulk data exchange for legacy hotel systems without REST APIs.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border-2 border-dashed border-line p-6 text-center dark:border-linedark">
                  <p className="text-sm font-medium">Upload CSV</p>
                  <p className="mt-1 text-xs text-ink-500">Drop inventory or orders CSV file here</p>
                  <Btn variant="outline" size="sm" className="mt-3">Choose File</Btn>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Download Templates</h4>
                  <div className="flex flex-wrap gap-2">
                    <Btn variant="ghost" size="sm">Inventory CSV</Btn>
                    <Btn variant="ghost" size="sm">Orders CSV</Btn>
                    <Btn variant="ghost" size="sm">Receiving CSV</Btn>
                    <Btn variant="ghost" size="sm">Invoices CSV</Btn>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* ---- AUTO-PR FROM OPERA SECTION ---- */}
          {activeSection === "opera" && (
            <Card className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20">
                  <OracleOperaLogo className="h-8 w-auto" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Auto Purchase Requisitions from OPERA</h3>
                  <p className="mt-1 text-xs text-ink-500">Pull minibar consumption, occupancy, and department demand to automatically create purchase requisitions when stock drops below reorder points.</p>
                  <div className="mt-3 flex gap-2">
                    <Btn variant="primary" size="sm">Sync from OPERA Now</Btn>
                    <Btn variant="ghost" size="sm">Configure Rules</Btn>
                  </div>
                </div>
              </div>
            </Card>
          )}

        </Guard>
      </AppShell>
    </RequireAuth>
  );
}

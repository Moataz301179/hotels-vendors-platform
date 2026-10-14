import { requireActorRole } from "@/lib/v2-auth";
import { prisma } from "@/lib/prisma";
import { classifyEtaCompliance, etaComplianceLabel, type EtaComplianceStatus } from "@/lib/logistics/eta-compliance";

const tone: Record<EtaComplianceStatus, string> = {
  MISSING: "#8b5a17",
  OVERDUE: "#a34242",
  DUE_SOON: "#9a6a18",
  ON_TRACK: "#236d56",
  CLOSED: "#66737b",
};

export default async function EtaCompliancePage() {
  const actor = await requireActorRole(["HOTEL", "SUPPLIER", "ADMIN"]);
  const where = actor.platformRole === "SUPPLIER"
    ? { supplierId: actor.supplierId || "__unassigned__", deletedAt: null }
    : { tenantId: actor.tenantId, deletedAt: null };
  const orders = await prisma.order.findMany({
    where,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      estimatedDelivery: true,
      deliveryDate: true,
      supplier: { select: { name: true } },
      hotel: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  const now = new Date();
  const rows = orders.map(order => ({ ...order, compliance: classifyEtaCompliance(order, now) }));
  const attention = rows.filter(row => ["MISSING", "OVERDUE", "DUE_SOON"].includes(row.compliance));

  return <>
    <div className="eyebrow">Delivery control</div>
    <h1>ETA compliance</h1>
    <p className="muted" style={{ maxWidth: 760 }}>Review recorded delivery commitments. An ETA is shown only when it was recorded on the order; missing information is never inferred.</p>
    <div className="grid4" style={{ marginTop: 28 }}>
      {([
        ["Orders monitored", rows.length, "#315d8a"],
        ["Needs attention", attention.length, attention.length ? "#a34242" : "#236d56"],
        ["Missing ETA", rows.filter(row => row.compliance === "MISSING").length, "#8b5a17"],
        ["Past ETA", rows.filter(row => row.compliance === "OVERDUE").length, "#a34242"],
      ] as const).map(([label, value, color]) => <section className="card" style={{ padding: 22 }} key={label}><div className="eyebrow">{label}</div><div className="metric" style={{ marginTop: 12, color }}>{value}</div></section>)}
    </div>
    <section className="card workspace-table-wrap" style={{ padding: 24, marginTop: 24 }}>
      <h2>Recorded delivery commitments</h2>
      <p className="muted">Statuses are calculated from the stored order state and committed ETA at {now.toLocaleString()}.</p>
      {rows.length ? <table className="table"><thead><tr><th>Order</th><th>{actor.platformRole === "SUPPLIER" ? "Hotel" : "Supplier"}</th><th>Order state</th><th>Committed ETA</th><th>Compliance</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{row.orderNumber}</td><td>{actor.platformRole === "SUPPLIER" ? row.hotel.name : row.supplier.name}</td><td>{row.status.replaceAll("_", " ")}</td><td>{row.estimatedDelivery ? row.estimatedDelivery.toLocaleString() : "Not recorded"}</td><td><span style={{ color: tone[row.compliance], fontWeight: 700 }}>{etaComplianceLabel[row.compliance]}</span></td></tr>)}</tbody></table> : <p className="workspace-empty">No orders are available for your organization yet.</p>}
    </section>
  </>;
}

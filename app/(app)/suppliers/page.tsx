import { prisma } from '@/lib/prisma';
import { requireActor } from '@/lib/v2-auth';

type SupplierRow = { id: string; name: string; status: string; isVerified: boolean; city: string };

export default async function Suppliers() {
  const user = await requireActor();
  let rows: SupplierRow[] = [];
  let loadError = false;
  try {
    rows = await prisma.supplier.findMany({
      where: { tenantId: user.tenantId, deletedAt: null },
      select: { id: true, name: true, status: true, isVerified: true, city: true },
      take: 100,
      orderBy: { name: 'asc' },
    });
  } catch {
    loadError = true;
  }

  return <>
    <div className="eyebrow">Network</div>
    <h1 style={{ fontSize: 42, letterSpacing: '-.05em', margin: '8px 0' }}>Suppliers</h1>
    <p className="muted">Authorized supplier records for your tenant.</p>
    <div className="card" style={{ marginTop: 28, overflow: 'auto' }}>
      {loadError ? <div style={{ padding: 32 }} role="alert">Unable to load supplier records. The system has not treated this failure as an empty supplier list.</div> : !rows.length ? <div style={{ padding: 48, textAlign: 'center' }}><div className="eyebrow">No suppliers</div><h2 style={{ margin: '12px 0' }}>No supplier records are connected yet.</h2></div> : <table className="table"><thead><tr><th>Supplier</th><th>Status</th><th>Verified</th><th>City</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.name}</strong></td><td>{row.status}</td><td>{row.isVerified ? 'Yes' : 'No'}</td><td>{row.city}</td></tr>)}</tbody></table>}
    </div>
  </>;
}

"use client";

import { usePrefs } from "@/i18n/provider";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import { Card, PageHead, Stat, EmptyState, StatePill, T, Th, Td, Btn } from "@/components/ui";
import { useApi } from "@/lib/hooks/use-api";
import { AdminControlToolkit } from "@/components/dashboards/admin/control-toolkit";

interface DashboardStats {
  scope: "platform"; generatedAt: string;
  orders: { total: number }; suppliers: { total: number }; products: { total: number };
  tenants: { total: number }; users: { total: number };
}
interface AdminOrder {
  id: string; orderNumber: string; status: string; paymentGuaranteed: boolean;
  total: number | string | null; hotelName: string; supplierName: string;
}
export default function AdminPage() {
  const { t } = usePrefs();
  const stats = useApi<DashboardStats>("/api/v1/admin/dashboard");
  const orders = useApi<{ orders: AdminOrder[] }>("/api/v1/admin/orders?limit=20");
  const failure = stats.error || orders.error;
  return <RequireAuth><AppShell active="/admin"><Guard roles={["platform_admin"]}>
    <PageHead kicker={t("admin.k")} title={t("admin.t")} sub={t("admin.sub")} />
    {failure ? <Card className="p-5"><p role="alert">{failure}</p><Btn onClick={() => { stats.refetch(); orders.refetch(); }}>Retry</Btn></Card> : null}
    {stats.loading || orders.loading ? <p role="status">Loading platform overview…</p> : null}
    {stats.data ? <div className="grid grid-air sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Active tenants" value={stats.data.tenants.total} />
      <Stat label="Platform users" value={stats.data.users.total} />
      <Stat label="Platform orders" value={stats.data.orders.total} />
      <Stat label="Platform products" value={stats.data.products.total} />
    </div> : null}
    {stats.data ? <p className="mt-2 text-sm">Platform-wide totals, excluding deleted records. Updated {new Date(stats.data.generatedAt).toLocaleString()}.</p> : null}
    <AdminControlToolkit />
    <Card className="mt-6 overflow-hidden"><h2 className="p-5 font-semibold">Recent orders returned by the admin API</h2>
      {orders.data?.orders.length ? <T><thead><tr><Th>Order</Th><Th>Hotel</Th><Th>Supplier</Th><Th>Status</Th><Th>Total</Th><Th>Payment guarantee</Th></tr></thead>
        <tbody>{orders.data.orders.map(order => <tr key={order.id}><Td>{order.orderNumber}</Td><Td>{order.hotelName}</Td><Td>{order.supplierName}</Td><Td><StatePill s={order.status.toLowerCase()} /></Td><Td>{order.total == null ? "—" : Number(order.total).toLocaleString()}</Td><Td>{order.paymentGuaranteed ? "Recorded" : "Not recorded"}</Td></tr>)}</tbody></T>
        : !orders.loading && !orders.error ? <EmptyState title="No orders returned" /> : null}
    </Card>
  </Guard></AppShell></RequireAuth>;
}

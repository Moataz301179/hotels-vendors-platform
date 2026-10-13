import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ShoppingCart, Package, Building2, Truck, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId)?.emailAddress
    || clerkUser?.emailAddresses[0]?.emailAddress;
  if (!email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, tenantId: true, platformRole: true, tenant: { select: { name: true } } },
  });
  if (!user) redirect("/onboarding");

  // Every metric is scoped to the authenticated user's tenant; no sample values or cross-tenant totals.
  const [orders, pendingOrders, deliveredOrders, suppliers, products] = await Promise.all([
    prisma.order.count({ where: { tenantId: user.tenantId, deletedAt: null } }),
    prisma.order.count({ where: { tenantId: user.tenantId, deletedAt: null, status: { in: ["PENDING_APPROVAL", "CONFIRMED"] } } }),
    prisma.order.count({ where: { tenantId: user.tenantId, deletedAt: null, status: "DELIVERED" } }),
    prisma.supplier.count({ where: { tenantId: user.tenantId, deletedAt: null } }),
    prisma.product.count({ where: { tenantId: user.tenantId, deletedAt: null } }),
  ]);

  const roleLabels: Record<string, string> = {
    HOTEL: "Hotel procurement workspace",
    SUPPLIER: "Supplier workspace",
    FACTORING: "Funder workspace",
    SHIPPING: "Carrier workspace",
    ADMIN: "Platform administration",
  };
  const stats = [
    { label: "Orders", value: orders, icon: ShoppingCart },
    { label: "Awaiting action", value: pendingOrders, icon: Package },
    { label: "Delivered", value: deliveredOrders, icon: Truck },
    { label: "Suppliers in your network", value: suppliers, icon: Building2 },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl space-y-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">{roleLabels[user.platformRole] || "HotelsVendors workspace"}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{user.tenant.name}</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Your procurement network, live activity and verified opportunities.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</span>
              <Icon size={17} style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="mt-5 text-3xl font-semibold tracking-tight tabular-nums">{value.toLocaleString()}</p>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
          <TrendingUp size={20} style={{ color: "var(--signal)" }} />
          <h2 className="mt-4 text-lg font-semibold">Find measurable savings</h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>Review supplier value deals and quote opportunities. Reference prices and savings are shown only when supported by actual listing data.</p>
          <Link href="/marketplace" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">Explore opportunities <ArrowRight size={15} /></Link>
        </article>
        <article className="rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
          <Package size={20} style={{ color: "var(--text-muted)" }} />
          <h2 className="mt-4 text-lg font-semibold">Your live catalog</h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{products.toLocaleString()} product listing{products === 1 ? "" : "s"} currently associated with your workspace. Counts are read from the database and scoped to your tenant.</p>
          <Link href={user.platformRole === "SUPPLIER" ? "/supplier/products" : "/hotel/catalog"} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">Open catalog <ArrowRight size={15} /></Link>
        </article>
      </div>
    </section>
  );
}

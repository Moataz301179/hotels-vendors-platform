"use client";

import Link from "next/link";
import {
  Users, Building2, Scale, History, AlertCircle, Truck, ShoppingCart,
} from "lucide-react";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";

export default function AdminPage() {
  const links = [
    { href: "/admin/tenants", label: "Tenants", Icon: Building2 },
    { href: "/admin/users", label: "Users", Icon: Users },
    { href: "/admin/rules", label: "Authority Rules", Icon: Scale },
    { href: "/admin/audit", label: "Audit Log", Icon: History },
  ];

  return (
    <RequireAuth>
      <AppShell active="/admin">
        <Guard roles={["platform_admin"]}>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Admin Dashboard</h1>
              <p className="text-sm text-foreground-muted">
                Platform governance, auditing, and network oversight
              </p>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-3 p-4 bg-surface-1 border border-border-subtle rounded-xl hover:border-visible transition-colors group"
                >
                  <l.Icon size={20} className="text-foreground-muted group-hover:text-accent transition-colors" />
                  <span className="text-white font-medium text-sm">{l.label}</span>
                </Link>
              ))}
            </div>

            {/* Empty state */}
            <div className="text-center py-16 bg-surface-1 border border-border-subtle rounded-xl">
              <AlertCircle size={32} className="mx-auto text-foreground-muted mb-3" />
              <h3 className="text-lg font-medium text-white mb-1">No Network Activity Yet</h3>
              <p className="text-foreground-muted text-sm max-w-md mx-auto mb-4">
                Admin metrics will appear here when hotels, suppliers, and transactions
                begin flowing through the network. All activity is fully auditable.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mt-6">
                <div className="bg-ink-950 border border-white/5 rounded-lg p-3">
                  <ShoppingCart size={16} className="mx-auto text-foreground-muted mb-1" />
                  <div className="text-2xl font-semibold text-white">0</div>
                  <div className="text-xs text-foreground-muted">Orders</div>
                </div>
                <div className="bg-ink-950 border border-white/5 rounded-lg p-3">
                  <Truck size={16} className="mx-auto text-foreground-muted mb-1" />
                  <div className="text-2xl font-semibold text-white">0</div>
                  <div className="text-xs text-foreground-muted">Deliveries</div>
                </div>
                <div className="bg-ink-950 border border-white/5 rounded-lg p-3">
                  <Building2 size={16} className="mx-auto text-foreground-muted mb-1" />
                  <div className="text-2xl font-semibold text-white">0</div>
                  <div className="text-xs text-foreground-muted">Tenants</div>
                </div>
                <div className="bg-ink-950 border border-white/5 rounded-lg p-3">
                  <Users size={16} className="mx-auto text-foreground-muted mb-1" />
                  <div className="text-2xl font-semibold text-white">0</div>
                  <div className="text-xs text-foreground-muted">Users</div>
                </div>
              </div>
            </div>
          </div>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}

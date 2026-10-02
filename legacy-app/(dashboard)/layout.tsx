import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/lib/auth/server-auth";

export const metadata: Metadata = {
  title: { default: "HotelsVendors Workspace", template: "%s — HotelsVendors" },
  description: "Role-specific procurement workspace for HotelsVendors.",
};

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const roleMap: Record<string, "admin" | "hotel" | "supplier" | "factoring" | "shipping" | "marketing"> = {
    ADMIN: "admin", HOTEL: "hotel", SUPPLIER: "supplier", FACTORING: "factoring", SHIPPING: "shipping", MARKETING: "marketing",
  };
  const role = roleMap[user.platformRole] || "hotel";
  return <DashboardShell role={role} user={{ id: user.id, name: user.name, email: user.email, role: user.role, platformRole: user.platformRole, tenantName: undefined, createdAt: "" }}>{children}</DashboardShell>;
}

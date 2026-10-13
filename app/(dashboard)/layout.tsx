import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/lib/auth/server-auth";

export const metadata: Metadata = {
  title: { default: "Dashboard — Hotels Vendors", template: "%s — Hotels Vendors" },
  description: "Role-specific command center for the Egyptian hospitality procurement hub.",
};
const shellRoles = { ADMIN: "admin", HOTEL: "hotel", SUPPLIER: "supplier", FACTORING: "factoring", SHIPPING: "shipping", MARKETING: "marketing" } as const;

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(user.platformRole in shellRoles)) redirect("/login");
  const role = shellRoles[user.platformRole as keyof typeof shellRoles];
  return <DashboardShell role={role} user={user}>{children}</DashboardShell>;
}

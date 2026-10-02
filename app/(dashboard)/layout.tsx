import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "hv_session";

export const metadata: Metadata = {
  title: {
    default: "Dashboard — Hotels Vendors",
    template: "%s — Hotels Vendors",
  },
  description:
    "Role-specific command center for the Egyptian hospitality procurement hub.",
};

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const authResult = await auth();
  const userId = authResult.userId || null;
  const clerkUser = userId ? await currentUser() : null;
  const email = clerkUser?.emailAddresses[0]?.emailAddress || null;
  if (!userId || !email) redirect("/login");
  const dbUser = email ? await prisma.user.findUnique({ where: { email }, select: { platformRole: true, role: true } }) : null;
  const role = dbUser?.platformRole || "HOTEL";

  let userData = null;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: { select: { name: true } } },
    });
    if (user) {
      userData = { id: user.id, name: user.name, email: user.email, role: user.role, platformRole: user.platformRole, tenantName: user.tenant?.name, createdAt: user.createdAt.toISOString() };
    }
  } catch {
    // DB unavailable: keep Clerk identity active and render the workspace shell.
  }

  const validRole = role as "admin" | "hotel" | "supplier" | "factoring" | "shipping" | "marketing";

  return (
    <DashboardShell
      role={validRole}
      user={userData || null}
    >
      {children}
    </DashboardShell>
  );
}


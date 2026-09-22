import type { Metadata } from "next";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { prisma } from "@/lib/prisma";
import { getJwtSecret } from "@/lib/session";

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
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    redirect("/login");
  }

  let role: string | null = null;
  let userId: string | null = null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), { clockTolerance: 60 });
    role = (payload.platformRole as string)?.toLowerCase() || null;
    userId = payload.userId as string || null;
  } catch {
    redirect("/login");
  }

  if (!role) {
    redirect("/login");
  }

  let userData = null;
  if (userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { tenant: { select: { name: true } } },
      });
      if (user) {
        userData = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          platformRole: user.platformRole,
          tenantName: user.tenant?.name,
          createdAt: user.createdAt.toISOString(),
        };
      }
    } catch {
      // Silently fail
    }
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

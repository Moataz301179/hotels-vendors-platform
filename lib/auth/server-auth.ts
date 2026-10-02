/**
 * Canonical server-side identity helper.
 * Clerk is the identity authority; HotelsVendors maps the verified Clerk email to
 * its tenant/user record for business authorization and data scope.
 */
import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export interface ServerUser {
  id: string; email: string; name: string; role: string; platformRole: string;
  tenantId: string; hotelId: string | null; supplierId: string | null;
  factoringCompanyId: string | null; canOverride: boolean;
}

export const getCurrentUser = cache(async (): Promise<ServerUser | null> => {
  const { userId } = await auth();
  if (!userId) return null;
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress;
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email }, select: {
    id: true, email: true, name: true, role: true, platformRole: true,
    tenantId: true, hotelId: true, supplierId: true, factoringCompanyId: true, canOverride: true,
  }});
  return user as ServerUser | null;
});

export async function requireAuth(): Promise<ServerUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function hasRole(role: string): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.platformRole === role || user?.platformRole === "ADMIN";
}

export function getDashboardPath(platformRole: string): string {
  const paths: Record<string, string> = { HOTEL: "/hotel", SUPPLIER: "/supplier", FACTORING: "/factoring", SHIPPING: "/shipping", ADMIN: "/admin", MARKETING: "/marketing" };
  return paths[platformRole] || "/hotel";
}

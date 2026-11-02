/**
 * Canonical server-side identity for HotelsVendors.
 * Clerk is the authentication authority. The local User/Tenant records are
 * the authorization/business identity layer.
 */
import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export interface ServerUser {
  id: string;
  email: string;
  name: string;
  role: string;
  platformRole: string;
  tenantId: string;
  hotelId: string | null;
  supplierId: string | null;
  factoringCompanyId: string | null;
  canOverride: boolean;
}

export const getCurrentUser = cache(async (): Promise<ServerUser | null> => {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  const primaryEmail = clerkUser?.emailAddresses.find(
    (address) => address.id === clerkUser.primaryEmailAddressId,
  );
  const email = primaryEmail?.emailAddress;
  if (!email) return null;
  if (primaryEmail.verification?.status !== "verified") return null;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true, email: true, name: true, role: true, platformRole: true,
      tenantId: true, hotelId: true, supplierId: true, factoringCompanyId: true, canOverride: true,
      clerkUserId: true, status: true, deletedAt: true,
    },
  });
  if (!user || user.deletedAt || user.status !== "ACTIVE") return null;
  // A legacy row may be unbound, but once bound it must belong to this Clerk subject.
  if (user.clerkUserId && user.clerkUserId !== userId) return null;
  return user as ServerUser;
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
  const paths: Record<string, string> = {
    HOTEL: "/hotel",
    SUPPLIER: "/supplier",
    FACTORING: "/factoring",
    SHIPPING: "/carrier",
    ADMIN: "/admin",
    MARKETING: "/marketing",
  };
  return paths[platformRole] || "/hotel";
}

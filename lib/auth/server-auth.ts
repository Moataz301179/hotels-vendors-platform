/**
 * Canonical server-side identity helper.
 * Clerk is the identity authority; HotelsVendors maps the verified Clerk email to
 * its tenant/user record for business authorization and data scope.
 */
import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { findActiveAccount, type ServerUser } from "./account-identity";
import { requirePermission } from "./rbac";
export type { ServerUser } from "./account-identity";

export const getCurrentUser = cache(async (): Promise<ServerUser | null> => {
  const { userId } = await auth();
  if (!userId) return null;
  const clerkUser = await currentUser();
  if (!clerkUser || clerkUser.id !== userId) return null;
  const primary = clerkUser.emailAddresses.find(address => address.id === clerkUser.primaryEmailAddressId);
  if (!primary || primary.verification?.status !== "verified") return null;
  return findActiveAccount({ email: primary.emailAddress });
});

export async function requireServerPermission(permissionCode: string): Promise<ServerUser> {
  const user = await requireAuth();
  await requirePermission({ userId: user.id, tenantId: user.tenantId, platformRole: user.platformRole }, permissionCode);
  return user;
}

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

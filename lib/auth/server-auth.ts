/**
 * Server-Side Authentication Helpers
 *
 * G2: RBAC IS SERVER-SIDE ONLY
 * These helpers run exclusively on the server (Server Components, Server Actions, API Routes).
 * The client NEVER decides what it can access.
 */

import { cookies } from "next/headers";
import { cache } from "react";
import { verifySession } from "@/lib/session";
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

/**
 * Get the current authenticated user from the session cookie.
 * Cached per request to avoid multiple DB queries.
 * Returns null if not authenticated.
 */
export const getCurrentUser = cache(async (): Promise<ServerUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("hv_session")?.value;
  if (!token) return null;

  const session = await verifySession(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      platformRole: true,
      tenantId: true,
      hotelId: true,
      supplierId: true,
      factoringCompanyId: true,
      canOverride: true,
    },
  });

  if (!user) return null;

  return user as ServerUser;
});

/**
 * Require authentication. Throws if not authenticated.
 * Use in Server Components that require login.
 */
export async function requireAuth(): Promise<ServerUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Check if user has a specific platform role.
 */
export async function hasRole(role: string): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.platformRole === role || user?.platformRole === "ADMIN";
}

/**
 * Get role-specific dashboard path.
 */
export function getDashboardPath(platformRole: string): string {
  const paths: Record<string, string> = {
    HOTEL: "/hotel",
    SUPPLIER: "/supplier",
    FACTORING: "/factoring",
    SHIPPING: "/shipping",
    ADMIN: "/admin",
    MARKETING: "/marketing",
  };
  return paths[platformRole] || "/hotel";
}

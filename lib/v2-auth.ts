import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { PlatformRole, User } from "@prisma/client";
import { redirect } from "next/navigation";

export async function getActor(): Promise<User | null> {
  return getActorInternal(false);
}

/**
 * Onboarding-only actor resolution.
 *
 * Used exclusively by the Clerk completion handoff (/auth/continue) and the
 * onboarding endpoint (/api/v2/onboarding). It returns a user who is still
 * PENDING_VERIFICATION so the handoff can route them to onboarding instead of
 * looping back to login. It is NOT a general bypass: it is never called from
 * protected operational APIs or dashboards, and a user resolved this way is
 * still blocked from every permissioned action by the route-level gates.
 */
export async function getOnboardingActor(): Promise<User | null> {
  return getActorInternal(true);
}

async function getActorInternal(allowPending: boolean): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const cu = await currentUser();
  if (!cu) return null;
  const primaryEmail = cu.emailAddresses.find(address => address.id === cu.primaryEmailAddressId);
  if (!primaryEmail) return null;
  // Bind database authorization to the Clerk-assigned primary identity.
  // Active users require a verified primary email. A user still completing
  // onboarding is let through ONLY when allowPending is set, and only by the
  // two onboarding endpoints — never by protected operational APIs.
  const email = primaryEmail.emailAddress.toLowerCase();
  const isVerified = primaryEmail.verification?.status === "verified";
  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    // Trusted identity binding: a row carrying a Clerk subject must belong to
    // this Clerk session. Without this, an unverified email could claim
    // another person's existing pending record by email alone. Legacy rows
    // created before Clerk binding (no clerkUserId) still match by email.
    if (user.clerkUserId && user.clerkUserId !== userId) return null;
    // Legacy unbound rows (pre-Clerk, no clerkUserId): an unverified email
    // must never claim another person's existing pending or active account.
    // Verified ownership is required before any legacy row is returned.
    if (!user.clerkUserId && !isVerified) return null;
    if (user.deletedAt) return null;
    if (user.status === "PENDING_VERIFICATION") return allowPending ? user : null;
    if (user.status !== "ACTIVE") return null;
    if (!isVerified) return null;
    return user;
  }

  // Signup role is onboarding intent only. After provisioning, DB platformRole is authoritative.
  // ADMIN can never be self-provisioned from Clerk metadata.
  const requestedRole = String(cu.unsafeMetadata?.platformRole || "HOTEL").toUpperCase();
  // Public Clerk metadata is user-editable. Only hotel and supplier are public signup roles;
  // carriers and funders must be provisioned through controlled partner onboarding.
  const platformRole: PlatformRole = ["HOTEL", "SUPPLIER"].includes(requestedRole)
    ? requestedRole as PlatformRole : "HOTEL";
  const slug = `hv-${userId.slice(-12).toLowerCase()}`;
  user = await prisma.$transaction(async tx => {
    const tenant = await tx.tenant.upsert({
      where: { slug }, update: {},
      create: { name: cu.firstName ? `${cu.firstName}'s Workspace` : "HotelsVendors Workspace", slug, type: platformRole === "SUPPLIER" ? "SUPPLIER" : "HOTEL_GROUP" },
    });
    const roleName = `${platformRole}_USER`;
    const role = await tx.role.upsert({where:{tenantId_name:{tenantId:tenant.id,name:roleName}},update:{},create:{name:roleName,tenantId:tenant.id}});
    const permissionCodes = platformRole === "SUPPLIER" ? ["order:read", "quote:submit"] : ["order:read", "order:create"];
    for (const code of permissionCodes) {
      const permission = await tx.permission.upsert({
        where: { code },
        update: {},
        create: {
          code,
          name: code === "order:read" ? "View Orders" : code === "quote:submit" ? "Submit Supplier Quotes" : "Create Purchase Orders",
          description: code === "order:read" ? "View assigned procurement requests, quotes, and orders" : code === "quote:submit" ? "Submit a fixed response to an explicitly granted RFQ" : "Create procurement orders from approved commercial terms",
        },
      });
      await tx.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
    return tx.user.upsert({where:{email},update:{clerkUserId: userId},create:{email,name:[cu.firstName,cu.lastName].filter(Boolean).join(" ")||email,clerkUserId: userId,platformRole,tenantId:tenant.id,roleId:role.id,status:"PENDING_VERIFICATION"}});
  });
  return user;
}

export async function requireActor() {
  const user = await getActor();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

/** Server-side page gate. Sidebar visibility is not authorization. */
export async function requireActorRole(allowedRoles: PlatformRole[]) {
  const user = await getActor();
  if (!user) redirect("/login");
  if (!allowedRoles.includes(user.platformRole)) redirect("/dashboard?access=denied");
  return user;
}

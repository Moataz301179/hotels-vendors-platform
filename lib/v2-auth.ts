import { createHash } from "node:crypto";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { PlatformRole, User } from "@prisma/client";
import { redirect } from "next/navigation";
import { founderOperatingRole, founderPermissionCodes } from "@/lib/onboarding/founder-access";
import { ensureRolePermissions } from "@/lib/onboarding/release-organization";

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
    // A verified email can recover only a public Hotel or Vendor legacy row.
    // Admin and partner roles require an explicit Clerk subject binding; a
    // new test identity must never inherit elevated access from an old email.
    if (!user.clerkUserId) {
      if (!isVerified || !["HOTEL", "SUPPLIER"].includes(user.platformRole)) return null;
      const signupIntent = String(cu.unsafeMetadata?.platformRole || "").toUpperCase();
      if (signupIntent && signupIntent !== user.platformRole) return null;

      // Legacy public identities are bound at their first verified Clerk
      // session. The conditional write is deliberate: concurrent sessions
      // cannot replace a subject that has already claimed this account.
      const bound = await prisma.user.updateMany({
        where: { id: user.id, clerkUserId: null },
        data: { clerkUserId: userId },
      });
      if (bound.count !== 1) return null;
      user = { ...user, clerkUserId: userId };
    }
    if (user.deletedAt) return null;
    if (user.status === "PENDING_VERIFICATION") return allowPending ? user : null;
    if (user.status !== "ACTIVE") return null;
    if (!isVerified) return null;
    return user;
  }

  // Operational identity resolution must never create or return a pending account.
  if (!allowPending) return null;

  // Signup role is onboarding intent only. After provisioning, DB platformRole is authoritative.
  // ADMIN can never be self-provisioned from Clerk metadata.
  const requestedRole = String(cu.unsafeMetadata?.platformRole || "").toUpperCase();
  // Public Clerk metadata is user-editable. Only hotel and supplier are public signup roles;
  // carriers and funders must be provisioned through controlled partner onboarding.
  if (!["HOTEL", "SUPPLIER"].includes(requestedRole)) return null;
  const platformRole = requestedRole as PlatformRole;
  const slug = `hv-${createHash("sha256").update(userId).digest("hex")}`;
  user = await prisma.$transaction(async tx => {
    const tenant = await tx.tenant.upsert({
      where: { slug }, update: {},
      create: { name: cu.firstName ? `${cu.firstName}'s Workspace` : "HotelsVendors Workspace", slug, type: platformRole === "SUPPLIER" ? "SUPPLIER" : "HOTEL_GROUP" },
    });
    const roleName = `${platformRole}_USER`;
    const role = await tx.role.upsert({where:{tenantId_name:{tenantId:tenant.id,name:roleName}},update:{},create:{name:roleName,tenantId:tenant.id}});
    // A supplier must be able to read assigned RFQs, submit quotes, and then
    // advance only its own approved orders through confirmation and dispatch.
    // The lifecycle route still enforces supplier binding, payment guarantee,
    // and the allowed state transition; these permissions do not grant access
    // to another tenant's records.
    await ensureRolePermissions(tx, role.id, founderPermissionCodes(platformRole));
    return tx.user.upsert({where:{email},update:{},create:{email,name:[cu.firstName,cu.lastName].filter(Boolean).join(" ")||email,clerkUserId: userId,platformRole,tenantId:tenant.id,roleId:role.id,role:founderOperatingRole(platformRole),status:"PENDING_VERIFICATION"}});
  });
  // Another request may have inserted this email after the initial lookup.
  // Never rebind that identity, and apply the same checks to the upsert result.
  if (user.clerkUserId !== userId || user.deletedAt) return null;
  if (user.status === "PENDING_VERIFICATION") return user;
  if (user.status !== "ACTIVE" || !isVerified) return null;
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

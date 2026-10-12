import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";

export async function getActor(options: { allowPending?: boolean } = {}) {
  const { userId } = await auth();
  if (!userId) return null;
  const cu = await currentUser();
  if (!cu) return null;
  const primaryEmail = cu.emailAddresses.find(address => address.id === cu.primaryEmailAddressId);
  // Bind database authorization only to the verified primary identity.
  const email = primaryEmail?.verification?.status === "verified" ? primaryEmail.emailAddress.toLowerCase() : undefined;
  if (!email) return null;
  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    if (user.deletedAt || (user.status !== "ACTIVE" && !(options.allowPending && user.status === "PENDING_VERIFICATION"))) return null;
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
    return tx.user.upsert({where:{email},update:{},create:{email,name:[cu.firstName,cu.lastName].filter(Boolean).join(" ")||email,platformRole,tenantId:tenant.id,roleId:role.id,status:"PENDING_VERIFICATION"}});
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

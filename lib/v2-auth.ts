import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";

export async function getActor() {
  const { userId } = await auth();
  if (!userId) return null;
  const cu = await currentUser();
  if (!cu) return null;
  const email = cu.emailAddresses[0]?.emailAddress?.toLowerCase();
  if (!email) return null;
  let user = await prisma.user.findUnique({ where: { email } });
  if (user) return user.status === "ACTIVE" && !user.deletedAt ? user : null;

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
    return tx.user.upsert({where:{email},update:{},create:{email,name:[cu.firstName,cu.lastName].filter(Boolean).join(" ")||email,platformRole,tenantId:tenant.id,roleId:role.id,status:"ACTIVE"}});
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

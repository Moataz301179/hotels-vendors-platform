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
  if (user) return user;

  // Signup role is onboarding intent only. After provisioning, DB platformRole is authoritative.
  // ADMIN can never be self-provisioned from Clerk metadata.
  const requestedRole = String(cu.unsafeMetadata?.platformRole || "HOTEL").toUpperCase();
  const platformRole: PlatformRole = ["HOTEL","SUPPLIER","FACTORING","SHIPPING"].includes(requestedRole)
    ? requestedRole as PlatformRole : "HOTEL";
  const slug = `hv-${userId.slice(-12).toLowerCase()}`;
  const tenant = await prisma.tenant.create({
    data: { name: cu.firstName ? `${cu.firstName}'s Workspace` : "HotelsVendors Workspace", slug, type: platformRole === "SUPPLIER" ? "SUPPLIER" : platformRole === "FACTORING" ? "FACTORING_COMPANY" : platformRole === "SHIPPING" ? "SHIPPING_PROVIDER" : "HOTEL_GROUP" },
  });
  const role = await prisma.role.create({ data: { name: `${platformRole}_USER`, tenantId: tenant.id } });
  user = await prisma.user.create({
    data: { email, name: [cu.firstName, cu.lastName].filter(Boolean).join(" ") || email, platformRole, tenantId: tenant.id, roleId: role.id, status: "ACTIVE" },
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

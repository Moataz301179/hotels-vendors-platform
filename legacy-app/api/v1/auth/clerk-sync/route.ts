import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, success, error, audit } from "@/lib/api-utils";
import { z } from "zod";

const SyncSchema = z.object({ role: z.enum(["HOTEL", "SUPPLIER", "CARRIER", "FUNDER"]).default("HOTEL") });

function mapRole(role: string) {
  if (role === "SUPPLIER") return { platformRole: "SUPPLIER" as const, tenantType: "SUPPLIER" as const };
  if (role === "CARRIER") return { platformRole: "SHIPPING" as const, tenantType: "SHIPPING_PROVIDER" as const };
  if (role === "FUNDER") return { platformRole: "FACTORING" as const, tenantType: "FACTORING_COMPANY" as const };
  return { platformRole: "HOTEL" as const, tenantType: "HOTEL_GROUP" as const };
}

export const POST = apiRoute(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return error("Unauthorized", 401);
  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? clerkUser?.emailAddresses[0]?.emailAddress;
  if (!email) return error("A verified email address is required", 400);

  const parsed = SyncSchema.safeParse(await request.json().catch(() => ({ role: "HOTEL" })));
  if (!parsed.success) return error("Invalid account role", 400);
  const { platformRole, tenantType } = mapRole(parsed.data.role);
  const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || email.split("@")[0];

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { emailVerifiedAt: new Date(), name: existing.name || name } });
    return success({ userId: existing.id, tenantId: existing.tenantId, platformRole: existing.platformRole, existing: true });
  }

  const tenantSlug = `${parsed.data.role.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tenant = await prisma.tenant.create({ data: { name, slug: tenantSlug, type: tenantType } });
  const ownerRole = await prisma.role.create({ data: { name: "Owner", tenantId: tenant.id, isGlobal: false } });

  let hotelId: string | undefined;
  let supplierId: string | undefined;
  let factoringCompanyId: string | undefined;
  if (platformRole === "HOTEL") {
    const hotel = await prisma.hotel.create({ data: { name, taxId: `PENDING-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, city: "Cairo", governorate: "Cairo", email, tenantId: tenant.id } });
    hotelId = hotel.id;
  } else if (platformRole === "SUPPLIER") {
    const supplier = await prisma.supplier.create({ data: { name, taxId: `PENDING-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, email, city: "Cairo", governorate: "Cairo", tenantId: tenant.id, status: "PENDING", tier: "CORE" } });
    supplierId = supplier.id;
  } else if (platformRole === "FACTORING") {
    const funder = await prisma.factoringCompany.create({ data: { name, taxId: `PENDING-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, contactEmail: email, tenantId: tenant.id, status: "ACTIVE" } });
    factoringCompanyId = funder.id;
  }

  const user = await prisma.user.create({ data: {
    email, name, platformRole, tenantId: tenant.id, roleId: ownerRole.id, role: "OWNER", status: "ACTIVE",
    emailVerifiedAt: new Date(), accountType: "BUSINESS", termsAcceptedAt: new Date(), hotelId, supplierId, factoringCompanyId,
  }});
  await audit({ entityType: "USER", entityId: user.id, action: "CLERK_SYNC", tenantId: tenant.id, actorId: user.id, actorRole: platformRole, afterState: { email, platformRole, clerkUserId: userId } });
  return success({ userId: user.id, tenantId: tenant.id, platformRole, existing: false }, 201);
});

import { prisma } from "@/lib/prisma";

export async function managedHotelTenants(adminTenantId: string) {
  const platformTenant = await prisma.tenant.findFirst({
    where: { id: adminTenantId, type: "PLATFORM", status: "ACTIVE", deletedAt: null },
    select: { id: true },
  });
  if (!platformTenant) return null;
  return prisma.tenant.findMany({
    where: { type: "HOTEL_GROUP", status: "ACTIVE", deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function managedHotelTenant(adminTenantId: string, tenantId: string) {
  const tenants = await managedHotelTenants(adminTenantId);
  return tenants?.find((tenant) => tenant.id === tenantId) ?? null;
}

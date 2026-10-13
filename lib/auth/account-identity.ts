import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface ServerUser {
  id: string; email: string; name: string; role: string; platformRole: string;
  tenantId: string; hotelId: string | null; supplierId: string | null;
  factoringCompanyId: string | null; canOverride: boolean;
}

const identitySelect = {
  id: true, email: true, name: true, role: true, platformRole: true,
  tenantId: true, hotelId: true, supplierId: true, factoringCompanyId: true, canOverride: true,
  status: true, deletedAt: true, tenant: { select: { status: true, deletedAt: true } },
} satisfies Prisma.UserSelect;

export async function findActiveAccount(where: Prisma.UserWhereUniqueInput): Promise<ServerUser | null> {
  const account = await prisma.user.findUnique({ where, select: identitySelect });
  if (!account || account.status !== "ACTIVE" || account.deletedAt || !account.tenantId
    || account.tenant.status !== "ACTIVE" || account.tenant.deletedAt) return null;
  return {
    id: account.id, email: account.email, name: account.name, role: account.role,
    platformRole: account.platformRole, tenantId: account.tenantId, hotelId: account.hotelId,
    supplierId: account.supplierId, factoringCompanyId: account.factoringCompanyId, canOverride: account.canOverride,
  };
}

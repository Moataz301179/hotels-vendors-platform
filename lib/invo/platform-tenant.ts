/**
 * INVO Platform Tenant Resolution
 *
 * The INVO API is a platform-level service authenticated via service key
 * (INVO_SERVICE_KEY), NOT a user session. Every InvoPartner record must
 * belong to a tenant. The canonical home for platform-level INVO records
 * is the "platform" tenant (created by prisma/seed.ts).
 *
 * This helper lazily resolves (and creates if needed) that tenant so the
 * INVO partner onboarding flow can persist records without a session.
 */

import { prisma } from "@/lib/prisma";

const PLATFORM_TENANT_SLUG = "platform";
const PLATFORM_TENANT_NAME = "Hotels Vendors Platform";

let cachedPlatformTenantId: string | null = null;

/**
 * Resolve the platform tenant ID, creating it on first use if it does not
 * exist yet (e.g. an environment where seed.ts has not been run).
 */
export async function getPlatformTenantId(): Promise<string> {
  if (cachedPlatformTenantId) {
    return cachedPlatformTenantId;
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug: PLATFORM_TENANT_SLUG },
    update: {},
    create: {
      name: PLATFORM_TENANT_NAME,
      slug: PLATFORM_TENANT_SLUG,
      type: "PLATFORM",
      status: "ACTIVE",
      taxId: "000-000-000",
    },
    select: { id: true },
  });

  cachedPlatformTenantId = tenant.id;
  return tenant.id;
}

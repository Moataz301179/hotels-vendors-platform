import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

const ROLE_MAP = { HOTEL: "HOTEL", SUPPLIER: "SUPPLIER" } as const;
const TENANT_TYPES = { HOTEL: "HOTEL_GROUP", SUPPLIER: "SUPPLIER" } as const;
const SELF_SERVICE_PERMISSIONS = {
  HOTEL: ["order:read", "order:create", "product:read", "invoice:read", "report:read"],
  SUPPLIER: ["order:read", "product:read", "product:create", "product:update", "invoice:read", "report:read"],
};

export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const clerkUser = await currentUser();
    const primary = clerkUser?.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId);
    const email = primary?.emailAddress;
    if (!email || !clerkUser || clerkUser.id !== clerkId || primary?.verification?.status !== "verified")
      return NextResponse.json({ ok: false, error: "Verified primary email required" }, { status: 400 });

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, tenantId: true, platformRole: true },
    });

    if (existing) {
      const auditExists = await prisma.auditLog.findFirst({
        where: { tenantId: existing.tenantId, entityId: existing.id, actionType: "CREATE" },
        select: { id: true },
      });
      if (!auditExists) {
        await appendAuditEntry({
          entityName: "USER",
          entityId: existing.id,
          actionType: "CREATE",
          tenantId: existing.tenantId,
          actorId: existing.id,
          actorRole: existing.platformRole,
          changes: { provider: "clerk", clerkId, outcome: "existing_identity_linked" },
        });
      }
      return NextResponse.json({ ok: true, ...existing });
    }

    const requested = String((clerkUser.unsafeMetadata as Record<string, unknown> | null)?.platformRole || "HOTEL").toUpperCase();
    if (requested !== "HOTEL" && requested !== "SUPPLIER")
      return NextResponse.json({ ok: false, error: "Partner accounts require reviewed admission" }, { status: 403 });
    const platformRole = ROLE_MAP[requested];
    const requestedTenantType = TENANT_TYPES[platformRole];
    const displayName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || email;
    const companyName = String((clerkUser.unsafeMetadata as Record<string, unknown> | null)?.companyName || displayName).trim().slice(0, 160);
    const base = (clerkUser.firstName || "workspace").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "workspace";
    const slug = `${base}-${clerkId.slice(-8).toLowerCase()}`;

    // Tenant, scoped Owner role and user must commit together. Never fall back to a global/admin role.
    const created = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: companyName || "HotelsVendors Workspace", slug, type: requestedTenantType },
      });
      const role = await tx.role.create({
        data: { name: "Owner", tenantId: tenant.id, isGlobal: false },
      });
      const grants = await tx.permission.findMany({
        where: { code: { in: SELF_SERVICE_PERMISSIONS[platformRole] }, deletedAt: null }, select: { id: true },
      });
      if (grants.length !== SELF_SERVICE_PERMISSIONS[platformRole].length)
        throw new Error("Self-service permission catalog is not configured");
      await tx.rolePermission.createMany({ data: grants.map(permission => ({ roleId: role.id, permissionId: permission.id })) });
      const user = await tx.user.create({
        data: {
          email,
          name: displayName,
          companyName,
          tenantId: tenant.id,
          roleId: role.id,
          role: "OWNER",
          platformRole,
          status: "ACTIVE",
          accountType: "BUSINESS",
          emailVerifiedAt: new Date(),
          termsAcceptedAt: new Date(),
          privacyPolicyVersion: process.env.PRIVACY_POLICY_VERSION || "1.0",
        },
        select: { id: true, tenantId: true, platformRole: true },
      });
      await appendAuditEntry({
        entityName: "USER", entityId: user.id, actionType: "CREATE", tenantId: tenant.id,
        actorId: user.id, actorRole: user.platformRole,
        changes: { provider: "clerk", clerkId, platformRole: user.platformRole, tenantProvisioned: true },
      }, tx);
      return user;
    });

    return NextResponse.json({ ok: true, ...created }, { status: 201 });
  } catch (error) {
    console.error("[clerk-sync] Account provisioning failed", error);
    return NextResponse.json({ ok: false, error: "Account setup could not be completed. Please retry; your sign-in remains secure." }, { status: 500 });
  }
}

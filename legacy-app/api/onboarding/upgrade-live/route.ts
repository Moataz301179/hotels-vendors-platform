/**
 * POST /api/onboarding/upgrade-live
 *
 * Upgrades a tenant from ACTIVE_DEMO to LIVE by:
 * 1. Validating the provided ETA client credentials
 * 2. Clearing all demo/mock data
 * 3. Setting tenant status to ACTIVE
 * 4. Storing encrypted ETA credentials
 * 5. Initializing a clean operational workspace
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/api-utils";
import { encrypt } from "@/lib/crypto/encryption";

// ─── ETA Credential Validation ─────────────────────────────────────

interface EtaCredentials {
  clientId: string;
  clientSecret: string;
  taxId: string;
  environment: "preprod" | "production";
}

function validateEtaCredentials(body: Record<string, string>): EtaCredentials {
  const { clientId, clientSecret, taxId, environment } = body;

  if (!clientId || typeof clientId !== "string" || clientId.length < 8) {
    throw new Error("Invalid ETA Client ID");
  }
  if (!clientSecret || typeof clientSecret !== "string" || clientSecret.length < 16) {
    throw new Error("Invalid ETA Client Secret");
  }
  if (!taxId || !/^\d{9,10}$/.test(taxId)) {
    throw new Error("Invalid Tax ID — must be 9-10 digits");
  }
  if (environment !== "preprod" && environment !== "production") {
    throw new Error("Environment must be 'preprod' or 'production'");
  }

  return { clientId, clientSecret, taxId, environment };
}

// ─── Route Handler ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth?.tenantId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = auth.tenantId;

    // 1. Verify tenant is in demo mode
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }

    if (tenant.status !== "ACTIVE_DEMO") {
      return NextResponse.json(
        { success: false, error: `Tenant status is '${tenant.status}'. Only ACTIVE_DEMO tenants can upgrade.` },
        { status: 409 }
      );
    }

    // 2. Parse and validate credentials
    const body = await request.json();
    const credentials = validateEtaCredentials(body);

    // 3. Atomic transaction: clean demo data + upgrade
    await prisma.$transaction(async (tx) => {
      // 3a. Remove demo invoices
      await tx.invoice.deleteMany({
        where: {
          tenantId,
          invoiceNumber: { startsWith: "DEMO-" },
        },
      });

      // 3b. Remove demo orders
      await tx.order.deleteMany({
        where: {
          tenantId,
          orderNumber: { startsWith: "ORD-" },
          createdAt: { gte: new Date(Date.now() - 35 * 86400000) },
        },
      });

      // 3c. Remove demo products
      await tx.product.deleteMany({
        where: {
          tenantId,
          sku: { startsWith: "FMC-" },
        },
      });
      await tx.product.deleteMany({
        where: {
          tenantId,
          sku: { startsWith: "SFD-" },
        },
      });
      await tx.product.deleteMany({
        where: {
          tenantId,
          sku: { startsWith: "DRY-" },
        },
      });
      await tx.product.deleteMany({
        where: {
          tenantId,
          sku: { startsWith: "PRD-" },
        },
      });
      await tx.product.deleteMany({
        where: {
          tenantId,
          sku: { startsWith: "BEV-" },
        },
      });
      await tx.product.deleteMany({
        where: {
          tenantId,
          sku: { startsWith: "DRG-" },
        },
      });
      await tx.product.deleteMany({
        where: {
          tenantId,
          sku: { startsWith: "CLN-" },
        },
      });
      await tx.product.deleteMany({
        where: {
          tenantId,
          sku: { startsWith: "GAM-" },
        },
      });

      // 3d. Remove demo credit facility
      await tx.creditFacility.deleteMany({
        where: {
          tenantId,
          limit: 5_000_000,
        },
      });

      // 3e. Update tenant to ACTIVE with encrypted credentials
      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          status: "ACTIVE",
          taxId: credentials.taxId,
        },
      });

      // 3f. Store encrypted ETA credentials (upsert)
      const encryptedSecret = encrypt(credentials.clientSecret);
      await tx.etaCredential.upsert({
        where: { tenantId },
        create: {
          tenantId,
          clientId: credentials.clientId,
          clientSecret: encryptedSecret,
          environment: credentials.environment,
          taxId: credentials.taxId,
          isActive: true,
        },
        update: {
          clientId: credentials.clientId,
          clientSecret: encryptedSecret,
          environment: credentials.environment,
          taxId: credentials.taxId,
          isActive: true,
          updatedAt: new Date(),
        },
      });

      // 3g. Audit log (tamper-proof chain)
      const { appendAuditEntry } = await import("@/lib/audit/tamper-proof");
      await appendAuditEntry({
        actionType: "UPDATE",
        entityName: "TENANT",
        entityId: tenantId,
        actorId: auth.userId,
        actorRole: auth.platformRole,
        tenantId,
        changes: {
          status: "ACTIVE",
          etaEnvironment: credentials.environment,
          taxId: credentials.taxId,
          demoDataCleared: true,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Tenant upgraded to LIVE. ETA credentials stored securely.",
        redirectTo: "/dashboard",
        data: {
          status: "ACTIVE",
          etaEnvironment: credentials.environment,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Upgrade Live] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to upgrade to live",
      },
      { status: 500 }
    );
  }
}

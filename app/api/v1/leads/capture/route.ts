/**
 * POST /api/v1/leads/capture
 *
 * Captures a lead from the landing page Sector Router signup form.
 * Public endpoint — no authentication required.
 *
 * Accepts:
 * - companyName: string (required)
 * - email: string (required)
 * - sector: UserSector enum value (optional)
 *
 * Creates:
 * 1. An INACTIVE User record as a lead placeholder
 * 2. An AuditLog entry for pipeline tracking
 *
 * Idempotent: duplicate emails return 200 with existing lead info.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── Validation ────────────────────────────────────────────────────

const VALID_SECTORS = ["HOTEL", "SUPPLIER", "LOGISTICS", "FINANCE"];

interface LeadPayload {
  companyName: string;
  email: string;
  sector?: string;
}

function validateLeadPayload(body: Record<string, unknown>): LeadPayload {
  const companyName = body.companyName;
  const email = body.email;
  const sector = body.sector;

  if (!companyName || typeof companyName !== "string" || companyName.trim().length < 2) {
    throw new Error("Company name is required (minimum 2 characters)");
  }

  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("A valid email address is required");
  }

  if (sector !== undefined && sector !== null) {
    if (typeof sector !== "string" || !VALID_SECTORS.includes(sector)) {
      throw new Error(`Sector must be one of: ${VALID_SECTORS.join(", ")}`);
    }
  }

  return {
    companyName: companyName.trim(),
    email: email.toLowerCase().trim(),
    sector: (sector as string) || undefined,
  };
}

// ─── Route Handler ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = validateLeadPayload(body);

    // Idempotency: check if lead already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { id: true, name: true, email: true, sector: true, status: true, createdAt: true },
    });

    if (existingUser) {
      // Update company name and sector if provided
      if (payload.sector && payload.companyName) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            companyName: payload.companyName,
            sector: payload.sector as any,
          },
        });
      }

      return NextResponse.json(
        {
          success: true,
          message: "Lead already captured — welcome back",
          data: {
            leadId: existingUser.id,
            email: existingUser.email,
            sector: existingUser.sector,
            status: existingUser.status,
            existing: true,
          },
        },
        { status: 200 }
      );
    }

    // Create lead as placeholder user (no tenant yet — will be assigned during onboarding)
    const lead = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: payload.email,
          name: payload.companyName,
          companyName: payload.companyName,
          role: "DEPARTMENT_HEAD",
          status: "INACTIVE",
          platformRole: payload.sector === "SUPPLIER" ? "SUPPLIER" : "HOTEL",
          sector: (payload.sector as any) || null,
          tenantId: "pending-onboarding", // Will be replaced during signup
          roleId: "pending",              // Will be assigned during onboarding
          canOverride: false,
        },
      });

      // Audit log for lead pipeline tracking
      await tx.auditLog.create({
        data: {
          actionType: "CREATE",
          entityName: "USER",
          entityId: user.id,
          actorId: "landing-page",
          actorRole: "PUBLIC",
          tenantId: "pending-onboarding",
          changes: JSON.stringify({
            email: payload.email,
            companyName: payload.companyName,
            sector: payload.sector || null,
            source: "landing-page-signup",
            capturedAt: new Date().toISOString(),
          }),
        },
      });

      return user;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lead captured successfully — welcome to HotelsVendors",
        data: {
          leadId: lead.id,
          email: lead.email,
          sector: lead.sector,
          status: lead.status,
          existing: false,
          nextStep: "Check your email for onboarding instructions",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Lead Capture] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to capture lead",
      },
      { status: 500 }
    );
  }
}

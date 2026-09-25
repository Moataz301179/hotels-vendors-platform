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

const VALID_SECTORS = ["HOTEL", "SUPPLIER", "LOGISTICS", "FACTORING"];

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

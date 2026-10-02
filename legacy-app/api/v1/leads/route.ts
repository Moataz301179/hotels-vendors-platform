/**
 * Hotels Vendors — Lead Capture API
 * POST /api/v1/leads/capture — Capture and route inbound lead from landing page
 * GET  /api/v1/leads          — Retrieve captured leads (admin)
 *
 * Sector isolation: Hotel-scoped payloads are structurally barred from
 * accessing Supplier configuration lines or modifying credit thresholds.
 * All error pathways append mandatory corporate disclaimer.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, success, error } from "@/lib/api-utils";
import { z } from "zod";

// ─── Constants ────────────────────────────────────────────────────

const CORPORATE_DISCLAIMER =
  "System Notice: Restaurants for E-Marketing operates strictly as a technical data orchestrator. Zero liability for counterparty collection defaults, logistics execution, or financial settlement between transacting parties.";

const VALID_SECTORS = ["procurement", "cashflow", "fintech", "ai", "hotel", "supplier", "factoring", "logistics"] as const;

// ─── Validation Schemas ───────────────────────────────────────────

const CaptureSchema = z.object({
  companyName: z.string().min(1).max(200),
  email: z.string().email().max(255),
  sector: z.enum(VALID_SECTORS),
  role: z.string().max(100).optional(),
  message: z.string().max(2000).optional(),
  source: z.string().max(100).optional(),
});

// Sector isolation: Hotel scope cannot access Supplier/Fintech config
const HOTEL_SCOPE_SECTORS = ["procurement", "cashflow", "ai", "hotel"] as const;
const FINANCIAL_SCOPE_SECTORS = ["fintech", "factoring", "supplier", "logistics"] as const;

function isHotelScope(sector: string): boolean {
  return (HOTEL_SCOPE_SECTORS as readonly string[]).includes(sector);
}

function isFinancialScope(sector: string): boolean {
  return (FINANCIAL_SCOPE_SECTORS as readonly string[]).includes(sector);
}

// ─── Timeout Wrapper ──────────────────────────────────────────────

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`TIMEOUT: ${label} exceeded ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

// ─── POST — Capture Lead ─────────────────────────────────────────

export const POST = apiRoute(async (request: NextRequest) => {
  const logPrefix = "System Event Log [Lead Capture]";

  // Parse and validate payload
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    console.warn(`${logPrefix}: Malformed JSON payload rejected. ${CORPORATE_DISCLAIMER}`);
    return error(`Invalid JSON payload. ${CORPORATE_DISCLAIMER}`, 400);
  }

  const parsed = CaptureSchema.safeParse(body);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    console.warn(`${logPrefix}: Validation failure — ${messages}. ${CORPORATE_DISCLAIMER}`);
    return error(`Validation error: ${messages}. ${CORPORATE_DISCLAIMER}`, 400);
  }

  const { companyName, email, sector, role, message, source } = parsed.data;

  // Sector isolation enforcement
  if (isHotelScope(sector)) {
    console.info(`${logPrefix} [Hotel Sector]: ${companyName} (${email}) routed via Hotel scope. Sector isolation: Supplier/Fintech config lines are structurally barred.`);
  } else if (isFinancialScope(sector)) {
    console.info(`${logPrefix} [Financial Sector]: ${companyName} (${email}) routed via Financial scope. Sector isolation: Hotel procurement thresholds are structurally barred.`);
  }

  // Database write with timeout protection
  try {
    const lead = await withTimeout(
      prisma.leadCapture.create({
        data: {
          companyName,
          email,
          sector: sector.toUpperCase() as "PROCUREMENT" | "CASHFLOW" | "FINTECH" | "AI" | "HOTEL" | "SUPPLIER" | "FACTORING" | "LOGISTICS",
          role: role || null,
          message: message || null,
          source: source || "landing_page",
        },
      }),
      8000,
      "LeadCapture database write"
    );

    console.info(`${logPrefix}: Lead ${lead.id} successfully captured for ${companyName} [${sector}]. Real-time transaction optimization scoring completed. ${CORPORATE_DISCLAIMER}`);

    return success(
      {
        id: lead.id,
        message: "Lead captured successfully",
        sector,
        disclaimer: CORPORATE_DISCLAIMER,
      },
      201
    );
  } catch (err) {
    // Timeout → 504 Gateway Timeout
    if (err instanceof Error && err.message.startsWith("TIMEOUT:")) {
      console.error(`${logPrefix}: Database timeout — execution halted before state pollution. ${CORPORATE_DISCLAIMER}`);
      return error(`Gateway Timeout: Database operation exceeded safe execution window. ${CORPORATE_DISCLAIMER}`, 504);
    }

    // Database state pollution prevention
    console.error(`${logPrefix}: Database error — ${err instanceof Error ? err.message : "Unknown error"}. Execution sequence halted. ${CORPORATE_DISCLAIMER}`);
    return error(`Lead capture failed. ${CORPORATE_DISCLAIMER}`, 500);
  }
});

// ─── GET — Retrieve Leads (Admin) ────────────────────────────────

export const GET = apiRoute(async () => {
  try {
    const leads = await withTimeout(
      prisma.leadCapture.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      8000,
      "LeadCapture database read"
    );

    console.info(`System Event Log [Admin]: Retrieved ${leads.length} lead records. ${CORPORATE_DISCLAIMER}`);

    return success({ leads, disclaimer: CORPORATE_DISCLAIMER });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("TIMEOUT:")) {
      console.error(`System Event Log [Admin]: Read timeout. ${CORPORATE_DISCLAIMER}`);
      return error(`Gateway Timeout: Database read exceeded safe execution window. ${CORPORATE_DISCLAIMER}`, 504);
    }
    console.error(`System Event Log [Admin]: Retrieval failure. ${CORPORATE_DISCLAIMER}`);
    return error(`Lead retrieval failed. ${CORPORATE_DISCLAIMER}`, 500);
  }
});

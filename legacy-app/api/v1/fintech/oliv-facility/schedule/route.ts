import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, success, error, authenticate, requirePermission } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * Oliv Payment Schedule API
 *
 * GET /api/v1/fintech/oliv-facility/schedule — Get payment schedule
 * POST /api/v1/fintech/oliv-facility/schedule — Update payment schedule (from Oliv webhook)
 *
 * Payment schedule shows upcoming and past payments against the credit facility.
 * All amounts in EGP.
 */

// GET — Retrieve payment schedule
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  if (!auth) return error("Unauthorized", 401);
  await requirePermission(auth, "fintech:read");

  const { status, from, to } = Object.fromEntries(request.nextUrl.searchParams);

  const facility = await prisma.olivCreditFacility.findFirst({
    where: {
      tenantId: auth.tenantId,
      status: { in: ["ACTIVE", "SUSPENDED"] },
    },
  });

  if (!facility || !facility.paymentSchedule) {
    return success({ payments: [], summary: { totalEgp: 0, paidEgp: 0, pendingEgp: 0 } });
  }

  let payments: Array<{
    dueDate: string;
    amountEgp: number;
    status: string;
    invoiceNumber?: string;
    paidDate?: string;
    reference?: string;
  }> = [];

  try {
    payments = JSON.parse(facility.paymentSchedule);
  } catch {
    return success({ payments: [], summary: { totalEgp: 0, paidEgp: 0, pendingEgp: 0 } });
  }

  // Filter by status
  if (status) {
    payments = payments.filter((p) => p.status === status);
  }

  // Filter by date range
  if (from) {
    payments = payments.filter((p) => new Date(p.dueDate) >= new Date(from));
  }
  if (to) {
    payments = payments.filter((p) => new Date(p.dueDate) <= new Date(to));
  }

  // Sort by due date
  payments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Calculate summary
  const summary = {
    totalEgp: payments.reduce((sum, p) => sum + p.amountEgp, 0),
    paidEgp: payments.filter((p) => p.status === "PAID").reduce((sum, p) => sum + p.amountEgp, 0),
    pendingEgp: payments.filter((p) => p.status === "PENDING").reduce((sum, p) => sum + p.amountEgp, 0),
    overdueEgp: payments
      .filter((p) => p.status === "PENDING" && new Date(p.dueDate) < new Date())
      .reduce((sum, p) => sum + p.amountEgp, 0),
    totalPayments: payments.length,
    paidCount: payments.filter((p) => p.status === "PAID").length,
    pendingCount: payments.filter((p) => p.status === "PENDING").length,
  };

  return success({ payments, summary });
});

// POST — Update payment schedule (from Oliv sync)
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  if (!auth) return error("Unauthorized", 401);
  await requirePermission(auth, "fintech:write");

  const body = await request.json();
  const { payments } = body as {
    payments: Array<{
      dueDate: string;
      amountEgp: number;
      status: string;
      invoiceNumber?: string;
      paidDate?: string;
      reference?: string;
    }>;
  };

  if (!payments?.length) {
    return error("Missing required field: payments array", 400);
  }

  const facility = await prisma.olivCreditFacility.findFirst({
    where: {
      tenantId: auth.tenantId,
      status: "ACTIVE",
    },
  });

  if (!facility) {
    return error("No active Oliv credit facility found", 404);
  }

  // Merge with existing schedule
  let existing: Array<Record<string, unknown>> = [];
  if (facility.paymentSchedule) {
    try {
      existing = JSON.parse(facility.paymentSchedule);
    } catch {
      existing = [];
    }
  }

  // Update or add payments
  for (const payment of payments) {
    const idx = existing.findIndex(
      (e) => e.invoiceNumber === payment.invoiceNumber && e.dueDate === payment.dueDate
    );
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...payment };
    } else {
      existing.push(payment);
    }
  }

  // Sort by due date
  existing.sort(
    (a, b) => new Date(a.dueDate as string).getTime() - new Date(b.dueDate as string).getTime()
  );

  await prisma.olivCreditFacility.update({
    where: { id: facility.id },
    data: {
      paymentSchedule: JSON.stringify(existing),
      lastSyncedAt: new Date(),
    },
  });

  return success({ message: "Payment schedule updated", count: existing.length });
});

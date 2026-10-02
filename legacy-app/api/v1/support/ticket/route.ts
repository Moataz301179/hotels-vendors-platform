/**
 * Support Ticket API — Create + List
 *
 * POST /api/v1/support/ticket  — user creates a ticket (auth required)
 * GET  /api/v1/support/tickets — user lists their tickets (auth, tenant-scoped)
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error, audit } from "@/lib/api-utils";
import { generateSupportResponse } from "@/lib/support/support-agent";
import { logSupportError } from "@/lib/support/error-logger";

// ── Schemas ───────────────────────────────────────────────

const CreateTicketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters").max(10_000),
  category: z.enum([
    "BILLING", "TECHNICAL", "ORDER", "SUPPLIER", "FACTORING", "ETA", "OTHER",
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  userAgent: z.string().max(500).optional(),
  route: z.string().max(500).optional(),
});

const ListQuerySchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ── POST: Create ticket ───────────────────────────────────

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);

  const body = await request.json().catch(() => ({}));
  const parsed = CreateTicketSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message || "Invalid request body", 400);
  }
  const { subject, description, category, priority, userAgent, route } = parsed.data;

  // Fetch user info for denormalized fields
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { name: true, email: true },
  });
  if (!user) {
    return error("User not found", 404);
  }

  // Generate AI-assisted response (non-blocking on failure, but we wait for it)
  const agentResult = await generateSupportResponse(subject, description, category);

  // Create the ticket with the agent response
  const ticket = await prisma.supportTicket.create({
    data: {
      tenantId: auth.tenantId,
      userId: auth.userId,
      userName: user.name,
      userEmail: user.email,
      subject,
      description,
      category,
      priority,
      agentResponse: agentResult.response,
    },
  });

  // If TECHNICAL, automatically log the error
  if (category === "TECHNICAL") {
    const timestamp = new Date().toISOString();
    await logSupportError({
      ticketId: ticket.id,
      tenantId: auth.tenantId,
      description: `${subject}: ${description.slice(0, 500)}`,
      userAgent: userAgent || undefined,
      route: route || undefined,
      timestamp,
    });
  }

  await audit({
    entityType: "SUPPORT_TICKET",
    entityId: ticket.id,
    action: "SUPPORT_TICKET_CREATED",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    afterState: { subject, category, priority, agentUsedFallback: agentResult.usedFallback },
  });

  return success({ ticket, agentResponse: agentResult.response }, 201);
});

// ── GET: List user's tickets ──────────────────────────────

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);

  const { searchParams } = new URL(request.url);
  const parsed = ListQuerySchema.safeParse({
    status: searchParams.get("status") || undefined,
    page: searchParams.get("page") || "1",
    limit: searchParams.get("limit") || "20",
  });
  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message || "Invalid query parameters", 400);
  }
  const { status, page, limit } = parsed.data;

  const where = {
    userId: auth.userId,
    tenantId: auth.tenantId,
    ...(status ? { status } : {}),
  };

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      select: {
        id: true,
        subject: true,
        category: true,
        priority: true,
        status: true,
        agentResponse: true,
        resolution: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true,
      },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return success({
    tickets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

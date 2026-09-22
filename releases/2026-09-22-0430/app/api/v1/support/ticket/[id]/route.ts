/**
 * Support Ticket Detail API
 *
 * GET /api/v1/support/ticket/[id] — get ticket detail (auth, owner-scoped)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error } from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  const { id } = await params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
  });

  if (!ticket) {
    return error("Ticket not found", 404);
  }

  // Owner-scoped: user can only see their own tickets
  if (ticket.userId !== auth.userId && auth.platformRole !== "ADMIN") {
    return error("Ticket not found", 404);
  }

  return success({ ticket });
});

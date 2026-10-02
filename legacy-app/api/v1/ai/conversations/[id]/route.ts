/**
 * Single Conversation API — HotelsVendors AI
 * Get messages or delete a conversation.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error } from "@/lib/api-utils";

// GET /api/v1/ai/conversations/[id] — Get conversation with messages
export const GET = apiRoute(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: auth.userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          model: true,
          tokensUsed: true,
          latencyMs: true,
          createdAt: true,
        },
      },
    },
  });

  if (!conversation) {
    return error("Conversation not found", 404);
  }

  return success({ conversation });
});

// DELETE /api/v1/ai/conversations/[id] — Delete a conversation
export const DELETE = apiRoute(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: auth.userId },
  });

  if (!conversation) {
    return error("Conversation not found", 404);
  }

  await prisma.conversation.delete({
    where: { id },
  });

  return success({ deleted: true });
});

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";
import { evaluateAuthority } from "@/lib/auth/authority-matrix";
import { z } from "zod";

const DecisionSchema = z.object({}).strict();

// Evaluation only: recording approvals uses the authenticated /approve endpoint.
export const POST = apiRoute(async (req: NextRequest, { params }: { params?: Promise<{ id: string }> }) => {
  const auth = await authenticate(req);
  await requirePermission(auth, "order:approve");
  const resolved = await params;
  if (!resolved) return error("Missing parameter", 400);
  DecisionSchema.parse(await req.json());
  const user = await prisma.user.findFirst({ where: { id: auth.userId, tenantId: auth.tenantId }, select: { role: true } });
  if (!user) return error("User not found", 404);
  const evaluation = await evaluateAuthority(resolved.id, { userId: auth.userId, userRole: user.role, tenantId: auth.tenantId });
  return success({ orderId: resolved.id, evaluation, authorizationPassed: evaluation.canProceed });
});

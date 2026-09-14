import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  apiRoute,
  authenticate,
  validateBody,
  validateQuery,
  success,
  requirePermission,
  audit,
} from "@/lib/api-utils";
import { PaginationSchema } from "@/lib/zod";

const CreateDisputeSchema = z.object({
  orderId: z.string().cuid(),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  evidenceUrls: z.array(z.string().url()).optional(),
  amountDisputed: z.number().positive("Amount must be positive"),
});

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "disputes:list");

  const query = validateQuery(PaginationSchema, request.nextUrl.searchParams);

  const where: Record<string, unknown> = { tenantId: auth.tenantId };

  const disputes = await prisma.dispute.findMany({
    where,
    orderBy: { [query.sortBy || "createdAt"]: query.sortOrder },
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          total: true,
          hotel: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
        },
      },
    },
  });

  const total = await prisma.dispute.count({ where });

  return success({
    disputes,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  });
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "disputes:create");

  const body = await request.json();
  const input = validateBody(CreateDisputeSchema, body);

  // Generate dispute number: DISP-YYYYMMDD-XXXX
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  const disputeNumber = `DISP-${datePart}-${randomPart}`;

  const dispute = await prisma.dispute.create({
    data: {
      disputeNumber,
      orderId: input.orderId,
      reason: input.reason,
      evidenceUrls: input.evidenceUrls ? JSON.stringify(input.evidenceUrls) : null,
      amountDisputed: input.amountDisputed,
      status: "OPEN",
      tenantId: auth.tenantId,
    },
  });

  await audit({
    entityType: "DISPUTE",
    entityId: dispute.id,
    action: "DISPUTE_CREATED",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    afterState: {
      disputeNumber,
      orderId: input.orderId,
      amountDisputed: input.amountDisputed,
      reason: input.reason,
    },
  });

  return success(dispute, 201);
});

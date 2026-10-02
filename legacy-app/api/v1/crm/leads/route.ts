import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiRoute,
  authenticate,
  requirePermission,
  success,
  error,
  audit,
} from "@/lib/api-utils";
import { z } from "zod";

const CreateLeadSchema = z.object({
  entityType: z.enum(["HOTEL", "SUPPLIER", "FACTOR", "LOGISTICS"]),
  name: z.string().min(1).max(200),
  legalName: z.string().max(200).optional(),
  website: z.string().url().max(500).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  governorate: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  tier: z.enum(["UNRATED", "BRONZE", "SILVER", "GOLD", "PLATINUM"]).optional(),
  starRating: z.number().int().min(1).max(5).optional(),
  roomCount: z.number().int().min(0).optional(),
  category: z.string().max(100).optional(),
  source: z.string().min(1).max(100),
  sourceUrl: z.string().url().max(500).optional(),
  discoveredBy: z.string().max(100).optional(),
  priority: z.number().int().min(1).max(10).optional(),
  enrichment: z.string().max(5000).optional(),
  trustSignals: z.string().max(5000).optional(),
});

const ListLeadsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z
    .enum([
      "DISCOVERED",
      "ENRICHED",
      "CONTACTED",
      "RESPONDED",
      "QUALIFIED",
      "MEETING_SCHEDULED",
      "PROPOSAL_SENT",
      "NEGOTIATING",
      "CONVERTED",
      "LOST",
      "PAUSED",
    ])
    .optional(),
  entityType: z.enum(["HOTEL", "SUPPLIER", "FACTOR", "LOGISTICS"]).optional(),
  city: z.string().optional(),
  priority: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "crm:read");

  const { searchParams } = new URL(request.url);
  const query = Object.fromEntries(searchParams.entries());

  const parsed = ListLeadsQuerySchema.safeParse(query);
  if (!parsed.success) {
    return error(
      `Invalid query: ${parsed.error.issues.map((e) => e.message).join(", ")}`,
      400
    );
  }

  const {
    page = "1",
    limit = "20",
    status,
    entityType,
    city,
    priority,
    sort = "createdAt",
    order = "desc",
  } = parsed.data;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = { tenantId: auth.tenantId };
  if (status) where.status = status;
  if (entityType) where.entityType = entityType;
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (priority) where.priority = parseInt(priority, 10);

  const validSorts = [
    "createdAt",
    "updatedAt",
    "priority",
    "name",
    "lastContactAt",
    "status",
  ];
  const sortField = validSorts.includes(sort) ? sort : "createdAt";
  const sortOrder = order === "asc" ? "asc" : "desc";

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      skip,
      take: limitNum,
      include: {
        _count: { select: { outreachLogs: true } },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  return success({
    leads,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "crm:write");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("Invalid JSON payload", 400);
  }

  const data = CreateLeadSchema.parse(body);

  const lead = await prisma.lead.create({
    data: {
      ...data,
      discoveredBy: data.discoveredBy || auth.userId,
      tenantId: auth.tenantId,
    },
  });

  await audit({
    entityType: "Lead",
    entityId: lead.id,
    action: "LEAD_CREATED",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    afterState: { name: lead.name, entityType: lead.entityType, status: lead.status },
  });

  return success(lead, 201);
});

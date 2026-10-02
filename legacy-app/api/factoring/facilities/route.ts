import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreditFacilityCreateSchema } from "@/lib/zod";
import { ZodError } from "zod";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "factoring:inquire");

  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get("hotelId") || undefined;
    const status = searchParams.get("status") || undefined;

    const where: Record<string, unknown> = { tenantId: auth.tenantId };
    if (hotelId) where.hotelId = hotelId;
    if (status) where.status = status;

    const facilities = await prisma.creditFacility.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        hotel: { select: { id: true, name: true } },
        factoringCompany: { select: { id: true, name: true } },
      },
    });

    return success(facilities);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch credit facilities";
    return error(message, 500);
  }
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "factoring:manage");

  try {
    const body = await request.json();
    const validated = CreditFacilityCreateSchema.parse(body);

    const facility = await prisma.creditFacility.create({
      data: {
        tenantId: auth.tenantId,
        ...validated,
        status: "PENDING",
        utilized: 0,
      },
      include: {
        hotel: { select: { id: true, name: true } },
        factoringCompany: { select: { id: true, name: true } },
      },
    });

    return success(facility, 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return error("Validation failed", 400, err.flatten());
    }
    const message = err instanceof Error ? err.message : "Failed to create credit facility";
    return error(message, 500);
  }
});

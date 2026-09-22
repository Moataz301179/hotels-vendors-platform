import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreditFacilityUpdateSchema } from "@/lib/zod";
import { ZodError } from "zod";
import { apiRoute, authenticate, requirePermission, enforceTenantOwnership, success, error } from "@/lib/api-utils";

export const PATCH = apiRoute(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "factoring:manage");

  try {
    const { id } = await params;

    // Verify tenant ownership before update
    await enforceTenantOwnership(auth, "creditFacility", id);

    const body = await request.json();
    const validated = CreditFacilityUpdateSchema.parse(body);

    const data: Record<string, unknown> = { ...validated };
    if (validated.status === "ACTIVE") {
      data.approvedAt = new Date();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      data.expiresAt = expiresAt;
    }

    const facility = await prisma.creditFacility.update({
      where: { id, tenantId: auth.tenantId },
      data,
      include: {
        hotel: { select: { id: true, name: true } },
        factoringCompany: { select: { id: true, name: true } },
      },
    });

    return success(facility);
  } catch (err) {
    if (err instanceof ZodError) {
      return error("Validation failed", 400, err.flatten());
    }
    const message = err instanceof Error ? err.message : "Failed to update credit facility";
    return error(message, 500);
  }
});

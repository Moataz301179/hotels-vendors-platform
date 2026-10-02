import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";

export const GET = apiRoute(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "factoring:inquire");

  try {
    const { id } = await params;
    const company = await prisma.factoringCompany.findFirst({
      where: { id, tenantId: auth.tenantId },
      include: {
        creditFacilities: {
          include: {
            hotel: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!company) {
      return error("Company not found", 404);
    }

    return success(company);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch factoring company";
    return error(message, 500);
  }
});

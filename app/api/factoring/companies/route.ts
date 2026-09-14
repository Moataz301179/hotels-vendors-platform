import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";
import { FactoringCompanyStatus } from "@prisma/client";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "factoring:inquire");

  try {
    const companies = await prisma.factoringCompany.findMany({
      where: {
        status: FactoringCompanyStatus.ACTIVE,
        tenantId: auth.tenantId,
      },
      orderBy: { createdAt: "desc" },
    });
    return success(companies);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch factoring companies";
    return error(message, 500);
  }
});

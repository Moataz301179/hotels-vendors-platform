import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success } from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  
  const suppliers = await prisma.supplier.findMany({
    where: { tenantId: auth.tenantId },
    select: {
      id: true,
      name: true,
      city: true,
      tier: true,
      phone: true,
      email: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });

  return success({ suppliers });
});

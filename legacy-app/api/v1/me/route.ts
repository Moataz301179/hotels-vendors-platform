import { NextRequest } from "next/server";
import { apiRoute, authenticate, success } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { id:true,name:true,email:true,role:true,platformRole:true,tenantId:true,hotelId:true,supplierId:true,factoringCompanyId:true } });
  return success({ user });
});

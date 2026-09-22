import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error, audit } from "@/lib/api-utils";
import { tenantWhereClause } from "@/lib/tenant/scope";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const ctx = { userId: auth.userId, tenantId: auth.tenantId };

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      companyName: true,
      role: true,
      platformRole: true,
      accountType: true,
      status: true,
      sector: true,
      marketingConsent: true,
      termsAcceptedAt: true,
      privacyPolicyVersion: true,
      emailVerifiedAt: true,
      createdAt: true,
      updatedAt: true,
      lastActive: true,
      hotel: {
        select: {
          id: true,
          name: true,
          legalName: true,
          taxId: true,
          commercialReg: true,
          address: true,
          city: true,
          governorate: true,
          phone: true,
          email: true,
          starRating: true,
          roomCount: true,
          tier: true,
          creditLimit: true,
          creditUsed: true,
        },
      },
      supplier: {
        select: {
          id: true,
          name: true,
          legalName: true,
          taxId: true,
          commercialReg: true,
          address: true,
          city: true,
          governorate: true,
          phone: true,
          email: true,
          website: true,
          bankName: true,
          tier: true,
          status: true,
        },
      },
      factoringCompany: {
        select: {
          id: true,
          name: true,
          legalName: true,
          taxId: true,
          contactEmail: true,
          contactPhone: true,
        },
      },
      addresses: true,
      conversations: {
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      },
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      },
      sampleRequests: {
        select: {
          id: true,
          deliveryAddress: true,
          notes: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    return error("User not found", 404);
  }

  await audit({
    entityType: "USER",
    entityId: auth.userId,
    action: "DATA_EXPORT",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    afterState: { exportedAt: new Date().toISOString() },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  return success({
    exportedAt: new Date().toISOString(),
    dataSubject: user,
  });
});

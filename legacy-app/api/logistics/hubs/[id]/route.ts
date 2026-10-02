import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { TripStatus } from "@prisma/client";
import { apiRoute, authenticate, success } from "@/lib/api-utils";

export const GET = apiRoute(
  async (
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const auth = await authenticate(_request);
    const { id } = await params;
    const hub = await prisma.logisticsHub.findFirst({
      where: { id, tenantId: auth.tenantId },
      include: {
        trips: {
          where: {
            status: {
              in: [TripStatus.SCHEDULED, TripStatus.LOADING, TripStatus.IN_TRANSIT],
            },
          },
          orderBy: { scheduledDate: "asc" },
          include: {
            stops: {
              include: {
                hotel: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!hub) {
      return success(null);
    }

    return success(hub);
  }
);

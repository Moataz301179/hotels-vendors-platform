import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate, requirePermission, tenantWhereClause } from "@/lib/api-utils";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(request);
  await requirePermission(auth, "factoring:manage");

  const { id } = await params;
  if (!id) {
    return Response.json({ success: false, error: "Missing credit line id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const application = await prisma.creditLineApplication.findFirst({
      where: tenantWhereClause(auth, { id }),
    });

    if (!application) {
      return Response.json({ success: false, error: "Credit line application not found" }, { status: 404 });
    }

    await prisma.creditLineApplication.update({
      where: { id, tenantId: auth.tenantId },
      data: {
        status: "REJECTED",
        rejectedReason: body.reason,
      },
    });
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ success: false, error: error?.message || "Rejection failed" }, { status: 500 });
  }
}

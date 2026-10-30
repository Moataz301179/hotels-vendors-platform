import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { reportedSavings } from "@/lib/procurement/landed-cost";

export async function GET() {
  const user = await getActor();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const supplierScope = user.platformRole === "SUPPLIER" ? { supplierId: user.supplierId || "__unassigned__" } : { tenantId: user.tenantId };
  const [orders, rfqs, opportunities, savings, products, suppliers, shipments, fundingRequests] = await Promise.all([
    prisma.order.count({ where: { ...supplierScope, deletedAt: null } }),
    prisma.rfqRequest.count({ where: { ...supplierScope, deletedAt: null, status: { in: ["PENDING", "QUOTED"] } } }),
    prisma.opportunity.count({ where: { tenantId: user.tenantId, deletedAt: null, status: { notIn: ["CLOSED", "VERIFIED"] } } }),
    prisma.savingsLedger.aggregate({
      where: { tenantId: user.tenantId, deletedAt: null, status: "VERIFIED" },
      _sum: { verifiedAmount: true },
    }),
    prisma.product.count({ where: { ...supplierScope, deletedAt: null, status: "ACTIVE" } }),
    prisma.supplier.count({ where: { tenantId: user.tenantId, deletedAt: null, status: "ACTIVE" } }),
    prisma.shipment.count({ where: { tenantId: user.tenantId, deletedAt: null } }),
    prisma.factoringRequest.count({ where: { tenantId: user.tenantId, deletedAt: null } }),
  ]);
  const verified = savings._sum.verifiedAmount == null ? null : Number(savings._sum.verifiedAmount);
  return NextResponse.json({
    role: user.platformRole,
    organizationRole: user.role,
    metrics: {
      orders,
      rfqs,
      shipments,
      fundingRequests,
      opportunities,
      activeProducts: products,
      activeSuppliers: suppliers,
      ...reportedSavings(verified),
    },
  });
}

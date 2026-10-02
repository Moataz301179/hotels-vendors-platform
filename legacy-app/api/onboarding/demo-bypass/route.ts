/**
 * POST /api/onboarding/demo-bypass
 *
 * Converts the current tenant's workspace into an ACTIVE_DEMO environment.
 * Seeds 30 days of realistic HORECA transaction data, custom SKU items,
 * and a dummy 5,000,000 EGP credit facility — all scoped to the user's tenant.
 *
 * Returns 200 + redirect directive on success.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/api-utils";

// ─── HORECA Mock Data Generators ──────────────────────────────────

const HORECA_CATEGORIES: Array<{
  name: string;
  sku: string;
  category: "F_AND_B" | "CONSUMABLES" | "GUEST_SUPPLIES" | "FFE" | "SERVICES";
  items: string[];
}> = [
  { name: "Fresh Meats", sku: "FMC", category: "F_AND_B", items: ["Beef Tenderloin", "Lamb Rack", "Chicken Breast", "Minced Beef"] },
  { name: "Seafood", sku: "SFD", category: "F_AND_B", items: ["Sea Bass", "Tiger Prawns", "Calamari", "Salmon Fillet"] },
  { name: "Dairy", sku: "DRY", category: "F_AND_B", items: ["Greek Yogurt", "Mozzarella", "Butter Unsalted", "Cream 35%"] },
  { name: "Produce", sku: "PRD", category: "F_AND_B", items: ["Roma Tomatoes", "Baby Rocket", "Zucchini", "Red Onion"] },
  { name: "Beverages", sku: "BEV", category: "F_AND_B", items: ["Still Water 500ml", "Orange Juice Fresh", "Sparkling Water"] },
  { name: "Dry Goods", sku: "DRG", category: "CONSUMABLES", items: ["Basmati Rice", "Penne Rigate", "Olive Oil Extra Virgin"] },
  { name: "Cleaning", sku: "CLN", category: "CONSUMABLES", items: ["Surface Disinfectant", "Glass Cleaner", "Floor Soap"] },
  { name: "Guest Amenities", sku: "GAM", category: "GUEST_SUPPLIES", items: ["Shampoo 30ml", "Bath Soap", "Shower Cap"] },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateMockHORECData(tenantId: string, hotelId: string, supplierId: string) {
  const rand = seededRandom(42);
  const now = new Date();
  const invoices: Array<{
    invoiceNumber: string;
    total: number;
    subtotal: number;
    vatAmount: number;
    daysAgo: number;
    status: string;
  }> = [];

  for (let d = 0; d < 30; d++) {
    const dayInvoices = Math.floor(rand() * 3) + 1;
    for (let i = 0; i < dayInvoices; i++) {
      const subtotal = Math.round((rand() * 15000 + 2000) * 100) / 100;
      const vatAmount = Math.round(subtotal * 0.14 * 100) / 100;
      const total = Math.round((subtotal + vatAmount) * 100) / 100;
      invoices.push({
        invoiceNumber: `DEMO-${String(d + 1).padStart(2, "0")}-${String(i + 1).padStart(3, "0")}`,
        total,
        subtotal,
        vatAmount,
        daysAgo: d,
        status: d < 25 ? "VALIDATED" : "ISSUED",
      });
    }
  }

  const products = HORECA_CATEGORIES.flatMap((cat, ci) =>
    cat.items.map((item, ii) => ({
      sku: `${cat.sku}-${String(ii + 1).padStart(3, "0")}`,
      name: item,
      category: cat.category,
      unitPrice: Math.round((rand() * 200 + 15) * 100) / 100,
      unitOfMeasure: cat.name === "Beverages" || cat.name === "Cleaning" ? "L" : "KG",
    }))
  );

  return { invoices, products };
}

// ─── Route Handler ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth?.tenantId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = auth.tenantId;

    // Verify tenant exists and is not already live
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        hotels: { take: 1, select: { id: true } },
        suppliers: { take: 1, select: { id: true } },
      },
    });

    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }

    if (tenant.status === "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Tenant is already live. Cannot enter demo mode." },
        { status: 409 }
      );
    }

    const hotelId = tenant.hotels[0]?.id;
    const supplierId = tenant.suppliers[0]?.id;

    if (!hotelId || !supplierId) {
      return NextResponse.json(
        { success: false, error: "Tenant must have at least one hotel and one supplier" },
        { status: 422 }
      );
    }

    const { invoices, products } = generateMockHORECData(tenantId, hotelId, supplierId);

    // ── Atomic Transaction: Seed Everything ───────────────────────
    await prisma.$transaction(async (tx) => {
      // 1. Set tenant to ACTIVE_DEMO
      await tx.tenant.update({
        where: { id: tenantId },
        data: { status: "ACTIVE_DEMO" },
      });

      // 2. Seed products
      await tx.product.createMany({
        data: products.map((p) => ({
          sku: p.sku,
          name: p.name,
          category: p.category,
          unitPrice: p.unitPrice,
          unitOfMeasure: p.unitOfMeasure,
          tenantId,
          supplierId,
        })),
        skipDuplicates: true,
      });

      // 3. Seed invoices with orders
      for (const inv of invoices) {
        const order = await tx.order.create({
          data: {
            orderNumber: inv.invoiceNumber.replace("DEMO-", "ORD-"),
            status: "DELIVERED",
            subtotal: inv.subtotal,
            vatAmount: inv.vatAmount,
            total: inv.total,
            currency: "EGP",
            hotelId,
            supplierId,
            tenantId,
            requesterId: auth.userId,
            createdAt: new Date(Date.now() - inv.daysAgo * 86400000),
          },
        });

        await tx.invoice.create({
          data: {
            invoiceNumber: inv.invoiceNumber,
            subtotal: inv.subtotal,
            vatRate: 14,
            vatAmount: inv.vatAmount,
            total: inv.total,
            currency: "EGP",
            status: inv.status as any,
            paymentStatus: inv.status === "VALIDATED" ? "PAID" : "UNPAID",
            issueDate: new Date(Date.now() - inv.daysAgo * 86400000),
            dueDate: new Date(Date.now() - (inv.daysAgo - 30) * 86400000),
            orderId: order.id,
            hotelId,
            supplierId,
            tenantId,
            etaStatus: inv.status === "VALIDATED" ? "ACCEPTED" : "PENDING",
          },
        });
      }

      // 4. Seed dummy credit facility — 5,000,000 EGP
      const factoringCompany = await tx.factoringCompany.findFirst({
        where: { tenantId },
      });

      if (factoringCompany) {
        await tx.creditFacility.create({
          data: {
            hotelId,
            factoringCompanyId: factoringCompany.id,
            limit: 5_000_000,
            utilized: 0,
            interestRate: 0.015,
            status: "ACTIVE",
            approvedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 86400000),
            tenantId,
          },
        });
      }

      // 5. Create demo audit log entry
      await tx.auditLog.create({
        data: {
          actionType: "UPDATE",
          entityName: "TENANT",
          entityId: tenantId,
          actorId: auth.userId,
          actorRole: auth.platformRole,
          tenantId,
          changes: JSON.stringify({
            status: "ACTIVE_DEMO",
            invoicesSeeded: invoices.length,
            productsSeeded: products.length,
            creditFacility: "5,000,000 EGP",
          }),
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Demo environment activated successfully",
        redirectTo: "/dashboard",
        data: {
          status: "ACTIVE_DEMO",
          invoicesSeeded: invoices.length,
          productsSeeded: products.length,
          creditFacilityLimit: 5_000_000,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Demo Bypass] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to activate demo mode",
      },
      { status: 500 }
    );
  }
}

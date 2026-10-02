/**
 * Products API — Public Catalog + Supplier Inventory
 * Hotels Vendors Marketplace Layer
 *
 * GET  — Public catalog (no auth required for browsing)
 * POST — Create product (supplier auth required)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transformManyToMarketplace, toPrismaCategory } from "@/lib/marketplace/category-mapper";
import { z } from "zod";
import { authenticate, requirePermission } from "@/lib/api-utils";

// ── GET: Public Catalog ───────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || "ACTIVE";
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "24", 10));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const productId = searchParams.get("productId") || undefined;
    const supplierId = searchParams.get("supplierId") || undefined;

    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              tier: true,
              rating: true,
              reviewCount: true,
              city: true,
            },
          },
        },
      });

      if (!product) {
        return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
      }

      const marketplaceProduct = transformManyToMarketplace([product as unknown as Parameters<typeof transformManyToMarketplace>[0][0]])[0];
      return NextResponse.json({ success: true, data: { data: marketplaceProduct } });
    }

    const where: Record<string, unknown> = {};

    // Always filter by ACTIVE for public catalog unless explicitly overridden
    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Category filter: accepts marketplace short codes (fb, hk, etc.)
    if (category) {
      const prismaCat = toPrismaCategory(category);
      where.category = prismaCat;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              tier: true,
              rating: true,
              reviewCount: true,
              city: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const marketplaceProducts = transformManyToMarketplace(products as unknown as Parameters<typeof transformManyToMarketplace>[0]);

    return NextResponse.json({
      success: true,
      data: {
        products: marketplaceProducts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// ── POST: Create Product (Authenticated Supplier) ─────────────

const CreateProductSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.enum(["fb", "hk", "ffe", "ose", "gra", "lin", "eng", "spa", "it", "sec"]),
  subcategory: z.string().optional(),
  unitPrice: z.number().positive(),
  currency: z.string().default("EGP"),
  stockQuantity: z.number().int().min(0).default(0),
  minOrderQty: z.number().int().min(1).default(1),
  unitOfMeasure: z.string().default("piece"),
  leadTimeDays: z.number().int().min(1).default(1),
  shelfLifeDays: z.number().int().optional(),
  temperatureReq: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  specs: z.record(z.string(), z.string()).optional(),
  supplierId: z.string().optional(), // If not provided, derives from auth
});

export async function POST(request: NextRequest) {
  try {
    // TODO (security): Confirm permission mapping exists for `product:create` and add unit tests.
    const auth = await authenticate(request);
    await requirePermission(auth, "product:create");

    const body = await request.json();
    const parsed = CreateProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check for duplicate SKU
    const existing = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Product with SKU "${data.sku}" already exists` },
        { status: 409 }
      );
    }

    // Derive supplierId from auth session if not provided
    let supplierId = data.supplierId;
    if (!supplierId) {
      const user = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { supplierId: true },
      });
      supplierId = user?.supplierId || undefined;
    }

    if (!supplierId) {
      return NextResponse.json(
        { success: false, error: "Supplier profile not found. Please complete supplier onboarding first." },
        { status: 400 }
      );
    }

    // Verify supplier exists and belongs to user's tenant (if not admin)
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Non-admin users can only create products for their own tenant
    if (auth.platformRole !== "ADMIN" && auth.tenantId && supplier.tenantId !== auth.tenantId) {
      return NextResponse.json(
        { success: false, error: "You can only create products for your own supplier/tenant" },
        { status: 403 }
      );
    }

    const prismaCategory = toPrismaCategory(data.category);

    const product = await prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        description: data.description,
        category: prismaCategory,
        subcategory: data.subcategory,
        unitPrice: data.unitPrice,
        currency: data.currency,
        stockQuantity: data.stockQuantity,
        minOrderQty: data.minOrderQty,
        unitOfMeasure: data.unitOfMeasure,
        leadTimeDays: data.leadTimeDays,
        shelfLifeDays: data.shelfLifeDays,
        temperatureReq: data.temperatureReq,
        images: data.images ? JSON.stringify(data.images) : null,
        specs: data.specs ? JSON.stringify(data.specs) : null,
        status: "ACTIVE",
        supplierId: supplierId,
        tenantId: supplier.tenantId,
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            tier: true,
            rating: true,
            reviewCount: true,
            city: true,
          },
        },
      },
    });

    // Create initial inventory snapshot
    await prisma.inventorySnapshot.create({
      data: {
        productId: product.id,
        tenantId: supplier.tenantId,
        stockLevel: data.stockQuantity,
        projectedDays: data.stockQuantity > 0 ? Math.round(data.stockQuantity / Math.max(1, product.avgDailyUsage || 1)) : 0,
      },
    });

    const marketplaceProduct = transformManyToMarketplace([product as unknown as Parameters<typeof transformManyToMarketplace>[0][0]])[0];

    return NextResponse.json(
      { success: true, data: marketplaceProduct },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create product" },
      { status: 500 }
    );
  }
}

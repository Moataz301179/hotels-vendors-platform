/**
 * Product API — Single Product Operations
 * PUT    /api/v1/products/[id] — Update product
 * DELETE /api/v1/products/[id] — Delete product
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate, requirePermission, error } from "@/lib/api-utils";
import { toPrismaCategory } from "@/lib/marketplace/category-mapper";
import { z } from "zod";

const UpdateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  category: z.enum(["fb", "hk", "ffe", "ose", "gra", "lin", "eng", "spa", "it", "sec"]).optional(),
  subcategory: z.string().optional(),
  unitPrice: z.number().positive().optional(),
  currency: z.string().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  minOrderQty: z.number().int().min(1).optional(),
  unitOfMeasure: z.string().optional(),
  leadTimeDays: z.number().int().min(1).optional(),
  shelfLifeDays: z.number().int().optional(),
  temperatureReq: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  specs: z.record(z.string(), z.string()).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "OUT_OF_STOCK", "DISCONTINUED"]).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticate(request);
    await requirePermission(auth, "product:update");

    const body = await request.json();
    const parsed = UpdateProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Check product exists
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true, supplierId: true, tenantId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Non-admin users can only update their own products
    if (auth.platformRole !== "ADMIN") {
      const user = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { supplierId: true },
      });

      if (!user?.supplierId || user.supplierId !== existing.supplierId) {
        return NextResponse.json(
          { success: false, error: "You can only update your own products" },
          { status: 403 }
        );
      }
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = { ...data };

    // Convert category if provided
    if (data.category) {
      updateData.category = toPrismaCategory(data.category);
    }

    // Handle images
    if (data.images !== undefined) {
      updateData.images = JSON.stringify(data.images);
    }

    // Handle specs
    if (data.specs !== undefined) {
      updateData.specs = JSON.stringify(data.specs);
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ success: true, data: product });
  } catch (err) {
    console.error("Update product error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticate(request);
    await requirePermission(auth, "product:delete");

    // Check product exists
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true, supplierId: true, orderItems: { select: { id: true }, take: 1 } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Non-admin users can only delete their own products
    if (auth.platformRole !== "ADMIN") {
      const user = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { supplierId: true },
      });

      if (!user?.supplierId || user.supplierId !== existing.supplierId) {
        return NextResponse.json(
          { success: false, error: "You can only delete your own products" },
          { status: 403 }
        );
      }
    }

    // Check if product has orders
    if (existing.orderItems.length > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete product with existing orders. Mark as discontinued instead." },
        { status: 400 }
      );
    }

    // Soft delete by marking as DISCONTINUED
    await prisma.product.update({
      where: { id },
      data: { status: "DISCONTINUED" },
    });

    return NextResponse.json({ success: true, data: { message: "Product discontinued" } });
  } catch (err) {
    console.error("Delete product error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to delete product" },
      { status: 500 }
    );
  }
}

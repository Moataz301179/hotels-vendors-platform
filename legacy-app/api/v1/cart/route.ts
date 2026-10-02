import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/api-utils";
import { z } from "zod";

const AddToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(10000),
  notes: z.string().max(500).optional(),
});

/**
 * GET /api/v1/cart
 * Get current user's cart with items
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    const userId = auth.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hotelId: true, tenantId: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    let cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                supplier: { select: { id: true, name: true, city: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          hotelId: user.hotelId || "",
          tenantId: user.tenantId,
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  supplier: { select: { id: true, name: true, city: true } },
                },
              },
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        cart: {
          id: cart.id,
          items: cart.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            notes: item.notes,
            unitPrice: item.unitPrice,
            product: {
              id: item.product.id,
              name: item.product.name,
              sku: item.product.sku,
              category: item.product.category,
              unitPrice: item.product.unitPrice,
              stockQuantity: item.product.stockQuantity,
              supplier: item.product.supplier,
            },
          })),
        },
      },
    });
  } catch (error) {
    console.error("Cart GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load cart" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/cart
 * Add item to cart
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    const body = await request.json();
    const data = AddToCartSchema.parse(body);
    const userId = auth.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hotelId: true, tenantId: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      select: { id: true, unitPrice: true, status: true },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    let cart = await prisma.cart.findFirst({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          hotelId: user.hotelId || "",
          tenantId: user.tenantId,
        },
      });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: data.productId,
      },
    });

    if (existingItem) {
      const updated = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + data.quantity,
          notes: data.notes || existingItem.notes,
        },
      });
      return NextResponse.json({ success: true, data: { item: updated } });
    }

    const cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: data.productId,
        quantity: data.quantity,
        notes: data.notes || null,
        unitPrice: product.unitPrice,
      },
    });

    return NextResponse.json({ success: true, data: { item: cartItem } }, { status: 201 });
  } catch (error) {
    console.error("Cart POST error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: `Invalid input: ${error.issues.map((i) => i.message).join(", ")}` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to add to cart" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/cart
 * Update cart item quantity
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    const body = await request.json();
    const { itemId, quantity } = body;

    if (!itemId || typeof quantity !== "number") {
      return NextResponse.json(
        { success: false, error: "itemId and quantity are required" },
        { status: 400 }
      );
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== auth.userId) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
      return NextResponse.json({ success: true, data: { removed: true } });
    }

    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return NextResponse.json({ success: true, data: { item: updated } });
  } catch (error) {
    console.error("Cart PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update cart" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/cart
 * Clear cart or remove item
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    const cart = await prisma.cart.findFirst({
      where: { userId: auth.userId },
    });

    if (!cart) {
      return NextResponse.json({ success: true, data: { cleared: true } });
    }

    if (itemId) {
      await prisma.cartItem.deleteMany({
        where: { id: itemId, cartId: cart.id },
      });
      return NextResponse.json({ success: true, data: { removed: true } });
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return NextResponse.json({ success: true, data: { cleared: true } });
  } catch (error) {
    console.error("Cart DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear cart" },
      { status: 500 }
    );
  }
}

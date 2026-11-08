import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';
import { PermissionDeniedError, requireAnyPermission } from '@/lib/auth/rbac';

/**
 * Global workspace search — the header's most-used surface.
 *
 * G1: every branch is tenant-scoped. G2: the role's read permissions are
 * re-checked server-side; the client never decides what is searchable.
 * Read-only: no mutation path exists on this route.
 */

const searchSchema = z.object({
  q: z.string().trim().min(1).max(120),
  types: z.string().max(120).optional(),
});

const SEARCHABLE_TYPES = ['products', 'rfqs', 'orders', 'suppliers'] as const;
type SearchableType = (typeof SEARCHABLE_TYPES)[number];

export type SearchResult = {
  type: SearchableType;
  id: string;
  label: string;
  detail: string;
  href: string;
};

const READ_PERMISSIONS = [
  'order:read',
  'product:read',
  'invoice:read',
  'supplier:read',
  'shipping:read',
  'report:read',
] as const;

export async function GET(request: Request) {
  const user = await getActor();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

  try {
    await requireAnyPermission(
      { userId: user.id, tenantId: user.tenantId, platformRole: user.platformRole },
      [...READ_PERMISSIONS],
    );
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return NextResponse.json({ error: 'SEARCH_PERMISSION_REQUIRED' }, { status: 403 });
    }
    throw error;
  }

  const parsed = searchSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: 'SEARCH_QUERY_REQUIRED' }, { status: 400 });
  }

  const q = parsed.data.q;
  const requested = new Set<SearchableType>(
    (parsed.data.types ?? SEARCHABLE_TYPES.join(','))
      .split(',')
      .map((type) => type.trim())
      .filter((type): type is SearchableType => (SEARCHABLE_TYPES as readonly string[]).includes(type)),
  );
  const contains = { contains: q, mode: 'insensitive' as const };
  const results: SearchResult[] = [];

  if (requested.has('products')) {
    const products = await prisma.product.findMany({
      where: { tenantId: user.tenantId, deletedAt: null, OR: [{ name: contains }, { sku: contains }] },
      select: { id: true, name: true, sku: true, category: true },
      orderBy: { name: 'asc' },
      take: 8,
    });
    for (const product of products) {
      results.push({
        type: 'products',
        id: product.id,
        label: product.name,
        detail: `${product.category.replaceAll('_', ' ')} · ${product.sku}`,
        href: '/workspace/marketplace',
      });
    }
  }

  if (requested.has('rfqs')) {
    const rfqs = await prisma.rfqRequest.findMany({
      where: { tenantId: user.tenantId, OR: [{ itemName: contains }, { id: contains }] },
      select: { id: true, itemName: true, status: true, requestedQty: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    for (const rfq of rfqs) {
      results.push({
        type: 'rfqs',
        id: rfq.id,
        label: rfq.itemName ?? 'Sourcing request',
        detail: `${rfq.status.replaceAll('_', ' ')} · qty ${rfq.requestedQty}`,
        href: '/workspace/marketplace',
      });
    }
  }

  if (requested.has('orders')) {
    const orders = await prisma.order.findMany({
      where: { tenantId: user.tenantId, deletedAt: null, OR: [{ orderNumber: contains }, { poNumber: contains }] },
      select: { id: true, orderNumber: true, status: true, poNumber: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    for (const order of orders) {
      results.push({
        type: 'orders',
        id: order.id,
        label: order.orderNumber,
        detail: `${order.status.replaceAll('_', ' ')}${order.poNumber ? ` · PO ${order.poNumber}` : ''}`,
        href: '/orders',
      });
    }
  }

  if (requested.has('suppliers')) {
    const suppliers = await prisma.supplier.findMany({
      where: { tenantId: user.tenantId, deletedAt: null, OR: [{ name: contains }, { taxId: contains }] },
      select: { id: true, name: true, city: true },
      orderBy: { name: 'asc' },
      take: 8,
    });
    for (const supplier of suppliers) {
      results.push({
        type: 'suppliers',
        id: supplier.id,
        label: supplier.name,
        detail: supplier.city,
        href: '/suppliers',
      });
    }
  }

  return NextResponse.json({ results });
}

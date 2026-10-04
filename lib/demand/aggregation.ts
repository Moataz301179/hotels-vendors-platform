import { prisma } from "@/lib/prisma";

export type DemandAggregate = {
  productId: string; sku: string; productName: string; category: string; unitOfMeasure: string;
  supplierCount: number; hotelCount: number; propertyCount: number; requestedQuantity: number;
  currentSpend: number; weightedUnitPrice: number; deliveryFrom: string | null; deliveryTo: string | null;
  locations: string[]; volumeDealSignal: "HIGH" | "MEDIUM" | "LOW";
};

export async function aggregateHotelDemand(tenantId: string, options?: { days?: number; minHotels?: number }): Promise<DemandAggregate[]> {
  const days = Math.min(Math.max(options?.days ?? 30, 7), 180);
  const minHotels = Math.max(options?.minHotels ?? 2, 1);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const items = await prisma.orderItem.findMany({
    where: { deletedAt: null, order: { tenantId, deletedAt: null, createdAt: { gte: since }, status: { notIn: ["DRAFT", "REJECTED", "CANCELLED"] } } },
    select: { quantity: true, unitPrice: true, productId: true, orderId: true },
  });
  if (!items.length) return [];

  const productIds = [...new Set(items.map((item) => item.productId))];
  const orderIds = [...new Set(items.map((item) => item.orderId))];
  const [products, orders] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds }, deletedAt: null, orderItems: { some: { deletedAt: null, order: { tenantId, deletedAt: null } } } }, select: { id: true, sku: true, name: true, category: true, unitOfMeasure: true } }),
    prisma.order.findMany({ where: { id: { in: orderIds }, tenantId, deletedAt: null }, select: { id: true, hotelId: true, propertyId: true, supplierId: true, deliveryDate: true } }),
  ]);

  const propertyIds = [...new Set(orders.map((order) => order.propertyId).filter((id): id is string => Boolean(id)))];
  const properties = propertyIds.length
    ? await prisma.property.findMany({ where: { id: { in: propertyIds }, tenantId, deletedAt: null }, select: { id: true, city: true, governorate: true } })
    : [];

  const productMap = new Map(products.map((product) => [product.id, product]));
  const orderMap = new Map(orders.map((order) => [order.id, order]));
  const propertyMap = new Map(properties.map((property) => [property.id, property]));

  type Group = { productId: string; sku: string; productName: string; category: string; unitOfMeasure: string; hotels: Set<string>; properties: Set<string>; suppliers: Set<string>; locations: Set<string>; quantity: number; spend: number; dates: Date[] };
  const groups = new Map<string, Group>();

  for (const item of items) {
    const product = productMap.get(item.productId);
    const order = orderMap.get(item.orderId);
    if (!product || !order) continue;
    const group = groups.get(product.id) ?? {
      productId: product.id, sku: product.sku, productName: product.name, category: String(product.category), unitOfMeasure: product.unitOfMeasure,
      hotels: new Set<string>(), properties: new Set<string>(), suppliers: new Set<string>(), locations: new Set<string>(), quantity: 0, spend: 0, dates: [],
    };
    const quantity = Number(item.quantity || 0);
    group.quantity += quantity;
    group.spend += quantity * Number(item.unitPrice || 0);
    group.hotels.add(order.hotelId);
    group.suppliers.add(order.supplierId);
    if (order.propertyId) {
      group.properties.add(order.propertyId);
      const property = propertyMap.get(order.propertyId);
      if (property) {
        const location = [property.city, property.governorate].filter(Boolean).join(", ");
        if (location) group.locations.add(location);
      }
    }
    if (order.deliveryDate) group.dates.push(order.deliveryDate);
    groups.set(product.id, group);
  }

  return [...groups.values()].filter((group) => group.hotels.size >= minHotels).map((group) => {
    const average = group.quantity ? group.spend / group.quantity : 0;
    const signal = group.hotels.size >= 5 || group.quantity >= 500 ? "HIGH" : group.hotels.size >= 3 || group.quantity >= 200 ? "MEDIUM" : "LOW";
    return {
      productId: group.productId, sku: group.sku, productName: group.productName, category: group.category, unitOfMeasure: group.unitOfMeasure,
      supplierCount: group.suppliers.size, hotelCount: group.hotels.size, propertyCount: group.properties.size, requestedQuantity: group.quantity,
      currentSpend: Number(group.spend.toFixed(2)), weightedUnitPrice: Number(average.toFixed(2)),
      deliveryFrom: group.dates.length ? new Date(Math.min(...group.dates.map((date) => date.getTime()))).toISOString() : null,
      deliveryTo: group.dates.length ? new Date(Math.max(...group.dates.map((date) => date.getTime()))).toISOString() : null,
      locations: [...group.locations].sort(), volumeDealSignal: signal as "HIGH" | "MEDIUM" | "LOW",
    };
  }).sort((a, b) => b.currentSpend - a.currentSpend);
}

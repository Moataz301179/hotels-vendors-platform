/**
 * Carrier Auto-Assignment Engine
 * Matches orders to carriers based on zone, capacity, and rating.
 *
 * Flow: Order placed → Platform finds eligible carriers → Auto-assigns best match → Notifies carrier
 */

import { prisma } from "@/lib/prisma";

interface AssignmentResult {
  carrierId: string;
  carrierName: string;
  tripId: string | null;
  estimatedDelivery: Date;
  score: number;
  reason: string;
}

interface CarrierProfile {
  id: string;
  name: string;
  rating: number;
  vehicleCount: number;
  zones: string[];
  activeTrips: number;
  maxCapacity: number;
  completedTrips: number;
  onTimeRate: number;
}

/**
 * Find the best carrier for an order based on delivery zone, capacity, and rating.
 */
export async function assignCarrier(
  orderId: string,
  tenantId: string
): Promise<AssignmentResult | null> {
  // 1. Load order with hotel location
  const order = await prisma.order.findUnique({
    where: { id: orderId, tenantId },
    include: {
      hotel: { select: { city: true, governorate: true, id: true } },
      items: { include: { product: true } },
    },
  });

  if (!order) throw new Error("Order not found");
  if (!order.hotel) throw new Error("Order has no hotel");

  const deliveryCity = order.hotel.city;
  const deliveryGovernorate = order.hotel.governorate;
  const orderTotal = Number(order.total ?? 0);

  // 2. Find eligible carriers (active, with matching zone)
  const carriers = await prisma.user.findMany({
    where: {
      tenantId,
      role: "LOGISTICS_COORDINATOR",
      status: "ACTIVE",
    },
    include: {
      carrierProfile: true,
    },
  });

  if (carriers.length === 0) return null;

  // 3. Score each carrier
  const scored: Array<{ carrier: typeof carriers[0]; score: number; reason: string }> = [];

  for (const carrier of carriers) {
    const profile = carrier.carrierProfile;
    if (!profile) continue;

    const zones = (profile.zones as string[]) ?? [];
    const zoneMatch = zones.includes(deliveryCity) || zones.includes(deliveryGovernorate) || zones.includes("ALL");
    if (!zoneMatch) continue;

    const activeTrips = await prisma.trip.count({
      where: { driverName: carrier.name, status: { in: ["SCHEDULED", "LOADING", "IN_TRANSIT"] } },
    });

    const maxCapacity = profile.vehicleCount ?? 1;
    if (activeTrips >= maxCapacity * 3) continue; // Capacity full (3 trips per vehicle max)

    const completedTrips = await prisma.trip.count({
      where: { driverName: carrier.name, status: "COMPLETED" },
    });

    const recentTrips = await prisma.trip.findMany({
      where: { driverName: carrier.name, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 20,
    });

    const onTimeCount = recentTrips.filter((t) => {
      if (!t.arrivalDate || !t.scheduledDate) return true;
      return new Date(t.arrivalDate) <= new Date(t.scheduledDate);
    }).length;
    const onTimeRate = recentTrips.length > 0 ? onTimeCount / recentTrips.length : 0.8;

    // Score calculation (0-100)
    let score = 0;
    let reason = "";

    // Zone proximity (0-30 points)
    if (zones.includes(deliveryCity)) {
      score += 30;
      reason = "City match";
    } else if (zones.includes(deliveryGovernorate)) {
      score += 20;
      reason = "Governorate match";
    } else {
      score += 10;
      reason = "National coverage";
    }

    // Rating (0-25 points)
    const rating = profile.rating ?? 3.0;
    score += (rating / 5) * 25;
    if (rating >= 4.5) reason += ", top rated";

    // On-time rate (0-25 points)
    score += onTimeRate * 25;
    if (onTimeRate >= 0.95) reason += ", excellent punctuality";

    // Capacity availability (0-15 points)
    const capacityUsed = activeTrips / (maxCapacity * 3);
    score += (1 - capacityUsed) * 15;
    if (capacityUsed < 0.3) reason += ", available";

    // Experience (0-5 points)
    if (completedTrips >= 100) score += 5;
    else if (completedTrips >= 50) score += 3;
    else if (completedTrips >= 10) score += 1;

    scored.push({ carrier, score, reason });
  }

  if (scored.length === 0) return null;

  // 4. Pick the best carrier
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  // 5. Calculate estimated delivery (zone-based)
  const deliveryZone = await prisma.deliveryZone.findFirst({
    where: {
      zone: deliveryCity,
      tenantId,
    },
  });

  const minDays = deliveryZone?.minDays ?? 2;
  const maxDays = deliveryZone?.maxDays ?? 5;
  const estimatedDays = Math.ceil((minDays + maxDays) / 2);
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + estimatedDays);

  // 6. Find or create a trip for this carrier
  let trip = await prisma.trip.findFirst({
    where: {
      driverName: best.carrier.name,
      status: "SCHEDULED",
      tenantId,
      scheduledDate: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
        lt: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    },
  });

  if (!trip) {
    const tripNumber = `TRP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    trip = await prisma.trip.create({
      data: {
        tripNumber,
        hubId: null,
        driverName: best.carrier.name,
        driverPhone: best.carrier.phone ?? "",
        vehiclePlate: `VH-${Date.now().toString(36).toUpperCase()}`,
        scheduledDate: estimatedDelivery,
        status: "SCHEDULED",
        tenantId,
      },
    });
  }

  // 7. Create trip stop for this order
  await prisma.tripStop.create({
    data: {
      tripId: trip.id,
      hotelId: order.hotelId,
      orderId: order.id,
      tenantId,
      stopOrder: 1,
      stopNumber: 1,
      estimatedArrival: estimatedDelivery,
      status: "PENDING",
    },
  });

  // 8. Update order with shipping info
  await prisma.order.update({
    where: { id: orderId },
    data: {
      shippingMethod: "PLATFORM_ASSIGNED",
      estimatedDelivery,
      deliveryAddress: order.hotel.city,
    },
  });

  return {
    carrierId: best.carrier.id,
    carrierName: best.carrier.name,
    tripId: trip.id,
    estimatedDelivery,
    score: Math.round(best.score * 10) / 10,
    reason: best.reason,
  };
}

/**
 * Batch assign multiple orders to carriers.
 */
export async function batchAssign(
  orderIds: string[],
  tenantId: string
): Promise<Array<{ orderId: string; result: AssignmentResult | null; error?: string }>> {
  const results: Array<{ orderId: string; result: AssignmentResult | null; error?: string }> = [];

  for (const orderId of orderIds) {
    try {
      const result = await assignCarrier(orderId, tenantId);
      results.push({ orderId, result });
    } catch (err) {
      results.push({ orderId, result: null, error: (err as Error).message });
    }
  }

  return results;
}

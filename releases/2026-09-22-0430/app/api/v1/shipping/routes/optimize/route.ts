import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error, requirePermission } from "@/lib/api-utils";
import { z } from "zod";

const OptimizeSchema = z.object({
  tripId: z.string().cuid(),
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);

  await requirePermission(auth, "shipping:read");

  const body = await request.json();
  const data = OptimizeSchema.parse(body);

  const trip = await prisma.trip.findUnique({
    where: { id: data.tripId },
    include: { stops: { include: { hotel: true } } },
  });

  if (!trip || trip.tenantId !== auth.tenantId) {
    return error("Trip not found", 404);
  }
  if (trip.stops.some((s) => s.tenantId !== auth.tenantId)) {
    return error("Trip not found", 404);
  }

  // Simple greedy nearest-neighbor TSP approximation
  const stops = trip.stops;
  const unvisited = [...stops];
  const route: typeof stops = [];

  // Start from hub location (Cairo as default)
  let current = { city: "Cairo", governorate: "Cairo" };

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = cityDistance(current.city, unvisited[i].hotel?.city || "Cairo");
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }

    const next = unvisited.splice(nearestIdx, 1)[0];
    route.push(next);
    current = { city: next.hotel?.city || "Cairo", governorate: next.hotel?.governorate || "Cairo" };
  }

  // Update stop numbers
  await prisma.$transaction(
    route.map((stop, idx) =>
      prisma.tripStop.update({
        where: { id: stop.id },
        data: { stopNumber: idx + 1 },
      })
    )
  );

  return success({ optimizedRoute: route.map((s, i) => ({ stopId: s.id, stopNumber: i + 1, hotel: s.hotel?.name })) });
});

// Simplified distance heuristic for Egyptian cities
function cityDistance(a: string, b: string): number {
  const distances: Record<string, Record<string, number>> = {
    Cairo: { Alexandria: 220, "6th of October": 32, "10th of Ramadan": 60, Giza: 20, Luxor: 650, Aswan: 850, "Sharm El-Sheikh": 500, Hurghada: 450, "North Coast": 300 },
    Alexandria: { Cairo: 220, "North Coast": 80 },
    Giza: { Cairo: 20, "6th of October": 25 },
    "6th of October": { Cairo: 32, Giza: 25, "10th of Ramadan": 50 },
    "10th of Ramadan": { Cairo: 60, "6th of October": 50 },
    Hurghada: { Cairo: 450, "Sharm El-Sheikh": 110 },
    "Sharm El-Sheikh": { Cairo: 500, Hurghada: 110 },
    Luxor: { Cairo: 650, Aswan: 200 },
    Aswan: { Cairo: 850, Luxor: 200 },
    "North Coast": { Cairo: 300, Alexandria: 80 },
  };

  if (a === b) return 0;
  const d = distances[a]?.[b] || distances[b]?.[a];
  return d || 100; // Default fallback
}

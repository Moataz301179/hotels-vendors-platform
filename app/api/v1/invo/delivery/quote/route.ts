import { NextRequest } from "next/server";
import { z } from "zod";
import { apiRoute, authenticate, requirePermission, validateBody, error } from "@/lib/api-utils";
const Location = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), name: z.string().min(1).max(200) });
const QuoteInput = z.object({ pickup: Location, dropoff: Location, weightKg: z.number().positive(), volumeM3: z.number().positive(), urgency: z.enum(["standard", "same_day", "express"]).default("standard") });
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request); await requirePermission(auth, "shipping:read");
  validateBody(QuoteInput, await request.json());
  return error("A verified carrier rate source is required before a binding delivery quote can be issued.", 503);
});

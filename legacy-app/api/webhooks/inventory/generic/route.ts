import { NextRequest } from "next/server";
import { z } from "zod";
import { processInventorySync } from "@/lib/inventory/sync";
import { success, error } from "@/lib/api-utils";
import { isWebhookIpAllowed, getClientIp } from "@/lib/security/webhook-whitelist";

const InventoryWebhookSchema = z.object({
  tenantId: z.string().min(1),
  sku: z.string().min(1),
  productName: z.string().optional(),
  quantityAvailable: z.number().int().min(0),
  unitOfMeasure: z.string().optional(),
  price: z.number().optional(),
  currency: z.string().optional(),
  warehouseLocation: z.string().optional(),
  lastUpdated: z.string().datetime(),
});

/**
 * Generic Inventory Webhook Receiver
 * AGENTS.md G5: Inventory sync via REST + Webhooks only (no WebSockets)
 *
 * POST /api/webhooks/inventory/generic
 * Accepts inventory updates from any ERP/PMS system.
 */
export async function POST(request: NextRequest) {
  try {
    // IP whitelisting — reject webhooks from untrusted sources
    const clientIp = getClientIp(request);
    if (!isWebhookIpAllowed(clientIp, "generic")) {
      return error("Forbidden: untrusted webhook source", 403);
    }

    const body = await request.json();
    const data = InventoryWebhookSchema.parse(body);

    const result = await processInventorySync({
      provider: "generic",
      ...data,
    });

    return success(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error(`Validation error: ${err.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`, 400);
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return error(`Webhook processing failed: ${message}`, 502);
  }
}

/**
 * Inventory Sync Orchestrator
 * Hotels Vendors Integration Layer
 *
 * AGENTS.md G5: NO WEBSOCKETS for inventory. Use REST APIs and inbound Webhooks.
 * This module coordinates inventory synchronization between the platform
 * and external ERP/PMS systems (Opera, SAP, generic REST).
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export interface InventorySyncPayload {
  provider: string; // "opera" | "sap" | "generic"
  tenantId: string;
  sku: string;
  productName?: string;
  quantityAvailable: number;
  unitOfMeasure?: string;
  price?: number;
  currency?: string;
  warehouseLocation?: string;
  lastUpdated: string; // ISO 8601
}

export interface SyncResult {
  success: boolean;
  productId?: string;
  action: "CREATED" | "UPDATED" | "NOOP";
  message: string;
}

/**
 * Process an inventory sync payload from an external provider.
 * Tenant-scoped and audit-logged.
 */
export async function processInventorySync(
  payload: InventorySyncPayload
): Promise<SyncResult> {
  const { tenantId, sku, provider } = payload;

  // Validate tenant scoping
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  // Find existing product by SKU within tenant
  const product = await prisma.product.findFirst({
    where: { sku, tenantId },
  });

  if (!product) {
    // Do not auto-create: external inventory sync should only update existing products
    return {
      success: false,
      action: "NOOP",
      message: `Product ${sku} not found in tenant ${tenantId}. Create product before syncing inventory.`,
    };
  }

  // Update stock quantity if changed
  if (product.stockQuantity !== payload.quantityAvailable) {
    await prisma.product.update({
      where: { id: product.id },
      data: {
        stockQuantity: payload.quantityAvailable,
        unitPrice: payload.price ?? product.unitPrice,
        updatedAt: new Date(payload.lastUpdated),
      },
    });

    await logger.info({ event: "inventory_sync_updated", tenantId, sku, provider, oldQty: product.stockQuantity, newQty: payload.quantityAvailable });

    return {
      success: true,
      productId: product.id,
      action: "UPDATED",
      message: `Product ${sku} stock updated to ${payload.quantityAvailable}`,
    };
  }

  return {
    success: true,
    productId: product.id,
    action: "NOOP",
    message: `Product ${sku} already up to date`,
  };
}

/**
 * Batch sync multiple inventory items.
 */
export async function batchInventorySync(
  payloads: InventorySyncPayload[]
): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  for (const payload of payloads) {
    try {
      const result = await processInventorySync(payload);
      results.push(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      results.push({ success: false, action: "NOOP", message });
    }
  }
  return results;
}

/**
 * Buyer-safe catalog projection.
 *
 * The raw dock holds commercial reality: which supplier listed an item, and at
 * what price. That is private operational data and never reaches a buyer.
 *
 * When the agent stages a listing onto the catalog, the record is projected
 * through this module so that:
 *   - the real supplier is replaced by a tenant-scoped masked supplier;
 *   - the price is dropped entirely;
 *   - the source attribution is dropped.
 *
 * The private supplier/price stays in the dock and in the audit trail, where
 * authorized operators can use it for RFQ matching and reconciliation.
 */

import { prisma } from "@/lib/prisma";
import { randomUUID } from "node:crypto";

/** The placeholder supplier used for neutral catalog records. */
export const MASKED_SUPPLIER_NAME = "HotelsVendors Catalog";
export const MASKED_SUPPLIER_TAX_ID = "MASKED-CATALOG";

/**
 * Return the tenant's masked supplier, creating it if needed.
 *
 * It is deliberately never marked verified: it is not a real supplier, it is
 * the absence of a supplier identity in a buyer-facing record.
 */
export async function getMaskedSupplier(tenantId: string): Promise<{ id: string }> {
  const existing = await prisma.supplier.findFirst({
    where: { tenantId, taxId: MASKED_SUPPLIER_TAX_ID },
    select: { id: true },
  });
  if (existing) return existing;

  return prisma.supplier.create({
    data: {
      id: randomUUID(),
      tenantId,
      name: MASKED_SUPPLIER_NAME,
      taxId: MASKED_SUPPLIER_TAX_ID,
      city: "Masked",
      governorate: "Masked",
      email: `masked-catalog@${tenantId.slice(0, 8)}.internal`,
      status: "ACTIVE",
      isVerified: false,
    },
    select: { id: true },
  });
}

/**
 * Build the buyer-safe field set for a staged dock item.
 *
 * Explicitly omits: supplier identity, price, source URL, source hash.
 * Returns only what a neutral catalog listing may carry.
 */
export function buyerSafeFields(params: {
  itemName: string;
  technicalSpecs?: Record<string, unknown>;
  imageUrls?: string[];
}): {
  name: string;
  specs: string;
  images: string | null;
} {
  // specs are kept because they are product facts, not commercial facts.
  // The private provenance block is stripped.
  const publicSpecs: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params.technicalSpecs ?? {})) {
    if (key === "sourceUrl" || key === "sourceHash" || key === "unverified") continue;
    publicSpecs[key] = value;
  }

  return {
    name: params.itemName,
    specs: JSON.stringify(publicSpecs),
    images: params.imageUrls?.length ? params.imageUrls[0] : null,
  };
}

/** True when a product record carries no supplier identity and no price. */
export function isBuyerSafeProduct(row: {
  supplierId: string | null;
  unitPrice: unknown;
  sourceKey?: string | null;
}): boolean {
  return row.supplierId === null && row.unitPrice == null && !row.sourceKey;
}

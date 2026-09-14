/**
 * /api/v1/aggregator
 *
 * POST /api/v1/aggregator/ingest     — vendor feed → masked catalog rows (delta sync)
 * POST /api/v1/aggregator/checkout    — split basket → supplier POs + stock locks + unified ETA invoice
 *
 * Single Merchant of Record for the buying hotel chain.
 */

import { NextRequest } from "next/server";
import { apiRoute, authenticate, success, error } from "@/lib/api-utils";
import { maskSku, maskUrl, applyMargin, splitOrder, createStockLocks, buildUnifiedInvoice, round2 } from "@/lib/dropshipping/aggregator";

/* In-memory registry of known vendor feeds + masked catalog (production: DB). */
const maskedCatalog = new Map<string, { maskedSku: string; title: string; category: string; hotelPrice: number; vendorId: string }>();
const vendorRegistry = new Map<string, { name: string; platformFeePct: number }>();

function registerVendor(id: string, name: string, feePct: number) {
  if (!vendorRegistry.has(id)) vendorRegistry.set(id, { name, platformFeePct: feePct });
  return vendorRegistry.get(id)!;
}

async function ingestFeed(tenantId: string, vendorId: string, items: any[]) {
  const vendor = registerVendor(vendorId, items[0]?.vendorName || vendorId, items[0]?.platformFeePct || 8);
  let created = 0; let updated = 0;
  for (const it of items) {
    const maskedSku = maskSku(it.sku || it.title, vendorId);
    const existing = maskedCatalog.get(maskedSku);
    // Apply dynamic margin
    const { hotelPrice } = applyMargin({ wholesaleCost: Number(it.priceEGP) || 0, category: it.category || "CONSUMABLES", platformFeePct: vendor.platformFeePct });
    const entry = {
      maskedSku, title: it.title, category: it.category || "CONSUMABLES",
      hotelPrice, vendorId, vendorName: vendor.name,
    };
    maskedCatalog.set(maskedSku, entry);
    if (existing) updated++; else created++;
  }
  return { created, updated, total: maskedCatalog.size };
}

/* POST /ingest */
export async function POST_ingest(request: NextRequest) {
  const auth = await authenticate(request);
  const body = await request.json();
  const vendorId = (body.vendorId as string) || "";
  const items = Array.isArray(body.items) ? body.items : [];
  if (!vendorId) return error("vendorId is required", 400);
  if (items.length === 0) return error("items[] required", 400);
  const res = await ingestFeed(auth.tenantId, vendorId, items);
  return success({ vendorId, ...res, message: `Ingested ${res.created} new + ${res.updated} updated masked SKUs.` }, 201);
}

/* POST /checkout */
export async function POST_checkout(request: NextRequest) {
  const auth = await authenticate(request);
  const body = await request.json();
  const lines = Array.isArray(body.lines) ? body.lines : [];
  if (lines.length === 0) return error("lines[] required", 400);

  const basket = lines.map((l: any) => {
    const entry = maskedCatalog.get(l.sku);
    if (!entry) throw Object.assign(new Error(`Unknown masked SKU ${l.sku}`), { status: 404 });
    return { productId: entry.maskedSku, sku: l.sku, qty: Number(l.qty) || 1, supplierId: entry.vendorId, unitPrice: entry.hotelPrice };
  });

  const orderRef = `ORD-${Date.now().toString(36).toUpperCase()}`;
  const pos = splitOrder(basket);
  const locks = createStockLocks(basket, orderRef);
  const invoice = buildUnifiedInvoice(orderRef, basket.map((b: { sku: string; qty: number; unitPrice: number }) => ({ sku: b.sku, qty: b.qty, unitPriceEGP: b.unitPrice, taxPct: 14 })));

  const posArr = [...pos.values()].map((po) => ({ ...po, totalEGP: round2(po.totalEGP) }));

  return success({
    orderRef,
    splitInto: posArr.length,
    purchaseOrders: posArr,
    inventoryLocks: locks,
    unifiedInvoice: invoice,
    totalEGP: invoice.total,
    merchantOfRecord: "HotelsVendors",
    facts: {
      etaInvoiceId: `ETA-${invoice.orderRef}`,
      factoring: { provider: "Oliv", promo: "CHV000", settlement: "48h", amountEGP: invoice.total },
    },
  }, 201);
}

/* Route dispatcher — /:action */
export const POST = apiRoute(async (request: NextRequest, { params }: { params: { action: string } }) => {
  if (params.action === "ingest") return POST_ingest(request);
  if (params.action === "checkout") return POST_checkout(request);
  return new Response(JSON.stringify({ success: false, error: "Unknown action" }), { status: 404, headers: { "Content-Type": "application/json" } });
});

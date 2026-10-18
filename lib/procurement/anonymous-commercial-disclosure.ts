import type { MarketOfferObservation } from "@/lib/sourcing/scrapegraph-discovery";

type MarketComparison = {
  query: string;
  observedAt: string;
  offers: MarketOfferObservation[];
};

/**
 * Buyer-facing research is intentionally detached from source identity. The
 * complete observation remains in EvidenceRecord for authorized audit work.
 */
export function toAnonymousMarketComparison(comparison: MarketComparison) {
  return {
    query: comparison.query,
    observedAt: comparison.observedAt,
    offers: comparison.offers.map((offer, index) => ({
      reference: `Comparable offer ${String(index + 1).padStart(2, "0")}`,
      productName: offer.productName,
      unitPrice: offer.unitPrice ?? null,
      currency: offer.currency,
      packSize: offer.packSize,
      leadTimeDays: offer.leadTimeDays ?? null,
    })),
  };
}

type QuoteForBuyer = {
  id: string;
  quantity: number;
  unitPrice: unknown;
  currency: string;
  deliveryFee: unknown;
  taxAmount: unknown;
  leadTimeDays?: number | null;
  validUntil?: Date | null;
  rfq: {
    id: string;
    requestedQty: number;
    status: string;
    product: { id: string; name: string; sku: string; unitOfMeasure: string } | null;
  };
};

/** Never pass a Prisma quote object directly to a hotel response. */
export function toAnonymousQuoteComparison(quote: QuoteForBuyer, index: number, cost: unknown) {
  return {
    id: quote.id,
    reference: `Comparable offer ${String(index + 1).padStart(2, "0")}`,
    quantity: quote.quantity,
    unitPrice: quote.unitPrice,
    currency: quote.currency,
    deliveryFee: quote.deliveryFee,
    taxAmount: quote.taxAmount,
    leadTimeDays: quote.leadTimeDays ?? null,
    validUntil: quote.validUntil ?? null,
    rfq: {
      id: quote.rfq.id,
      requestedQty: quote.rfq.requestedQty,
      status: quote.rfq.status,
      product: quote.rfq.product,
    },
    cost,
  };
}

export function toAnonymousCatalogProduct(product: {
  id: string;
  uuid?: string | null;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  unitOfMeasure: string;
  images?: string | null;
}) {
  return {
    id: product.id,
    uuid: product.uuid ?? null,
    sku: product.sku,
    name: product.name,
    description: product.description,
    category: product.category,
    unitOfMeasure: product.unitOfMeasure,
    requestForQuote: true,
  };
}

/**
 * A hotel can track its own request, but must not receive the private
 * fulfillment-source linkage that operations use to route it internally.
 */
export function toBuyerSafeRfqRequest(rfq: {
  id: string;
  itemName: string | null;
  unitOfMeasure: string | null;
  deliveryLocation: string | null;
  packDescription: string | null;
  requestedQty: number;
  targetPrice: unknown;
  deliveryTimeline: string | null;
  specialReq: string | null;
  notes: string | null;
  status: string;
  matchingStatus: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: rfq.id,
    itemName: rfq.itemName,
    unitOfMeasure: rfq.unitOfMeasure,
    deliveryLocation: rfq.deliveryLocation,
    packDescription: rfq.packDescription,
    requestedQty: rfq.requestedQty,
    targetPrice: rfq.targetPrice,
    deliveryTimeline: rfq.deliveryTimeline,
    specialReq: rfq.specialReq,
    notes: rfq.notes,
    status: rfq.status,
    matchingStatus: rfq.matchingStatus,
    createdAt: rfq.createdAt,
    updatedAt: rfq.updatedAt,
  };
}

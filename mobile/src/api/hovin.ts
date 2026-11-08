export type MobileIdentity = {
  id: string;
  name: string | null;
  email: string | null;
  platformRole: string;
  tenantId: string;
};

export type MobileContextUser = MobileIdentity & {
  role: string;
  hotelId: string | null;
  supplierId: string | null;
  departmentId: string | null;
  permissions: string[];
};

export type ReceivingHandoff = {
  orderId: string;
  orderNumber: string;
  status: 'IN_TRANSIT' | 'PARTIALLY_DELIVERED';
  estimatedDelivery: string | null;
  lineCount: number;
  remainingQuantity: number;
  receiptContextPath: string;
};

export type ReceiptLine = {
  id: string;
  quantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  product: { id: string; name: string; sku: string | null; unitOfMeasure: string | null };
};

export type ReceiptContext = {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    estimatedDelivery: string | null;
    canRecordReceipt: boolean;
    items: ReceiptLine[];
  };
  receiptEndpoint: '/api/v2/grn';
};

export type ReceiptSubmission = {
  orderId: string;
  lines: Array<{
    orderItemId: string;
    receivedQuantity: number;
    acceptedQuantity: number;
    rejectionReason?: string | null;
    conditionNotes?: string | null;
  }>;
  evidenceUrls?: string[];
};

export type CountableProduct = {
  id: string;
  name: string;
  sku: string | null;
  unitOfMeasure: string | null;
};

/** Anonymous buyer catalog record (no supplier identity, no price, no provenance). */
export type CatalogProduct = {
  id: string;
  uuid: string | null;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  unitOfMeasure: string;
  requestForQuote: boolean;
  images?: string[] | null;
};

/** Buyer-safe RFQ view; supplier view adds the matched product. */
export type RfqRecord = {
  id: string;
  itemName: string | null;
  unitOfMeasure: string | null;
  deliveryLocation: string | null;
  packDescription: string | null;
  requestedQty: number;
  targetPrice: number | null;
  deliveryTimeline: string | null;
  specialReq: string | null;
  notes: string | null;
  responseDeadline: string | null;
  procurementMethod: string;
  status: string;
  matchingStatus: string;
  createdAt: string;
  updatedAt: string;
  product?: { id: string; name: string; sku: string | null; unitOfMeasure: string | null } | null;
};

export type CostBreakdown = {
  productCost: number | null;
  deliveryCost: number | null;
  taxCost: number | null;
  totalCost: number | null;
  totalCostState: 'KNOWN' | 'INCOMPLETE';
};

/** Anonymous hotel comparison view; supplier view is the raw quote. */
export type QuoteRecord = {
  id: string;
  reference?: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  deliveryFee: number | null;
  taxAmount: number | null;
  leadTimeDays: number | null;
  validUntil: string | null;
  status?: string;
  rfq: { id: string; requestedQty: number; status: string; product?: { id: string; name: string; sku: string | null; unitOfMeasure: string | null } | null };
  cost?: CostBreakdown;
};

export type OrderRecord = {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  total: number | null;
  subtotal: number | null;
  vatAmount: number | null;
  shippingCost: number | null;
  paymentGuaranteed: boolean;
  estimatedDelivery: string | null;
  createdAt: string;
  allowedActions: string[];
  supplier?: { name: string; city?: string | null; isVerified?: boolean | null } | null;
  hotel?: { name: string } | null;
  items?: Array<{ id: string; quantity: number; receivedQuantity: number | null; product: { name: string; sku: string | null; unitOfMeasure: string | null } }>;
  receipts?: Array<{ id: string; grnNumber: string; status: string; receivedAt: string | null }>;
};

export type NotificationRecord = {
  id: string;
  type: string;
  channel: string;
  subject: string | null;
  body: string | null;
  readAt: string | null;
  createdAt: string;
};

export class HovinApiError extends Error {
  constructor(public readonly status: number, public readonly code: string) {
    super(code);
  }
}

export type OriginConfigState =
  | { ok: true; origin: string }
  | { ok: false; code: 'HOVIN_API_ORIGIN_NOT_CONFIGURED' | 'HOVIN_API_ORIGIN_INVALID' | 'HOVIN_API_ORIGIN_INSECURE'; message: string };

function isPrivateHost(hostname: string) {
  return /^(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(hostname);
}

/**
 * Fail closed. There is deliberately no default host: a missing or invalid
 * EXPO_PUBLIC_HOVIN_API_ORIGIN must stop requests rather than silently reach
 * production. Only HTTPS origins are accepted, except an explicit local
 * development origin while running under the development bundler.
 */
export function resolveOrigin(): OriginConfigState {
  const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
  const candidate = process.env.EXPO_PUBLIC_HOVIN_API_ORIGIN?.trim();
  if (!candidate) {
    return {
      ok: false,
      code: 'HOVIN_API_ORIGIN_NOT_CONFIGURED',
      message:
        'This build has no authorized API origin. Set EXPO_PUBLIC_HOVIN_API_ORIGIN before testing; the app will not fall back to any default host.',
    };
  }
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return {
      ok: false,
      code: 'HOVIN_API_ORIGIN_INVALID',
      message: 'EXPO_PUBLIC_HOVIN_API_ORIGIN is not a valid URL. Requests are stopped.',
    };
  }
  if (url.protocol === 'https:') return { ok: true, origin: url.origin };
  if (isDev && url.protocol === 'http:' && isPrivateHost(url.hostname)) {
    return { ok: true, origin: url.origin };
  }
  return {
    ok: false,
    code: 'HOVIN_API_ORIGIN_INSECURE',
    message: 'The authorized API origin must be HTTPS outside a local development build. Requests are stopped.',
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null) as { error?: unknown } | null;
  if (!response.ok) {
    throw new HovinApiError(response.status, typeof body?.error === 'string' ? body.error : 'REQUEST_FAILED');
  }
  return body as T;
}

export type CreateRfqInput = {
  productId?: string;
  contractBaselineId?: string;
  itemName?: string;
  unitOfMeasure?: string;
  quantity: number;
  deliveryLocation?: string;
  packDescription?: string;
  targetPrice?: number;
  deliveryTimeline?: string;
  responseWindowHours?: number;
  specialReq?: string;
  notes?: string;
};

export type SubmitQuoteInput = {
  rfqId: string;
  unitPrice: number;
  quantity: number;
  deliveryFee: number;
  taxAmount: number;
  leadTimeDays?: number;
  validUntil?: string;
  notes?: string;
};

export function createHovinClient(getToken: () => Promise<string | null>) {
  // Resolve once so a misconfigured build fails before any request is sent.
  const origin = resolveOrigin();
  if (!origin.ok) throw new HovinApiError(0, origin.code);
  const apiOrigin = origin.origin;

  async function request<T>(path: string, init: RequestInit = {}) {
    const token = await getToken();
    if (!token) throw new HovinApiError(401, 'SESSION_TOKEN_UNAVAILABLE');
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Accept', 'application/json');
    return parseResponse<T>(await fetch(`${apiOrigin}${path}`, { ...init, headers }));
  }

  return {
    context: () => request<{ user: MobileContextUser }>('/api/v2/mobile/context'),
    identity: () => request<{ user: MobileIdentity }>('/api/v2/me'),
    marketplace: (query: string) =>
      request<{ products: CatalogProduct[] }>(`/api/v2/marketplace${query ? `?q=${encodeURIComponent(query)}` : ''}`),
    createRfq: (input: CreateRfqInput, idempotencyKey: string) =>
      request<{ rfq: RfqRecord; idempotent?: boolean }>('/api/v2/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-idempotency-key': idempotencyKey },
        body: JSON.stringify(input),
      }),
    rfqs: () => request<{ rfqs: RfqRecord[] }>('/api/v2/rfq'),
    quotes: () => request<{ quotes: QuoteRecord[] }>('/api/v2/quotes'),
    submitQuote: (input: SubmitQuoteInput) =>
      request<{ quote: QuoteRecord; cost: CostBreakdown }>('/api/v2/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    acceptQuote: (quoteId: string, exceptionReason?: string) =>
      request<{ order: OrderRecord }>('/api/v2/quotes/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId, exceptionReason }),
      }),
    orders: () => request<{ orders: OrderRecord[] }>('/api/v2/orders'),
    order: (orderId: string) => request<{ order: OrderRecord }>(`/api/v2/orders/${encodeURIComponent(orderId)}`),
    transitionOrder: (orderId: string, status: string, estimatedDelivery?: string) =>
      request<{ updated: boolean; approvalRecorded?: boolean; awaitingApproval?: boolean; remainingApproverIds?: string[] }>(
        '/api/v2/orders',
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: orderId, status, estimatedDelivery }) },
      ),
    notifications: () => request<{ notifications: NotificationRecord[]; unread: number; channels: Record<string, boolean> }>('/api/v2/notifications'),
    markNotificationRead: (notificationId: string) =>
      request<{ ok: boolean }>('/api/v2/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      }),
    handoffs: () => request<{ handoffs: ReceivingHandoff[] }>('/api/v2/mobile/receipts'),
    receiptContext: (orderId: string) => request<ReceiptContext>(`/api/v2/mobile/receipts/${encodeURIComponent(orderId)}`),
    submitReceipt: (payload: ReceiptSubmission, idempotencyKey: string) => request<{ grn: { id: string; grnNumber: string; status: string }; idempotent?: boolean }>('/api/v2/grn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-idempotency-key': idempotencyKey },
      body: JSON.stringify({ ...payload, evidenceUrls: payload.evidenceUrls ?? [] }),
    }),
    resolveBarcode: (barcode: string) => request<{ product: CountableProduct; barcode: string; captureRule: 'EXPLICIT_HUMAN_QUANTITY_REQUIRED' }>(`/api/v2/inventory/counts?barcode=${encodeURIComponent(barcode)}`),
    submitPhysicalCount: (payload: { productId: string; clientSubmissionId: string; observedQuantity: number; barcode?: string; capturedAt: string }) => request<{ count: { id: string; status: 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED'; observedQuantity: number; capturedAt: string }; message: string }>('/api/v2/inventory/counts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  };
}

export type HovinClient = ReturnType<typeof createHovinClient>;

export function isRetryableReceiptFailure(error: unknown) {
  return !(error instanceof HovinApiError) || error.status >= 500;
}

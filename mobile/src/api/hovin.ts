export type MobileIdentity = {
  id: string;
  name: string | null;
  email: string | null;
  platformRole: string;
  tenantId: string;
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
  evidenceFileIds?: string[];
};

export type CountableProduct = {
  id: string;
  name: string;
  sku: string | null;
  unitOfMeasure: string | null;
};

export type PhoneAccount = {
  id: string;
  name: string | null;
  email: string | null;
  platformRole: string;
  role: string;
  tenantId: string;
};

export type PhonePlan = {
  workspace: "hotel" | "supplier" | "carrier-code" | "desk";
  title: string;
  summary: string;
  deskPath: string;
  capabilities: string[];
  withheld: string[];
};

export type PhoneProposal = {
  action: "receive" | "confirm-code" | "respond" | "compare" | "track" | "request" | "desk" | "wait";
  targetId: string | null;
  evidence: Array<{ key: string; value: string }>;
  authority: "server";
};

export type PhoneTask = {
  id: string;
  module: "receive" | "quotes" | "tracking" | "respond" | "fulfill" | "code";
  title: string;
  detail: string;
  status: string;
  targetId: string;
  amount?: number;
  lines?: number;
};

export type PhoneHome = {
  plan: PhonePlan;
  account: PhoneAccount;
  permissions: string[];
  proposal: PhoneProposal;
  tasks: PhoneTask[];
  unread: number;
};

export type PhoneOrderItem = {
  id: string;
  quantity: number;
  receivedQuantity: number;
  product: { id: string; name: string; sku: string | null; unitOfMeasure: string | null };
};

export type PhoneOrder = {
  id: string;
  orderNumber: string;
  status: string;
  estimatedDelivery?: string | null;
  paymentGuaranteed?: boolean;
  invoiceIssued?: boolean;
  supplierName?: string | null;
  assignmentStatus?: string | null;
  items: PhoneOrderItem[];
};

export type PhoneCheckpoint = {
  key: "assigned" | "accepted" | "picked-up" | "in-transit" | "delivered";
  at: string | null;
  state: "done" | "current" | "waiting";
};

export type PhoneOrderDetail = {
  orderId: string;
  orderNumber: string;
  status: string;
  referredFrom: "carrier-portal";
  estimatedDelivery: string | null;
  assignmentStatus: string | null;
  originHub: string | null;
  destinationHub: string | null;
  checkpoints: PhoneCheckpoint[];
  deliveryCode: { available: false; reason: string } | { available: true; code: string; confirmedAt: string | null; orderNumber: string };
};

export type CatalogProduct = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  unitOfMeasure: string;
  images?: string[];
};

export type AnonymousQuote = {
  id: string;
  reference: string;
  quantity: number;
  unitPrice: number | string;
  currency: string;
  deliveryFee: number | string;
  taxAmount: number | string;
  leadTimeDays: number | null;
  rfq: { id: string; product: { name: string } | null };
  cost?: { totalCost: number | null; totalCostState: "KNOWN" | "INCOMPLETE" };
};

export type SupplierRequest = {
  id: string;
  itemName: string | null;
  requestedQty: number;
  status: string;
  product?: { name: string; unitOfMeasure: string } | null;
};

export type PhoneNotification = {
  id: string;
  type: string;
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
    identity: () => request<{ user: MobileIdentity }>('/api/v2/me'),
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
    session: () => request<{ plan: PhonePlan; account: PhoneAccount; permissions: string[] }>('/api/v2/mobile/session'),
    home: () => request<PhoneHome>('/api/v2/mobile/home'),
    orders: () => request<{ orders: PhoneOrder[] }>('/api/v2/mobile/orders'),
    order: (orderId: string) => request<{ order: PhoneOrderDetail }>(`/api/v2/mobile/orders/${encodeURIComponent(orderId)}`),
    deliveryCode: (orderId: string) => request<PhoneOrderDetail['deliveryCode']>(`/api/v2/mobile/delivery-code?orderId=${encodeURIComponent(orderId)}`),
    confirmDeliveryCode: (orderId: string, code: string) => request<{ ok: true; idempotent: boolean }>('/api/v2/mobile/delivery-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, code }),
    }),
    catalog: (query: string) => request<{ products: CatalogProduct[] }>(`/api/v2/marketplace${query ? `?q=${encodeURIComponent(query)}` : ''}`),
    createRfq: (productId: string, quantity: number, idempotencyKey: string) => request<{ rfq: { id: string }; idempotent?: boolean }>('/api/v2/rfq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-idempotency-key': idempotencyKey },
      body: JSON.stringify({ productId, quantity }),
    }),
    quotes: () => request<{ quotes: AnonymousQuote[] }>('/api/v2/quotes'),
    supplierRequests: () => request<{ rfqs: SupplierRequest[] }>('/api/v2/rfq'),
    submitQuote: (payload: { rfqId: string; unitPrice: number; quantity: number; deliveryFee: number; taxAmount: number; leadTimeDays?: number; notes?: string }) => request<{ quote: { id: string } }>('/api/v2/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
    notifications: () => request<{ notifications: PhoneNotification[]; unread: number }>('/api/v2/notifications'),
    markNotification: (notificationId: string) => request<{ ok: true }>('/api/v2/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId }),
    }),
    uploadReceiptPhoto: async (file: { uri: string; name: string; type: string }) => {
      const token = await getToken();
      if (!token) throw new HovinApiError(401, 'SESSION_TOKEN_UNAVAILABLE');
      const body = new FormData();
      body.append('file', file as unknown as Blob);
      const headers = new Headers();
      headers.set('Authorization', `Bearer ${token}`);
      headers.set('Accept', 'application/json');
      return parseResponse<{ id: string; sha256: string; contentType: string; byteSize: number; exifStripped: boolean }>(await fetch(`${apiOrigin}/api/v2/evidence/files`, {
        method: 'POST',
        headers,
        body,
      }));
    },
  };
}

export function isRetryableReceiptFailure(error: unknown) {
  return !(error instanceof HovinApiError) || error.status >= 500;
}

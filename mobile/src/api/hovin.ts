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
};

export type CountableProduct = {
  id: string;
  name: string;
  sku: string | null;
  unitOfMeasure: string | null;
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
  };
}

export function isRetryableReceiptFailure(error: unknown) {
  return !(error instanceof HovinApiError) || error.status >= 500;
}

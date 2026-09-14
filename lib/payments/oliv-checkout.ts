/**
 * Oliv Finance Payment Integration
 * Hotels Vendors
 *
 * Handles checkout URL generation for Oliv-backed financing.
 */

const OLIV_BASE_URL = process.env.OLIV_BASE_URL || "https://sandbox.oliv.finance";
const OLIV_API_KEY = process.env.OLIV_API_KEY;

export interface OlivCheckoutParams {
  orderId: string;
  amount: number;
  currency: string;
  supplierId?: string;
  hotelId: string;
  hotelName?: string;
  returnUrl?: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
}

export interface OlivCheckoutResult {
  checkoutUrl: string;
  reference: string;
}

/**
 * Generate an Oliv checkout URL for a factoring-backed order.
 * In sandbox mode, returns a simulated URL.
 */
export async function generateOlivCheckoutUrl(
  params: OlivCheckoutParams
): Promise<OlivCheckoutResult> {
  const isSandbox = process.env.NEXT_PUBLIC_FINTECH_SANDBOX === "true";

  if (isSandbox || !OLIV_API_KEY) {
    // Sandbox mode — return simulated checkout URL
    const reference = `oliv_${crypto.randomUUID()}_${params.orderId.slice(0, 8)}`;
    return {
      checkoutUrl: `${OLIV_BASE_URL}/checkout/sandbox?ref=${reference}&amount=${params.amount}`,
      reference,
    };
  }

  // Production — call Oliv API
  const response = await fetch(`${OLIV_BASE_URL}/api/v1/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OLIV_API_KEY}`,
    },
    body: JSON.stringify({
      order_id: params.orderId,
      amount: params.amount,
      currency: params.currency,
      supplier_id: params.supplierId,
      hotel_id: params.hotelId,
      return_url: params.returnUrl,
    }),
  });

  if (!response.ok) {
    throw new Error(`Oliv checkout failed: ${response.statusText}`);
  }

  return response.json();
}

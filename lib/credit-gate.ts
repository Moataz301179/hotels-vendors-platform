import { rejectNativeFunding } from "@/lib/fintech/external-only";

/**
 * HotelsVendors does not score credit or move a facility balance.
 * A licensed funder owns the limit. These entry points fail closed
 * before any database read or write.
 */
export async function checkCreditLimit(
  _hotelId: string,
  _proposedAmount: number
): Promise<{ allowed: boolean; available: number; reason?: string }> {
  return rejectNativeFunding();
}

export async function reserveCredit(
  _hotelId: string,
  _amount: number
): Promise<void> {
  return rejectNativeFunding();
}

export async function releaseCredit(
  _hotelId: string,
  _amount: number
): Promise<void> {
  return rejectNativeFunding();
}

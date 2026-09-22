import { prisma } from "./prisma";

export async function checkCreditLimit(
  hotelId: string,
  proposedAmount: number
): Promise<{ allowed: boolean; available: number; reason?: string }> {
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { creditLimit: true, creditUsed: true },
  });

  if (!hotel) {
    return { allowed: false, available: 0, reason: "Hotel not found" };
  }

  const creditLimit = Number(hotel.creditLimit ?? 0);
  const creditUsed = Number(hotel.creditUsed ?? 0);

  // Sum approved/confirmed/in_transit orders that are not yet invoiced
  const uncapturedOrders = await prisma.order.findMany({
    where: {
      hotelId,
      status: { in: ["APPROVED", "CONFIRMED", "IN_TRANSIT"] },
      invoices: { none: {} },
    },
    select: { total: true },
  });

  const uncapturedTotal = uncapturedOrders.reduce(
    (sum, o) => sum + Number(o.total ?? 0),
    0
  );

  const totalExposure = creditUsed + uncapturedTotal;
  const available = Math.max(0, creditLimit - totalExposure);

  if (totalExposure + proposedAmount > creditLimit) {
    return {
      allowed: false,
      available,
      reason: `Credit limit exceeded. Exposure: ${totalExposure.toFixed(
        2
      )} / Limit: ${creditLimit.toFixed(2)}`,
    };
  }

  return { allowed: true, available };
}

/**
 * Reserve credit when an order is confirmed (creditUsed += order total).
 * Called when order transitions to CONFIRMED or APPROVED.
 */
export async function reserveCredit(
  hotelId: string,
  amount: number
): Promise<void> {
  await prisma.hotel.update({
    where: { id: hotelId },
    data: {
      creditUsed: {
        increment: amount,
      },
    },
  });
}

/**
 * Release credit when an invoice is paid.
 * Called when invoice paymentStatus transitions to PAID.
 */
export async function releaseCredit(
  hotelId: string,
  amount: number
): Promise<void> {
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { creditUsed: true },
  });
  if (!hotel) return;

  const current = Number(hotel.creditUsed ?? 0);
  const newAmount = Math.max(0, current - amount);

  await prisma.hotel.update({
    where: { id: hotelId },
    data: {
      creditUsed: newAmount,
    },
  });
}

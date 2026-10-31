/**
 * A funding packet is only a record for an external funder.  HotelsVendors
 * neither underwrites facilities nor initiates a payout.  A balance is usable
 * only when it was returned by a provisioned funder's pull, never from a form,
 * referral code, API key, or local sample value.
 */
export type FacilityPull = {
  facilityReference: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'EXPIRED' | 'FROZEN';
  currency: string;
  approvedLimit: number;
  utilizedAmount: number;
  pulledAt: Date | null;
  decidedBy: 'EXTERNAL_FUNDER';
};

export type FundingPacket = {
  requestedAmount: number;
  etaUuid: string;
  invoiceFileAttached: boolean;
  receiptVariance: { exists: boolean; acceptedByHotel: boolean };
  alreadyFundedEtaUuids: string[];
  reversalPending?: boolean;
};

export type FunderAccountView = {
  remainingLimit: number;
  currency: string;
  source: 'EXTERNAL_FUNDER_PULL';
  pulledAt: Date;
};

type PacketBlock = {
  eligible: false;
  code:
    | 'FUNDER_PULL_REQUIRED'
    | 'EXTERNAL_FUNDER_DECISION_REQUIRED'
    | 'FUNDER_LINE_NOT_ACTIVE'
    | 'FUNDER_LINE_FROZEN'
    | 'INVOICE_FILE_REQUIRED'
    | 'ETA_UUID_REQUIRED'
    | 'ETA_UUID_ALREADY_FUNDED'
    | 'RECEIPT_VARIANCE_HOTEL_ACCEPTANCE_REQUIRED'
    | 'FUNDER_REVERSAL_PENDING'
    | 'DRAW_EXCEEDS_REMAINING_LIMIT';
  remainingLimit?: number;
  replenishAmount?: number;
  currency?: string;
};

export type PacketDecision = { eligible: true; remainingLimit: number; currency: string } | PacketBlock;

function finiteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function remainingLimit(facility: Pick<FacilityPull, 'approvedLimit' | 'utilizedAmount'>): number {
  if (!finiteNonNegative(facility.approvedLimit) || !finiteNonNegative(facility.utilizedAmount)) return 0;
  return Math.max(0, facility.approvedLimit - facility.utilizedAmount);
}

/** The exact same immutable pull snapshot feeds vendor and funder read views. */
export function buildFunderAccountView(facility: FacilityPull, _viewer: 'VENDOR' | 'FUNDER'): FunderAccountView | null {
  if (!facility.pulledAt || facility.decidedBy !== 'EXTERNAL_FUNDER') return null;
  return {
    remainingLimit: remainingLimit(facility),
    currency: facility.currency,
    source: 'EXTERNAL_FUNDER_PULL',
    pulledAt: facility.pulledAt,
  };
}

export function evaluateFundingPacket(packet: FundingPacket, facility: FacilityPull): PacketDecision {
  if (!facility.pulledAt) return { eligible: false, code: 'FUNDER_PULL_REQUIRED' };
  if (facility.decidedBy !== 'EXTERNAL_FUNDER') return { eligible: false, code: 'EXTERNAL_FUNDER_DECISION_REQUIRED' };
  if (facility.status === 'FROZEN') return { eligible: false, code: 'FUNDER_LINE_FROZEN' };
  if (facility.status !== 'ACTIVE') return { eligible: false, code: 'FUNDER_LINE_NOT_ACTIVE' };
  if (!packet.invoiceFileAttached) return { eligible: false, code: 'INVOICE_FILE_REQUIRED' };
  if (!packet.etaUuid.trim()) return { eligible: false, code: 'ETA_UUID_REQUIRED' };
  if (packet.alreadyFundedEtaUuids.includes(packet.etaUuid)) return { eligible: false, code: 'ETA_UUID_ALREADY_FUNDED' };
  if (packet.receiptVariance.exists && !packet.receiptVariance.acceptedByHotel) return { eligible: false, code: 'RECEIPT_VARIANCE_HOTEL_ACCEPTANCE_REQUIRED' };
  if (packet.reversalPending) return { eligible: false, code: 'FUNDER_REVERSAL_PENDING' };

  const available = remainingLimit(facility);
  if (!Number.isFinite(packet.requestedAmount) || packet.requestedAmount <= 0 || packet.requestedAmount > available) {
    return {
      eligible: false,
      code: 'DRAW_EXCEEDS_REMAINING_LIMIT',
      remainingLimit: available,
      replenishAmount: Math.max(0, packet.requestedAmount - available),
      currency: facility.currency,
    };
  }
  return { eligible: true, remainingLimit: available, currency: facility.currency };
}

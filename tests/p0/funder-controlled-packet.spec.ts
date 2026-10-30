import { describe, expect, it } from 'vitest';
import {
  buildFunderAccountView,
  evaluateFundingPacket,
  type FacilityPull,
} from '@/lib/funding/funder-controlled-packet';

const facility: FacilityPull = {
  facilityReference: 'facility-remote-1',
  status: 'ACTIVE',
  currency: 'EGP',
  approvedLimit: 100_000,
  utilizedAmount: 35_000,
  pulledAt: new Date('2026-10-29T09:00:00.000Z'),
  decidedBy: 'EXTERNAL_FUNDER',
};

const readyPacket = {
  requestedAmount: 40_000,
  etaUuid: 'eta-uuid-1',
  invoiceFileAttached: true,
  receiptVariance: { exists: false, acceptedByHotel: false },
  alreadyFundedEtaUuids: [] as string[],
};

describe('funder-controlled packet gate', () => {
  it('shows the identical remaining amount to vendor and funder from one pulled facility', () => {
    const vendor = buildFunderAccountView(facility, 'VENDOR');
    const funder = buildFunderAccountView(facility, 'FUNDER');

    expect(vendor).toEqual(funder);
    expect(vendor).toMatchObject({ remainingLimit: 65_000, currency: 'EGP', source: 'EXTERNAL_FUNDER_PULL' });
  });

  it('rejects an unpulled or non-funder facility instead of accepting a sample balance', () => {
    expect(evaluateFundingPacket(readyPacket, { ...facility, pulledAt: null })).toMatchObject({ eligible: false, code: 'FUNDER_PULL_REQUIRED' });
    expect(evaluateFundingPacket(readyPacket, { ...facility, decidedBy: 'HOTELSVENDORS' as never })).toMatchObject({ eligible: false, code: 'EXTERNAL_FUNDER_DECISION_REQUIRED' });
  });

  it('requires the invoice file and ETA UUID before a packet can be sent', () => {
    expect(evaluateFundingPacket({ ...readyPacket, invoiceFileAttached: false }, facility)).toMatchObject({ eligible: false, code: 'INVOICE_FILE_REQUIRED' });
    expect(evaluateFundingPacket({ ...readyPacket, etaUuid: '' }, facility)).toMatchObject({ eligible: false, code: 'ETA_UUID_REQUIRED' });
  });

  it('prevents a single ETA UUID from being funded twice', () => {
    expect(evaluateFundingPacket({ ...readyPacket, alreadyFundedEtaUuids: ['eta-uuid-1'] }, facility)).toMatchObject({ eligible: false, code: 'ETA_UUID_ALREADY_FUNDED' });
  });

  it('blocks a receipt quantity difference until the hotel accepts it', () => {
    expect(evaluateFundingPacket({ ...readyPacket, receiptVariance: { exists: true, acceptedByHotel: false } }, facility)).toMatchObject({ eligible: false, code: 'RECEIPT_VARIANCE_HOTEL_ACCEPTANCE_REQUIRED' });
  });

  it('blocks an excessive draw and states the exact amount to replenish', () => {
    expect(evaluateFundingPacket({ ...readyPacket, requestedAmount: 70_000 }, facility)).toEqual({
      eligible: false,
      code: 'DRAW_EXCEEDS_REMAINING_LIMIT',
      remainingLimit: 65_000,
      replenishAmount: 5_000,
      currency: 'EGP',
    });
  });

  it('keeps a frozen funder line unavailable and treats reversals as an external-funder pull state', () => {
    expect(evaluateFundingPacket(readyPacket, { ...facility, status: 'FROZEN' })).toMatchObject({ eligible: false, code: 'FUNDER_LINE_FROZEN' });
    expect(evaluateFundingPacket({ ...readyPacket, reversalPending: true }, facility)).toMatchObject({ eligible: false, code: 'FUNDER_REVERSAL_PENDING' });
  });
});

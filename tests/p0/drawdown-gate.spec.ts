import {describe,expect,it} from 'vitest';
import {advanceDrawdown,decideCallback} from '@/lib/fintech/drawdown-gate';

describe('funder drawdown gate',()=>{
 it('lets only the funder accept and confirm disbursement',()=>{expect(advanceDrawdown('DRAWDOWN_SUBMITTED','FUNDER')).toBe('FUNDER_ACCEPTED');expect(advanceDrawdown('FUNDER_ACCEPTED','FUNDER')).toBe('DISBURSEMENT_CONFIRMED');expect(()=>advanceDrawdown('DRAWDOWN_SUBMITTED','NETWORK')).toThrow('EXTERNAL_FUNDER_REQUIRED');expect(()=>advanceDrawdown('FUNDER_ACCEPTED','NETWORK')).toThrow('EXTERNAL_FUNDER_REQUIRED')});
 it('blocks a second disbursement of the same ETA UUID',()=>{expect(decideCallback({payoutStatus:'DISBURSED',disbursedAmount:100,etaAlreadyDisbursed:true,facilityConfirmed:true,facilityRemaining:500})).toEqual({ok:false,code:'DUPLICATE_INVOICE_OR_ETA_UUID'})});
 it('blocks a payout without a confirmed facility',()=>{expect(decideCallback({payoutStatus:'DISBURSED',disbursedAmount:100,etaAlreadyDisbursed:false,facilityConfirmed:false,facilityRemaining:null})).toEqual({ok:false,code:'FACILITY_UNAVAILABLE'})});
 it('returns the shortfall and does not invent a platform fee',()=>{const decision=decideCallback({payoutStatus:'DISBURSED',disbursedAmount:150,etaAlreadyDisbursed:false,facilityConfirmed:true,facilityRemaining:100});expect(decision).toEqual({ok:false,code:'FACILITY_SHORTFALL',difference:50});const allowed=decideCallback({payoutStatus:'DISBURSED',disbursedAmount:80,etaAlreadyDisbursed:false,facilityConfirmed:true,facilityRemaining:100});expect(allowed).toMatchObject({ok:true,platformFeeRate:null,platformFeeAmount:null,netDisbursement:null,disbursedAmount:80})});
});

import {describe,expect,it} from 'vitest';
import {allocateFreight} from '@/lib/logistics/freight-allocation';
import {compareLandedCost,reportedSavings} from '@/lib/procurement/landed-cost';
import {projectTransactionStatus} from '@/lib/procurement/transaction-status';

const line={quantity:10,unitPrice:100,taxRate:0.14,freight:20,financeFee:0,hvFee:0,specificationMatch:true,paymentTermDays:45};

describe('pillar visibility',()=>{
 it('refuses a saving when freight, tax, or the payment term is not comparable',()=>{expect(compareLandedCost({...line,freight:undefined as never},line).ok).toBe(false);expect(compareLandedCost(line,{...line,paymentTermDays:30})).toMatchObject({ok:false,code:'PAYMENT_TERM_CHANGED'});expect(compareLandedCost(line,{...line,specificationMatch:false})).toMatchObject({ok:false,code:'SPECIFICATION_MISMATCH'})});
 it('returns an unverified net figure only when every cost is present',()=>{const result=compareLandedCost(line,{...line,unitPrice:90,financeFee:15,hvFee:5,freight:20});expect(result).toMatchObject({ok:true,claim:'unverified',historicLanded:1160,nextLanded:1066,netEgp:94})});
 it('does not present potential or realized amounts as a saving',()=>{expect(reportedSavings(250)).toEqual({verifiedSavings:250,realizedSavings:null,potentialSavings:null,savingsBasis:'verified-ledger-only'})});
 it('allocates freight only for the same route, window, and handling',()=>{const a={orderId:'a',route:'HRG',window:'AM',handling:'DRY',weightKg:30,cubeM3:1};const b={...a,orderId:'b',weightKg:70};expect(allocateFreight([a,b],100,'weight')).toEqual({ok:true,rule:'weight',allocations:[{orderId:'a',amount:30},{orderId:'b',amount:70}]});expect(allocateFreight([a,{...b,route:'SSH'}],100,'weight')).toMatchObject({ok:false,code:'NOT_CONSOLIDATABLE'})});
 it('freezes the status on an exception or a rejected ETA invoice',()=>{const base={requested:true,approved:true,poIssued:true,fulfilled:true,received:true,etaStatus:'valid' as const,funder:'accepted' as const,maturityReached:false,settled:false,exception:null};expect(projectTransactionStatus(base).status).toBe('FUNDER_ACCEPTED');expect(projectTransactionStatus({...base,exception:'RECEIVER_DISPUTE_OPEN'})).toEqual({status:'RECEIVER_DISPUTE_OPEN',frozen:true});expect(projectTransactionStatus({...base,etaStatus:'cancelled'}).frozen).toBe(true)});
});

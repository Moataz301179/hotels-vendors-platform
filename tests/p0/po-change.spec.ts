import {describe,expect,it} from 'vitest';
import {decidePoChange,pendingPoChange} from '@/lib/procurement/po-change';

const current={quantity:4,unitPrice:100,deliveryDate:'2026-11-01'};
const proposed={...current,quantity:6,unitPrice:90};

describe('purchase-order changes',()=>{
 it('lets a supplier propose a change but not accept it',()=>{expect(decidePoChange({current,proposed,actor:'SUPPLIER',accept:false})).toMatchObject({ok:true,action:'PROPOSE',changed:['quantity','unitPrice']});expect(decidePoChange({current,proposed,actor:'SUPPLIER',accept:true})).toMatchObject({ok:false,code:'HOTEL_ACCEPTANCE_REQUIRED'})});
 it('lets only the hotel accept the changed terms',()=>{expect(decidePoChange({current,proposed,actor:'HOTEL',accept:true})).toMatchObject({ok:true,action:'ACCEPT'});expect(decidePoChange({current,proposed,actor:'OTHER',accept:true})).toMatchObject({ok:false,code:'HOTEL_ACCEPTANCE_REQUIRED'})});
 it('rejects an empty or invalid change',()=>{expect(decidePoChange({current,proposed:current,actor:'HOTEL',accept:true})).toMatchObject({ok:false,code:'NO_PO_CHANGE'});expect(decidePoChange({current,proposed:{...proposed,quantity:0},actor:'HOTEL',accept:true})).toMatchObject({ok:false,code:'INVALID_PO_CHANGE'})});
 it('keeps an unaccepted change pending, including the proposed terms',()=>{expect(pendingPoChange({requiredApproverIds:['gm'],poChange:{orderItemId:'line',changed:['quantity'],proposed,acceptedAt:null}})).toEqual({changed:['quantity'],orderItemId:'line',proposed});expect(pendingPoChange({poChange:{orderItemId:'line',changed:['quantity'],acceptedAt:'2026-11-02'}})).toBeNull()});
});

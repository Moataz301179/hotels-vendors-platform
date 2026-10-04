import {describe,expect,it} from 'vitest';
import {orderActions} from '@/lib/v2-order-actions';
const order={status:'PENDING_APPROVAL',supplierId:'supplier',tenantId:'hotel',paymentGuaranteed:true};
describe('persisted order authority',()=>{
 it('buyers cannot self-grant approval using their platform role',()=>expect(orderActions({platformRole:'HOTEL',role:'DEPARTMENT_HEAD',tenantId:'hotel'},order)).toEqual([]));
 it('authorized approvers can approve their tenant orders',()=>expect(orderActions({platformRole:'HOTEL',role:'GM',tenantId:'hotel'},order)).toEqual(['APPROVED','REJECTED']));
 it('approvers cannot act across hotel tenants',()=>expect(orderActions({platformRole:'HOTEL',role:'OWNER',tenantId:'other'},order)).toEqual([]));
 it('only the assigned supplier can confirm an approved order',()=>{expect(orderActions({platformRole:'SUPPLIER',role:'CLERK',tenantId:'supplier-tenant',supplierId:'supplier'},{...order,status:'APPROVED'})).toEqual(['CONFIRMED']);expect(orderActions({platformRole:'SUPPLIER',role:'OWNER',tenantId:'supplier-tenant',supplierId:'other'},{...order,status:'APPROVED'})).toEqual([])});
 it('blocks dispatch before a recorded payment guarantee',()=>expect(orderActions({platformRole:'SUPPLIER',role:'CLERK',tenantId:'supplier-tenant',supplierId:'supplier'},{...order,status:'CONFIRMED',paymentGuaranteed:false})).toEqual([]));
 it('receipt needs an appropriate hotel role and delivery stage',()=>{expect(orderActions({platformRole:'HOTEL',role:'RECEIVING_CLERK',tenantId:'hotel'},{...order,status:'IN_TRANSIT'})).toEqual(['DELIVERED']);expect(orderActions({platformRole:'HOTEL',role:'RECEIVING_CLERK',tenantId:'hotel'},order)).toEqual([])});
});

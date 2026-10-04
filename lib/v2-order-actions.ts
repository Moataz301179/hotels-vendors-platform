type Actor={platformRole:string;role:string;supplierId?:string|null;tenantId:string};
type Order={status:string;supplierId:string;tenantId:string;paymentGuaranteed?:boolean};
/** All lifecycle actions use persisted role and relationship, never browser claims. */
export function orderActions(actor:Actor,order:Order):string[]{
 if(actor.platformRole==='SUPPLIER'&&actor.supplierId===order.supplierId)return !order.paymentGuaranteed?[]: order.status==='APPROVED'?['CONFIRMED']:order.status==='CONFIRMED'?['IN_TRANSIT']:[];
 if(actor.tenantId!==order.tenantId)return [];
 const approver=actor.platformRole==='ADMIN'||(actor.platformRole==='HOTEL'&&['OWNER','REGIONAL_GM','GM','FINANCIAL_CONTROLLER'].includes(actor.role));
 if(approver&&order.status==='PENDING_APPROVAL')return ['APPROVED','REJECTED'];
 if(order.paymentGuaranteed&&(approver||(actor.platformRole==='HOTEL'&&actor.role==='RECEIVING_CLERK'))&&['CONFIRMED','IN_TRANSIT','PARTIALLY_DELIVERED'].includes(order.status))return ['DELIVERED'];
 return [];
}

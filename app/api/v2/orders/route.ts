import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { evaluateV2Authority } from "@/lib/auth/v2-authority";
import { orderActions } from "@/lib/v2-order-actions";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { appendNetworkTransactionEvent } from "@/lib/procurement/network-transaction-ledger";
import { PermissionDeniedError, requirePermission } from "@/lib/auth/rbac";
import { managedHotelTenants } from "@/lib/admin/managed-hotel-tenants";
import { classifyEtaCompliance } from "@/lib/logistics/eta-compliance";
import { decidePoChange, pendingPoChange } from "@/lib/procurement/po-change";

type Actor={id:string;platformRole:string;role:string;tenantId:string;supplierId?:string|null};

function day(value: Date | string | null | undefined): string | null {
 if (!value) return null;
 const parsed = value instanceof Date ? value : new Date(value);
 return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function snapshotObject(value: unknown): Record<string, unknown> {
 return value && typeof value === "object" && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};
}

async function recordPoChange(user: Actor, body: { id: string; accept?: boolean; poChange: { orderItemId?: unknown; quantity?: unknown; unitPrice?: unknown; deliveryDate?: unknown } }) {
 const change = body.poChange;
 if (typeof change.orderItemId !== "string" || typeof change.quantity !== "number" || typeof change.unitPrice !== "number" || !(change.deliveryDate === null || typeof change.deliveryDate === "string" || change.deliveryDate === undefined)) {
  return NextResponse.json({ error: "INVALID_PO_CHANGE" }, { status: 400 });
 }
 if (typeof change.deliveryDate === "string" && change.deliveryDate.length > 0 && !day(change.deliveryDate)) return NextResponse.json({ error: "INVALID_PO_CHANGE" }, { status: 400 });
 const order = await prisma.order.findFirst({
  where: { id: body.id, deletedAt: null, ...(user.platformRole === "SUPPLIER" ? { supplierId: user.supplierId || "__unassigned__" } : { tenantId: user.tenantId }) },
  include: { items: { where: { deletedAt: null }, select: { id: true, quantity: true, unitPrice: true, total: true } } },
 });
 if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
 if (["DELIVERED", "CANCELLED", "REJECTED"].includes(order.status)) return NextResponse.json({ error: "PO_CHANGE_CLOSED" }, { status: 409 });
 const item = order.items.find((line) => line.id === change.orderItemId);
 if (!item) return NextResponse.json({ error: "INVALID_PO_CHANGE" }, { status: 400 });
 const actor = user.platformRole === "SUPPLIER" ? "SUPPLIER" : user.platformRole === "HOTEL" && ["OWNER", "REGIONAL_GM", "GM", "FINANCIAL_CONTROLLER"].includes(user.role) ? "HOTEL" : "OTHER";
 const decision = decidePoChange({
  current: { quantity: item.quantity, unitPrice: Number(item.unitPrice ?? 0), deliveryDate: day(order.deliveryDate) },
  proposed: { quantity: change.quantity, unitPrice: change.unitPrice, deliveryDate: day(typeof change.deliveryDate === "string" ? change.deliveryDate : null) },
  actor,
  accept: body.accept === true,
 });
 if (!decision.ok) return NextResponse.json({ error: decision.code, changed: decision.changed ?? [] }, { status: decision.code === "INVALID_PO_CHANGE" ? 400 : 409 });
 const permission = decision.action === "ACCEPT" ? "order:approve" : "order:update";
 try { await requirePermission({ userId: user.id, tenantId: user.tenantId, platformRole: user.platformRole }, permission); }
 catch (error) { if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "ORDER_ACTION_PERMISSION_REQUIRED" }, { status: 403 }); throw error; }
 const accepted = decision.action === "ACCEPT";
 const proposed = { quantity: change.quantity, unitPrice: change.unitPrice, deliveryDate: day(typeof change.deliveryDate === "string" ? change.deliveryDate : null) };
 const snapshot = { ...snapshotObject(order.approvalPolicySnapshot), poChange: { orderItemId: item.id, proposed, changed: decision.changed, acceptedAt: accepted ? new Date().toISOString() : null, acceptedBy: accepted ? user.id : null } };
 await prisma.$transaction(async (tx) => {
  if (accepted) {
   const lineTotal = Math.round(change.quantity * change.unitPrice * 100) / 100;
   const subtotal = order.items.reduce((sum, line) => sum + (line.id === item.id ? lineTotal : Number(line.total ?? 0)), 0);
   const oldSubtotal = Number(order.subtotal ?? 0);
   const vat = oldSubtotal > 0 ? Math.round(Number(order.vatAmount ?? 0) * (subtotal / oldSubtotal) * 100) / 100 : Number(order.vatAmount ?? 0);
   const total = Math.round((subtotal + vat + Number(order.shippingCost ?? 0)) * 100) / 100;
   await tx.orderItem.update({ where: { id: item.id }, data: { quantity: change.quantity, unitPrice: change.unitPrice, total: lineTotal } });
   await tx.order.update({ where: { id: order.id }, data: { approvalPolicySnapshot: snapshot, subtotal, vatAmount: vat, total, ...(proposed.deliveryDate ? { deliveryDate: new Date(proposed.deliveryDate) } : {}) } });
  } else {
   await tx.order.update({ where: { id: order.id }, data: { approvalPolicySnapshot: snapshot } });
  }
  const auditLogId = await appendAuditEntry({ entityName: "ORDER", entityId: order.id, actionType: "UPDATE", tenantId: order.tenantId, actorId: user.id, actorRole: user.platformRole, changes: { poChange: decision.action, changed: decision.changed, accepted } }, tx);
  await appendNetworkTransactionEvent(tx, { tenantId: order.tenantId, orderId: order.id, sourceEntityName: "ORDER", sourceEntityId: order.id, eventType: "UPDATE", actorId: user.id, actorRole: user.platformRole, verificationMethod: accepted ? "HOTEL_ACCEPTED_PO_CHANGE" : "PO_CHANGE_PROPOSED", payload: { poChange: decision.action, changed: decision.changed }, auditLogId });
 });
 return NextResponse.json({ updated: accepted, frozen: !accepted, poChange: decision.action, changed: decision.changed });
}

export async function GET(request:Request){
 const user=await getActor(); if(!user)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
 try{await requirePermission({userId:user.id,tenantId:user.tenantId,platformRole:user.platformRole},'order:read');}catch(error){if(error instanceof PermissionDeniedError)return NextResponse.json({error:'ORDER_READ_PERMISSION_REQUIRED'},{status:403});throw error;}
 let tenants: {id:string;name:string}[]|undefined;
 let where:{supplierId?:string;tenantId?:string;deletedAt:null};
 if(user.platformRole==='SUPPLIER') where={supplierId:user.supplierId||'__unassigned__',deletedAt:null};
 else if(user.platformRole==='ADMIN'){
  const manageable=await managedHotelTenants(user.tenantId);
  if(!manageable)return NextResponse.json({error:'PLATFORM_TENANT_REQUIRED'},{status:403});
  tenants=manageable;
  const tenantId=new URL(request.url).searchParams.get('tenantId');
  if(!tenantId)return NextResponse.json({orders:[],tenants});
  if(!tenants.some(tenant=>tenant.id===tenantId))return NextResponse.json({error:'HOTEL_TENANT_NOT_FOUND'},{status:404});
  where={tenantId,deletedAt:null};
 }else where={tenantId:user.tenantId,deletedAt:null};
 const orders=await prisma.order.findMany({where,include:{supplier:{select:{name:true}},hotel:{select:{name:true}},invoices:{where:{deletedAt:null},select:{id:true,invoiceNumber:true,status:true}},items:{where:{deletedAt:null},include:{product:{select:{name:true,sku:true}}}}},orderBy:{createdAt:"desc"},take:100});
 return NextResponse.json({orders:orders.map(order=>{
  const invoiceIssued=(order.invoices?.length??0)>0;
  const poChange=pendingPoChange(order.approvalPolicySnapshot);
  const {supplierId,supplier,invoices=[],...safeOrder}=order;
  void supplierId;
  return {...safeOrder,invoices,invoiceIssued,poChange,...(user.platformRole==='HOTEL'&&!invoiceIssued?{}:{supplier}),etaCompliance:classifyEtaCompliance(order),allowedActions:user.platformRole==='ADMIN'?[]:orderActions(user,order),canRecordGuarantee:user.platformRole==='ADMIN'&&!order.paymentGuaranteed&&order.status==='PENDING_APPROVAL'};
 }),tenants});
}

export async function POST(req:Request){
 const user=await getActor(); if(!user)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
 if(!["HOTEL","ADMIN"].includes(user.platformRole))return NextResponse.json({error:"HOTEL_ROLE_REQUIRED"},{status:403});
 void req;
 return NextResponse.json({error:"RFQ_QUOTE_ACCEPT_REQUIRED",message:"Create an RFQ and accept a verified supplier quote before creating an order."},{status:409});
}

export async function PATCH(req:Request){
 const user=await getActor();if(!user)return NextResponse.json({error:'UNAUTHENTICATED'},{status:401});
 const b=await req.json().catch(()=>null);if(typeof b?.id!=='string'||(typeof b?.status!=='string'&&!b?.poChange))return NextResponse.json({error:'Order ID and status are required'},{status:400});
 if(typeof b?.status==='string'&&b?.poChange)return NextResponse.json({error:'PO_CHANGE_IS_A_SEPARATE_ACTION'},{status:400});
 if(b?.poChange)return recordPoChange(user,b);
 const estimatedDelivery=b.status==='IN_TRANSIT'&&typeof b.estimatedDelivery==='string'?new Date(b.estimatedDelivery):null;
 if(b.status==='IN_TRANSIT'&&(!estimatedDelivery||!Number.isFinite(estimatedDelivery.getTime())||estimatedDelivery<=new Date()))return NextResponse.json({error:'A future delivery commitment is required before dispatch.'},{status:400});
 const order=await prisma.order.findFirst({where:{id:b.id,deletedAt:null,...(user.platformRole==='SUPPLIER'?{supplierId:user.supplierId||'__unassigned__'}:{tenantId:user.tenantId})},include:{approvals:{where:{deletedAt:null},select:{approverId:true,action:true}}}});
 if(!order)return NextResponse.json({error:'Order not found'},{status:404});
 const pending=pendingPoChange(order.approvalPolicySnapshot);
 if(pending&&b.status!=='REJECTED')return NextResponse.json({error:'PO_CHANGE_ACCEPTANCE_REQUIRED',changed:pending.changed},{status:409});
 if(!orderActions(user,order).includes(b.status))return NextResponse.json({error:'Your role cannot perform this order action'},{status:403});
 const permissionByAction:Record<string,string>={APPROVED:'order:approve',REJECTED:'order:reject',CONFIRMED:'order:confirm',IN_TRANSIT:'order:update',RECEIVE:'order:update'};
 const permission=permissionByAction[b.status];
 if(!permission)return NextResponse.json({error:'Unsupported order action'},{status:400});
 if(b.status==='RECEIVE')return NextResponse.json({error:'GRN_RECEIPT_REQUIRED'},{status:409});
 try{await requirePermission({userId:user.id,tenantId:user.tenantId,platformRole:user.platformRole},permission);}catch(error){if(error instanceof PermissionDeniedError)return NextResponse.json({error:'ORDER_ACTION_PERMISSION_REQUIRED'},{status:403});throw error;}
 if(b.status==='APPROVED'){
  const snapshot = order.approvalPolicySnapshot as { requiredApproverIds?: string[] } | null;
  const requiredApproverIds = snapshot?.requiredApproverIds?.filter(Boolean) ?? [];
  if (requiredApproverIds.length > 0) {
   if (!requiredApproverIds.includes(user.id)) return NextResponse.json({error:'APPROVAL_DELEGATE_REQUIRED'},{status:403});
   const existingApproverIds = new Set(order.approvals.filter(a=>a.action==='APPROVED').map(a=>a.approverId));
   if (!existingApproverIds.has(user.id)) {
    await prisma.$transaction(async tx=>{const created=await tx.orderApproval.create({data:{orderId:order.id,approverId:user.id,action:'APPROVED',beforeState:order.status,afterState:existingApproverIds.size+1===requiredApproverIds.length?'APPROVED':'PENDING_APPROVAL'}});const auditLogId=await appendAuditEntry({entityName:'ORDER',entityId:order.id,actionType:'APPROVAL_RECORDED',tenantId:order.tenantId,actorId:user.id,actorRole:user.platformRole,changes:{approvalId:created.id,requiredApproverIds}},tx);await appendNetworkTransactionEvent(tx,{tenantId:order.tenantId,orderId:order.id,sourceEntityName:'ORDER',sourceEntityId:order.id,eventType:'APPROVAL_RECORDED',actorId:user.id,actorRole:user.platformRole,verificationMethod:'RECORDED_APPROVAL',payload:{approvalId:created.id,requiredApproverIds},auditLogId});return created;});
    existingApproverIds.add(user.id);
   }
   const remainingApproverIds=requiredApproverIds.filter(id=>!existingApproverIds.has(id));
   if (remainingApproverIds.length>0) return NextResponse.json({updated:false,approvalRecorded:true,awaitingApproval:true,remainingApproverIds});
  }
  const authority=await evaluateV2Authority(order.id,{role:user.role,tenantId:user.tenantId});
  if(!authority.allowed)return NextResponse.json({error:authority.reason},{status:409});
 }
 const result=await prisma.$transaction(async tx=>{
  const changed=await tx.order.updateMany({where:{id:order.id,status:order.status,deletedAt:null},data:{status:b.status,...(estimatedDelivery?{estimatedDelivery}:{})}});
  if(changed.count===1){const auditLogId=await appendAuditEntry({entityName:'ORDER',entityId:order.id,actionType:'STATUS_CHANGED',tenantId:order.tenantId,actorId:user.id,actorRole:user.platformRole,changes:{from:order.status,to:b.status,...(estimatedDelivery?{estimatedDelivery:estimatedDelivery.toISOString()}:{}),}},tx);await appendNetworkTransactionEvent(tx,{tenantId:order.tenantId,orderId:order.id,sourceEntityName:'ORDER',sourceEntityId:order.id,eventType:'STATUS_CHANGED',actorId:user.id,actorRole:user.platformRole,verificationMethod:'AUTHORISED_WORKSPACE_WRITE',payload:{from:order.status,to:b.status,estimatedDelivery:estimatedDelivery?.toISOString()??null},auditLogId});}
  return changed;
 });
 if(result.count!==1)return NextResponse.json({error:'The order changed. Refresh before acting.'},{status:409});
 return NextResponse.json({updated:true});
}

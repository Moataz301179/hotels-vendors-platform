import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { evaluateV2Authority } from "@/lib/auth/v2-authority";
import { orderActions } from "@/lib/v2-order-actions";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { PermissionDeniedError, requirePermission } from "@/lib/auth/rbac";
import { managedHotelTenants } from "@/lib/admin/managed-hotel-tenants";
import { classifyEtaCompliance } from "@/lib/logistics/eta-compliance";

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
  const {supplierId,supplier,invoices=[],...safeOrder}=order;
  return {...safeOrder,invoices,invoiceIssued,...(user.platformRole==='HOTEL'&&!invoiceIssued?{}:{supplier}),etaCompliance:classifyEtaCompliance(order),allowedActions:user.platformRole==='ADMIN'?[]:orderActions(user,order),canRecordGuarantee:user.platformRole==='ADMIN'&&!order.paymentGuaranteed&&order.status==='PENDING_APPROVAL'};
 }),tenants});
}

export async function POST(req:Request){
 const user=await getActor(); if(!user)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
 if(!["HOTEL","ADMIN"].includes(user.platformRole))return NextResponse.json({error:"HOTEL_ROLE_REQUIRED"},{status:403});
 // Orders must originate from a tenant-scoped accepted supplier quote.  Keeping
 // this legacy endpoint closed prevents bypassing RFQ assignment, quote terms,
 // authority policy, payment guarantees, and the associated audit trail.
 void req;
 return NextResponse.json({error:"RFQ_QUOTE_ACCEPT_REQUIRED",message:"Create an RFQ and accept a verified supplier quote before creating an order."},{status:409});
}

export async function PATCH(req:Request){
 const user=await getActor();if(!user)return NextResponse.json({error:'UNAUTHENTICATED'},{status:401});
 const b=await req.json().catch(()=>null);if(typeof b?.id!=='string'||typeof b?.status!=='string')return NextResponse.json({error:'Order ID and status are required'},{status:400});
 const estimatedDelivery=b.status==='IN_TRANSIT'&&typeof b.estimatedDelivery==='string'?new Date(b.estimatedDelivery):null;
 if(b.status==='IN_TRANSIT'&&(!estimatedDelivery||!Number.isFinite(estimatedDelivery.getTime())||estimatedDelivery<=new Date()))return NextResponse.json({error:'A future delivery commitment is required before dispatch.'},{status:400});
 const order=await prisma.order.findFirst({where:{id:b.id,deletedAt:null,...(user.platformRole==='SUPPLIER'?{supplierId:user.supplierId||'__unassigned__'}:{tenantId:user.tenantId})},include:{approvals:{where:{deletedAt:null},select:{approverId:true,action:true}}}});
 if(!order)return NextResponse.json({error:'Order not found'},{status:404});
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
    const approval=await prisma.orderApproval.create({data:{orderId:order.id,approverId:user.id,action:'APPROVED',beforeState:order.status,afterState:existingApproverIds.size+1===requiredApproverIds.length?'APPROVED':'PENDING_APPROVAL'}});
    await appendAuditEntry({entityName:'ORDER',entityId:order.id,actionType:'APPROVAL_RECORDED',tenantId:order.tenantId,actorId:user.id,actorRole:user.platformRole,changes:{approvalId:approval.id,requiredApproverIds}},);
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
  if(changed.count===1)await appendAuditEntry({entityName:'ORDER',entityId:order.id,actionType:'STATUS_CHANGED',tenantId:order.tenantId,actorId:user.id,actorRole:user.platformRole,changes:{from:order.status,to:b.status,...(estimatedDelivery?{estimatedDelivery:estimatedDelivery.toISOString()}:{}),}},tx);
  return changed;
 });
 if(result.count!==1)return NextResponse.json({error:'The order changed. Refresh before acting.'},{status:409});
 return NextResponse.json({updated:true});
}

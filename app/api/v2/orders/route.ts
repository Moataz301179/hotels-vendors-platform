import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { evaluateV2Authority } from "@/lib/auth/v2-authority";
import { orderActions } from "@/lib/v2-order-actions";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

export async function GET(){
 const user=await getActor(); if(!user)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
 const orders=await prisma.order.findMany({where:{...(user.platformRole==='SUPPLIER'?{supplierId:user.supplierId||'__unassigned__'}:{tenantId:user.tenantId}),deletedAt:null},include:{supplier:{select:{name:true}},hotel:{select:{name:true}},items:{where:{deletedAt:null},include:{product:{select:{name:true,sku:true}}}}},orderBy:{createdAt:"desc"},take:100});
 return NextResponse.json({orders:orders.map(order=>({...order,allowedActions:orderActions(user,order)}))});
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
 const order=await prisma.order.findFirst({where:{id:b.id,deletedAt:null,...(user.platformRole==='SUPPLIER'?{supplierId:user.supplierId||'__unassigned__'}:{tenantId:user.tenantId})}});
 if(!order)return NextResponse.json({error:'Order not found'},{status:404});
 if(!orderActions(user,order).includes(b.status))return NextResponse.json({error:'Your role cannot perform this order action'},{status:403});
 if(b.status==='APPROVED'){
  const authority=await evaluateV2Authority(order.id,{role:user.role,tenantId:user.tenantId});
  if(!authority.allowed)return NextResponse.json({error:authority.reason},{status:409});
 }
 const result=await prisma.$transaction(async tx=>{
  const changed=await tx.order.updateMany({where:{id:order.id,status:order.status,deletedAt:null},data:{status:b.status}});
  if(changed.count===1)await appendAuditEntry({entityName:'ORDER',entityId:order.id,actionType:'STATUS_CHANGED',tenantId:order.tenantId,actorId:user.id,actorRole:user.platformRole,changes:{from:order.status,to:b.status}},tx);
  return changed;
 });
 if(result.count!==1)return NextResponse.json({error:'The order changed. Refresh before acting.'},{status:409});
 return NextResponse.json({updated:true});
}

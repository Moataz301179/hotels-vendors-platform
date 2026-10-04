import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { evaluateV2Authority } from "@/lib/auth/v2-authority";
import { orderActions } from "@/lib/v2-order-actions";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

export async function GET(){
 const user=await getActor(); if(!user)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
 const orders=await prisma.order.findMany({where:{...(user.platformRole==='SUPPLIER'?{supplierId:user.supplierId||'__unassigned__'}:{tenantId:user.tenantId}),deletedAt:null},include:{supplier:{select:{name:true}},hotel:{select:{name:true}},items:{include:{product:{select:{name:true,sku:true}}}}},orderBy:{createdAt:"desc"},take:100});
 return NextResponse.json({orders:orders.map(order=>({...order,allowedActions:orderActions(user,order)}))});
}

export async function POST(req:Request){
 const user=await getActor(); if(!user)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
 if(!["HOTEL","ADMIN"].includes(user.platformRole))return NextResponse.json({error:"HOTEL_ROLE_REQUIRED"},{status:403});
 const b=await req.json().catch(()=>null); const productId=String(b?.productId||""); const quantity=Number(b?.quantity||0); const supplierId=String(b?.supplierId||"");
 if(!productId||!supplierId||!Number.isInteger(quantity)||quantity<=0||quantity>1000000)return NextResponse.json({error:"productId, supplierId and positive integer quantity are required"},{status:400});
 const [product,supplier,hotel]=await Promise.all([prisma.product.findFirst({where:{id:productId,status:"ACTIVE",deletedAt:null,supplier:{id:supplierId,status:"ACTIVE",isVerified:true}},select:{id:true,unitPrice:true,supplierId:true}}),prisma.supplier.findFirst({where:{id:supplierId,status:"ACTIVE",isVerified:true,deletedAt:null},select:{id:true}}),prisma.hotel.findFirst({where:{tenantId:user.tenantId,status:"ACTIVE",deletedAt:null},orderBy:{createdAt:"asc"},select:{id:true}})]);
 if(!product||!supplier||!hotel)return NextResponse.json({error:"Product, supplier or active hotel is not available in your tenant"},{status:404});
 if(product.supplierId!==supplier.id)return NextResponse.json({error:"Supplier does not own this product"},{status:409});
 const unitPrice=Number(product.unitPrice||0); if(!Number.isFinite(unitPrice)||unitPrice<=0||unitPrice*quantity>9000000000)return NextResponse.json({error:"A real unit price is required; use an RFQ first if price is unknown"},{status:400});
 const subtotal=unitPrice*quantity; const order=await prisma.$transaction(async tx=>{const created=await tx.order.create({data:{orderNumber:"HV-"+Date.now().toString(36).toUpperCase(),status:"PENDING_APPROVAL",currency:"EGP",hotelId:hotel.id,supplierId:supplier.id,requesterId:user.id,tenantId:user.tenantId,deliveryDate:b?.deliveryDate?new Date(b.deliveryDate):undefined,deliveryInstructions:b?.deliveryInstructions||undefined,subtotal,total:subtotal,items:{create:{productId:product.id,quantity,unitPrice,total:subtotal}}},include:{items:true}});
 await appendAuditEntry({entityName:"ORDER",entityId:created.id,actionType:"CREATED",tenantId:user.tenantId,actorId:user.id,actorRole:user.platformRole,changes:{orderNumber:created.orderNumber,subtotal,productId,quantity}},tx);return created;});
 return NextResponse.json({order},{status:201});
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

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { PermissionDeniedError, requirePermission } from "@/lib/auth/rbac";
import { z } from "zod";

const rfqInput=z.object({productId:z.string().min(1).optional(),contractBaselineId:z.string().min(1).optional(),quantity:z.number().int().positive().max(1_000_000),targetPrice:z.number().finite().positive().optional(),deliveryTimeline:z.string().trim().max(240).optional(),specialReq:z.string().trim().max(2000).optional(),notes:z.string().trim().max(2000).optional()}).refine(value=>Boolean(value.productId||value.contractBaselineId),{message:'A product or contract baseline is required'});

export async function GET() {
  const user=await getActor(); if(!user)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
  try{await requirePermission({userId:user.id,tenantId:user.tenantId,platformRole:user.platformRole},'order:read');}catch(error){if(error instanceof PermissionDeniedError)return NextResponse.json({error:'RFQ_READ_PERMISSION_REQUIRED'},{status:403});throw error;}
  if(user.platformRole==="SUPPLIER"){
   if(!user.supplierId)return NextResponse.json({error:"VERIFIED_SUPPLIER_CONTEXT_REQUIRED"},{status:403});
   const grants=await prisma.rfqSupplierAccess.findMany({where:{supplierId:user.supplierId,supplierTenantId:user.tenantId,revokedAt:null},select:{rfqId:true}});
   const rfqs=await prisma.rfqRequest.findMany({where:{id:{in:grants.map(grant=>grant.rfqId)},supplierId:user.supplierId,deletedAt:null},orderBy:{createdAt:"desc"},take:100});
   const products=await prisma.product.findMany({where:{id:{in:rfqs.map(rfq=>rfq.productId)},supplierId:user.supplierId,deletedAt:null,status:"ACTIVE"},select:{id:true,name:true,sku:true,unitOfMeasure:true}});
   const productById=new Map(products.map(product=>[product.id,product]));
   return NextResponse.json({rfqs:rfqs.map(rfq=>({...rfq,product:productById.get(rfq.productId)??null}))});
  }
  const where = {tenantId:user.tenantId,deletedAt:null};
  return NextResponse.json({rfqs:await prisma.rfqRequest.findMany({where,orderBy:{createdAt:"desc"},take:100})});
}

export async function POST(req:Request){
 const user=await getActor(); if(!user)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
 if(user.platformRole!=="HOTEL" && user.platformRole!=="ADMIN")return NextResponse.json({error:"HOTEL_ROLE_REQUIRED"},{status:403});
 try{await requirePermission({userId:user.id,tenantId:user.tenantId,platformRole:user.platformRole},'order:create');}catch(error){if(error instanceof PermissionDeniedError)return NextResponse.json({error:'RFQ_CREATE_PERMISSION_REQUIRED'},{status:403});throw error;}
 const parsed=rfqInput.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"A product or contract baseline and a positive integer quantity are required"},{status:400});
 const b=parsed.data; const requestedProductId=b.productId||""; const baselineId=b.contractBaselineId||null; const quantity=b.quantity;
 const hotel=await prisma.hotel.findFirst({where:{tenantId:user.tenantId,status:'ACTIVE',deletedAt:null},select:{id:true}});
 if(!hotel)return NextResponse.json({error:"An active hotel profile is required"},{status:409});
 const baseline=baselineId?await prisma.contractRateBaseline.findFirst({where:{id:baselineId,tenantId:user.tenantId,hotelId:hotel.id,deletedAt:null,validFrom:{lte:new Date()},OR:[{validUntil:null},{validUntil:{gt:new Date()}}]},select:{id:true,productId:true,supplierId:true}}):null;
 if(baselineId&&!baseline)return NextResponse.json({error:"An active contract baseline for your hotel was not found"},{status:404});
 if(baseline&&requestedProductId&&requestedProductId!==baseline.productId)return NextResponse.json({error:"The product must match the selected contract baseline"},{status:409});
 const productId=baseline?.productId||requestedProductId;
 const product=await prisma.product.findFirst({where:{id:productId,supplierId:baseline?.supplierId,status:"ACTIVE",deletedAt:null,supplier:{status:"ACTIVE",isVerified:true}},select:{id:true,supplierId:true,supplier:{select:{tenantId:true}}}});
 if(!product)return NextResponse.json({error:"Verified active product not found"},{status:404});
 const rfq=await prisma.$transaction(async tx=>{const created=await tx.rfqRequest.create({data:{buyerId:user.id,productId:product.id,contractBaselineId:baseline?.id,supplierId:product.supplierId,requestedQty:quantity,targetPrice:b?.targetPrice?Number(b.targetPrice):undefined,deliveryTimeline:b?.deliveryTimeline||undefined,specialReq:b?.specialReq||undefined,notes:b?.notes||undefined,tenantId:user.tenantId}});await tx.rfqSupplierAccess.create({data:{rfqId:created.id,supplierId:product.supplierId,hotelTenantId:user.tenantId,supplierTenantId:product.supplier.tenantId,grantedById:user.id}});await appendAuditEntry({entityName:"RFQ",entityId:created.id,actionType:"CREATED",tenantId:user.tenantId,actorId:user.id,actorRole:user.platformRole,changes:{productId,quantity,supplierId:product.supplierId,contractBaselineId:baseline?.id}},tx);return created;});
 return NextResponse.json({rfq},{status:201});
}

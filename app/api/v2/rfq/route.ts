import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { appendNetworkTransactionEvent } from "@/lib/procurement/network-transaction-ledger";
import { PermissionDeniedError, requirePermission } from "@/lib/auth/rbac";
import { FinancialAccessDeniedError, requireFinancialAccess } from "@/lib/auth/financial-access";
import { hasResolvedProductEvidence } from "@/lib/catalog/resolved-product-evidence";
import { publicMarketplaceDirectoryProfileWhere } from "@/lib/directory/public-marketplace";
import { toBuyerSafeRfqRequest } from "@/lib/procurement/anonymous-commercial-disclosure";
import { z } from "zod";

const rfqInput=z.object({productId:z.string().min(1).optional(),catalogReferenceId:z.string().min(1).optional(),contractBaselineId:z.string().min(1).optional(),itemName:z.string().trim().min(2).max(240).optional(),unitOfMeasure:z.string().trim().min(1).max(80).optional(),deliveryLocation:z.string().trim().max(240).optional(),packDescription:z.string().trim().max(240).optional(),quantity:z.number().int().positive().max(1_000_000),targetPrice:z.number().finite().positive().optional(),deliveryTimeline:z.string().trim().max(240).optional(),responseWindowHours:z.number().int().min(1).max(120).optional(),specialReq:z.string().trim().max(2000).optional(),notes:z.string().trim().max(2000).optional()}).superRefine((value,context)=>{if(value.productId||value.catalogReferenceId||value.contractBaselineId)return;if(!value.itemName||!value.unitOfMeasure)context.addIssue({code:z.ZodIssueCode.custom,message:'An item name and unit of measure are required for an unlisted requirement'});});
const idempotencyKeyPattern=/^[A-Za-z0-9][A-Za-z0-9._:-]{15,191}$/;

export async function GET() {
  const user=await getActor(); if(!user)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
  try{await requirePermission({userId:user.id,tenantId:user.tenantId,platformRole:user.platformRole},'order:read');}catch(error){if(error instanceof PermissionDeniedError)return NextResponse.json({error:'RFQ_READ_PERMISSION_REQUIRED'},{status:403});throw error;}
  if(user.platformRole==="SUPPLIER"){
   if(!user.supplierId)return NextResponse.json({error:"VERIFIED_SUPPLIER_CONTEXT_REQUIRED"},{status:403});
   const grants=await prisma.rfqSupplierAccess.findMany({where:{supplierId:user.supplierId,supplierTenantId:user.tenantId,revokedAt:null},select:{rfqId:true}});
   const rfqs=await prisma.rfqRequest.findMany({where:{id:{in:grants.map(grant=>grant.rfqId)},deletedAt:null},orderBy:{createdAt:"desc"},take:100});
   const productIds=rfqs.flatMap(rfq=>rfq.productId?[rfq.productId]:[]);
   const products=productIds.length?await prisma.product.findMany({where:{id:{in:productIds},supplierId:user.supplierId,deletedAt:null,status:"ACTIVE"},select:{id:true,name:true,sku:true,unitOfMeasure:true}}):[];
   const productById=new Map(products.map(product=>[product.id,product]));
   return NextResponse.json({rfqs:rfqs.map(rfq=>({...rfq,product:productById.get(rfq.productId??'')??null}))});
  }
  const where = {tenantId:user.tenantId,deletedAt:null};
  const rfqs=await prisma.rfqRequest.findMany({where,orderBy:{createdAt:"desc"},take:100});
  return NextResponse.json({rfqs:rfqs.map(toBuyerSafeRfqRequest)});
}

export async function POST(req:Request){
 const user=await getActor(); if(!user)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
 if(user.platformRole!=="HOTEL")return NextResponse.json({error:"HOTEL_ROLE_REQUIRED"},{status:403});
 try{await requirePermission({userId:user.id,tenantId:user.tenantId,platformRole:user.platformRole},'order:create');}catch(error){if(error instanceof PermissionDeniedError)return NextResponse.json({error:'RFQ_CREATE_PERMISSION_REQUIRED'},{status:403});throw error;}
 try{await requireFinancialAccess(user);}catch(error){if(error instanceof FinancialAccessDeniedError)return NextResponse.json({error:error.code},{status:403});throw error;}
 const idempotencyKey=req.headers.get('x-idempotency-key')?.trim()??'';
 if(!idempotencyKeyPattern.test(idempotencyKey))return NextResponse.json({error:'RFQ_IDEMPOTENCY_KEY_REQUIRED'},{status:400});
 const existing=await prisma.rfqRequest.findFirst({where:{tenantId:user.tenantId,buyerId:user.id,idempotencyKey,deletedAt:null}});
 if(existing)return NextResponse.json({rfq:existing,idempotent:true});
 const parsed=rfqInput.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"A product or contract baseline and a positive integer quantity are required"},{status:400});
 const b=parsed.data; const requestedProductId=b.productId||""; const catalogReferenceId=b.catalogReferenceId||null; const baselineId=b.contractBaselineId||null; const quantity=b.quantity; const responseDeadline=new Date(Date.now()+(b.responseWindowHours??24)*60*60*1000);
 const hotel=await prisma.hotel.findFirst({where:{tenantId:user.tenantId,status:'ACTIVE',deletedAt:null},select:{id:true}});
 if(!hotel)return NextResponse.json({error:"An active hotel profile is required"},{status:409});
 const baseline=baselineId?await prisma.contractRateBaseline.findFirst({where:{id:baselineId,tenantId:user.tenantId,hotelId:hotel.id,deletedAt:null,validFrom:{lte:new Date()},OR:[{validUntil:null},{validUntil:{gt:new Date()}}]},select:{id:true,productId:true,supplierId:true}}):null;
 if(baselineId&&!baseline)return NextResponse.json({error:"An active contract baseline for your hotel was not found"},{status:404});
 if(baseline&&requestedProductId&&requestedProductId!==baseline.productId)return NextResponse.json({error:"The product must match the selected contract baseline"},{status:409});
 const productId=baseline?.productId||requestedProductId;
 const catalogReference=catalogReferenceId?await prisma.directoryProfile.findFirst({where:{...publicMarketplaceDirectoryProfileWhere,id:catalogReferenceId},select:{id:true,name:true,unitOfMeasure:true,purchaseUnit:true}}):null;
 if(catalogReferenceId&&!catalogReference)return NextResponse.json({error:"Reviewed catalogue reference not found"},{status:404});
 if(catalogReference&&productId)return NextResponse.json({error:"Choose either a reviewed catalogue reference or a Vendor product"},{status:409});
 const product=productId?await prisma.product.findFirst({where:{id:productId,supplierId:baseline?.supplierId,status:"ACTIVE",deletedAt:null,source:{not:'FIXTURE'},supplier:{status:"ACTIVE",isVerified:true}},select:{id:true,sourceKey:true,supplierId:true,supplier:{select:{tenantId:true}}}}):null;
 if(productId&&!product)return NextResponse.json({error:"Verified active product not found"},{status:404});
 if(product && !await hasResolvedProductEvidence(prisma, product))return NextResponse.json({error:"RESOLVED_PRODUCT_EVIDENCE_REQUIRED"},{status:409});
 let rfq;
 try{rfq=await prisma.$transaction(async tx=>{const created=await tx.rfqRequest.create({data:{buyerId:user.id,productId:product?.id??null,contractBaselineId:baseline?.id??null,supplierId:null,catalogItemId:catalogReference?.id??product?.id??null,itemName:product?undefined:(catalogReference?.name??b.itemName),unitOfMeasure:product?undefined:(catalogReference?.purchaseUnit??catalogReference?.unitOfMeasure??b.unitOfMeasure),deliveryLocation:b.deliveryLocation||undefined,packDescription:b.packDescription||undefined,matchingStatus:product?'MATCHED':'QUEUED',requestedQty:quantity,targetPrice:b?.targetPrice?Number(b.targetPrice):undefined,deliveryTimeline:b?.deliveryTimeline||undefined,responseDeadline,procurementMethod:'SEALED_RFQ',specialReq:b?.specialReq||undefined,notes:b?.notes||undefined,idempotencyKey,tenantId:user.tenantId}});if(product)await tx.rfqSupplierAccess.create({data:{rfqId:created.id,supplierId:product.supplierId,productId:product.id,hotelTenantId:user.tenantId,supplierTenantId:product.supplier.tenantId,grantedById:user.id}});const auditLogId=await appendAuditEntry({entityName:"RFQ",entityId:created.id,actionType:"CREATED",tenantId:user.tenantId,actorId:user.id,actorRole:user.platformRole,changes:{productId:product?.id||null,catalogReferenceId:catalogReference?.id||null,itemName:product?null:(catalogReference?.name??b.itemName),quantity,assignedVendorCount:product?1:0,contractBaselineId:baseline?.id||null,matchingStatus:product?'MATCHED':'QUEUED',procurementMethod:'SEALED_RFQ',responseDeadline}},tx);await appendNetworkTransactionEvent(tx,{tenantId:user.tenantId,rootRfqId:created.id,sourceEntityName:'RFQ',sourceEntityId:created.id,eventType:'CREATED',actorId:user.id,actorRole:user.platformRole,verificationMethod:'AUTHORISED_WORKSPACE_WRITE',payload:{quantity,catalogReferenceId:catalogReference?.id??null,matchingStatus:created.matchingStatus,responseDeadline:responseDeadline.toISOString()},auditLogId});return created;});}catch(error){if(!(error instanceof Error)||!('code' in error)||error.code!=='P2002')throw error;const duplicate=await prisma.rfqRequest.findFirst({where:{tenantId:user.tenantId,buyerId:user.id,idempotencyKey,deletedAt:null}});if(!duplicate)throw error;return NextResponse.json({rfq:duplicate,idempotent:true});}
 return NextResponse.json({rfq},{status:201});
}

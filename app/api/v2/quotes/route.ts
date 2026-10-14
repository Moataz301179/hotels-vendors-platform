import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { costBreakdown } from "@/lib/procurement/pre-spend";
import { PermissionDeniedError, requirePermission } from "@/lib/auth/rbac";
import { z } from "zod";

const quoteInput=z.object({rfqId:z.string().min(1),unitPrice:z.number().finite().positive().max(10_000_000),quantity:z.number().int().positive().max(1_000_000),deliveryFee:z.number().finite().min(0).max(1_000_000).optional(),taxAmount:z.number().finite().min(0).max(1_000_000).optional(),leadTimeDays:z.number().int().positive().max(365).optional(),validUntil:z.coerce.date().optional(),notes:z.string().trim().max(2000).optional()});

async function requireProcurementPermission(user:{id:string;tenantId:string;platformRole:string},code:string,errorCode:string){
 try{await requirePermission({userId:user.id,tenantId:user.tenantId,platformRole:user.platformRole},code);return null;}
 catch(error){if(error instanceof PermissionDeniedError)return NextResponse.json({error:errorCode},{status:403});throw error;}
}

export async function GET(){
 const user=await getActor();if(!user)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
 if(user.platformRole!=="SUPPLIER"&&!['HOTEL','ADMIN'].includes(user.platformRole))return NextResponse.json({error:"COMMERCIAL_COMPARISON_ACCESS_REQUIRED"},{status:403});
 const permissionError=await requireProcurementPermission(user,'order:read','ORDER_READ_PERMISSION_REQUIRED');if(permissionError)return permissionError;
 if(user.platformRole==='SUPPLIER'){
  if(!user.supplierId)return NextResponse.json({error:'VERIFIED_SUPPLIER_CONTEXT_REQUIRED'},{status:403});
  const supplier=await prisma.supplier.findFirst({where:{id:user.supplierId,tenantId:user.tenantId,status:'ACTIVE',isVerified:true,deletedAt:null},select:{id:true}});
  if(!supplier)return NextResponse.json({error:'Supplier verification is required before viewing quotes'},{status:403});
 }
 const grants=user.platformRole==='SUPPLIER'&&user.supplierId
  ?await prisma.rfqSupplierAccess.findMany({where:{supplierId:user.supplierId,supplierTenantId:user.tenantId,revokedAt:null},select:{rfqId:true}})
  :null;
 const where=grants?{supplierId:user.supplierId!,rfqId:{in:grants.map(grant=>grant.rfqId)},deletedAt:null}:{tenantId:user.tenantId,deletedAt:null};
 const quotes=await prisma.procurementQuote.findMany({where,include:{rfq:{select:{id:true,productId:true,requestedQty:true,status:true,tenantId:true}},supplier:{select:{id:true,name:true,isVerified:true}}},orderBy:{submittedAt:"desc"},take:100});
 if(user.platformRole==='SUPPLIER')return NextResponse.json({quotes});
 return NextResponse.json({quotes:quotes.map(({supplier,...quote})=>{void supplier;return {...quote,cost:costBreakdown(quote)}})});
}
export async function POST(req:Request){
 const user=await getActor();if(!user)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
 if(user.platformRole!=="SUPPLIER"||!user.supplierId)return NextResponse.json({error:"VERIFIED_SUPPLIER_CONTEXT_REQUIRED"},{status:403});
 const permissionError=await requireProcurementPermission(user,'quote:submit','QUOTE_SUBMIT_PERMISSION_REQUIRED');if(permissionError)return permissionError;
 const supplier=await prisma.supplier.findFirst({where:{id:user.supplierId,tenantId:user.tenantId,status:"ACTIVE",isVerified:true,deletedAt:null},select:{id:true}});if(!supplier)return NextResponse.json({error:"Supplier verification is required before submitting quotes"},{status:403});
 const parsed=quoteInput.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"rfqId, unitPrice and quantity are required"},{status:400});const b=parsed.data;const {rfqId,unitPrice,quantity}=b;
 if(unitPrice*quantity>9000000000)return NextResponse.json({error:"The stated product amount is too large"},{status:400});
 const grant=await prisma.rfqSupplierAccess.findFirst({where:{rfqId,supplierId:supplier.id,supplierTenantId:user.tenantId,revokedAt:null},select:{rfqId:true,hotelTenantId:true}});
 if(!grant)return NextResponse.json({error:"RFQ is not assigned to your supplier tenant"},{status:404});
 const rfq=await prisma.rfqRequest.findFirst({where:{id:grant.rfqId,tenantId:grant.hotelTenantId,supplierId:supplier.id,deletedAt:null},select:{id:true,productId:true,supplierId:true,buyerId:true,requestedQty:true,tenantId:true,status:true}});
 if(!rfq)return NextResponse.json({error:"RFQ is not assigned to your supplier account"},{status:404});
 if(rfq.status!=="PENDING")return NextResponse.json({error:"RFQ is no longer accepting a new fixed response"},{status:409});
 if(quantity!==rfq.requestedQty)return NextResponse.json({error:"QUOTE_QUANTITY_MISMATCH"},{status:409});
 const product=await prisma.product.findFirst({where:{id:rfq.productId,supplierId:supplier.id,status:"ACTIVE",deletedAt:null},select:{id:true}});
 if(!product)return NextResponse.json({error:"The RFQ product is no longer active"},{status:409});
 try{const quote=await prisma.$transaction(async tx=>{
  const claimed=await tx.rfqRequest.updateMany({where:{id:rfq.id,tenantId:grant.hotelTenantId,supplierId:supplier.id,status:'PENDING',deletedAt:null},data:{status:"QUOTED"}});
  if(claimed.count!==1)throw new Error('RFQ_ALREADY_QUOTED');
  const created=await tx.procurementQuote.create({data:{rfqId,tenantId:rfq.tenantId,supplierId:supplier.id,buyerId:rfq.buyerId,unitPrice,quantity,currency:"EGP",leadTimeDays:b?.leadTimeDays?Number(b.leadTimeDays):undefined,deliveryFee:b?.deliveryFee===undefined?undefined:Number(b.deliveryFee),taxAmount:b?.taxAmount===undefined?undefined:Number(b.taxAmount),validUntil:b?.validUntil?new Date(b.validUntil):undefined,notes:b?.notes||undefined}});
  await appendAuditEntry({entityName:"PROCUREMENT_QUOTE",entityId:created.id,actionType:"SUBMITTED",tenantId:rfq.tenantId,actorId:user.id,actorRole:user.platformRole,changes:{rfqId,unitPrice,quantity,supplierId:user.supplierId}},tx);
  return created;
 });
 return NextResponse.json({quote,cost:costBreakdown(quote)},{status:201});
 }catch(error){if(error instanceof Error&&error.message==='RFQ_ALREADY_QUOTED')return NextResponse.json({error:'This request already has a fixed response.'},{status:409});throw error;}
}

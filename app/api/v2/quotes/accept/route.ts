import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';
import { appendAuditEntry } from '@/lib/audit/tamper-proof';
import { costBreakdown } from '@/lib/procurement/pre-spend';
import { PermissionDeniedError, requirePermission } from '@/lib/auth/rbac';
import { FinancialAccessDeniedError, requireFinancialAccess } from '@/lib/auth/financial-access';
import { hasResolvedProductEvidence } from '@/lib/catalog/resolved-product-evidence';
import { z } from 'zod';

const acceptQuoteInput = z.object({ quoteId: z.string().min(1) });

export async function POST(req:Request){
 const user=await getActor();if(!user)return NextResponse.json({error:'UNAUTHENTICATED'},{status:401});
 if(!['HOTEL','ADMIN'].includes(user.platformRole))return NextResponse.json({error:'HOTEL_ROLE_REQUIRED'},{status:403});
 try{await requirePermission({userId:user.id,tenantId:user.tenantId,platformRole:user.platformRole},'order:create');}catch(error){if(error instanceof PermissionDeniedError)return NextResponse.json({error:'ORDER_CREATE_PERMISSION_REQUIRED'},{status:403});throw error;}
 try{await requireFinancialAccess(user);}catch(error){if(error instanceof FinancialAccessDeniedError)return NextResponse.json({error:error.code},{status:403});throw error;}
 const parsed=acceptQuoteInput.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'quoteId is required'},{status:400});
 const quote=await prisma.procurementQuote.findFirst({where:{id:parsed.data.quoteId,tenantId:user.tenantId,deletedAt:null,status:'SUBMITTED',supplier:{isVerified:true,status:'ACTIVE',deletedAt:null}},include:{rfq:true}});
 if(!quote)return NextResponse.json({error:'An available verified quote was not found'},{status:404});
 const costs=costBreakdown(quote);
 if(!Number.isInteger(quote.quantity)||quote.quantity<=0||!Number.isFinite(Number(quote.unitPrice))||Number(quote.unitPrice)<=0||costs.productCost===null||costs.deliveryCost===null||costs.taxCost===null||costs.totalCost===null||costs.totalCost>9000000000)return NextResponse.json({error:'The stored quote must state product, delivery, and tax amounts before it can be selected.'},{status:409});
 if(quote.validUntil&&quote.validUntil<new Date())return NextResponse.json({error:'This quote has expired. Request an updated quote.'},{status:409});
 if(!['PENDING','QUOTED'].includes(quote.rfq.status)||quote.rfq.tenantId!==user.tenantId||quote.rfq.deletedAt)return NextResponse.json({error:'This request is no longer available for conversion'},{status:409});
 if(!quote.rfq.productId)return NextResponse.json({error:'An unlisted requirement must be matched to a verified product before it can become an order.'},{status:409});
 const [hotel,product]=await Promise.all([prisma.hotel.findFirst({where:{tenantId:user.tenantId,status:'ACTIVE',deletedAt:null},select:{id:true}}),prisma.product.findFirst({where:{id:quote.rfq.productId,supplierId:quote.supplierId,status:'ACTIVE',deletedAt:null,source:{not:'FIXTURE'}},select:{id:true,sourceKey:true}})]);
 if(!hotel||!product)return NextResponse.json({error:'An active hotel profile and product are required'},{status:409});
 if(!await hasResolvedProductEvidence(prisma,product))return NextResponse.json({error:'RESOLVED_PRODUCT_EVIDENCE_REQUIRED'},{status:409});
 const policyCandidates=user.departmentId?await prisma.procurementApprovalPolicy.findMany({where:{tenantId:user.tenantId,isActive:true,deletedAt:null,OR:[{departmentId:user.departmentId},{departmentId:null}],AND:[{OR:[{minAmount:null},{minAmount:{lte:costs.totalCost}}]},{OR:[{maxAmount:null},{maxAmount:{gte:costs.totalCost}}]}]},orderBy:{createdAt:'asc'},select:{id:true,departmentId:true,minAmount:true,maxAmount:true,primaryApproverId:true,secondaryApproverId:true}}):[];
 const policy=policyCandidates.sort((a,b)=>Number(Boolean(b.departmentId))-Number(Boolean(a.departmentId)))[0];
 if(user.departmentId&&!policy)return NextResponse.json({error:'APPROVAL_POLICY_REQUIRED'},{status:409});
 try{
 const order=await prisma.$transaction(async tx=>{
  const claimed=await tx.rfqRequest.updateMany({where:{id:quote.rfqId,tenantId:user.tenantId,status:{in:['PENDING','QUOTED']}},data:{status:'CONVERTED_TO_ORDER'}});
  if(claimed.count!==1)throw new Error('ALREADY_CONVERTED');
  await tx.procurementQuote.update({where:{id:quote.id},data:{status:'ACCEPTED'}});
  const subtotal=costs.productCost,total=costs.totalCost;
  const created=await tx.order.create({data:{orderNumber:'HV-'+crypto.randomUUID().slice(0,12).toUpperCase(),tenantId:user.tenantId,hotelId:hotel.id,supplierId:quote.supplierId,requesterId:user.id,departmentId:user.departmentId||undefined,procurementApprovalPolicyId:policy?.id,approvalPolicySnapshot:policy?{policyId:policy.id,departmentId:policy.departmentId,primaryApproverId:policy.primaryApproverId,secondaryApproverId:policy.secondaryApproverId,requiredApproverIds:[policy.primaryApproverId,...(policy.secondaryApproverId?[policy.secondaryApproverId]:[])]}:undefined,status:'PENDING_APPROVAL',currency:quote.currency,subtotal,shippingCost:costs.deliveryCost,vatAmount:costs.taxCost,total,deliveryInstructions:'Supplier quote '+quote.id,items:{create:{productId:product.id,quantity:quote.quantity,unitPrice:quote.unitPrice,total:subtotal}}}});
  await appendAuditEntry({entityName:'ORDER',entityId:created.id,actionType:'CREATED',tenantId:user.tenantId,actorId:user.id,actorRole:user.platformRole,changes:{quoteId:quote.id,rfqId:quote.rfqId,orderNumber:created.orderNumber,costs}},tx);
  return created;
 });
 return NextResponse.json({order},{status:201});
 }catch(e){if(e instanceof Error&&e.message==='ALREADY_CONVERTED')return NextResponse.json({error:'This request already has an order'},{status:409});throw e;}
}

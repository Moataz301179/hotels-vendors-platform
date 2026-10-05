import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';
import { appendAuditEntry } from '@/lib/audit/tamper-proof';

export async function POST(req:Request){
 const user=await getActor();if(!user)return NextResponse.json({error:'UNAUTHENTICATED'},{status:401});
 if(!['HOTEL','ADMIN'].includes(user.platformRole))return NextResponse.json({error:'HOTEL_ROLE_REQUIRED'},{status:403});
 const body=await req.json().catch(()=>null);if(typeof body?.quoteId!=='string')return NextResponse.json({error:'quoteId is required'},{status:400});
 const quote=await prisma.procurementQuote.findFirst({where:{id:body.quoteId,tenantId:user.tenantId,deletedAt:null,status:'SUBMITTED',supplier:{isVerified:true,status:'ACTIVE',deletedAt:null}},include:{rfq:true}});
 if(!quote)return NextResponse.json({error:'An available verified quote was not found'},{status:404});
 if(!Number.isInteger(quote.quantity)||quote.quantity<=0||!Number.isFinite(Number(quote.unitPrice))||Number(quote.unitPrice)<=0||Number(quote.unitPrice)*quote.quantity+Number(quote.deliveryFee||0)>9000000000)return NextResponse.json({error:'The stored quote has invalid commercial terms. Request a new quote.'},{status:409});
 if(quote.validUntil&&quote.validUntil<new Date())return NextResponse.json({error:'This quote has expired. Request an updated quote.'},{status:409});
 if(!['PENDING','QUOTED'].includes(quote.rfq.status)||quote.rfq.tenantId!==user.tenantId||quote.rfq.deletedAt)return NextResponse.json({error:'This request is no longer available for conversion'},{status:409});
 const [hotel,product]=await Promise.all([prisma.hotel.findFirst({where:{tenantId:user.tenantId,status:'ACTIVE',deletedAt:null},select:{id:true}}),prisma.product.findFirst({where:{id:quote.rfq.productId,supplierId:quote.supplierId,status:'ACTIVE',deletedAt:null},select:{id:true}})]);
 if(!hotel||!product)return NextResponse.json({error:'An active hotel profile and product are required'},{status:409});
 try{
 const order=await prisma.$transaction(async tx=>{
  const claimed=await tx.rfqRequest.updateMany({where:{id:quote.rfqId,tenantId:user.tenantId,status:{in:['PENDING','QUOTED']}},data:{status:'CONVERTED_TO_ORDER'}});
  if(claimed.count!==1)throw new Error('ALREADY_CONVERTED');
  await tx.procurementQuote.update({where:{id:quote.id},data:{status:'ACCEPTED'}});
  const subtotal=Number(quote.unitPrice)*quote.quantity,total=subtotal+Number(quote.deliveryFee||0);
  const created=await tx.order.create({data:{orderNumber:'HV-'+crypto.randomUUID().slice(0,12).toUpperCase(),tenantId:user.tenantId,hotelId:hotel.id,supplierId:quote.supplierId,requesterId:user.id,status:'PENDING_APPROVAL',currency:quote.currency,subtotal,shippingCost:quote.deliveryFee,total,deliveryInstructions:'Supplier quote '+quote.id,items:{create:{productId:product.id,quantity:quote.quantity,unitPrice:quote.unitPrice,total:subtotal}}}});
  await appendAuditEntry({entityName:'ORDER',entityId:created.id,actionType:'CREATED',tenantId:user.tenantId,actorId:user.id,actorRole:user.platformRole,changes:{quoteId:quote.id,rfqId:quote.rfqId,orderNumber:created.orderNumber}},tx);
  return created;
 });
 return NextResponse.json({order},{status:201});
 }catch(e){if(e instanceof Error&&e.message==='ALREADY_CONVERTED')return NextResponse.json({error:'This request already has an order'},{status:409});throw e;}
}

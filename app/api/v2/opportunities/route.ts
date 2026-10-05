import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';
import { appendAuditEntry } from '@/lib/audit/tamper-proof';
const transitions:Record<string,string[]>={DETECTED:['REVIEWING'],REVIEWING:['RESEARCHING','ACTION_READY'],RESEARCHING:['ACTION_READY'],ACTION_READY:['RFQ_SENT','APPROVED'],RFQ_SENT:['APPROVED','RESEARCHING'],APPROVED:['EXECUTING'],EXECUTING:['RESULT_PENDING'],RESULT_PENDING:['VERIFIED','CLOSED'],VERIFIED:['CLOSED'],CLOSED:[]};
const reviewer=(u:{platformRole:string;role:string})=>u.platformRole==='ADMIN'||(u.platformRole==='HOTEL'&&['OWNER','GM','REGIONAL_GM','FINANCIAL_CONTROLLER'].includes(u.role));
export async function GET(){
 const u=await getActor();if(!u)return NextResponse.json({error:'UNAUTHENTICATED'},{status:401});if(!['HOTEL','ADMIN'].includes(u.platformRole))return NextResponse.json({error:'HOTEL_ROLE_REQUIRED'},{status:403});
 const opportunities=await prisma.opportunity.findMany({where:{tenantId:u.tenantId,deletedAt:null},include:{affectedSupplier:{select:{name:true}},affectedProduct:{select:{name:true,sku:true}},savingsLedgers:{select:{status:true,realizedAmount:true,verifiedAmount:true,potentialSaving:true}}},orderBy:{createdAt:'desc'},take:100});
 return NextResponse.json({opportunities,canVerifyOutcomes:reviewer(u)});
}
export async function PATCH(req:Request){
 const u=await getActor();if(!u)return NextResponse.json({error:'UNAUTHENTICATED'},{status:401});if(!['HOTEL','ADMIN'].includes(u.platformRole))return NextResponse.json({error:'HOTEL_ROLE_REQUIRED'},{status:403});
 const b=await req.json().catch(()=>null),id=String(b?.id||''),to=String(b?.status||'');if(!id||!(to in transitions))return NextResponse.json({error:'Opportunity ID and a valid status are required'},{status:400});
 const row=await prisma.opportunity.findFirst({where:{id,tenantId:u.tenantId,deletedAt:null}});if(!row)return NextResponse.json({error:'Opportunity not found'},{status:404});if(!transitions[row.status].includes(to))return NextResponse.json({error:'The opportunity changed or this transition is unavailable.'},{status:409});
 let outcome:{orderId:string;amount:number}|null=null;
 if(to==='VERIFIED'){
  if(!reviewer(u))return NextResponse.json({error:'An authorized organization reviewer must verify the outcome.'},{status:403});
  if(typeof b.orderId!=='string'||!row.affectedProductId||!row.baseline)return NextResponse.json({error:'A received order for the affected product is required.'},{status:400});
  const receipt=await prisma.order.findFirst({where:{id:b.orderId,tenantId:u.tenantId,deletedAt:null,status:'DELIVERED',currency:'EGP',createdAt:{gte:row.createdAt}},include:{items:{where:{productId:row.affectedProductId}}}});
  if(!receipt||!receipt.items.length)return NextResponse.json({error:'Choose a received order for this product, placed after the finding was recorded.'},{status:409});
  const amount=Math.max(0,receipt.items.reduce((sum,i)=>sum+Math.max(0,(Number(row.baseline)-Number(i.unitPrice))*i.quantity),0)-Number(receipt.shippingCost||0));
  if(!Number.isFinite(amount)||amount<=0||amount>9000000000)return NextResponse.json({error:'The received order does not establish positive savings against this baseline.'},{status:409});
  outcome={orderId:receipt.id,amount:Math.round(amount*100)/100};
 }
 const changed=await prisma.$transaction(async tx=>{
  const result=await tx.opportunity.updateMany({where:{id,tenantId:u.tenantId,status:row.status},data:{status:to as never,verificationState:outcome?'VERIFIED':row.verificationState,realizedResult:outcome?{orderId:outcome.orderId,amount:outcome.amount,method:'baseline vs received order-line price, less current delivery fee',currency:'EGP'}:undefined}});
  if(result.count!==1)return false;
  if(outcome)await tx.savingsLedger.create({data:{tenantId:u.tenantId,opportunityId:id,type:'VERIFIED',status:'VERIFIED',baseline:row.baseline,potentialSaving:row.potentialImpact,realizedAmount:outcome.amount,verifiedAmount:outcome.amount,evidence:{orderId:outcome.orderId,baseline:Number(row.baseline),method:'baseline vs received order-line price, less current delivery fee'},transactionId:outcome.orderId,category:row.affectedCategory,productId:row.affectedProductId,supplierId:row.affectedSupplierId,ownerId:u.id,verifiedById:u.id,verifiedAt:new Date()}});
  await appendAuditEntry({entityName:'OPPORTUNITY',entityId:id,actionType:'STATUS_CHANGED',tenantId:u.tenantId,actorId:u.id,actorRole:u.platformRole,changes:{from:row.status,to,orderId:outcome?.orderId,realizedAmount:outcome?.amount}},tx);
  return true;
 });
 return changed?NextResponse.json({updated:true}):NextResponse.json({error:'The opportunity changed. Refresh before acting.'},{status:409});
}

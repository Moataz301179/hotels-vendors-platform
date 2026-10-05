import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

export async function GET(){
 const user=await getActor();if(!user)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
 const where=user.platformRole==="SUPPLIER"&&user.supplierId?{supplierId:user.supplierId,deletedAt:null}:{tenantId:user.tenantId,deletedAt:null};
 return NextResponse.json({quotes:await prisma.procurementQuote.findMany({where,include:{rfq:{select:{id:true,productId:true,requestedQty:true,status:true,tenantId:true}},supplier:{select:{id:true,name:true,isVerified:true}}},orderBy:{submittedAt:"desc"},take:100})});
}
export async function POST(req:Request){
 const user=await getActor();if(!user)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
 if(user.platformRole!=="SUPPLIER"||!user.supplierId)return NextResponse.json({error:"VERIFIED_SUPPLIER_CONTEXT_REQUIRED"},{status:403});
 const supplier=await prisma.supplier.findFirst({where:{id:user.supplierId,tenantId:user.tenantId,status:"ACTIVE",isVerified:true,deletedAt:null},select:{id:true}});if(!supplier)return NextResponse.json({error:"Supplier verification is required before submitting quotes"},{status:403});
 const b=await req.json().catch(()=>null);const rfqId=String(b?.rfqId||"");const unitPrice=Number(b?.unitPrice||0);const quantity=Number(b?.quantity||0);
 if(!rfqId||!Number.isFinite(unitPrice)||unitPrice<=0||!Number.isInteger(quantity)||quantity<=0||quantity>1000000||unitPrice*quantity>9000000000)return NextResponse.json({error:"rfqId, unitPrice and quantity are required"},{status:400});
 if(b?.deliveryFee!=null&&(!Number.isFinite(Number(b.deliveryFee))||Number(b.deliveryFee)<0||Number(b.deliveryFee)>1000000))return NextResponse.json({error:"Invalid delivery fee"},{status:400});
 const rfq=await prisma.rfqRequest.findFirst({where:{id:rfqId,supplierId:user.supplierId,deletedAt:null},select:{id:true,supplierId:true,buyerId:true,requestedQty:true,tenantId:true,status:true}});
 if(!rfq)return NextResponse.json({error:"RFQ is not assigned to your supplier account"},{status:404});
 if(rfq.status!=="PENDING"&&rfq.status!=="QUOTED")return NextResponse.json({error:"RFQ is no longer accepting quotes"},{status:409});
 const quote=await prisma.procurementQuote.create({data:{rfqId,tenantId:rfq.tenantId,supplierId:user.supplierId,buyerId:rfq.buyerId,unitPrice,quantity,currency:"EGP",leadTimeDays:b?.leadTimeDays?Number(b.leadTimeDays):undefined,deliveryFee:b?.deliveryFee?Number(b.deliveryFee):undefined,validUntil:b?.validUntil?new Date(b.validUntil):undefined,notes:b?.notes||undefined}});
 await prisma.rfqRequest.update({where:{id:rfqId},data:{status:"QUOTED"}});
 await appendAuditEntry({entityName:"PROCUREMENT_QUOTE",entityId:quote.id,actionType:"SUBMITTED",tenantId:rfq.tenantId,actorId:user.id,actorRole:user.platformRole,changes:{rfqId,unitPrice,quantity,supplierId:user.supplierId}});
 return NextResponse.json({quote},{status:201});
}

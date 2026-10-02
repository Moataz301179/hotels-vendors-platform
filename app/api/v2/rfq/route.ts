import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

export async function GET() {
  const user=await getActor(); if(!user)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
  const where = user.platformRole==="SUPPLIER" && user.supplierId ? {supplierId:user.supplierId,deletedAt:null} : {tenantId:user.tenantId,deletedAt:null};
  return NextResponse.json({rfqs:await prisma.rfqRequest.findMany({where,orderBy:{createdAt:"desc"},take:100})});
}

export async function POST(req:Request){
 const user=await getActor(); if(!user)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
 if(user.platformRole!=="HOTEL" && user.platformRole!=="ADMIN")return NextResponse.json({error:"HOTEL_ROLE_REQUIRED"},{status:403});
 const b=await req.json().catch(()=>null); const productId=String(b?.productId||""); const quantity=Number(b?.quantity||0);
 if(!productId||!Number.isInteger(quantity)||quantity<=0)return NextResponse.json({error:"productId and positive integer quantity are required"},{status:400});
 const product=await prisma.product.findFirst({where:{id:productId,status:"ACTIVE",deletedAt:null,supplier:{status:"ACTIVE",isVerified:true}},select:{id:true,supplierId:true}});
 if(!product)return NextResponse.json({error:"Verified active product not found"},{status:404});
 const rfq=await prisma.rfqRequest.create({data:{buyerId:user.id,productId:product.id,supplierId:product.supplierId,requestedQty:quantity,targetPrice:b?.targetPrice?Number(b.targetPrice):undefined,deliveryTimeline:b?.deliveryTimeline||undefined,specialReq:b?.specialReq||undefined,notes:b?.notes||undefined,tenantId:user.tenantId}});
 await appendAuditEntry({entityName:"RFQ",entityId:rfq.id,actionType:"CREATED",tenantId:user.tenantId,actorId:user.id,actorRole:user.platformRole,changes:{productId,quantity,supplierId:product.supplierId}});
 return NextResponse.json({rfq},{status:201});
}

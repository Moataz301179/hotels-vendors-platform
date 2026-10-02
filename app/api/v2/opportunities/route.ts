import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

const transitions:Record<string,string[]>={DETECTED:["REVIEWING"],REVIEWING:["RESEARCHING","ACTION_READY"],RESEARCHING:["ACTION_READY"],ACTION_READY:["RFQ_SENT","APPROVED"],RFQ_SENT:["APPROVED","RESEARCHING"],APPROVED:["EXECUTING"],EXECUTING:["RESULT_PENDING"],RESULT_PENDING:["VERIFIED","CLOSED"],VERIFIED:["CLOSED"],CLOSED:[]};

export async function GET(){
 const user=await getActor();if(!user)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
 const opportunities=await prisma.opportunity.findMany({where:{tenantId:user.tenantId,deletedAt:null},include:{affectedSupplier:{select:{name:true}},affectedProduct:{select:{name:true,sku:true}},savingsLedgers:{select:{status:true,realizedAmount:true,verifiedAmount:true,potentialSaving:true}}},orderBy:{createdAt:"desc"},take:100});
 return NextResponse.json({opportunities});
}

export async function PATCH(req:Request){
 const user=await getActor();if(!user)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
 if(user.platformRole!=="HOTEL"&&user.platformRole!=="ADMIN")return NextResponse.json({error:"HOTEL_ROLE_REQUIRED"},{status:403});
 const b=await req.json().catch(()=>null);const id=String(b?.id||"");const to=String(b?.status||"");
 if(!id||!(to in transitions))return NextResponse.json({error:"id and valid status are required"},{status:400});
 const row=await prisma.opportunity.findFirst({where:{id,tenantId:user.tenantId,deletedAt:null}});if(!row)return NextResponse.json({error:"Opportunity not found"},{status:404});
 if(!transitions[row.status].includes(to))return NextResponse.json({error:"Invalid opportunity transition"},{status:409});
 const updated=await prisma.opportunity.update({where:{id},data:{status:to as never,verificationState:to==="VERIFIED"?"VERIFIED":row.verificationState,realizedResult:to==="VERIFIED"?(b?.realizedResult||undefined):undefined}});
 if(to==="VERIFIED" && b?.realizedAmount!=null){await prisma.savingsLedger.create({data:{tenantId:user.tenantId,opportunityId:id,type:"VERIFIED",status:"VERIFIED",baseline:row.baseline||undefined,potentialSaving:row.potentialImpact||undefined,realizedAmount:Number(b.realizedAmount),verifiedAmount:Number(b.realizedAmount),evidence:b?.evidence||row.evidence||undefined,category:row.affectedCategory||undefined,productId:row.affectedProductId||undefined,supplierId:row.affectedSupplierId||undefined,ownerId:user.id,verifiedById:user.id,verifiedAt:new Date()}});}
 await appendAuditEntry({entityName:"OPPORTUNITY",entityId:id,actionType:"STATUS_CHANGED",tenantId:user.tenantId,actorId:user.id,actorRole:user.platformRole,changes:{from:row.status,to}});
 return NextResponse.json({opportunity:updated});
}

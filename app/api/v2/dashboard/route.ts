import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";

export async function GET(){
 const user=await getActor(); if(!user)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
 const [orders,rfqs,opportunities,savings,products,suppliers]=await Promise.all([
  prisma.order.count({where:{tenantId:user.tenantId,deletedAt:null}}), prisma.rfqRequest.count({where:{tenantId:user.tenantId,deletedAt:null,status:{in:["PENDING","QUOTED"]}}}),
  prisma.opportunity.count({where:{tenantId:user.tenantId,deletedAt:null,status:{notIn:["CLOSED","VERIFIED"]}}}), prisma.savingsLedger.aggregate({where:{tenantId:user.tenantId,deletedAt:null},_sum:{realizedAmount:true,verifiedAmount:true,potentialSaving:true}}),
  prisma.product.count({where:{tenantId:user.tenantId,deletedAt:null,status:"ACTIVE"}}), prisma.supplier.count({where:{tenantId:user.tenantId,deletedAt:null,status:"ACTIVE"}})
 ]);
 return NextResponse.json({role:user.platformRole,metrics:{orders,rfqs,opportunities,activeProducts:products,activeSuppliers:suppliers,realizedSavings:savings._sum.realizedAmount??0,verifiedSavings:savings._sum.verifiedAmount??0,potentialSavings:savings._sum.potentialSaving??0}});
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";

export async function GET(){
 const user=await getActor(); if(!user)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
 const supplierScope=user.platformRole==='SUPPLIER'?{supplierId:user.supplierId||'__unassigned__'}:{tenantId:user.tenantId};
 const [orders,rfqs,opportunities,savings,products,suppliers,shipments,fundingRequests,potential]=await Promise.all([
  prisma.order.count({where:{...supplierScope,deletedAt:null}}), prisma.rfqRequest.count({where:{...supplierScope,deletedAt:null,status:{in:["PENDING","QUOTED"]}}}),
  prisma.opportunity.count({where:{tenantId:user.tenantId,deletedAt:null,status:{notIn:["CLOSED","VERIFIED"]}}}), prisma.savingsLedger.aggregate({where:{tenantId:user.tenantId,deletedAt:null},_sum:{realizedAmount:true,verifiedAmount:true,potentialSaving:true}}),
  prisma.product.count({where:{...supplierScope,deletedAt:null,status:"ACTIVE"}}), prisma.supplier.count({where:{tenantId:user.tenantId,deletedAt:null,status:"ACTIVE"}}), prisma.shipment.count({where:{tenantId:user.tenantId,deletedAt:null}}), prisma.factoringRequest.count({where:{tenantId:user.tenantId,deletedAt:null}}), prisma.opportunity.aggregate({where:{tenantId:user.tenantId,deletedAt:null,status:{notIn:["CLOSED","VERIFIED"]}},_sum:{potentialImpact:true}})
 ]);
 return NextResponse.json({role:user.platformRole,metrics:{orders,rfqs,shipments,fundingRequests,opportunities,activeProducts:products,activeSuppliers:suppliers,realizedSavings:savings._sum.realizedAmount??0,verifiedSavings:savings._sum.verifiedAmount??0,potentialSavings:potential._sum.potentialImpact??0}});
}

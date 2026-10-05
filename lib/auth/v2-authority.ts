import { prisma } from '@/lib/prisma';
import type { UserRole } from '@prisma/client';
/** Fail closed against existing persisted authority rules; do not use the legacy compatibility stub. */
export async function evaluateV2Authority(orderId:string,actor:{tenantId:string;role:UserRole}){
 const order=await prisma.order.findFirst({where:{id:orderId,tenantId:actor.tenantId,deletedAt:null},include:{requester:{select:{role:true}},hotel:{select:{tier:true,riskTier:true}},supplier:{select:{tier:true}},items:{include:{product:{select:{category:true}}}}}});
 if(!order)return {allowed:false,reason:'Order is unavailable in your organization.'};
 if(!order.paymentGuaranteed)return {allowed:false,reason:'A verified payment guarantee must be recorded before this order can proceed.'};
 const value=Number(order.total||0);
 const rules=await prisma.authorityRule.findMany({where:{isActive:true,deletedAt:null,role:actor.role,OR:[{tenantId:actor.tenantId},{tenantId:null}]},orderBy:{priority:'desc'}});
 const rule=rules.find(r=>(r.requesterRole===null||r.requesterRole===order.requester.role)&&(r.hotelId===null||r.hotelId===order.hotelId)&&(r.minValue===null||value>=Number(r.minValue))&&(r.maxValue===null||value<=Number(r.maxValue))&&(r.hotelTier===null||r.hotelTier===order.hotel.tier)&&(r.hotelRiskTier===null||r.hotelRiskTier===order.hotel.riskTier)&&(r.supplierTier===null||r.supplierTier===order.supplier.tier)&&(r.category===null||order.items.every(i=>i.product.category===r.category)));
 if(!rule)return {allowed:false,reason:'No authority rule permits this action for your role and order. Ask your organization administrator to review the approval policy.'};
 if(rule.requiresDualSignOff)return {allowed:false,reason:'This order requires dual sign-off through the configured approval process.'};
 if(rule.requiresEtaValidation){const invoice=await prisma.invoice.findFirst({where:{orderId:order.id,tenantId:actor.tenantId,deletedAt:null,etaStatus:'ACCEPTED'},select:{id:true}});if(!invoice)return {allowed:false,reason:'The authority policy requires validated invoice evidence.'};}
 return ['APPROVE','AUTO_APPROVE'].includes(rule.action)?{allowed:true,ruleId:rule.id}:{allowed:false,reason:'The authority policy requires '+(rule.routeToRole||rule.action)+' before approval.'};
}

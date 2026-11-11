import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getActor} from "@/lib/v2-auth";
import {appendAuditEntry} from "@/lib/audit/tamper-proof";
import {PermissionDeniedError, requirePermission} from "@/lib/auth/rbac";

async function requireCarrierPermission(actor: {id: string; tenantId: string; platformRole: string; role?: string}, code: string) {
 if (actor.role === "OWNER") return;
 await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, code);
}

export async function GET(){const u=await getActor();if(!u)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});if(!["SHIPPING", "ADMIN"].includes(u.platformRole))return NextResponse.json({error:"CARRIER_ROLE_REQUIRED"},{status:403});return NextResponse.json({shipments:await prisma.shipment.findMany({where:{tenantId:u.tenantId,deletedAt:null},orderBy:{createdAt:"desc"},take:100})});}
export async function POST(req:Request){
 const u=await getActor();
 if(!u)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
 if(u.platformRole!=="SHIPPING")return NextResponse.json({error:"CARRIER_ROLE_REQUIRED"},{status:403});
 try { await requireCarrierPermission(u, "shipping:create_trip"); }
 catch (error) { if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "DELIVERY_PERMISSION_REQUIRED" }, { status: 403 }); throw error; }
 const b=await req.json().catch(()=>null);
 if(!b?.corridor||!b?.originHub||!b?.destinationHub)return NextResponse.json({error:"corridor, originHub and destinationHub are required"},{status:400});
 const orderIds=Array.isArray(b.orderIds)&&b.orderIds.every((id:unknown)=>typeof id==='string'&&id.length>0)?b.orderIds as string[]:[];
 if(new Set(orderIds).size!==orderIds.length)return NextResponse.json({error:"orderIds must not contain duplicates"},{status:400});
 const estimatedArrival=b.estimatedArrival===undefined?undefined:new Date(b.estimatedArrival);
 if(estimatedArrival&&!Number.isFinite(estimatedArrival.getTime()))return NextResponse.json({error:"estimatedArrival must be a valid date"},{status:400});
 const totalWeightKg=b.totalWeightKg===undefined?undefined:Number(b.totalWeightKg);
 if(totalWeightKg!==undefined&&(!Number.isFinite(totalWeightKg)||totalWeightKg<=0))return NextResponse.json({error:"totalWeightKg must be a positive number"},{status:400});
 if(orderIds.length!==1)return NextResponse.json({error:"One accepted carrier assignment is required per shipment"},{status:400});
 const assignment=await prisma.carrierOrderAssignment.findFirst({where:{orderId:orderIds[0],carrierTenantId:u.tenantId,status:'ACCEPTED',deletedAt:null},select:{id:true,orderId:true}});
 if(!assignment)return NextResponse.json({error:"ACCEPTED_CARRIER_ASSIGNMENT_REQUIRED"},{status:403});
 const shipment=await prisma.shipment.create({data:{tenantId:u.tenantId,assignmentId:assignment.id,orderIds,corridor:String(b.corridor),truckType:String(b.truckType||"STANDARD"),vehicleNumber:b.vehicleNumber||undefined,driverName:b.driverName||undefined,driverMobile:b.driverMobile||undefined,originHub:String(b.originHub),destinationHub:String(b.destinationHub),estimatedArrival,totalWeightKg,orderCount:1,status:"PLANNED"}});
 await appendAuditEntry({entityName:"SHIPMENT",entityId:shipment.id,actionType:"PLANNED",tenantId:u.tenantId,actorId:u.id,actorRole:u.platformRole,changes:{orderIds,corridor:b.corridor}});
 return NextResponse.json({shipment},{status:201});
}

export async function PATCH(req:Request){
 const u=await getActor();if(!u)return NextResponse.json({error:'UNAUTHENTICATED'},{status:401});
 if(u.platformRole!=='SHIPPING')return NextResponse.json({error:'CARRIER_ROLE_REQUIRED'},{status:403});
 try { await requireCarrierPermission(u, "order:update"); }
 catch (error) { if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "DELIVERY_PERMISSION_REQUIRED" }, { status: 403 }); throw error; }
 const b=await req.json().catch(()=>null);
 const transitions:Record<string,string[]>={PLANNED:['PICKED_UP'],PICKED_UP:['IN_TRANSIT'],IN_TRANSIT:['DELIVERED'],DELIVERED:[]};
 if(typeof b?.id!=='string'||typeof b?.status!=='string')return NextResponse.json({error:'Shipment and status are required'},{status:400});
 const shipment=await prisma.shipment.findFirst({where:{id:b.id,tenantId:u.tenantId,deletedAt:null},include:{assignment:true}});
 if(!shipment||!shipment.assignment||shipment.assignment.carrierTenantId!==u.tenantId)return NextResponse.json({error:'SHIPMENT_NOT_FOUND'},{status:404});
 if(!transitions[shipment.status]?.includes(b.status))return NextResponse.json({error:'INVALID_SHIPMENT_TRANSITION'},{status:409});
 let evidence: string[]=[];
 if(b.status==='DELIVERED'){
  if(!Array.isArray(b.evidenceUrls)||b.evidenceUrls.length<1||b.evidenceUrls.length>8)return NextResponse.json({error:'DELIVERY_EVIDENCE_REQUIRED'},{status:400});
  if(!b.evidenceUrls.every((url: unknown)=>typeof url==='string'&&url.length<=2000&&url.startsWith('https://')))return NextResponse.json({error:'SECURE_DELIVERY_EVIDENCE_REQUIRED'},{status:400});
  evidence=[...new Set(b.evidenceUrls as string[])];
 }
 await prisma.$transaction(async tx=>{
  await tx.shipment.update({where:{id:shipment.id},data:{status:b.status,...(b.status==='PICKED_UP'?{dispatchDate:new Date()}:{})}});
  if(b.status==='DELIVERED')await tx.carrierOrderAssignment.update({where:{id:shipment.assignment!.id},data:{status:'DELIVERED',deliveredAt:new Date(),deliveryEvidence:evidence}});
  await appendAuditEntry({entityName:'SHIPMENT',entityId:shipment.id,actionType:'STATUS_CHANGED',tenantId:u.tenantId,actorId:u.id,actorRole:u.platformRole,changes:{from:shipment.status,to:b.status,evidenceUrls:evidence}},tx);
 });
 return NextResponse.json({updated:true});
}

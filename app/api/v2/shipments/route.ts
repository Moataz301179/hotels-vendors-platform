import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getActor} from "@/lib/v2-auth";
import {appendAuditEntry} from "@/lib/audit/tamper-proof";
export async function GET(){const u=await getActor();if(!u)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});if(!["SHIPPING", "ADMIN"].includes(u.platformRole))return NextResponse.json({error:"CARRIER_ROLE_REQUIRED"},{status:403});return NextResponse.json({shipments:await prisma.shipment.findMany({where:{tenantId:u.tenantId,deletedAt:null},orderBy:{createdAt:"desc"},take:100})});}
export async function POST(req:Request){
 const u=await getActor();
 if(!u)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
 if(!["SHIPPING","ADMIN"].includes(u.platformRole))return NextResponse.json({error:"CARRIER_ROLE_REQUIRED"},{status:403});
 const b=await req.json().catch(()=>null);
 if(!b?.corridor||!b?.originHub||!b?.destinationHub)return NextResponse.json({error:"corridor, originHub and destinationHub are required"},{status:400});
 const orderIds=Array.isArray(b.orderIds)&&b.orderIds.every((id:unknown)=>typeof id==='string'&&id.length>0)?b.orderIds as string[]:[];
 if(new Set(orderIds).size!==orderIds.length)return NextResponse.json({error:"orderIds must not contain duplicates"},{status:400});
 const estimatedArrival=b.estimatedArrival===undefined?undefined:new Date(b.estimatedArrival);
 if(estimatedArrival&&!Number.isFinite(estimatedArrival.getTime()))return NextResponse.json({error:"estimatedArrival must be a valid date"},{status:400});
 const totalWeightKg=b.totalWeightKg===undefined?undefined:Number(b.totalWeightKg);
 if(totalWeightKg!==undefined&&(!Number.isFinite(totalWeightKg)||totalWeightKg<=0))return NextResponse.json({error:"totalWeightKg must be a positive number"},{status:400});
 const orders=orderIds.length?await prisma.order.findMany({where:{id:{in:orderIds},tenantId:u.tenantId,deletedAt:null},select:{id:true}}):[];
 if(orderIds.length!==orders.length)return NextResponse.json({error:"One or more orders are outside your tenant or unavailable"},{status:403});
 const shipment=await prisma.shipment.create({data:{tenantId:u.tenantId,orderIds,corridor:String(b.corridor),truckType:String(b.truckType||"STANDARD"),vehicleNumber:b.vehicleNumber||undefined,driverName:b.driverName||undefined,driverMobile:b.driverMobile||undefined,originHub:String(b.originHub),destinationHub:String(b.destinationHub),estimatedArrival,totalWeightKg,orderCount:orderIds.length,status:"PLANNED"}});
 await appendAuditEntry({entityName:"SHIPMENT",entityId:shipment.id,actionType:"PLANNED",tenantId:u.tenantId,actorId:u.id,actorRole:u.platformRole,changes:{orderIds,corridor:b.corridor}});
 return NextResponse.json({shipment},{status:201});
}

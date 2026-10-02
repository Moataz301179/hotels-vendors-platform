import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

export async function GET(){
 const user=await getActor(); if(!user)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
 const orders=await prisma.order.findMany({where:{tenantId:user.tenantId,deletedAt:null},include:{supplier:{select:{name:true}},hotel:{select:{name:true}},items:{include:{product:{select:{name:true,sku:true}}}}},orderBy:{createdAt:"desc"},take:100});
 return NextResponse.json({orders});
}

export async function POST(req:Request){
 const user=await getActor(); if(!user)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
 const b=await req.json().catch(()=>null); const productId=String(b?.productId||""); const quantity=Number(b?.quantity||0); const supplierId=String(b?.supplierId||"");
 if(!productId||!supplierId||!Number.isInteger(quantity)||quantity<=0)return NextResponse.json({error:"productId, supplierId and positive integer quantity are required"},{status:400});
 const [product,supplier,hotel]=await Promise.all([prisma.product.findFirst({where:{id:productId,status:"ACTIVE",deletedAt:null,supplier:{id:supplierId,status:"ACTIVE",isVerified:true}},select:{id:true,unitPrice:true,supplierId:true}}),prisma.supplier.findFirst({where:{id:supplierId,status:"ACTIVE",isVerified:true,deletedAt:null},select:{id:true}}),prisma.hotel.findFirst({where:{tenantId:user.tenantId,status:"ACTIVE",deletedAt:null},orderBy:{createdAt:"asc"},select:{id:true}})]);
 if(!product||!supplier||!hotel)return NextResponse.json({error:"Product, supplier or active hotel is not available in your tenant"},{status:404});
 if(product.supplierId!==supplier.id)return NextResponse.json({error:"Supplier does not own this product"},{status:409});
 const unitPrice=Number(b?.unitPrice||product.unitPrice||0); if(unitPrice<=0)return NextResponse.json({error:"A real unit price is required; use an RFQ first if price is unknown"},{status:400});
 const subtotal=unitPrice*quantity; const order=await prisma.order.create({data:{orderNumber:"HV-"+Date.now().toString(36).toUpperCase(),status:"PENDING_APPROVAL",currency:String(b?.currency||"EGP"),hotelId:hotel.id,supplierId:supplier.id,requesterId:user.id,tenantId:user.tenantId,deliveryDate:b?.deliveryDate?new Date(b.deliveryDate):undefined,deliveryInstructions:b?.deliveryInstructions||undefined,subtotal,total:subtotal,items:{create:{productId:product.id,quantity,unitPrice,total:subtotal}}},include:{items:true}});
 await appendAuditEntry({entityName:"ORDER",entityId:order.id,actionType:"CREATED",tenantId:user.tenantId,actorId:user.id,actorRole:user.platformRole,changes:{orderNumber:order.orderNumber,subtotal,productId,quantity}});
 return NextResponse.json({order},{status:201});
}

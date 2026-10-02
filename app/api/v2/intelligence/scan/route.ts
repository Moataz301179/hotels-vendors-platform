import {NextResponse} from 'next/server';
import {createHash} from 'crypto';
import {prisma} from '@/lib/prisma';
import {getActor} from '@/lib/v2-auth';
import {appendAuditEntry} from '@/lib/audit/tamper-proof';
type Row={orderId:string;quantity:number;unitPrice:number;supplierId:string;supplierName:string};
export async function POST(){const u=await getActor();if(!u)return NextResponse.json({error:'UNAUTHENTICATED'},{status:401});if(u.platformRole!=='HOTEL'&&u.platformRole!=='ADMIN')return NextResponse.json({error:'HOTEL_ROLE_REQUIRED'},{status:403});
 const orders=await prisma.order.findMany({where:{tenantId:u.tenantId,deletedAt:null,status:{notIn:['DRAFT','CANCELLED','REJECTED']}},include:{items:{select:{productId:true,quantity:true,unitPrice:true}},supplier:{select:{id:true,name:true}}},orderBy:{createdAt:'desc'},take:500});
 const byProduct=new Map<string,Row[]>();
 for(const o of orders)for(const i of o.items){const a=byProduct.get(i.productId)||[];a.push({orderId:o.id,quantity:i.quantity,unitPrice:Number(i.unitPrice||0),supplierId:o.supplier.id,supplierName:o.supplier.name});byProduct.set(i.productId,a)}
 const created:Array<{id:string;title:string}>=[]; 
 for(const [productId,rows] of byProduct){if(rows.length<2)continue;const prices=rows.map(x=>x.unitPrice).filter(x=>x>0);const min=Math.min(...prices),max=Math.max(...prices);if(min<=0||max/min<1.08)continue;const latest=rows[0];const potential=(latest.unitPrice-min)*latest.quantity;if(potential<=0)continue;const existing=await prisma.opportunity.findFirst({where:{tenantId:u.tenantId,affectedProductId:productId,type:'PRICE_DRIFT',status:{not:'CLOSED'},deletedAt:null}});if(existing)continue;
 const evidence=await prisma.evidenceRecord.create({data:{tenantId:u.tenantId,extractedFact:'Observed transaction price range EGP '+min.toFixed(2)+'–'+max.toFixed(2)+' across '+rows.length+' persisted order lines.',entityId:productId,entityName:'Product '+productId,provenanceClass:'OBSERVED',confidenceScore:Math.min(0.98,0.65+rows.length*0.05),status:'EXTRACTED',rawEvidenceHash:createHash('sha256').update(JSON.stringify(rows)).digest('hex')}});
 const opp=await prisma.opportunity.create({data:{tenantId:u.tenantId,type:'PRICE_DRIFT',status:'DETECTED',title:'Price drift detected for product '+productId,description:'Persisted order history shows a material unit-price spread. Review supplier quote history before acting.',evidence:{evidenceId:evidence.id,orderIds:rows.map(x=>x.orderId),method:'min/max persisted order-line unit price',observations:rows.length},baseline:max,currentValue:min,potentialImpact:potential,confidence:evidence.confidenceScore,recommendedAction:'Request a fresh quote and compare against the lowest evidenced historical unit price.',affectedProductId:productId,affectedSupplierId:latest.supplierId,affectedCategory:'PROCUREMENT',verificationState:'EVIDENCE_BACKED'}});
 created.push({id:opp.id,title:opp.title});await appendAuditEntry({entityName:'OPPORTUNITY',entityId:opp.id,actionType:'DETECTED',tenantId:u.tenantId,actorId:u.id,actorRole:u.platformRole,changes:{type:'PRICE_DRIFT',evidenceId:evidence.id,potentialImpact:potential}})
 }
 return NextResponse.json({createdCount:created.length,opportunities:created});
}

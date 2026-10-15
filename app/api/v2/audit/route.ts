import {NextResponse} from 'next/server';
import {getActor} from '@/lib/v2-auth';
import {prisma} from '@/lib/prisma';
import {verifyTenantAuditRecords} from '@/lib/audit/tamper-proof';
import {managedHotelTenants} from '@/lib/admin/managed-hotel-tenants';
export async function GET(req:Request){
 const u=await getActor();if(!u)return NextResponse.json({error:'UNAUTHENTICATED'},{status:401});if(u.platformRole!=='ADMIN')return NextResponse.json({error:'ADMIN_REQUIRED'},{status:403});
 const params=new URL(req.url).searchParams;const cursor=params.get('cursor');const query=(params.get('q')??'').trim();if(query.length>100)return NextResponse.json({error:'Search must be at most 100 characters'},{status:400});
 const requestedTenantId=params.get('tenantId');const includeManaged=params.get('includeManaged')==='true';
 const tenants=(requestedTenantId||includeManaged)?await managedHotelTenants(u.tenantId):[];
 if((requestedTenantId||includeManaged)&&!tenants)return NextResponse.json({error:'PLATFORM_TENANT_REQUIRED'},{status:403});
 const managedTenants=tenants??[];
 const tenantId=requestedTenantId||u.tenantId;
 if(tenantId!==u.tenantId&&!managedTenants.some(tenant=>tenant.id===tenantId))return NextResponse.json({error:'HOTEL_TENANT_NOT_FOUND'},{status:404});
 if(cursor&&!await prisma.auditLog.findFirst({where:{id:cursor,tenantId},select:{id:true}}))return NextResponse.json({error:'Invalid page cursor'},{status:400});
 const entries=await prisma.auditLog.findMany({where:{tenantId,...(query?{OR:[{entityId:{contains:query}},{actorId:{contains:query}}]}:{})},orderBy:[{createdAt:'desc'},{id:'desc'}],take:51,...(cursor?{cursor:{id:cursor},skip:1}:{}),select:{id:true,createdAt:true,entityName:true,entityId:true,actionType:true,actorId:true,actorRole:true,hash:true}});
 const verification=params.get('verify')==='true'?await verifyTenantAuditRecords(tenantId):null;
 return NextResponse.json({tenantId,platformTenantId:u.tenantId,tenants:managedTenants,entries:entries.slice(0,50),nextCursor:entries.length>50?entries[49].id:null,verification,verificationScope:'Tenant record hashes; does not establish global-chain completeness.'},{headers:{'Cache-Control':'private, no-store'}});
}

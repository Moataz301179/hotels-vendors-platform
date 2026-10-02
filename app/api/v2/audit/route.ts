import {NextResponse} from 'next/server';
import {getActor} from '@/lib/v2-auth';
import {prisma} from '@/lib/prisma';
import {verifyAuditChain} from '@/lib/audit/tamper-proof';
export async function GET(){const u=await getActor();if(!u)return NextResponse.json({error:'UNAUTHENTICATED'},{status:401});if(u.platformRole!=='ADMIN')return NextResponse.json({error:'ADMIN_REQUIRED'},{status:403});const [verification,entries]=await Promise.all([verifyAuditChain(),prisma.auditLog.findMany({orderBy:{createdAt:'desc'},take:200})]);return NextResponse.json({verification,entries});}

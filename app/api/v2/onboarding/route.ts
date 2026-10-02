import {NextResponse} from 'next/server';import {getActor} from '@/lib/v2-auth';
export async function GET(){const user=await getActor();if(!user)return NextResponse.json({error:'UNAUTHENTICATED'},{status:401});return NextResponse.json({complete:true,platformRole:user.platformRole,tenantId:user.tenantId})}

import {NextResponse} from 'next/server';import {getActor} from '@/lib/v2-auth';
export async function GET(){const user=await getActor();if(!user)return NextResponse.json({error:'UNAUTHENTICATED'},{status:401});return NextResponse.json({user:{id:user.id,name:user.name,email:user.email,platformRole:user.platformRole,tenantId:user.tenantId}})}

import {NextResponse} from 'next/server';
import {getActor} from '@/lib/v2-auth';
import {FunderRegistry} from '@/lib/funders/gateway';
export async function GET(){const actor=await getActor();if(!actor)return NextResponse.json({error:'UNAUTHENTICATED'},{status:401});if(!['HOTEL','SUPPLIER','FACTORING','ADMIN'].includes(actor.platformRole))return NextResponse.json({error:'FUNDING_ROLE_REQUIRED'},{status:403});return NextResponse.json({connections:new FunderRegistry().connected(),dataSharingEnabled:false,creditLine:{state:'UNAVAILABLE',reason:'EXTERNAL_FUNDER_PULL_REQUIRED'},reason:'No verified institutional adapter is provisioned. Recorded partners are not live connections; HotelsVendors cannot enter a credit balance or disburse funds.'},{headers:{'Cache-Control':'private, no-store'}})}

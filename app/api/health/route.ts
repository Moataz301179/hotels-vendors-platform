import {NextResponse} from 'next/server';export async function GET(){return NextResponse.json({ok:true,service:'hotelsvendors',version:'v2',time:new Date().toISOString()})}

import { NextResponse } from 'next/server';
import { getActor } from '@/lib/v2-auth';
import { planMobileWorkspace } from '@/lib/mobile/field-layer';

/** The phone asks the server which field workspace this account owns. */
export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const plan = planMobileWorkspace({ platformRole: actor.platformRole, role: actor.role });
  return NextResponse.json({
    ...plan,
    account: { platformRole: actor.platformRole, role: actor.role },
  });
}

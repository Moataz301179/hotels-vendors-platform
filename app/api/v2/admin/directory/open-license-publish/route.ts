import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getActor } from '@/lib/v2-auth';

const input = z.object({ candidateIds: z.array(z.string().min(1)).min(1).max(100) });

async function directoryAdmin() {
  const actor = await getActor();
  if (!actor) return { actor: null, response: NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 }) };
  if (actor.platformRole !== 'ADMIN') return { actor: null, response: NextResponse.json({ error: 'ADMIN_REQUIRED' }, { status: 403 }) };
  return { actor, response: null };
}

/**
 * Publishes an intentionally narrow class of source: a known open-data export
 * with a recorded ODbL/CC-BY-SA evidence object. It cannot be used to publish
 * arbitrary scraped supplier material or commercial terms.
 */
export async function POST(request: Request) {
  const { actor, response } = await directoryAdmin();
  if (!actor) return response!;
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'OPEN_LICENSED_CANDIDATE_IDS_REQUIRED' }, { status: 400 });
  return NextResponse.json({ error: 'REVIEWER_AUTHORED_PUBLIC_PROFILE_REQUIRED', candidateIds: parsed.data.candidateIds }, { status: 409 });
}

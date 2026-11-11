import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';

/** Read one private receipt photo. The file is limited to its organization, or an administrator. */
export async function GET(_request: Request, context: { params: Promise<{ fileId: string }> }) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const { fileId } = await context.params;
  const file = await prisma.receiptEvidenceFile.findFirst({
    where: {
      id: fileId,
      deletedAt: null,
      ...(actor.platformRole === 'ADMIN' ? {} : { tenantId: actor.tenantId }),
    },
    select: { bytes: true, contentType: true },
  });
  if (!file) return NextResponse.json({ error: 'RECEIPT_EVIDENCE_NOT_FOUND' }, { status: 404 });
  return new NextResponse(Buffer.from(file.bytes), {
    status: 200,
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

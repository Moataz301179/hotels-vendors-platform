import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';
import { PermissionDeniedError, requirePermission } from '@/lib/auth/rbac';
import { inspectReceiptImage } from '@/lib/evidence/receipt-image';

const receivingRoles = ['OWNER', 'REGIONAL_GM', 'GM', 'FINANCIAL_CONTROLLER', 'RECEIVING_CLERK'];

/** Store one receipt photo for the signed-in organization. The bytes stay private. */
export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const hotelReceiver = actor.platformRole === 'HOTEL' && receivingRoles.includes(actor.role);
  const carrier = actor.platformRole === 'SHIPPING';
  if (!hotelReceiver && !carrier && actor.platformRole !== 'ADMIN') {
    return NextResponse.json({ error: 'RECEIPT_EVIDENCE_ROLE_REQUIRED' }, { status: 403 });
  }
  if (hotelReceiver) {
    try {
      await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, 'order:update');
    } catch (error) {
      if (error instanceof PermissionDeniedError) return NextResponse.json({ error: 'RECEIPT_PERMISSION_REQUIRED' }, { status: 403 });
      throw error;
    }
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'RECEIPT_IMAGE_REQUIRED' }, { status: 400 });
  let image;
  try {
    image = inspectReceiptImage(Buffer.from(await file.arrayBuffer()), file.type || '');
  } catch (error) {
    const code = error instanceof Error ? error.message : 'RECEIPT_IMAGE_TYPE_INVALID';
    return NextResponse.json({ error: code }, { status: 400 });
  }
  const sha256 = createHash('sha256').update(image.bytes).digest('hex');
  const saved = await prisma.receiptEvidenceFile.create({
    data: {
      tenantId: actor.tenantId,
      uploadedById: actor.id,
      sha256,
      contentType: image.contentType,
      byteSize: image.bytes.length,
      bytes: Uint8Array.from(image.bytes),
    },
    select: { id: true, sha256: true, contentType: true, byteSize: true },
  });
  return NextResponse.json(saved, { status: 201 });
}

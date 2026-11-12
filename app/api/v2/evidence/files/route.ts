import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { PermissionDeniedError, requirePermission } from "@/lib/auth/rbac";
import { RECEIVING_ROLES } from "@/lib/mobile/workspace";
import { inspectReceiptImage, stripReceiptMetadata } from "@/lib/evidence/receipt-image";

/**
 * Store one receipt photo for the signed-in hotel receiver.
 * Carriers and administrators cannot upload. EXIF is stripped before storage.
 */
export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (actor.platformRole === "ADMIN" || actor.platformRole === "SHIPPING" || actor.platformRole !== "HOTEL" || !(RECEIVING_ROLES as readonly string[]).includes(actor.role)) {
    return NextResponse.json({ error: "RECEIPT_EVIDENCE_ROLE_REQUIRED" }, { status: 403 });
  }
  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, "order:update");
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "RECEIPT_PERMISSION_REQUIRED" }, { status: 403 });
    throw error;
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "RECEIPT_IMAGE_REQUIRED" }, { status: 400 });
  let image;
  try {
    image = await stripReceiptMetadata(inspectReceiptImage(Buffer.from(await file.arrayBuffer()), file.type || ""));
  } catch (error) {
    const code = error instanceof Error ? error.message : "RECEIPT_IMAGE_TYPE_INVALID";
    const status = code.startsWith("RECEIPT_IMAGE_") ? 400 : 400;
    return NextResponse.json({ error: code }, { status });
  }
  const sha256 = createHash("sha256").update(image.bytes).digest("hex");
  const saved = await prisma.receiptEvidenceFile.create({
    data: {
      tenantId: actor.tenantId,
      uploadedById: actor.id,
      sha256,
      contentType: image.contentType,
      byteSize: image.bytes.length,
      bytes: Uint8Array.from(image.bytes),
      exifStripped: true,
    },
    select: { id: true, sha256: true, contentType: true, byteSize: true, exifStripped: true },
  });
  return NextResponse.json(saved, { status: 201 });
}

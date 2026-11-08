import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

const bodySchema = z.object({
  recordId: z.string().min(1),
  imageRightsStatus: z.enum(["PERMISSION_UNKNOWN", "PERMITTED", "RESTRICTED"]),
  imageRightsNote: z.string().trim().min(15).max(1000),
});

export async function PATCH(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (actor.platformRole !== "ADMIN") return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "IMAGE_RIGHTS_DECISION_AND_EVIDENCE_NOTE_REQUIRED" }, { status: 400 });
  const row = await prisma.catalogReceivingRecord.findFirst({
    where: { id: parsed.data.recordId, deletedAt: null, batch: { tenantId: actor.tenantId } },
    select: { id: true, rawProductName: true, approvedImageUrls: true },
  });
  if (!row) return NextResponse.json({ error: "RECEIVING_RECORD_NOT_FOUND" }, { status: 404 });
  if (parsed.data.imageRightsStatus === "PERMITTED" && row.approvedImageUrls.length === 0) {
    return NextResponse.json({ error: "NO_QUALITY_APPROVED_IMAGE_TO_CLEAR" }, { status: 409 });
  }
  const updated = await prisma.catalogReceivingRecord.update({
    where: { id: row.id },
    data: { imageRightsStatus: parsed.data.imageRightsStatus, imageRightsNote: parsed.data.imageRightsNote },
    select: { id: true, imageRightsStatus: true, imageRightsNote: true },
  });
  await appendAuditEntry({
    entityName: "EVIDENCE",
    entityId: row.id,
    actionType: "STATUS_CHANGED",
    tenantId: actor.tenantId,
    actorId: actor.id,
    actorRole: actor.platformRole,
    changes: {
      event: "CATALOG_PRODUCT_IMAGE_RIGHTS_CHANGED",
      productName: row.rawProductName,
      imageRightsStatus: updated.imageRightsStatus,
      imageCount: row.approvedImageUrls.length,
      imageRightsNote: updated.imageRightsNote,
      publicationStillRequiresSourceAndProductReview: true,
    },
  });
  return NextResponse.json({ imageRights: updated });
}

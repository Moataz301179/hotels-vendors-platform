import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { fetchAndAssessProductImage, enhanceProductImage, PRODUCT_IMAGE_OUTPUT } from "@/lib/catalog/receiving/product-image-enhancer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ recordId: string; imageIndex: string }> },
) {
  const actor = await getActor();
  const isAdmin = actor?.platformRole === "ADMIN";
  const { recordId, imageIndex } = await params;
  const index = Number(imageIndex);
  if (!Number.isSafeInteger(index) || index < 0 || index > 7) {
    return Response.json({ error: "CATALOG_IMAGE_NOT_FOUND" }, { status: 404 });
  }

  const record = await prisma.catalogReceivingRecord.findFirst({
    where: { id: recordId, deletedAt: null, qualityStatus: "ACCEPTED" },
    include: {
      batch: { select: { sourceUrl: true, tenantId: true } },
      directoryCandidate: {
        include: {
          source: { select: { permissionStatus: true, sourceType: true } },
          profile: { select: { publicationStatus: true, deletedAt: true, images: true } },
        },
      },
    },
  });
  if (!record) return Response.json({ error: "CATALOG_IMAGE_NOT_FOUND" }, { status: 404 });
  const imageUrl = record.approvedImageUrls[index];
  if (!imageUrl) return Response.json({ error: "CATALOG_IMAGE_NOT_FOUND" }, { status: 404 });

  const publicPath = "/api/v2/catalog/receiving/images/" + record.id + "/" + index;
  const profileImages = record.directoryCandidate?.profile?.images;
  const profileContainsImage = Array.isArray(profileImages) && profileImages.includes(publicPath);
  const publiclyApproved =
    record.imageRightsStatus === "PERMITTED" &&
    record.directoryCandidate?.reviewStatus === "APPROVED" &&
    record.directoryCandidate?.source.permissionStatus === "PERMITTED" &&
    record.directoryCandidate?.source.sourceType === "VENDOR_AUTHORIZED_HORECA_CATALOG" &&
    record.directoryCandidate?.profile?.publicationStatus === "PUBLISHED" &&
    !record.directoryCandidate.profile.deletedAt &&
    profileContainsImage;

  if (!isAdmin && !publiclyApproved) {
    return Response.json({ error: "CATALOG_IMAGE_NOT_PUBLICLY_CLEARED" }, { status: 404 });
  }
  if (isAdmin && actor.tenantId !== record.batch.tenantId) {
    return Response.json({ error: "CATALOG_IMAGE_NOT_FOUND" }, { status: 404 });
  }

  const result = await fetchAndAssessProductImage(imageUrl, [record.batch.sourceUrl]);
  if (!result.input || result.assessment.status !== "ACCEPTED") {
    return Response.json({ error: "CATALOG_IMAGE_FAILED_QUALITY_RECHECK", assessment: result.assessment }, { status: 422 });
  }
  try {
    const output = await enhanceProductImage(result.input);
    return new Response(new Uint8Array(output), {
      status: 200,
      headers: {
        "content-type": "image/webp",
        "content-length": String(output.byteLength),
        "cache-control": isAdmin ? "private, max-age=60" : "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        "x-content-type-options": "nosniff",
        "x-hv-image-standard": PRODUCT_IMAGE_OUTPUT.enhancer,
        "x-hv-image-dimensions": "1200x1200",
      },
    });
  } catch {
    return Response.json({ error: "CATALOG_IMAGE_ENHANCEMENT_FAILED" }, { status: 500 });
  }
}

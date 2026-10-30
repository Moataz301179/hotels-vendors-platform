import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { isSupplierOwnedProductMedia } from "@/lib/catalog/owned-product-media";
import { publicProductImageUrls } from "@/lib/catalog/public-product-images";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function GET(_request: Request, { params }: { params: Promise<{ productId: string; imageIndex: string }> }) {
  const actor = await getActor();
  if (!actor) return Response.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (actor.platformRole !== "HOTEL") return Response.json({ error: "BUYER_CATALOG_ACCESS_REQUIRED" }, { status: 403 });

  const { productId, imageIndex } = await params;
  const index = Number(imageIndex);
  if (!Number.isSafeInteger(index) || index < 0) return Response.json({ error: "CATALOG_IMAGE_NOT_FOUND" }, { status: 404 });

  if (!actor.departmentId) return Response.json({ error: "CATALOG_IMAGE_NOT_FOUND" }, { status: 404 });
  const grants = await prisma.departmentCategoryAccess.findMany({ where: { departmentId: actor.departmentId, revokedAt: null }, select: { category: true } });
  const categories = [...new Set(grants.map((grant) => grant.category))];
  if (!categories.length) return Response.json({ error: "CATALOG_IMAGE_NOT_FOUND" }, { status: 404 });
  const categoryScope: Prisma.ProductWhereInput = { category: { in: categories } };

  const product = await prisma.product.findFirst({
    where: { id: productId, status: "ACTIVE", deletedAt: null, source: { not: "FIXTURE" }, supplier: { status: "ACTIVE", isVerified: true, deletedAt: null }, ...categoryScope },
    select: { images: true, sourceKey: true, supplier: { select: { website: true } } },
  });
  if (!product) return Response.json({ error: "CATALOG_IMAGE_NOT_FOUND" }, { status: 404 });
  const imageUrl = publicProductImageUrls(product.images)[index];
  if (!imageUrl || !product.sourceKey || !isSupplierOwnedProductMedia(imageUrl, product.sourceKey, product.supplier.website)) return Response.json({ error: "CATALOG_IMAGE_NOT_FOUND" }, { status: 404 });

  let imageResponse: Response;
  try { imageResponse = await fetch(imageUrl, { redirect: "manual", headers: { accept: "image/*" }, signal: AbortSignal.timeout(5_000) }); }
  catch { return Response.json({ error: "CATALOG_IMAGE_UNAVAILABLE" }, { status: 502 }); }
  const contentType = imageResponse.headers.get("content-type") ?? "";
  const contentLength = Number(imageResponse.headers.get("content-length") ?? "0");
  if (!imageResponse.ok || !contentType.startsWith("image/") || (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES)) return Response.json({ error: "CATALOG_IMAGE_UNAVAILABLE" }, { status: 502 });
  return new Response(imageResponse.body, { status: 200, headers: { "content-type": contentType, "cache-control": "private, max-age=300", "x-content-type-options": "nosniff" } });
}

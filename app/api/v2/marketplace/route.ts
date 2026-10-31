import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { resolvedProductEvidenceIds } from "@/lib/catalog/resolved-product-evidence";
import { buyerSafeCatalogImageUrls } from "@/lib/catalog/buyer-safe-media";
import { toAnonymousCatalogProduct } from "@/lib/procurement/anonymous-commercial-disclosure";

export async function GET(req: Request) {
  const user = await getActor();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (user.platformRole !== 'HOTEL') return NextResponse.json({ error: 'BUYER_CATALOG_ACCESS_REQUIRED' }, { status: 403 });
  const q = new URL(req.url).searchParams.get("q")?.trim();
  const products = await prisma.product.findMany({
    where: {
      supplier: { status:"ACTIVE", isVerified:true, deletedAt:null },
      status: "ACTIVE", deletedAt: null, source:{not:"FIXTURE"},
      ...(q ? { OR: [{ name:{contains:q,mode:"insensitive"} }, { sku:{contains:q,mode:"insensitive"} }] } : {})
    },
    select: { id:true,uuid:true,sku:true,name:true,description:true,category:true,unitOfMeasure:true,images:true,sourceKey:true,supplier:{select:{website:true}} },
    orderBy:{createdAt:"desc"}, take:100
  });
  const eligibleProductIds = await resolvedProductEvidenceIds(prisma, products);
  return NextResponse.json({products:products.filter(product => eligibleProductIds.has(product.id)).map((product)=>({
    ...toAnonymousCatalogProduct(product),
    images: buyerSafeCatalogImageUrls({productId:product.id,images:product.images,imageSourceUrl:product.sourceKey,supplierWebsite:product.supplier.website}),
  }))});
}

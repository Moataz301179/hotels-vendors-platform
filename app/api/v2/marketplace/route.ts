import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { resolvedProductEvidenceIds } from "@/lib/catalog/resolved-product-evidence";

export async function GET(req: Request) {
  const user = await getActor();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q")?.trim();
  const networkScope = user.platformRole === "HOTEL" || user.platformRole === "ADMIN";
  const products = await prisma.product.findMany({
    where: {
      ...(networkScope ? { supplier: { status:"ACTIVE", isVerified:true, deletedAt:null } } : { tenantId:user.tenantId }),
      status: "ACTIVE", deletedAt: null, source:{not:"FIXTURE"},
      ...(q ? { OR: [{ name:{contains:q,mode:"insensitive"} }, { sku:{contains:q,mode:"insensitive"} }] } : {})
    },
    select: { id:true,uuid:true,sku:true,name:true,description:true,category:true,unitOfMeasure:true,unitPrice:true,basePrice:true,stockQuantity:true,leadTimeDays:true,images:true,sourceKey:true,supplier:{select:{id:true,name:true,isVerified:true,tenantId:true}} },
    orderBy:{createdAt:"desc"}, take:100
  });
  const eligibleProductIds = await resolvedProductEvidenceIds(prisma, products);
  return NextResponse.json({products:products.filter(product => eligibleProductIds.has(product.id)).map(({images,sourceKey,...product})=>({
    ...product,
    images: (() => { try { const parsed=JSON.parse(images??'[]'); return Array.isArray(parsed) ? parsed.filter((image): image is string => typeof image==='string' && /^https?:\/\//i.test(image)) : []; } catch { return []; } })()
  }))});
}

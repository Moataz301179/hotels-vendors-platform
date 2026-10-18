import { isSupplierOwnedProductMedia } from "@/lib/catalog/owned-product-media";
import { publicProductImageUrls } from "@/lib/catalog/public-product-images";

type BuyerSafeCatalogMediaInput = { productId: string; images: string | null; imageSourceUrl: string | null; supplierWebsite: string | null };

/** Buyer catalog cards use a first-party path so a supplier host cannot be inferred before commercial disclosure. */
export function buyerSafeCatalogImageUrls({ productId, images, imageSourceUrl, supplierWebsite }: BuyerSafeCatalogMediaInput) {
  if (!imageSourceUrl || !supplierWebsite) return [];
  return publicProductImageUrls(images).flatMap((imageUrl, index) => isSupplierOwnedProductMedia(imageUrl, imageSourceUrl, supplierWebsite)
    ? [`/api/v2/catalog/products/${encodeURIComponent(productId)}/images/${index}`]
    : []);
}

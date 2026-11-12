import sharp from "sharp";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_RECEIPT_IMAGE_BYTES = 4 * 1024 * 1024;

export type ReceiptImage = { bytes: Buffer; contentType: "image/jpeg" | "image/png" | "image/webp" };

/**
 * EXIF policy: strip it.
 * A receipt photo can carry GPS and the device that took it. The goods receipt
 * already records the hotel user, the order, and the time. The stored file is
 * the picture only. Upload fails closed if the metadata cannot be removed.
 */
export function inspectReceiptImage(bytes: Buffer, declaredType: string): ReceiptImage {
  if (!bytes.length) throw new Error("RECEIPT_IMAGE_EMPTY");
  if (bytes.length > MAX_RECEIPT_IMAGE_BYTES) throw new Error("RECEIPT_IMAGE_TOO_LARGE");
  const contentType = imageType(bytes);
  if (!contentType || contentType !== declaredType || !ALLOWED.has(declaredType)) throw new Error("RECEIPT_IMAGE_TYPE_INVALID");
  return { bytes, contentType };
}

export async function stripReceiptMetadata(image: ReceiptImage): Promise<ReceiptImage> {
  const format = image.contentType === "image/png" ? "png" : image.contentType === "image/webp" ? "webp" : "jpeg";
  const bytes = await sharp(image.bytes, { failOn: "error" }).rotate().toFormat(format).toBuffer();
  const stripped = inspectReceiptImage(bytes, image.contentType);
  const meta = await sharp(stripped.bytes).metadata();
  if (meta.exif || meta.icc || meta.xmp) throw new Error("RECEIPT_IMAGE_METADATA_REMAINED");
  return stripped;
}

function imageType(bytes: Buffer): ReceiptImage["contentType"] | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

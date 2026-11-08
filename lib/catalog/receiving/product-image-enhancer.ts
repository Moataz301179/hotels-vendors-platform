import sharp from "sharp";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MIN_SIDE = 600;
const MIN_PIXELS = 360_000;

export type ProductImageQuality = {
  sourceUrl: string;
  status: "ACCEPTED" | "REVIEW_REQUIRED" | "REJECTED";
  reasons: string[];
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  laplacianVariance?: number;
};

function sameSourceHost(imageUrl: URL, sourceUrls: string[]): boolean {
  const allowed = sourceUrls.flatMap((value) => {
    try { return [new URL(value).hostname.toLowerCase()]; } catch { return []; }
  });
  const imageHost = imageUrl.hostname.toLowerCase();
  return allowed.some((host) => imageHost === host || imageHost.endsWith("." + host));
}

function isPublicHttps(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return null;
    if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host)) return null;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return null;
    return url;
  } catch { return null; }
}

async function readLimited(response: Response): Promise<Buffer> {
  const length = Number(response.headers.get("content-length") || "0");
  if (Number.isFinite(length) && length > MAX_IMAGE_BYTES) throw new Error("IMAGE_EXCEEDS_8_MB");
  if (!response.body) throw new Error("IMAGE_BODY_EMPTY");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      total += part.value.byteLength;
      if (total > MAX_IMAGE_BYTES) {
        await reader.cancel();
        throw new Error("IMAGE_EXCEEDS_8_MB");
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), total);
}

function laplacianVariance(pixels: Buffer, width: number, height: number): number {
  const values: number[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const laplace = 4 * pixels[i] - pixels[i - 1] - pixels[i + 1] - pixels[i - width] - pixels[i + width];
      values.push(laplace);
    }
  }
  if (!values.length) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
}

export async function fetchAndAssessProductImage(
  sourceUrl: string,
  sourceCandidates: string[],
): Promise<{ assessment: ProductImageQuality; input: Buffer | null }> {
  const imageUrl = isPublicHttps(sourceUrl);
  if (!imageUrl || !sameSourceHost(imageUrl, sourceCandidates)) {
    return { assessment: { sourceUrl, status: "REVIEW_REQUIRED", reasons: ["IMAGE_HOST_NOT_ALLOWLISTED"] }, input: null };
  }
  try {
    const response = await fetch(imageUrl, {
      redirect: "manual",
      headers: { accept: "image/jpeg,image/png,image/webp,image/avif" },
      signal: AbortSignal.timeout(6_000),
    });
    const mime = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!response.ok || response.status >= 300 || !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(mime)) {
      return { assessment: { sourceUrl, status: "REJECTED", reasons: ["IMAGE_FORMAT_OR_RESPONSE_NOT_SUPPORTED"] }, input: null };
    }
    const input = await readLimited(response);
    const metadata = await sharp(input, { limitInputPixels: 40_000_000, animated: false }).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    const format = metadata.format || "unknown";
    const reasons: string[] = [];
    if (width < MIN_SIDE || height < MIN_SIDE || width * height < MIN_PIXELS) reasons.push("IMAGE_RESOLUTION_TOO_LOW");
    const ratio = height ? width / height : 0;
    if (ratio < 0.4 || ratio > 2.5) reasons.push("IMAGE_ASPECT_RATIO_NOT_PRODUCT_FRIENDLY");
    if (metadata.pages && metadata.pages > 1) reasons.push("ANIMATED_IMAGE_NOT_SUPPORTED");
    if (reasons.length) {
      return { assessment: { sourceUrl, status: "REJECTED", reasons, width, height, format, bytes: input.length }, input: null };
    }
    const small = await sharp(input, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize(96, 96, { fit: "fill" })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const variance = laplacianVariance(small.data, small.info.width, small.info.height);
    if (variance < 2) {
      return { assessment: { sourceUrl, status: "REVIEW_REQUIRED", reasons: ["IMAGE_LOW_DETAIL_OR_BLURRED_REVIEW"], width, height, format, bytes: input.length, laplacianVariance: variance }, input: null };
    }
    return { assessment: { sourceUrl, status: "ACCEPTED", reasons: ["RESOLUTION_FORMAT_AND_DETAIL_CHECK_PASSED"], width, height, format, bytes: input.length, laplacianVariance: variance }, input };
  } catch (error) {
    return {
      assessment: {
        sourceUrl,
        status: "REVIEW_REQUIRED",
        reasons: [error instanceof Error ? error.message.slice(0, 120) : "IMAGE_ASSESSMENT_FAILED"],
      },
      input: null,
    };
  }
}

/**
 * Deterministic visual standardizer. It corrects EXIF orientation, converts to
 * sRGB, applies restrained sharpening, centres the original product on a
 * neutral square canvas and emits WebP at a fixed 1200x1200 output size.
 * It never generates, removes, relabels, or reconstructs product details.
 */
export async function enhanceProductImage(input: Buffer): Promise<Buffer> {
  return sharp(input, { limitInputPixels: 40_000_000, animated: false })
    .rotate()
    .toColourspace("srgb")
    .resize(1200, 1200, {
      fit: "contain",
      background: { r: 248, g: 249, b: 250, alpha: 1 },
    })
    .flatten({ background: { r: 248, g: 249, b: 250 } })
    .sharpen({ sigma: 0.35, m1: 0.15, m2: 0.1 })
    .webp({ quality: 86, effort: 4, smartSubsample: true })
    .toBuffer();
}

export const PRODUCT_IMAGE_OUTPUT = {
  width: 1200,
  height: 1200,
  format: "webp",
  quality: 86,
  background: "#F8F9FA",
  enhancer: "hv-product-image-standardizer-v1",
} as const;

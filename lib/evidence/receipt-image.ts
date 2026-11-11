const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const MAX_RECEIPT_IMAGE_BYTES = 4 * 1024 * 1024;

export type ReceiptImage = { bytes: Buffer; contentType: 'image/jpeg' | 'image/png' | 'image/webp' };

/** Accept only a real image payload. The declared type must match the file header. */
export function inspectReceiptImage(bytes: Buffer, declaredType: string): ReceiptImage {
  if (!bytes.length) throw new Error('RECEIPT_IMAGE_EMPTY');
  if (bytes.length > MAX_RECEIPT_IMAGE_BYTES) throw new Error('RECEIPT_IMAGE_TOO_LARGE');
  const contentType = imageType(bytes);
  if (!contentType || contentType !== declaredType || !ALLOWED.has(declaredType)) throw new Error('RECEIPT_IMAGE_TYPE_INVALID');
  return { bytes, contentType };
}

function imageType(bytes: Buffer): ReceiptImage['contentType'] | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

import { describe, expect, it } from 'vitest';
import { inspectReceiptImage, MAX_RECEIPT_IMAGE_BYTES } from '@/lib/evidence/receipt-image';

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x11]);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('receipt photo inspection', () => {
  it('accepts a jpeg whose header matches the declared type', () => {
    expect(inspectReceiptImage(jpeg, 'image/jpeg')).toMatchObject({ contentType: 'image/jpeg' });
  });

  it('rejects a mismatched type, an empty file, and a file over the limit', () => {
    expect(() => inspectReceiptImage(png, 'image/jpeg')).toThrow('RECEIPT_IMAGE_TYPE_INVALID');
    expect(() => inspectReceiptImage(Buffer.alloc(0), 'image/jpeg')).toThrow('RECEIPT_IMAGE_EMPTY');
    expect(() => inspectReceiptImage(Buffer.alloc(MAX_RECEIPT_IMAGE_BYTES + 1, 0xff), 'image/jpeg')).toThrow('RECEIPT_IMAGE_TOO_LARGE');
  });
});

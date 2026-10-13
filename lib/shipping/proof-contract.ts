import { z } from "zod";
// Proof metadata accompanies private binary upload; URL-only evidence is never accepted.
export const ProofCaptureSchema = z.object({
  stopId: z.string().min(1).max(128),
  receivedBy: z.string().trim().min(1).max(150),
  notes: z.string().trim().max(500).optional(),
  idempotencyKey: z.string().min(16).max(128).regex(/^[a-zA-Z0-9_-]+$/),
}).strict();

export function validProofImage(bytes: Uint8Array, mime: string): boolean {
  if (!bytes.length || bytes.length > 5 * 1024 * 1024) return false;
  const starts = (signature: number[]) => signature.every((value, index) => bytes[index] === value);
  if (mime === "image/jpeg") return starts([255, 216, 255]);
  if (mime === "image/png") return starts([137, 80, 78, 71, 13, 10, 26, 10]);
  if (mime === "image/webp") return starts([82, 73, 70, 70]) && [87, 69, 66, 80].every((value, index) => bytes[index + 8] === value);
  return false;
}

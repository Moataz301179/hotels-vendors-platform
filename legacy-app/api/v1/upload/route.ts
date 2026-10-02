/**
 * Upload API — Product Images
 * POST /api/v1/upload — Upload product images
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/api-utils";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];
const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "products");

// Magic byte signatures for allowed image types
const MAGIC_BYTES: Record<string, Buffer[]> = {
  "image/jpeg": [Buffer.from([0xff, 0xd8, 0xff])],
  "image/png": [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  "image/webp": [Buffer.from("RIFF", "ascii")], // RIFF....WEBP
  "image/gif": [Buffer.from("GIF87a", "ascii"), Buffer.from("GIF89a", "ascii")],
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;
  return signatures.some((sig) => buffer.subarray(0, sig.length).equals(sig));
}

function getExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mimeType] || "jpg";
}

export async function POST(request: NextRequest) {
  try {
    // Require auth
    await authenticate(request);

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    if (files.length > 5) {
      return NextResponse.json(
        { success: false, error: "Maximum 5 images per upload" },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    const uploadedUrls: string[] = [];

    for (const file of files) {
      // Validate file type via declared MIME
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF` },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: `File too large: ${file.name}. Max size: 5MB` },
          { status: 400 }
        );
      }

      // Read buffer for magic byte validation
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Validate magic bytes match declared MIME type
      if (!validateMagicBytes(buffer, file.type)) {
        return NextResponse.json(
          { success: false, error: `File content does not match declared type: ${file.type}` },
          { status: 400 }
        );
      }

      // Derive extension from MIME type (not from filename) to prevent extension spoofing
      const ext = getExtensionFromMime(file.type);
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          { success: false, error: `Extension not allowed: ${ext}` },
          { status: 400 }
        );
      }

      // Generate unique filename using only UUID + validated extension
      const uniqueId = randomBytes(16).toString("hex");
      const filename = `${uniqueId}.${ext}`;

      await writeFile(join(UPLOAD_DIR, filename), buffer);

      // Return public URL
      const url = `/uploads/products/${filename}`;
      uploadedUrls.push(url);
    }

    return NextResponse.json({
      success: true,
      data: { urls: uploadedUrls },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

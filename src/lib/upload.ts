import { createHash, randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError } from "@/lib/errors";
import { isCloudinaryConfigured } from "@/lib/env";

const MAX_BYTES = 5 * 1024 * 1024;

const TYPES: Record<string, { extension: string; matches: (bytes: Uint8Array) => boolean }> = {
  "image/jpeg": {
    extension: "jpg",
    matches: (bytes) => bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  "image/png": {
    extension: "png",
    matches: (bytes) => bytes.length > 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47,
  },
  "image/webp": {
    extension: "webp",
    matches: (bytes) =>
      bytes.length > 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50,
  },
};

export function assertImageUpload(bytes: Uint8Array, mime: string) {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) {
    throw new AppError(400, "invalid_upload", "Images must be smaller than 5 MB.");
  }
  const type = TYPES[mime];
  if (!type || !type.matches(bytes)) {
    throw new AppError(400, "invalid_upload", "Upload a JPEG, PNG, or WebP image.");
  }
  return type.extension;
}

async function uploadToCloudinary(bytes: Uint8Array, mime: string, extension: string) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const secret = process.env.CLOUDINARY_API_SECRET!;
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "loco/posters";
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${secret}`).digest("hex");
  const body = new FormData();
  body.append("file", new Blob([bytes as BlobPart], { type: mime }), `upload.${extension}`);
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("folder", folder);
  body.append("signature", signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body });
  const payload = (await response.json()) as { secure_url?: string; error?: { message?: string } };
  if (!response.ok || !payload.secure_url) {
    throw new AppError(502, "upload_failed", "The image host rejected this upload.");
  }
  return payload.secure_url;
}

async function uploadLocally(bytes: Uint8Array, extension: string) {
  if (process.env.NODE_ENV === "production") {
    throw new AppError(
      503,
      "storage_unconfigured",
      "Image storage is not configured. Add Cloudinary credentials before uploading in production.",
    );
  }
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${extension}`;
  await writeFile(path.join(directory, filename), bytes);
  return `/uploads/${filename}`;
}

export async function storeImage(bytes: Uint8Array, mime: string) {
  const extension = assertImageUpload(bytes, mime);
  if (isCloudinaryConfigured()) return uploadToCloudinary(bytes, mime, extension);
  return uploadLocally(bytes, extension);
}

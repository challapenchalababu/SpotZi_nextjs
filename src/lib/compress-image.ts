const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
/** Reject absurd local files before decoding — keeps the browser responsive. */
export const MAX_SOURCE_BYTES = 40 * 1024 * 1024;
const MAX_EDGE = 2048;

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function needsCompression(file: File) {
  return file.size > MAX_UPLOAD_BYTES;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not compress this image."));
      },
      type,
      quality,
    );
  });
}

function isHeicLike(file: File) {
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return (
    type.includes("heic") ||
    type.includes("heif") ||
    name.endsWith(".heic") ||
    name.endsWith(".heif") ||
    name.endsWith(".hif")
  );
}

async function looksLikeHeic(file: File) {
  if (isHeicLike(file)) return true;
  try {
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (header.length < 12) return false;
    const brand = String.fromCharCode(...header.slice(8, 12)).toLowerCase();
    return brand === "heic" || brand === "heif" || brand === "mif1" || brand === "msf1";
  } catch {
    return false;
  }
}

function asDecodableBlob(file: File) {
  const type = (file.type || "").toLowerCase();
  if (type.startsWith("image/") && type !== "image/*") return file;
  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) return new Blob([file], { type: "image/png" });
  if (name.endsWith(".webp")) return new Blob([file], { type: "image/webp" });
  if (name.endsWith(".gif")) return new Blob([file], { type: "image/gif" });
  return new Blob([file], { type: "image/jpeg" });
}

async function loadWithImageElement(source: Blob) {
  const url = URL.createObjectURL(source);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.decoding = "async";
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Could not read this image."));
      element.src = url;
    });
    // Ensure pixels are decoded before drawing on constrained mobile browsers.
    if ("decode" in image) {
      try {
        await image.decode();
      } catch {
        // Some browsers throw here even when the image is drawable.
      }
    }
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function loadBitmap(file: File) {
  if (await looksLikeHeic(file)) {
    throw new Error("This gallery photo is HEIC/HEIF, which this browser cannot compress. Choose a JPEG or PNG, or share/export the photo as JPEG first.");
  }

  const blob = asDecodableBlob(file);
  const decodeErrors: string[] = [];

  if (typeof createImageBitmap === "function") {
    // Prefer downsampled decode — full-resolution phone photos often OOM on mobile.
    try {
      return await createImageBitmap(blob, {
        resizeWidth: MAX_EDGE,
        resizeQuality: "high",
        imageOrientation: "from-image",
      } as ImageBitmapOptions);
    } catch (caught) {
      decodeErrors.push(caught instanceof Error ? caught.message : "createImageBitmap resize failed");
    }

    try {
      return await createImageBitmap(blob, {
        imageOrientation: "from-image",
      } as ImageBitmapOptions);
    } catch (caught) {
      decodeErrors.push(caught instanceof Error ? caught.message : "createImageBitmap failed");
    }

    try {
      return await createImageBitmap(blob);
    } catch (caught) {
      decodeErrors.push(caught instanceof Error ? caught.message : "createImageBitmap plain failed");
    }
  }

  try {
    return await loadWithImageElement(blob);
  } catch (caught) {
    decodeErrors.push(caught instanceof Error ? caught.message : "image element failed");
  }

  const detail = decodeErrors.find(Boolean);
  if (detail && /heic|heif|decode/i.test(detail)) {
    throw new Error(
      "This photo could not be decoded on your device. Try another gallery image saved as JPEG/PNG, or take a new photo.",
    );
  }
  throw new Error(
    "This photo could not be decoded on your device. Try another gallery image saved as JPEG/PNG, or take a new photo.",
  );
}

function drawScaled(source: ImageBitmap | HTMLImageElement, maxEdge: number) {
  const width = "width" in source ? source.width : 0;
  const height = "height" in source ? source.height : 0;
  if (!width || !height) throw new Error("This photo has no readable dimensions.");
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Could not compress this image.");
  context.drawImage(source as CanvasImageSource, 0, 0, targetWidth, targetHeight);
  return canvas;
}

/**
 * Compresses an image in the browser (no server temp files).
 * Returns a JPEG File sized for the 5 MB upload limit when possible.
 */
export async function compressImageFile(file: File, targetBytes = MAX_UPLOAD_BYTES): Promise<File> {
  if (file.size <= targetBytes) return file;

  const bitmap = await loadBitmap(file);
  try {
    let edge = Math.min(MAX_EDGE, Math.max(bitmap.width, bitmap.height));
    let best: Blob | null = null;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const canvas = drawScaled(bitmap, edge);
      for (const quality of [0.82, 0.72, 0.62, 0.52, 0.42, 0.32, 0.22]) {
        const blob = await canvasToBlob(canvas, "image/jpeg", quality);
        best = blob;
        if (blob.size <= targetBytes) {
          const base = file.name.replace(/\.[^.]+$/, "") || "image";
          return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
        }
      }
      edge = Math.max(640, Math.round(edge * 0.75));
    }

    if (best && best.size <= targetBytes) {
      const base = file.name.replace(/\.[^.]+$/, "") || "image";
      return new File([best], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
    }

    throw new Error("Could not get this image under 5 MB. Try a smaller photo.");
  } finally {
    if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();
  }
}

export { MAX_UPLOAD_BYTES };

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
/** Reject absurd local files before decoding — keeps the browser responsive. */
export const MAX_SOURCE_BYTES = 40 * 1024 * 1024;
const MAX_EDGE = 1920;

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function needsCompression(file: File) {
  return file.size > MAX_UPLOAD_BYTES;
}

export function friendlyImageError(caught: unknown) {
  const message = caught instanceof Error ? caught.message : String(caught || "");
  if (/heic|heif/i.test(message)) {
    return "This gallery photo is HEIC/HEIF. Export it as JPEG/PNG, or use Take photo.";
  }
  if (/decode|read this image|no readable dimensions|source image/i.test(message)) {
    return "This photo could not be read on your phone. Try Take photo, or pick a JPEG/PNG under 12 MB from the gallery.";
  }
  if (/5 MB|under 5/i.test(message)) return message;
  if (message.trim()) return message;
  return "Could not compress this image. Try another photo.";
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
    const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (header.length < 12) return false;
    // ISO BMFF: size(4) + 'ftyp'(4) + brand(4)
    const box = String.fromCharCode(...header.slice(4, 8));
    if (box !== "ftyp") return false;
    const brand = String.fromCharCode(...header.slice(8, 12)).toLowerCase();
    return brand === "heic" || brand === "heif" || brand === "mif1" || brand === "msf1" || brand === "heim" || brand === "heix";
  } catch {
    return false;
  }
}

function candidateBlobs(file: File): Blob[] {
  const type = (file.type || "").toLowerCase();
  const name = file.name.toLowerCase();
  const blobs: Blob[] = [];
  const push = (blob: Blob) => {
    if (!blobs.some((item) => item.type === blob.type)) blobs.push(blob);
  };

  if (type.startsWith("image/") && type !== "image/*") push(file);
  push(file);
  if (name.endsWith(".png")) push(new Blob([file], { type: "image/png" }));
  else if (name.endsWith(".webp")) push(new Blob([file], { type: "image/webp" }));
  else if (name.endsWith(".gif")) push(new Blob([file], { type: "image/gif" }));
  else {
    push(new Blob([file], { type: "image/jpeg" }));
    push(new Blob([file], { type: "image/webp" }));
  }
  return blobs;
}

type LoadedImage = {
  source: ImageBitmap | HTMLImageElement;
  objectUrl?: string;
};

async function loadWithImageElement(source: Blob): Promise<LoadedImage> {
  const objectUrl = URL.createObjectURL(source);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.decoding = "async";
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Could not read this image."));
      element.src = objectUrl;
    });
    if ("decode" in image) {
      try {
        await image.decode();
      } catch {
        // Drawable even when decode() rejects on some Android WebViews.
      }
    }
    if (!image.width || !image.height) {
      throw new Error("This photo has no readable dimensions.");
    }
    // Keep object URL alive until after canvas draw — revoking early breaks Android.
    return { source: image, objectUrl };
  } catch (caught) {
    URL.revokeObjectURL(objectUrl);
    throw caught;
  }
}

async function loadWithDataUrl(source: Blob): Promise<LoadedImage> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read this image."));
    reader.readAsDataURL(source);
  });
  if (!dataUrl.startsWith("data:image/")) {
    throw new Error("Could not read this image.");
  }
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Could not read this image."));
    element.src = dataUrl;
  });
  if (!image.width || !image.height) {
    throw new Error("This photo has no readable dimensions.");
  }
  return { source: image };
}

async function tryCreateImageBitmap(blob: Blob, edge: number) {
  if (typeof createImageBitmap !== "function") return null;

  const attempts: ImageBitmapOptions[] = [
    { resizeWidth: edge, resizeQuality: "medium" },
    { resizeWidth: edge, resizeQuality: "high", imageOrientation: "from-image" },
    { imageOrientation: "from-image" },
    {},
  ];

  for (const options of attempts) {
    try {
      const bitmap = Object.keys(options).length
        ? await createImageBitmap(blob, options)
        : await createImageBitmap(blob);
      return { source: bitmap } satisfies LoadedImage;
    } catch {
      // try next strategy
    }
  }
  return null;
}

async function loadBitmap(file: File): Promise<LoadedImage> {
  if (await looksLikeHeic(file)) {
    throw new Error("This gallery photo is HEIC/HEIF. Export it as JPEG/PNG, or use Take photo.");
  }

  let lastError: unknown;
  for (const blob of candidateBlobs(file)) {
    for (const edge of [MAX_EDGE, 1280, 1024]) {
      try {
        const loaded = await tryCreateImageBitmap(blob, edge);
        if (loaded) return loaded;
      } catch (caught) {
        lastError = caught;
      }
    }

    try {
      return await loadWithImageElement(blob);
    } catch (caught) {
      lastError = caught;
    }

    try {
      return await loadWithDataUrl(blob);
    } catch (caught) {
      lastError = caught;
    }
  }

  throw new Error(friendlyImageError(lastError || new Error("The source image could not be decoded.")));
}

function drawScaled(source: ImageBitmap | HTMLImageElement, maxEdge: number) {
  const width = source.width || 0;
  const height = source.height || 0;
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

function releaseLoaded(loaded: LoadedImage) {
  if (loaded.objectUrl) URL.revokeObjectURL(loaded.objectUrl);
  if ("close" in loaded.source && typeof loaded.source.close === "function") loaded.source.close();
}

/**
 * Compresses an image in the browser (no server temp files).
 * Returns a JPEG File sized for the 5 MB upload limit when possible.
 */
export async function compressImageFile(file: File, targetBytes = MAX_UPLOAD_BYTES): Promise<File> {
  if (file.size <= targetBytes) return file;

  const loaded = await loadBitmap(file);
  try {
    let edge = Math.min(MAX_EDGE, Math.max(loaded.source.width, loaded.source.height));
    let best: Blob | null = null;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const canvas = drawScaled(loaded.source, edge);
      for (const quality of [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2]) {
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
    releaseLoaded(loaded);
  }
}

export { MAX_UPLOAD_BYTES };

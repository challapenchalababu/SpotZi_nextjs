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
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not compress this image."));
    }, type, quality);
  });
}

async function loadBitmap(file: File) {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Could not read this image."));
      element.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function drawScaled(source: ImageBitmap | HTMLImageElement, maxEdge: number) {
  const width = "width" in source ? source.width : 0;
  const height = "height" in source ? source.height : 0;
  const scale = Math.min(1, maxEdge / Math.max(width, height, 1));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");
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
    let edge = MAX_EDGE;
    let best: Blob | null = null;

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const canvas = drawScaled(bitmap, edge);
      for (const quality of [0.82, 0.72, 0.62, 0.52, 0.42, 0.32]) {
        const blob = await canvasToBlob(canvas, "image/jpeg", quality);
        best = blob;
        if (blob.size <= targetBytes) {
          const base = file.name.replace(/\.[^.]+$/, "") || "image";
          return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
        }
      }
      edge = Math.round(edge * 0.75);
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

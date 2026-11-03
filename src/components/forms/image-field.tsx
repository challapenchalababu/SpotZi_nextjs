"use client";

import Image from "next/image";
import { Camera, ImagePlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Dialog, buttonClass } from "@/components/ui/primitives";
import { trackApiActivity } from "@/lib/api-client";
import {
  MAX_SOURCE_BYTES,
  MAX_UPLOAD_BYTES,
  compressImageFile,
  formatBytes,
  friendlyImageError,
  needsCompression,
} from "@/lib/compress-image";

const ACCEPT = "image/jpeg,image/png,image/webp,image/*";

type PendingImage = {
  original: File;
  previewUrl: string;
  previewFailed: boolean;
  compressed?: File;
  compressing: boolean;
  compressError?: string;
  autoStarted?: boolean;
};

function isLikelyImageFile(file: File) {
  const type = (file.type || "").toLowerCase();
  if (type.startsWith("image/")) return true;
  // Android gallery sometimes omits MIME type.
  return /\.(jpe?g|png|webp|gif|heic|heif|hif)$/i.test(file.name);
}

export function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingImage | null>(null);
  const pendingUrlRef = useRef<string | null>(null);
  const pendingRef = useRef<PendingImage | null>(null);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(() => {
    return () => {
      if (pendingUrlRef.current) URL.revokeObjectURL(pendingUrlRef.current);
    };
  }, []);

  function clearPending() {
    if (pendingUrlRef.current) {
      URL.revokeObjectURL(pendingUrlRef.current);
      pendingUrlRef.current = null;
    }
    setPending(null);
  }

  function upload(file: File) {
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Images must be smaller than 5 MB. Compress first, then confirm.");
      return;
    }
    const body = new FormData();
    body.append("file", file);
    const request = new XMLHttpRequest();
    const finish = trackApiActivity();
    request.open("POST", "/api/uploads");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      finish();
      setProgress(null);
      const payload = JSON.parse(request.responseText || "{}") as { data?: { url: string }; error?: { message: string } };
      if (request.status >= 200 && request.status < 300 && payload.data?.url) {
        onChange(payload.data.url);
        setError(null);
        clearPending();
      } else {
        setError(payload.error?.message || "Upload failed.");
      }
    };
    request.onerror = () => {
      finish();
      setProgress(null);
      setError("Upload failed.");
    };
    setError(null);
    request.send(body);
  }

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!isLikelyImageFile(file)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError(`This file is too large to open here (${formatBytes(file.size)}). Use a photo under 40 MB.`);
      return;
    }

    if (!needsCompression(file)) {
      upload(file);
      return;
    }

    if (pendingUrlRef.current) {
      URL.revokeObjectURL(pendingUrlRef.current);
      pendingUrlRef.current = null;
    }
    const previewUrl = URL.createObjectURL(file);
    pendingUrlRef.current = previewUrl;
    setError(null);
    setPending({
      original: file,
      previewUrl,
      previewFailed: false,
      compressing: false,
      autoStarted: false,
    });
  }

  async function runCompress(fromAuto = false) {
    const current = pendingRef.current;
    if (!current || current.compressing || current.compressed) return;
    if (fromAuto && current.autoStarted) return;

    setPending((value) =>
      value
        ? {
            ...value,
            compressing: true,
            compressError: undefined,
            autoStarted: fromAuto ? true : value.autoStarted,
          }
        : value,
    );

    try {
      const compressed = await compressImageFile(current.original, MAX_UPLOAD_BYTES);
      setPending((value) =>
        value && value.original === current.original
          ? {
              ...value,
              compressed,
              compressing: false,
              compressError: undefined,
            }
          : value,
      );
    } catch (caught) {
      setPending((value) =>
        value && value.original === current.original
          ? {
              ...value,
              compressing: false,
              compressError: friendlyImageError(caught),
            }
          : value,
      );
    }
  }

  useEffect(() => {
    if (!pending || pending.compressed || pending.compressing || pending.autoStarted || pending.compressError) return;
    void runCompress(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start once per newly picked oversized file
  }, [pending?.original]);

  function confirmUpload() {
    if (!pending?.compressed) return;
    upload(pending.compressed);
  }

  const busy = progress != null || Boolean(pending?.compressing);

  return (
    <div className="space-y-2 text-sm">
      <span className="font-medium">{label}</span>
      {value ? <Image src={value} alt="" width={96} height={96} className="h-24 w-24 rounded-xl object-cover" /> : null}

      <input ref={galleryRef} className="sr-only" type="file" accept={ACCEPT} onChange={onPick} />
      <input ref={cameraRef} className="sr-only" type="file" accept={ACCEPT} capture="environment" onChange={onPick} />

      <div className="flex flex-wrap gap-2">
        <button type="button" className={buttonClass("secondary")} onClick={() => galleryRef.current?.click()} disabled={busy}>
          <ImagePlus className="size-4" aria-hidden="true" />
          Choose photo
        </button>
        <button type="button" className={buttonClass("secondary")} onClick={() => cameraRef.current?.click()} disabled={busy}>
          <Camera className="size-4" aria-hidden="true" />
          Take photo
        </button>
      </div>

      {progress != null ? <p>Uploading… {progress}%</p> : null}
      {error ? <p className="text-danger">{error}</p> : null}
      {value ? (
        <Button type="button" variant="ghost" onClick={() => onChange("")}>
          Remove image
        </Button>
      ) : null}
      <p className="text-xs text-muted-foreground">
        JPEG, PNG, or WebP up to 5 MB after upload. Larger photos are compressed on this device first. If a gallery photo fails, use Take photo.
      </p>

      <Dialog open={Boolean(pending)} title="Image is larger than 5 MB" onClose={() => !busy && clearPending()}>
        {pending ? (
          <div className="space-y-3">
            {pending.previewFailed ? (
              <div className="flex h-40 items-center justify-center rounded-xl bg-muted px-4 text-center text-sm text-muted-foreground">
                Preview unavailable for this gallery file. Compression can still run.
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- temporary local blob preview
              <img
                src={pending.previewUrl}
                alt="Selected photo preview"
                className="mx-auto max-h-48 rounded-xl object-contain"
                onError={() => setPending((current) => (current ? { ...current, previewFailed: true } : current))}
              />
            )}
            <p className="text-sm text-muted-foreground">
              Original size: <span className="font-medium text-foreground">{formatBytes(pending.original.size)}</span>
            </p>
            {pending.compressed ? (
              <p className="text-sm text-success">
                Compressed size: <span className="font-medium">{formatBytes(pending.compressed.size)}</span> — ready to save.
              </p>
            ) : pending.compressing ? (
              <p className="text-sm text-muted-foreground">Compressing on this device…</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Compress on this device, then confirm. Only the compressed file is uploaded.
              </p>
            )}
            {pending.compressError ? <p className="text-sm text-danger">{pending.compressError}</p> : null}
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" disabled={busy} onClick={clearPending}>
                Cancel
              </Button>
              {!pending.compressed ? (
                <Button type="button" variant="secondary" disabled={busy} onClick={() => runCompress(false)}>
                  {pending.compressing ? "Compressing…" : "Retry compress"}
                </Button>
              ) : (
                <Button type="button" disabled={busy} onClick={confirmUpload}>
                  {progress != null ? `Uploading… ${progress}%` : "OK, save image"}
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

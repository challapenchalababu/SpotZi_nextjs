"use client";

import Image from "next/image";
import { Camera, ImagePlus } from "lucide-react";
import { useRef, useState } from "react";
import { Button, buttonClass } from "@/components/ui/primitives";
import { trackApiActivity } from "@/lib/api-client";

const ACCEPT = "image/jpeg,image/png,image/webp,image/*";

export function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function upload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError("Images must be smaller than 5 MB.");
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
    if (file) upload(file);
  }

  return (
    <div className="space-y-2 text-sm">
      <span className="font-medium">{label}</span>
      {value ? <Image src={value} alt="" width={96} height={96} className="h-24 w-24 rounded-xl object-cover" /> : null}

      <input ref={galleryRef} className="sr-only" type="file" accept={ACCEPT} onChange={onPick} />
      <input
        ref={cameraRef}
        className="sr-only"
        type="file"
        accept={ACCEPT}
        capture="environment"
        onChange={onPick}
      />

      <div className="flex flex-wrap gap-2">
        <button type="button" className={buttonClass("secondary")} onClick={() => galleryRef.current?.click()} disabled={progress != null}>
          <ImagePlus className="size-4" aria-hidden="true" />
          Choose photo
        </button>
        <button type="button" className={buttonClass("secondary")} onClick={() => cameraRef.current?.click()} disabled={progress != null}>
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
        JPEG, PNG, or WebP up to 5 MB. On phones, use Take photo for the camera or Choose photo for the gallery. Production uploads use Cloudinary when it is configured.
      </p>
    </div>
  );
}

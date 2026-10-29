"use client";

import Image from "next/image";
import { useState } from "react";
import { Button, fieldClass } from "@/components/ui/primitives";
import { trackApiActivity } from "@/lib/api-client";

export function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
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

  return (
    <div className="space-y-2 text-sm">
      <span className="font-medium">{label}</span>
      {value ? <Image src={value} alt="" width={96} height={96} className="h-24 w-24 rounded-xl object-cover" /> : null}
      <input className={fieldClass} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) upload(file);
      }} />
      {progress != null ? <p>Uploading… {progress}%</p> : null}
      {error ? <p className="text-danger">{error}</p> : null}
      {value ? <Button type="button" variant="ghost" onClick={() => onChange("")}>Remove image</Button> : null}
      <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP up to 5 MB. Production uploads use Cloudinary when it is configured. Development stores files locally.</p>
    </div>
  );
}

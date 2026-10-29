import { isPreviewMode } from "@/lib/env";

export function PreviewBanner() {
  if (!isPreviewMode()) return null;
  return (
    <p className="bg-[#f4c95d] px-4 py-2 text-center text-sm text-[#142421]">
      Sample data from <span className="font-semibold">src/data/preview.json</span>. Add MONGODB_URI when you want these screens to use live records. Saving still waits for the database.
    </p>
  );
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function SetupNotice({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-warning/30 bg-warning/10 p-5">
      <h2 className="text-lg font-semibold">Database setup needed</h2>
      <p className="mt-2 text-sm">{message}</p>
      <p className="mt-2 text-sm text-muted-foreground">Add MONGODB_URI to .env.local, then run npm run seed. The README lists Atlas, the super admin account, and optional Cloudinary and email settings.</p>
    </div>
  );
}

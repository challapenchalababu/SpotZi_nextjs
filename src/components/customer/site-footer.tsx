import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export function SiteFooter({ supportEmail }: { supportEmail?: string }) {
  return (
    <footer className="mt-12 border-t border-border bg-background text-foreground">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-8 lg:grid-cols-3">
        <div className="col-span-2 lg:col-span-1">
          <BrandMark />
        </div>
        <div className="min-w-0 space-y-2 text-sm">
          <p className="text-spot-gradient font-semibold">Explore</p>
          <Link className="block hover:underline" href="/offers">All offers</Link>
          <Link className="block hover:underline" href="/categories">Categories</Link>
          <Link className="block hover:underline" href="/owner/register">List your business</Link>
        </div>
        <div className="min-w-0 space-y-2 text-sm">
          <p className="text-spot-gradient font-semibold">Legal</p>
          <Link className="block hover:underline" href="/privacy-policy">Privacy policy</Link>
          <Link className="block hover:underline" href="/terms-and-conditions">Terms and conditions</Link>
          {supportEmail ? <a className="block hover:underline" href={`mailto:${supportEmail}`}>{supportEmail}</a> : null}
        </div>
      </div>
    </footer>
  );
}

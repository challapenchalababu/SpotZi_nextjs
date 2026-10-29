import type { Metadata } from "next";
import { OfferGrid } from "@/components/customer/offer-card";
import { EmptyState, fieldClass } from "@/components/ui/primitives";
import { firstParam } from "@/lib/api-client";
import { listPublicOffers } from "@/services/offer.service";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const q = firstParam(params.q);
  const city = firstParam(params.city);
  const area = firstParam(params.area);
  const pincode = firstParam(params.pincode);
  const offers = await listPublicOffers({ page: 1, limit: 24, q, city, area, pincode }).catch(() => null);
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="display text-4xl">Search</h1>
      <form className="grid gap-3 sm:grid-cols-4" action="/search">
        <input className={fieldClass} name="q" defaultValue={q} placeholder="Offer or business" aria-label="Query" />
        <input className={fieldClass} name="city" defaultValue={city} placeholder="City" aria-label="City" />
        <input className={fieldClass} name="area" defaultValue={area} placeholder="Area" aria-label="Area" />
        <input className={fieldClass} name="pincode" defaultValue={pincode} placeholder="Pincode" aria-label="Pincode" />
        <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Search</button>
      </form>
      {offers?.items.length ? <OfferGrid offers={offers.items} /> : <EmptyState title="No results" body="Try a business name, city, area, or pincode." />}
    </div>
  );
}

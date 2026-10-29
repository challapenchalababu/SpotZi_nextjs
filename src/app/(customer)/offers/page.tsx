import type { Metadata } from "next";
import Link from "next/link";
import { OfferGrid } from "@/components/customer/offer-card";
import { SetupNotice } from "@/components/seo";
import { EmptyState, Pagination, fieldClass, pageQuery } from "@/components/ui/primitives";
import { firstParam } from "@/lib/api-client";
import { loadPage } from "@/lib/page";
import { NearbyOffers } from "@/components/customer/nearby";
import { getPlatformSettings, listCategories } from "@/services/catalog.service";
import { listPublicOffers } from "@/services/offer.service";
import { OFFER_TYPES, type OfferType } from "@/types/domain";

export const metadata: Metadata = { title: "Offers", description: "Browse active local offers by category, discount, and city." };

export default async function OffersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = {
    q: firstParam(params.q),
    category: firstParam(params.category),
    city: firstParam(params.city),
    area: firstParam(params.area),
    offerType: firstParam(params.offerType),
    sort: firstParam(params.sort) || "newest",
    currentlyAvailable: firstParam(params.currentlyAvailable),
  };
  const page = Number(firstParam(params.page) || 1);
  const loaded = await loadPage(async () => {
    const [categories, offers, settings] = await Promise.all([
      listCategories(false),
      listPublicOffers({
        page,
        limit: 12,
        q: query.q,
        category: query.category,
        city: query.city,
        area: query.area,
        offerType: OFFER_TYPES.includes(query.offerType as OfferType) ? (query.offerType as OfferType) : undefined,
        sort: query.sort === "discount" || query.sort === "ending" ? query.sort : "newest",
        currentlyAvailable: query.currentlyAvailable === "true",
        discountMin: firstParam(params.discountMin) ? Number(firstParam(params.discountMin)) : undefined,
      }),
      getPlatformSettings(),
    ]);
    return { categories, offers, settings };
  });
  if (!loaded.ok) return <div className="mx-auto max-w-6xl px-4 py-8"><SetupNotice message={loaded.message} /></div>;
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <NearbyOffers defaultRadiusKm={loaded.data.settings.defaultRadiusKm} />
      <h1 className="display text-4xl">Offers</h1>
      <form className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-4" action="/offers">
        <input className={fieldClass} name="q" defaultValue={query.q} placeholder="Business or offer" aria-label="Search" />
        <select className={fieldClass} name="category" defaultValue={query.category || ""} aria-label="Category">
          <option value="">All categories</option>
          {loaded.data.categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
        </select>
        <input className={fieldClass} name="city" defaultValue={query.city} placeholder="City" aria-label="City" />
        <select className={fieldClass} name="offerType" defaultValue={query.offerType || ""} aria-label="Offer type">
          <option value="">All types</option>
          {OFFER_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <input className={fieldClass} name="discountMin" defaultValue={firstParam(params.discountMin)} placeholder="Minimum discount %" aria-label="Minimum discount" />
        <select className={fieldClass} name="sort" defaultValue={query.sort} aria-label="Sort">
          <option value="newest">Newest</option>
          <option value="discount">Discount</option>
          <option value="ending">Ending soon</option>
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="currentlyAvailable" value="true" defaultChecked={query.currentlyAvailable === "true"} /> Open now</label>
        <button className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground md:w-auto">Apply filters</button>
      </form>
      {loaded.data.offers.items.length ? <OfferGrid offers={loaded.data.offers.items} /> : <EmptyState title="No matching offers" body="Try another category, city, or clear the filters." action={<Link href="/offers">Clear filters</Link>} />}
      <Pagination page={loaded.data.offers.page} totalPages={loaded.data.offers.totalPages} hrefFor={(nextPage) => pageQuery("/offers", query, nextPage)} />
    </div>
  );
}

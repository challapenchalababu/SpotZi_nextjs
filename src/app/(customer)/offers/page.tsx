import type { Metadata } from "next";
import Link from "next/link";
import { TrackPageView } from "@/components/analytics/site-tracker";
import { OfferGrid } from "@/components/customer/offer-card";
import { OffersFilters } from "@/components/customer/offers-filters";
import { NearbyOffers } from "@/components/customer/nearby";
import { SetupNotice } from "@/components/seo";
import { EmptyState, Pagination, pageQuery } from "@/components/ui/primitives";
import { firstParam } from "@/lib/api-client";
import { loadPage } from "@/lib/page";
import { listCategories } from "@/services/catalog.service";
import { listPublicOffers } from "@/services/offer.service";
import { OFFER_TYPES, type OfferType } from "@/types/domain";

export const metadata: Metadata = { title: "Offers", description: "Browse active local offers by category, discount, and city." };

const DEFAULT_RADIUS_KM = 5;

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
  const discountMin = firstParam(params.discountMin);
  const loaded = await loadPage(async () => {
    const [categories, offers] = await Promise.all([
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
        discountMin: discountMin ? Number(discountMin) : undefined,
      }),
    ]);
    return { categories, offers };
  });
  if (!loaded.ok) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <SetupNotice message={loaded.message} />
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <TrackPageView event="offers_page_view" />
      <NearbyOffers defaultRadiusKm={DEFAULT_RADIUS_KM} />
      <OffersFilters
        categories={loaded.data.categories.map((category) => ({ id: category.id, slug: category.slug, name: category.name }))}
        values={{
          q: query.q,
          category: query.category,
          city: query.city,
          offerType: query.offerType,
          discountMin,
          sort: query.sort,
          currentlyAvailable: query.currentlyAvailable,
        }}
      />
      {loaded.data.offers.items.length ? (
        <OfferGrid offers={loaded.data.offers.items} />
      ) : (
        <EmptyState title="No matching offers" body="Try another category, city, or clear the filters." action={<Link href="/offers">Clear filters</Link>} />
      )}
      <Pagination page={loaded.data.offers.page} totalPages={loaded.data.offers.totalPages} hrefFor={(nextPage) => pageQuery("/offers", query, nextPage)} />
    </div>
  );
}

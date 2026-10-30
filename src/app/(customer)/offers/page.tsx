import type { Metadata } from "next";
import Link from "next/link";
import { TrackPageView } from "@/components/analytics/site-tracker";
import { NearbyOffers } from "@/components/customer/nearby";
import { OffersFilters } from "@/components/customer/offers-filters";
import { StoreGrid } from "@/components/customer/store-card";
import { SetupNotice } from "@/components/seo";
import { EmptyState, Pagination, pageQuery } from "@/components/ui/primitives";
import { firstParam } from "@/lib/api-client";
import { loadPage } from "@/lib/page";
import { listCategories } from "@/services/catalog.service";
import { listPublicStores } from "@/services/offer.service";

export const metadata: Metadata = {
  title: "Offers",
  description: "Browse nearby stores and branches, then open a store to see products and offers.",
};

const DEFAULT_RADIUS_KM = 5;

export default async function OffersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = {
    q: firstParam(params.q),
    category: firstParam(params.category),
    city: firstParam(params.city),
    offerType: firstParam(params.offerType),
    sort: firstParam(params.sort) || "newest",
    currentlyAvailable: firstParam(params.currentlyAvailable),
  };
  const page = Number(firstParam(params.page) || 1);
  const loaded = await loadPage(async () => {
    const [categories, stores] = await Promise.all([
      listCategories(false),
      listPublicStores({
        page,
        limit: 12,
        q: query.q,
        category: query.category,
        city: query.city,
      }),
    ]);
    return { categories, stores };
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
          discountMin: firstParam(params.discountMin),
          sort: query.sort,
          currentlyAvailable: query.currentlyAvailable,
        }}
      />
      <section className="space-y-4">
        <h2 className="display text-3xl">Stores with offers</h2>
        <p className="text-sm text-muted-foreground">Pick a branch to see its offers and product list. Redemption codes stay branch/offer based.</p>
        {loaded.data.stores.items.length ? (
          <StoreGrid stores={loaded.data.stores.items} />
        ) : (
          <EmptyState title="No matching stores" body="Try another city or clear the filters." action={<Link href="/offers">Clear filters</Link>} />
        )}
        <Pagination
          page={loaded.data.stores.page}
          totalPages={loaded.data.stores.totalPages}
          hrefFor={(nextPage) => pageQuery("/offers", { q: query.q, category: query.category, city: query.city }, nextPage)}
        />
      </section>
    </div>
  );
}

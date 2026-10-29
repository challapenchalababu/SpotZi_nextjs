import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OfferGrid } from "@/components/customer/offer-card";
import { JsonLd } from "@/components/seo";
import { EmptyState } from "@/components/ui/primitives";
import { getAppUrl } from "@/lib/env";
import { listPublicOffers, listOfferCities } from "@/services/offer.service";

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const offers = await listPublicOffers({ page: 1, limit: 1, city }).catch(() => null);
  const label = city.replace(/-/g, " ");
  return {
    title: `Offers in ${label}`,
    description: `Current promotions from businesses in ${label}.`,
    alternates: { canonical: `/offers-near/${city}` },
    robots: offers && offers.total > 0 ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function CityOffersPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const cities = await listOfferCities();
  const known = cities.find((item) => item.slug === city);
  const offers = await listPublicOffers({ page: 1, limit: 24, city });
  if (!known && offers.total === 0) notFound();
  const name = known?.name || city.replace(/-/g, " ");
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: getAppUrl() },
        { "@type": "ListItem", position: 2, name: name, item: `${getAppUrl()}/offers-near/${city}` },
      ] }} />
      <h1 className="display text-4xl">Offers in {name}</h1>
      <p className="text-muted-foreground">Published offers from active businesses in this city.</p>
      {offers.items.length ? <OfferGrid offers={offers.items} /> : <EmptyState title="No offers in this city right now" body="Check back when a business publishes a promotion here." />}
    </div>
  );
}

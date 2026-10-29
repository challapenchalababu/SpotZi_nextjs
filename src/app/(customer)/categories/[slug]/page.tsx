import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OfferGrid } from "@/components/customer/offer-card";
import { JsonLd } from "@/components/seo";
import { EmptyState } from "@/components/ui/primitives";
import { getAppUrl } from "@/lib/env";
import { categoryHasOffers, getCategoryBySlug } from "@/services/catalog.service";
import { listPublicOffers } from "@/services/offer.service";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug).catch(() => null);
  if (!category) return { title: "Category", robots: { index: false } };
  const hasOffers = await categoryHasOffers(slug).catch(() => false);
  return {
    title: `${category.name} offers`,
    description: category.description,
    alternates: { canonical: `/categories/${category.slug}` },
    robots: hasOffers ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const offers = await listPublicOffers({ page: 1, limit: 24, category: slug });
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: getAppUrl() },
        { "@type": "ListItem", position: 2, name: "Categories", item: `${getAppUrl()}/categories` },
        { "@type": "ListItem", position: 3, name: category.name, item: `${getAppUrl()}/categories/${category.slug}` },
      ] }} />
      <h1 className="display text-4xl">{category.name}</h1>
      <p className="max-w-2xl text-muted-foreground">{category.description}</p>
      {offers.items.length ? <OfferGrid offers={offers.items} /> : <EmptyState title="No active offers" body="This category does not have a published offer right now." />}
    </div>
  );
}

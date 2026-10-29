import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/env";
import { listSitemapEntries } from "@/services/offer.service";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = getAppUrl();
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: appUrl, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${appUrl}/offers`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${appUrl}/categories`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${appUrl}/privacy-policy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${appUrl}/terms-and-conditions`, changeFrequency: "yearly", priority: 0.2 },
  ];
  try {
    const entries = await listSitemapEntries();
    return [
      ...staticRoutes,
      ...entries.categories.map((slug) => ({ url: `${appUrl}/categories/${slug}`, changeFrequency: "daily" as const, priority: 0.6 })),
      ...entries.cities.map((city) => ({ url: `${appUrl}/offers-near/${city.slug}`, changeFrequency: "hourly" as const, priority: 0.7 })),
      ...entries.businesses.map((business) => ({ url: `${appUrl}/businesses/${business.slug}`, lastModified: business.updatedAt, changeFrequency: "daily" as const, priority: 0.7 })),
      ...entries.offers.map((offer) => ({ url: `${appUrl}/offers/${offer.slug}`, lastModified: offer.updatedAt, changeFrequency: "daily" as const, priority: 0.8 })),
    ];
  } catch {
    return staticRoutes;
  }
}

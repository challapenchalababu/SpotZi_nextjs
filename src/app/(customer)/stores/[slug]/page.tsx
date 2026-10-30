import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OfferGrid } from "@/components/customer/offer-card";
import { DirectionsLink } from "@/components/customer/directions-link";
import { Badge } from "@/components/ui/primitives";
import { formatAddress, formatMoney, truncate, weekdayLabel } from "@/lib/format";
import { getPublicStoreBySlug } from "@/services/offer.service";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicStoreBySlug(slug).catch(() => null);
  if (!result) return { title: "Store not found", robots: { index: false, follow: false } };
  const { store } = result;
  return {
    title: `${store.business.businessName} · ${store.branchName}`,
    description: truncate(`Offers at ${store.branchName}, ${formatAddress(store.address)}.`, 155),
    alternates: { canonical: `/stores/${store.id}` },
  };
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPublicStoreBySlug(slug);
  if (!result) notFound();
  const { store, offers } = result;
  const address = formatAddress(store.address);

  return (
    <div key={store.id} className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <p className="text-sm text-muted-foreground">
        <Link href="/offers">Offers</Link> / <Link href={`/businesses/${store.business.slug}`}>{store.business.businessName}</Link> / {store.branchName}
      </p>
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {store.business.categoryName || store.business.category}
        </p>
        <h1 className="display text-4xl">{store.business.businessName}</h1>
        <p className="text-lg font-medium">{store.branchName}</p>
        <p className="text-sm text-muted-foreground">{address}</p>
        <div className="flex flex-wrap gap-2">
          <Badge>{store.offerCount} offer{store.offerCount === 1 ? "" : "s"}</Badge>
          {store.itemCount ? <Badge tone="accent">{store.itemCount} products</Badge> : null}
          {store.topDiscountLabel ? <Badge tone="accent">{store.topDiscountLabel}</Badge> : null}
        </div>
        <DirectionsLink latitude={store.latitude} longitude={store.longitude} />
      </header>

      <section className="space-y-4">
        <h2 className="display text-3xl">Offers at this store</h2>
        <p className="text-sm text-muted-foreground">
          Open an offer to see product prices. Claiming generates one redemption code for that offer at this branch — not a separate code per product.
        </p>
        {offers.length ? <OfferGrid offers={offers} /> : <p className="text-sm text-muted-foreground">No published offers at this store right now.</p>}
      </section>

      {offers.some((offer) => offer.items.length > 0) ? (
        <section className="space-y-4">
          <h2 className="display text-3xl">Products on offer</h2>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Offer</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Discount</th>
                </tr>
              </thead>
              <tbody>
                {offers.flatMap((offer) =>
                  (offer.items.length ? offer.items : [{ name: offer.title, originalPrice: offer.originalPrice, discountedPrice: offer.discountedPrice, discountPercent: offer.discountValue, sortOrder: 0 }]).map((item) => (
                    <tr key={`${offer.id}-${item.name}-${item.sortOrder}`} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3">
                        <Link className="text-primary" href={`/offers/${offer.slug}`}>
                          {offer.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {item.discountedPrice != null ? formatMoney(item.discountedPrice) : "—"}
                        {item.originalPrice != null ? (
                          <span className="ml-2 text-muted-foreground line-through">{formatMoney(item.originalPrice)}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">{item.discountPercent != null ? `${item.discountPercent}%` : offer.discountLabel}</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Opening hours</h2>
        <ul className="max-w-md space-y-1 text-sm">
          {Object.entries(store.openingHours).map(([day, hours]) => (
            <li key={day} className="flex justify-between gap-4">
              <span>{weekdayLabel(day)}</span>
              <span>{hours.closed ? "Closed" : `${hours.open}–${hours.close}`}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { OfferGrid } from "@/components/customer/offer-card";
import { ClaimButton, FavoriteButton, ReportButton } from "@/components/customer/offer-actions";
import { OfferPoster } from "@/components/customer/poster";
import { JsonLd } from "@/components/seo";
import { Badge } from "@/components/ui/primitives";
import { getAppUrl } from "@/lib/env";
import { DirectionsLink } from "@/components/customer/directions-link";
import { formatAddress, formatDate, formatMoney, truncate, weekdayLabel } from "@/lib/format";
import { getSession } from "@/lib/session";
import { getPublicOfferBySlug, incrementOfferView } from "@/services/offer.service";
import { customerRedemptionCode, isFavorite } from "@/services/engagement.service";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicOfferBySlug(slug).catch(() => null);
  if (!result) return { title: "Offer not found", robots: { index: false, follow: false } };
  const { offer } = result;
  const description = truncate(`${offer.discountLabel}. ${offer.description}`, 155);
  return {
    title: `${offer.title} at ${offer.business.businessName}`,
    description,
    alternates: { canonical: `/offers/${offer.slug}` },
    robots: offer.availability === "active" ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { title: offer.title, description, images: offer.posterUrl ? [{ url: offer.posterUrl, alt: `${offer.title} poster` }] : undefined },
  };
}

export default async function OfferPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPublicOfferBySlug(slug);
  if (!result) notFound();
  const { offer, related } = result;
  const session = await getSession().catch(() => null);
  const saved = session?.role === "customer" ? await isFavorite(session.id, offer.id) : false;
  const redemption = session?.role === "customer" ? await customerRedemptionCode(session.id, offer.id) : null;
  if (!session || session.role === "customer") {
    after(async () => {
      try { await incrementOfferView(offer.id); } catch { /* view counts are best effort */ }
    });
  }
  const address = formatAddress(offer.branch.address);
  const url = `${getAppUrl()}/offers/${offer.slug}`;
  const price = offer.discountedPrice ?? offer.originalPrice;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: getAppUrl() },
          { "@type": "ListItem", position: 2, name: "Offers", item: `${getAppUrl()}/offers` },
          { "@type": "ListItem", position: 3, name: offer.title, item: url },
        ],
      },
      {
        "@type": "Offer",
        name: offer.title,
        description: offer.description,
        url,
        availability: offer.availability === "active" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        validFrom: offer.validFrom,
        priceValidUntil: offer.validUntil,
        ...(price != null ? { price, priceCurrency: "INR" } : {}),
        seller: { "@type": "LocalBusiness", name: offer.business.businessName, url: `${getAppUrl()}/businesses/${offer.business.slug}` },
      },
    ],
  };
  return (
    <article className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1.2fr_0.8fr]">
      <JsonLd data={jsonLd} />
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground"><Link href="/offers">Offers</Link> / <Link href={`/categories/${offer.business.category}`}>{offer.business.categoryName || offer.business.category}</Link></p>
        <div className="overflow-hidden rounded-3xl border border-border">
          {offer.posterUrl ? <Image src={offer.posterUrl} alt={`${offer.title} promotional poster`} width={1200} height={900} className="aspect-[4/3] w-full object-cover" /> : (
            <OfferPoster title={offer.title} businessName={offer.business.businessName} discountLabel={offer.discountLabel} validUntil={offer.validUntil} address={address} originalPrice={offer.originalPrice} discountedPrice={offer.discountedPrice} layout={offer.template?.layoutConfig} backgroundUrl={offer.template?.backgroundUrl} className="min-h-80" />
          )}
        </div>
        {offer.availability === "expired" ? <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">This offer has expired.</p> : null}
        <h1 className="display text-4xl">{offer.title}</h1>
        <div className="flex flex-wrap gap-2"><Badge tone="accent">{offer.discountLabel}</Badge><Badge>{offer.openNow ? "Open now" : offer.availability}</Badge></div>
        <p className="text-lg leading-7">{offer.description}</p>
        {offer.originalPrice != null || offer.discountedPrice != null ? (
          <p className="text-lg">{offer.originalPrice != null ? <span className="mr-3 text-muted-foreground line-through">{formatMoney(offer.originalPrice)}</span> : null}{offer.discountedPrice != null ? formatMoney(offer.discountedPrice) : null}</p>
        ) : null}
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Valid</dt><dd>{formatDate(offer.validFrom, offer.timezone)} – {formatDate(offer.validUntil, offer.timezone)}</dd></div>
          <div><dt className="text-muted-foreground">Hours</dt><dd>{offer.startTime && offer.endTime ? `${offer.startTime}–${offer.endTime}` : "Any time during open days"}</dd></div>
          <div><dt className="text-muted-foreground">Days</dt><dd>{offer.activeDays.length ? offer.activeDays.map(weekdayLabel).join(", ") : "Every day"}</dd></div>
        </dl>
        {offer.termsAndConditions ? <section><h2 className="font-semibold">Terms</h2><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{offer.termsAndConditions}</p></section> : null}
      </div>
      <aside className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <Link href={`/businesses/${offer.business.slug}`} className="text-lg font-semibold">{offer.business.businessName}</Link>
          <p className="mt-1 text-sm">{offer.branch.branchName}</p>
          <p className="mt-2 text-sm text-muted-foreground">{address}</p>
          <div className="mt-3"><DirectionsLink latitude={offer.branch.latitude} longitude={offer.branch.longitude} /></div>
          <div className="mt-4 space-y-3">
            {session?.role === "customer" ? <FavoriteButton offerId={offer.id} initial={saved} /> : <Link className="text-sm font-semibold text-primary" href={`/login?next=/offers/${offer.slug}`}>Log in to save this offer</Link>}
            {session?.role === "customer" ? <ClaimButton offerId={offer.id} enabled={offer.openNow && offer.availability === "active"} initialCode={redemption?.redemptionCode} initialStatus={redemption?.status === "redeemed" ? "redeemed" : redemption ? "claimed" : null} /> : null}
            {session?.role === "customer" ? <ReportButton offerId={offer.id} /> : null}
          </div>
        </div>
        <section>
          <h2 className="font-semibold">Opening hours</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {Object.entries(offer.branch.openingHours).map(([day, hours]) => <li key={day} className="flex justify-between capitalize"><span>{day}</span><span>{hours.closed ? "Closed" : `${hours.open}–${hours.close}`}</span></li>)}
          </ul>
        </section>
      </aside>
      {related.length ? <section className="lg:col-span-2 space-y-4"><h2 className="display text-3xl">More from {offer.business.businessName}</h2><OfferGrid offers={related} /></section> : null}
    </article>
  );
}

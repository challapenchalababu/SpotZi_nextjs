import Image from "next/image";
import Link from "next/link";
import { DirectionsLink } from "@/components/customer/directions-link";
import { OfferPoster } from "@/components/customer/poster";
import { Badge } from "@/components/ui/primitives";
import { formatAddress, formatDate, formatDistance } from "@/lib/format";
import type { PublicOfferDTO } from "@/types/domain";

export function OfferCard({ offer }: { offer: PublicOfferDTO }) {
  const address = formatAddress(offer.branch.address);
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <Link href={`/offers/${offer.slug}`} className="block">
        <div className="relative aspect-[4/3] bg-muted">
          {offer.posterUrl ? (
            <Image src={offer.posterUrl} alt={`${offer.title} poster from ${offer.business.businessName}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
          ) : (
            <OfferPoster
              title={offer.title}
              businessName={offer.business.businessName}
              discountLabel={offer.discountLabel}
              validUntil={offer.validUntil}
              address={offer.branch.address.area}
              originalPrice={offer.originalPrice}
              discountedPrice={offer.discountedPrice}
              layout={offer.template?.layoutConfig}
              backgroundUrl={offer.template?.backgroundUrl}
            />
          )}
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge tone="accent">{offer.discountLabel}</Badge>
            {offer.distanceKm != null ? <Badge>{formatDistance(offer.distanceKm)}</Badge> : null}
          </div>
        </div>
        <div className="space-y-2 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{offer.business.businessName}</p>
          <h3 className="text-lg font-semibold leading-snug">{offer.title}</h3>
          <p className="text-sm text-muted-foreground">{address}</p>
          <p className="text-sm">{offer.availability === "scheduled" ? `Starts ${formatDate(offer.validFrom, offer.timezone)}` : offer.openNow ? "Available now" : offer.availability === "active" ? "Valid today, outside current hours" : `Until ${formatDate(offer.validUntil, offer.timezone)}`}</p>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <DirectionsLink latitude={offer.branch.latitude} longitude={offer.branch.longitude} />
      </div>
    </article>
  );
}

export function OfferGrid({ offers }: { offers: PublicOfferDTO[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {offers.map((offer) => <OfferCard key={offer.id} offer={offer} />)}
    </div>
  );
}

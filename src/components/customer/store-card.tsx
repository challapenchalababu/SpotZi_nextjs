import Image from "next/image";
import Link from "next/link";
import { DirectionsLink } from "@/components/customer/directions-link";
import { Badge } from "@/components/ui/primitives";
import { formatAddress, formatDistance } from "@/lib/format";
import type { PublicStoreDTO } from "@/types/domain";

export function StoreCard({ store }: { store: PublicStoreDTO }) {
  const address = formatAddress(store.address);
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <Link href={`/stores/${store.id}`} className="block">
        <div className="relative aspect-[4/3] bg-muted">
          {store.posterUrl ? (
            <Image
              src={store.posterUrl}
              alt={`${store.business.businessName} ${store.branchName}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-primary/10 p-6 text-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">{store.business.businessName}</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{store.branchName}</p>
              </div>
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {store.topDiscountLabel ? <Badge tone="accent">{store.topDiscountLabel}</Badge> : null}
            {store.distanceKm != null ? <Badge>{formatDistance(store.distanceKm)}</Badge> : null}
          </div>
        </div>
        <div className="space-y-2 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {store.business.categoryName || store.business.businessName}
          </p>
          <h3 className="text-lg font-semibold leading-snug">{store.business.businessName}</h3>
          <p className="text-sm font-medium">{store.branchName}</p>
          <p className="text-sm text-muted-foreground">{address}</p>
          <p className="text-sm">
            {store.offerCount} offer{store.offerCount === 1 ? "" : "s"}
            {store.itemCount ? ` · ${store.itemCount} product${store.itemCount === 1 ? "" : "s"}` : ""}
          </p>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <DirectionsLink latitude={store.latitude} longitude={store.longitude} />
      </div>
    </article>
  );
}

export function StoreGrid({ stores }: { stores: PublicStoreDTO[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stores.map((store) => (
        <StoreCard key={store.id} store={store} />
      ))}
    </div>
  );
}

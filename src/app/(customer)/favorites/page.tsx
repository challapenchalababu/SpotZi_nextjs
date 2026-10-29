import { redirect } from "next/navigation";
import { OfferGrid } from "@/components/customer/offer-card";
import { EmptyState } from "@/components/ui/primitives";
import { getSession } from "@/lib/session";
import { listFavorites } from "@/services/engagement.service";

export const metadata = { title: "Saved offers", robots: { index: false, follow: false } };

export default async function FavoritesPage() {
  const session = await getSession();
  if (!session || session.role !== "customer") redirect("/login?next=/favorites");
  const favorites = await listFavorites(session.id);
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="display text-4xl">Saved offers</h1>
      {favorites.length ? <OfferGrid offers={favorites.map((favorite) => favorite.offer)} /> : <EmptyState title="No saved offers" body="Save an offer from its page and it will stay in this list." />}
    </div>
  );
}

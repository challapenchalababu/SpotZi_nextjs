import { redirect } from "next/navigation";
import { StatGrid } from "@/components/dashboard/stats";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { ownerStats } from "@/services/admin.service";
import { listManagedOffers } from "@/services/offer.service";

export const metadata = { title: "Analytics" };

export default async function OwnerAnalyticsPage() {
  const session = await getSession();
  if (!session) redirect("/owner/login");
  const [stats, offers] = await Promise.all([
    ownerStats(session.id),
    listManagedOffers({ page: 1, limit: 10, ownerId: session.id }),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="display text-4xl">Analytics</h1>
      <StatGrid items={[
        { label: "Views", value: stats.views },
        { label: "Saves", value: stats.favorites },
        { label: "Redemptions", value: stats.redemptions },
        { label: "Active offers", value: stats.activeOffers },
      ]} />
      <table className="w-full text-left text-sm">
        <thead><tr className="text-muted-foreground"><th className="py-2">Offer</th><th>Views</th><th>Availability</th></tr></thead>
        <tbody>
          {offers.items.map((offer) => (
            <tr key={offer.id} className="border-t border-border"><td className="py-2"><Link href={`/owner/offers/${offer.id}`}>{offer.title}</Link></td><td>{offer.viewsCount}</td><td>{offer.availability}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

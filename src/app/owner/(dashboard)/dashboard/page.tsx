import Link from "next/link";
import { StatGrid } from "@/components/dashboard/stats";
import { Badge } from "@/components/ui/primitives";
import { formatDate } from "@/lib/format";
import { getSession } from "@/lib/session";
import { ownerStats } from "@/services/admin.service";
import { listManagedOffers } from "@/services/offer.service";
import { listReportsForOwner } from "@/services/engagement.service";
import { redirect } from "next/navigation";

export const metadata = { title: "Owner dashboard" };

export default async function OwnerDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/owner/login");
  const [stats, offers, reports] = await Promise.all([
    ownerStats(session.id),
    listManagedOffers({ page: 1, limit: 5, ownerId: session.id }),
    listReportsForOwner(session.id, 1, 5),
  ]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="display text-4xl">Dashboard</h1>
        <Link className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" href="/owner/offers/create">New offer</Link>
      </div>
      <StatGrid items={[
        { label: "Businesses", value: stats.businesses },
        { label: "Branches", value: stats.branches },
        { label: "Offers", value: stats.offers },
        { label: "Active", value: stats.activeOffers },
        { label: "Drafts", value: stats.draftOffers },
        { label: "Expired", value: stats.expiredOffers },
        { label: "Views", value: stats.views },
        { label: "Saves", value: stats.favorites },
        { label: "Redemptions", value: stats.redemptions },
        { label: "Open reports", value: stats.openReports },
      ]} />
      <section>
        <h2 className="text-xl font-semibold">Recent offers</h2>
        <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
          {offers.items.map((offer) => (
            <li key={offer.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <Link href={`/owner/offers/${offer.id}`} className="font-medium">{offer.title}</Link>
              <span className="flex items-center gap-2 text-sm"><Badge>{offer.availability}</Badge>{formatDate(offer.validUntil, offer.timezone)}</span>
            </li>
          ))}
          {offers.items.length === 0 ? <li className="px-4 py-6 text-sm text-muted-foreground">No offers yet.</li> : null}
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Recent reports</h2>
        <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
          {reports.items.map((report) => (
            <li key={report.id} className="px-4 py-3 text-sm">
              <span className="font-medium">{report.offerTitle}</span> · {report.reason} · {report.status}
            </li>
          ))}
          {reports.items.length === 0 ? <li className="px-4 py-6 text-sm text-muted-foreground">No reports on your offers.</li> : null}
        </ul>
      </section>
    </div>
  );
}

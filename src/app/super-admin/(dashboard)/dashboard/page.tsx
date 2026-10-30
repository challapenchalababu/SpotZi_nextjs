import Link from "next/link";
import { StatGrid } from "@/components/dashboard/stats";
import { formatDateTime } from "@/lib/format";
import { adminStats, recentRegistrations } from "@/services/admin.service";
import { listActivity } from "@/services/activity.service";
import { getSiteTrafficSummary } from "@/services/site-traffic.service";

export const metadata = { title: "Platform dashboard" };

export default async function AdminDashboardPage() {
  const [stats, recent, activity, traffic] = await Promise.all([
    adminStats(),
    recentRegistrations(6),
    listActivity(1, 6),
    getSiteTrafficSummary(7),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="display text-4xl">Platform</h1>
      <StatGrid items={[
        { label: "Customers", value: stats.customers, href: "/super-admin/customers" },
        { label: "Owners", value: stats.owners, href: "/super-admin/owners" },
        { label: "Businesses", value: stats.businesses, href: "/super-admin/businesses" },
        { label: "Branches", value: stats.branches, href: "/super-admin/branches" },
        { label: "Offers", value: stats.offers, href: "/super-admin/offers" },
        { label: "Active offers", value: stats.activeOffers },
        { label: "Expired offers", value: stats.expiredOffers },
        { label: "Redemptions", value: stats.redemptions },
        { label: "Open reports", value: stats.openReports },
      ]} />
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-xl font-semibold">Public site traffic</h2>
          <Link className="text-sm font-semibold text-primary" href="/super-admin/traffic">View details</Link>
        </div>
        <StatGrid
          items={[
            { label: "Website opens", value: traffic.totals.landing_view.hits, href: "/super-admin/traffic" },
            { label: "Find Offers clicks", value: traffic.totals.find_offers_click.hits, href: "/super-admin/traffic" },
            { label: "Offers page visits", value: traffic.totals.offers_page_view.hits, href: "/super-admin/traffic" },
            { label: "Business login visits", value: traffic.totals.business_login_view.hits, href: "/super-admin/traffic" },
          ]}
        />
      </section>
      <section>
        <h2 className="text-xl font-semibold">Recent registrations</h2>
        <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
          {recent.map((user) => <li key={user.id} className="flex justify-between px-4 py-3 text-sm"><Link href={`/super-admin/users/${user.id}`}>{user.name}</Link><span>{user.role} · {formatDateTime(user.createdAt)}</span></li>)}
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Recent activity</h2>
        <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
          {activity.items.map((item) => <li key={item.id} className="px-4 py-3 text-sm">{item.actorName || "System"} · {item.action} · {formatDateTime(item.createdAt)}</li>)}
        </ul>
      </section>
    </div>
  );
}

import Link from "next/link";
import { StatGrid } from "@/components/dashboard/stats";
import { formatDateTime } from "@/lib/format";
import { adminStats, recentRegistrations } from "@/services/admin.service";
import { listActivity } from "@/services/activity.service";

export const metadata = { title: "Platform dashboard" };

export default async function AdminDashboardPage() {
  const [stats, recent, activity] = await Promise.all([
    adminStats(),
    recentRegistrations(6),
    listActivity(1, 6),
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

import { StatGrid } from "@/components/dashboard/stats";
import { SITE_EVENT_LABELS, SITE_EVENTS } from "@/lib/site-events";
import { getSiteTrafficSummary } from "@/services/site-traffic.service";

export const metadata = { title: "Site traffic" };

export default async function AdminTrafficPage() {
  const summary = await getSiteTrafficSummary(14);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="display text-4xl">Site traffic</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Anonymous visit counts for the public site — similar to a simple analytics summary. Each browser gets one visitor id in local storage; no names, emails, or GPS coordinates are stored with these events.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">All time</h2>
        <StatGrid
          items={SITE_EVENTS.map((event) => ({
            label: `${SITE_EVENT_LABELS[event]} · hits`,
            value: summary.totals[event].hits,
          }))}
        />
        <StatGrid
          items={SITE_EVENTS.map((event) => ({
            label: `${SITE_EVENT_LABELS[event]} · unique browsers`,
            value: summary.totals[event].uniqueVisitors,
          }))}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Today</h2>
        <StatGrid
          items={SITE_EVENTS.map((event) => ({
            label: SITE_EVENT_LABELS[event],
            value: `${summary.today[event].hits} hits / ${summary.today[event].uniqueVisitors} unique`,
          }))}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Last 14 days</h2>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-4 py-3">Day</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Hits</th>
                <th className="px-4 py-3">Unique browsers</th>
              </tr>
            </thead>
            <tbody>
              {summary.daily.length ? (
                summary.daily.map((row) => (
                  <tr key={`${row.day}-${row.event}`} className="border-t border-border">
                    <td className="px-4 py-3">{row.day}</td>
                    <td className="px-4 py-3">{SITE_EVENT_LABELS[row.event]}</td>
                    <td className="px-4 py-3">{row.hits}</td>
                    <td className="px-4 py-3">{row.uniqueVisitors}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={4}>
                    No traffic recorded yet. Open the landing page, Find Offers, Offers, or Business login to start collecting counts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

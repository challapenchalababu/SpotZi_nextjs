import { fieldClass, Pagination, pageQuery } from "@/components/ui/primitives";
import { firstParam } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import { listActivity } from "@/services/activity.service";

export const metadata = { title: "Activity logs" };

export default async function ActivityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const q = firstParam(params.q);
  const page = Number(firstParam(params.page) || 1);
  const result = await listActivity(page, 30, q);
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">Activity</h1>
      <form action="/super-admin/activity-logs"><input className={fieldClass} name="q" defaultValue={q} placeholder="Action or resource" aria-label="Search activity" /><button className="ml-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Search</button></form>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground"><tr><th className="px-4 py-3">When</th><th>Actor</th><th>Action</th><th>Resource</th></tr></thead>
          <tbody>
            {result.items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{formatDateTime(item.createdAt)}</td>
                <td>{item.actorName || "System"}</td>
                <td>{item.action}</td>
                <td>{item.resourceType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(next) => pageQuery("/super-admin/activity-logs", { q }, next)} />
    </div>
  );
}

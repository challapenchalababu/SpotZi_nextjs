import { redirect } from "next/navigation";
import { Badge, Pagination, pageQuery } from "@/components/ui/primitives";
import { firstParam } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import { getSession } from "@/lib/session";
import { listReportsForOwner } from "@/services/engagement.service";

export const metadata = { title: "Reports" };

export default async function OwnerReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getSession();
  if (!session) redirect("/owner/login");
  const page = Number(firstParam((await searchParams).page) || 1);
  const result = await listReportsForOwner(session.id, page, 20);
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">Reports</h1>
      <p className="text-sm text-muted-foreground">Reports are read-only for owners. A super admin records the resolution.</p>
      {result.items.map((report) => (
        <article key={report.id} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between"><p className="font-semibold">{report.offerTitle}</p><Badge>{report.status}</Badge></div>
          <p className="mt-2 text-sm">{report.reason}: {report.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(report.createdAt)}</p>
        </article>
      ))}
      {result.items.length === 0 ? <p className="text-sm text-muted-foreground">No reports on your offers.</p> : null}
      <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(next) => pageQuery("/owner/reports", {}, next)} />
    </div>
  );
}

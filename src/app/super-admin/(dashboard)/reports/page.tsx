import { ReportStatusForm } from "@/components/forms/report-form";
import { Badge, fieldClass, Pagination, pageQuery } from "@/components/ui/primitives";
import { firstParam } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import { listReportsForAdmin } from "@/services/engagement.service";

export const metadata = { title: "Reports" };

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const status = firstParam(params.status) || "all";
  const page = Number(firstParam(params.page) || 1);
  const result = await listReportsForAdmin(page, 20, status);
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">Reports</h1>
      <form action="/super-admin/reports">
        <select className={fieldClass} name="status" defaultValue={status} aria-label="Report status">
          {["all", "open", "reviewing", "resolved", "dismissed"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <button className="ml-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Filter</button>
      </form>
      {result.items.map((report) => (
        <article key={report.id} className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between"><p className="font-semibold">{report.offerTitle || "Offer"} · {report.businessName}</p><Badge>{report.status}</Badge></div>
          <p className="text-sm">{report.reason}: {report.description}</p>
          <p className="text-xs text-muted-foreground">{report.userName || "Customer"} · {formatDateTime(report.createdAt)}</p>
          {report.resolutionNote ? <p className="text-sm">Note: {report.resolutionNote}</p> : null}
          <ReportStatusForm reportId={report.id} status={report.status} />
        </article>
      ))}
      <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(next) => pageQuery("/super-admin/reports", { status }, next)} />
    </div>
  );
}

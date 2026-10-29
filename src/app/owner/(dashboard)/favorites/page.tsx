import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { listOwnerSaveCounts } from "@/services/engagement.service";

export const metadata = { title: "Saved offers" };

export default async function OwnerFavoritesPage() {
  const session = await getSession();
  if (!session) redirect("/owner/login");
  const rows = await listOwnerSaveCounts(session.id);
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">Customer saves</h1>
      <p className="text-sm text-muted-foreground">Counts only. Customer names are not shown here.</p>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground"><tr><th className="px-4 py-3">Offer</th><th>Status</th><th>Views</th><th>Saves</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3"><Link href={`/owner/offers/${row.id}`}>{row.title}</Link></td>
                <td>{row.status}</td>
                <td>{row.views}</td>
                <td>{row.saves}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">Publish an offer before customers can save it.</p> : null}
      </div>
    </div>
  );
}

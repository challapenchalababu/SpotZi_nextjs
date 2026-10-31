import Link from "next/link";
import { redirect } from "next/navigation";
import { ConfirmButton } from "@/components/forms/auth-forms";
import { Badge, fieldClass, pageQuery, Pagination } from "@/components/ui/primitives";
import { firstParam } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { getSession } from "@/lib/session";
import { listManagedOffers } from "@/services/offer.service";

export const metadata = { title: "Offers" };

export default async function OwnerOffersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getSession();
  if (!session) redirect("/owner/login");
  const params = await searchParams;
  const q = firstParam(params.q);
  const status = firstParam(params.status) || "all";
  const page = Number(firstParam(params.page) || 1);
  const offers = await listManagedOffers({ page, limit: 20, ownerId: session.id, q, status });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display text-4xl">Today&apos;s offers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create a poster template with prices, expiry dates, and the branch location. Edit or delete an offer from this list.</p>
        </div>
        <Link className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" href="/owner/offers/create">Create offer</Link>
      </div>
      <form className="flex flex-wrap gap-2" action="/owner/offers">
        <input className={fieldClass} name="q" defaultValue={q} placeholder="Search title" aria-label="Search offers" />
        <select className={fieldClass} name="status" defaultValue={status} aria-label="Status">
          {["all", "draft", "published", "paused", "expired", "archived"].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Filter</button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground"><tr><th className="px-4 py-3">Title</th><th>Place</th><th>Price</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {offers.items.map((offer) => (
              <tr key={offer.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3"><Link href={`/owner/offers/${offer.id}`}>{offer.title}</Link></td>
                <td>{offer.branch.branchName}</td>
                <td>{offer.discountLabel}</td>
                <td>{formatDate(offer.validUntil, offer.timezone)}</td>
                <td><Badge>{offer.availability}</Badge></td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link className="rounded-full border border-border px-3 py-1 text-sm" href={`/owner/offers/${offer.id}/edit`}>Edit</Link>
                    <ConfirmButton endpoint={`/api/offers/${offer.id}`} method="DELETE" label="Delete" confirm="Permanently delete this offer from the database? Related saves, claims, and reports for this offer are removed too. This cannot be undone." variant="danger" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={offers.page} totalPages={offers.totalPages} hrefFor={(next) => pageQuery("/owner/offers", { q, status }, next)} />
    </div>
  );
}

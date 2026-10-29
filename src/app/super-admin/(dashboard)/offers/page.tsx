import { ConfirmButton } from "@/components/forms/auth-forms";
import { Badge, fieldClass, Pagination, pageQuery } from "@/components/ui/primitives";
import { firstParam } from "@/lib/api-client";
import { listManagedOffers } from "@/services/offer.service";
import { listCategories } from "@/services/catalog.service";

export const metadata = { title: "All offers" };

export default async function AdminOffersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const q = firstParam(params.q);
  const status = firstParam(params.status) || "all";
  const category = firstParam(params.category);
  const page = Number(firstParam(params.page) || 1);
  const [offers, categories] = await Promise.all([
    listManagedOffers({ page, limit: 20, q, status, category }),
    listCategories(true),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">Offers</h1>
      <form className="flex flex-wrap gap-2" action="/super-admin/offers">
        <input className={fieldClass} name="q" defaultValue={q} placeholder="Title" aria-label="Search offers" />
        <select className={fieldClass} name="status" defaultValue={status} aria-label="Status">{["all", "draft", "published", "paused", "expired", "archived"].map((item) => <option key={item}>{item}</option>)}</select>
        <select className={fieldClass} name="category" defaultValue={category || ""} aria-label="Category"><option value="">All categories</option>{categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select>
        <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Filter</button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground"><tr><th className="px-4 py-3">Offer</th><th>Business</th><th>Availability</th><th>Poster</th><th></th></tr></thead>
          <tbody>
            {offers.items.map((offer) => (
              <tr key={offer.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{offer.title}</td>
                <td>{offer.business.businessName}</td>
                <td><Badge>{offer.availability}</Badge></td>
                <td>{offer.posterUrl ? "Uploaded" : "Template"}</td>
                <td className="space-x-2 px-4 py-3">
                  {offer.status === "published" ? <ConfirmButton endpoint={`/api/admin/offers/${offer.id}`} body={{ status: "paused" }} label="Pause" confirm="Pause this offer?" /> : null}
                  {offer.status !== "archived" ? <ConfirmButton endpoint={`/api/admin/offers/${offer.id}`} body={{ status: "archived" }} label="Archive" confirm="Archive this offer? It leaves public listings." variant="danger" /> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={offers.page} totalPages={offers.totalPages} hrefFor={(next) => pageQuery("/super-admin/offers", { q, status, category }, next)} />
    </div>
  );
}

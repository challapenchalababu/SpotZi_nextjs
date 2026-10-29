import Link from "next/link";
import { ConfirmButton } from "@/components/forms/auth-forms";
import { Badge, fieldClass, Pagination, pageQuery } from "@/components/ui/primitives";
import { firstParam } from "@/lib/api-client";
import { listAdminBusinesses } from "@/services/business.service";
import { listCategories } from "@/services/catalog.service";

export const metadata = { title: "All businesses" };

export default async function AdminBusinessesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const q = firstParam(params.q);
  const category = firstParam(params.category);
  const city = firstParam(params.city);
  const active = firstParam(params.isActive);
  const page = Number(firstParam(params.page) || 1);
  const [result, categories] = await Promise.all([
    listAdminBusinesses({ page, limit: 20, q, category, city, isActive: active === "true" ? true : active === "false" ? false : undefined }),
    listCategories(true),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">Businesses</h1>
      <form className="grid gap-2 md:grid-cols-4" action="/super-admin/businesses">
        <input className={fieldClass} name="q" defaultValue={q} placeholder="Name" aria-label="Search businesses" />
        <select className={fieldClass} name="category" defaultValue={category || ""} aria-label="Category"><option value="">All categories</option>{categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select>
        <input className={fieldClass} name="city" defaultValue={city} placeholder="City" aria-label="City" />
        <select className={fieldClass} name="isActive" defaultValue={active || ""} aria-label="Status"><option value="">Any status</option><option value="true">Enabled</option><option value="false">Disabled</option></select>
        <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Filter</button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground"><tr><th className="px-4 py-3">Business</th><th>Category</th><th>Branches</th><th>Offers</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {result.items.map((business) => (
              <tr key={business.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3"><Link href={`/super-admin/businesses/${business.id}`}>{business.businessName}</Link></td>
                <td>{business.categoryName || business.category}</td>
                <td>{business.branchCount ?? 0}</td>
                <td>{business.offerCount ?? 0}</td>
                <td><Badge tone={business.isActive ? "success" : "warning"}>{business.isActive ? "Enabled" : "Disabled"}</Badge></td>
                <td className="px-4"><ConfirmButton endpoint={`/api/admin/businesses/${business.id}`} body={{ isActive: !business.isActive }} label={business.isActive ? "Disable" : "Enable"} confirm="Change whether this business appears in public listings?" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(next) => pageQuery("/super-admin/businesses", { q, category, city, isActive: active }, next)} />
    </div>
  );
}

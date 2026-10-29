import Link from "next/link";
import { Badge } from "@/components/ui/primitives";
import { listCategories } from "@/services/catalog.service";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await listCategories(true);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="display text-4xl">Categories</h1>
        <Link className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" href="/super-admin/categories/new">New category</Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground"><tr><th className="px-4 py-3">Name</th><th>Slug</th><th>Status</th></tr></thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3"><Link href={`/super-admin/categories/${category.id}`}>{category.name}</Link></td>
                <td>{category.slug}</td>
                <td><Badge tone={category.isActive ? "success" : "warning"}>{category.isActive ? "Active" : "Inactive"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import Link from "next/link";
import { CategoryIcon } from "@/components/customer/category-icon";
import { SetupNotice } from "@/components/seo";
import { loadPage } from "@/lib/page";
import { listCategories } from "@/services/catalog.service";

export const metadata = { title: "Categories", description: "Browse local offers by business category." };

export default async function CategoriesPage() {
  const loaded = await loadPage(() => listCategories(false));
  if (!loaded.ok) return <div className="mx-auto max-w-6xl px-4 py-8"><SetupNotice message={loaded.message} /></div>;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="display text-4xl">Categories</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loaded.data.map((category) => (
          <Link key={category.id} href={`/categories/${category.slug}`} className="rounded-2xl border border-border bg-card p-5">
            <CategoryIcon name={category.icon} className="size-6 text-primary" />
            <h2 className="mt-3 text-xl font-semibold">{category.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

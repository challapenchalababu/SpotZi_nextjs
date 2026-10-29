import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/forms/catalog-forms";
import { listCategories } from "@/services/catalog.service";

export const metadata = { title: "Edit category" };

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = (await listCategories(true)).find((item) => item.id === id);
  if (!category) notFound();
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">Edit {category.name}</h1>
      <CategoryForm category={category} />
    </div>
  );
}

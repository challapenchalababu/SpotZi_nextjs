import { CategoryForm } from "@/components/forms/catalog-forms";

export const metadata = { title: "New category" };

export default function NewCategoryPage() {
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">New category</h1>
      <CategoryForm />
    </div>
  );
}

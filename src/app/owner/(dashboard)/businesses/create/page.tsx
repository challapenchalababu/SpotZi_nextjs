import { BusinessForm } from "@/components/forms/business-form";
import { listCategories } from "@/services/catalog.service";

export const metadata = { title: "Create business" };

export default async function CreateBusinessPage() {
  const categories = await listCategories(true);
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">Create a business</h1>
      <BusinessForm categories={categories} />
    </div>
  );
}

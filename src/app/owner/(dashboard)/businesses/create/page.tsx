import { BusinessForm } from "@/components/forms/business-form";
import { listCategories } from "@/services/catalog.service";

export const metadata = { title: "Create business" };

export default async function CreateBusinessPage() {
  const categories = await listCategories(true);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="display text-4xl">Create a business</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          After you save, you&apos;ll add a branch, then create today&apos;s offer.
        </p>
      </div>
      <BusinessForm categories={categories} />
    </div>
  );
}

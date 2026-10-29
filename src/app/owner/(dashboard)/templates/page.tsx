import Link from "next/link";
import { OfferPoster } from "@/components/customer/poster";
import { listTemplates } from "@/services/catalog.service";

export const metadata = { title: "Templates" };

export default async function OwnerTemplatesPage() {
  const templates = await listTemplates(false);
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">Templates</h1>
      <p className="text-sm text-muted-foreground">Choose a layout, then fill in the offer. Super admins create the reusable templates.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {templates.map((template) => (
          <Link key={template.id} href={`/owner/templates/${template.id}`} className="overflow-hidden rounded-2xl border border-border bg-card">
            <OfferPoster title={template.name} businessName="Your business" discountLabel="Preview" layout={template.layoutConfig} backgroundUrl={template.backgroundUrl} className="min-h-48" />
            <p className="px-4 py-3 font-medium">{template.name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

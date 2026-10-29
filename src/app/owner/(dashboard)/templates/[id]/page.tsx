import Link from "next/link";
import { notFound } from "next/navigation";
import { OfferPoster } from "@/components/customer/poster";
import { getTemplate } from "@/services/catalog.service";

export const metadata = { title: "Template preview" };

export default async function OwnerTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const template = await getTemplate((await params).id).catch(() => null);
  if (!template) notFound();
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">{template.name}</h1>
      <OfferPoster title="Lunch special" businessName="Your business" discountLabel="20% off" validUntil={new Date().toISOString()} address="Your branch address" originalPrice={400} discountedPrice={320} layout={template.layoutConfig} backgroundUrl={template.backgroundUrl} className="min-h-80 max-w-xl" />
      <Link className="inline-block rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" href={`/owner/offers/create?template=${template.id}`}>Use this template</Link>
    </div>
  );
}

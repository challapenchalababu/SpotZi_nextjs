import { OfferWizard } from "@/components/forms/offer-wizard";
import { firstParam } from "@/lib/api-client";

export const metadata = { title: "Create offer" };

export default async function CreateOfferPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const templateId = firstParam((await searchParams).template);
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">Create today&apos;s offer</h1>
      <p className="text-sm text-muted-foreground">Choose the branch location, a poster template, the offer prices, and the dates it expires. Publishing makes it visible to customers near that branch.</p>
      <OfferWizard templateId={templateId || undefined} />
    </div>
  );
}

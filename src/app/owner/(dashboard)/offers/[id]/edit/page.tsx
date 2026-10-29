import { notFound } from "next/navigation";
import { OfferEditForm } from "@/components/forms/offer-edit-form";
import { getSession } from "@/lib/session";
import { listBranchesForOwner, listOwnerBusinesses } from "@/services/business.service";
import { listTemplates } from "@/services/catalog.service";
import { getManagedOffer } from "@/services/offer.service";

export const metadata = { title: "Edit offer" };

export default async function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) notFound();
  const { id } = await params;
  const [offer, businesses, branches, templates] = await Promise.all([
    getManagedOffer(id, session.id).catch(() => null),
    listOwnerBusinesses(session.id),
    listBranchesForOwner(session.id),
    listTemplates(true),
  ]);
  if (!offer) notFound();
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">Edit offer</h1>
      <OfferEditForm offer={offer} businesses={businesses} branches={branches} templates={templates} />
    </div>
  );
}

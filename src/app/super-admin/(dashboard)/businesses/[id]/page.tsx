import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/forms/auth-forms";
import { previewBusinessById } from "@/data/preview-store";
import { formatAddress } from "@/lib/format";
import { isPreviewMode } from "@/lib/env";
import { BusinessModel } from "@/models";
import { connectDB } from "@/lib/db";
import { listBranchesForOwner } from "@/services/business.service";
import { listManagedOffers } from "@/services/offer.service";

export const metadata = { title: "Business" };

export default async function AdminBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isPreviewMode()) {
    const preview = previewBusinessById(id);
    if (!preview) notFound();
    return (
      <div className="space-y-6">
        <h1 className="display text-4xl">{preview.business.businessName}</h1>
        <p className="max-w-2xl">{preview.business.description}</p>
        <section>
          <h2 className="text-xl font-semibold">Branches</h2>
          <ul className="mt-2 space-y-2 text-sm">{preview.branches.map((branch) => <li key={branch.id}>{branch.branchName} · {formatAddress(branch.address)} · {branch.isActive ? "Enabled" : "Disabled"}</li>)}</ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Offers</h2>
          <ul className="mt-2 space-y-2 text-sm">{preview.offers.map((offer) => <li key={offer.id}><Link href="/super-admin/offers">{offer.title}</Link> · {offer.availability}</li>)}</ul>
        </section>
      </div>
    );
  }
  await connectDB().catch(() => notFound());
  const business = await BusinessModel.findById(id).lean().catch(() => null);
  if (!business) notFound();
  const [branches, offers] = await Promise.all([
    listBranchesForOwner(String(business.ownerId), String(business._id)),
    listManagedOffers({ page: 1, limit: 20, ownerId: String(business.ownerId) }),
  ]);
  const related = offers.items.filter((offer) => offer.businessId === String(business._id));
  return (
    <div className="space-y-6">
      <h1 className="display text-4xl">{business.businessName}</h1>
      <p className="max-w-2xl">{business.description}</p>
      <ConfirmButton endpoint={`/api/admin/businesses/${business._id}`} body={{ isActive: !business.isActive }} label={business.isActive ? "Disable business" : "Enable business"} confirm="Change this business status?" />
      <section>
        <h2 className="text-xl font-semibold">Branches</h2>
        <ul className="mt-2 space-y-2 text-sm">{branches.map((branch) => <li key={branch.id}>{branch.branchName} · {formatAddress(branch.address)} · {branch.isActive ? "Enabled" : "Disabled"}</li>)}</ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Offers</h2>
        <ul className="mt-2 space-y-2 text-sm">{related.map((offer) => <li key={offer.id}><Link href={`/super-admin/offers`}>{offer.title}</Link> · {offer.availability}</li>)}</ul>
      </section>
    </div>
  );
}

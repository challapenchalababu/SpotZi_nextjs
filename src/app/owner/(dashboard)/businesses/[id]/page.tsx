import Link from "next/link";
import { notFound } from "next/navigation";
import { BusinessForm } from "@/components/forms/business-form";
import { getSession } from "@/lib/session";
import { getBusinessForOwner, listBranchesForOwner } from "@/services/business.service";
import { listCategories } from "@/services/catalog.service";
import { formatAddress } from "@/lib/format";

export const metadata = { title: "Edit business" };

export default async function OwnerBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) notFound();
  const { id } = await params;
  const [business, categories, branches] = await Promise.all([
    getBusinessForOwner(session.id, id).catch(() => null),
    listCategories(true),
    listBranchesForOwner(session.id, id).catch(() => []),
  ]);
  if (!business) notFound();
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="display text-4xl">{business.businessName}</h1>
        <Link href={`/businesses/${business.slug}`} className="text-sm font-semibold text-primary">Public page</Link>
      </div>
      <BusinessForm categories={categories} business={business} />
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Branches</h2>
          <Link href={`/owner/branches/create`} className="text-sm font-semibold text-primary">Add branch</Link>
        </div>
        <ul className="mt-3 space-y-2">
          {branches.map((branch) => <li key={branch.id}><Link href={`/owner/branches/${branch.id}/edit`}>{branch.branchName}</Link> · {formatAddress(branch.address)}</li>)}
          {branches.length === 0 ? <li className="text-sm text-muted-foreground">No branches yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}

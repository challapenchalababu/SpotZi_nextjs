import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/forms/auth-forms";
import { Badge } from "@/components/ui/primitives";
import { formatDate } from "@/lib/format";
import { getSession } from "@/lib/session";
import { getManagedOffer } from "@/services/offer.service";

export const metadata = { title: "Offer performance" };

export default async function OwnerOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) notFound();
  const offer = await getManagedOffer((await params).id, session.id).catch(() => null);
  if (!offer) notFound();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-4xl">{offer.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-full border border-border px-4 py-2 text-sm" href={`/owner/offers/${offer.id}/edit`}>Edit</Link>
          <Link className="rounded-full border border-border px-4 py-2 text-sm" href={`/offers/${offer.slug}`}>Public page</Link>
        </div>
      </div>
      <Badge>{offer.availability}</Badge>
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Views", offer.viewsCount],
          ["Saves", offer.favoriteCount ?? 0],
          ["Redemptions", offer.redemptionCount ?? 0],
          ["Limit", offer.redemptionLimit ?? "None"],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{value}</p></div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{offer.business.businessName} · {offer.branch.branchName} · {formatDate(offer.validFrom, offer.timezone)} – {formatDate(offer.validUntil, offer.timezone)}</p>
      <div className="flex flex-wrap gap-2">
        {offer.status !== "published" ? <ConfirmButton endpoint={`/api/offers/${offer.id}`} body={{ status: "published" }} label="Publish" confirm="Publish this offer if its dates and terms are ready." /> : null}
        {offer.status === "published" ? <ConfirmButton endpoint={`/api/offers/${offer.id}`} body={{ status: "paused" }} label="Pause" confirm="Paused offers disappear from public listings." /> : null}
        {offer.status !== "archived" ? <ConfirmButton endpoint={`/api/offers/${offer.id}`} method="DELETE" label="Archive" confirm="Archived offers stay in your history and leave public listings." variant="danger" /> : null}
      </div>
    </div>
  );
}

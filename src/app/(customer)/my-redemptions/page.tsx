import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/format";
import { getSession } from "@/lib/session";
import { listRedemptionsForUser } from "@/services/engagement.service";
import Link from "next/link";

export const metadata = { title: "My redemptions", robots: { index: false, follow: false } };

export default async function RedemptionsPage() {
  const session = await getSession();
  if (!session || session.role !== "customer") redirect("/login?next=/my-redemptions");
  const items = await listRedemptionsForUser(session.id);
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <h1 className="display text-4xl">My redemptions</h1>
      {items.length === 0 ? <p className="text-muted-foreground">Claimed offers will appear here with their codes.</p> : null}
      {items.map((item) => (
        <article key={item.id} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <Link href={`/offers/${item.offerSlug}`} className="font-semibold">{item.offerTitle}</Link>
            <Badge>{item.status}</Badge>
          </div>
          <p className="mt-2 font-mono text-lg">{item.redemptionCode}</p>
          <p className="text-sm text-muted-foreground">Unique to your account. Show this code at the shop.</p>
          <p className="text-sm text-muted-foreground">{item.businessName} · {item.branchName}</p>
          <p className="text-sm text-muted-foreground">Claimed {formatDateTime(item.claimedAt)}{item.redeemedAt ? ` · Redeemed ${formatDateTime(item.redeemedAt)}` : ""}</p>
        </article>
      ))}
    </div>
  );
}

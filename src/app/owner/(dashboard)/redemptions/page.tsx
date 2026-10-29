import { redirect } from "next/navigation";
import { VerifyRedemption } from "@/components/dashboard/verify-redemption";
import { ConfirmButton } from "@/components/forms/auth-forms";
import { Badge, Pagination, pageQuery } from "@/components/ui/primitives";
import { firstParam } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import { getSession } from "@/lib/session";
import { listRedemptionsForOwner } from "@/services/engagement.service";

export const metadata = { title: "Redemptions" };

export default async function OwnerRedemptionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getSession();
  if (!session) redirect("/owner/login");
  const page = Number(firstParam((await searchParams).page) || 1);
  const result = await listRedemptionsForOwner(session.id, page, 20);
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">Redemptions</h1>
      <VerifyRedemption />
      <div className="space-y-3">
        {result.items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{item.offerTitle}</p>
              <Badge>{item.status}</Badge>
            </div>
            <p className="mt-1 font-mono">{item.redemptionCode}</p>
            <p className="text-sm text-muted-foreground">{item.customerName || "Customer"} · {item.branchName} · {formatDateTime(item.claimedAt)}</p>
            {item.status === "claimed" ? (
              <div className="mt-3 flex gap-2">
                <ConfirmButton endpoint={`/api/redemptions/${item.id}`} body={{ status: "redeemed" }} label="Mark redeemed" confirm="Confirm this code has been used in the shop." />
                <ConfirmButton endpoint={`/api/redemptions/${item.id}`} body={{ status: "cancelled" }} label="Cancel" confirm="Cancel this claim so it no longer counts toward the limit." variant="danger" />
              </div>
            ) : null}
          </article>
        ))}
        {result.items.length === 0 ? <p className="text-sm text-muted-foreground">No customers have claimed an offer yet.</p> : null}
      </div>
      <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(next) => pageQuery("/owner/redemptions", {}, next)} />
    </div>
  );
}

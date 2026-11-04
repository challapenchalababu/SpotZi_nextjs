import { ReviewModerationActions } from "@/components/dashboard/review-moderation";
import { Badge, fieldClass, Pagination, pageQuery } from "@/components/ui/primitives";
import { firstParam } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import { listReviewsForAdmin } from "@/services/review.service";

export const metadata = { title: "Reviews" };

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = firstParam(params.status) || "visible";
  const targetType = firstParam(params.targetType) || "all";
  const q = firstParam(params.q) || "";
  const page = Number(firstParam(params.page) || 1);
  const result = await listReviewsForAdmin({
    page,
    limit: 20,
    status,
    targetType: targetType === "all" ? undefined : targetType,
    q: q || undefined,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="display text-4xl">Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">Remove or permanently delete customer store and offer reviews.</p>
      </div>
      <form className="flex flex-wrap gap-2" action="/super-admin/reviews">
        <input className={fieldClass} name="q" defaultValue={q} placeholder="Search review text" aria-label="Search reviews" />
        <select className={fieldClass} name="status" defaultValue={status} aria-label="Status">
          {["all", "visible", "removed"].map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select className={fieldClass} name="targetType" defaultValue={targetType} aria-label="Target">
          {["all", "store", "offer"].map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Filter</button>
      </form>

      {result.items.map((review) => (
        <article key={review.id} className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold">
                {review.targetType === "offer" ? review.offerTitle || "Offer" : review.branchName || "Store"}
                {review.businessName ? ` · ${review.businessName}` : ""}
              </p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{review.targetType} review</p>
            </div>
            <Badge tone={review.status === "visible" ? "success" : "warning"}>{review.status}</Badge>
          </div>
          <p className="text-sm font-medium">{review.rating}/5 stars</p>
          <p className="whitespace-pre-wrap text-sm">{review.comment}</p>
          <p className="text-xs text-muted-foreground">
            {review.userName || "Customer"} · {formatDateTime(review.createdAt)}
          </p>
          <ReviewModerationActions reviewId={review.id} status={review.status} />
        </article>
      ))}

      {result.items.length === 0 ? <p className="text-sm text-muted-foreground">No reviews match this filter.</p> : null}
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        hrefFor={(next) => pageQuery("/super-admin/reviews", { q, status, targetType }, next)}
      />
    </div>
  );
}
